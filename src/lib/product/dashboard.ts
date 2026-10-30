import type { ProductPageContent } from "./types";

/** Dashboard page. Budgets and the outcome-first rule are in docs/copy-review.md. */
export const dashboardPage: ProductPageContent = {
  hero: {
    eyebrow: "Dashboard",
    headline: "Know where every lease stands.",
    subhead: "Yesterday's production, what it was worth and what needs you, on one page.",
  },
  steps: [
    { title: "Pumpers log it.", body: "Gauges and meter readings come in from the phone." },
    { title: "Wildcat prices it.", body: "Every lease at what you actually get paid." },
    { title: "Orion flags it.", body: "A short brief names what moved overnight." },
    { title: "You act on it.", body: "Open the lease or well that needs you." },
  ],
  sections: [
    {
      eyebrow: "Morning brief",
      headline: "What moved, before you look.",
      body: "Orion names the wells that moved, the week's deadlines and what your pumpers wrote.",
      screen: "brief",
      cards: [
        { label: "Wells off their norm", body: "A well 25% off its own 30-day average is named with both numbers." },
        { label: "This week's deadlines", body: "Events and task due dates in the next seven days." },
        { label: "What the pumpers wrote", body: "Two weeks of field comments, each with the well or tank named." },
      ],
    },
    {
      eyebrow: "The four numbers",
      headline: "Four numbers, measured yesterday.",
      body: "Oil, gas, net revenue and decline from your latest gauges, so a fresh reading moves them.",
      screen: "cards",
      cards: [
        { label: "Your share, not gross", body: "Revenue is netted by your interest in each lease." },
        { label: "Priced at what you get", body: "Each lease is valued at its own realized price, not the posted benchmark." },
        { label: "Yesterday and the month", body: "Every figure shows its move since yesterday and over 30 days." },
      ],
    },
    {
      eyebrow: "Decline",
      headline: "A decline you can defend.",
      body: "See where production is heading well by well, before it shows up in the check.",
      screen: "decline",
      cards: [
        { label: "Every well's own curve", body: "Each well is fitted on its own, so a dying well stands out." },
        { label: "Your data, not the state's", body: "Curves fit your own gauges and meters, never RRC filings." },
        { label: "Partial months read right", body: "Rates by day, so a month's first week never looks like a collapse." },
      ],
    },
    {
      eyebrow: "Every lease",
      headline: "Watch every lease move.",
      body: "Each lease's oil, gas and revenue with its change since yesterday and over 30 days, so a shift stands out.",
      screen: "table",
      cards: [
        { label: "Sort by any column", body: "Rank leases by oil, gas, revenue or decline in one click." },
        { label: "Down to the well", body: "Open a lease to see which well moved it." },
        { label: "Decline on every row", body: "Each lease and well carries its own projected decline." },
      ],
    },
  ],
  faq: [
    { q: "What does the morning brief cover?", a: "Wells more than 25% off their own 30-day average, deadlines in the next seven days, and pumper comments from the last two weeks." },
    { q: "Where do the prices come from?", a: "WTI and Henry Hub are live market quotes. Each lease's realized price is fitted from its own statements." },
    { q: "Does the decline use the RRC's data?", a: "No, decline is fitted to your own gauges and meters. The public record is shown only for context." },
    { q: "Who can see it?", a: "Only the people you give access to. Prices can be hidden from anyone separately." },
  ],
  siblings: [
    { slug: "reports", body: "The same leases and exceptions arrive as a PDF in your inbox at 8am." },
    { slug: "orion", body: "Ask about any lease's decline or production and get the number on the card." },
    { slug: "mobile", body: "What your pumpers log on the phone shows up here the same day." },
    { slug: "filings", body: "The gauges behind these numbers become your monthly Form PR." },
  ],
};
