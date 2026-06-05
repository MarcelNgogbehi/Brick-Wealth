"use client";

// app/admin/activity/page.jsx
//
// Investor Activity — a unified, chronological feed of everything investors do
// across the platform: registrations, KYC submissions, subscriptions, payment
// proofs, cancellations and secondary-share sales. Backed by /api/admin/activity.

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity as ActivityIcon, UserPlus, ShieldCheck, Wallet, Banknote,
  TrendingDown, CheckCircle2, Ban, Search, Loader2, Inbox, ArrowUpRight, RefreshCw,
} from "lucide-react";

// ── Brand system (mirrors the admin dashboard) ─────────────────────────────────
const C = {
  obsidian: "#070C18", navy: "#0A1F44", navySoft: "#2A4A7F",
  gold: "#B8923C", goldDeep: "#8F6E26", goldWash: "#F4ECD8",
  ink: "#0B1220", ink2: "#3C4456", ink3: "#7B8497",
  hair: "#ECEBE6", hair2: "#F3F2EE", paper: "#FFFFFF", canvas: "#F5F5F2",
  slate: "#AEB4C0", slateSoft: "#EEF0F3",
  pos: "#1C7A5E", posSoft: "#E7F1EC",
  alert: "#9B2C2C", alertSoft: "#F7EAEA",
  amber: "#9A6B12", amberSoft: "#F6EEDD",
  blue: "#2A4A7F", blueSoft: "#EAF0FA",
};
const EASE = [0.16, 1, 0.3, 1];
const NUM = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' };

// Visual identity per event kind.
const KIND = {
  registered:             { icon: UserPlus,     c: C.goldDeep, bg: C.goldWash },
  kyc_submitted:          { icon: ShieldCheck,  c: C.amber,    bg: C.amberSoft },
  subscribed:             { icon: Wallet,       c: C.pos,      bg: C.posSoft },
  payment_proof:          { icon: Banknote,     c: C.blue,     bg: C.blueSoft },
  subscription_cancelled: { icon: Ban,          c: C.alert,    bg: C.alertSoft },
  sale_requested:         { icon: TrendingDown, c: C.amber,    bg: C.amberSoft },
  sale_settled:           { icon: CheckCircle2, c: C.pos,      bg: C.posSoft },
};

const FILTERS = [
  { key: "all",           label: "All" },
  { key: "registrations", label: "Registrations" },
  { key: "kyc",           label: "KYC" },
  { key: "subscriptions", label: "Subscriptions" },
  { key: "payments",      label: "Payments" },
  { key: "sales",         label: "Share Sales" },
];

const PAGE_SIZE = 40;

function ago(d) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function initials(name) {
  if (!name) return "?";
  return name.split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}
