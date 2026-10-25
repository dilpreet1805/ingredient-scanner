import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { colors } from "@/constants/colors";

const SCALE_MIN = 15;
const SCALE_MAX = 35;

// Geometry: the arc's centre sits at the bottom middle of the drawing.

const W = 280;
const H = 150;
const CX = 140;
const CY = 140;
const R = 110;
const STROKE = 20;
const GAP = 0.006; // small space between segments, as a fraction of the scale

const segments = [
  { from: 15, to: 18.5, color: colors.riskMid },
  { from: 18.5, to: 25, color: colors.primary },
  { from: 25, to: 30, color: colors.accent },
  { from: 30, to: 35, color: colors.riskHigh },
];

/** BMI -> 0..1 position along the scale. */

const toFraction = (bmi: number) =>
  Math.min(1, Math.max(0, (bmi - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)));

/** Point on the arc. 0 = far left, 1 = far right, 0.5 = straight up. */
const pointAt = (t: number) => {
  const angle = Math.PI * (1 - t);
  return { x: CX + R * Math.cos(angle), y: CY - R * Math.sin(angle) };
};

const arcPath = (t1: number, t2: number) => {
  const a = pointAt(t1);
  const b = pointAt(t2);
  // "A rx ry rotation large-arc sweep x y"; sweep=1 draws clockwise (over the top).
  return `M ${a.x} ${a.y} A ${R} ${R} 0 0 1 ${b.x} ${b.y}`;
};

export function BmiGauge({ bmi }: { bmi: number }) {
  const target = toFraction(bmi);
  const progress = useSharedValue(0);

  // Replay the animation each time the Home tab comes into focus.
  useFocusEffect(
    useCallback(() => {
      progress.value = 0;
      progress.value = withTiming(target, {
        duration: 1100,
        easing: Easing.out(Easing.cubic),
      });
    }, [progress, target]),
  );

  // 0 -> pointing left (-90deg), 0.5 -> up (0deg), 1 -> right (+90deg).
  const needleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(progress.value - 0.5) * 180}deg` }],
  }));

  return (
    <View
      accessible
      accessibilityLabel={`BMI gauge, value ${bmi.toFixed(1)}`}
      style={{ width: W, height: H, alignSelf: "center" }}
    >
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {segments.map((s) => (
          <Path
            key={s.from}
            d={arcPath(toFraction(s.from) + GAP, toFraction(s.to) - GAP)}
            stroke={s.color}
            strokeWidth={STROKE}
            fill="none"
          />
        ))}
      </Svg>

      {/* A full-size square centred on the arc's centre, so rotating it
          swings the needle around the right pivot. Its lower half is empty. */}
      <Animated.View
        pointerEvents="none"
        style={[
          { position: "absolute", left: 0, top: 0, width: W, height: CY * 2 },
          needleStyle,
        ]}
      >
        <View
          style={{
            position: "absolute",
            left: CX - 3,
            top: CY - 92,
            width: 6,
            height: 92,
            borderRadius: 3,
            backgroundColor: colors.ink,
          }}
        />
        <View
          style={{
            position: "absolute",
            left: CX - 10,
            top: CY - 10,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.ink,
            borderWidth: 3,
            borderColor: colors.surface,
          }}
        />
      </Animated.View>
    </View>
  );
}
