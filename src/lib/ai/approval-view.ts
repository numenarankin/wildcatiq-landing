/**
 * Pure, framework-free rendering of a proposed Orion write into a plain-English
 * view a non-technical operator can read — a title, the record's fields as
 * labelled rows, and any batch of rows as a small table. NEVER raw JSON, never
 * tool names or field keys.
 *
 * Extracted from the `ApprovalCard` component so (a) the copy/logic can be unit-
 * tested without React and (b) a Layer-0 conformance test can assert that EVERY
 * write tool has a registered human-readable title (the "70-year-old operator"
 * bar) — `hasRegisteredApprovalTitle`.
 */

/**
 * The argument every approval-gated tool takes for the card's headline: one
 * line, written by the model in the same call, naming the exact record and the
 * change ("Set Roy Corbett 4 casing pressure to 120 psi on Sep 30"). The static
 * titles below only say what KIND of write it is, which is not enough to say
 * yes or no to. Added to each schema by `resilient()` in `tools.ts`, and
 * stripped there before the tool body runs, so no tool ever sees it.
 *
 * The field rows stay under it as the ground truth: the summary is the model's
 * account of the write, the rows are the write.
 */
export const APPROVAL_SUMMARY_KEY = "summary";

/** Plain-English action title for a single-record write, keyed by tool name. */
export const ACTION_TITLES: Record<string, string> = {
  add_well_comment: "Post a field note",
  create_task: "Create a task",
  update_task: "Update a task",
  create_well: "Register a new well",
  update_well: "Update well details",
  create_lease: "Create a lease",
  update_lease: "Update lease details",
  assign_well_to_lease: "Assign a well to a lease",
  assign_tank_to_lease: "Assign a tank to a lease",
  assign_meter_to_lease: "Assign a meter to a lease",
  grant_lease_interest: "Grant an owner interest on a lease",
  update_lease_interest: "Update an interest holding",
  set_operator_interest: "Set the operator's interest on a lease",
  create_meter: "Create a gas meter",
  update_meter: "Update gas meter details",
  record_meter_reading: "Record a gas meter reading",
  update_meter_reading: "Correct a gas meter reading",
  add_meter_wells: "Add wells to a gas meter",
  set_meter_well_allocation: "Set a well's meter allocation %",
  save_meter_allocation: "Save a gas meter's allocation",
  create_gas_campaign: "Create a gas well-test campaign",
  publish_gas_campaign: "Publish a gas well-test campaign",
  add_meter_comment: "Post a note on a gas meter",
  create_injection_well: "Create an injection (SWD) well",
  set_well_type: "Change a well's type",
  update_disposal_reading: "Correct a disposal reading",
  create_water_meter: "Create a water (SWD) meter",
  update_water_meter: "Update water meter details",
  record_swd_meter_reading: "Record a water meter reading",
  update_swd_meter_reading: "Correct a water meter reading",
  create_tank: "Create a tank",
  update_tank: "Update tank details",
  record_tank_reading: "Record a tank gauge reading",
  update_tank_reading: "Correct a tank gauge reading",
  add_tank_comment: "Post a note on a tank",
  add_tank_wells: "Add wells to a tank",
  set_tank_well_allocation: "Set a well's tank allocation %",
  save_tank_allocation: "Save a tank's allocation",
  update_run_ticket: "Correct a run ticket",
  create_battery: "Create a tank battery",
  update_battery: "Update tank battery details",
  save_battery_tanks: "Set a battery's tanks",
  add_battery_wells: "Add wells to a battery",
  set_battery_well_allocation: "Set a well's battery allocation %",
  save_battery_allocation: "Save a battery's allocation",
  create_facility_connection: "Draw a flow connection",
  update_facility_connection: "Change a flow connection",
  save_node_water_split: "Set a node's water split",
  update_production: "Correct a production reading",
  update_well_equipment: "Fix an equipment row",
  create_calendar_event: "Add a calendar event",
  update_calendar_event: "Update a calendar event",
  create_contractor: "Add a contractor",
  update_contractor: "Update a contractor",
  create_service_provider: "Add a service provider",
  update_service_provider: "Update a service provider",
  create_royalty_owner: "Add a royalty owner",
  update_royalty_owner: "Update a royalty owner",
  create_employee: "Add an employee",
  update_employee: "Update an employee",
  create_gatherer: "Add a gatherer",
  update_gatherer: "Update a gatherer",
  create_project: "Create a project",
  set_tank_called_in: "Call in a tank for pickup",
  send_support_message: "Send a message to support",
  mark_support_thread_read: "Mark a support thread read",
  send_team_message: "Send a message to a coworker",
  rename_team_conversation: "Rename a group conversation",
  create_folder: "Create a folder",
  create_inventory_item: "Add an inventory item",
  update_inventory_item: "Update an inventory item",
  create_transaction: "Record a ledger entry",
  update_transaction: "Update a ledger entry",
  remember: "Remember this",
  set_meter_takeaway: "Set where the gas goes",
  create_note: "Save a note",
  create_document: "Create a document",
  edit_document: "Edit a document",
  // Surface parity (tools-surface.ts)
  delete_well: "Delete a well",
  delete_production_reading: "Delete a production reading",
  add_well_formation: "Add a formation top",
  update_well_formation: "Correct a formation top",
  delete_well_formation: "Delete a formation top",
  add_well_pumping: "Add pumping-unit settings",
  update_well_pumping: "Correct pumping-unit settings",
  delete_well_pumping: "Delete pumping-unit settings",
  add_well_fluid_shot: "Record a fluid-level shot",
  update_well_fluid_shot: "Correct a fluid-level shot",
  delete_well_fluid_shot: "Delete a fluid-level shot",
  update_well_service: "Correct a service record",
  delete_well_service: "Delete a service record",
  attach_service_document: "Link a document to a service record",
  detach_service_document: "Unlink a document from a service record",
  delete_well_equipment: "Delete an equipment row",
  add_well_filter_change: "Log a filter change",
  update_well_filter_change: "Correct a filter change",
  delete_well_filter_change: "Delete a filter change",
  add_well_info_field: "Add an Info sheet field",
  rename_well_info_field: "Rename an Info sheet field",
  delete_well_info_field: "Remove an Info sheet field",
  reorder_well_info_fields: "Reorder the Info sheet",
  update_downtime: "Correct a downtime period",
  delete_downtime: "Delete a downtime period",
  start_well_test: "Start a well test",
  update_well_test: "Correct a well test",
  close_well_test: "End a well test",
  delete_well_test: "Delete a well test",
  record_well_gas_shut_in: "Record a shut-in reading",
  attach_files_to_well: "Put files on a well",
  remove_well_file: "Take a file off a well",
  clear_rrc_well_match: "Unlink a well from its RRC record",
  clear_rrc_lease_match: "Unlink a lease from its RRC record",
  apply_rrc_lease_key: "Accept an RRC lease key",
  save_lease_use_gas: "Record lease-use gas",
  mark_filed: "Mark a filing as filed",
  save_filing_details: "Save filing details",
  save_rrc_filer: "Set the RRC filer",
  add_rrc_operator: "Link an RRC operator number",
  remove_rrc_operator: "Unlink an RRC operator number",
  set_primary_rrc_operator: "Set the primary RRC operator",
  delete_tank: "Delete a tank",
  delete_tank_reading: "Delete a tank gauge reading",
  delete_run_ticket: "Delete a run ticket",
  set_tank_wells: "Set a tank's wells",
  remove_tank_well: "Take a well off a tank",
  remove_well_from_oil_tank: "Unlink a well from an oil tank",
  remove_tank_call_in: "Take a tank off the pickup queue",
  delete_meter: "Delete a meter",
  delete_meter_reading: "Delete a gas meter reading",
  set_meter_wells: "Set a meter's wells",
  remove_meter_well: "Take a well off a meter",
  update_gas_campaign: "Correct a gas well-test campaign",
  delete_gas_campaign: "Delete a gas well-test campaign",
  delete_battery: "Delete a tank battery",
  set_battery_wells: "Set a battery's wells",
  remove_battery_well: "Take a well off a battery",
  delete_lease: "Delete a lease",
  update_lease_land: "Write a lease's land record",
  grant_new_owner_interest: "Grant a new owner an interest",
  grant_wi_owner_interest: "Grant a working-interest holding",
  remove_lease_interest: "Remove an interest holding",
  add_wi_owner: "Add a working-interest owner",
  rename_wi_owner: "Rename a working-interest owner",
  remove_wi_owner: "Remove a working-interest owner",
  set_facility_lease: "Put a facility on a lease",
  set_facility_links: "Set a facility's connections",
  delete_facility_connection: "Erase a flow connection",
  record_disposal_gauge: "Record a disposal pressure gauge",
  delete_disposal_reading: "Delete a disposal reading",
  attach_meter_to_well: "Wire a water meter into a well",
  delete_water_meter_reading: "Delete a water meter reading",
  delete_contractor: "Remove a contractor",
  delete_employee: "Remove an employee",
  delete_gatherer: "Remove a gatherer",
  delete_royalty_owner: "Remove a royalty owner",
  delete_service_provider: "Remove a service provider",
  delete_inventory_item: "Remove an inventory item",
  delete_task: "Delete a task",
  delete_calendar_event: "Delete a calendar event",
  delete_comment: "Delete a field note",
  rename_folder: "Rename a folder",
  move_file: "Move a file",
  delete_file: "Delete a file",
  delete_folder: "Delete a folder",
  add_files_to_folder: "Place files in a folder",
  remove_file_from_folder: "Take a file out of a folder",
  delete_note: "Delete a note",
  set_note_tags: "Tag a note",
  delete_transactions: "Delete a ledger entry",
  delete_invoice: "Delete an invoice",
  update_invoice_header: "Correct an invoice header",
  update_invoice_line: "Correct an invoice line",
  set_invoice_facilities: "Set an invoice's facilities",
  delete_statement: "Delete a statement",
  create_structure_map: "Create a structure map",
  update_structure_map: "Change a structure map",
  delete_structure_map: "Delete a structure map",
  save_recon_alert: "Save a Recon alert",
  delete_recon_alert: "Delete a Recon alert",
  set_recon_alert_enabled: "Switch a Recon alert",
  save_report_delivery: "Set report delivery time",
  set_report_schedule: "Schedule a report",
  add_conversation_member: "Add someone to a conversation",
  remove_conversation_member: "Remove someone from a conversation",
};

