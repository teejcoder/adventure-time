import { NextResponse } from "next/server";
import { fetchFlights } from "../../../lib/api/rapid";
import { findCheapestItinerary } from "../../../lib/logic/find-cheapest";
import { validateSearch } from "../../../lib/validation/search";
import { SearchResponse } from "../../../lib/types/flights";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { origin, destination, tripType = "one-way", date } = body;

        if (typeof origin !== "string" || typeof destination !== "string") {
            const response: SearchResponse = {
                status: "error",
                code: "INVALID_INPUT",
                message: "Origin and destination are required strings.",
            };
            return NextResponse.json(response, { status: 400 });
        }

        const validation = validateSearch(origin, destination);
        if (!validation.valid) {
            const response: SearchResponse = {
                status: "error",
                code: "INVALID_INPUT",
                message: validation.message,
            };
            return NextResponse.json(response, { status: 400 });
        }

        console.log(`[Search API] Searching flights: ${validation.origin} -> ${validation.destination}, tripType: ${tripType}, date: ${date || 'anytime'}`);

        const apiData = await fetchFlights(validation.origin, validation.destination, tripType, date);
        const cheapest = findCheapestItinerary(apiData);

        if (!cheapest) {
            const response: SearchResponse = {
                status: "error",
                code: "NO_RESULTS",
                message: "No flights found for this route.",
            };
            return NextResponse.json(response, { status: 404 });
        }

        // Add tripType to the itinerary
        cheapest.tripType = tripType as "one-way" | "round-trip";

        const response: SearchResponse = {
            status: "ok",
            itinerary: cheapest,
        };
        return NextResponse.json(response, { status: 200 });

    } catch (error) {
        console.error("Search API error:", error);
        return NextResponse.json(
            { status: "error", code: "INTERNAL_ERROR", message: "An unexpected error occurred." },
            { status: 500 }
        );
    }
}
