// A random id for this install, sent only to /api/flights so the server can
// cap live searches per device (spec 0003, AC-13). Global, not scoped per
// account, and never sent to PostHog. It is not a secret and not personal:
// Math.random is enough.
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "device-id";

const makeId = () =>
  Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");

let pending: Promise<string> | null = null;

export function getDeviceId(): Promise<string> {
  pending ??= AsyncStorage.getItem(KEY)
    .then(async (saved) => {
      if (saved) return saved;
      const id = makeId();
      await AsyncStorage.setItem(KEY, id);
      return id;
    })
    .catch(() => makeId()); // storage unavailable: still capped per session
  return pending;
}
