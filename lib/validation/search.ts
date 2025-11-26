import { AirportCode } from "../types/flights";

export function validateSearch(
    origin: string,
    destination: string
): { valid: true; origin: AirportCode; destination: AirportCode } | { valid: false; message: string } {
    const cleanOrigin = origin.trim().toUpperCase();
    const cleanDest = destination.trim().toUpperCase();

    if (cleanOrigin.length !== 3) {
        return { valid: false, message: "Origin must be a 3-letter IATA code." };
    }
    if (cleanDest.length !== 3) {
        return { valid: false, message: "Destination must be a 3-letter IATA code." };
    }
    if (cleanOrigin === cleanDest) {
        return { valid: false, message: "Origin and destination must be different." };
    }

    // Basic regex check for letters only
    if (!/^[A-Z]{3}$/.test(cleanOrigin)) {
        return { valid: false, message: "Origin must contain only letters." };
    }
    if (!/^[A-Z]{3}$/.test(cleanDest)) {
        return { valid: false, message: "Destination must contain only letters." };
    }

    return {
        valid: true,
        origin: cleanOrigin as AirportCode,
        destination: cleanDest as AirportCode,
    };
}
