"use client";

import { useQuery } from "@tanstack/react-query";
import { getMonthData } from "@/app/actions/months";

export function monthDataQueryKey(monthId: string | null) {
  return ["months", monthId] as const;
}

export function useMonthData(monthId: string | null) {
  return useQuery({
    queryKey: monthDataQueryKey(monthId),
    queryFn: () => getMonthData(monthId!),
    enabled: !!monthId,
  });
}
