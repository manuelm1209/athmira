import { colors, spacing } from "@athmira/ui";
import { StyleSheet, Text, View } from "react-native";

type RiderSilhouetteOverlayProps = {
  detected: boolean;
  detectedLabel: string;
  guide: string;
  title: string;
};

export function RiderSilhouetteOverlay({ detected, detectedLabel, guide, title }: RiderSilhouetteOverlayProps) {
  if (detected) {
    return (
      <View style={[styles.container, styles.noPointer]}>
        <View style={styles.detectedBadge}>
          <Text style={styles.detectedText}>{detectedLabel}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.noPointer]}>
      <View style={styles.illustration}>
        <View style={[styles.wheel, styles.wheelRear]} />
        <View style={[styles.wheel, styles.wheelFront]} />
        <View style={styles.frameTopTube} />
        <View style={styles.frameDownTube} />
        <View style={styles.frameSeatTube} />
        <View style={styles.saddle} />
        <View style={styles.handlebar} />

        <View style={styles.riderTorso} />
        <View style={styles.riderArm} />
        <View style={styles.riderThigh} />
        <View style={styles.riderShin} />
        <View style={styles.riderHead} />
      </View>

      <View style={styles.caption}>
        <Text style={styles.captionTitle}>{title}</Text>
        <Text style={styles.captionText}>{guide}</Text>
      </View>
    </View>
  );
}

const RIDER = colors.primary;
const FRAME = "rgba(255,255,255,0.92)";

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center"
  },
  noPointer: {
    pointerEvents: "none"
  },
  illustration: {
    aspectRatio: 16 / 9,
    height: "82%",
    maxWidth: "92%",
    position: "relative"
  },
  wheel: {
    borderColor: FRAME,
    borderRadius: 999,
    borderWidth: 4,
    height: "38%",
    position: "absolute",
    top: "52%",
    width: "18%"
  },
  wheelRear: {
    left: "14%"
  },
  wheelFront: {
    left: "68%"
  },
  frameTopTube: {
    backgroundColor: FRAME,
    height: 4,
    left: "30%",
    position: "absolute",
    top: "47%",
    transform: [{ rotate: "-12deg" }],
    width: "30%"
  },
  frameDownTube: {
    backgroundColor: FRAME,
    height: 4,
    left: "38%",
    position: "absolute",
    top: "61%",
    transform: [{ rotate: "18deg" }],
    width: "32%"
  },
  frameSeatTube: {
    backgroundColor: FRAME,
    height: "20%",
    left: "40%",
    position: "absolute",
    top: "46%",
    width: 4
  },
  saddle: {
    backgroundColor: FRAME,
    borderRadius: 4,
    height: 5,
    left: "36%",
    position: "absolute",
    top: "44%",
    width: "12%"
  },
  handlebar: {
    backgroundColor: FRAME,
    height: "10%",
    left: "70%",
    position: "absolute",
    top: "46%",
    width: 4
  },
  riderTorso: {
    backgroundColor: RIDER,
    borderRadius: 6,
    height: 8,
    left: "40%",
    position: "absolute",
    top: "32%",
    transform: [{ rotate: "-32deg" }],
    width: "26%"
  },
  riderArm: {
    backgroundColor: RIDER,
    borderRadius: 6,
    height: 6,
    left: "60%",
    position: "absolute",
    top: "30%",
    transform: [{ rotate: "55deg" }],
    width: "20%"
  },
  riderThigh: {
    backgroundColor: RIDER,
    borderRadius: 6,
    height: 8,
    left: "39%",
    position: "absolute",
    top: "52%",
    transform: [{ rotate: "82deg" }],
    width: "20%"
  },
  riderShin: {
    backgroundColor: RIDER,
    borderRadius: 6,
    height: 6,
    left: "40%",
    position: "absolute",
    top: "68%",
    transform: [{ rotate: "62deg" }],
    width: "18%"
  },
  riderHead: {
    backgroundColor: "rgba(12,175,215,0.25)",
    borderColor: RIDER,
    borderRadius: 999,
    borderWidth: 4,
    height: 38,
    left: "62%",
    position: "absolute",
    top: "12%",
    width: 38
  },
  caption: {
    backgroundColor: "rgba(13,27,34,0.82)",
    borderRadius: 10,
    bottom: spacing.md,
    maxWidth: 420,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: "absolute"
  },
  captionTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.4,
    textAlign: "center",
    textTransform: "uppercase"
  },
  captionText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    marginTop: 4,
    opacity: 0.92,
    textAlign: "center"
  },
  detectedBadge: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    position: "absolute",
    right: spacing.md,
    top: spacing.md
  },
  detectedText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase"
  }
});
