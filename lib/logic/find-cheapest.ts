import { Itinerary, RouteSegment } from "../types/flights";

interface ApiResponse {
    data: Array<{
        price: number;
        deep_link?: string;
        route: Array<{
            flyFrom: string;
            flyTo: string;
            airline: string;
            dTimeUTC: number;
            aTimeUTC: number;
        }>;
    }>;
}

export function findCheapestItinerary(apiResponse: ApiResponse): Itinerary | null {
    if (!apiResponse || !Array.isArray(apiResponse.data) || apiResponse.data.length === 0) {
        return null;
    }

    let cheapest: Itinerary | null = null;

    for (const item of apiResponse.data) {
        if (typeof item.price !== "number" || !Array.isArray(item.route)) {
            continue;
        }

        const route: RouteSegment[] = item.route.map((r) => ({
            flyFrom: r.flyFrom,
            flyTo: r.flyTo,
            airline: r.airline,
            dTimeUTC: r.dTimeUTC,
            aTimeUTC: r.aTimeUTC,
        }));

        const itinerary: Itinerary = {
            price: item.price,
            deep_link: item.deep_link,
            route,
        };

        if (cheapest === null || itinerary.price < cheapest.price) {
            cheapest = itinerary;
        }
    }

    return cheapest;
}
