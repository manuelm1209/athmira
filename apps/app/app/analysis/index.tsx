import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AnalysisStartScreen } from "@/features/analysis/AnalysisStartScreen";

export default function AnalysisRoute() {
  return (
    <ProtectedRoute>
      <AnalysisStartScreen />
    </ProtectedRoute>
  );
}
