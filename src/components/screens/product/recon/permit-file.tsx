"use client";

/**
 * The Recon permit's file as it opens from `PermitPanel`: each row there is a
 * link to the RRC's PDF, which the browser opens in a tab of its own. The
 * permit is simulated (`recon-fixture.ts`), so its file is too: the W-1 is the
 * RRC's "As Approved" facsimile layout (page 1 of the form, as the RRC prints
 * it for every permit, e.g. the app's own test fixture `w1-753284.pdf`) filled
 * from the same permit record the panel and the alert email read, and the
 * lease plat is drawn to the W-1's own calls.
 */
import { FIELD_NAME, FIELD_NO } from "@/lib/screens/rrc-ids";
import { PERMIT_LNG_LAT, milesBetween, reconPermitWithFile as P } from "@/lib/screens/recon-fixture";

/** Graham, the county seat and the nearest town. */
const GRAHAM: [number, number] = [-98.5895, 33.1068];

const API = String(P.api);
const PERMIT_NO = String(P.permitNo);
const APPROVED = "Oct 24, 2026";
const SUBMITTED = "Oct 13, 2026";

/** Survey calls for the plat and the W-1 (simulated with the permit). */
const LEASE = { acres: "160.00", fromN: 467, fromW: 1320, side: 2640 };
const SURVEY = { name: "BBB&C RR CO", section: "42", abstract: "A-0142", fromN: 1787, fromW: 1320 };
/** Johnson A 3, half a mile east, in the same field. */
const NEAREST_FT = 2640;

function direction(from: [number, number], to: [number, number]): string {
  const dx = (to[0] - from[0]) * Math.cos((from[1] * Math.PI) / 180);
  const dy = to[1] - from[1];
  const deg = (Math.atan2(dx, dy) * 180) / Math.PI;
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(((deg + 360) % 360) / 45) % 8];
}
const TOWN_MILES = Math.round(milesBetween(GRAHAM, PERMIT_LNG_LAT));
const TOWN_DIR = direction(GRAHAM, PERMIT_LNG_LAT);

const apiDashed = `42-${API.slice(0, 3)}-${API.slice(3)}`;

