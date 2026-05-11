import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardScreen } from "@/features/dashboard/DashboardScreen";

export default function DashboardRoute() {
  return (
    <ProtectedRoute>
      <DashboardScreen />
    </ProtectedRoute>
  );
}
