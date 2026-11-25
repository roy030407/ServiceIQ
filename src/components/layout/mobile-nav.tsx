"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AlertCircle, LayoutDashboard, MoreHorizontal, Package, Wrench } from "lucide-react";
import { useOrg } from "@/hooks/use-org";

const MORE_ITEMS = [
  { href: "/equipment", label: "Equipment" },
  { href: "/contracts", label: "Contracts" },
  { href: "/renewals", label: "Renewals" },
  { href: "/technicians", label: "Technicians" },
  { href: "/parts", label: "Parts" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/settings", label: "Settings" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { isAccounts } = useOrg();
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryItems = [
    ...(!isAccounts
      ? [{ href: "/dispatch", label: "Dispatch", icon: LayoutDashboard }]
      : [{ href: "/equipment", label: "Equipment", icon: Package }]),
    { href: "/tickets", label: "Tickets", icon: AlertCircle },
    { href: "/jobs", label: "Jobs", icon: Wrench },
  ];
  const moreItems = MORE_ITEMS.filter(
    (item) => !isAccounts || item.href !== "/technicians",
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white lg:hidden">
      {moreOpen && (
        <nav aria-label="More navigation" className="grid grid-cols-2 gap-1 border-b border-slate-100 p-3">
          {moreItems.map((item) => (
            <Link
              className="rounded-lg px-3 py-3 text-sm text-slate-700 hover:bg-slate-50"
              href={item.href}
              key={item.href}
              onClick={() => setMoreOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
      <nav aria-label="Mobile navigation" className="grid min-h-16 grid-cols-4">
        {primaryItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] ${
                active ? "text-blue-800" : "text-slate-500"
              }`}
              href={href}
              key={href}
            >
              <Icon aria-hidden="true" size={19} />
              {label}
            </Link>
          );
        })}
        <button
          aria-expanded={moreOpen}
          className={`flex flex-col items-center justify-center gap-1 text-[11px] ${
            moreOpen ? "text-blue-800" : "text-slate-500"
          }`}
          onClick={() => setMoreOpen((open) => !open)}
          type="button"
        >
          <MoreHorizontal aria-hidden="true" size={19} />
          More
        </button>
      </nav>
    </div>
  );
}
