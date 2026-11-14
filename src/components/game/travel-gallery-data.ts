import { travelGalleryStops } from "./world";
import { travelLocations } from "@/data/travel-data";

/** All six travel entries, arranged along the southern photo walk. */
export const featuredJourneys = [...travelLocations]
  .sort((a, b) => b.date.localeCompare(a.date))
  .map((journey, index) => ({ ...journey, ...travelGalleryStops[index] }));
