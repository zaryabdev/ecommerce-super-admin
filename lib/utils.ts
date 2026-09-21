import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// String-based on purpose: decimal strings from the Admin API are never
// converted to JS numbers. Groups the integer part; leaves decimals untouched.
export function formatMoney(amount: string, currency: string) {
    const match = /^(-?)(\d+)(\.\d+)?$/.exec(amount.trim());
    if (!match) return `${currency} ${amount}`;
    const [, sign, integer, fraction = ""] = match;
    const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${currency} ${sign}${grouped}${fraction}`;
}

// UTC so the calendar date matches the stored timestamp regardless of viewer.
export function formatDate(iso: string) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    });
}
