// Role definitions matching users table role (int4)
export const USER_ROLES = {
  OWNER: 1,      // Role 1 (Owner)
  ADMIN: 2,      // Role 2 (Admin)
  KARYAWAN: 3,   // Role 3 (Karyawan / Teknisi Internal)
  MITRA: 4,      // Role 4 (Mitra / Teknisi Eksternal)
} as const;

export type UserRoleValue = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * Explicit list of accessible pages for each user role:
 * 
 * - Role 1 (Owner): Full access to all business features
 * - Role 2 (Admin): Operational and finance access
 * - Role 3 (Karyawan): Daily operations and field tasks
 * - Role 4 (Mitra): Field tasks and assignments only
 */
export const ROLE_ACCESSIBLE_PAGES: Record<number, string[]> = {
  // Role 1: Owner (Akses Penuh Semua Halaman)
  [USER_ROLES.OWNER]: [
    "/dashboard",
    "/order",
    "/tugas",
    "/penawaran",
    "/layanan",
    "/keuangan",
    "/buat-akun",
  ],

  // Role 2: Admin (Operasional & Manajemen)
  [USER_ROLES.ADMIN]: [
    "/dashboard",
    "/order",
    "/tugas",
    "/penawaran",
    "/layanan",
    "/keuangan",
    "/buat-akun",
  ],

  // Role 3: Karyawan (Operasional Lapangan & Order)
  [USER_ROLES.KARYAWAN]: [
    "/dashboard",
    "/tugas",
    "/order",
  ],

  // Role 4: Mitra (Khusus Tugas Lapangan)
  [USER_ROLES.MITRA]: [
    "/tugas",
  ],
};

/**
 * Default fallback landing page for each role when logging in or accessing an unauthorized page
 */
export const ROLE_DEFAULT_PAGES: Record<number, string> = {
  [USER_ROLES.OWNER]: "/dashboard",
  [USER_ROLES.ADMIN]: "/dashboard",
  [USER_ROLES.KARYAWAN]: "/dashboard",
  [USER_ROLES.MITRA]: "/tugas",
};

/**
 * Public routes that do not require authentication
 */
export const PUBLIC_ROUTES = ["/login", "/welcome", "/api"];

/**
 * Check if a specific role can access a given pathname
 */
export function hasPermission(pathname: string, userRole: number): boolean {
  const allowedPages = ROLE_ACCESSIBLE_PAGES[userRole] || [];

  // Check if pathname matches any of the allowed page prefixes
  return allowedPages.some(
    (page) => pathname === page || pathname.startsWith(page + "/")
  );
}

/**
 * Returns the default page for a user role
 */
export function getDefaultPageForRole(userRole: number): string {
  return ROLE_DEFAULT_PAGES[userRole] || "/tugas";
}