// Calendar-day bucket label for timeline separators.
function dayLabel(d) {
  const date = new Date(d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const that = new Date(date); that.setHours(0, 0, 0, 0);
  const diff = Math.round((today - that) / 86400000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return "Earlier this week";
  if (diff < 30) return "Earlier this month";
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export default function InvestorActivityPage() {
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);

  useEffect(() => {
    const t = setTimeout(() => { setSearchDebounced(search); setLimit(PAGE_SIZE); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async (isMore) => {
    isMore ? setLoadingMore(true) : setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ limit: String(limit), category });
      if (searchDebounced) qs.set("search", searchDebounced);
      const res = await fetch(`/api/admin/activity?${qs}`, { credentials: "same-origin" });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d?.message || "Failed to load activity");
      setItems(d.items || []);
      setHasMore(!!d.hasMore);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [limit, category, searchDebounced]);

  useEffect(() => { load(limit > PAGE_SIZE); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [load]);

  // Group the (already newest-first) items into calendar buckets for the rail.
  const groups = useMemo(() => {
    const out = [];
    let current = null;
    for (const it of items) {
      const label = dayLabel(it.createdAt);
      if (!current || current.label !== label) { current = { label, items: [] }; out.push(current); }
      current.items.push(it);
    }
    return out;
  }, [items]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="text-[10.5px] font-bold tracking-[0.22em] uppercase mb-2" style={{ color: C.gold }}>Audit Stream</div>
          <h1 className="text-[28px] sm:text-[34px] font-bold leading-none tracking-[-0.025em]" style={{ color: C.ink }}>Investor Activity</h1>
          <p className="text-[13px] mt-2.5" style={{ color: C.ink3, maxWidth: 560 }}>
            Everything your investors do across the platform — registrations, KYC, subscriptions, payments and share sales — newest first.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(false)}
          disabled={loading}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-[12.5px] font-semibold flex-shrink-0 disabled:opacity-50 transition-colors"
          style={{ backgroundColor: C.paper, color: C.ink2, border: `1px solid ${C.hair}`, cursor: loading ? "wait" : "pointer" }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Refresh
        </button>
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
          {FILTERS.map((f) => {
            const active = category === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => { setCategory(f.key); setLimit(PAGE_SIZE); }}
                className="inline-flex items-center h-9 px-3.5 text-[12.5px] font-semibold whitespace-nowrap rounded-lg transition-all flex-shrink-0"
                style={{
                  backgroundColor: active ? C.ink : C.paper,
                  color: active ? "#FFFFFF" : C.ink2,
                  border: `1px solid ${active ? C.ink : C.hair}`,
                  cursor: "pointer",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="relative lg:ml-auto lg:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.ink3 }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by investor or asset…"
            className="w-full h-10 pl-10 pr-3 text-[13px] rounded-xl outline-none transition-colors"
            style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, color: C.ink, fontFamily: "inherit" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = C.gold)}
            onBlur={(e) => (e.currentTarget.style.borderColor = C.hair)}
          />
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="px-4 py-3 rounded-xl text-[13px]" style={{ backgroundColor: C.alertSoft, color: C.alert, border: `1px solid ${C.alert}22` }}>
          <strong>Couldn’t load activity.</strong> {error}
        </div>
      )}

      {/* ── Feed ── */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.paper, border: `1px solid ${C.hair}`, boxShadow: "0 1px 2px rgba(11,18,32,0.03)" }}>
        {loading ? (
          <div className="p-4 sm:p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl animate-pulse flex-shrink-0" style={{ backgroundColor: C.hair2 }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-2/3 rounded animate-pulse" style={{ backgroundColor: C.hair2 }} />
                  <div className="h-3 w-1/3 rounded animate-pulse" style={{ backgroundColor: C.hair2 }} />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 px-6">
            <span className="w-14 h-14 grid place-items-center rounded-2xl mb-4" style={{ backgroundColor: C.hair2 }}>
              <Inbox size={24} strokeWidth={1.5} style={{ color: C.ink3 }} />
            </span>
            <p className="text-[15px] font-bold" style={{ color: C.ink }}>No activity to show</p>
            <p className="text-[12.5px] mt-1" style={{ color: C.ink3 }}>
              {searchDebounced || category !== "all" ? "Try a different filter or search." : "Investor activity will appear here as it happens."}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: C.hair2 }}>
            {groups.map((g) => (
              <div key={g.label}>
                <div className="px-4 sm:px-6 py-2.5 text-[10.5px] font-bold tracking-[0.14em] uppercase sticky top-0 z-10"
                  style={{ color: C.ink3, backgroundColor: C.canvas, borderBottom: `1px solid ${C.hair2}` }}>
                  {g.label}
                </div>
                <ul>
                  {g.items.map((it, i) => <ActivityRow key={it.id} it={it} index={i} />)}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Load more ── */}
      {!loading && items.length > 0 && hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setLimit((l) => l + PAGE_SIZE)}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-[12.5px] font-semibold disabled:opacity-50 transition-colors"
            style={{ backgroundColor: C.ink, color: "#FFFFFF", border: "none", cursor: loadingMore ? "wait" : "pointer" }}
          >
            {loadingMore ? <Loader2 size={14} className="animate-spin" /> : <ActivityIcon size={14} />} Load more
          </button>
        </div>
      )}

      {!loading && items.length > 0 && (
        <p className="text-center text-[11px]" style={{ color: C.slate }}>
          Showing {items.length} {category === "all" ? "" : FILTERS.find((f) => f.key === category)?.label.toLowerCase() + " "}activit{items.length === 1 ? "y" : "ies"}
        </p>
      )}
    </div>
  );
}

function ActivityRow({ it, index }) {
  const k = KIND[it.kind] || { icon: ActivityIcon, c: C.ink2, bg: C.hair2 };
  const Icon = k.icon;
  const inner = (
    <div className="flex items-center gap-3.5 px-4 sm:px-6 py-3.5 transition-colors"
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.canvas)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
      <span className="w-10 h-10 grid place-items-center rounded-xl flex-shrink-0" style={{ backgroundColor: k.bg }}>
        <Icon size={17} strokeWidth={2} style={{ color: k.c }} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] leading-snug truncate" style={{ color: C.ink }}>
          <span className="font-bold">{it.actorName || "An investor"}</span>
          <span style={{ color: C.ink2 }}> · {it.title}</span>
        </p>
        <p className="text-[11.5px] mt-0.5 truncate" style={{ color: C.ink3 }}>
          {it.detail ? <span className="capitalize">{it.detail}</span> : null}
          {it.detail && it.actorEmail ? " — " : ""}
          {it.actorEmail || ""}
        </p>
      </div>
      <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
        {it.amount && <span className="text-[12.5px] font-bold" style={{ color: C.ink, ...NUM }}>{it.amount}</span>}
        <span className="text-[11px] whitespace-nowrap" style={{ color: C.ink3 }}>{ago(it.createdAt)}</span>
      </div>
      <ArrowUpRight size={14} className="flex-shrink-0" style={{ color: C.slate }} />
    </div>
  );
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE, delay: Math.min(index * 0.02, 0.2) }}
    >
      {it.href ? <Link href={it.href} style={{ textDecoration: "none", display: "block" }}>{inner}</Link> : inner}
    </motion.li>
  );
}
