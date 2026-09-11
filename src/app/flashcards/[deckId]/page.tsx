import { notFound } from "next/navigation";
import { curriculum } from "@/content/curriculum";
import { DeckClient } from "@/components/flashcard/DeckClient";

export function generateStaticParams() {
  return [
    ...curriculum.units.map((u) => ({ deckId: u.id })),
    { deckId: "daily" },
    { deckId: "wrong" },
  ];
}

export default async function Page({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params;
  const valid = deckId === "daily" || deckId === "wrong" || curriculum.units.some((u) => u.id === deckId);
  if (!valid) notFound();
  return <DeckClient deckId={deckId} />;
}
