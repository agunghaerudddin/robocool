import axios from "axios";

export type CustomerPayload = {
  name: string;
  phone: string;
  google_maps?: string | null;
  label?: string | null;
  type?: string | null;
};

export type OrderPayload = {
  commission_mode?: string | null;
  status?: string;
  payment_type?: string | null;
  payment_status?: string;
  assign_to?: string | null;
};

export type ServiceOrderPayload = {
  order_id: string | number;
  services_id: string | number;
  amount: number;
  price: number;
  warranty?: string | number | null;
};

export type UnitPayload = {
  brand: string;
  type: string;
  pk?: string | number | null;
  location?: string | null;
  service_order_id?: string | number | null;
  costumer_id?: string | number | null;
  customer_id?: string | number | null;
};

export type SparepartOrderPayload = {
  order_id: string | number;
  information: string;
  amount: number;
  price: number;
  capital_price: number;
};

export type OtherCostOrderPayload = {
  order_id: string | number;
  information: string;
  amount: number;
  price: number;
  capital_price: number;
};

export type ProductOrderPayload = {
  order_id: string | number;
  name: string;
  amount: number;
  price: number;
  capital_price: number;
};

export type ComplaintSchedulePayload = {
  order_id: string | number;
  date: string;
  time: string;
  complaint_schedule: string;
  notes?: string | null;
};

export type ServicePayload = {
  name: string;
  price: number;
  warranty?: number | null;
  estimate?: number | null;
};

export type AssignmentPayload = {
  order_id: string | number;
  assigned_to: string;
  status: string;
};

export const createCustomer = async (data: CustomerPayload) => {
  return await axios.post("/api/create/create-customer", data);
};

export const createOrder = async (data: {
  user_id: string;
  customer: { customer_id: string | number };
  order: OrderPayload;
}) => {
  return await axios.post("/api/create/create-order", data);
};

export const createServiceOrder = async (data: ServiceOrderPayload) => {
  return await axios.post("/api/create/create-service-order", data);
};

export const createUnit = async (data: UnitPayload) => {
  return await axios.post("/api/create/create-unit", data);
};

export const createSparepartOrder = async (data: SparepartOrderPayload) => {
  return await axios.post("/api/create/create-sparepart-order", data);
};

export const createOtherCostsOrder = async (data: OtherCostOrderPayload) => {
  return await axios.post("/api/create/create-other-costs-orders", data);
};

export const createProductOrder = async (data: ProductOrderPayload) => {
  return await axios.post("/api/create/create-product-order", data);
};

export const createComplaintSchedule = async (
  data: ComplaintSchedulePayload,
) => {
  return await axios.post("/api/create/create-complaint-schedules", data);
};

export type OrderHistoryPayload = {
  order_id: string | number;
  date_start?: string;
  status?: string;
  notes?: string | null;
};

export const createOrderHistory = async (data: OrderHistoryPayload) => {
  return await axios.post("/api/create/create-order-history", data);
};

export const createAssignment = async (data: AssignmentPayload) => {
  return await axios.post("/api/create/create-assignments", data);
};

export const createService = async (data: ServicePayload) => {
  return await axios.post("/api/create/create-service", data);
};

export type CreateOfferPayload = {
  customer_id?: string | null;
  company: string;
  recipient?: string | null;
  address?: string | null;
  letter_date: string;
  subject: string;
  opening?: string | null;
  subtotal: number;
  include_tax: boolean;
  tax: number;
  total: number;
  valid_days: number;
  terms?: string | null;
  signer?: string | null;
  position?: string | null;
  status?: string;
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    price: number;
  }>;
};

export const createOffer = async (data: CreateOfferPayload) => {
  return await axios.post("/api/create/create-offer", data);
};

