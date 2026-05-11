import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProfileScreen } from "@/features/profile/ProfileScreen";

export default function ProfileRoute() {
  return (
    <ProtectedRoute>
      <ProfileScreen />
    </ProtectedRoute>
  );
}
