import axios from "axios";

export type UpdateOrderStatusPayload = {
  id: string;
  status?: string;
  notes?: string | null;
  payment_status?: string;
  payment_type?: string;
  paid_to?: string | null;
};

export const updateOrderStatus = async (data: UpdateOrderStatusPayload) => {
  return await axios.patch("/api/update/update-order-status", data);
};


export type UpdateOrderImagePayload = {
  id: string;
  type: "before" | "after";
  url: string;
  action?: "add" | "remove";
};

export const updateOrderImage = async (data: UpdateOrderImagePayload) => {
  return await axios.patch("/api/update/update-order-image", data);
};

export const uploadOrderImage = async (
  file: File,
  type: "before" | "after",
  metadata?: { location?: string; timestamp?: string }
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  if (metadata?.location) formData.append("location", metadata.location);
  if (metadata?.timestamp) formData.append("timestamp", metadata.timestamp);

  return await axios.post<{ url: string; publicId: string; folder: string }>(
    "/api/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

export const deleteOffer = async (id: string | number) => {
  return await axios.delete(`/api/get/get-offer/${id}`);
};

export const updateOrderCommissions = async (orderId: string | number) => {
  return await axios.post("/api/update/update-order-commissions", { order_id: orderId });
};

