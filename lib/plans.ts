/**
 * Central plan catalogue for the subscription foundation. Display data only —
 * no enforcement, no billing. Prices are the approved commercial-strategy
 * recommendations (INR). Amounts are strings so the UI renders them verbatim.
 */

export type PatientPlanId = "free" | "plus" | "plus_family";
export type ProviderPlanId = "free" | "trial" | "pro" | "clinic" | "enterprise";

/** Display-only monthly free-appointment quota for the Free patient tier. */
export const FREE_APPOINTMENT_QUOTA = 5;

export type Plan = {
  id: string;
  name: string;
  price: string;
  cycle: string;
  tagline: string;
  benefits: string[];
  highlighted?: boolean;
};

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
      `${FREE_APPOINTMENT_QUOTA} appointments a month`,
    ],
  },
  {
    id: "plus",
    name: "Curo Plus",
    price: "₹149",
    cycle: "per month",
    tagline: "Convenience and savings for regular care.",
    highlighted: true,
    benefits: [
      "Everything in Free",
      "SMS reminders",
      "Up to 4 family profiles",
      "Priority booking window",
      "Up to 10% partner-clinic discount",
      "Priority support",
    ],
  },
  {
    id: "plus_family",
    name: "Curo Plus Family",
    price: "₹399",
    cycle: "per month",
    tagline: "The whole family, covered.",
    benefits: [
      "Everything in Plus",
      "Up to 6 family profiles",
      "Up to 15% clinic discount",
      "Up to 20% lab-test discount",
      "Health record vault",
    ],
  },
];

export const PROVIDER_PLANS: Plan[] = [
  {
    id: "free",
    name: "Solo — Free",
    price: "₹0",
    cycle: "always",
    tagline: "List your practice and take bookings.",
    benefits: [
      "1 doctor profile",
      "Live slot booking",
      "0% commission",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Solo — Pro",
    price: "₹899",
    cycle: "per month",
    tagline: "Grow with analytics and reminders.",
    highlighted: true,
    benefits: [
      "Everything in Free",
      "Booking analytics",
      "SMS / WhatsApp confirmations",
      "1 reception seat",
      "Enhanced profile",
      "Email support",
    ],
  },
  {
    id: "clinic",
    name: "Clinic",
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
