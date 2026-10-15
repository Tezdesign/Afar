import { View } from "react-native";

import { CARD_SHADOW } from "@/theme/shadow";

// Grey shapes that stand in for content while it loads. Sizes match the real
// cards so nothing jumps when the data arrives.

export const SkeletonBar = ({ className = "" }: { className?: string }) => (
  <View className={`rounded-sm bg-line ${className}`} />
);

const Group = ({ children }: { children: React.ReactNode }) => (
  <View accessible accessibilityLabel="Loading" accessibilityRole="progressbar">
    {children}
  </View>
);

/** Same size as a Results card. */
export const SkeletonCard = () => (
  <Group>
    <View className="h-[168px] gap-sm rounded-lg bg-white p-md" style={CARD_SHADOW}>
      <View className="flex-row items-center justify-between">
        <SkeletonBar className="h-5 w-[160px]" />
        <SkeletonBar className="h-5 w-[72px]" />
      </View>
      <SkeletonBar className="h-4 w-full" />
      <SkeletonBar className="h-8 w-[200px]" />
      <View className="flex-row items-center justify-between">
        <SkeletonBar className="h-6 w-[100px]" />
        <SkeletonBar className="h-6 w-[100px]" />
      </View>
    </View>
  </Group>
);

/** A Home strip card. */
export const SkeletonTile = ({ width = 180 }: { width?: number }) => (
  <Group>
    <View className="h-[200px] overflow-hidden rounded-lg bg-white" style={[{ width }, CARD_SHADOW]}>
      <SkeletonBar className="h-[100px] w-full" />
      <View className="gap-sm p-md">
        <SkeletonBar className="h-[14px] w-[110px]" />
        <SkeletonBar className="h-[14px] w-[80px]" />
        <SkeletonBar className="h-[14px] w-[60px]" />
      </View>
    </View>
  </Group>
);

/** A Saved list row. */
export const SkeletonRow = () => (
  <Group>
    <View className="h-24 flex-row items-center gap-md overflow-hidden rounded-lg bg-white" style={CARD_SHADOW}>
      <SkeletonBar className="h-24 w-24" />
      <View className="gap-sm">
        <SkeletonBar className="h-4 w-[140px]" />
        <SkeletonBar className="h-3 w-[90px]" />
      </View>
    </View>
  </Group>
);
