import { EditorView } from "@/components/editor/editor-view";

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditorView id={decodeURIComponent(id)} />;
}
