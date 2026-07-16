import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DeviceVariant = "browser" | "notebook" | "tablet" | "mobile";

const DEVICE_LABEL: Record<DeviceVariant, string> = {
  browser: "Desktop",
  notebook: "Notebook",
  tablet: "Tablet",
  mobile: "Mobile",
};

export function deviceLabel(variant: DeviceVariant) {
  return DEVICE_LABEL[variant];
}

export function DeviceFrame({
  variant,
  domain,
  children,
}: {
  variant: DeviceVariant;
  domain?: string;
  children: ReactNode;
}) {
  if (variant === "browser") {
    return (
      <div className="device-frame browser">
        <div className="browser-chrome">
          <span className="chrome-dot" />
          <span className="chrome-dot" />
          <span className="chrome-dot" />
          <div className="chrome-domain">
            <svg
              aria-hidden="true"
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            {domain ?? "app.suaempresa.com.br"}
          </div>
        </div>
        <div className="device-screen">
          <div className="device-screen-inner reveal in">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("device-frame", variant)}>
      <div className="device-screen">
        <div className="device-screen-inner reveal in">{children}</div>
      </div>
    </div>
  );
}
