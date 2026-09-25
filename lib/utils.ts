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

// Invoice amounts are shown with at least 2 decimals (PKR 5,000.00). String-based
// like formatMoney: pads the fraction, never rounds or converts to a number.
export function formatMoney2(amount: string, currency: string) {
    const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(amount.trim());
    if (!match) return `${currency} ${amount}`;
    const [, sign, integer, fraction = ""] = match;
    const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${currency} ${sign}${grouped}.${fraction.padEnd(2, "0")}`;
}

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

// Display only: (2026, 8) -> "August 2026".
export function formatBillingPeriod(year: number, month: number) {
    return `${MONTH_NAMES[month - 1] ?? month} ${year}`;
}

// UTC timestamp for operational fields (email attempts).
export function formatDateTime(iso: string | null) {
    if (!iso) return "—";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return `${date.toLocaleString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit", timeZone: "UTC",
    })} UTC`;
}
