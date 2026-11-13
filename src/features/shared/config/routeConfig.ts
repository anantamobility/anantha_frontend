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
  { type: "link", label: "Dashboard", path: "/dashboard", resource: "dashboard" },
  {
    type: "group",
    label: "Database",
    children: [
      { label: "Hubs", path: "/hubs", resource: "hub" },
      { label: "Vehicles", path: "/vehicles", resource: "vehicle" },
      { label: "Riders", path: "/riders", resource: "rider" },
      { label: "Clients", path: "/clients", resource: "client" },
      { label: "Rate Cards", path: "/ratecards", resource: "ratecard" },
    ],
  },
];
