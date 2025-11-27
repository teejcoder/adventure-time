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
    const [tripType, setTripType] = useState<TripType>("one-way");
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
        const cacheKey = `search_${origin}_${destination}_${tripType}_${dateStr}`;
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
                    tripType,
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
        <div className="w-full max-w-4xl mx-auto space-y-8 p-4">
            {/* Search Card */}
            <Card className="gradient-card shadow-2xl overflow-hidden border-0 ring-1 ring-purple-100">
                <CardContent className="p-10">
                    <form onSubmit={handleSearch} className="space-y-10">
                        {/* Trip Type */}
                        <div className="flex justify-center gap-6">
                            <Button
                                type="button"
                                onClick={() => setTripType("one-way")}
                                variant={tripType === "one-way" ? "default" : "outline"}
                                className={`rounded-full px-10 py-7 text-xl font-black transition-all border-2 ${tripType === "one-way"
                                    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-xl scale-105 border-transparent"
                                    : "bg-white text-purple-900 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                                    }`}
                            >
                                One-Way
                            </Button>
                            <Button
                                type="button"
                                onClick={() => setTripType("round-trip")}
                                variant={tripType === "round-trip" ? "default" : "outline"}
                                className={`rounded-full px-10 py-7 text-xl font-black transition-all border-2 ${tripType === "round-trip"
                                    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-xl scale-105 border-transparent"
                                    : "bg-white text-purple-900 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                                    }`}
                            >
                                Round-Trip
                            </Button>
                        </div>

                        {/* Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Origin */}
                            <div className="space-y-3">
                                <Label className="text-purple-900 font-black uppercase tracking-widest text-xs ml-1">From</Label>
                                <div className="relative group">
                                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-400 w-6 h-6 group-focus-within:text-purple-600 transition-colors" />
                                    <Input
                                        value={origin}
                                        onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                                        placeholder="LAX"
                                        maxLength={3}
                                        className="bg-white border-2 border-purple-100 text-purple-900 placeholder:text-purple-200 text-center text-3xl font-black h-20 rounded-3xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all pl-12 shadow-sm hover:border-purple-200"
                                    />
                                </div>
                            </div>

                            {/* Destination */}
                            <div className="space-y-3">
                                <Label className="text-purple-900 font-black uppercase tracking-widest text-xs ml-1">To</Label>
                                <div className="relative group">
                                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-400 w-6 h-6 group-focus-within:text-purple-600 transition-colors" />
                                    <Input
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value.toUpperCase())}
                                        placeholder="JFK"
                                        maxLength={3}
                                        className="bg-white border-2 border-purple-100 text-purple-900 placeholder:text-purple-200 text-center text-3xl font-black h-20 rounded-3xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all pl-12 shadow-sm hover:border-purple-200"
                                    />
                                </div>
                            </div>

                            {/* Date */}
                            <div className="space-y-3">
                                <Label className="text-purple-900 font-black uppercase tracking-widest text-xs ml-1">Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full h-20 bg-white border-2 border-purple-100 text-purple-900 hover:bg-purple-50 hover:border-purple-200 rounded-3xl text-xl font-bold justify-start px-6 shadow-sm group",
                                                !date && "text-purple-300"
                                            )}
                                        >
                                            <CalendarIcon className="mr-4 h-6 w-6 text-purple-400 group-hover:text-purple-600 transition-colors" />
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

                        {/* Search Button */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-24 bg-purple-900 hover:bg-black text-white text-3xl font-black rounded-3xl shadow-2xl hover:shadow-purple-900/25 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
                        >
                            {loading ? (
                                <div className="flex items-center gap-4">
                                    <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
                                    <span>Searching...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <Plane className="w-10 h-10" />
                                    <span>FIND FLIGHTS</span>
                                </div>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Error */}
            {error && (
                <Alert variant="destructive" className="bg-red-50 border-2 border-red-100 text-red-900 rounded-2xl shadow-lg">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                    <AlertTitle className="font-black text-lg">Error</AlertTitle>
                    <AlertDescription className="font-medium text-lg">{error}</AlertDescription>
                </Alert>
            )}

            {/* Results */}
            {result && (
                <Card className="gradient-card shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 border-0 ring-1 ring-purple-100">
                    {/* Header */}
                    <div className="p-10 border-b border-purple-100 bg-white/50">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                            <div>
                                <div className="text-sm font-black text-purple-600 uppercase tracking-widest mb-3">Best Price Found</div>
                                <div className="text-7xl font-black text-purple-900 tracking-tighter">
                                    {formatCurrency(result.price)}
                                </div>
                                <div className="flex items-center gap-4 mt-4 text-purple-900/60 font-bold text-lg">
                                    <span className="bg-purple-100 px-4 py-1.5 rounded-full text-sm font-black uppercase text-purple-700">{result.airline}</span>
                                    <span>•</span>
                                    <span>{result.stops === 0 ? "Direct" : `${result.stops} Stop${result.stops! > 1 ? 's' : ''}`}</span>
                                    <span>•</span>
                                    <span>{formatDuration(result.totalDuration || result.duration || 0)}</span>
                                </div>
                            </div>
                            {result.deep_link && (
                                <Button asChild className="h-20 px-10 bg-purple-600 hover:bg-purple-700 text-white font-black text-2xl rounded-2xl shadow-xl transition-all hover:scale-105 hover:rotate-1">
                                    <a href={result.deep_link} target="_blank" rel="noopener noreferrer">
                                        Book Now <ArrowRight className="ml-3 w-8 h-8" />
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Segments */}
                    <div className="p-10 space-y-10">
                        {result.route.map((segment, index) => (
                            <div key={index} className="relative">
                                {/* Connector Line */}
                                {index < result.route.length - 1 && (
                                    <div className="absolute left-[2.75rem] top-20 bottom-0 w-1 bg-purple-100 h-32"></div>
                                )}

                                <div className="flex gap-8 items-start">
                                    {/* Icon */}
                                    <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center border-4 border-purple-50 shadow-lg shrink-0 z-10">
                                        <Plane className="w-10 h-10 text-purple-600" />
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-4xl font-black text-purple-900 tracking-tight">{segment.flyFrom} → {segment.flyTo}</h3>
                                                <p className="text-purple-500 font-bold text-xl mt-1">{segment.airline}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-purple-900 font-mono text-2xl font-bold bg-purple-50 px-4 py-2 rounded-xl">{formatDuration(segment.duration || (segment.aTimeUTC - segment.dTimeUTC))}</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6 bg-white rounded-3xl p-6 border-2 border-purple-50 shadow-sm">
                                            <div>
                                                <div className="text-xs text-purple-400 uppercase font-black tracking-widest mb-1">Departure</div>
                                                <div className="text-2xl text-purple-900 font-black">{formatTime(segment.dTimeUTC)}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-purple-400 uppercase font-black tracking-widest mb-1">Arrival</div>
                                                <div className="text-2xl text-purple-900 font-black">{formatTime(segment.aTimeUTC)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Layover */}
                                {result.layovers?.[index] && (
                                    <div className="ml-[2.75rem] pl-16 py-8 relative">
                                        <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100 inline-block shadow-inner">
                                            <div className="text-base text-purple-700 font-bold flex items-center gap-3">
                                                <Compass className="w-5 h-5" />
                                                Layover in {result.layovers[index].airport} • {formatDuration(result.layovers[index].duration)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
