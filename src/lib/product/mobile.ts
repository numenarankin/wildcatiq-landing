import type { ProductPageContent } from "./types";

/** Mobile app page. Budgets and the outcome-first rule are in docs/copy-review.md. No voice Orion, push, org switcher or Export: not shipped on the phone. */
export const mobilePage: ProductPageContent = {
  hero: {
    eyebrow: "Mobile app",
    headline: "The whole operation, from anywhere.",
    subhead: "Gauges, run tickets, comments and Orion on the phone, saved without signal and sent when it returns.",
  },
  steps: [
  ],
  sections: [
    {
      eyebrow: "Orion on the phone",
      headline: "Ask Orion from the lease.",
      body: "Ask about any well or have Orion log a reading, and approve it before anything saves.",
      screen: "orion",
      cards: [
        { label: "Approve before it saves", body: "Every change shows as a card you can fix before approving." },
        { label: "Snap it and ask", body: "Attach a photo, a scan or a file straight from the phone." },
        { label: "Hear the answer", body: "Orion reads its reply aloud while you drive." },
      ],
    },
    {
      eyebrow: "Run tickets",
      headline: "Scan the ticket, check the form.",
      body: "Photograph a paper run ticket and it comes back filled in, ready to check.",
      screen: "tickets",
      cards: [
        { label: "A run sheet at once", body: "A monthly sheet comes back as one ticket per pickup." },
        { label: "No double entries", body: "A ticket already on file is never filed twice." },
        { label: "Blanks stay blank", body: "What the ticket didn't print stays empty, never a made-up zero." },
      ],
    },
    {
      eyebrow: "Dashboard",
      headline: "The owner's numbers, in the truck.",
      body: "Company oil, gas and revenue a day, every lease and every chart, wherever you are.",
      screen: "dashboard",
      cards: [
        { label: "Oil and gas up top", body: "Company barrels and mcf a day, against the day before." },
        { label: "Every lease", body: "Oil, gas and your net revenue a day, one tap to the lease." },
        { label: "Full charts", body: "Production, revenue and decline on every facility." },
      ],
    },
    {
      eyebrow: "Offline",
      headline: "Works where the signal doesn't.",
      body: "Log readings, tickets and notes with no bars, and they reach the office when signal returns.",
      screen: "offline",
      cards: [
        { label: "Saved the moment you tap", body: "A reading shows at once and survives a closed app." },
        { label: "Everything queues", body: "Readings, tickets, tests, downtime, notes, comments and tasks wait for signal." },
        { label: "Told about conflicts", body: "If the office changed it too, the phone tells you which edit won." },
      ],
    },
    {
      eyebrow: "Comments",
      headline: "Keep the notes with the well.",
      body: "Every well, tank and meter has its own thread, so field notes stop getting lost in texts.",
      screen: "comments",
      cards: [
        { label: "On every facility", body: "Wells, tanks, batteries and meters each carry a thread." },
        { label: "Replies stay together", body: "Each answer sits under the comment it answers." },
        { label: "Works offline", body: "Comments save on the phone and send when signal returns." },
      ],
    },
  ],
  faq: [
    { q: "Which phones?", a: "iPhone and Android, on phones and tablets." },
    { q: "What works without signal?", a: "Readings, run tickets, well tests, notes, comments and tasks save on the phone and sync when signal returns. Scanning, dictation, messages and Orion need a connection." },
    { q: "Who sees what?", a: "Each person sees only the pages you give them, the same as on the web." },
  ],
  siblings: [
    { slug: "orion", body: "The same Orion and approval cards, with your camera attached." },
    { slug: "dashboard", body: "The phone shows the same leases and numbers as the web." },
    { slug: "documents", body: "Paperwork scanned on the phone is filed as a PDF, ready on the web." },
    { slug: "filings", body: "The gauges, run tickets and meter readings your pumpers log become the month's Form PR." },
  ],
};
