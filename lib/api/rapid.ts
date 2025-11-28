import { AirportCode, Itinerary, RouteSegment, Layover } from "../types/flights";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST;

const MAJOR_HUBS = [
    "LHR", "CDG", "FRA", "AMS", "DXB", "JFK", "LAX", "SIN", "HKG", "HND",
    "NRT", "IST", "DOH", "SYD", "MEL", "BKK", "ICN", "KUL", "MUC", "ZRH"
];

// Map city codes to their airport codes for multi-airport cities
const CITY_AIRPORTS: Record<string, string[]> = {
    "LDN": ["LHR", "LGW", "STN", "LTN", "LCY"], // London
    "NYC": ["JFK", "LGA", "EWR"], // New York
    "TYO": ["NRT", "HND"], // Tokyo
    "PAR": ["CDG", "ORY"], // Paris
    "LON": ["LHR", "LGW", "STN", "LTN", "LCY"], // London (alternative)
    "CHI": ["ORD", "MDW"], // Chicago
    "MIL": ["MXP", "LIN", "BGY"], // Milan
    "BUE": ["EZE", "AEP"], // Buenos Aires
    "SAO": ["GRU", "CGH", "VCP"], // São Paulo
    "BKK": ["BKK", "DMK"], // Bangkok
    "JKT": ["CGK", "HLP"], // Jakarta
    "OSA": ["KIX", "ITM"], // Osaka
    "STO": ["ARN", "BMA", "NYO"], // Stockholm
    "MOW": ["SVO", "DME", "VKO"], // Moscow
};

interface AeroDataBoxFlight {
    departure: {
        airport?: {
            iata?: string;
            name?: string;
        };
        scheduledTime?: {
            utc?: string;
        };
    };
    arrival: {
        airport?: {
            iata?: string;
            name?: string;
        };
        scheduledTime?: {
            utc?: string;
        };
    };
    number: string;
    airline: {
        name: string;
    };
    codeshareStatus?: string;
}

interface AeroDataBoxResponse {
    departures?: AeroDataBoxFlight[];
    arrivals?: AeroDataBoxFlight[];
}

async function fetchDepartures(airport: string, date?: string): Promise<AeroDataBoxFlight[]> {
    if (!RAPIDAPI_KEY || !RAPIDAPI_HOST) {
        throw new Error("Missing required environment variables: RAPIDAPI_KEY and RAPIDAPI_HOST must be defined");
    }

    const now = new Date();
    let offsetMinutes = 0;
    let durationMinutes = 720; // 12 hours window

    if (date) {
        const targetDate = new Date(date + 'T12:00:00Z');
        const targetTime = targetDate.getTime();
        const currentTime = now.getTime();
        offsetMinutes = Math.floor((targetTime - currentTime) / (1000 * 60));
        offsetMinutes -= 360;
        durationMinutes = 720;
    }

    const url = `https://${RAPIDAPI_HOST}/flights/airports/iata/${airport}?offsetMinutes=${offsetMinutes}&durationMinutes=${durationMinutes}&withLeg=true&direction=Departure&withCancelled=false&withCodeshared=false&withCargo=false&withPrivate=false&withLocation=false`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "x-rapidapi-key": RAPIDAPI_KEY,
                "x-rapidapi-host": RAPIDAPI_HOST,
            },
        });

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error("API_RATE_LIMIT_EXCEEDED");
            }
            // If 404 or other error, just return empty to avoid breaking the whole flow
            console.warn(`[AeroDataBox API] Failed to fetch departures for ${airport}: ${response.status}`);
            return [];
        }

        const data: AeroDataBoxResponse = await response.json();
        return data.departures || [];
    } catch (error: any) {
        if (error.message === "API_RATE_LIMIT_EXCEEDED") {
            throw error;
        }
        console.error(`[AeroDataBox API] Error fetching departures for ${airport}:`, error);
        return [];
    }
}

/**
 * Check if an airport matches the destination, considering city codes.
 * For example, LHR matches both "LHR" and "LDN" (London city code).
 */
