import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateClientId(): string {
  const prefix = "CLT";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  WORDPRESS: "WordPress",
  FULL_STACK: "Full Stack",
  UI_UX: "UI/UX",
  WEBFLOW: "Webflow",
  SHOPIFY: "Shopify",
  DIGITAL_MARKETING: "Digital Marketing",
  OTHER: "Other",
};

export const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  PROPOSAL_SENT: "Proposal Sent",
  COMMUNICATION_RUNNING: "Communication Running",
  PAYMENT_PENDING: "Payment Pending",
  PROPOSAL_REJECTED: "Proposal Rejected",
  ORDER_COMPLETED: "Order Completed",
};

export const PROFILE_TYPE_LABELS: Record<string, string> = {
  UI_UX: "UI/UX",
  WORDPRESS: "WordPress",
  FULL_STACK: "Full Stack",
  DIGITAL_MARKETING: "Digital Marketing",
  WEBFLOW_SHOPIFY_FRAMER: "Webflow/Shopify/Framer",
  OTHER: "Other",
};

export const LEAD_STATUS_LABELS: Record<string, string> = {
  INTERESTED: "Interested",
  NOT_INTERESTED: "Not Interested",
  NO_RESPONSE: "No Response",
  FOLLOW_UP: "Follow Up",
  PENDING_DECISION: "Pending Decision",
};

export const AD_PLATFORM_LABELS: Record<string, string> = {
  GOOGLE_ADS: "Google Ads",
  YOUTUBE_ADS: "YouTube Ads",
  BING_ADS: "Bing Ads",
  OTHER_ADS: "Other Ads",
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const STATUS_COLORS: Record<string, string> = {
  PROPOSAL_SENT: "bg-blue-100 text-blue-800",
  COMMUNICATION_RUNNING: "bg-yellow-100 text-yellow-800",
  PAYMENT_PENDING: "bg-orange-100 text-orange-800",
  PROPOSAL_REJECTED: "bg-red-100 text-red-800",
  ORDER_COMPLETED: "bg-green-100 text-green-800",
  INTERESTED: "bg-green-100 text-green-800",
  NOT_INTERESTED: "bg-red-100 text-red-800",
  NO_RESPONSE: "bg-gray-100 text-gray-800",
  FOLLOW_UP: "bg-yellow-100 text-yellow-800",
  PENDING_DECISION: "bg-purple-100 text-purple-800",
  COLD: "bg-blue-100 text-blue-800",
  HOT: "bg-red-100 text-red-800",
  WARM: "bg-orange-100 text-orange-800",
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};
