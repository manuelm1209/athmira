import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminScreen } from "@/features/admin/AdminScreen";

export default function AdminRoute() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminScreen />
    </ProtectedRoute>
  );
}
