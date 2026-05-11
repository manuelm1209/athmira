import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@athmira/ui";

import { useLanguage } from "@/providers/LanguageProvider";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <View accessibilityLabel="Language" style={styles.wrapper}>
      {(["en", "es"] as const).map((option) => (
        <Pressable
          accessibilityRole="button"
          key={option}
          onPress={() => {
            setLanguage(option);
          }}
          style={[styles.option, language === option && styles.activeOption]}
        >
          <Text style={[styles.optionText, language === option && styles.activeText]}>{option.toUpperCase()}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: "row",
    padding: 2
  },
  option: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  activeOption: {
    backgroundColor: colors.primary
  },
  optionText: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: "800"
  },
  activeText: {
    color: "#ffffff"
  }
});
