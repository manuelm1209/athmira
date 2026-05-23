import { Screen, type ScreenProps } from "@athmira/ui";
import { Platform } from "react-native";

import { AppFooter } from "./AppFooter";

export function AppScreen(props: ScreenProps) {
  return (
    <>
      <Screen {...props} />
      {Platform.OS === "web" ? <AppFooter /> : null}
    </>
  );
}
