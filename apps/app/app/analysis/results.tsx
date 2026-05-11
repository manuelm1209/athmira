import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ResultsScreen } from "@/features/analysis/ResultsScreen";

export default function ResultsRoute() {
  return (
    <ProtectedRoute>
      <ResultsScreen />
    </ProtectedRoute>
  );
}
