import type { BikeType } from "@athmira/types";
import type { ImageSourcePropType } from "react-native";

const bikeImageByType: Record<BikeType, ImageSourcePropType> = {
  road: require("../../assets/bikes/bike-road.jpg"),
  gravel: require("../../assets/bikes/bike-gravel.jpg"),
  triathlon: require("../../assets/bikes/bike-triathlon.jpg"),
  mountain: require("../../assets/bikes/bike-mountain.jpg"),
  hybrid: require("../../assets/bikes/bike-hybrid.jpg")
};

export function getBikeImage(type: BikeType): ImageSourcePropType {
  return bikeImageByType[type] ?? bikeImageByType.road;
}
