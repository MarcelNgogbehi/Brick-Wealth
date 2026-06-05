// app/dashboard/sales/[id]/page.jsx
//
// There is no standalone sale-detail page — the Liquidity Desk lists every
// request on /dashboard/sales. This route exists so that deep links of the
// form /dashboard/sales/<id> (e.g. older "share sale completed" notifications
// already stored in the database) never 404. It redirects to the list with a
// ?request=<id> param, which scrolls to and highlights that request.

import { redirect } from "next/navigation";

export default async function SaleDeepLinkRedirect({ params }) {
  const { id } = await params;
  redirect(`/dashboard/sales?request=${encodeURIComponent(id)}`);
}
