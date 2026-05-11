import { Body, Button, Card, Heading, Screen, colors, spacing } from "@athmira/ui";
import { StyleSheet, Text, View } from "react-native";

import { LanguageToggle } from "@/components/LanguageToggle";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";

export function SettingsScreen() {
  const { signOut } = useAuth();
  const { t } = useLanguage();

  return (
    <Screen maxWidth={680}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Heading>{t("settings")}</Heading>
          <Body>{t("educationalNote")}</Body>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t("language")}</Text>
          <LanguageToggle />
        </View>
        <Button onPress={signOut} variant="secondary">
          {t("logout")}
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
  row: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md
  },
  label: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  }
});
