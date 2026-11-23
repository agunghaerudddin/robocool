"use client";

import { useState } from "react";
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
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", icon: House, href: "/dashboard" },
  { label: "Order", icon: FileText, href: "/order" },
  { label: "Tugas", icon: ClipboardList, href: "/tugas" },
  { label: "Layanan", icon: Wrench, href: "/layanan" },
  { label: "Tambah Pengguna", icon: UserRound, href: "/buat-akun" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      className={`sticky top-0 h-screen shrink-0 bg-slate-50 p-4 pr-0 transition-[width] duration-300 ${
        isOpen ? "w-[266px]" : "w-[92px]"
      }`}
    >
      <aside
        className={`flex h-full flex-col overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm`}
      >
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
          {menuItems.map(({ label, icon: Icon, href }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");

            return (
              <Link
                key={label}
                href={href}
                title={!isOpen ? label : undefined}
                className={`flex min-h-[52px] w-full items-center rounded-xl transition-colors duration-200 ${
                  isOpen ? "gap-4 px-3" : "justify-center px-0"
                } ${
                  isActive
                    ? "bg-[#F3F3F4] text-black"
                    : "text-[#777783] hover:bg-gray-50"
                }`}
              >
                <Icon size={23} strokeWidth={2} className="shrink-0" />

                {isOpen && (
                  <span className="truncate text-left text-[14px] font-normal">
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
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
  );
}
