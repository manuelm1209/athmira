import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/providers/AuthProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LanguageProvider>
          <AppShell>
            <Stack screenOptions={{ headerShown: false }} />
          </AppShell>
        </LanguageProvider>
      </AuthProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
