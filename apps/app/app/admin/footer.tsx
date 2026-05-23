import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminScreen } from "@/features/admin/AdminScreen";

export default function AdminFooterRoute() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminScreen mode="footer" />
    </ProtectedRoute>
  );
}
