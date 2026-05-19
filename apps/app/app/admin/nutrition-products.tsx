import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminScreen } from "@/features/admin/AdminScreen";

export default function AdminNutritionProductsRoute() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminScreen mode="nutrition-products" />
    </ProtectedRoute>
  );
}
