import type { AnyBlock, BlockPropsMap, BlockStyle, BlockType } from "@/lib/types";
import { createBlock } from "@/lib/blocks/registry";

/** Concise builder for template blocks (Arabic content). */
export function b<T extends BlockType>(
  type: T,
  props?: Partial<BlockPropsMap[T]>,
  style?: Partial<BlockStyle>,
  extra?: Partial<Pick<AnyBlock, "hideOnMobile" | "href" | "animation">>
): AnyBlock {
  return { ...createBlock(type, "ar", { props, style }), ...(extra ?? {}) } as AnyBlock;
}

export const h1 = (text: string, eyebrow?: string, style?: Partial<BlockStyle>) => b("heading", { text, level: 1, eyebrow }, style);
export const h2 = (text: string, eyebrow?: string, style?: Partial<BlockStyle>) => b("heading", { text, level: 2, eyebrow }, { marginY: 10, ...style });
export const h3 = (text: string, style?: Partial<BlockStyle>) => b("heading", { text, level: 3 }, { marginY: 6, ...style });
export const p = (text: string, style?: Partial<BlockStyle>) => b("text", { text }, style);
export const ornament = () => b("divider", { variant: "ornament", size: 1 }, { marginY: 28 });
export const line = () => b("divider", { variant: "line", size: 1 }, { marginY: 20 });
export const space = (size = 1) => b("divider", { variant: "space", size }, { marginY: 0 });
