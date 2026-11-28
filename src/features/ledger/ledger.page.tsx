import { useMemo, useState } from "react";
import type { LedgerEntry } from "@/features/shared/entities";
import { useRidersQuery } from "@/features/shared/entities";
import {
  DataTable,
  Field,
  LoadingSkeleton,
  PageHeader,
  PaginationBar,
  SearchBar,
  StatusBadge,
  inputClass,
  type DataTableColumn,
} from "@/features/shared/components/common";
import { useLedgerListQuery } from "./hooks/useLedgerQuery";

function money(value: string | number | null | undefined) {
  if (value == null || value === "") return "—";
  return String(value);
}

export default function LedgerPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [riderId, setRiderId] = useState("");

  const ridersQuery = useRidersQuery();
  const listQuery = useLedgerListQuery(page, 20, search, riderId);

  const entries = listQuery.data?.entries ?? [];
  const pagination = listQuery.data?.pagination;

  const columns = useMemo<DataTableColumn<LedgerEntry>[]>(
    () => [
      {
        id: "occurred",
        header: "Occurred",
        cell: (row) => row.occurredAt?.slice(0, 19) || "—",
      },
      {
        id: "type",
        header: "Type",
        cell: (row) => row.entryType || "—",
      },
      {
        id: "direction",
        header: "Direction",
        cell: (row) =>
          row.direction ? <StatusBadge status={row.direction} /> : "—",
      },
      {
        id: "amount",
        header: "Amount",
        cell: (row) => money(row.amount),
      },
      {
        id: "rider",
        header: "Rider",
        cell: (row) => row.rider?.fullName || "—",
      },
      {
        id: "rental",
        header: "Rental",
        cell: (row) => row.rental?.rentalNumber || "—",
      },
      {
        id: "description",
        header: "Description",
        cell: (row) => row.description || "—",
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Ledger"
        description="Read-only journal entries. Filter by rider when needed."
      />

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_280px]">
        <SearchBar
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search ledger…"
        />
        <Field label="Rider filter">
          <select
            className={inputClass}
            value={riderId}
            onChange={(e) => {
              setRiderId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All riders</option>
            {(ridersQuery.data?.riders ?? []).map((rider) => (
              <option key={rider.id} value={rider.id}>
                {rider.fullName}
                {rider.riderCode ? ` (${rider.riderCode})` : ""}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {listQuery.isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <DataTable columns={columns} rows={entries} rowKey={(row) => row.id} />
          <PaginationBar
            page={pagination?.page ?? page}
            totalPages={pagination?.totalPages ?? 1}
            total={pagination?.total ?? 0}
            limit={pagination?.limit ?? 20}
            onPageChange={setPage}
            itemLabel="entries"
          />
        </>
      )}
    </div>
  );
}
