"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

/** Merges the given key/value pairs into the current URL's search params and
 * navigates (replace, no scroll) — the Server Component page re-renders with
 * the new filters/sort/page without a full navigation. Setting a value to
 * `null` removes that key (used to reset a filter and to always drop `page`
 * when another filter changes). */
export function useUpdateSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const update = useCallback(
    (patch: Record<string, string | null | undefined>, options?: { resetPage?: boolean }) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === undefined || value === "") next.delete(key);
        else next.set(key, value);
      }
      if (options?.resetPage) next.delete("page");

      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams],
  );

  return { update, isPending, searchParams };
}
