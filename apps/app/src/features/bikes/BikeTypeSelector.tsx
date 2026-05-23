import type { BikeType } from "@athmira/types";
import { colors, radii, spacing } from "@athmira/ui";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { TranslationKey } from "@/i18n";
import { getBikeImage } from "@/lib/bike-images";
import { useLanguage } from "@/providers/LanguageProvider";

const bikeTypes: { value: BikeType; labelKey: TranslationKey }[] = [
  { value: "road", labelKey: "road" },
  { value: "gravel", labelKey: "gravel" },
  { value: "triathlon", labelKey: "triathlon" },
  { value: "mountain", labelKey: "mountain" },
  { value: "hybrid", labelKey: "hybrid" }
];

type BikeTypeSelectorProps = {
  value: BikeType;
  onChange: (value: BikeType) => void;
};

export function BikeTypeSelector({ value, onChange }: BikeTypeSelectorProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t("bikeType")}</Text>
      <View style={styles.preview}>
        <Image accessibilityIgnoresInvertColors resizeMode="contain" source={getBikeImage(value)} style={styles.previewImage} />
      </View>
      <View style={styles.options}>
        {bikeTypes.map((option) => (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.option, value === option.value && styles.activeOption]}
          >
            <Text style={[styles.optionText, value === option.value && styles.activeText]}>{t(option.labelKey)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm
  },
  label: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  preview: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 180,
    justifyContent: "center",
    overflow: "hidden",
    paddingVertical: spacing.sm
  },
  previewImage: {
    height: "100%",
    maxWidth: 320,
    width: "100%"
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  option: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  activeOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  optionText: {
    color: colors.inkMuted,
    fontSize: 14,
    fontWeight: "800"
  },
  activeText: {
    color: "#ffffff"
  }
});
