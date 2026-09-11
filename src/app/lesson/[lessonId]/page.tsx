import { notFound } from "next/navigation";
import { curriculum, lessonById } from "@/content/curriculum";
import { LessonRunner } from "@/components/lesson/LessonRunner";

export function generateStaticParams() {
  return curriculum.units.flatMap((u) => u.lessons.map((l) => ({ lessonId: l.id })));
}

export default async function Page({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const found = lessonById(lessonId);
  if (!found) notFound();
  return <LessonRunner unit={found.unit} lesson={found.lesson} />;
}
