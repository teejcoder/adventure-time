# Adventure Time ✈️

Find the absolute cheapest flights between any two airports instantly. Powered by real-time flight data from AeroDataBox API.

## Features

- **Real-Time Data**: Live flight schedules from AeroDataBox via RapidAPI
- **Cheapest First**: Automatically finds the lowest price itinerary
- **Smart Caching**: 10-minute cache to reduce API calls
- **Rate Limited**: 5 requests per minute to stay within API limits
- **Modern UI**: Built with Next.js 15, Shadcn UI, and Tailwind CSS
- **Zero Database**: Pure in-memory processing for maximum speed and privacy

## Prerequisites

- Node.js 18+
- npm

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd adventure-time
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

## Running Locally

1.  Start the development server:
    ```bash
    npm run dev
    ```

2.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1.  Enter the 3-letter IATA code for the origin airport (e.g., `SYD`).
2.  Enter the 3-letter IATA code for the destination airport (e.g., `MEL`).
3.  Click "Find Cheapest Flight".
4.  View the best price, route details, and airline information.

## Features

- **Client-side caching**: Results cached for 10 minutes
- **Rate limiting**: Maximum 5 searches per minute
- **Real-time data**: Live flight schedules from AeroDataBox

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Shadcn UI
- **Icons**: Lucide React
- **API**: AeroDataBox (via RapidAPI)
