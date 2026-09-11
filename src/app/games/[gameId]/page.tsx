import { notFound } from "next/navigation";
import { GameClient } from "@/components/game/GameClient";

export function generateStaticParams() {
  return [{ gameId: "bubble-pop" }];
}

export default async function Page({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  if (gameId !== "bubble-pop") notFound();
  return <GameClient gameId={gameId} />;
}
