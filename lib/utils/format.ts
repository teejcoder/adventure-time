export function formatCurrency(price: number): string {
    return new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}

export function formatTime(timestampUTC: number): string {
    // timestampUTC is in seconds
    const date = new Date(timestampUTC * 1000);
    return new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
    }).format(date);
}
