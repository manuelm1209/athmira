import { ProtectedRoute } from "@/components/ProtectedRoute";
import { FrontKneeAnalysisScreen } from "@/features/analysis/FrontKneeAnalysisScreen";

export default function FrontKneeRoute() {
  return (
    <ProtectedRoute>
      <FrontKneeAnalysisScreen />
    </ProtectedRoute>
  );
}
