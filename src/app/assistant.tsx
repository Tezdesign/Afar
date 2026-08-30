import { useAuth, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import {
  Call,
  CallingState,
  StreamCall,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-native-sdk";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getApiBaseUrl } from "@/lib/apiBaseUrl";
import { assistantCallId, ASSISTANT_CALL_TYPE, useStreamVideoClient } from "@/lib/stream";

const CARD_SHADOW = {
  shadowColor: "#17181F",
  shadowOpacity: 0.08,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8,
  elevation: 2,
} as const;

/** Clerk user id of the agent joined from the separate Vision Agents worker — see agent/agent.py. */
const AGENT_USER_ID = "trip-assistant";

type CallUIState =
  | { kind: "idle" }
  | { kind: "connecting" }
  | { kind: "joined" }
  | { kind: "error"; message: string }
  | { kind: "ended" };

function stateMessage(state: CallUIState): string {
  switch (state.kind) {
    case "idle":
      return "Ask a question by text or voice about your trip — chat is coming soon.";
    case "connecting":
      return "Connecting…";
    case "error":
      return state.message;
    case "ended":
      return "Call ended. Tap the mic to talk again.";
    case "joined":
      return "";
  }
}

// Rendered inside <StreamCall> — needs that context for useCall()/useCallStateHooks().
function CallPanel({ onEnd }: { onEnd: () => void }) {
  const call = useCall();
  const { useMicrophoneState, useParticipants } = useCallStateHooks();
  const { status: micStatus, isSpeakingWhileMuted } = useMicrophoneState();
  const participants = useParticipants();

  const isMuted = micStatus === "disabled";
  const agentJoined = participants.some((p) => p.userId === AGENT_USER_ID);

  return (
    <View className="gap-sm">
      <View className="items-center mb-sm">
        <Text className="text-body text-ink opacity-60 text-center">
          {agentJoined
            ? "Talking with your trip assistant"
            : "Connecting you with the trip assistant…"}
        </Text>
        {isSpeakingWhileMuted && (
          <Text className="text-[12px] text-ember-500 font-jakarta-bold mt-xs">
            You&apos;re muted
          </Text>
        )}
      </View>

      <View className="flex-row items-center justify-center gap-lg">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isMuted ? "Unmute" : "Mute"}
          onPress={() => call?.microphone.toggle()}
          className={`w-14 h-14 items-center justify-center rounded-full ${
            isMuted ? "bg-cloud" : "bg-white"
          }`}
          style={CARD_SHADOW}
        >
          <Ionicons
            name={isMuted ? "mic-off" : "mic"}
            size={22}
            color="#17181F"
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="End call"
          onPress={onEnd}
          className="w-14 h-14 items-center justify-center rounded-full bg-ember-500"
        >
          <Ionicons name="call" size={22} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

export default function Assistant() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId, getToken } = useAuth();
  const { user } = useUser();
  const videoClient = useStreamVideoClient();

  const [call, setCall] = useState<Call | null>(null);
  const [uiState, setUiState] = useState<CallUIState>({ kind: "idle" });
  const agentSessionId = useRef<string | null>(null);

  // Leave the call if this screen unmounts while still connected.
  useEffect(() => {
    return () => {
      if (call && call.state.callingState !== CallingState.LEFT) {
        call.leave().catch((err) => console.error(err));
      }
    };
  }, [call]);

  const startCall = useCallback(async () => {
    if (!videoClient || !userId) {
      setUiState({
        kind: "error",
        message: "Not signed in yet — try again in a moment.",
      });
      return;
    }
    setUiState({ kind: "connecting" });

    // Best-effort: ask the separate trip-assistant agent (agent/agent.py) to
    // join too. A human can still talk even if this fails — CallPanel's
    // "Connecting you with the trip assistant…" copy covers that gap.
    (async () => {
      try {
        const clerkToken = await getToken();
        const res = await fetch(`${getApiBaseUrl()}/api/assistant-call`, {
          method: "POST",
          headers: clerkToken ? { Authorization: `Bearer ${clerkToken}` } : {},
        });
        const data = (await res.json()) as { sessionId?: string };
        if (data.sessionId) agentSessionId.current = data.sessionId;
      } catch (err) {
        console.error("Could not reach the trip assistant agent", err);
      }
    })();

    try {
      const newCall = videoClient.call(
        ASSISTANT_CALL_TYPE,
        assistantCallId(userId),
        { reuseInstance: true },
      );
      // Audio-only: disable the camera *before* joining, so the "default"
      // call type never tries to publish it — join() brings up devices per
      // the call type's defaults, and disabling after join is too late to
      // avoid the camera permission prompt.
      await newCall.camera.disable().catch(() => {});
      await newCall.join({ create: true });
      await newCall.microphone.enable().catch(() => {});
      setCall(newCall);
      setUiState({ kind: "joined" });
    } catch (err) {
      console.error("Failed to join call", err);
      setUiState({
        kind: "error",
        message: "Couldn't connect to the trip assistant.",
      });
    }
  }, [videoClient, userId, getToken]);

  const endCall = useCallback(async () => {
    if (call && call.state.callingState !== CallingState.LEFT) {
      await call.leave().catch((err) => console.error(err));
    }
    setCall(null);
    setUiState({ kind: "ended" });

    const sessionId = agentSessionId.current;
    agentSessionId.current = null;
    if (sessionId) {
      const clerkToken = await getToken();
      fetch(`${getApiBaseUrl()}/api/assistant-call`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(clerkToken ? { Authorization: `Bearer ${clerkToken}` } : {}),
        },
        body: JSON.stringify({ sessionId }),
      }).catch((err) => console.error(err));
    }
  }, [call, getToken]);

  const onMicPress = () => {
    if (uiState.kind === "connecting" || call) return;
    startCall();
  };

  const subtitle = stateMessage(uiState);

  return (
    <View
      className="flex-1 bg-cloud px-lg"
      style={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 24,
      }}
    >
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        hitSlop={12}
        className="w-10 h-10 items-center justify-center rounded-full bg-white"
      >
        <Ionicons name="close" size={20} color="#17181F" />
      </Pressable>

      <View className="flex-1 items-center justify-center gap-sm">
        <View className="w-16 h-16 items-center justify-center rounded-full bg-cobalt-100">
          <Ionicons name="chatbubble-ellipses" size={28} color="#1D4FD6" />
        </View>
        <Text className="text-title text-ink text-center mt-sm">
          Trip assistant
        </Text>
        {user && (
          <Text className="text-[12px] text-ink opacity-40 text-center">
            Signed in as{" "}
            {user.firstName ?? user.primaryEmailAddress?.emailAddress}
          </Text>
        )}
        {subtitle ? (
          <Text className="text-body text-ink opacity-60 text-center max-w-[280px]">
            {subtitle}
          </Text>
        ) : null}
      </View>

      {call ? (
        <StreamCall call={call}>
          <CallPanel onEnd={endCall} />
        </StreamCall>
      ) : (
        <View
          className="flex-row items-center gap-sm bg-white rounded-full px-md py-sm"
          style={CARD_SHADOW}
        >
          <TextInput
            editable={false}
            placeholder="Ask about flights, hotels, cars…"
            placeholderTextColor="#8A8D9A"
            className="flex-1 text-body text-ink"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Talk to the assistant"
            onPress={onMicPress}
            disabled={uiState.kind === "connecting"}
            className={`w-9 h-9 items-center justify-center rounded-full ${
              uiState.kind === "connecting" ? "bg-cobalt-100" : "bg-cobalt-500"
            }`}
          >
            {uiState.kind === "connecting" ? (
              <ActivityIndicator size="small" color="#1D4FD6" />
            ) : (
              <Ionicons name="mic" size={16} color="#fff" />
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}