/** Batch writes: the array field, plus the verb + singular noun for the title. */
/**
 * The write tools built with `batchTool` (`rows`, 1 to many): the card's verb
 * and what one row is, in the user's words. A batch of one keeps the title in
 * `ACTION_TITLES`.
 */
const ROW_BATCHES: Record<string, [verb: string, noun: string]> = {
  add_well_comment: ["Post", "field note"],
  create_task: ["Create", "task"],
  create_well: ["Register", "well"],
  create_lease: ["Create", "lease"],
  update_lease: ["Update", "lease"],
  assign_well_to_lease: ["Assign", "well to a lease"],
  assign_tank_to_lease: ["Assign", "tank to a lease"],
  assign_meter_to_lease: ["Assign", "meter to a lease"],
  grant_lease_interest: ["Grant", "owner interest"],
  update_lease_interest: ["Update", "interest holding"],
  set_operator_interest: ["Set", "operator interest"],
  create_meter: ["Create", "gas meter"],
  update_meter: ["Update", "gas meter"],
  record_meter_reading: ["Record", "gas meter reading"],
  update_meter_reading: ["Correct", "gas meter reading"],
  add_meter_wells: ["Add wells to", "gas meter"],
  set_meter_well_allocation: ["Set", "meter allocation"],
  publish_gas_campaign: ["Publish", "gas well-test campaign"],
  add_meter_comment: ["Post", "meter note"],
  create_injection_well: ["Create", "injection well"],
  set_well_type: ["Change", "well type"],
  update_disposal_reading: ["Correct", "disposal reading"],
  create_water_meter: ["Create", "water meter"],
  update_water_meter: ["Update", "water meter"],
  record_swd_meter_reading: ["Record", "water meter reading"],
  update_swd_meter_reading: ["Correct", "water meter reading"],
  create_tank: ["Create", "tank"],
  update_tank: ["Update", "tank"],
  record_tank_reading: ["Record", "tank gauge reading"],
  update_tank_reading: ["Correct", "tank gauge reading"],
  add_tank_comment: ["Post", "tank note"],
  add_tank_wells: ["Add wells to", "tank"],
  set_tank_well_allocation: ["Set", "tank allocation"],
  update_run_ticket: ["Correct", "run ticket"],
  create_battery: ["Create", "tank battery"],
  update_battery: ["Update", "tank battery"],
  save_battery_tanks: ["Set tanks on", "battery"],
  add_battery_wells: ["Add wells to", "battery"],
  set_battery_well_allocation: ["Set", "battery allocation"],
  create_facility_connection: ["Draw", "flow connection"],
  update_facility_connection: ["Change", "flow connection"],
  create_calendar_event: ["Add", "calendar event"],
  update_calendar_event: ["Update", "calendar event"],
  update_well: ["Update", "well"],
  update_production: ["Correct", "production reading"],
  update_well_equipment: ["Fix", "equipment row"],
  create_contractor: ["Add", "contractor"],
  update_contractor: ["Update", "contractor"],
  create_service_provider: ["Add", "service provider"],
  update_service_provider: ["Update", "service provider"],
  create_royalty_owner: ["Add", "royalty owner"],
  update_royalty_owner: ["Update", "royalty owner"],
  create_employee: ["Add", "employee"],
  update_employee: ["Update", "employee"],
  create_gatherer: ["Add", "gatherer"],
  update_gatherer: ["Update", "gatherer"],
  set_tank_called_in: ["Call in", "tank"],
  create_folder: ["Create", "folder"],
  create_inventory_item: ["Add", "inventory item"],
  update_inventory_item: ["Update", "inventory item"],
  create_transaction: ["Record", "ledger entry"],
  update_transaction: ["Update", "ledger entry"],
  update_task: ["Update", "task"],
  // Surface parity (tools-surface.ts)
  delete_well: ["Delete", "well"],
  delete_production_reading: ["Delete", "production reading"],
  add_well_formation: ["Add", "formation top"],
  update_well_formation: ["Correct", "formation top"],
  delete_well_formation: ["Delete", "formation top"],
  add_well_pumping: ["Add", "pumping setting"],
  update_well_pumping: ["Correct", "pumping setting"],
  delete_well_pumping: ["Delete", "pumping setting"],
  add_well_fluid_shot: ["Record", "fluid shot"],
  update_well_fluid_shot: ["Correct", "fluid shot"],
  delete_well_fluid_shot: ["Delete", "fluid shot"],
  update_well_service: ["Correct", "service record"],
  delete_well_service: ["Delete", "service record"],
  attach_service_document: ["Link", "service document"],
  detach_service_document: ["Unlink", "service document"],
  delete_well_equipment: ["Delete", "equipment row"],
  add_well_filter_change: ["Log", "filter change"],
  update_well_filter_change: ["Correct", "filter change"],
  delete_well_filter_change: ["Delete", "filter change"],
  add_well_info_field: ["Add", "Info sheet field"],
  rename_well_info_field: ["Rename", "Info sheet field"],
  delete_well_info_field: ["Remove", "Info sheet field"],
  reorder_well_info_fields: ["Reorder", "Info sheet"],
  update_downtime: ["Correct", "downtime period"],
  delete_downtime: ["Delete", "downtime period"],
  start_well_test: ["Start", "well test"],
  update_well_test: ["Correct", "well test"],
  close_well_test: ["End", "well test"],
  delete_well_test: ["Delete", "well test"],
  record_well_gas_shut_in: ["Record", "shut-in reading"],
  attach_files_to_well: ["Put files on", "well"],
  remove_well_file: ["Take off", "well file"],
  clear_rrc_well_match: ["Unlink", "RRC well match"],
  clear_rrc_lease_match: ["Unlink", "RRC lease match"],
  apply_rrc_lease_key: ["Accept", "RRC lease key"],
  save_lease_use_gas: ["Record", "lease-use gas entry"],
  mark_filed: ["Mark filed", "filing"],
  save_filing_details: ["Save", "filing detail set"],
  save_rrc_filer: ["Set", "RRC filer"],
  add_rrc_operator: ["Link", "RRC operator number"],
  remove_rrc_operator: ["Unlink", "RRC operator number"],
  set_primary_rrc_operator: ["Set primary", "RRC operator"],
  delete_tank: ["Delete", "tank"],
  delete_tank_reading: ["Delete", "tank gauge reading"],
  delete_run_ticket: ["Delete", "run ticket"],
  set_tank_wells: ["Set wells on", "tank"],
  remove_tank_well: ["Take off", "tank well"],
  remove_well_from_oil_tank: ["Unlink", "oil tank link"],
  remove_tank_call_in: ["Take off", "tank call-in"],
  delete_meter: ["Delete", "meter"],
  delete_meter_reading: ["Delete", "gas meter reading"],
  set_meter_wells: ["Set wells on", "meter"],
  remove_meter_well: ["Take off", "meter well"],
  update_gas_campaign: ["Correct", "campaign"],
  delete_gas_campaign: ["Delete", "campaign"],
  delete_battery: ["Delete", "tank battery"],
  set_battery_wells: ["Set wells on", "battery"],
  remove_battery_well: ["Take off", "battery well"],
  delete_lease: ["Delete", "lease"],
  update_lease_land: ["Write", "lease land record"],
  grant_new_owner_interest: ["Grant", "owner interest"],
  grant_wi_owner_interest: ["Grant", "working-interest holding"],
  remove_lease_interest: ["Remove", "interest holding"],
  add_wi_owner: ["Add", "working-interest owner"],
  rename_wi_owner: ["Rename", "working-interest owner"],
  remove_wi_owner: ["Remove", "working-interest owner"],
  set_facility_lease: ["Assign", "facility to a lease"],
  set_facility_links: ["Set", "facility link set"],
  delete_facility_connection: ["Erase", "flow connection"],
  record_disposal_gauge: ["Record", "disposal pressure gauge"],
  delete_disposal_reading: ["Delete", "disposal reading"],
  attach_meter_to_well: ["Wire", "meter into a well"],
  delete_water_meter_reading: ["Delete", "water meter reading"],
  delete_contractor: ["Remove", "contractor"],
  delete_employee: ["Remove", "employee"],
  delete_gatherer: ["Remove", "gatherer"],
  delete_royalty_owner: ["Remove", "royalty owner"],
  delete_service_provider: ["Remove", "service provider"],
  delete_inventory_item: ["Remove", "inventory item"],
  delete_task: ["Delete", "task"],
  delete_calendar_event: ["Delete", "calendar event"],
  delete_comment: ["Delete", "field note"],
  rename_folder: ["Rename", "folder"],
  move_file: ["Move", "file"],
  delete_file: ["Delete", "file"],
  delete_folder: ["Delete", "folder"],
  add_files_to_folder: ["Place files in", "folder"],
  remove_file_from_folder: ["Take out", "file placement"],
  delete_note: ["Delete", "note"],
  set_note_tags: ["Tag", "note"],
  delete_transactions: ["Delete", "ledger entry"],
  delete_invoice: ["Delete", "invoice"],
  update_invoice_header: ["Correct", "invoice header"],
  update_invoice_line: ["Correct", "invoice line"],
  set_invoice_facilities: ["Set facilities on", "invoice"],
  delete_statement: ["Delete", "statement"],
  create_structure_map: ["Create", "structure map"],
  update_structure_map: ["Change", "structure map"],
  delete_structure_map: ["Delete", "structure map"],
  save_recon_alert: ["Save", "Recon alert"],
  delete_recon_alert: ["Delete", "Recon alert"],
  set_recon_alert_enabled: ["Switch", "Recon alert"],
  save_report_delivery: ["Set", "report delivery time"],
  set_report_schedule: ["Schedule", "report"],
  add_conversation_member: ["Add", "conversation member"],
  remove_conversation_member: ["Remove", "conversation member"],
};

