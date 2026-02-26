/**
 * Travel location data for the interactive 3D globe.
 *
 * HOW TO ADD A NEW LOCATION:
 * ──────────────────────────
 * 1. Add an entry to the `travelLocations` array below.
 * 2. Create a matching `.mdx` file in `src/content/travel/` with the same slug.
 *    (See `src/content/travel/_template.mdx` for a full example.)
 *
 * FINDING COORDINATES:
 * ────────────────────
 * 1. Open Google Maps → right-click your destination → "Copy coordinates"
 * 2. Google shows:  23.382, 92.293  (that is latitude, longitude)
 * 3. In this file, coordinates are [LONGITUDE, LATITUDE]:  [92.293, 23.382]
 * 4. Or use https://www.latlong.net/ to look up any place.
 *
 * The globe uses these coordinates to place markers and fly the camera
 * during the auto-tour. The nearest-neighbor algorithm (getTourOrder)
 * automatically finds the best tour path from Dhaka.
 */

export interface TravelLocation {
  /** URL slug — must match the MDX filename in src/content/travel/ */
  slug: string;
  /** Display name of the city/place */
  city: string;
  /** Country name */
  country: string;
  /** [longitude, latitude] — used to position the marker on the 3D globe */
  coordinates: [number, number];
  /** Cover image URL (800×600 recommended for cards, Unsplash works great) */
  coverImage: string;
  /** Short poetic description shown in the floating card */
  description: string;
  /** Date visited in "YYYY-MM-DD" format */
  date: string;
  /** Distance from Dhaka in km (shown on the card) */
  distance: number;
}

export const travelLocations: TravelLocation[] = [
  {
    slug: "sajek-above-the-clouds",
    city: "Sajek Valley",
    country: "Bangladesh",
    coordinates: [92.293, 23.382],
    coverImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    description:
      "A journey where silence spoke louder than words. The clouds beneath us rewrote the meaning of perspective.",
    date: "2026-01-14",
    distance: 320,
  },
  {
    slug: "coxs-bazar-where-the-sea-meets-sky",
    city: "Cox's Bazar",
    country: "Bangladesh",
    coordinates: [91.979, 21.427],
    coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop",
    description:
      "Walking along the world's longest natural sea beach at dawn — where the horizon dissolved the boundary between sea and sky.",
    date: "2025-11-02",
    distance: 414,
  },
  {
    slug: "bandarban-trails-of-silence",
    city: "Bandarban",
    country: "Bangladesh",
    coordinates: [92.218, 22.197],
    coverImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop",
    description:
      "Hill trails that tested endurance and rewarded patience. Every step upward stripped away noise and left clarity.",
    date: "2025-08-20",
    distance: 326,
  },
  {
    slug: "sreemangal-tea-gardens",
    city: "Sreemangal",
    country: "Bangladesh",
    coordinates: [91.729, 24.307],
    coverImage: "https://images.unsplash.com/photo-1587049352846-65f6eda1faff?w=800&h=600&fit=crop",
    description:
      "Endless green carpets of tea, misty mornings, and the gentle rhythm of a town that moves at its own pace.",
    date: "2025-05-10",
    distance: 203,
  },
  {
    slug: "sundarbans-into-the-mangroves",
    city: "Sundarbans",
    country: "Bangladesh",
    coordinates: [89.186, 21.948],
    coverImage: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&h=600&fit=crop",
    description:
      "Drifting through the world's largest mangrove forest — where nature commands respect and silence becomes survival.",
    date: "2025-02-18",
    distance: 350,
  },
  {
    slug: "saint-martin-island-edge-of-bangladesh",
    city: "Saint Martin's Island",
    country: "Bangladesh",
    coordinates: [92.323, 20.627],
    coverImage: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=800&h=600&fit=crop",
    description:
      "The southernmost tip of Bangladesh. Crystal waters, coral reefs, and starlit skies that felt infinite.",
    date: "2024-12-05",
    distance: 450,
  },
];

/** Home base coordinates (Dhaka) */
export const HOME_COORDINATES: [number, number] = [90.4125, 23.8103];

/** Computed travel stats */
export function getTravelStats() {
  const countries = new Set(travelLocations.map((l) => l.country));
  const totalDistance = travelLocations.reduce((sum, l) => sum + l.distance, 0);

  return {
    placesVisited: travelLocations.length,
    countriesExplored: countries.size,
    totalDistance,
    storiesWritten: travelLocations.length,
  };
}

/** Haversine distance between two [lon, lat] points in km */
function haversine(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Returns travel locations ordered by nearest-neighbor starting from Dhaka.
 * This creates a natural "tour" path from one location to the closest next.
 */
export function getTourOrder(): TravelLocation[] {
  const remaining = [...travelLocations];
  const ordered: TravelLocation[] = [];
  let current: [number, number] = HOME_COORDINATES;

  while (remaining.length > 0) {
    let nearest = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversine(current, remaining[i].coordinates);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    }
    const next = remaining.splice(nearest, 1)[0];
    ordered.push(next);
    current = next.coordinates;
  }

  return ordered;
}
