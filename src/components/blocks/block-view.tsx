"use client";

import type { AnyBlock } from "@/lib/types";
import {
  ButtonBlock,
  DividerBlock,
  FileBlock,
  HeadingBlock,
  ImageBlock,
  InfoCardBlock,
  LinkBlock,
  MapBlock,
  QuoteBlock,
  StatBlock,
  TableBlock,
  TextBlock,
  VideoBlock,
} from "./simple-blocks";
import { FormBlock } from "./form-block";
import { SignatureBlock } from "./signature-block";

/** Renders the inner content of a block (without the outer BlockShell). */
export function BlockContent({ block, onOpenImage }: { block: AnyBlock; onOpenImage?: (src: string, alt: string) => void }) {
  switch (block.type) {
    case "heading":
      return <HeadingBlock block={block} />;
    case "text":
      return <TextBlock block={block} />;
    case "image":
      return <ImageBlock block={block} onOpen={onOpenImage} />;
    case "video":
      return <VideoBlock block={block} />;
    case "button":
      return <ButtonBlock block={block} />;
    case "link":
      return <LinkBlock block={block} />;
    case "table":
      return <TableBlock block={block} />;
    case "infoCard":
      return <InfoCardBlock block={block} />;
    case "divider":
      return <DividerBlock block={block} />;
    case "quote":
      return <QuoteBlock block={block} />;
    case "stat":
      return <StatBlock block={block} />;
    case "form":
      return <FormBlock block={block} />;
    case "signature":
      return <SignatureBlock block={block} />;
    case "map":
      return <MapBlock block={block} />;
    case "file":
      return <FileBlock block={block} />;
    default:
      return null;
  }
}
