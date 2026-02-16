import { CashFlowMonthDetailView } from "./month-detail-view";

export default async function CashFlowMonthPage({
  params,
}: {
  params: Promise<{ monthId: string }>;
}) {
  const { monthId } = await params;
  return <CashFlowMonthDetailView monthId={monthId} />;
}
