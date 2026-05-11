import type { PropsWithChildren, ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type TextStyle,
  View,
  type ViewStyle
} from "react-native";

import { colors, radii, spacing } from "./theme";

type ButtonProps = PropsWithChildren<{
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}>;

export function Button({ children, onPress, variant = "primary", disabled, loading, style }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        getButtonVariantStyle(variant),
        (disabled || loading) && styles.disabledButton,
        pressed && !disabled ? styles.pressed : null,
        style
      ]}
    >
      {loading ? <ActivityIndicator color={variant === "primary" ? "#ffffff" : colors.primary} /> : null}
      <Text style={[styles.buttonText, getButtonTextVariantStyle(variant)]}>{children}</Text>
    </Pressable>
  );
}

type CardProps = PropsWithChildren<{
  style?: ViewStyle;
}>;

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type ScreenProps = PropsWithChildren<{
  centered?: boolean;
  maxWidth?: number;
}>;

export function Screen({ children, centered, maxWidth = 1120 }: ScreenProps) {
  return (
    <ScrollView contentContainerStyle={[styles.screen, centered && styles.centeredScreen]}>
      <View style={[styles.screenInner, { maxWidth }]}>{children}</View>
    </ScrollView>
  );
}

type FieldProps = TextInputProps & {
  label: string;
  helper?: string;
};

export function Field({ label, helper, style, ...props }: FieldProps) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.inkMuted}
        style={[styles.field, style]}
        {...props}
      />
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

export function Heading({ children, style }: PropsWithChildren<{ style?: TextStyle }>) {
  return <Text style={[styles.heading, style]}>{children}</Text>;
}

export function Body({ children, style }: PropsWithChildren<{ style?: TextStyle }>) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Eyebrow({ children }: PropsWithChildren) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function Inline({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.inline, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flexGrow: 1,
    padding: spacing.lg
  },
  centeredScreen: {
    justifyContent: "center"
  },
  screenInner: {
    alignSelf: "center",
    width: "100%"
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.lg
  },
  heading: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40
  },
  body: {
    color: colors.inkMuted,
    fontSize: 16,
    lineHeight: 24
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  button: {
    alignItems: "center",
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderColor: colors.primary
  },
  ghostButton: {
    backgroundColor: "transparent",
    borderColor: "transparent"
  },
  dangerButton: {
    backgroundColor: colors.danger,
    borderColor: colors.danger
  },
  disabledButton: {
    opacity: 0.6
  },
  pressed: {
    opacity: 0.86
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "800"
  },
  primaryButtonText: {
    color: "#ffffff"
  },
  secondaryButtonText: {
    color: colors.primary
  },
  ghostButtonText: {
    color: colors.primary
  },
  dangerButtonText: {
    color: "#ffffff"
  },
  fieldWrapper: {
    gap: spacing.xs
  },
  label: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700"
  },
  field: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  helper: {
    color: colors.inkMuted,
    fontSize: 12,
    lineHeight: 16
  },
  inline: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  }
});

function getButtonVariantStyle(variant: NonNullable<ButtonProps["variant"]>) {
  switch (variant) {
    case "secondary":
      return styles.secondaryButton;
    case "ghost":
      return styles.ghostButton;
    case "danger":
      return styles.dangerButton;
    case "primary":
    default:
      return styles.primaryButton;
  }
}

function getButtonTextVariantStyle(variant: NonNullable<ButtonProps["variant"]>) {
  switch (variant) {
    case "secondary":
      return styles.secondaryButtonText;
    case "ghost":
      return styles.ghostButtonText;
    case "danger":
      return styles.dangerButtonText;
    case "primary":
    default:
      return styles.primaryButtonText;
  }
}
