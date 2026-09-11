import { notFound } from "next/navigation";
import { dailyThemeById, dailyThemes } from "@/content/daily300";
import { DailyClient } from "@/components/daily/DailyClient";

export function generateStaticParams() {
  return dailyThemes.map((t) => ({ themeId: t.id }));
}

export default async function Page({ params }: { params: Promise<{ themeId: string }> }) {
  const { themeId } = await params;
  const theme = dailyThemeById(themeId);
  if (!theme) notFound();
  return <DailyClient theme={theme} />;
}