export const BATCH_ACTIONS: Record<
  string,
  { key: string; verb: string; noun: string }
> = {
  record_production: {
    key: "readings",
    verb: "Record",
    noun: "production reading",
  },
  add_well_equipment: { key: "fields", verb: "Add", noun: "equipment item" },
  add_well_service: { key: "rows", verb: "Log", noun: "service record" },
  record_run_ticket: { key: "tickets", verb: "Log", noun: "run ticket" },
  record_downtime: { key: "events", verb: "Log", noun: "downtime period" },
  record_well_test: { key: "tests", verb: "Record", noun: "well test" },
  record_disposal_readings: {
    key: "readings",
    verb: "Record",
    noun: "disposal reading",
  },
  set_raster_log_depths: { key: "anchors", verb: "Save", noun: "log depth mark" },
  save_tank_allocation: { key: "rows", verb: "Set", noun: "tank allocation row" },
  save_battery_allocation: { key: "rows", verb: "Set", noun: "battery allocation row" },
  save_meter_allocation: { key: "rows", verb: "Set", noun: "meter allocation row" },
  save_node_water_split: { key: "rows", verb: "Set", noun: "water split row" },
  create_gas_campaign: { key: "shutIns", verb: "Record", noun: "shut-in reading" },
  ...Object.fromEntries(
    Object.entries(ROW_BATCHES).map(([name, [verb, noun]]) => [name, { key: "rows", verb, noun }]),
  ),
};

