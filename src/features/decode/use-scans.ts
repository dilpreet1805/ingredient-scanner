import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { NewScan } from "@/types";
import {
  createScan,
  getScan,
  listVisibleScans,
  setPinned,
} from "./scan-repository";

const scansKey = ["scans"] as const;

export function useScans() {
  return useQuery({ queryKey: scansKey, queryFn: listVisibleScans });
}

export function useScan(id: string | undefined) {
  return useQuery({
    queryKey: [...scansKey, id],
    queryFn: () => getScan(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scan: NewScan) => createScan(scan),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: scansKey }),
  });
}

export function useSetPinned() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; pinned: boolean }) =>
      setPinned(args.id, args.pinned),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: scansKey }),
  });
}
