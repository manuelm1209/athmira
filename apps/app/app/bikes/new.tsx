import { ProtectedRoute } from "@/components/ProtectedRoute";
import { BikeFormScreen } from "@/features/bikes/BikeFormScreen";

export default function NewBikeRoute() {
  return (
    <ProtectedRoute>
      <BikeFormScreen />
    </ProtectedRoute>
  );
}
