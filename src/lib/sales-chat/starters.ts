/** The questions offered before the visitor has typed anything, each with the icon that sits beside it. */
export type StarterIcon = "price" | "import" | "shield" | "offline" | "arrow";

export const STARTER_QUESTIONS: readonly { q: string; icon: StarterIcon }[] = [
  { q: "What does it cost?", icon: "price" },
  { q: "How does the RRC import work?", icon: "import" },
  { q: "What if Orion gets something wrong?", icon: "shield" },
  { q: "Can my pumpers use it without signal?", icon: "offline" },
  { q: "How do I get started?", icon: "arrow" },
];
