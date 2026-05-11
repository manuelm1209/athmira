import { ProtectedRoute } from "@/components/ProtectedRoute";
import { BikeListScreen } from "@/features/bikes/BikeListScreen";

export default function BikesRoute() {
  return (
    <ProtectedRoute>
      <BikeListScreen />
    </ProtectedRoute>
  );
}
