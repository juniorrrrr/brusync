import type { ReactNode } from "react";

function Svg({ children, size = 18 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
    >
      {children}
    </svg>
  );
}

export type IconProps = { size?: number };

export const IconGrid = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </Svg>
);
export const IconChart = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <path d="M3 3v18h18" />
    <path d="m7 14 4-4 3 3 5-6" />
  </Svg>
);
export const IconWallet = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </Svg>
);
export const IconTarget = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="12" r="8" />
  </Svg>
);
export const IconReport = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </Svg>
);
export const IconUsers = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <circle cx="9" cy="8" r="3" />
    <path d="M2 20c0-3.3 3-6 7-6s7 2.7 7 6" />
    <circle cx="18" cy="9" r="2.4" />
    <path d="M17 14.2c2.3.4 4 2.3 4 5.8" />
  </Svg>
);
export const IconFunnel = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <path d="M3 4h18l-7 9v6l-4 2v-8z" />
  </Svg>
);
export const IconCalendar = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
  </Svg>
);
export const IconSettings = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z" />
  </Svg>
);
export const IconRobot = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <rect x="4" y="8" width="16" height="12" rx="3" />
    <path d="M12 8V4M9 4h6" />
    <circle cx="9" cy="14" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15" cy="14" r="1.2" fill="currentColor" stroke="none" />
  </Svg>
);
export const IconPackage = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <path d="m21 8-9-5-9 5 9 5 9-5z" />
    <path d="M3 8v8l9 5 9-5V8M12 13v8" />
  </Svg>
);
export const IconBuilding = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <rect x="4" y="3" width="16" height="18" rx="1" />
    <path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1" />
  </Svg>
);
export const IconBell = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </Svg>
);
export const IconArrowSwap = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <path d="M17 3v12M17 15l-4-4M17 15l4-4M7 21V9M7 9l-4 4M7 9l4 4" />
  </Svg>
);
export const IconDoc = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M9 13h6M9 17h6" />
  </Svg>
);
export const IconCheck = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);
export const IconLogout = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </Svg>
);
export const IconMenu = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </Svg>
);
export const IconX = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);
export const IconChevronDown = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);
export const IconArrowLeft = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);
export const IconBolt = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
  </Svg>
);
export const IconLock = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </Svg>
);
export const IconSearch = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </Svg>
);
export const IconFilter = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <path d="M4 5h16M7 12h10M10 19h4" />
  </Svg>
);
export const IconPaperclip = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <path d="M21 12.5 12.5 21a5 5 0 0 1-7-7L14 5.5a3.5 3.5 0 0 1 5 5L10.5 19a2 2 0 0 1-3-3l7-7" />
  </Svg>
);
export const IconDownload = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </Svg>
);
export const IconTrash = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
  </Svg>
);
export const IconPlus = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const IconSort = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <path d="M7 3v18M7 21l-3-3M7 21l3-3M17 21V3M17 3l-3 3M17 3l3 3" />
  </Svg>
);
export const IconPencil = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </Svg>
);
export const IconDotsHorizontal = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
  </Svg>
);
export const IconMessage = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);
export const IconCheckCircle = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.5 2.5 2.5 5-5" />
  </Svg>
);
export const IconClock = ({ size }: IconProps = {}) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </Svg>
);
