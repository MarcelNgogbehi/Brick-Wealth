"use client";

// app/admin/sales/[id]/page.jsx
import { useParams } from "next/navigation";
import { AdminSaleDetail } from "../_AdminSaleQueue";

export default function AdminSaleDetailPage() {
  const { id } = useParams();
  return <AdminSaleDetail requestId={id} />;
}
