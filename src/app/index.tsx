import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Image, View } from "react-native";

import { images } from "@/constants/images";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/welcome");
    }, 1400);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      {/* className doesn't reach Image's width/height (no NativeWind
          interop for that prop on this component) — sized via style
          per AGENTS.md's style-exception rule. */}
      <Image
        source={images.afarLogo}
        resizeMode="contain"
        style={{ width: 220, height: 79 }}
      />
    </View>
  );
}
