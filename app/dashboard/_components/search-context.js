"use client";

// Per-dashboard search scope.
//
// The Overview page uses the topbar search as a GLOBAL navigator (jump to any
// dashboard). Every other dashboard scopes its search to its own items: the
// topbar writes the query here, and that page reads it to filter in place.

import { createContext, useContext } from "react";

export const DashboardSearchContext = createContext({
  query: "",
  setQuery: () => {},
});

export function useDashboardSearch() {
  return useContext(DashboardSearchContext);
}
