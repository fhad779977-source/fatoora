import {
  Heading,
  Type,
  Image as ImageIcon,
  Video,
  MousePointerClick,
  Link2,
  Table,
  Info,
  Minus,
  Quote,
  ChartColumn,
  ClipboardList,
  PenLine,
  MapPin,
  Paperclip,
  type LucideIcon,
} from "lucide-react";
import type { AnyBlock, Block, BlockPropsMap, BlockStyle, BlockType, Locale } from "@/lib/types";
import { uid } from "@/lib/ids";

export const BLOCK_ORDER: BlockType[] = [
  "heading",
  "text",
  "image",
  "video",
  "button",
  "link",
  "table",
  "infoCard",
  "divider",
  "quote",
  "stat",
  "form",
  "signature",
  "map",
  "file",
];

export const BLOCK_ICONS: Record<BlockType, LucideIcon> = {
  heading: Heading,
  text: Type,
  image: ImageIcon,
  video: Video,
  button: MousePointerClick,
  link: Link2,
  table: Table,
  infoCard: Info,
  divider: Minus,
  quote: Quote,
  stat: ChartColumn,
  form: ClipboardList,
  signature: PenLine,
  map: MapPin,
  file: Paperclip,
};

export const BASE_STYLE: BlockStyle = {
  align: "start",
  paddingY: 0,
  paddingX: 0,
  marginY: 12,
  borderWidth: 0,
  borderColor: "#E2DACB",
  borderRadius: 0,
  shadow: "none",
};

const STYLE_OVERRIDES: Partial<Record<BlockType, Partial<BlockStyle>>> = {
  heading: { marginY: 16 },
  text: { marginY: 10 },
  image: { marginY: 20, borderRadius: 16 },
  video: { marginY: 20, borderRadius: 16 },
  table: { marginY: 20 },
  infoCard: { marginY: 14, borderRadius: 18 },
  divider: { marginY: 8 },
  quote: { marginY: 24 },
  stat: { marginY: 20 },
  form: { marginY: 24, borderRadius: 18 },
  signature: { marginY: 20 },
  map: { marginY: 20, borderRadius: 16 },
  file: { marginY: 14, borderRadius: 14 },
};

type Defaults = { [K in BlockType]: (locale: Locale) => BlockPropsMap[K] };

