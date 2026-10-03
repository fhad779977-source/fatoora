import type { DocumentComment, DocumentVersion, FormSubmission, MidadDocument } from "@/lib/types";

/**
 * Storage contract for documents. The MVP ships an IndexedDB implementation;
 * swapping in an HTTP/database implementation later only requires a new class
 * implementing this interface.
 */
export interface DocumentRepository {
  list(): Promise<MidadDocument[]>;
  get(id: string): Promise<MidadDocument | undefined>;
  getBySlug(slug: string): Promise<MidadDocument | undefined>;
  save(doc: MidadDocument): Promise<void>;
  remove(id: string): Promise<void>;

  listVersions(documentId: string): Promise<DocumentVersion[]>;
  addVersion(version: DocumentVersion): Promise<void>;

  listSubmissions(documentId: string): Promise<FormSubmission[]>;
  addSubmission(submission: FormSubmission): Promise<void>;

  listComments(documentId: string): Promise<DocumentComment[]>;
  addComment(comment: DocumentComment): Promise<void>;
}
