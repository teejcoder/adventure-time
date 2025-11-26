import { CheapestFlightSearch } from "@/components/cheapest-flight-search";
import { Plane, Compass, MapPin, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4">

      <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-8 relative z-10">
        <div className="text-center space-y-6 animate-slide-in-chaotic">
          {/* Chaotic tilted heading */}
          <div className="relative inline-block">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight adventure-text-gradient transform -rotate-2 hover:rotate-0 transition-transform duration-300">
              ADVENTURE TIME!
            </h1>
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary rounded-full animate-bounce-chaotic opacity-70"></div>
            <div className="absolute -bottom-2 -left-6 w-8 h-8 bg-secondary rounded-full animate-float opacity-60"></div>
          </div>

          {/* Adventure taglines */}
          <div className="space-y-3 max-w-3xl mx-auto">
            <p className="text-xl md:text-2xl font-bold text-foreground transform rotate-1">
              🌍 Explore the World Without Breaking the Bank! 💰
            </p>
            <p className="text-lg md:text-xl text-muted-foreground font-medium transform -rotate-1">
              Find the absolute <span className="text-primary font-extrabold">CHEAPEST</span> flights instantly.
              <br />
              No hidden fees. No BS. Just <span className="text-secondary font-extrabold">PURE ADVENTURE</span>!
            </p>
          </div>

          {/* Call to action badges */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <span className="px-4 py-2 bg-primary text-primary-foreground rounded-full font-bold text-sm transform -rotate-2 shadow-lg hover:scale-110 transition-transform">
              ✈️ Instant Results
            </span>
            <span className="px-4 py-2 bg-secondary text-secondary-foreground rounded-full font-bold text-sm transform rotate-2 shadow-lg hover:scale-110 transition-transform">
              🎯 Best Prices
            </span>
            <span className="px-4 py-2 bg-accent text-accent-foreground rounded-full font-bold text-sm transform -rotate-1 shadow-lg hover:scale-110 transition-transform">
              🚀 Ready to Go!
            </span>
          </div>
        </div>

        <CheapestFlightSearch />
      </div>

      {/* Bottom decorative wave */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none"></div>
    </main>
  );
}