const DEFAULT_PROPS: Defaults = {
  heading: (l) => ({ text: l === "ar" ? "عنوان القسم" : "Section heading", level: 2 }),
  text: (l) => ({
    text:
      l === "ar"
        ? "اكتب هنا فقرة واضحة ومباشرة تشرح الفكرة للقارئ. يمكنك تعديل هذا النص مباشرة على الصفحة أو من لوحة الخصائص."
        : "Write a clear, direct paragraph that explains the idea to your reader. Edit this text right on the page or from the properties panel.",
  }),
  image: (l) => ({ src: "", alt: l === "ar" ? "صورة" : "Image", caption: "", fit: "cover", height: 320 }),
  video: (l) => ({ url: "", title: l === "ar" ? "فيديو تعريفي" : "Intro video", caption: "" }),
  button: (l) => ({ label: l === "ar" ? "تواصل معنا" : "Get in touch", url: "https://", variant: "solid", newTab: true }),
  link: (l) => ({
    label: l === "ar" ? "اقرأ المزيد" : "Read more",
    url: "https://",
    description: l === "ar" ? "وصف قصير للرابط" : "A short description of the link",
  }),
  table: (l) =>
    l === "ar"
      ? {
          headers: ["البند", "الكمية", "القيمة"],
          rows: [
            ["البند الأول", "1", "0"],
            ["البند الثاني", "1", "0"],
          ],
          striped: true,
        }
      : {
          headers: ["Item", "Qty", "Amount"],
          rows: [
            ["First item", "1", "0"],
            ["Second item", "1", "0"],
          ],
          striped: true,
        },
  infoCard: (l) => ({
    icon: "Info",
    title: l === "ar" ? "معلومة مهمة" : "Key information",
    body: l === "ar" ? "استخدم البطاقة لإبراز ملاحظة أو ميزة أو خلاصة يجب ألا تفوت القارئ." : "Use a card to highlight a note, feature or takeaway the reader shouldn’t miss.",
    tone: "plain",
  }),
  divider: () => ({ variant: "line", size: 1 }),
  quote: (l) => ({
    text: l === "ar" ? "الجودة ليست فعلًا، بل عادة." : "Quality is not an act, it is a habit.",
    author: l === "ar" ? "أرسطو" : "Aristotle",
  }),
  stat: (l) => ({
    columns: 3,
    items:
      l === "ar"
        ? [
            { value: "98%", label: "رضا العملاء" },
            { value: "+120", label: "مشروع منجز" },
            { value: "12", label: "سنة خبرة" },
          ]
        : [
            { value: "98%", label: "Client satisfaction" },
            { value: "+120", label: "Projects delivered" },
            { value: "12", label: "Years of experience" },
          ],
  }),
  form: (l) =>
    l === "ar"
      ? {
          title: "تواصل معنا",
          description: "اترك بياناتك وسنعود إليك خلال يوم عمل.",
          submitLabel: "إرسال",
          successMessage: "شكرًا لك، وصلتنا رسالتك.",
          fields: [
            { id: uid("f"), label: "الاسم الكامل", type: "text", required: true, placeholder: "مثال: سارة العتيبي" },
            { id: uid("f"), label: "البريد الإلكتروني", type: "email", required: true, placeholder: "name@example.com" },
            { id: uid("f"), label: "رسالتك", type: "textarea", required: false },
          ],
        }
      : {
          title: "Contact us",
          description: "Leave your details and we’ll get back within one business day.",
          submitLabel: "Send",
          successMessage: "Thank you — we received your message.",
          fields: [
            { id: uid("f"), label: "Full name", type: "text", required: true, placeholder: "e.g. Sarah Ahmed" },
            { id: uid("f"), label: "Email", type: "email", required: true, placeholder: "name@example.com" },
            { id: uid("f"), label: "Message", type: "textarea", required: false },
          ],
        },
  signature: (l) => ({
    label: l === "ar" ? "توقيع الطرف الأول" : "First party signature",
    signerName: l === "ar" ? "الاسم" : "Name",
    signerRole: "",
    date: new Date().toISOString().slice(0, 10),
  }),
  map: (l) => ({ query: l === "ar" ? "برج المملكة، الرياض" : "Kingdom Centre, Riyadh", label: l === "ar" ? "موقعنا" : "Our location", zoom: 15, height: 300 }),
  file: (l) => ({ name: l === "ar" ? "مرفق" : "Attachment", description: l === "ar" ? "ارفع ملفًا من لوحة الخصائص" : "Upload a file from properties" }),
};

export function createBlock<T extends BlockType>(type: T, locale: Locale, overrides?: { props?: Partial<BlockPropsMap[T]>; style?: Partial<BlockStyle> }): Block<T> {
  const props = { ...DEFAULT_PROPS[type](locale), ...(overrides?.props ?? {}) } as BlockPropsMap[T];
  return {
    id: uid("b"),
    type,
    props,
    style: { ...BASE_STYLE, ...STYLE_OVERRIDES[type], ...(overrides?.style ?? {}) },
    hideOnMobile: false,
    animation: "fade",
  };
}

/** Deep clone a block with a fresh id (and fresh form field ids). */
export function cloneBlock(block: AnyBlock): AnyBlock {
  const copy = structuredClone(block) as AnyBlock;
  copy.id = uid("b");
  if (copy.type === "form") {
    copy.props.fields = copy.props.fields.map((f) => ({ ...f, id: uid("f") }));
  }
  return copy;
}

/** Text-ish blocks get a default font size; used by inspector + renderer. */
export const DEFAULT_FONT_SIZE: Partial<Record<BlockType, number>> = {
  text: 17,
  quote: 24,
  link: 16,
  button: 15,
};

export const HEADING_SIZES: Record<1 | 2 | 3, number> = { 1: 44, 2: 30, 3: 22 };
