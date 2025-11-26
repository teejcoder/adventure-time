export type AirportCode = string & { readonly __brand: "AirportCode" };

export type TripType = "one-way" | "round-trip";

export interface RouteSegment {
  flyFrom: string;
  flyTo: string;
  airline: string;
  dTimeUTC: number;
  aTimeUTC: number;
  flightNumber?: string;
  duration?: number; // Duration in seconds
}

export interface Layover {
  airport: string;
  arrivalTime: number; // UTC timestamp
  departureTime: number; // UTC timestamp
  duration: number; // Duration in seconds
}

export interface Itinerary {
  price: number;
  deep_link?: string;
  route: RouteSegment[];
  layovers?: Layover[];
  tripType?: TripType;
  totalDuration?: number; // Total journey duration in seconds
}

export interface SearchRequest {
  origin: AirportCode;
  destination: AirportCode;
  tripType?: TripType;
  date?: string; // ISO date string (YYYY-MM-DD)
  maxStops?: number; // Maximum number of layovers (0 = direct only, 1 = up to 1 stop, etc.)
}

export type SearchResponse =
  | { status: "ok"; itinerary: Itinerary }
  | { status: "error"; code: "INVALID_INPUT" | "NO_RESULTS"; message: string };
