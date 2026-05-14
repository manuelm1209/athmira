import { Body, Button, Card, DateField, Field, Heading, Inline, Screen, SelectField, colors, spacing } from "@athmira/ui";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { LanguageToggle } from "@/components/LanguageToggle";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { getErrorMessage, numberToInput, parseOptionalNumber } from "@/utils/form";

const genderValues = ["female", "male", "non_binary", "prefer_not_to_say"] as const;
type GenderValue = (typeof genderValues)[number];

export function ProfileScreen() {
  const { profile, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setName(profile.name ?? "");
    setGender(profile.gender && isGenderValue(profile.gender) ? profile.gender : "");
    setHeightCm(numberToInput(profile.height_cm));
    setWeightKg(numberToInput(profile.weight_kg));
    setDateOfBirth(profile.date_of_birth ?? "");
  }, [profile]);

  async function saveProfile() {
    setError(null);
    setMessage(null);
    setSaving(true);

    try {
      await updateProfile({
        name: name.trim() || null,
        gender: isGenderValue(gender) ? gender : null,
        height_cm: parseOptionalNumber(heightCm),
        weight_kg: parseOptionalNumber(weightKg),
        date_of_birth: dateOfBirth.trim() || null
      });
      setMessage(t("profileSaved"));
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen maxWidth={760}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Heading>{t("userProfile")}</Heading>
          <Body>{t("educationalNote")}</Body>
        </View>
        <Field label={t("authName")} onChangeText={setName} value={name} />
        <SelectField
          label={t("gender")}
          onValueChange={setGender}
          options={[
            { label: t("genderFemale"), value: "female" },
            { label: t("genderMale"), value: "male" },
            { label: t("genderNonBinary"), value: "non_binary" },
            { label: t("genderPreferNotToSay"), value: "prefer_not_to_say" }
          ]}
          placeholder={t("genderSelectPlaceholder")}
          value={isGenderValue(gender) ? gender : ""}
        />
        <Inline>
          <View style={styles.splitField}>
            <Field inputMode="numeric" label={t("height")} onChangeText={setHeightCm} value={heightCm} />
          </View>
          <View style={styles.splitField}>
            <Field inputMode="numeric" label={t("weight")} onChangeText={setWeightKg} value={weightKg} />
          </View>
        </Inline>
        <DateField
          helper={t("dateOfBirthHelp")}
          label={t("dateOfBirth")}
          max={new Date().toISOString().slice(0, 10)}
          min="1900-01-01"
          onValueChange={setDateOfBirth}
          value={dateOfBirth}
        />
        <View style={styles.languageRow}>
          <Text style={styles.languageLabel}>{t("language")}</Text>
          <LanguageToggle />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Button loading={saving} onPress={saveProfile}>
          {t("save")}
        </Button>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg
  },
  header: {
    gap: spacing.sm
  },
  splitField: {
    flexBasis: 220,
    flexGrow: 1
  },
  languageRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  languageLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  error: {
    color: colors.danger,
    fontWeight: "700"
  },
  message: {
    color: colors.primary,
    fontWeight: "700"
  }
});

function isGenderValue(value: string): value is GenderValue {
  return genderValues.includes(value as GenderValue);
}
