import type { Href } from "expo-router";
import { Link } from "expo-router";
import type { ReactNode } from "react";
import { Platform, Pressable, StyleSheet, Text } from "react-native";
import { colors, radii, shadows, spacing, typography } from "@athmira/ui";

type LinkButtonProps = {
  children: ReactNode;
  href: Href;
  variant?: "primary" | "secondary" | "ghost";
};

export function LinkButton({ children, href, variant = "primary" }: LinkButtonProps) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="link" style={StyleSheet.flatten([styles.button, getButtonStyle(variant)])}>
        <Text style={[styles.text, getTextStyle(variant)]}>{children}</Text>
      </Pressable>
    </Link>
  );
}

const fontFamily = Platform.select({ default: undefined, web: typography.fontFamily });

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.soft
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent"
  },
  text: {
    fontFamily,
    fontSize: 15,
    fontWeight: typography.weights.black
  },
  primaryText: {
    color: "#ffffff"
  },
  secondaryText: {
    color: colors.primary
  },
  ghostText: {
    color: colors.primary
  }
});

function getButtonStyle(variant: NonNullable<LinkButtonProps["variant"]>) {
  switch (variant) {
    case "secondary":
      return styles.secondary;
    case "ghost":
      return styles.ghost;
    case "primary":
    default:
      return styles.primary;
  }
}

function getTextStyle(variant: NonNullable<LinkButtonProps["variant"]>) {
  switch (variant) {
    case "secondary":
      return styles.secondaryText;
    case "ghost":
      return styles.ghostText;
    case "primary":
    default:
      return styles.primaryText;
  }
}
