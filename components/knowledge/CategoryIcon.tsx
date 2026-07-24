import {
  IconArchive,
  IconBolt,
  IconBook,
  IconDoc,
  IconLock,
  IconReport,
  IconServer,
  IconTarget,
  IconUsers,
  IconWallet,
} from "@/components/ui/icons";
import type { KnowledgeCategoryColor } from "@/types/knowledge";

const ICON_MAP: Record<string, typeof IconDoc> = {
  target: IconTarget,
  report: IconReport,
  wallet: IconWallet,
  doc: IconDoc,
  bolt: IconBolt,
  users: IconUsers,
  server: IconServer,
  lock: IconLock,
  book: IconBook,
  archive: IconArchive,
};

const COLOR_STYLE: Record<KnowledgeCategoryColor, { bg: string; fg: string }> = {
  info: { bg: "rgba(59, 130, 246, 0.12)", fg: "#3b82f6" },
  warn: { bg: "rgba(217, 119, 6, 0.12)", fg: "#d97706" },
  ok: { bg: "rgba(22, 163, 74, 0.12)", fg: "#16a34a" },
  neutral: { bg: "rgba(100, 116, 139, 0.12)", fg: "#64748b" },
  danger: { bg: "rgba(220, 38, 38, 0.12)", fg: "#dc2626" },
};

export function CategoryIcon({
  icon,
  color,
  size = 18,
}: {
  icon: string;
  color: KnowledgeCategoryColor;
  size?: number;
}) {
  const Icon = ICON_MAP[icon] ?? IconDoc;
  const style = COLOR_STYLE[color];

  return (
    <span className="crm-kb-category-ico" style={{ background: style.bg, color: style.fg }}>
      <Icon size={size} />
    </span>
  );
}