/** The browser's PDF tab, over the screen. */
export function PdfTab({ fileName, pages, children }: { fileName: string; pages: number; children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-10 bottom-6 top-6 z-[110] flex flex-col overflow-hidden rounded-lg shadow-2xl ring-1 ring-black/40 animate-in fade-in-0 zoom-in-95 duration-300">
      <div className="flex h-10 shrink-0 items-center justify-between bg-[#323639] px-4 text-[13px] text-white/90">
        <span className="truncate">{fileName}</span>
        <span className="flex items-center gap-4 tabular-nums text-white/70">
          <span>
            1 / {pages}
          </span>
          <span>100%</span>
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden bg-[#525659] p-6">{children}</div>
    </div>
  );
}

function Box({ n, label, children, className = "" }: { n?: string; label: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={`border-b border-r border-black/70 px-1.5 py-1 ${className}`}>
      <div className="text-[8.5px] leading-tight">
        {n && <span className="mr-1">{n}.</span>}
        {label}
      </div>
      <div className="min-h-[14px] pl-3 font-mono text-[11px] font-semibold uppercase">{children}</div>
    </div>
  );
}

const X = ({ on, label }: { on?: boolean; label: string }) => (
  <span className="mr-3 inline-flex items-center gap-1 whitespace-nowrap">
    <span className="inline-flex size-3 items-center justify-center border border-black text-[9px] font-bold leading-none">{on ? "X" : ""}</span>
    {label}
  </span>
);

/** Page 1 of the approved W-1. */
export function W1Page() {
  return (
    <div className="mx-auto h-full w-[1040px] overflow-hidden bg-white px-8 py-6 text-black shadow-lg">
      <div className="grid grid-cols-[240px_1fr_220px] items-start gap-4 text-[10px]">
        <div className="leading-snug">
          <div>API No. <span className="ml-2 font-mono text-[12px] font-semibold">{apiDashed}</span></div>
          <div>Drilling Permit # <span className="ml-2 font-mono text-[12px] font-semibold">{PERMIT_NO.replace(/^0/, "")}</span></div>
          <div>SWR Exception Case/Docket No.</div>
        </div>
        <div className="text-center leading-snug">
          <div className="text-[13px] font-bold">RAILROAD COMMISSION OF TEXAS</div>
          <div className="font-semibold">OIL &amp; GAS DIVISION</div>
          <div className="mt-1 font-semibold">APPLICATION FOR PERMIT TO DRILL, RECOMPLETE, OR RE-ENTER</div>
          <div className="text-[8.5px]">This facsimile W-1 was generated electronically from data submitted to the RRC.</div>
          <div className="text-[8.5px]">A certification of the automated data is available in the RRC&apos;s Austin office.</div>
        </div>
        <div className="text-right leading-snug">
          <div className="text-[13px] font-bold">FORM W-1</div>
          <div>07/2004</div>
          <div className="mt-1">Permit Status: <span className="font-semibold">Approved</span></div>
        </div>
      </div>

      <div className="mt-3 border-l border-t border-black/70">
        <div className="grid grid-cols-[150px_1fr_1fr]">
          <Box n="1" label="RRC Operator No.">{String(P.opNo)}</Box>
          <Box n="2" label="Operator's Name (as shown on form P-5, Organization Report)">{String(P.op)}</Box>
          <Box n="3" label="Operator Address (include street, city, state, zip):">P O BOX 1187, GRAHAM, TX 76450</Box>
        </div>
        <div className="grid grid-cols-[1fr_150px]">
          <Box n="4" label="Lease Name">{String(P.lease)}</Box>
          <Box n="5" label="Well No.">{String(P.well)}</Box>
        </div>
        <div className="border-b border-r border-black/70 bg-black/[.06] px-1.5 py-0.5 text-[9px] font-bold">GENERAL INFORMATION</div>
        <div className="border-b border-r border-black/70 px-1.5 py-1.5 text-[9.5px]">
          <span className="mr-4">6. Purpose of filing (mark ALL appropriate boxes):</span>
          <X on label="New Drill" />
          <X label="Recompletion" />
          <X label="Reclass" />
          <X label="Field Transfer" />
          <X label="Re-Enter" />
        </div>
        <div className="border-b border-r border-black/70 px-1.5 py-1.5 text-[9.5px]">
          <span className="mr-4">7. Wellbore Profile (mark ALL appropriate boxes):</span>
          <X on label="Vertical" />
          <X label="Horizontal (Also File Form W-1H)" />
          <X label="Directional (Also File Form W-1D)" />
          <X label="Sidetrack" />
        </div>
        <div className="grid grid-cols-[150px_1fr_1fr]">
          <Box n="8" label="Total Depth">{Number(P.depth).toLocaleString("en-US")}</Box>
          <Box n="9" label="Do you have the right to develop the minerals under any right-of-way?">
            <span className="font-sans text-[9.5px] font-normal normal-case"><X on label="Yes" /><X label="No" /></span>
          </Box>
          <Box n="10" label="Is this well subject to Statewide Rule 36 (hydrogen sulfide area)?">
            <span className="font-sans text-[9.5px] font-normal normal-case"><X label="Yes" /><X on label="No" /></span>
          </Box>
        </div>
        <div className="border-b border-r border-black/70 bg-black/[.06] px-1.5 py-0.5 text-[9px] font-bold">SURFACE LOCATION AND ACREAGE INFORMATION</div>
        <div className="grid grid-cols-[150px_200px_1fr]">
          <Box n="11" label="RRC District No.">{String(P.district)}</Box>
          <Box n="12" label="County">{String(P.county)}</Box>
          <Box n="13" label="Surface Location">
            <span className="font-sans text-[9.5px] font-normal normal-case"><X on label="Land" /><X label="Bay/Estuary" /><X label="Inland Waterway" /><X label="Offshore" /></span>
          </Box>
        </div>
        <Box n="14" label="This well is to be located">
          {TOWN_MILES} miles in a {TOWN_DIR} direction from GRAHAM, which is the nearest town in the county of the well site.
        </Box>
        <div className="grid grid-cols-[90px_90px_1fr_120px_160px_1fr]">
          <Box n="15" label="Section">{SURVEY.section}</Box>
          <Box n="16" label="Block" />
          <Box n="17" label="Survey">{SURVEY.name}</Box>
          <Box n="18" label="Abstract No.">{SURVEY.abstract}</Box>
          <Box n="19" label="Distance to nearest lease line:">{LEASE.fromN} ft.</Box>
          <Box n="20" label="Number of contiguous acres in lease, pooled unit, or unitized tract:">{LEASE.acres}</Box>
        </div>
        <Box n="21" label="Lease Perpendiculars:">
          {LEASE.fromN} ft from the N line and {LEASE.fromW.toLocaleString("en-US")} ft from the W line.
        </Box>
        <Box n="22" label="Survey Perpendiculars:">
          {SURVEY.fromN.toLocaleString("en-US")} ft from the N line and {SURVEY.fromW.toLocaleString("en-US")} ft from the W line.
        </Box>
        <div className="border-b border-r border-black/70 bg-black/[.06] px-1.5 py-0.5 text-[9px] font-bold">FIELD INFORMATION</div>
        <div className="grid grid-cols-[70px_100px_1fr_130px_110px_130px_130px] text-[8.5px]">
          {["26. RRC District No.", "27. Field No.", "28. Field Name (exactly as shown in RRC records)", "29. Well Type", "30. Completion Depth", "31. Distance to Nearest Well in this Reservoir", "32. Number of Wells on this lease in this Reservoir"].map((h) => (
            <div key={h} className="border-b border-r border-black/70 px-1.5 py-1 leading-tight">{h}</div>
          ))}
          {[String(P.district), FIELD_NO, FIELD_NAME, "Oil Well", Number(P.depth).toLocaleString("en-US"), NEAREST_FT.toLocaleString("en-US") + ".00", "3"].map((v, i) => (
            <div key={i} className="border-b border-r border-black/70 px-1.5 py-1 font-mono text-[11px] font-semibold">{v}</div>
          ))}
        </div>
        <div className="grid grid-cols-[1fr_380px]">
          <Box label="Remarks" className="min-h-16" />
          <Box label="Certificate: I certify that information stated in this application is true and complete, to the best of my knowledge.">
            <span className="mt-1 block">TONK CREEK OPERATING LLC · {SUBMITTED}</span>
          </Box>
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[9px]">
        <span>RRC Use Only · Data Validation Time Stamp: {APPROVED} 9:42 AM (&apos;As Approved&apos; Version)</span>
        <span>Page 1 of 1</span>
      </div>
    </div>
  );
}

/** The lease plat, drawn to the W-1's calls. */
export function LeasePlat() {
  // 2,640 ft square lease, drawn at 0.14 px per ft.
  const k = 0.14;
  const ox = 300;
  const oy = 170;
  const side = LEASE.side * k;
  const wx = ox + LEASE.fromW * k;
  const wy = oy + LEASE.fromN * k;
  const [lng, lat] = PERMIT_LNG_LAT;
  return (
    <div className="mx-auto h-full w-[1040px] overflow-hidden bg-white text-black shadow-lg">
      <svg viewBox="0 0 1040 680" className="h-full w-full" fontFamily="Arial, sans-serif">
        {/* Section 42, survey lines */}
        <rect x={ox - 150} y={oy - 60} width={side + 300} height={side + 100} fill="none" stroke="#000" strokeDasharray="10 6" strokeWidth={1} />
        <text x={ox - 140} y={oy - 42} fontSize={12}>SECTION {SURVEY.section} · {SURVEY.name} SURVEY · {SURVEY.abstract}</text>
        {/* The lease */}
        <rect x={ox} y={oy} width={side} height={side} fill="#000" fillOpacity={0.03} stroke="#000" strokeWidth={2.5} />
        <text x={ox + side / 2} y={oy + side - 20} fontSize={15} fontWeight={700} textAnchor="middle">{String(P.lease)}</text>
        <text x={ox + side / 2} y={oy + side - 2} fontSize={12} textAnchor="middle">{LEASE.acres} ACRES</text>
        {/* Calls from the lease lines */}
        <line x1={wx} y1={oy} x2={wx} y2={wy} stroke="#000" strokeDasharray="4 3" />
        <line x1={ox} y1={wy} x2={wx} y2={wy} stroke="#000" strokeDasharray="4 3" />
        <text x={wx + 6} y={oy + (wy - oy) / 2 + 4} fontSize={12}>{LEASE.fromN}&apos;</text>
        <text x={ox + (wx - ox) / 2} y={wy - 6} fontSize={12} textAnchor="middle">{LEASE.fromW.toLocaleString("en-US")}&apos;</text>
        {/* The well */}
        <circle cx={wx} cy={wy} r={7} fill="none" stroke="#000" strokeWidth={2} />
        <circle cx={wx} cy={wy} r={2.5} fill="#000" />
        <text x={wx + 12} y={wy + 18} fontSize={13} fontWeight={700}>NO. {String(P.well)}</text>
        <text x={wx + 12} y={wy + 34} fontSize={11}>LAT {lat.toFixed(6)}° N</text>
        <text x={wx + 12} y={wy + 48} fontSize={11}>LONG {Math.abs(lng).toFixed(6)}° W</text>
        <text x={wx + 12} y={wy + 62} fontSize={11}>NAD 27</text>
        {/* Nearest well in the reservoir, half a mile east */}
        <line x1={ox + side} y1={wy} x2={ox + side + 60} y2={wy} stroke="#000" markerEnd="url(#arrow)" />
        <text x={ox + side + 66} y={wy + 4} fontSize={11}>{NEAREST_FT.toLocaleString("en-US")}&apos; TO JOHNSON A NO. 3</text>
        <defs>
          <marker id="arrow" markerWidth={8} markerHeight={8} refX={7} refY={4} orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="#000" />
          </marker>
        </defs>
        {/* North arrow and scale */}
        <g transform="translate(900 90)">
          <path d="M0 -40 L12 10 L0 0 L-12 10 Z" fill="#000" />
          <text y={30} fontSize={16} fontWeight={700} textAnchor="middle">N</text>
        </g>
        <g transform="translate(830 560)">
          <rect width={80} height={6} fill="#000" />
          <rect x={80} width={80} height={6} fill="none" stroke="#000" />
          <text y={22} fontSize={10}>0</text>
          <text x={80} y={22} fontSize={10} textAnchor="middle">500</text>
          <text x={160} y={22} fontSize={10} textAnchor="end">1,000 FT</text>
        </g>
        {/* Title block */}
        <g transform="translate(40 600)">
          <rect width={960} height={64} fill="none" stroke="#000" />
          <text x={14} y={24} fontSize={14} fontWeight={700}>{String(P.op)} · {String(P.lease)} NO. {String(P.well)}</text>
          <text x={14} y={46} fontSize={11}>
            {TOWN_MILES} MILES {TOWN_DIR} OF GRAHAM · {String(P.county)} COUNTY, TEXAS · API {apiDashed} · PERMIT {PERMIT_NO.replace(/^0/, "")}
          </text>
          <text x={946} y={46} fontSize={11} textAnchor="end">LEASE PLAT · {APPROVED.toUpperCase()}</text>
        </g>
      </svg>
    </div>
  );
}
