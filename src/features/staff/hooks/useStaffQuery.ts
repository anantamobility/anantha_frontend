import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/shared/context/authContext";
import { listStaff } from "../api/staff.api";

export const staffKeys = {
  all: ["staff"] as const,
  list: (page: number, search: string) =>
    [...staffKeys.all, "list", page, search] as const,
};

export function useStaffListQuery(page: number, limit: number, search: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: staffKeys.list(page, search),
    queryFn: () => listStaff({ page, limit, search: search || undefined }),
    enabled: !!accessToken,
  });
}
