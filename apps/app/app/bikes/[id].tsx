import { useLocalSearchParams } from "expo-router";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { BikeFormScreen } from "@/features/bikes/BikeFormScreen";

export default function EditBikeRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ProtectedRoute>
      <BikeFormScreen bikeId={id} />
    </ProtectedRoute>
  );
}