/**
 * Does this tool have a hand-written, plain-English approval title? Every write
 * tool MUST — a Layer-0 test enforces it, so a new write tool can't ship with an
 * approval card a field operator can't read. (Field labels fall back to
 * auto-humanization, which is fine; the title is the curated part.)
 */
export function hasRegisteredApprovalTitle(name: string): boolean {
  return name in ACTION_TITLES || name in BATCH_ACTIONS;
}

/** "tank battery" → "tank batteries"; the last word carries the count. */
function plural(noun: string, n: number): string {
  if (n === 1) return noun;
  if (/[^aeiou]y$/.test(noun)) return `${noun.slice(0, -1)}ies`;
  if (/(s|x|ch|sh)$/.test(noun)) return `${noun}es`;
  return `${noun}s`;
}

/** Friendlier labels than a raw key name; anything unlisted is auto-humanized. */
const LABELS: Record<string, string> = {
  meters: "Meters",
  takeaway: "Delivered to",
  gasTakeaway: "Delivered to",
  body: "Note",
  depthFt: "Depth (ft)",
  row: "Pixel row",
  name: "Name",
  title: "Title",
  method: "Method",
  ticketNo: "Ticket #",
  ticketType: "Type",
  grossBbls: "Gross (bbl)",
  netBbls: "Corrected (bbl)",
  apiGravity: "API gravity",
  bsW: "BS&W (%)",
  transporter: "Transport company",
  oilProduction: "Oil (bbl)",
  gasProduction: "Gas (MCF)",
  saltWater: "Water (bbl)",
  oilStock: "Oil stock (bbl)",
  oilSales: "Oil sales (bbl)",
  volumeMcf: "Gas (MCF)",
  eventType: "Type",
  startDate: "From",
  endDate: "To",
  daysApplied: "Days offline",
  testDate: "Test date",
  durationDays: "Duration (days)",
  startAt: "Start",
  endAt: "End",
  oilBbls: "Oil (bbl)",
  gasMcf: "Gas (MCF)",
  waterBbls: "Water (bbl)",
  preTestShutInDays: "Prior shut-in (days)",
  dateDrilled: "Drilled",
  categoryCode: "Category code",
  invoiceNumber: "Invoice #",
  counterparty: "Counterparty",
  allDay: "All day",
  unitCost: "Unit cost",
  wellIds: "Wells",
  content: "Content",
};

