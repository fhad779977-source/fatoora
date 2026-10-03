import { ReaderLoader } from "@/components/viewer/reader-loader";

export default async function SharedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ReaderLoader by="slug" value={decodeURIComponent(slug)} />;
}
