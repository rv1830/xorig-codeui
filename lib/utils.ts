import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SOURCES, VENDORS } from "./constants";

/**
 * Merges Tailwind classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as Indian Rupee currency
 */
export const fmtINR = (n: any) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

/**
 * Converts string to Title Case
 */
export const toTitle = (s: any) =>
  (s || "").replace(/\b\w/g, (c: any) => c.toUpperCase());

export function sourceName(source_id: any) {
  return SOURCES.find((x) => x.id === source_id)?.name || source_id;
}

export function vendorName(vendor_id: any) {
  return VENDORS.find((x) => x.id === vendor_id)?.name || vendor_id;
}

export function trustScore(vendor_id: any) {
  return VENDORS.find((x) => x.id === vendor_id)?.trust ?? 0;
}

export function bestOffer(offers: any) {
  if (!offers?.length) return null;
  const inStock = offers.filter((o: any) => o.in_stock);
  const list = inStock.length ? inStock : offers;
  // Sort by price ascending (cheapest first)
  return [...list].sort(
    (a: any, b: any) => (a.effective_price_inr ?? 1e18) - (b.effective_price_inr ?? 1e18)
  )[0];
}