function airportMatchesDestination(airportCode: string | undefined, destination: string): boolean {
    if (!airportCode) return false;

    // Direct match
    if (airportCode === destination) return true;

    // Check if destination is a city code and airport is one of its airports
    const cityAirports = CITY_AIRPORTS[destination];
    if (cityAirports && cityAirports.includes(airportCode)) {
        return true;
    }

    return false;
}

export async function fetchFlights(origin: AirportCode, destination: AirportCode, tripType: string = "one-way", date?: string) {
    console.log(`[Flight Search] ${origin} -> ${destination} (${tripType})`);

    // 1. Fetch departures from Origin
    let originDepartures;
    try {
        originDepartures = await fetchDepartures(origin, date);
    } catch (error: any) {
        if (error.message === "API_RATE_LIMIT_EXCEEDED") {
            console.warn(`[Flight Search] Rate limit exceeded. Returning mock data for ${origin} -> ${destination}`);
            return { data: getMockItineraries(origin, destination, tripType) };
        }
        throw error;
    }

    // 2. Find Direct Flights
    const directFlights = originDepartures.filter(flight =>
        airportMatchesDestination(flight.arrival?.airport?.iata, destination)
    );

    let itineraries: any[] = [];

    // Helper to create itinerary from flight segments
    const createItinerary = (segments: AeroDataBoxFlight[]) => {
        const firstLeg = segments[0];
        const lastLeg = segments[segments.length - 1];

        const dTimeUTC = firstLeg.departure.scheduledTime?.utc
            ? new Date(firstLeg.departure.scheduledTime.utc).getTime() / 1000
            : Math.floor(Date.now() / 1000);

        const aTimeUTC = lastLeg.arrival.scheduledTime?.utc
            ? new Date(lastLeg.arrival.scheduledTime.utc).getTime() / 1000
            : dTimeUTC + 7200 * segments.length;

        const duration = aTimeUTC - dTimeUTC;

        // Price calculation
        let basePrice = 150 * segments.length; // More expensive for multi-leg
        const durationFactor = (duration / 3600) * 30;
        const randomVariance = Math.random() * 200;
        let price = Math.floor(basePrice + durationFactor + randomVariance);

        if (tripType === "round-trip") {
            price = Math.floor(price * 1.85 + Math.random() * 100);
        }

        const route = segments.map(flight => ({
            flyFrom: flight.departure.airport?.iata || "UNK",
            flyTo: flight.arrival.airport?.iata || "UNK",
            airline: flight.airline.name,
            dTimeUTC: flight.departure.scheduledTime?.utc ? new Date(flight.departure.scheduledTime.utc).getTime() / 1000 : 0,
            aTimeUTC: flight.arrival.scheduledTime?.utc ? new Date(flight.arrival.scheduledTime.utc).getTime() / 1000 : 0,
        }));

        // Calculate layovers between segments
        const layovers = [];
        for (let i = 0; i < segments.length - 1; i++) {
            const currentSegment = segments[i];
            const nextSegment = segments[i + 1];

            const arrivalTime = currentSegment.arrival.scheduledTime?.utc
                ? new Date(currentSegment.arrival.scheduledTime.utc).getTime() / 1000
                : 0;

            const departureTime = nextSegment.departure.scheduledTime?.utc
                ? new Date(nextSegment.departure.scheduledTime.utc).getTime() / 1000
                : 0;

            const layoverDuration = departureTime - arrivalTime;

            layovers.push({
                airport: currentSegment.arrival.airport?.iata || "UNK",
                arrivalTime,
                departureTime,
                duration: layoverDuration,
            });
        }

        // Booking link
        const bookingParams = segments.map(s => `${s.airline.name}+${s.number}`).join("+");
        const deep_link = `https://www.google.com/search?q=flight+${bookingParams}+${origin}+${destination}`;

        return {
            price,
            deep_link,
            route,
            layovers: layovers.length > 0 ? layovers : undefined,
            duration: duration,
            totalDuration: duration,
            stops: segments.length - 1,
            airline: segments[0].airline.name,
        };
    };

    // Add direct flights
    itineraries = [...itineraries, ...directFlights.map(f => createItinerary([f]))];

    // 3. If no direct flights (or few), try Multi-Leg via Hubs
    if (itineraries.length === 0) {
        console.log(`[Flight Search] No direct flights found. Trying multi-leg routes...`);

        // Identify potential hubs: Flights from Origin that go to a Major Hub
        const hubCandidates = originDepartures.filter(flight =>
            MAJOR_HUBS.includes(flight.arrival?.airport?.iata || "")
        ).slice(0, 5); // Limit to top 5 to save API calls

        console.log(`[Flight Search] Found ${hubCandidates.length} potential hubs: ${hubCandidates.map(f => f.arrival?.airport?.iata).join(", ")}`);

        // Fetch departures from these hubs in parallel
        const hubPromises = hubCandidates.map(async (leg1) => {
            const hubIata = leg1.arrival?.airport?.iata;
            if (!hubIata) return null;

            const hubDepartures = await fetchDepartures(hubIata, date);
            console.log(`[Flight Search] Hub ${hubIata}: Found ${hubDepartures.length} departures`);

            // Find flights from Hub -> Destination
            const leg2Flights = hubDepartures.filter(flight =>
                airportMatchesDestination(flight.arrival?.airport?.iata, destination)
            );
            console.log(`[Flight Search] Hub ${hubIata}: Found ${leg2Flights.length} flights to ${destination}`);

            // Filter for valid connection time (Leg 2 departs > Leg 1 arrives + 1 hour)
            const validConnections = leg2Flights.filter(leg2 => {
                const arr1 = leg1.arrival.scheduledTime?.utc ? new Date(leg1.arrival.scheduledTime.utc).getTime() : 0;
                const dep2 = leg2.departure.scheduledTime?.utc ? new Date(leg2.departure.scheduledTime.utc).getTime() : 0;
                return dep2 > arr1 + 3600 * 1000; // At least 1 hour layover
            });
            console.log(`[Flight Search] Hub ${hubIata}: Found ${validConnections.length} valid connections`);

            if (validConnections.length > 0) {
                // Return the best connection (just the first one for now)
                return createItinerary([leg1, validConnections[0]]);
            }
            return null;
        });

        const multiLegResults = await Promise.all(hubPromises);
        const validMultiLegs = multiLegResults.filter(r => r !== null);

        itineraries = [...itineraries, ...validMultiLegs];
    }

    console.log(`[Flight Search] Returning ${itineraries.length} itineraries`);
    return { data: itineraries };
}

