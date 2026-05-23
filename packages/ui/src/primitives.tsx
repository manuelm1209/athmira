import type { ChangeEvent, CSSProperties, PropsWithChildren, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  type StyleProp,
  Text,
  TextInput,
  type TextInputProps,
  type TextStyle,
  View,
  type ViewStyle
} from "react-native";

import { colors, motion, radii, shadows, spacing, typography } from "./theme";

type ButtonProps = PropsWithChildren<{
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
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
  style?: StyleProp<ViewStyle>;
}>;

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export type ScreenProps = PropsWithChildren<{
  centered?: boolean;
  footer?: ReactNode;
  maxWidth?: number;
}>;

export function Screen({ children, centered, footer, maxWidth = 1120 }: ScreenProps) {
  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={[styles.screen, centered && !footer && styles.centeredScreen]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.screenInner, { maxWidth }, centered && Boolean(footer) && styles.centeredScreenInner]}>
        {children}
      </View>
      {footer}
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

type CheckboxProps = {
  checked: boolean;
  disabled?: boolean;
  helper?: string;
  label: ReactNode;
  onChange: (checked: boolean) => void;
  style?: StyleProp<ViewStyle>;
};

export function Checkbox({ checked, disabled, helper, label, onChange, style }: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={({ pressed }) => [
        styles.checkboxRow,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabledButton : null,
        style
      ]}
    >
      <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>
        {checked ? <Text style={styles.checkboxMark}>✓</Text> : null}
      </View>
      <View style={styles.checkboxCopy}>
        <Text style={styles.checkboxLabel}>{label}</Text>
        {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      </View>
    </Pressable>
  );
}

export type SelectFieldOption = {
  label: string;
  value: string;
};

type SelectFieldProps = {
  helper?: string;
  label: string;
  onValueChange: (value: string) => void;
  options: SelectFieldOption[];
  placeholder?: string;
  value: string;
};

export function SelectField({ helper, label, onValueChange, options, placeholder, value }: SelectFieldProps) {
  const [nativeOpen, setNativeOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value) ?? null;
  const displayValue = selectedOption?.label ?? placeholder ?? "";

  if (Platform.OS === "web") {
    return (
      <View style={styles.fieldWrapper}>
        <Text style={styles.label}>{label}</Text>
        <select
          aria-label={label}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => onValueChange(event.currentTarget.value)}
          style={webFieldStyle}
          value={value}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: nativeOpen }}
        onPress={() => setNativeOpen((current) => !current)}
        style={({ pressed }) => [styles.nativeSelectButton, pressed ? styles.pressed : null]}
      >
        <Text
          numberOfLines={1}
          style={[styles.nativeSelectValue, !selectedOption && styles.nativeSelectPlaceholder]}
        >
          {displayValue}
        </Text>
        <NativeSelectChevron expanded={nativeOpen} />
      </Pressable>
      {nativeOpen ? (
        <View style={styles.nativeSelectMenu}>
          {placeholder ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onValueChange("");
                setNativeOpen(false);
              }}
              style={[styles.nativeSelectOption, value === "" && styles.nativeSelectOptionSelected]}
            >
              <Text style={[styles.nativeSelectOptionText, value === "" && styles.nativeSelectOptionTextSelected]}>
                {placeholder}
              </Text>
            </Pressable>
          ) : null}
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <Pressable
                accessibilityRole="button"
                key={option.value}
                onPress={() => {
                  onValueChange(option.value);
                  setNativeOpen(false);
                }}
                style={[styles.nativeSelectOption, selected && styles.nativeSelectOptionSelected]}
              >
                <Text style={[styles.nativeSelectOptionText, selected && styles.nativeSelectOptionTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

function NativeSelectChevron({ expanded }: { expanded: boolean }) {
  return (
    <View style={styles.nativeSelectChevronBox}>
      <View style={[styles.nativeSelectChevronStroke, styles.nativeSelectChevronStrokeLeft, expanded && styles.nativeSelectChevronStrokeLeftOpen]} />
      <View style={[styles.nativeSelectChevronStroke, styles.nativeSelectChevronStrokeRight, expanded && styles.nativeSelectChevronStrokeRightOpen]} />
    </View>
  );
}

type DateFieldProps = {
  helper?: string;
  label: string;
  max?: string;
  min?: string;
  onValueChange: (value: string) => void;
  value: string;
};

export function DateField({ helper, label, max, min, onValueChange, value }: DateFieldProps) {
  if (Platform.OS === "web") {
    return (
      <View style={styles.fieldWrapper}>
        <Text style={styles.label}>{label}</Text>
        <input
          aria-label={label}
          max={max}
          min={min}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onValueChange(event.currentTarget.value)}
          style={webFieldStyle}
          type="date"
          value={value}
        />
        {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      </View>
    );
  }

  return <Field helper={helper ?? "YYYY-MM-DD"} label={label} onChangeText={onValueChange} value={value} />;
}

export function Heading({ children, style }: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  return <Text style={[styles.heading, style]}>{children}</Text>;
}

export function Body({ children, style }: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Eyebrow({ children }: PropsWithChildren) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function Inline({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.inline, style]}>{children}</View>;
}

type FadeInViewProps = PropsWithChildren<{
  delayMs?: number;
  distance?: number;
  nativeID?: string;
  style?: StyleProp<ViewStyle>;
}>;

export function FadeInView({ children, delayMs = 0, distance = 16, nativeID, style }: FadeInViewProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      delay: delayMs,
      duration: motion.slowMs,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true
    }).start();
  }, [delayMs, progress]);

  return (
    <Animated.View
      nativeID={nativeID}
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0]
              })
            }
          ]
        }
      ]}
    >
      {children}
    </Animated.View>
  );
}

