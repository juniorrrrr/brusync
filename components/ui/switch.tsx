"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { useState } from "react";

import { cn } from "@/lib/utils";

/** shadcn/21st.dev's standard Switch primitive (Radix Switch under the hood).
 * Radix's own element is a `<button>`, which native `<form>` submission
 * ignores — this also renders a hidden checkbox mirroring its state so the
 * switch participates in a plain `<form action={serverAction}>` (FormData). */
function Switch({
  className,
  name,
  defaultChecked = false,
  onCheckedChange,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & { name?: string }) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <>
      {name && (
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}
      <SwitchPrimitive.Root
        data-slot="switch"
        checked={checked}
        onCheckedChange={(next) => {
          setChecked(next);
          onCheckedChange?.(next);
        }}
        className={cn(
          "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          data-slot="switch-thumb"
          className="bg-background pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
        />
      </SwitchPrimitive.Root>
    </>
  );
}

export { Switch };
