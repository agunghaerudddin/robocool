import { UserProfile } from "@/types/types";
import axios from "axios";

export type UserRole = "owner" | "admin" | "karyawan" | "mitra";

export type RegisterResponse = {
  message: string;
};

export const createUser = async (
  payload: UserProfile,
): Promise<RegisterResponse> => {
  const response = await axios.post<RegisterResponse>(
    "/api/create/create-user",
    payload,
  );

  return response.data;
};
