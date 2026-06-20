import type React from "react";

type IconProps = React.ComponentProps<"svg">;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

// Arrow used inside the call-to-action buttons.
export const ArrowIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

// "Real-time data" - activity / pulse.
export const PulseIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M3 12h4l2 6 4-14 2 8h6" />
  </svg>
);

// "AI copilot" - sparkle.
export const SparkleIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.4 2.4M15.3 15.3l2.4 2.4M17.7 6.3l-2.4 2.4M8.7 15.3l-2.4 2.4" />
  </svg>
);

// "One unified platform" - check inside circle.
export const CheckCircleIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </svg>
);

// "Understands your well logs" - baseline + horizontal log trace.
export const LogIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M3 20h18" />
    <path d="M3 10q3-6 6 0t6 0t6 0" />
  </svg>
);

// "Reasons across everything" - connected nodes.
export const NetworkIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="5" cy="6" r="2.25" />
    <circle cx="19" cy="6" r="2.25" />
    <circle cx="12" cy="18" r="2.25" />
    <path d="M7 7.6 10.2 16M17 7.6 13.8 16M7.2 6h9.6" />
  </svg>
);

// "Answers in plain English" - speech bubble.
export const ChatIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M21 11.5a7.5 7.5 0 0 1-10.8 6.7L4 19.5l1.3-4.2A7.5 7.5 0 1 1 21 11.5z" />
    <path d="M8.5 10.5h7M8.5 13h4.5" />
  </svg>
);
