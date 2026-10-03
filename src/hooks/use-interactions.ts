"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { AnyBlock } from "@/lib/types";
import { getRepository } from "@/lib/storage/idb-repository";
import { uid } from "@/lib/ids";
import { dictionaries } from "@/lib/i18n/dictionary";
import { useSettings } from "@/lib/stores/settings-store";

/** Form submissions + viewer signatures for a rendered document (stored locally in the MVP). */
export function useDocumentInteractions(documentId: string | undefined) {
  const [viewerSignatures, setSignatures] = useState<Record<string, string>>({});

  const onSubmitForm = useCallback(
    async (block: AnyBlock, values: Record<string, string>) => {
      if (!documentId) return;
      await getRepository().addSubmission({ id: uid("s"), documentId, blockId: block.id, values, submittedAt: new Date().toISOString() });
    },
    [documentId]
  );

  const onSign = useCallback(
    (block: AnyBlock, dataUrl: string) => {
      setSignatures((s) => ({ ...s, [block.id]: dataUrl }));
      if (documentId) {
        const label = block.type === "signature" ? block.props.label : "signature";
        getRepository().addSubmission({ id: uid("s"), documentId, blockId: block.id, values: { [label]: dataUrl }, submittedAt: new Date().toISOString() });
      }
      toast.success(dictionaries[useSettings.getState().locale].blockUi.signed);
    },
    [documentId]
  );

  return { onSubmitForm, onSign, viewerSignatures };
}
