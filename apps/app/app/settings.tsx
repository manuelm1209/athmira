import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SettingsScreen } from "@/features/profile/SettingsScreen";

export default function SettingsRoute() {
  return (
    <ProtectedRoute>
      <SettingsScreen />
    </ProtectedRoute>
  );
}