const fontFamily = Platform.select({ default: undefined, web: typography.fontFamily });

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flexGrow: 1
  },
  centeredScreen: {
    justifyContent: "center"
  },
  centeredScreenInner: {
    flexGrow: 1,
    justifyContent: "center"
  },
  screenInner: {
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    width: "100%"
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadows.soft
  },
  heading: {
    color: colors.ink,
    fontFamily,
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.black,
    lineHeight: typography.lineHeights.heading
  },
  body: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body
  },
  eyebrow: {
    color: colors.primary,
    fontFamily,
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.black,
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  button: {
    alignItems: "center",
    borderRadius: radii.md,
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
    borderColor: colors.primary,
    ...shadows.soft
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong
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
    opacity: 0.86,
    transform: [{ translateY: 1 }, { scale: 0.99 }]
  },
  buttonText: {
    fontFamily,
    fontSize: 15,
    fontWeight: typography.weights.black
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
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.bold
  },
  field: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.ink,
    fontFamily,
    fontSize: 16,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  nativeSelectButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  nativeSelectValue: {
    color: colors.ink,
    flex: 1,
    fontFamily,
    fontSize: 16,
    fontWeight: typography.weights.medium,
    lineHeight: 22
  },
  nativeSelectPlaceholder: {
    color: colors.inkMuted
  },
  nativeSelectChevronBox: {
    height: 18,
    justifyContent: "center",
    position: "relative",
    width: 18
  },
  nativeSelectChevronStroke: {
    backgroundColor: colors.ink,
    borderRadius: radii.round,
    height: 2,
    position: "absolute",
    top: 8,
    width: 8
  },
  nativeSelectChevronStrokeLeft: {
    left: 3,
    transform: [{ rotate: "45deg" }]
  },
  nativeSelectChevronStrokeRight: {
    right: 3,
    transform: [{ rotate: "-45deg" }]
  },
  nativeSelectChevronStrokeLeftOpen: {
    transform: [{ rotate: "-45deg" }]
  },
  nativeSelectChevronStrokeRightOpen: {
    transform: [{ rotate: "45deg" }]
  },
  nativeSelectMenu: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: "hidden"
  },
  nativeSelectOption: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  nativeSelectOptionSelected: {
    backgroundColor: colors.primaryMist
  },
  nativeSelectOptionText: {
    color: colors.ink,
    fontFamily,
    fontSize: 15,
    fontWeight: typography.weights.bold,
    lineHeight: 21
  },
  nativeSelectOptionTextSelected: {
    color: colors.primaryDark
  },
  helper: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    lineHeight: 16
  },
  checkboxRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm
  },
  checkboxBox: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radii.sm,
    borderWidth: 1,
    height: 22,
    justifyContent: "center",
    marginTop: 1,
    width: 22
  },
  checkboxBoxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  checkboxMark: {
    color: colors.white,
    fontFamily,
    fontSize: 15,
    fontWeight: typography.weights.black,
    lineHeight: 18
  },
  checkboxCopy: {
    flex: 1,
    gap: spacing.xs
  },
  checkboxLabel: {
    color: colors.ink,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.regular,
    lineHeight: 20
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  optionButton: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  optionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  optionButtonText: {
    color: colors.ink,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.bold
  },
  optionButtonTextSelected: {
    color: "#ffffff"
  },
  inline: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  }
});

const webFieldStyle: CSSProperties = {
  backgroundColor: colors.surface,
  borderColor: colors.border,
  borderRadius: radii.sm,
  borderStyle: "solid",
  borderWidth: 1,
  boxSizing: "border-box",
  color: colors.ink,
  fontFamily: typography.fontFamily,
  fontSize: 16,
  fontWeight: typography.weights.medium,
  lineHeight: "22px",
  minHeight: 46,
  outlineColor: colors.primary,
  padding: `${spacing.sm}px 40px ${spacing.sm}px ${spacing.md}px`,
  width: "100%"
};

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
