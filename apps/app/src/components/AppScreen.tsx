import { Screen, type ScreenProps } from "@athmira/ui";
import { Platform } from "react-native";

import { AppFooter } from "./AppFooter";

export function AppScreen({ children, ...props }: ScreenProps) {
  return (
    <Screen {...props} footer={Platform.OS === "web" ? <AppFooter /> : undefined}>
      {children}
    </Screen>
  );
}
