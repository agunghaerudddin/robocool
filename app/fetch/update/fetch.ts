import axios from "axios";

export type UpdateOrderStatusPayload = {
  id: string;
  status: string;
  notes?: string | null;
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

export const uploadOrderImage = async (file: File, type: "before" | "after") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
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
