import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CameraAnalysisScreen } from "@/features/analysis/CameraAnalysisScreen";

export default function CameraRoute() {
  return (
    <ProtectedRoute>
      <CameraAnalysisScreen />
    </ProtectedRoute>
  );
}
