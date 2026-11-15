import axios from "axios";

export type UpdateOrderStatusPayload = {
  id: string;
  status: string;
  notes?: string | null;
};

export const updateOrderStatus = async (data: UpdateOrderStatusPayload) => {
  return await axios.patch("/api/update/update-order-status", data);
};
