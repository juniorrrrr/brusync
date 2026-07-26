import {
  IconBolt,
  IconCheckCircle,
  IconDoc,
  IconFolder,
  IconMessage,
  IconReport,
  IconServer,
  IconTag,
  IconTarget,
  IconUsers,
  IconWallet,
} from "@/components/ui/icons";
import type { ProcessCategoryColor } from "@/types/processes";

const ICON_MAP: Record<string, typeof IconFolder> = {
  target: IconTarget,
  message: IconMessage,
  "check-circle": IconCheckCircle,
  wallet: IconWallet,
  doc: IconDoc,
  report: IconReport,
  users: IconUsers,
  bolt: IconBolt,
  tag: IconTag,
  server: IconServer,
  folder: IconFolder,
};

const COLOR_STYLE: Record<ProcessCategoryColor, { bg: string; fg: string }> = {
  info: { bg: "rgba(59, 130, 246, 0.12)", fg: "#3b82f6" },
  warn: { bg: "rgba(217, 119, 6, 0.12)", fg: "#d97706" },
  ok: { bg: "rgba(22, 163, 74, 0.12)", fg: "#16a34a" },
  neutral: { bg: "rgba(100, 116, 139, 0.12)", fg: "#64748b" },
  danger: { bg: "rgba(220, 38, 38, 0.12)", fg: "#dc2626" },
};

export function ProcessCategoryIcon({
  icon,
  color,
  size = 18,
}: {
  icon: string;
  color: ProcessCategoryColor;
  size?: number;
}) {
  const Icon = ICON_MAP[icon] ?? IconFolder;
  const style = COLOR_STYLE[color];

  return (
    <span className="crm-proc-category-ico" style={{ background: style.bg, color: style.fg }}>
      <Icon size={size} />
    </span>
  );
}
