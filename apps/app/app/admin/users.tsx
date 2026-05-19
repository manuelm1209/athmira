import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminScreen } from "@/features/admin/AdminScreen";

export default function AdminUsersRoute() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminScreen mode="users" />
    </ProtectedRoute>
  );
}
