"use client";

import { type ReactNode, useState } from "react";
import { DownloadModal } from "@/components/materials/DownloadModal";
import type { MaterialItem } from "@/data/materials";
import { cn } from "@/lib/utils";

export function MaterialDownloadButton({
  material,
  source,
  className,
  children,
}: {
  material: MaterialItem;
  source: string;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={cn(className)} onClick={() => setOpen(true)}>
        {children}
      </button>
      <DownloadModal
        material={material}
        source={source}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
