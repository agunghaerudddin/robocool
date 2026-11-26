"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { hasPermission, USER_ROLES } from "@/lib/permissions";

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
  {
    label: "Penawaran",
    shortLabel: "Penawaran",
    icon: Wallet,
    href: "/penawaran",
  },
];

function NavLinks({
  isOpen,
  userRole,
}: {
  isOpen: boolean;
  userRole: number | null;
}) {
  const pathname = usePathname();

  // Filter items based on user role if available
  const visibleItems = menuItems.filter((item) =>
    userRole !== null ? hasPermission(item.href, userRole) : true
  );

  return (
    <>
      {visibleItems.map(({ label, icon: Icon, href }) => {
        const isActive =
          pathname === href ||
          (pathname ? pathname.startsWith(href + "/") : false);

        return (
          <Link
            key={label}
            href={href}
            title={!isOpen ? label : undefined}
            className={`flex py-[.4rem] w-full items-center rounded-[6px] transition-colors duration-200 ${
              isOpen ? "gap-2 px-2" : "justify-center px-0"
            } ${
              isActive
                ? "bg-[#F3F3F4] text-black font-medium"
                : "text-[#777783] hover:bg-gray-50"
            }`}
          >
            <Icon size={20} strokeWidth={1.5} className="shrink-0" />

            {isOpen && (
              <span className="truncate text-left text-[10px] font-medium">
                {label}
              </span>
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
            isOpen ? "gap-2 px-2" : "justify-center px-0"
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

function BottomNavLinks({ userRole }: { userRole: number | null }) {
  const pathname = usePathname();

  const visibleItems = menuItems.filter((item) =>
    userRole !== null ? hasPermission(item.href, userRole) : true
  );

  return (
    <div className="flex h-16 w-full items-center justify-around px-1">
      {visibleItems.map(({ label, shortLabel, icon: Icon, href }) => {
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
              className={`flex items-center justify-center rounded-full px-3 transition-all ${
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
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [userRole, setUserRole] = useState<number | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user) {
        let role: number | null = null;
        if (typeof data.user.user_metadata?.role === "number") {
          role = data.user.user_metadata.role;
        } else if (typeof data.user.user_metadata?.role === "string") {
          role = parseInt(data.user.user_metadata.role, 10);
        }

        if (role === null || isNaN(role)) {
          const { data: dbUser } = await supabase
            .from("users")
            .select("role")
            .eq("id", data.user.id)
            .single<{ role: number }>();

          if (dbUser?.role !== undefined && dbUser?.role !== null) {
            role = Number(dbUser.role);
          }
        }

        setUserRole(role ?? USER_ROLES.MITRA);
      }
    });
  }, []);

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <>
      {/* Desktop / Tablet Sidebar (hidden on screens smaller than md) */}
      <div
        className={`sticky top-0 hidden h-screen shrink-0 bg-slate-50 p-2 pr-0 transition-[width] duration-300 md:block ${
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
              <Menu size={20} strokeWidth={2} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
            <Suspense fallback={<NavLinksFallback isOpen={isOpen} />}>
              <NavLinks isOpen={isOpen} userRole={userRole} />
            </Suspense>
          </nav>

          {/* Logout */}
          <div className="shrink-0 border-t border-gray-100 p-3">
            <button
              onClick={handleLogout}
              title={!isOpen ? "Logout" : undefined}
              className={`flex min-h-[48px] w-full items-center rounded-xl text-[1rem] text-[#777783] transition hover:bg-gray-50 ${
                isOpen ? "gap-4 px-3" : "justify-center px-0"
              }`}
            >
              <LogOut size={20} className="shrink-0" />

              {isOpen && <span className="text-[12px] font-medium">Keluar</span>}
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
          <BottomNavLinks userRole={userRole} />
        </Suspense>
      </nav>
    </>
  );
}
