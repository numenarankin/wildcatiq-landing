/**
 * Flow map page. Drafted in docs/product-pages-plan.md "# Flow map", then
 * corrected to the shipped code: volume pills sit on downstream legs only
 * (flow-map.tsx), water meters are never cards and the map's New facility
 * menu creates gas meters only (facility-create-menu.tsx calls saveMeter with
 * "gas" alone), and the palette strip is not rendered.
 */
import type { ProductPageContent } from "./types";

export const flowMapPage: ProductPageContent = {
  hero: {
    eyebrow: "Facilities",
    headline: "See where every barrel goes.",
    subhead: "Oil, gas and saltwater run left to right from each producing well through every tank, meter and SWD well, drawn from the same wiring the app allocates on.",
  },
  steps: [
    { title: "Pick a stream and a lease.", body: "Two selects, upper left: All, Oil, Gas or Saltwater, and one lease or every lease." },
    { title: "Read the lanes.", body: "Each lease is a lane and each column is a stage downstream. Lines carry the stream's color and move the way it flows." },
    { title: "Click a card.", body: "Its connections open in one modal, and everything more than one hop away fades." },
    { title: "Draw what changed.", body: "Pull a wire from a card's port to another card, or drop a facility onto a line. The connection is written where the allocation reads it." },
  ],
  sections: [
    {
      eyebrow: "The picture",
      headline: "Three streams, one canvas.",
      body: "The map draws the operation like a workflow builder, one commodity at a time or all three together.",
      cards: [
        { label: "Field colors.", body: "Oil is green, gas red and saltwater blue on every line, card and label." },
        { label: "Saltwater, named so.", body: "Produced water reads Saltwater on every surface of the page." },
        { label: "Lines move.", body: "Dashes travel from source to target once a second, and stop under reduced motion." },
        { label: "Six card kinds.", body: "Well, SWD well, tank, meter, battery and haul-off, each with its own icon." },
        { label: "Lanes pack to the screen.", body: "Twenty one-well leases pack into a 16:9 canvas instead of a mile-long ribbon." },
      ],
      screen: "picture",
    },
    {
      eyebrow: "The numbers",
      headline: "Every card carries its rate.",
      body: "Cards print rates from the same per-well series the rest of the app runs on, rounded once and added once.",
      cards: [
        { label: "Rate on every well.", body: "A well's bbl/d or mcf/d for the stream on screen, and all three on the All view." },
        { label: "Tanks show percent full.", body: "A tank's fill comes from its latest gauge. A gas meter shows its 14-day EMA." },
        { label: "Volume pills on downstream legs.", body: "A split no card shows is printed on its line. The first leg out of a well carries none, because the card already states it." },
        { label: "The headline is the sum of the cards.", body: "Company oil, gas and saltwater add the rounded card values, so the column you add by eye lands on the total." },
        { label: "Refresh really refreshes.", body: "The button drops the 15-minute rate cache and re-derives every card from the readings." },
      ],
      screen: "numbers",
    },
    {
      eyebrow: "Reading the wiring",
      headline: "Same wiring the allocation runs on.",
      body: "The map is not a second source of truth. It is the allocation tables and the drawn connections, read as a graph.",
      cards: [
        { label: "Edges are the allocation rows.", body: "Well to battery is the oil split. Well to meter is the gas split. Well to water tank and tank to SWD well are the water path." },
        { label: "Drawn connections overlay it.", body: "Connections an operator draws merge into the derived graph. They are the only edges you can delete here." },
        { label: "Today's splits, active wells.", body: "Splits are filtered to dates that cover today. Inactive wells drop off with their edges." },
        { label: "Shared facilities are drawn muted.", body: "An SWD well or haul-off that another lease flows into appears dashed, labelled other lease." },
        { label: "Permitted rate on an SWD well.", body: "The UIC permit's bbl/d sits beside the measured rate as a ceiling, never a substitute." },
      ],
      screen: "wiring",
    },
    {
      eyebrow: "Click a facility",
      headline: "Every connection, one click away.",
      body: "A card opens the facility the rest of the app edits, not a summary of it.",
      cards: [
        { label: "Connections tab.", body: "What feeds it and what it feeds, as a list. Drawn connections can be removed." },
        { label: "Settings tab.", body: "The facility's own form, inline, with the same fields and save path as its page." },
        { label: "Allocation tab.", body: "Tanks, meters and batteries open their allocation panel, loaded when you open it." },
        { label: "Focus on one hop.", body: "The selected card and its neighbors stay. The rest fades to 30 percent." },
        { label: "Search by name or kind.", body: "Eight ranked results, prefix matches first. Type meter and the meters list." },
      ],
      screen: "detail",
    },
    {
      eyebrow: "Build on the map",
      headline: "Draw the chain, write the allocation.",
      body: "Adding and connecting from the map writes the same rows the facility pages write, in one round trip.",
      cards: [
        { label: "Pull a wire.", body: "Drag from a card's right port to the card it feeds, or from the left port to the card that feeds it." },
        { label: "New connection, many to many.", body: "Pick several feeders and several targets in one dialog. Feeders of one target split evenly." },
        { label: "New facility, same form.", body: "Well, tank, gas meter, battery and lease open the dialogs their own pages use." },
        { label: "Drop it in the line.", body: "A facility dropped on a drawn connection stands in the middle of it and inherits its substance and share." },
        { label: "Carry a card to another lease.", body: "Drop a card in another lease's lane to move the facility. A tank on a battery moves the battery." },
      ],
      screen: "build",
    },
    {
      eyebrow: "Stream rules",
      headline: "Oil lands on the battery.",
      body: "The map knows which table allocates each stream and writes there, so a drawn edge never shows barrels the engine does not count.",
      cards: [
        { label: "An oil wire is battery membership.", body: "Draw a well into an oil tank and it joins the tank's battery. The first well takes 100 percent and the next take 0 percent until you split them." },
        { label: "Water meters are wiring, not cards.", body: "A water meter sits inside the saltwater line. A chain through it is drawn end to end." },
        { label: "A battery's connection is its tanks'.", body: "One battery to SWD edge feeds every water tank on it. A tank's own edge wins for that tank." },
        { label: "Deleting a facility heals the line.", body: "Every feeder is rejoined to every outlet, per substance, with the shares composed." },
      ],
      screen: "rules",
    },
    {
      eyebrow: "Disposal",
      headline: "One resolver, every surface.",
      body: "Where the water goes on the map is where the SWD well's volume comes from on its page.",
      cards: [
        { label: "A disposal well is a sink.", body: "Its volume is the throughput of the water meters wired into it, over the same edges the map draws." },
        { label: "Metered means hand entry closes.", body: "When a meter edge is active today, the well's Reading item disappears and the server refuses one." },
        { label: "Reach through the station.", body: "A meter two hops upstream, through a tank and a battery, still measures the well. The reach stops at four hops." },
        { label: "Terminal tanks count their gauge.", body: "A water tank with nothing downstream is measured by gauge and hauls. One that feeds a meter counts only hauls." },
        { label: "Orion reads the same graph.", body: "Four Orion tools answer what feeds this tank from the map's own data." },
      ],
      screen: "disposal",
    },
    {
      eyebrow: "Permissions",
      headline: "View for everyone, edit for some.",
      body: "The map reads under one permission and edits under another, and every edit is the facility page's own server action.",
      cards: [
        { label: "view_facilities to look.", body: "The page and both of its loaders require it." },
        { label: "manage_facilities to draw.", body: "New connection, New facility, ports and card carries appear only with it. It implies view." },
        { label: "Row-level security does the scoping.", body: "Connections are read and written as the signed-in member, under the connection table's policies." },
        { label: "Only drawn edges can be removed.", body: "An edge derived from an allocation table is unwired on the split, never deleted from the map." },
        { label: "Zoom in steps, fit to view.", body: "Fixed stops from 25 to 180 percent, and a fit button that never passes 1:1." },
      ],
      screen: "permissions",
    },
  ],
  faq: [
    {
      q: "Is the map a separate drawing I have to maintain?",
      a: "No. Every edge is an allocation row or a drawn connection row. The map never becomes a second record of who feeds what.",
    },
    {
      q: "What writes when I draw an oil connection?",
      a: "Membership in the tank's battery, not a connection row. Oil is allocated from the battery split and nowhere else.",
    },
    {
      q: "Can I draw a connection to a water meter?",
      a: "No. A water meter is not a card. It sits inside the saltwater line, and a chain through it is drawn end to end.",
    },
    { q: "Does the map show history?", a: "No. Edges and splits are filtered to today. Orion can list a connection that has closed." },
    {
      q: "Who can edit it?",
      a: "Members with manage_facilities, which implies view_facilities. Everyone else sees the map and the detail modal without New connection, New facility, ports or carries.",
    },
    {
      q: "Can I delete a derived connection from the map?",
      a: "No. Only drawn connections have a delete. A derived edge is changed on the facility's allocation.",
    },
    {
      q: "Does a drawn edge carry a volume?",
      a: "It carries a share, not a volume. Volumes come from measured points: meters, hauls and terminal tank gauges. They are attributed upstream by share.",
    },
    {
      q: "Does Orion write connections?",
      a: "Orion reads the graph and traces flow. Any write it proposes goes through the same approval gate as every other write tool.",
    },
    {
      q: "Is there a phone version of the map?",
      a: "No. The map is on the web app. The phone collects the gauges and meter reads its cards show.",
    },
  ],
  siblings: [
    { slug: "mobile", body: "The gauges and meter reads the phone collects are the rates on these cards." },
    { slug: "dashboard", body: "The map's company oil and gas totals are the same per-well rates the dashboard sums." },
    { slug: "orion", body: "Four Orion tools read this graph, so what feeds Smith T201 is answered from the same edges." },
    { slug: "recon", body: "An RRC import seeds a disposal well's whole station, meter to battery to well, and the saltwater lane draws it." },
  ],
};
