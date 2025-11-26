import { AirportCode } from "../types/flights";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST;

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

export async function fetchFlights(origin: AirportCode, destination: AirportCode, tripType: string = "one-way", date?: string) {
    // AeroDataBox doesn't have a direct "search flights between A and B" endpoint
    // We'll fetch departures from origin and filter for flights to destination

    // Validate environment variables
    if (!RAPIDAPI_KEY || !RAPIDAPI_HOST) {
        throw new Error("Missing required environment variables: RAPIDAPI_KEY and RAPIDAPI_HOST must be defined");
    }

    const now = new Date();
    let offsetMinutes = 0;
    let durationMinutes = 720; // 12 hours window (API maximum)

    // If a date is provided, calculate the time window for that date
    if (date) {
        // Parse the date (YYYY-MM-DD) and set to noon UTC for that day
        const targetDate = new Date(date + 'T12:00:00Z');
        const targetTime = targetDate.getTime();
        const currentTime = now.getTime();

        // Calculate offset in minutes from now to the target date
        offsetMinutes = Math.floor((targetTime - currentTime) / (1000 * 60));

        // Search window: ±12 hours from noon (covers the full day)
        // But we need to adjust to stay within API limits
        // We'll search from 6 hours before to 6 hours after noon
        offsetMinutes -= 360; // Start 6 hours before noon
        durationMinutes = 720; // 12 hours total (6 hours before + 6 hours after)
    }

    const url = `https://${RAPIDAPI_HOST}/flights/airports/iata/${origin}?offsetMinutes=${offsetMinutes}&durationMinutes=${durationMinutes}&withLeg=true&direction=Departure&withCancelled=false&withCodeshared=false&withCargo=false&withPrivate=false&withLocation=false`;

    console.log(`[AeroDataBox API] Fetching flights from ${origin} to ${destination}, tripType: ${tripType}, offsetMinutes: ${offsetMinutes}, durationMinutes: ${durationMinutes}`);

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "x-rapidapi-key": RAPIDAPI_KEY,
                "x-rapidapi-host": RAPIDAPI_HOST,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AeroDataBox API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data: AeroDataBoxResponse = await response.json();

        // Filter flights going to destination
        const departures = data.departures || [];
        const relevantFlights = departures.filter(flight =>
            flight.arrival?.airport?.iata === destination
        );

        console.log(`[AeroDataBox API] Found ${departures.length} total departures, ${relevantFlights.length} flights to ${destination}`);

        // Transform to our expected format with mock pricing
        const itineraries = relevantFlights.map(flight => {
            const dTimeUTC = flight.departure.scheduledTime?.utc
                ? new Date(flight.departure.scheduledTime.utc).getTime() / 1000
                : Math.floor(Date.now() / 1000);

            const aTimeUTC = flight.arrival.scheduledTime?.utc
                ? new Date(flight.arrival.scheduledTime.utc).getTime() / 1000
                : dTimeUTC + 7200; // Default 2 hour flight

            // Generate realistic price based on airline and flight duration
            const duration = aTimeUTC - dTimeUTC;
            const basePrice = 150;
            const durationFactor = (duration / 3600) * 30; // $30 per hour
            const randomVariance = Math.random() * 200;
            let price = Math.floor(basePrice + durationFactor + randomVariance);

            // For round-trip, approximately double the price with some variance
            if (tripType === "round-trip") {
                price = Math.floor(price * 1.85 + Math.random() * 100);
            }

            // Generate booking link - for round-trip, add return flight parameters
            const bookingParams = tripType === "round-trip"
                ? `${flight.airline.name}+flight+${flight.number}+round+trip+${origin}+${destination}`
                : `${flight.airline.name}+flight+${flight.number}`;
            const deep_link = `https://www.google.com/search?q=${bookingParams}`;

            return {
                price: price,
                deep_link: deep_link,
                route: [
                    {
                        flyFrom: origin,
                        flyTo: destination,
                        airline: flight.airline.name,
                        dTimeUTC: dTimeUTC,
                        aTimeUTC: aTimeUTC,
                    },
                ],
            };
        });

        return { data: itineraries };

    } catch (error) {
        console.error("Failed to fetch flights from AeroDataBox:", error);
        throw error;
    }
}