/** Money-valued keys get a $ and thousands separators. */
const MONEY_KEYS = new Set([
  "amount",
  "cost",
  "unitCost",
  "price",
  "grossValue",
  "netValue",
  "deducts",
  "taxes",
  "fees",
  "value",
  "lastPayment",
]);

/**
 * Ids the conversation already establishes — noise (esp. UUIDs) in the card. Any
 * key that IS "id" or ends in "Id" (wellId, leaseId, batteryId, readingId,
 * campaignId, ownerId, …) is hidden generically, so a new tool can never surface a
 * raw uuid to the operator just because its param wasn't added to a list.
 */
function isHiddenKey(key: string): boolean {
  return key === "id" || /Id$/.test(key) || key === APPROVAL_SUMMARY_KEY;
}

/**
 * A LIST of ids (`meterIds`, `wellIds`) is the worst version of the same
 * problem: twenty uuids filled a card nobody could read. But dropping the row
 * is worse still — it is the only thing saying HOW MANY records the write
 * touches, and a card that cannot tell one meter from twenty is not consent.
 * So the ids go and the count stays.
 *
 * A tool whose user needs to see WHICH records it means takes their names
 * instead (`set_meter_takeaway`), and then this never fires.
 */
function isIdList(key: string, v: unknown): v is unknown[] {
  return /Ids$/.test(key) && Array.isArray(v);
}

function isEmpty(v: unknown): boolean {
  return v == null || v === "";
}

