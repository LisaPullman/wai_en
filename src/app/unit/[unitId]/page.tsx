import { notFound } from "next/navigation";
import { curriculum, unitById } from "@/content/curriculum";
import { UnitClient } from "@/components/unit/UnitClient";

export function generateStaticParams() {
  return curriculum.units.map((u) => ({ unitId: u.id }));
}

export default async function Page({ params }: { params: Promise<{ unitId: string }> }) {
  const { unitId } = await params;
  const unit = unitById(unitId);
  if (!unit) notFound();
  return <UnitClient unit={unit} />;
}