function getMockItineraries(origin: string, destination: string, tripType: string): Itinerary[] {
    const mockAirlines = ["Qantas", "United Airlines", "British Airways", "Emirates", "Singapore Airlines"];
    const now = Math.floor(Date.now() / 1000);
    const daySeconds = 86400;

    const generateFlight = (index: number): Itinerary => {
        const airline = mockAirlines[index % mockAirlines.length];
        const departureTime = now + (index * 3600 * 2) + (Math.random() * 3600);
        const duration = 14 * 3600; // Approx 14 hours
        const arrivalTime = departureTime + duration;

        const price = 800 + (index * 50) + Math.floor(Math.random() * 200);

        const route: RouteSegment[] = [
            {
                flyFrom: origin,
                flyTo: destination,
                airline: airline,
                dTimeUTC: departureTime,
                aTimeUTC: arrivalTime,
                flightNumber: `${airline.substring(0, 2).toUpperCase()}${100 + index}`,
                duration: duration
            }
        ];

        return {
            price,
            deep_link: `https://www.google.com/search?q=flight+${origin}+${destination}`,
            route,
            tripType: tripType as any,
            totalDuration: duration,
            duration: duration,
            stops: 0,
            airline: airline
        };
    };

    return Array.from({ length: 5 }, (_, i) => generateFlight(i));
}