export function humanizeKey(key: string): string {
  if (LABELS[key]) return LABELS[key];
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function humanizeToolName(name: string): string {
  const spaced = name.replace(/_/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatMoney(n: number): string {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

/**
 * Values that are a code in the database and a phrase in the field. The card is
 * read by the person deciding, so it says what the setting MEANS.
 */
const VALUE_WORDS: Record<string, Record<string, string>> = {
  meters: { all: "Every gas meter" },
  takeaway: {
    transmission: "A transmission line (RRC gas code 2)",
    plant: "A processing plant (RRC gas code 3)",
  },
  gasTakeaway: {
    transmission: "A transmission line (RRC gas code 2)",
    plant: "A processing plant (RRC gas code 3)",
  },
};

/** Render one value as readable text (— for empty). */
function formatValue(key: string, v: unknown): string {
  if (v == null || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) {
    if (v.length === 0) return "—";
    if (v.every((x) => typeof x !== "object" || x == null)) {
      // Every one of them, however many. This is the line that says WHAT the
      // write touches, and a list the operator cannot finish reading is a list
      // they cannot say no to. Truncating it was the whole bug.
      const words = VALUE_WORDS[key];
      return v.map((x) => words?.[String(x)] ?? String(x)).join(", ");
    }
    return `${v.length} item${v.length === 1 ? "" : "s"}`;
  }
  if (typeof v === "string" && VALUE_WORDS[key]?.[v]) return VALUE_WORDS[key][v];
  if (typeof v === "number") {
    return MONEY_KEYS.has(key) ? formatMoney(v) : v.toLocaleString();
  }
  if (typeof v === "string") {
    return v.length > 240 ? `${v.slice(0, 240)}…` : v;
  }
  const s = JSON.stringify(v);
  return s.length > 120 ? `${s.slice(0, 120)}…` : s;
}

export interface FieldRow {
  label: string;
  value: string;
}

/** A run of table rows that share one parent (the lease, battery, tank or meter they are on). */
export interface RowGroup {
  label: string;
  /** Index of the group's first row in `rows`. */
  from: number;
  count: number;
}

export interface ApprovalView {
  /** Count and kind, from the batch itself ("Create 250 tanks on 41 batteries"). */
  title: string;
  /** The model's one-line account of the write, when it gave one and the title is not already it. */
  summary?: string;
  fields: FieldRow[];
  table?: { columns: string[]; rows: string[][]; total: number; groups?: RowGroup[] };
}

/**
 * Display names for the ids a tool call carries, keyed by id. Resolved by the
 * server as the signed-in user (`approvalNames`), so a record the user cannot
 * see has no name here and the card says so rather than showing a uuid.
 */
export type NameBook = Record<string, string>;

type RefKind =
  | "well"
  | "tank"
  | "battery"
  | "meter"
  | "lease"
  | "gatherer"
  | "owner"
  | "wiOwner"
  | "folder"
  | "file"
  | "connection"
  | "contractor"
  | "employee"
  | "serviceProvider"
  | "inventoryItem"
  | "task"
  | "event"
  | "note"
  | "infoField"
  | "rrcOperator"
  | "callIn"
  | "structureMap"
  | "reconAlert"
  | "statement"
  | "transaction"
  | "invoice"
  | "channel"
  | "member";

const KIND_LABELS: Record<RefKind, string> = {
  well: "Well",
  tank: "Tank",
  battery: "Battery",
  meter: "Meter",
  lease: "Lease",
  gatherer: "Gatherer",
  owner: "Owner",
  wiOwner: "Working-interest owner",
  folder: "Folder",
  file: "File",
  connection: "Connection",
  contractor: "Contractor",
  employee: "Employee",
  serviceProvider: "Service provider",
  inventoryItem: "Inventory item",
  task: "Task",
  event: "Event",
  note: "Note",
  infoField: "Info sheet field",
  rrcOperator: "RRC operator",
  callIn: "Call-in",
  structureMap: "Structure map",
  reconAlert: "Recon alert",
  statement: "Statement",
  transaction: "Ledger entry",
  invoice: "Invoice",
  channel: "Conversation",
  member: "Member",
};

/** Argument names that carry an id of a known kind. */
const ID_KEY_KINDS: Record<string, RefKind> = {
  wellId: "well",
  wellIds: "well",
  tankId: "tank",
  tankIds: "tank",
  batteryId: "battery",
  meterId: "meter",
  leaseId: "lease",
  gathererId: "gatherer",
  ownerId: "owner",
  parentId: "folder",
  folderId: "folder",
  fromFolderId: "folder",
  toFolderId: "folder",
  fileId: "file",
  fileIds: "file",
  connectionId: "connection",
  wiOwnerId: "wiOwner",
  callInId: "callIn",
  invoiceId: "invoice",
  channelId: "channel",
  userId: "member",
};

/** Tools whose bare `id` is one of the kinds above. */
const BARE_ID_KINDS: Record<string, RefKind> = {
  update_royalty_owner: "owner",
  delete_royalty_owner: "owner",
  update_gatherer: "gatherer",
  delete_gatherer: "gatherer",
  update_contractor: "contractor",
  delete_contractor: "contractor",
  update_employee: "employee",
  delete_employee: "employee",
  update_service_provider: "serviceProvider",
  delete_service_provider: "serviceProvider",
  update_inventory_item: "inventoryItem",
  delete_inventory_item: "inventoryItem",
  update_task: "task",
  delete_task: "task",
  update_calendar_event: "event",
  delete_calendar_event: "event",
  delete_note: "note",
  set_note_tags: "note",
  rename_well_info_field: "infoField",
  delete_well_info_field: "infoField",
  rename_wi_owner: "wiOwner",
  remove_wi_owner: "wiOwner",
  remove_rrc_operator: "rrcOperator",
  set_primary_rrc_operator: "rrcOperator",
  update_structure_map: "structureMap",
  delete_structure_map: "structureMap",
  save_recon_alert: "reconAlert",
  delete_recon_alert: "reconAlert",
  set_recon_alert_enabled: "reconAlert",
  delete_statement: "statement",
  update_transaction: "transaction",
  delete_transactions: "transaction",
};

/** A node id typed by a sibling argument: `fromId` is whatever `fromType` says. */
const TYPED_PAIRS: Record<string, string> = { fromId: "fromType", toId: "toType", nodeId: "nodeType" };
const PAIR_LABELS: Record<string, string> = { fromId: "From", toId: "To", nodeId: "Node" };

function nodeKind(type: unknown): RefKind | null {
  switch (type) {
    case "well":
    case "injection":
      return "well";
    case "tank":
    case "meter":
    case "battery":
    case "gatherer":
      return type;
    default:
      return null;
  }
}

function refKind(toolName: string, key: string, obj: Record<string, unknown>): RefKind | null {
  if (key in TYPED_PAIRS) return nodeKind(obj[TYPED_PAIRS[key]]);
  if (key === "id") return BARE_ID_KINDS[toolName] ?? null;
  return ID_KEY_KINDS[key] ?? null;
}

const isRefId = (v: unknown): v is string => typeof v === "string" && v !== "" && v !== "root";

function asObj(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
}

/** The list argument of a batch tool, when the call carries one. */
function batchItems(name: string, obj: Record<string, unknown>): Record<string, unknown>[] | null {
  const batch = BATCH_ACTIONS[name];
  const list = batch ? obj[batch.key] : undefined;
  if (!Array.isArray(list) || list.length === 0) return null;
  return list.map((it) => asObj(it));
}

/**
 * Every id a call refers to, by kind: what the server resolves to names before
 * the card is shown (one lookup per kind per card). Pure; the lookup is
 * `approvalNames`.
 */
export function approvalRefs(name: string, input: unknown): Record<string, string[]> {
  const obj = asObj(input);
  const out: Record<string, Set<string>> = {};
  const add = (o: Record<string, unknown>) => {
    for (const [k, v] of Object.entries(o)) {
      const kind = refKind(name, k, o);
      if (!kind) continue;
      for (const id of Array.isArray(v) ? v : [v]) {
        if (isRefId(id)) (out[kind] ??= new Set()).add(id);
      }
    }
  };
  add(obj);
  for (const it of batchItems(name, obj) ?? []) add(it);
  return Object.fromEntries(Object.entries(out).map(([k, set]) => [k, [...set]]));
}

/** The name for one id, or the honest alternative: the user cannot see such a record. */
function nameFor(kind: RefKind, id: unknown, names: NameBook): string {
  if (!isRefId(id)) return "—";
  return names[id] ?? `unknown ${kind}`;
}

function refLabel(kind: RefKind, key: string, list: boolean): string {
  if (key in PAIR_LABELS) return PAIR_LABELS[key];
  return list ? plural(KIND_LABELS[kind], 2) : KIND_LABELS[kind];
}

function refValue(kind: RefKind, v: unknown, names: NameBook): string {
  if (Array.isArray(v)) return v.length ? v.map((id) => nameFor(kind, id, names)).join(", ") : "—";
  return nameFor(kind, v, names);
}

/** The sibling that types a node id is folded into the name; it has nothing to add on its own. */
const TYPE_KEYS = new Set(Object.values(TYPED_PAIRS));

const MAX_TABLE_COLS = 8;

/**
 * Scalar (non-array) fields of an object as labelled rows. With a name book,
 * every id the call carries becomes the record's name ("Tank: Roach T101");
 * without one the ids are dropped and an id list keeps only its count, so a
 * uuid never reaches the operator either way.
 */
function scalarFields(
  obj: Record<string, unknown>,
  skip: Set<string>,
  toolName = "",
  names?: NameBook,
): FieldRow[] {
  const out: FieldRow[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (skip.has(k) || isEmpty(v) || k === APPROVAL_SUMMARY_KEY) continue;
    const kind = refKind(toolName, k, obj);
    if (kind && names) {
      out.push({ label: refLabel(kind, k, Array.isArray(v)), value: refValue(kind, v, names) });
      continue;
    }
    if (names && TYPE_KEYS.has(k) && nodeKind(v)) continue;
    if (isIdList(k, v)) {
      out.push({ label: humanizeKey(k.replace(/Ids$/, "s")), value: `${v.length} selected` });
      continue;
    }
    if (isHiddenKey(k) || kind) continue;
    out.push({ label: humanizeKey(k), value: formatValue(k, v) });
  }
  return out;
}

/** The parent a batch is grouped under: the first of these every row carries. */
const GROUP_KEYS = ["batteryId", "leaseId", "tankId", "meterId", "wellId"] as const;

function groupKeyFor(items: Record<string, unknown>[], names?: NameBook): string | undefined {
  if (!names || items.length < 2) return undefined;
  return GROUP_KEYS.find((k) => items.every((it) => isRefId(it[k])));
}

/**
 * Every row of a batch as a table, never capped: the wrong row is as likely to
 * be the 200th as the first, and a card that hides it is not consent. With a
 * name book the ids become name columns (first, since they say WHICH record)
 * and rows are grouped under their shared parent.
 */
function buildTable(
  items: Record<string, unknown>[],
  toolName = "",
  names?: NameBook,
): NonNullable<ApprovalView["table"]> {
  const groupKey = groupKeyFor(items, names);
  const keys: string[] = [];
  for (const it of items) {
    for (const k of Object.keys(it)) if (!keys.includes(k)) keys.push(k);
  }
  const first = items[0] ?? {};
  const refKeys = names
    ? keys.filter((k) => k !== groupKey && refKind(toolName, k, first) && items.some((it) => !isEmpty(it[k])))
    : [];
  const dataKeys = keys
    .filter((k) => k !== groupKey && !refKind(toolName, k, first) && !isHiddenKey(k))
    .filter((k) => !(names && TYPE_KEYS.has(k) && nodeKind(first[k])))
    .filter((k) => k !== APPROVAL_SUMMARY_KEY && items.some((it) => !isEmpty(it[k])))
    .slice(0, MAX_TABLE_COLS);
  const columns = [
    ...refKeys.map((k) => refLabel(refKind(toolName, k, first)!, k, Array.isArray(first[k]))),
    ...dataKeys.map((k) => humanizeKey(k)),
  ];
  const render = (it: Record<string, unknown>) => [
    ...refKeys.map((k) => refValue(refKind(toolName, k, it)!, it[k], names!)),
    ...dataKeys.map((k) => formatValue(k, it[k])),
  ];

  if (!groupKey) return { columns, rows: items.map(render), total: items.length };

  // Stable by the parent's first appearance: the operator reads one lease's
  // tanks together, in the order they were given.
  const order: string[] = [];
  const byParent = new Map<string, Record<string, unknown>[]>();
  for (const it of items) {
    const id = it[groupKey] as string;
    if (!byParent.has(id)) {
      byParent.set(id, []);
      order.push(id);
    }
    byParent.get(id)!.push(it);
  }
  const kind = ID_KEY_KINDS[groupKey];
  const rows: string[][] = [];
  const groups: RowGroup[] = [];
  for (const id of order) {
    const members = byParent.get(id)!;
    groups.push({ label: nameFor(kind, id, names!), from: rows.length, count: members.length });
    for (const it of members) rows.push(render(it));
  }
  return { columns, rows, total: items.length, groups };
}

/** "Create 250 tanks" plus where they go when the rows are grouped. */
function batchTitle(name: string, n: number, groups: RowGroup[] | undefined, groupKey: string | undefined): string {
  const batch = BATCH_ACTIONS[name];
  const base = (n === 1 && ACTION_TITLES[name]) || `${batch.verb} ${n} ${plural(batch.noun, n)}`;
  if (!groups || !groupKey) return base;
  if (groups.length === 1) return `${base} on ${groups[0].label}`;
  const kind = KIND_LABELS[ID_KEY_KINDS[groupKey]].toLowerCase();
  return `${base} on ${groups.length} ${plural(kind, groups.length)}`;
}

/**
 * The model's summary, made to sit on one or two lines of a card: whitespace
 * and newlines collapsed, markdown and wrapping quotes dropped, em dashes made
 * commas, no trailing period, first letter capitalized. Blank comes back
 * undefined so the static title takes over.
 */
export function cleanSummary(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw
    .replace(/[*`]+/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*\u2014\s*/g, ", ")
    .trim()
    .replace(/^["'\u201c\u2018]+|["'\u201d\u2019]+$/g, "")
    .replace(/[.\s]+$/, "")
    .trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : undefined;
}

/**
 * Turn a raw tool call into a plain-English, non-technical view. `names` is the
 * server's answer for the ids the call carries (`approvalRefs` →
 * `approvalNames`); without it the card still renders, with ids hidden.
 */
export function describeApproval(name: string, input: unknown, names?: NameBook): ApprovalView {
  const obj = asObj(input);
  const summary = cleanSummary(obj[APPROVAL_SUMMARY_KEY]);

  const items = batchItems(name, obj);
  if (items) {
    const batch = BATCH_ACTIONS[name];
    const table = buildTable(items, name, names);
    const title = batchTitle(name, items.length, table.groups, groupKeyFor(items, names));
    return {
      title,
      ...(summary && summary !== title ? { summary } : {}),
      fields: scalarFields(obj, new Set([batch.key]), name, names),
      table,
    };
  }

  return {
    title: summary ?? ACTION_TITLES[name] ?? humanizeToolName(name),
    fields: scalarFields(obj, new Set(), name, names),
  };
}

/** How each row of a batch is named when the card reports on it: its record's name, else what the user typed. */
export function rowLabels(name: string, input: unknown, names?: NameBook): string[] {
  const obj = asObj(input);
  const items = batchItems(name, obj) ?? [obj];
  const own = (keys: string[]) => (it: Record<string, unknown>) => {
    for (const k of keys) if (typeof it[k] === "string" && (it[k] as string).trim()) return it[k] as string;
    return null;
  };
  // A row that names its own record (a tank number, a lease name) is that;
  // a row about an existing record (a reading on a tank) is the record's name.
  const self = own(["name", "title", "tankNo", "meterNo", "leaseNo", "company", "label"]);
  const when = own(["date"]);
  return items.map((it, i) => {
    const mine = self(it);
    if (mine) return mine;
    if (names) {
      for (const [k, v] of Object.entries(it)) {
        const kind = refKind(name, k, it);
        if (kind && isRefId(v) && names[v]) return names[v];
      }
    }
    return when(it) ?? `row ${i + 1}`;
  });
}

/** "Create" → "Created"; the few verbs English does not spell that way are listed. */
function pastTense(verb: string): string {
  const special: Record<string, string> = {
    Set: "Set",
    Draw: "Drew",
    "Add wells to": "Added wells to",
    "Set tanks on": "Set tanks on",
    "Call in": "Called in",
    Log: "Logged",
  };
  if (special[verb]) return special[verb];
  return verb.endsWith("e") ? `${verb}d` : `${verb}ed`;
}

export interface OutcomeView {
  /** "Created 250 tanks", "Nothing was saved: 4 of 44 tanks need fixing", "Declined. Nothing was saved." */
  title: string;
  /** The rows that were not saved, each with the reason in the user's words. */
  refused: { label: string; reason: string }[];
}

/**
 * What the card shows after the user answered: the outcome, in the same words
 * as the request. `state` is the tool part's state once settled.
 */
export function describeOutcome(
  name: string,
  input: unknown,
  output: unknown,
  state: "output-available" | "output-error" | "output-denied",
  names?: NameBook,
): OutcomeView {
  if (state === "output-denied") return { title: "Declined. Nothing was saved.", refused: [] };
  const out = asObj(output);
  const batch = BATCH_ACTIONS[name];
  const err = typeof out.error === "string" ? out.error : undefined;
  if (state === "output-error") return { title: `Not saved: ${err ?? "something went wrong"}`, refused: [] };

  const rows = Array.isArray(out.rows) ? (out.rows as { ok?: boolean; error?: string }[]) : null;
  if (!batch || !rows || typeof out.total !== "number") {
    return out.ok === false
      ? { title: `Not saved: ${err ?? "the change was refused"}`, refused: [] }
      : { title: "Saved.", refused: [] };
  }

  const total = out.total as number;
  const written = typeof out.written === "number" ? (out.written as number) : rows.filter((r) => r.ok).length;
  const failed = total - written;
  const labels = rowLabels(name, input, names);
  const refused = rows
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r.ok === false && r.error && !/^not written: /.test(r.error))
    .map(({ r, i }) => ({ label: labels[i] ?? `row ${i + 1}`, reason: r.error! }));
  const nouns = plural(batch.noun, total);
  if (failed === 0) return { title: `${pastTense(batch.verb)} ${written} ${plural(batch.noun, written)}`, refused };
  if (written === 0) {
    return {
      title: `Nothing was saved: ${refused.length} of ${total} ${nouns} ${refused.length === 1 ? "needs" : "need"} fixing`,
      refused,
    };
  }
  return { title: `${pastTense(batch.verb)} ${written} of ${total} ${nouns}; ${failed} not saved`, refused };
}
