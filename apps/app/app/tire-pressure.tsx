import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TirePressureScreen } from "@/features/tire-pressure/TirePressureScreen";

export default function TirePressureRoute() {
  return (
    <ProtectedRoute>
      <TirePressureScreen />
    </ProtectedRoute>
  );
}
