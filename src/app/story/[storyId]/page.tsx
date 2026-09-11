import { notFound } from "next/navigation";
import { curriculum, storyById } from "@/content/curriculum";
import { StoryLoader } from "@/components/story/StoryLoader";

export function generateStaticParams() {
  return curriculum.stories.map((s) => ({ storyId: s.id }));
}

export default async function Page({ params }: { params: Promise<{ storyId: string }> }) {
  const { storyId } = await params;
  // 内置绘本直接渲染（SSG）；自定义绘本（c- 前缀）交给客户端加载
  if (storyId.startsWith("c-")) return <StoryLoader storyId={storyId} />;
  const story = storyById(storyId);
  if (!story) notFound();
  return <StoryLoader storyId={storyId} />;
}
