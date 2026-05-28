import { colors, spacing } from "@athmira/ui";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

type RiderSilhouetteOverlayProps = {
  detected: boolean;
  detectedLabel: string;
  guide: string;
  title: string;
};

const RIDER_PATH =
  "M11 18C11 18.5523 11.4477 19 12 19C12.5523 19 13 18.5523 13 18H11ZM12 13H13C13 12.7348 12.8946 12.4804 12.7071 12.2929L12 13ZM8.5 9.5L7.8415 8.74742C7.6332 8.92968 7.50976 9.19011 7.50055 9.46672C7.49134 9.74334 7.59719 10.0114 7.79289 10.2071L8.5 9.5ZM12.5 6L13.2593 5.34921C13.0855 5.1465 12.8379 5.02169 12.5716 5.00257C12.3053 4.98345 12.0424 5.07161 11.8415 5.24742L12.5 6ZM18.5 11C19.0523 11 19.5 10.5523 19.5 10C19.5 9.44772 19.0523 9 18.5 9V11ZM8 17C8 18.6569 6.65685 20 5 20V22C7.76142 22 10 19.7614 10 17H8ZM5 20C3.34315 20 2 18.6569 2 17H0C0 19.7614 2.23858 22 5 22V20ZM2 17C2 15.3431 3.34315 14 5 14V12C2.23858 12 0 14.2386 0 17H2ZM5 14C6.65685 14 8 15.3431 8 17H10C10 14.2386 7.76142 12 5 12V14ZM13 18V13H11V18H13ZM12.7071 12.2929L9.20711 8.79289L7.79289 10.2071L11.2929 13.7071L12.7071 12.2929ZM9.1585 10.2526L13.1585 6.75258L11.8415 5.24742L7.8415 8.74742L9.1585 10.2526ZM11.7407 6.65079C12.2544 7.25009 13.2032 8.3069 14.3529 9.22044C15.4669 10.1056 16.9452 11 18.5 11V9C17.6548 9 16.6331 8.47777 15.5971 7.65456C14.5968 6.85976 13.7456 5.91657 13.2593 5.34921L11.7407 6.65079ZM22 17C22 18.6569 20.6569 20 19 20V22C21.7614 22 24 19.7614 24 17H22ZM19 20C17.3431 20 16 18.6569 16 17H14C14 19.7614 16.2386 22 19 22V20ZM16 17C16 15.3431 17.3431 14 19 14V12C16.2386 12 14 14.2386 14 17H16ZM19 14C20.6569 14 22 15.3431 22 17H24C24 14.2386 21.7614 12 19 12V14ZM16 3V5C17.1046 5 18 4.10457 18 3H16ZM16 3H14C14 4.10457 14.8954 5 16 5V3ZM16 3V1C14.8954 1 14 1.89543 14 3H16ZM16 3H18C18 1.89543 17.1046 1 16 1V3Z";

const ACCENT = "#b7e64a";

export function RiderSilhouetteOverlay({ detected, detectedLabel, guide, title }: RiderSilhouetteOverlayProps) {
  const flipProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (detected) {
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flipProgress, {
          delay: 600,
          duration: 600,
          easing: Easing.inOut(Easing.cubic),
          toValue: 1,
          useNativeDriver: true
        }),
        Animated.delay(2800),
        Animated.timing(flipProgress, {
          duration: 600,
          easing: Easing.inOut(Easing.cubic),
          toValue: 0,
          useNativeDriver: true
        }),
        Animated.delay(2800)
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [detected, flipProgress]);

  if (detected) {
    return (
      <View style={[styles.container, styles.noPointer]}>
        <View style={styles.detectedBadge}>
          <Text style={styles.detectedText}>{detectedLabel}</Text>
        </View>
      </View>
    );
  }

  const flipScaleX = flipProgress.interpolate({
    inputRange: [0, 0.49, 0.51, 1],
    outputRange: [1, 1, -1, -1]
  });
  const flipOpacity = flipProgress.interpolate({
    inputRange: [0, 0.45, 0.5, 0.55, 1],
    outputRange: [1, 0.15, 0, 0.15, 1]
  });

  return (
    <View style={[styles.container, styles.noPointer]}>
      <Animated.View
        style={[
          styles.riderWrapper,
          {
            opacity: flipOpacity,
            transform: [{ scaleX: flipScaleX }]
          }
        ]}
      >
        <Svg viewBox="0 0 24 24" height="100%" width="100%">
          <Path d={RIDER_PATH} fill="#ffffff" fillOpacity={0.94} />
        </Svg>
      </Animated.View>

      <View style={styles.caption}>
        <Text style={styles.captionTitle}>{title}</Text>
        <Text style={styles.captionText}>{guide}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center"
  },
  noPointer: {
    pointerEvents: "none"
  },
  riderWrapper: {
    alignItems: "center",
    height: "72%",
    justifyContent: "center",
    maxWidth: "78%"
  },
  caption: {
    alignSelf: "center",
    backgroundColor: "rgba(13,27,34,0.82)",
    borderColor: "rgba(183, 230, 74, 0.45)",
    borderRadius: 12,
    borderWidth: 1,
    bottom: spacing.lg,
    left: spacing.md,
    maxWidth: 460,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    position: "absolute",
    right: spacing.md
  },
  captionTitle: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.8,
    textAlign: "center",
    textTransform: "uppercase"
  },
  captionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
    marginTop: 4,
    opacity: 0.95,
    textAlign: "center"
  },
  detectedBadge: {
    backgroundColor: ACCENT,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    position: "absolute",
    right: spacing.md,
    top: spacing.md
  },
  detectedText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase"
  }
});
