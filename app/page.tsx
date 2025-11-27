import { CheapestFlightSearch } from "@/components/cheapest-flight-search";

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6 sm:gap-8 relative z-10">
        {/* Hero Header Section */}
        <header className="text-center space-y-4 sm:space-y-6 animate-slide-in-chaotic" role="banner">
          {/* Chaotic tilted heading */}
          <div className="relative inline-block">
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight adventure-text-gradient transform -rotate-2 hover:rotate-0 transition-transform duration-300">
              ADVENTURE TIME!
            </h1>
            <div className="absolute -top-2 sm:-top-4 -right-2 sm:-right-4 w-8 h-8 sm:w-12 sm:h-12 bg-primary rounded-full animate-bounce-chaotic opacity-70" aria-hidden="true"></div>
            <div className="absolute -bottom-1 sm:-bottom-2 -left-3 sm:-left-6 w-6 h-6 sm:w-8 sm:h-8 bg-secondary rounded-full animate-float opacity-60" aria-hidden="true"></div>
          </div>

          {/* Adventure taglines */}
          <div className="space-y-2 sm:space-y-3 max-w-3xl mx-auto px-2">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground transform rotate-1">
              🌍 Explore the World Without Breaking the Bank! 💰
            </p>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground font-medium transform -rotate-1">
              Find the<span className="text-primary font-extrabold"> CHEAPEST </span>flights between<span className="text-secondary font-extrabold"> any two airports</span>.
            </p>
          </div>

          {/* Call to action badges */}
          <nav aria-label="Features" className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-4 sm:mt-6">
            <span className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-full font-bold text-xs sm:text-sm transform -rotate-2 shadow-lg hover:scale-110 transition-transform" aria-label="Instant search results">
              ✈️ Instant Results
            </span>
            <span className="px-3 sm:px-4 py-2 bg-secondary text-secondary-foreground rounded-full font-bold text-xs sm:text-sm transform rotate-2 shadow-lg hover:scale-110 transition-transform" aria-label="Best price guarantee">
              🎯 Best Prices
            </span>
            <span className="px-3 sm:px-4 py-2 bg-accent text-accent-foreground rounded-full font-bold text-xs sm:text-sm transform -rotate-1 shadow-lg hover:scale-110 transition-transform" aria-label="Ready to book">
              🚀 Ready to Go!
            </span>
          </nav>
        </header>

        {/* Search Section */}
        <section aria-label="Flight search" className="w-full">
          <CheapestFlightSearch />
        </section>
      </div>

      {/* Bottom decorative wave */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" aria-hidden="true"></div>
    </main>
  );
}
