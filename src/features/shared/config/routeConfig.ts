export type NavLeaf = {
  label: string;
  path: string;
  resource: string;
};

export type NavGroup = {
  label: string;
  children: NavLeaf[];
};

export type NavEntry =
  | ({ type: "link" } & NavLeaf)
  | ({ type: "group" } & NavGroup);

export const APP_NAV: NavEntry[] = [
  {
    type: "group",
    label: "Database",
    children: [
      { label: "Hubs", path: "/hubs", resource: "hub" },
      { label: "Vehicles", path: "/vehicles", resource: "vehicle" },
      { label: "Riders", path: "/riders", resource: "rider" },
      { label: "Clients", path: "/clients", resource: "client" },
      { label: "Rate Cards", path: "/ratecards", resource: "ratecard" },
      { label: "Staff", path: "/staff", resource: "staff" },
    ],
  },
  // Operations (Rentals / Collections / Ledger) hidden from sidebar for now.
  {
    type: "link",
    label: "Roles and permissions",
    path: "/roles",
    resource: "role",
  },
  {
    type: "link",
    label: "Audit logs",
    path: "/audit-logs",
    resource: "auditLog",
  },
];
