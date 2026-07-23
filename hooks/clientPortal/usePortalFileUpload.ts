"use client";

import { useActionState, useRef } from "react";
import {
  type PortalFileActionState,
  uploadPortalFileAction,
} from "@/application/clientPortal/portalFilesActions";

const INITIAL_STATE: PortalFileActionState = { status: "idle" };

/** Wraps uploadPortalFileAction with the form-reset-on-success behavior
 * every upload form in the app repeats (see ProjectFilesTab) — kept here so
 * the two places that need it (the portal's own Arquivos tab, and a future
 * "Novo Cliente" onboarding step) don't each reimplement the reset. */
export function usePortalFileUpload(onUploaded: () => void) {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState(
    async (prev: PortalFileActionState, fd: FormData) => {
      const result = await uploadPortalFileAction(prev, fd);
      if (result.status === "success") {
        formRef.current?.reset();
        onUploaded();
      }
      return result;
    },
    INITIAL_STATE,
  );

  return { formRef, state, formAction, pending };
}
