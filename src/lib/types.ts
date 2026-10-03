/**
 * MIDAD core data model.
 * Everything here is plain serialisable JSON so the same shapes can later be
 * persisted in a real database (Postgres / D1) without changes.
 */

export type Locale = "ar" | "en";
export type Direction = "rtl" | "ltr";

export type BlockType =
  | "heading"
  | "text"
  | "image"
  | "video"
  | "button"
  | "link"
  | "table"
  | "infoCard"
  | "divider"
  | "quote"
  | "stat"
  | "form"
  | "signature"
  | "map"
  | "file";

export type TextAlign = "start" | "center" | "end" | "justify";
export type FontFamily = "sans" | "serif";
export type Shadow = "none" | "sm" | "md" | "lg";
export type Animation = "none" | "fade" | "slide-up" | "zoom";

export interface BlockStyle {
  fontFamily?: FontFamily;
  fontSize?: number; // px, undefined = block default
  fontWeight?: 300 | 400 | 500 | 600 | 700 | 800;
  color?: string; // undefined = inherit document text color
  align: TextAlign;
  paddingY: number;
  paddingX: number;
  marginY: number;
  background?: string;
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  shadow: Shadow;
}

export interface FormField {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "number" | "date" | "textarea" | "select";
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface BlockPropsMap {
  heading: { text: string; level: 1 | 2 | 3; eyebrow?: string };
  text: { text: string };
  image: { src: string; alt: string; caption?: string; fit: "cover" | "contain"; height: number };
  video: { url: string; title?: string; caption?: string };
  button: { label: string; url: string; variant: "solid" | "outline"; newTab: boolean };
  link: { label: string; url: string; description?: string };
  table: { headers: string[]; rows: string[][]; striped: boolean; caption?: string; highlightLastRow?: boolean };
  infoCard: { icon: string; title: string; body: string; tone: "plain" | "accent" | "dark" };
  divider: { variant: "line" | "ornament" | "space"; size: number };
  quote: { text: string; author?: string; role?: string };
  stat: { items: { value: string; label: string; note?: string }[]; columns: 2 | 3 | 4 };
  form: { title: string; description?: string; fields: FormField[]; submitLabel: string; successMessage: string };
  signature: { label: string; signerName: string; signerRole?: string; date?: string; image?: string };
  map: { query: string; label?: string; zoom: number; height: number };
  file: { name: string; size?: number; mime?: string; dataUrl?: string; url?: string; description?: string };
}

export interface Block<T extends BlockType = BlockType> {
  id: string;
  type: T;
  props: BlockPropsMap[T];
  style: BlockStyle;
  hideOnMobile: boolean;
  /** Optional URL opened when the whole block is clicked (in view mode). */
  href?: string;
  animation: Animation;
}

export type AnyBlock = { [K in BlockType]: Block<K> }[BlockType];

export type ThemePreset = "ivory" | "white" | "navy";

export interface DocumentTheme {
  preset: ThemePreset;
  background: string;
  surface: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  fontFamily: FontFamily;
  headingFont: FontFamily;
  baseFontSize: number;
  width: "narrow" | "normal" | "wide";
}

export type ShareAccess = "view" | "fill" | "comment";

export interface DocumentPermissions {
  access: ShareAccess;
  allowDownload: boolean;
  allowPrint: boolean;
}

export type DocumentStatus = "draft" | "published" | "archived";

export interface MidadDocument {
  id: string;
  title: string;
  slug: string;
  language: Locale;
  theme: DocumentTheme;
  blocks: AnyBlock[];
  createdAt: string;
  updatedAt: string;
  status: DocumentStatus;
  permissions: DocumentPermissions;
  templateId?: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  savedAt: string;
  snapshot: MidadDocument;
}

export interface FormSubmission {
  id: string;
  documentId: string;
  blockId: string;
  values: Record<string, string>;
  submittedAt: string;
}

export interface DocumentComment {
  id: string;
  documentId: string;
  author: string;
  body: string;
  createdAt: string;
}

export type PageSize = "a4" | "presentation" | "long";
