import { ReaderLoader } from "@/components/viewer/reader-loader";

export default async function ViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReaderLoader by="id" value={decodeURIComponent(id)} />;
}
