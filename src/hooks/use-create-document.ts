"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useDocuments } from "@/lib/stores/documents-store";
import { useSettings } from "@/lib/stores/settings-store";
import { createDocument } from "@/lib/document";
import { documentFromTemplate, type TemplateId } from "@/lib/templates/catalog";
import { dictionaries } from "@/lib/i18n/dictionary";

/** Creates a document (blank or from a template), persists it and opens the editor. */
export function useCreateDocument() {
  const router = useRouter();
  const create = useDocuments((s) => s.create);
  const [pending, setPending] = useState<TemplateId | null>(null);

  const run = async (templateId: TemplateId = "blank") => {
    const locale = useSettings.getState().locale;
    const t = dictionaries[locale];
    setPending(templateId);
    try {
      const doc = templateId === "blank" ? createDocument({ title: t.common.untitled, language: locale }) : documentFromTemplate(templateId, t.common.untitled, locale);
      await create(doc);
      router.push(`/editor/${doc.id}`);
    } catch (e) {
      console.error(e);
      toast.error(t.common.error);
      setPending(null);
    }
  };

  return { createDocument: run, pending };
}
