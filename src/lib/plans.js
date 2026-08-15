export const PLANS = {
  starter: {
    key: "starter",
    displayName: "Starter",
    priceMonthlyUsd: 149,
    description: "Basic protection and controls to get started.",
    features: [
      "Basic spam protection",
      "Stop calls and texts from known spammers",
      "See where your data is exposed online",
      "Play out-of-service messages to unwanted callers",
      "Safe voicemail box to prevent impersonation and cloning scams",
    ],
    creemProductId: "prod_starter_demo",
    credits: 5000,
  },
  growth: {
    key: "growth",
    displayName: "Growth",
    priceMonthlyUsd: 499,
    description: "More blocking and privacy features for growing needs.",
    features: [
      "All Starter Plan features",
      "Call screening to block all spam",
      "Removal of private information from spam lists and websites",
      "Play out-of-service messages to exes and spammers to stop calls permanently",
    ],
    creemProductId: "prod_growth_demo",
    credits: 25000,
  },
  scale: {
    key: "scale",
    displayName: "Scale",
    priceMonthlyUsd: 999,
    description: "Advanced protection plus a second number and personalization.",
    features: [
      "All Growth Plan features",
      "Enhanced protection to keep your phone number safe",
      "Second phone number for business or personal use",
      "Personalized greetings for callers on both main and second numbers",
    ],
    creemProductId: "prod_scale_demo",
    credits: 100000,
  }
};
