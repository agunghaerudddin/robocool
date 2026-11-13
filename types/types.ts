export type UserRole = "owner" | "admin" | "karyawan" | "mitra";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};
