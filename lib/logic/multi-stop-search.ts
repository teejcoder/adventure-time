import { AirportCode, Itinerary, RouteSegment, Layover } from "../types/flights";

// Major international hub airports for connection searches
export const HUB_AIRPORTS = [
    "DXB", // Dubai
    "IST", // Istanbul
    "DOH", // Doha
    "AMS", // Amsterdam
    "FRA", // Frankfurt
    "CDG", // Paris
    "LHR", // London Heathrow
    "MAD", // Madrid
    "FCO", // Rome
    "MUC", // Munich
    "JFK", // New York JFK
    "ORD", // Chicago
    "DFW", // Dallas
    "ATL", // Atlanta
    "LAX", // Los Angeles
    "SFO", // San Francisco
    "SIN", // Singapore
    "HKG", // Hong Kong
    "ICN", // Seoul
    "NRT", // Tokyo Narita
    "BKK", // Bangkok
    "KUL", // Kuala Lumpur
] as const;

// Layover time constraints (in seconds)
const MIN_LAYOVER_TIME = 45 * 60; // 45 minutes minimum
const MAX_LAYOVER_TIME = 24 * 60 * 60; // 24 hours maximum
const IDEAL_MIN_LAYOVER = 90 * 60; // 90 minutes ideal minimum for international

export interface ConnectionInfo {
    isValid: boolean;
    layoverDuration?: number;
    reason?: string;
}

/**
 * Validates if two flight segments can be connected
 */
export function validateConnection(
    firstSegment: RouteSegment,
    secondSegment: RouteSegment
): ConnectionInfo {
    // Check if the arrival airport of first segment matches departure of second
    if (firstSegment.flyTo !== secondSegment.flyFrom) {
        return {
            isValid: false,
            reason: "Airports don't match"
        };
    }

    // Calculate layover time
    const layoverDuration = secondSegment.dTimeUTC - firstSegment.aTimeUTC;

    // Check minimum layover time
    if (layoverDuration < MIN_LAYOVER_TIME) {
        return {
            isValid: false,
            layoverDuration,
            reason: `Layover too short (${Math.floor(layoverDuration / 60)} minutes)`
        };
    }

    // Check maximum layover time
    if (layoverDuration > MAX_LAYOVER_TIME) {
        return {
            isValid: false,
            layoverDuration,
            reason: `Layover too long (${Math.floor(layoverDuration / 3600)} hours)`
        };
    }

    return {
        isValid: true,
        layoverDuration
    };
}

/**
 * Combines flight segments into a complete itinerary
 */
export function combineSegments(
    segments: RouteSegment[],
    tripType: "one-way" | "round-trip" = "one-way"
): Itinerary | null {
    if (segments.length === 0) {
        return null;
    }

    // Validate all connections
    const layovers: Layover[] = [];
    for (let i = 0; i < segments.length - 1; i++) {
        const connection = validateConnection(segments[i], segments[i + 1]);
        if (!connection.isValid) {
            console.log(`Invalid connection between segment ${i} and ${i + 1}: ${connection.reason}`);
            return null;
        }

        layovers.push({
            airport: segments[i].flyTo,
            arrivalTime: segments[i].aTimeUTC,
            departureTime: segments[i + 1].dTimeUTC,
            duration: connection.layoverDuration!
        });
    }

    // Calculate total price (sum of all segment prices with some markup for connections)
    const basePrice = segments.reduce((sum, segment) => {
        // Estimate price per segment based on duration
        const duration = segment.aTimeUTC - segment.dTimeUTC;
        const hours = duration / 3600;
        return sum + (150 + hours * 30 + Math.random() * 100);
    }, 0);

    // Add connection fee per layover
    const connectionFees = layovers.length * 50;
    let totalPrice = Math.floor(basePrice + connectionFees);

    // For round-trip, approximately double with variance
    if (tripType === "round-trip") {
        totalPrice = Math.floor(totalPrice * 1.85 + Math.random() * 100);
    }

    // Calculate total journey duration
    const totalDuration = segments[segments.length - 1].aTimeUTC - segments[0].dTimeUTC;

    // Generate booking link
    const routeDescription = segments.map(s => `${s.flyFrom}-${s.flyTo}`).join("+");
    const deep_link = `https://www.google.com/search?q=flights+${routeDescription}`;

    return {
        price: totalPrice,
        deep_link,
        route: segments,
        layovers: layovers.length > 0 ? layovers : undefined,
        tripType,
        totalDuration
    };
}

/**
 * Filters hub airports to exclude origin and destination
 */
export function getRelevantHubs(origin: AirportCode, destination: AirportCode): string[] {
    return HUB_AIRPORTS.filter(hub => hub !== origin && hub !== destination);
}

/**
 * Calculates a priority score for a hub based on geographic logic
 * (This is a simplified heuristic - in production, you'd use actual geographic data)
 */
export function calculateHubPriority(
    origin: AirportCode,
    hub: string,
    destination: AirportCode
): number {
    // Major international hubs get higher priority
    const majorHubs = ["DXB", "IST", "DOH", "AMS", "FRA", "LHR", "SIN"];
    let score = majorHubs.includes(hub) ? 10 : 5;

    // Simple geographic heuristic based on airport codes
    // This is very simplified - in production, use actual coordinates
    const isEuropeanHub = ["AMS", "FRA", "CDG", "LHR", "MAD", "FCO", "MUC"].includes(hub);
    const isUSHub = ["JFK", "ORD", "DFW", "ATL", "LAX", "SFO"].includes(hub);
    const isAsianHub = ["SIN", "HKG", "ICN", "NRT", "BKK", "KUL"].includes(hub);
    const isMiddleEastHub = ["DXB", "IST", "DOH"].includes(hub);

    // Boost score if hub is geographically between origin and destination
    // This is a very rough heuristic
    if (isEuropeanHub) {
        if ((origin.startsWith("L") || destination.startsWith("L")) ||
            (origin.startsWith("E") || destination.startsWith("E"))) {
            score += 5;
        }
    }

    return score;
}

/**
 * Sorts hubs by priority for more efficient searching
 */
export function prioritizeHubs(
    origin: AirportCode,
    destination: AirportCode,
    hubs: string[]
): string[] {
    return hubs
        .map(hub => ({
            hub,
            priority: calculateHubPriority(origin, hub, destination)
        }))
        .sort((a, b) => b.priority - a.priority)
        .map(item => item.hub);
}
