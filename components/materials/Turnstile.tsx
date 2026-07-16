"use client";

import Script from "next/script";

/** Renders Cloudflare Turnstile in invisible mode. When placed inside a
 * <form>, Turnstile injects a hidden `cf-turnstile-response` input once the
 * token is ready, so no extra client-side wiring is needed to submit it. */
export function Turnstile({ siteKey }: { siteKey: string }) {
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        async
        defer
      />
      <div
        className="cf-turnstile"
        data-sitekey={siteKey}
        data-size="invisible"
        data-appearance="execute"
      />
    </>
  );
}
