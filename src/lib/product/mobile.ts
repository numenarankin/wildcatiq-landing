/**
 * Mobile app page. Drafted in docs/product-pages-plan.md "# Mobile app", then
 * corrected to the shipped wildcat-phone code: no org switcher, voice Orion,
 * push, Data Entry file picking, statement upload or Export (plan decision 9).
 * The note editor carries no dictate button (note-editor-modal.tsx passes no
 * `dictate`), so dictation is sold on form fields and comments. The phone's
 * approval card reads Approve, Review and Deny (approval-card.tsx).
 */
import type { ProductPageContent } from "./types";

export const mobilePage: ProductPageContent = {
  hero: {
    eyebrow: "Mobile app",
    headline: "Log it once, from the lease.",
    subhead: "Pumpers gauge tanks, read meters and scan run tickets on the phone, with or without signal, and the office never keys it twice.",
  },
  steps: [
    { title: "Open the lease.", body: "The app opens on Leases, the folder every well, tank, battery and meter sits in." },
    { title: "Tap the row, tap Add.", body: "A facility row's menu opens that facility's entry forms right there." },
    { title: "Change only what moved.", body: "The gauge wheel opens parked on the tank's last level, and a meter form opens on the last reading's figures." },
    { title: "Save and move on.", body: "The confirmation sheet shows the tick and the value, then closes itself." },
    { title: "Sync when the signal returns.", body: "Readings land on the device first and queue for the server." },
  ],
  sections: [
    {
      eyebrow: "Readings",
      headline: "Gauge a tank in seconds.",
      body: "Every field reading has its own touch-first form on one shared shell, and each opens filled from the last visit.",
      cards: [
        { label: "Gauge wheel.", body: "Spin feet, inches and quarters. Barrels derive from the tank's strapping." },
        { label: "Parked on yesterday.", body: "The wheel opens on the tank's last level, or the closing gauge after a run. The pumper moves inches, not feet." },
        { label: "Gas meter from the last reading.", body: "Volume and flow rate arrive prefilled. Only the columns that moved need touching." },
        { label: "SWD reading, one form.", body: "The water meter index and the wellhead pressures go in together. The app decides whether the row lands on the meter or the well." },
        { label: "Blank means blank.", body: "A pressure the pumper did not take stores as empty, never as 0 psi." },
      ],
      screen: "readings",
    },
    {
      eyebrow: "Run tickets",
      headline: "Scan the ticket, check the form.",
      body: "Photograph a paper run ticket in the phone's own scanner and it comes back as the draft the pumper would have typed.",
      cards: [
        { label: "Native scanner.", body: "VisionKit on iOS and ML Kit on Android find the edges, fire the shutter and square the page." },
        { label: "Orion fills the ticket.", body: "The scan goes to Storage and comes back as tickets. A monthly run sheet comes back as one ticket per pickup." },
        { label: "Unprinted stays blank.", body: "A gravity the ticket did not print arrives empty, never as 0 API." },
        { label: "No duplicate tickets.", body: "A ticket already on the tank by number and date is not filed twice." },
        { label: "Typing works offline.", body: "Scanning needs signal. A typed ticket queues without it." },
      ],
      screen: "tickets",
    },
    {
      eyebrow: "Offline",
      headline: "No signal, nothing lost.",
      body: "Screens read a copy of the data kept on the phone, and every write queues in an outbox until the signal returns.",
      cards: [
        { label: "Data on the device.", body: "Leases, wells, tanks, meters, readings, tickets, notes and comments live in SQLite on the phone." },
        { label: "Readings land locally first.", body: "A gauge or meter reading shows at once, survives an app kill and syncs when connected." },
        { label: "Thirty-eight write types queue.", body: "Readings, tickets, well tests, downtime, service, equipment, allocations, notes, comments, tasks and more all go through the outbox." },
        { label: "Last write wins, said out loud.", body: "A conflict with a later edit on the web keeps the later edit. The phone tells you when an outcome is not the one you expected." },
        { label: "Banner only when it matters.", body: "Offline, waiting or failed changes show under the header, with Sync now or Retry." },
      ],
      screen: "offline",
    },
    {
      eyebrow: "Dictation and notes",
      headline: "Dictate the remarks, glove on.",
      body: "Form fields and comments take dictation with a tap, and every facility keeps its own notes.",
      cards: [
        { label: "Tap to talk, tap to stop.", body: "No silence detection, because a pumpjack never goes quiet." },
        { label: "Append, never replace.", body: "A second dictation adds to the field." },
        { label: "Mic on form fields and comments.", body: "Entry forms, text fields and comment threads carry the dictate button." },
        { label: "Notes on the facility.", body: "Every well, tank, battery and meter page carries a Notes tab." },
      ],
      screen: "dictation",
    },
    {
      eyebrow: "Charts and the dashboard",
      headline: "The owner's numbers, in the truck.",
      body: "The phone shows the same rates and charts the web shows, computed on the device.",
      cards: [
        { label: "Dashboard waits once.", body: "Rates, chart and lease table load together. The network never gates the page." },
        { label: "Oil, gas, net rev/mo.", body: "The headline row is the operator's own share, not gross." },
        { label: "By lease, then by well.", body: "One row per lease with its change. Picking a lease lists its wells." },
        { label: "The full chart on every facility.", body: "Production, net revenue, stock and decline views, with EMAs, a trendline and log scale." },
      ],
      screen: "dashboard",
    },
    {
      eyebrow: "Logs and files",
      headline: "Open the LAS on site.",
      body: "Files, documents and well logs open on the phone from the same file store Orion reads.",
      cards: [
        { label: "LAS as a well log.", body: "Depth runs down the page with curves in their tracks, at 1:240, 1:600 or Fit." },
        { label: "One track at a time.", body: "The track picker swaps tracks. The depth column never leaves." },
        { label: "Folders and pins.", body: "Browse folders, pin what you open often, and the viewer picks its renderer from the extension." },
        { label: "Scan to Files.", body: "A scanned document queues for upload, indexing and OCR, even without signal." },
      ],
      screen: "logs",
    },
    {
      eyebrow: "Comments and messages",
      headline: "Comment on the well itself.",
      body: "Every facility has a thread and the team has chat, and both are on the phone.",
      cards: [
        { label: "Comments on every facility.", body: "Likes, replies and newest first, from the facility's Comments tab." },
        { label: "Comments work offline.", body: "Facility comments are kept on the device and written locally first." },
        { label: "Team messages.", body: "DMs and groups with unread dots. Rename a group, add members, remove them." },
        { label: "Attach to a message.", body: "Picked files and photos stage as chips until the message goes." },
      ],
      screen: "comments",
    },
    {
      eyebrow: "Orion on the phone",
      headline: "Ask the field, from the field.",
      body: "Orion answers from the same tools and data as the web, and nothing is saved until you approve it.",
      cards: [
        { label: "Approve before anything writes.", body: "A write pauses the run and shows a card. The composer locks until you answer." },
        { label: "Review before approving.", body: "The card lists the fields Orion left blank and takes a corrected record." },
        { label: "Attach from Files, camera or scanner.", body: "Attachments stage as chips until the message goes." },
        { label: "Read a reply aloud.", body: "Orion reads a reply out loud, one reply at a time." },
      ],
      screen: "orion",
    },
    {
      eyebrow: "Device and security",
      headline: "Face ID in, five-minute relock.",
      body: "The phone is a shared tool on a shared truck, so the session is gated and every delete is asked twice.",
      cards: [
        { label: "Biometric unlock.", body: "Face ID, Touch ID or Android BiometricPrompt gates a session you already hold. A password is the way out." },
        { label: "Relocks after five minutes away.", body: "Short enough for a set-down handset. Long enough for the camera and the dialer." },
        { label: "Every delete confirms.", body: "Row menus, swipe actions and editor deletes all go through one slide-up question." },
        { label: "A setting for this phone.", body: "Biometric unlock is a device preference that never syncs. Turning it on prompts first." },
      ],
      screen: "security",
    },
  ],
  faq: [
    { q: "Which platforms?", a: "iOS and Android, built with Expo 57 and React Native 0.86, with tablet layouts at 768 and 1100 points." },
    {
      q: "What works without signal?",
      a: "Every screen reads from the copy on the device, and 38 write types queue: readings, run tickets, well tests, downtime, service, equipment, allocations, notes, comments, tasks and more. Scanning a ticket for extraction, dictation, team messages, Orion and file viewing need a connection.",
    },
    { q: "Can the phone delete a well?", a: "No. The sync endpoint refuses a well delete from a device, because rejoining the flow connections through it is web work." },
    { q: "What happens on a conflict?", a: "The change made last wins. Deletes always apply. The phone tells you about any outcome you did not expect." },
    { q: "Does Orion write anything on its own?", a: "No. Every write tool pauses for an approval card, and the composer stays locked until it is answered." },
    { q: "Does the scanner's extraction run on the phone?", a: "No. The scan uploads to Storage and a server route reads it, with a 120 second cap." },
    { q: "Can a metered SWD well take a hand reading?", a: "No. When a water meter feeds the well, the Reading item disappears and the server refuses one too." },
    { q: "Who sees what?", a: "The menu shows a page only to members holding one of its permissions. The data on the device is filled through the same row-level security as the web." },
    { q: "Is biometric unlock an account setting?", a: "No. It is a preference on that phone and never syncs. Turning it on prompts first and saves only on success." },
  ],
  siblings: [
    { slug: "orion", body: "The same approval cards and tools, on the phone with camera and scanner attachments." },
    { slug: "dashboard", body: "The phone's lease table and company chart come from the same per-well rates." },
    { slug: "documents", body: "A scan from the phone enters the same upload, OCR and proposal pipeline." },
    { slug: "flow-map", body: "The gauges and meter reads the phone collects are the rates on the map's cards." },
  ],
};
