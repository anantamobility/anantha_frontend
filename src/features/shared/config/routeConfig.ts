export type NavItem = {
  label: string;
  path: string;
  resource: string;
};

export const APP_NAV: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", resource: "dashboard" },
  { label: "Hubs", path: "/hubs", resource: "hub" },
  { label: "Vehicles", path: "/vehicles", resource: "vehicle" },
  { label: "Riders", path: "/riders", resource: "rider" },
  { label: "Clients", path: "/clients", resource: "client" },
  { label: "Rate Cards", path: "/ratecards", resource: "ratecard" },
  { label: "Rentals", path: "/rentals", resource: "rental" },
  { label: "Collections", path: "/collections", resource: "collection" },
];
