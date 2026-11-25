"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  FileText,
  ClipboardList,
  Wrench,
  UserRound,
  LogOut,
  Menu,
  Wallet,
} from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    shortLabel: "Dashboard",
    icon: House,
    href: "/dashboard",
  },
  { label: "Order", shortLabel: "Order", icon: FileText, href: "/order" },
  { label: "Tugas", shortLabel: "Tugas", icon: ClipboardList, href: "/tugas" },
  { label: "Layanan", shortLabel: "Layanan", icon: Wrench, href: "/layanan" },
  {
    label: "Tambah Pengguna",
    shortLabel: "Pengguna",
    icon: UserRound,
    href: "/buat-akun",
  },
  {
    label: "Keuangan",
    shortLabel: "Keuangan",
    icon: Wallet,
    href: "/keuangan",
  },
];

function NavLinks({ isOpen }: { isOpen: boolean }) {
  const pathname = usePathname();

  return (
    <>
      {menuItems.map(({ label, icon: Icon, href }) => {
        const isActive =
          pathname === href ||
          (pathname ? pathname.startsWith(href + "/") : false);

        return (
          <Link
            key={label}
            href={href}
            title={!isOpen ? label : undefined}
            className={`flex min-h-[52px] w-full items-center rounded-xl transition-colors duration-200 ${
              isOpen ? "gap-4 px-3" : "justify-center px-0"
            } ${
              isActive
                ? "bg-[#F3F3F4] text-black font-medium"
                : "text-[#777783] hover:bg-gray-50"
            }`}
          >
            <Icon size={23} strokeWidth={2} className="shrink-0" />

            {isOpen && (
              <span className="truncate text-left text-[14px]">{label}</span>
            )}
          </Link>
        );
      })}
    </>
  );
}

function NavLinksFallback({ isOpen }: { isOpen: boolean }) {
  return (
    <>
      {menuItems.map(({ label, icon: Icon, href }) => (
        <Link
          key={label}
          href={href}
          title={!isOpen ? label : undefined}
          className={`flex min-h-[52px] w-full items-center rounded-xl text-[#777783] transition-colors duration-200 hover:bg-gray-50 ${
            isOpen ? "gap-4 px-3" : "justify-center px-0"
          }`}
        >
          <Icon size={23} strokeWidth={2} className="shrink-0" />

          {isOpen && (
            <span className="truncate text-left text-[14px]">{label}</span>
          )}
        </Link>
      ))}
    </>
  );
}

function BottomNavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex h-16 w-full items-center justify-around px-2">
      {menuItems.map(({ label, shortLabel, icon: Icon, href }) => {
        const isActive =
          pathname === href ||
          (pathname ? pathname.startsWith(href + "/") : false);

        return (
          <Link
            key={label}
            href={href}
            className={`flex flex-1 flex-col items-center justify-center py-1 transition-all ${
              isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <div
              className={`flex items-center justify-center rounded-full px-3 py-1 transition-all ${
                isActive ? "bg-blue-100" : "bg-transparent"
              }`}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                className="shrink-0"
              />
            </div>
            <span
              className={`mt-0.5 text-[10px] tracking-tight truncate max-w-[64px] text-center ${
                isActive ? "font-semibold text-blue-600" : "font-normal"
              }`}
            >
              {shortLabel}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function BottomNavLinksFallback() {
  return (
    <div className="flex h-16 w-full items-center justify-around px-2">
      {menuItems.map(({ label, shortLabel, icon: Icon, href }) => (
        <Link
          key={label}
          href={href}
          className="flex flex-1 flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-800"
        >
          <div className="flex items-center justify-center rounded-full px-3 py-1 bg-transparent">
            <Icon size={20} strokeWidth={2} className="shrink-0" />
          </div>
          <span className="mt-0.5 text-[10px] tracking-tight truncate max-w-[64px] text-center font-normal">
            {shortLabel}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {/* Desktop / Tablet Sidebar (hidden on screens smaller than md) */}
      <div
        className={`sticky top-0 hidden h-screen shrink-0 bg-slate-50 p-4 pr-0 transition-[width] duration-300 md:block ${
          isOpen ? "w-[266px]" : "w-[92px]"
        }`}
      >
        <aside className="flex h-full flex-col overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm">
          {/* Header */}
          <div
            className={`flex h-[90px] shrink-0 items-center border-b border-gray-100 ${
              isOpen ? "justify-between px-5" : "justify-center px-2"
            }`}
          >
            {isOpen && (
              <div className="min-w-0">
                <h1 className="whitespace-nowrap text-[20px] font-bold text-[#5555e7]">
                  Robocool
                </h1>
              </div>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle sidebar"
              className="shrink-0 rounded-lg p-1 text-gray-500 transition hover:bg-gray-100"
            >
              <Menu size={24} strokeWidth={2} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-5">
            <Suspense fallback={<NavLinksFallback isOpen={isOpen} />}>
              <NavLinks isOpen={isOpen} />
            </Suspense>
          </nav>

          {/* Logout */}
          <div className="shrink-0 border-t border-gray-100 p-3">
            <button
              onClick={() => {
                // Add your logout logic here
              }}
              title={!isOpen ? "Logout" : undefined}
              className={`flex min-h-[48px] w-full items-center rounded-xl text-[#777783] transition hover:bg-gray-50 ${
                isOpen ? "gap-4 px-3" : "justify-center px-0"
              }`}
            >
              <LogOut size={23} className="shrink-0" />

              {isOpen && <span className="text-sm font-normal">Logout</span>}
            </button>
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Navigation Bar (visible only on mobile: < md) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-lg md:hidden"
      >
        <Suspense fallback={<BottomNavLinksFallback />}>
          <BottomNavLinks />
        </Suspense>
      </nav>
    </>
  );
}
