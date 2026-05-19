import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import type { NutritionIconKey } from "@athmira/types";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@athmira/ui";

export const nutritionIconOptions: NutritionIconKey[] = [
  "bottle",
  "gel",
  "bar",
  "banana",
  "candy",
  "sandwich",
  "powder",
  "salt",
  "sugar",
  "honey",
  "drink",
  "rice",
  "dates",
  "raisins",
  "pretzel",
  "custom_food"
];

const nutritionIconMap: Record<NutritionIconKey, string> = {
  banana: "lemon",
  bar: "cookie-bite",
  bottle: "wine-bottle",
  candy: "candy-cane",
  custom_food: "utensils",
  dates: "seedling",
  drink: "glass-whiskey",
  gel: "bolt",
  honey: "stroopwafel",
  powder: "mortar-pestle",
  pretzel: "cookie",
  raisins: "seedling",
  rice: "seedling",
  salt: "cube",
  sandwich: "bread-slice",
  sugar: "cubes",
  water: "tint"
};

export function NutritionIcon({ iconKey, size = 18 }: { iconKey: NutritionIconKey; size?: number }) {
  return (
    <View style={[styles.iconFrame, getIconToneStyle(iconKey)]}>
      <FontAwesome5 color={colors.white} name={nutritionIconMap[iconKey]} size={size} solid />
    </View>
  );
}

export function NutritionIconPicker({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: NutritionIconKey) => void;
  value: NutritionIconKey;
}) {
  return (
    <View style={styles.pickerBlock}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={styles.iconGrid}>
        {nutritionIconOptions.map((iconKey) => {
          const selected = iconKey === value;

          return (
            <Pressable
              accessibilityRole="button"
              key={iconKey}
              onPress={() => onChange(iconKey)}
              style={[styles.iconChoice, selected && styles.iconChoiceSelected]}
            >
              <NutritionIcon iconKey={iconKey} size={16} />
              <Text style={[styles.iconChoiceText, selected && styles.iconChoiceTextSelected]}>
                {getNutritionIconLabel(iconKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function getNutritionIconLabel(iconKey: NutritionIconKey) {
  return iconKey.replace("_", " ");
}

export function toNutritionIconKey(value: string): NutritionIconKey {
  return nutritionIconOptions.includes(value as NutritionIconKey) ? (value as NutritionIconKey) : "custom_food";
}

function getIconToneStyle(iconKey: NutritionIconKey) {
  switch (iconKey) {
    case "bottle":
    case "drink":
    case "water":
      return styles.iconBlue;
    case "pretzel":
    case "salt":
      return styles.iconAmber;
    case "bar":
    case "candy":
    case "gel":
    case "honey":
    case "powder":
    case "sugar":
      return styles.iconAccent;
    case "banana":
    case "custom_food":
    case "dates":
    case "raisins":
    case "rice":
    case "sandwich":
    default:
      return styles.iconPrimary;
  }
}

const styles = StyleSheet.create({
  iconFrame: {
    alignItems: "center",
    borderRadius: radii.md,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  iconPrimary: {
    backgroundColor: colors.primary
  },
  iconAccent: {
    backgroundColor: "#6f8f11"
  },
  iconAmber: {
    backgroundColor: colors.amber
  },
  iconBlue: {
    backgroundColor: colors.blue
  },
  pickerBlock: {
    gap: spacing.sm,
    width: "100%"
  },
  pickerLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: typography.weights.black
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  iconChoice: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: 112,
    flexDirection: "row",
    flexGrow: 1,
    gap: spacing.sm,
    padding: spacing.sm
  },
  iconChoiceSelected: {
    backgroundColor: colors.primaryMist,
    borderColor: colors.primary
  },
  iconChoiceText: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: typography.weights.black,
    textTransform: "capitalize"
  },
  iconChoiceTextSelected: {
    color: colors.primaryDark
  }
});
