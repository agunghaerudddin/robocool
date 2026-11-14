import axios from "axios";
export const getBranch = async () => {
  try {
    const res = await axios.get("/api/get/get-orders");
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};
