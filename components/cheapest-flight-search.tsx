"use client";

import { useState } from "react";
import { SearchResponse, Itinerary, TripType } from "../lib/types/flights";
import { formatCurrency, formatTime } from "../lib/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plane, ArrowRight, AlertCircle, Loader2, MapPin, Compass, Sparkles, Calendar as CalendarIcon } from "lucide-react";
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
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Main Search Card - Treasure Map Style */}
            <Card className="chaotic-border bg-card/95 backdrop-blur-sm transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
                {/* Decorative corner elements */}
                <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-secondary rounded-bl-lg"></div>

                <CardHeader className="relative">
                    <div className="absolute -top-1 -right-1">
                        <Compass className="w-8 h-8 text-accent animate-spin-adventure opacity-40" style={{ animationDuration: '20s' }} />
                    </div>
                    <CardTitle className="text-3xl font-black text-center adventure-text-gradient transform -rotate-1">
                        🗺️ Find Your Adventure
                    </CardTitle>
                    <CardDescription className="text-center text-base font-semibold">
                        Discover the cheapest flights and start exploring! ✨
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="space-y-6">
                        {/* Trip Type Selector */}
                        <div className="space-y-2">
                            <Label className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                                <Plane className="w-4 h-4" />
                                Trip Type
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    type="button"
                                    onClick={() => setTripType("one-way")}
                                    className={`font-bold py-6 transition-all duration-200 ${tripType === "one-way"
                                        ? "bg-primary text-primary-foreground shadow-lg scale-105 border-4 border-primary"
                                        : "bg-card text-muted-foreground border-4 border-border hover:border-primary/50 hover:scale-102"
                                        }`}
                                    variant={tripType === "one-way" ? "default" : "outline"}
                                >
                                    ✈️ One-Way
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setTripType("round-trip")}
                                    className={`font-bold py-6 transition-all duration-200 ${tripType === "round-trip"
                                        ? "bg-secondary text-secondary-foreground shadow-lg scale-105 border-4 border-secondary"
                                        : "bg-card text-muted-foreground border-4 border-border hover:border-secondary/50 hover:scale-102"
                                        }`}
                                    variant={tripType === "round-trip" ? "default" : "outline"}
                                >
                                    🔄 Round-Trip
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Origin Input */}
                            <div className="space-y-2">
                                <Label htmlFor="origin" className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    From
                                </Label>
                                <div className="relative group">
                                    <Input
                                        id="origin"
                                        placeholder="LAX"
                                        value={origin}
                                        onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                                        maxLength={3}
                                        className="font-mono text-2xl font-black uppercase text-center border-4 border-primary focus:border-secondary focus:ring-4 focus:ring-accent/30 bg-card transform group-hover:scale-105 transition-transform"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Destination Input */}
                            <div className="space-y-2">
                                <Label htmlFor="destination" className="text-sm font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    To
                                </Label>
                                <div className="relative group">
                                    <Input
                                        id="destination"
                                        placeholder="LHR"
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value.toUpperCase())}
                                        maxLength={3}
                                        className="font-mono text-2xl font-black uppercase text-center border-4 border-secondary focus:border-primary focus:ring-4 focus:ring-accent/30 bg-card transform group-hover:scale-105 transition-transform"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Date Picker */}
                        <div className="space-y-2">
                            <Label className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4" />
                                Travel Date (Optional)
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-semibold border-4 border-accent hover:border-primary focus:ring-4 focus:ring-accent/30 py-6 transition-all",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-5 w-5" />
                                        {date ? format(date, "PPP") : <span>Pick a date or search anytime</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 border-4 border-primary" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                    />
                                    {date && (
                                        <div className="p-3 border-t-2 border-border">
                                            <Button
                                                variant="ghost"
                                                className="w-full font-bold"
                                                onClick={() => setDate(undefined)}
                                            >
                                                Clear Date
                                            </Button>
                                        </div>
                                    )}
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Search Button - Glowing and Chaotic */}
                        <Button
                            type="submit"
                            className="w-full adventure-gradient text-white font-black text-lg py-6 transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xl hover:shadow-primary/50 animate-glow-pulse relative overflow-hidden group"
                            disabled={loading}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {loading ? (
                                    <>
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        <span className="animate-pulse">Searching the Skies...</span>
                                    </>
                                ) : (
                                    <>
                                        <Plane className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                        FIND MY ADVENTURE!
                                        <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                                    </>
                                )}
                            </span>
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Error Alert - Chaotic Style */}
            {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 border-4 border-destructive transform -rotate-1">
                    <AlertCircle className="h-5 w-5 animate-tilt-shake" />
                    <AlertTitle className="font-black text-lg">Oops! Adventure Delayed! 🚨</AlertTitle>
                    <AlertDescription className="font-semibold">{error}</AlertDescription>
                </Alert>
            )}

            {/* Results Card - Adventure Log Style */}
            {result && (
                <Card className="overflow-hidden adventure-shadow bg-card animate-in fade-in slide-in-from-bottom-4 transform hover:scale-[1.01] transition-all">
                    {/* Price Header - Big and Bold */}
                    <div className="adventure-gradient p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                        <div className="relative z-10 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold text-white/90 text-sm uppercase tracking-wider">🎉 Best Price Found!</span>
                                    {result.tripType && (
                                        <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-black uppercase">
                                            {result.tripType === "round-trip" ? "🔄 Round-Trip" : "✈️ One-Way"}
                                        </span>
                                    )}
                                </div>
                                <div className="text-5xl font-black mt-1 drop-shadow-lg">{formatCurrency(result.price)}</div>
                            </div>
                            <Sparkles className="w-16 h-16 animate-float opacity-80" />
                        </div>
                    </div>

                    <CardContent className="p-0">
                        {/* Total Journey Duration */}
                        {result.totalDuration && (
                            <div className="p-4 bg-accent/10 border-b-4 border-border/50">
                                <div className="flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground">
                                    <span className="text-lg">⏱️</span>
                                    <span>Total Journey Time:</span>
                                    <span className="text-foreground text-lg">{formatDuration(result.totalDuration)}</span>
                                </div>
                            </div>
                        )}

                        {/* Journey Timeline */}
                        <div className="p-6 space-y-4">
                            {result.route.map((segment, index) => {
                                const segmentDuration = segment.duration || (segment.aTimeUTC - segment.dTimeUTC);
                                const layover = result.layovers?.[index];

                                return (
                                    <div key={index}>
                                        {/* Flight Segment */}
                                        <div
                                            className="relative group p-6 bg-gradient-to-br from-card to-accent/5 rounded-xl border-4 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl"
                                            style={{
                                                transform: index % 2 === 0 ? 'rotate(0.5deg)' : 'rotate(-0.5deg)',
                                            }}
                                        >
                                            {/* Flight number badge */}
                                            <div className="absolute -top-3 -right-3 z-10">
                                                <span className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-xs font-black uppercase shadow-lg transform rotate-12 border-2 border-background">
                                                    ✈️ Flight {index + 1}
                                                </span>
                                            </div>

                                            {/* Airline and Flight Number */}
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="text-base font-black text-accent uppercase tracking-wide">
                                                    {segment.airline}
                                                </div>
                                                {segment.flightNumber && (
                                                    <div className="text-sm font-bold text-muted-foreground">
                                                        {segment.flightNumber}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Route Display */}
                                            <div className="flex items-center justify-between gap-4">
                                                {/* Departure */}
                                                <div className="text-center flex-1">
                                                    <div className="text-4xl font-black text-primary mb-1">{segment.flyFrom}</div>
                                                    <div className="text-sm font-semibold text-muted-foreground mb-1">
                                                        {formatTime(segment.dTimeUTC)}
                                                    </div>
                                                    <div className="text-xs font-bold text-accent uppercase">Departure</div>
                                                </div>

                                                {/* Flight Path with Duration */}
                                                <div className="flex-1 flex flex-col items-center px-4">
                                                    <div className="text-xs font-bold text-muted-foreground mb-2">
                                                        {formatDuration(segmentDuration)}
                                                    </div>
                                                    <div className="w-full h-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-full relative">
                                                        <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-foreground rotate-90 group-hover:translate-x-2 transition-transform" />
                                                    </div>
                                                </div>

                                                {/* Arrival */}
                                                <div className="text-center flex-1">
                                                    <div className="text-4xl font-black text-secondary mb-1">{segment.flyTo}</div>
                                                    <div className="text-sm font-semibold text-muted-foreground mb-1">
                                                        {formatTime(segment.aTimeUTC)}
                                                    </div>
                                                    <div className="text-xs font-bold text-accent uppercase">Arrival</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Layover/Transit Information */}
                                        {layover && (
                                            <div className="flex flex-col items-center py-4">
                                                {/* Connecting Line */}
                                                <div className="w-1 h-8 bg-gradient-to-b from-border to-muted-foreground/30 rounded-full"></div>

                                                {/* Layover Card */}
                                                <div className="w-full max-w-md p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/30 my-2">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <div className="text-2xl">⏳</div>
                                                        <div className="text-center">
                                                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                                                Layover at {layover.airport}
                                                            </div>
                                                            <div className="text-lg font-black text-foreground">
                                                                Wait Time: {formatDuration(layover.duration)}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                {formatTime(layover.arrivalTime)} → {formatTime(layover.departureTime)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Connecting Line */}
                                                <div className="w-1 h-8 bg-gradient-to-b from-muted-foreground/30 to-border rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Book Now Button */}
                        {result.deep_link && (
                            <div className="p-6 bg-gradient-to-br from-accent/5 to-primary/5 border-t-4 border-border/50">
                                <Button
                                    asChild
                                    className="w-full adventure-gradient text-white font-black text-xl py-6 transform hover:scale-105 active:scale-95 transition-all shadow-xl"
                                >
                                    <a
                                        href={result.deep_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-3"
                                    >
                                        🎫 BOOK THIS ADVENTURE NOW!
                                        <ArrowRight className="h-6 w-6 animate-bounce-chaotic" />
                                    </a>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
