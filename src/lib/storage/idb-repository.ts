import { createStore, del, entries, get, set, type UseStore } from "idb-keyval";
import type { DocumentComment, DocumentVersion, FormSubmission, MidadDocument } from "@/lib/types";
import type { DocumentRepository } from "./repository";

const MAX_VERSIONS = 15;

/** IndexedDB-backed repository (one object store per collection). */
export class IdbDocumentRepository implements DocumentRepository {
  private docs: UseStore;
  private versions: UseStore;
  private submissions: UseStore;
  private comments: UseStore;

  constructor() {
    this.docs = createStore("midad-documents", "documents");
    this.versions = createStore("midad-versions", "versions");
    this.submissions = createStore("midad-submissions", "submissions");
    this.comments = createStore("midad-comments", "comments");
  }

  async list() {
    const all = await entries<string, MidadDocument>(this.docs);
    return all.map(([, d]) => d);
  }

  get(id: string) {
    return get<MidadDocument>(id, this.docs);
  }

  async getBySlug(slug: string) {
    const all = await this.list();
    return all.find((d) => d.slug === slug);
  }

  save(doc: MidadDocument) {
    return set(doc.id, doc, this.docs);
  }

  async remove(id: string) {
    await Promise.all([del(id, this.docs), del(id, this.versions), del(id, this.submissions), del(id, this.comments)]);
  }

  async listVersions(documentId: string) {
    return (await get<DocumentVersion[]>(documentId, this.versions)) ?? [];
  }

  async addVersion(version: DocumentVersion) {
    const list = await this.listVersions(version.documentId);
    const next = [version, ...list].slice(0, MAX_VERSIONS);
    await set(version.documentId, next, this.versions);
  }

  async listSubmissions(documentId: string) {
    return (await get<FormSubmission[]>(documentId, this.submissions)) ?? [];
  }

  async addSubmission(submission: FormSubmission) {
    const list = await this.listSubmissions(submission.documentId);
    await set(submission.documentId, [submission, ...list], this.submissions);
  }

  async listComments(documentId: string) {
    return (await get<DocumentComment[]>(documentId, this.comments)) ?? [];
  }

  async addComment(comment: DocumentComment) {
    const list = await this.listComments(comment.documentId);
    await set(comment.documentId, [...list, comment], this.comments);
  }
}

let instance: DocumentRepository | null = null;

export function getRepository(): DocumentRepository {
  if (!instance) instance = new IdbDocumentRepository();
  return instance;
}
