import { ProtectedRoute } from "@/components/ProtectedRoute";
import { NutritionPlansPage } from "@/features/nutrition/NutritionPlansPage";

export default function NutritionRoute() {
  return (
    <ProtectedRoute>
      <NutritionPlansPage />
    </ProtectedRoute>
  );
}
