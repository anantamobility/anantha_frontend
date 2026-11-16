import { useMemo, useState } from "react";
import {
  DataTable,
  LoadingSkeleton,
  PageHeader,
  PaginationBar,
  SearchBar,
  StatusBadge,
  type DataTableColumn,
} from "@/features/shared/components/common";
import type { AuditLog } from "./api/auditLogs.api";
import { useAuditLogsListQuery } from "./hooks/useAuditLogsQuery";

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [resource, setResource] = useState("");

  const listQuery = useAuditLogsListQuery(page, 20, search, resource);
  const logs = listQuery.data?.auditLogs ?? [];
  const pagination = listQuery.data?.pagination;

  const columns = useMemo<DataTableColumn<AuditLog>[]>(
    () => [
      {
        id: "when",
        header: "When",
        cell: (row) => new Date(row.createdAt).toLocaleString(),
      },
      {
        id: "actor",
        header: "Actor",
        cell: (row) => row.userName || row.userId || "—",
      },
      { id: "action", header: "Action", cell: (row) => row.action },
      { id: "resource", header: "Resource", cell: (row) => row.resource },
      {
        id: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        id: "summary",
        header: "Summary",
        cell: (row) => (
          <span className="line-clamp-2 text-xs text-muted-foreground">
            {row.summary || "—"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Audit logs"
        description="Append-only security and mutation trail."
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="min-w-[220px] flex-1">
          <SearchBar
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search audit logs…"
          />
        </div>
        <input
          className="h-9 rounded-lg border border-border px-3 text-sm"
          placeholder="Resource filter (e.g. User)"
          value={resource}
          onChange={(e) => {
            setResource(e.target.value);
            setPage(1);
          }}
        />
      </div>
      {listQuery.isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <DataTable columns={columns} rows={logs} rowKey={(row) => row.id} />
          <PaginationBar
            page={pagination?.page ?? page}
            totalPages={pagination?.totalPages ?? 1}
            total={pagination?.total ?? 0}
            limit={pagination?.limit ?? 20}
            onPageChange={setPage}
            itemLabel="logs"
          />
        </>
      )}
    </div>
  );
}
