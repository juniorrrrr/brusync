"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useTransition } from "react";

/** Merges the given key/value pairs into the current URL's search params and
 * navigates (replace, no scroll) — the Server Component page re-renders with
 * the new filters/sort/page without a full navigation. Setting a value to
 * `null` removes that key (used to reset a filter and to always drop `page`
 * when another filter changes).
 *
 * `searchParams` is read through a ref (kept fresh by an unconditional
 * assignment on every render, not an effect) rather than captured directly
 * by `update`'s useCallback. next/navigation's useSearchParams() returns a
 * new object identity on every navigation, including the ones `update`
 * itself triggers — depending on it directly would make `update` unstable,
 * and a consumer that (correctly, per exhaustive-deps) lists `update` in a
 * useEffect dependency array would re-run that effect after every
 * navigation, replacing the URL again forever. Reading through a ref keeps
 * `update` stable across query changes so it's safe to depend on. */
export function useUpdateSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;
  const [isPending, startTransition] = useTransition();

  const update = useCallback(
    (patch: Record<string, string | null | undefined>, options?: { resetPage?: boolean }) => {
      const next = new URLSearchParams(searchParamsRef.current.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === undefined || value === "") next.delete(key);
        else next.set(key, value);
      }
      if (options?.resetPage) next.delete("page");

      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [router, pathname],
  );

  return { update, isPending, searchParams };
}
