import axios from "axios";

export const getOrders = async () => {
  try {
    const res = await axios.get("/api/get/get-orders");
    return res;
  } catch (error) {
    console.error("Failed to fetch orders", error);
  }
};

export const getUnits = async (customerId?: string) => {
  try {
    const url = customerId
      ? `/api/get/get-others?customer_id=${encodeURIComponent(customerId)}`
      : "/api/get/get-others";
    const res = await axios.get(url);
    return res;
  } catch (error) {
    console.error("Failed to fetch units", error);
  }
};

export const getCustomers = async () => {
  try {
    const res = await axios.get("/api/get/get-customers");
    return res;
  } catch (error) {
    console.error("Failed to fetch customers", error);
  }
};

export const getServices = async () => {
  try {
    const res = await axios.get("/api/get/get-services");
    return res;
  } catch (error) {
    console.error("Failed to fetch services", error);
  }
};

export const getUsers = async () => {
  try {
    const res = await axios.get("/api/get/get-users");
    return res;
  } catch (error) {
    console.error("Failed to fetch users", error);
  }
};

export const getServiceOrders = async () => {
  try {
    const res = await axios.get("/api/get/get-service-orders");
    return res;
  } catch (error) {
    console.error("Failed to fetch service orders", error);
  }
};

export const getOrder = async (id: string) => {
  try {
    const res = await axios.get(`/api/get/get-order/${id}`);
    return res;
  } catch (error) {
    console.error("Failed to fetch order", error);
  }
};

export const getOffers = async () => {
  try {
    const res = await axios.get("/api/get/get-offers");
    return res;
  } catch (error) {
    console.error("Failed to fetch offers", error);
  }
};

export const getOffer = async (id: string) => {
  try {
    const res = await axios.get(`/api/get/get-offer/${id}`);
    return res;
  } catch (error) {
    console.error("Failed to fetch offer", error);
  }
};

export const getDashboardData = async () => {
  try {
    const res = await axios.get("/api/get/get-dashboard");
    return res;
  } catch (error) {
    console.error("Failed to fetch dashboard data", error);
  }
};


