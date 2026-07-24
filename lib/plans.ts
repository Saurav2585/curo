/**
 * Plan catalogue — card DISPLAY data for the comparison UI. Entitlements and
 * plan identity live in lib/entitlements.ts (the rules engine); this file only
 * supplies prices, taglines and benefit copy. Prices are INR recommendations.
 */
import { planName } from "@/lib/entitlements";

export type Plan = {
  id: string;
  name: string;
  price: string;
  cycle: string;
  tagline: string;
  benefits: string[];
  highlighted?: boolean;
};

// Patients: two tiers — Free and Care+.
export const PATIENT_PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    cycle: "always",
    tagline: "Everything you need to book care.",
    benefits: [
      "Book any doctor",
      "Email booking reminders",
      "1 profile",
      "3 complimentary appointments a month",
      "Standard support",
    ],
  },
  {
    id: "care_plus",
    name: "Care+",
    price: "₹299",
    cycle: "per month",
    tagline: "Unlimited care, faster, with savings.",
    highlighted: true,
    benefits: [
      "Unlimited appointments",
      "Faster booking",
      "Priority support",
      "Lab-test discounts",
      "SMS reminders",
      "Family profiles",
    ],
  },
];

// Providers: Professional and Clinic Pro are the self-serve upgrade tiers.
export const PROVIDER_PLANS: Plan[] = [
  {
    id: "pro",
    name: planName("pro"), // "Professional"
    price: "₹899",
    cycle: "per month",
    tagline: "Grow with analytics and reminders.",
    highlighted: true,
    benefits: [
      "Booking analytics",
      "SMS / WhatsApp confirmations",
      "1 reception seat",
      "Enhanced profile",
      "0% commission",
      "Email support",
    ],
  },
  {
    id: "clinic",
    name: planName("clinic"), // "Clinic Pro"
    price: "₹2,999",
    cycle: "per month",
    tagline: "For a practice with several doctors.",
    benefits: [
      "Up to 10 doctors",
      "Per-doctor + clinic analytics",
      "Up to 3 reception seats",
      "1 branch",
      "0% commission",
      "Priority support",
    ],
  },
];

/** The enterprise (hospital) tier is sales-assisted — no self-serve card. */
export const ENTERPRISE_PLAN = {
  name: "Enterprise",
  tagline: "For hospitals and multi-branch groups.",
  benefits: [
    "Unlimited doctors",
    "Multiple branches",
    "Advanced analytics + exports",
    "Dedicated account manager",
    "Custom onboarding",
  ],
};

export function patientPlanName(id: string): string {
  return PATIENT_PLANS.find((p) => p.id === id)?.name ?? "Free";
}
