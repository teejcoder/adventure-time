"use client";

import { useState } from "react";
import { SearchResponse, Itinerary, TripType } from "../lib/types/flights";
import { formatCurrency, formatTime } from "../lib/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plane, ArrowRight, AlertCircle, Loader2, MapPin, Compass, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Helper function to format duration
function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours === 0) {
        return `${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
}

export function CheapestFlightSearch() {
    const [origin, setOrigin] = useState("");
    const [destination, setDestination] = useState("");
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<Itinerary | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        // 1. Check Rate Limit (5 requests per minute)
        const now = Date.now();
        const rateLimitKey = "flight_search_timestamps";
        const timestampsStr = localStorage.getItem(rateLimitKey);
        let timestamps: number[] = timestampsStr ? JSON.parse(timestampsStr) : [];

        // Filter out timestamps older than 1 minute
        timestamps = timestamps.filter(t => now - t < 60000);

        if (timestamps.length >= 5) {
            setLoading(false);
            setError("Rate limit exceeded. Please wait a moment before searching again.");
            return;
        }

        // 2. Check Cache
        const dateStr = date ? format(date, "yyyy-MM-dd") : "anytime";
        const cacheKey = `search_${origin}_${destination}_${dateStr}`;
        const cachedDataStr = localStorage.getItem(cacheKey);
        if (cachedDataStr) {
            const cached = JSON.parse(cachedDataStr);
            // Cache valid for 10 minutes
            if (now - cached.timestamp < 600000) {
                setResult(cached.data);
                setLoading(false);
                return;
            }
        }

        try {
            // Record new request timestamp
            timestamps.push(now);
            localStorage.setItem(rateLimitKey, JSON.stringify(timestamps));

            const res = await fetch("/api/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    origin,
                    destination,
                    date: date ? format(date, "yyyy-MM-dd") : undefined
                }),
            });

            const data: SearchResponse = await res.json();

            if (res.ok && data.status === "ok") {
                setResult(data.itinerary);
                // Save to cache
                localStorage.setItem(cacheKey, JSON.stringify({
                    timestamp: now,
                    data: data.itinerary
                }));
            } else if (data.status === "error") {
                setError(data.message);
            } else {
                setError("An unexpected error occurred.");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 p-2 sm:p-4">
            {/* Search Card */}
            <Card className="gradient-card shadow-2xl overflow-hidden border-0 ring-1 ring-purple-100">
                <CardContent className="p-4 sm:p-6 md:p-10">
                    <form onSubmit={handleSearch} className="space-y-6 sm:space-y-8 md:space-y-10" role="search" aria-label="Flight search form">
                        {/* Flight Details Fieldset */}
                        <fieldset className="border-0 p-0 m-0">
                            <legend className="sr-only">Flight search details</legend>

                            {/* Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                                {/* Origin */}
                                <div className="space-y-2 sm:space-y-3">
                                    <Label htmlFor="origin-input" className="text-purple-900 font-black uppercase tracking-widest text-xs ml-1">From (airport)</Label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5 sm:w-6 sm:h-6 group-focus-within:text-purple-600 transition-colors" aria-hidden="true" />
                                        <Input
                                            id="origin-input"
                                            value={origin}
                                            onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                                            placeholder="LAX"
                                            maxLength={3}
                                            required
                                            aria-required="true"
                                            aria-label="Origin airport code"
                                            className="bg-white border-2 border-purple-100 text-purple-900 placeholder:text-purple-200 text-center text-xl sm:text-2xl md:text-3xl font-black h-14 sm:h-16 md:h-20 rounded-2xl sm:rounded-3xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all pl-10 sm:pl-12 shadow-sm hover:border-purple-200"
                                        />
                                    </div>
                                </div>

                                {/* Destination */}
                                <div className="space-y-2 sm:space-y-3">
                                    <Label htmlFor="destination-input" className="text-purple-900 font-black uppercase tracking-widest text-xs ml-1">To</Label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5 sm:w-6 sm:h-6 group-focus-within:text-purple-600 transition-colors" aria-hidden="true" />
                                        <Input
                                            id="destination-input"
                                            value={destination}
                                            onChange={(e) => setDestination(e.target.value.toUpperCase())}
                                            placeholder="JFK"
                                            maxLength={3}
                                            required
                                            aria-required="true"
                                            aria-label="Destination airport code"
                                            className="bg-white border-2 border-purple-100 text-purple-900 placeholder:text-purple-200 text-center text-xl sm:text-2xl md:text-3xl font-black h-14 sm:h-16 md:h-20 rounded-2xl sm:rounded-3xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all pl-10 sm:pl-12 shadow-sm hover:border-purple-200"
                                        />
                                    </div>
                                </div>

                                {/* Date */}
                                <div className="space-y-2 sm:space-y-3 mb-6">
                                    <Label htmlFor="date-picker" className="text-purple-900 font-black uppercase tracking-widest text-xs ml-1">Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                id="date-picker"
                                                variant="outline"
                                                aria-label={date ? `Selected date: ${format(date, "MMMM d, yyyy")}` : "Select travel date"}
                                                className={cn(
                                                    "w-full h-14 sm:h-16 md:h-20 bg-white border-2 border-purple-100 text-purple-900 hover:bg-purple-50 hover:border-purple-200 rounded-2xl sm:rounded-3xl text-base sm:text-lg md:text-xl font-bold justify-start px-4 sm:px-6 shadow-sm group",
                                                    !date && "text-purple-300"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 sm:mr-4 h-5 w-5 sm:h-6 sm:w-6 text-purple-400 group-hover:text-purple-600 transition-colors" aria-hidden="true" />
                                                {date ? format(date, "MMM d, yyyy") : "Anytime"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-white border-2 border-purple-100 shadow-xl rounded-2xl">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={setDate}
                                                initialFocus
                                                className="p-4"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </fieldset>

                        {/* Search Button */}
                        <Button
                            type="submit"
                            disabled={loading}
                            aria-label="Search for flights"
                            className="w-full h-16 sm:h-20 md:h-24 bg-purple-900 hover:bg-black text-white text-xl sm:text-2xl md:text-3xl font-black rounded-2xl sm:rounded-3xl shadow-2xl hover:shadow-purple-900/25 transition-all transform hover:scale-[1.01] active:scale-[0.99] min-h-[44px]"
                        >
                            {loading ? (
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 animate-spin text-purple-400" aria-hidden="true" />
                                    <span>Searching...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <Plane className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" aria-hidden="true" />
                                    <span>FIND FLIGHTS</span>
                                </div>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Error */}
            {error && (
                <Alert variant="destructive" role="alert" aria-live="assertive" className="bg-red-50 border-2 border-red-100 text-red-900 rounded-2xl shadow-lg">
                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" aria-hidden="true" />
                    <AlertTitle className="font-black text-base sm:text-lg">Error</AlertTitle>
                    <AlertDescription className="font-medium text-sm sm:text-base md:text-lg">{error}</AlertDescription>
                </Alert>
            )}

            {/* Results */}
            {result && (
                <article className="gradient-card shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 border-0 ring-1 ring-purple-100 rounded-xl" role="region" aria-live="polite" aria-label="Flight search results">
                    {/* Header */}
                    <header className="p-4 sm:p-6 md:p-10 border-b border-purple-100 bg-white/50">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 md:gap-8">
                            <div className="text-center md:text-left">
                                <h2 className="text-xs sm:text-sm font-black text-purple-600 uppercase tracking-widest mb-2 sm:mb-3">Best Price Found</h2>
                                <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-purple-900 tracking-tighter" aria-label={`Price: ${formatCurrency(result.price)}`}>
                                    {formatCurrency(result.price)}
                                </div>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 md:gap-4 mt-3 sm:mt-4 text-purple-900/60 font-bold text-sm sm:text-base md:text-lg">
                                    <span className="bg-purple-100 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-black uppercase text-purple-700">{result.airline}</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span>{result.stops === 0 ? "Direct" : `${result.stops} Stop${result.stops! > 1 ? 's' : ''}`}</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span>{formatDuration(result.totalDuration || result.duration || 0)}</span>
                                </div>
                            </div>
                            {result.deep_link && (
                                <Button asChild className="h-14 sm:h-16 md:h-20 px-6 sm:px-8 md:px-10 bg-purple-600 hover:bg-purple-700 text-white font-black text-lg sm:text-xl md:text-2xl rounded-2xl shadow-xl transition-all hover:scale-105 hover:rotate-1 min-h-[44px] w-full md:w-auto">
                                    <a href={result.deep_link} target="_blank" rel="noopener noreferrer" aria-label="Book this flight on external site">
                                        Book Now <ArrowRight className="ml-2 sm:ml-3 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" aria-hidden="true" />
                                    </a>
                                </Button>
                            )}
                        </div>
                    </header>

                    {/* Segments */}
                    <div className="p-4 sm:p-6 md:p-10 space-y-6 sm:space-y-8 md:space-y-10">
                        {result.route.map((segment, index) => (
                            <section key={index} className="relative" aria-label={`Flight segment ${index + 1} from ${segment.flyFrom} to ${segment.flyTo}`}>
                                {/* Connector Line */}
                                {index < result.route.length - 1 && (
                                    <div className="absolute left-[1.75rem] sm:left-[2.25rem] md:left-[2.75rem] top-14 sm:top-16 md:top-20 bottom-0 w-0.5 sm:w-1 bg-purple-100 h-20 sm:h-28 md:h-32" aria-hidden="true"></div>
                                )}

                                <div className="flex gap-3 sm:gap-6 md:gap-8 items-start">
                                    {/* Icon */}
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl bg-white flex items-center justify-center border-2 sm:border-4 border-purple-50 shadow-lg shrink-0 z-10">
                                        <Plane className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-purple-600" aria-hidden="true" />
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 space-y-3 sm:space-y-4 md:space-y-6 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4">
                                            <div className="min-w-0">
                                                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-purple-900 tracking-tight break-words">{segment.flyFrom} → {segment.flyTo}</h3>
                                                <p className="text-purple-500 font-bold text-sm sm:text-base md:text-lg lg:text-xl mt-1">{segment.airline}</p>
                                            </div>
                                            <div className="text-left sm:text-right shrink-0">
                                                <div className="text-purple-900 font-mono text-base sm:text-lg md:text-xl lg:text-2xl font-bold bg-purple-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl inline-block" aria-label={`Flight duration: ${formatDuration(segment.duration || (segment.aTimeUTC - segment.dTimeUTC))}`}>{formatDuration(segment.duration || (segment.aTimeUTC - segment.dTimeUTC))}</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-6 border border-purple-50 sm:border-2 shadow-sm">
                                            <div>
                                                <div className="text-[10px] sm:text-xs text-purple-400 uppercase font-black tracking-widest mb-1">Departure</div>
                                                <time className="text-lg sm:text-xl md:text-2xl text-purple-900 font-black" dateTime={new Date(segment.dTimeUTC * 1000).toISOString()}>{formatTime(segment.dTimeUTC)}</time>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] sm:text-xs text-purple-400 uppercase font-black tracking-widest mb-1">Arrival</div>
                                                <time className="text-lg sm:text-xl md:text-2xl text-purple-900 font-black" dateTime={new Date(segment.aTimeUTC * 1000).toISOString()}>{formatTime(segment.aTimeUTC)}</time>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Layover */}
                                {result.layovers?.[index] && (
                                    <div className="ml-[1.75rem] sm:ml-[2.25rem] md:ml-[2.75rem] pl-8 sm:pl-12 md:pl-16 py-4 sm:py-6 md:py-8 relative">
                                        <div className="bg-purple-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 border border-purple-100 inline-block shadow-inner">
                                            <div className="text-xs sm:text-sm md:text-base text-purple-700 font-bold flex items-center gap-2 sm:gap-3">
                                                <Compass className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                                                <span>Layover in {result.layovers[index].airport} • {formatDuration(result.layovers[index].duration)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>
                        ))}
                    </div>
                </article>
            )}
        </div>
    );
}
