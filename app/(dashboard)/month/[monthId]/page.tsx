import { MonthView } from "./month-view";

type PageProps = {
  params: Promise<{ monthId: string }>;
};

export default async function MesPage({ params }: PageProps) {
  const { monthId } = await params;
  return (
    <div className="flex flex-col gap-4">
      <MonthView monthId={monthId} />
    </div>
  );
}
