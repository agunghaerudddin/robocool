import axios from "axios";
export const getBranch = async () => {
  try {
    const res = await axios.get("/api/get/get-orders");
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};
export const getUnits = async () => {
  try {
    const res = await axios.get("/api/get/get-orders");
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};
export const getServiceOrders = async () => {
  try {
    const res = await axios.get("/api/get/get-service-orders");
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};
