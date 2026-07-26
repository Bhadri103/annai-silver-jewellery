import { useEffect, useRef, useState } from "react";
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ChangeEvent, MouseEvent, ReactNode } from "react";
import {
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  Camera,
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Copy,
  CreditCard,
  Download,
  Edit3,
  Eye,
  ExternalLink,
  FileText,
  Globe,
  Image,
  ImagePlus,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Moon,
  Package,
  Plus,
  Power,
  Printer,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  Sun,
  Trash2,
  TicketPercent,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import logo from "../assets/logo.png";
import logoDark from "../assets/logo-dark-theme.png";
import logoSm from "../assets/logo-sm.png";
import { CertificateData, CertificateEditableElement, CertificateEditableElementKey, CertificateStatus, CertificateTemplateData, CertificateTextAlign, CertificateTextFont, HighgradeCertificate, defaultCertificateData, defaultCertificateTemplate } from "../components/HighgradeCertificate";
import { clean, isEmail, isName, isNonNegativeNumber, isPhone, isPositiveNumber, isRating, isUrl, limitPhoneDigits, maxLength, phoneDigits } from "../lib/validation";
import {
  getMembershipPlansVisible,
  getStoredMembershipPlans,
  membershipPlansChangedEvent,
  saveMembershipPlansVisible,
  saveStoredMembershipPlans,
  type MembershipPlan,
} from "../pages/highgrade/shared";

type AdminTab = "dashboard" | "products" | "billing" | "coupons" | "orders" | "enquiries" | "users" | "testimonials" | "gallery" | "content" | "certificates" | "certificateTemplates" | "reports" | "notifications";
const adminTabIds: AdminTab[] = ["dashboard", "products", "billing", "coupons", "orders", "enquiries", "users", "testimonials", "gallery", "content", "certificates", "certificateTemplates", "reports", "notifications"];
const isAdminTab = (value: string | null): value is AdminTab => Boolean(value && adminTabIds.includes(value as AdminTab));
const getInitialAdminTab = (): AdminTab => {
  if (typeof window === "undefined") return "dashboard";
  const urlTab = new URLSearchParams(window.location.search).get("tab");
  if (isAdminTab(urlTab)) return urlTab;
  const savedTab = sessionStorage.getItem("highgrade-admin-tab");
  return isAdminTab(savedTab) ? savedTab : "dashboard";
};
type Product = {
  id: number;
  name: string;
  category: string;
  brand: string;
  price: number;
  comparePrice: number;
  stock: number;
  image: string;
  badge: string;
  rating: number;
  isActive: boolean;
  isFeatured: boolean;
  inStock: boolean;
  description: string;
};
type Order = {
  dbId: number;
  id: string;
  customer: string;
  email: string;
  phone: string;
  product: string;
  category: string;
  amount: number;
  paymentStatus: "Pending" | "Paid" | "Failed" | "Refunded";
  paymentMethod: string;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  deliveryMode: "Pickup" | "Delivery";
  deliveryAddress: string;
  invoiceNumber: string;
  notes: string;
  date: string;
  createdAt: string;
};
type Enquiry = {
  id: number;
  name: string;
  email: string;
  phone: string;
  program: string;
  source: string;
  message: string;
  status: "New" | "Contacted" | "Converted" | "Closed";
  createdAt: string;
};
type Member = {
  id: number;
  name: string;
  email: string;
  phone: string;
  plan: string;
  goal: string;
  address: string;
  active: boolean;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
};
type Testimonial = {
  id: number;
  name: string;
  role: string;
  rating: number;
  text: string;
  imageUrl: string;
  source: string;
  authorMeta: string;
  reviewDate: string;
  visible: boolean;
};
type Blog = {
  id: number;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  body: string;
  imageUrl: string;
  status: "Draft" | "Published";
  featured: boolean;
  createdAt: string;
};
type GalleryItem = {
  id: number;
  title: string;
  category: string;
  mediaType: "image" | "video" | "tour";
  imageUrl: string;
  videoUrl: string;
  description: string;
  sortOrder: number;
  visible: boolean;
  createdAt: string;
};
type Coupon = {
  id: number;
  code: string;
  title: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number;
  validFrom: string;
  validTo: string;
  usageLimit: number;
  perUserLimit: number;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
};
type AuthEvent = {
  id: number;
  userId: number | null;
  name: string;
  email: string;
  phone: string;
  eventType: "register" | "login" | "otp_request" | "otp_login" | "password_reset_request" | "password_reset" | "profile_update" | "wishlist_update";
  method: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
};
type Certificate = CertificateData & {
  id: number;
  notes: string;
  certificatePdfUrl?: string;
  pdfUrl?: string;
  createdAt: string;
};
type CertificateTemplate = CertificateTemplateData & {
  id: number;
  createdAt: string;
};
type AdminNotification = {
  id: string;
  title: string;
  message: string;
  date: string;
  tab: AdminTab;
  tone: "red" | "amber" | "green" | "neutral";
  sortAt: string;
};
type RevenuePeriod = "daily" | "weekly" | "monthly" | "yearly";
type RevenuePreset = "today" | "thisWeek" | "thisYear";
type ListKey = "products" | "orders" | "enquiries" | "users" | "testimonials" | "gallery" | "blogs" | "coupons" | "certificates" | "certificateTemplates" | "authEvents";
type PageState = { page: number; limit: number; total: number; totalPages: number };
type TablePagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};
type DataTableRow = ReactNode[] | { cells: ReactNode[]; onClick?: () => void };
type PlanForm = { name: string; note: string; image: string; featuresText: string; visible: boolean };
type CertificateForm = CertificateData & { notes: string };
type CertificateTemplateForm = CertificateTemplateData;

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const tokenKey = "highgrade_admin_token";
const money = (value: number) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
const today = () => new Date().toISOString().slice(0, 10);
const currentYearStart = () => `${new Date().getFullYear()}-01-01`;
const currentWeekStart = () => {
  const date = new Date();
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return date.toISOString().slice(0, 10);
};
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};
const safeJsonArray = (value: string | null) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

type FormErrors = Record<string, string>;
const firstFormError = (errors: FormErrors) => Object.values(errors).find(Boolean) || "";
const sortTime = (value: string) => {
  const timestamp = new Date(value || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};
const revenueBucket = (dateText: string, period: RevenuePeriod) => {
  const date = new Date(`${dateText || today()}T00:00:00`);
  if (Number.isNaN(date.getTime())) return today();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  if (period === "yearly") return String(year);
  if (period === "monthly") return `${year}-${month}`;
  if (period === "weekly") {
    const weekStart = new Date(date);
    const offset = (weekStart.getDay() + 6) % 7;
    weekStart.setDate(weekStart.getDate() - offset);
    return `Week of ${weekStart.toISOString().slice(0, 10)}`;
  }
  return `${year}-${month}-${day}`;
};
const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const safeDate = (dateText: string) => {
  const date = new Date(`${dateText || today()}T00:00:00`);
  return Number.isNaN(date.getTime()) ? new Date(`${today()}T00:00:00`) : date;
};
const weekStartDate = (date: Date) => {
  const next = new Date(date);
  const offset = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - offset);
  return next;
};
const revenueBucketRange = (from: string, to: string, period: RevenuePeriod) => {
  const start = safeDate(from);
  const end = safeDate(to);
  if (start > end) return [];
  const buckets: string[] = [];
  const maxBuckets = period === "daily" ? 45 : period === "weekly" ? 32 : period === "monthly" ? 60 : 12;
  let cursor = new Date(start);
  if (period === "weekly") cursor = weekStartDate(cursor);
  if (period === "monthly") cursor = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  if (period === "yearly") cursor = new Date(cursor.getFullYear(), 0, 1);
  while (cursor <= end && buckets.length < maxBuckets) {
    buckets.push(revenueBucket(dateKey(cursor), period));
    if (period === "daily") cursor.setDate(cursor.getDate() + 1);
    else if (period === "weekly") cursor.setDate(cursor.getDate() + 7);
    else if (period === "monthly") cursor.setMonth(cursor.getMonth() + 1);
    else cursor.setFullYear(cursor.getFullYear() + 1);
  }
  return Array.from(new Set(buckets));
};

const blankProduct: Product = {
  id: 0,
  name: "",
  category: "Protein",
  brand: "Highgrade",
  price: 0,
  comparePrice: 0,
  stock: 10,
  image: "",
  badge: "Best Seller",
  rating: 4.8,
  isActive: true,
  isFeatured: false,
  inStock: true,
  description: "",
};

const blankUser = { name: "", email: "", phone: "", password: "", plan: "Monthly", goal: "Fat Loss", address: "" };
const blankBilling = { customerName: "", customerEmail: "", customerPhone: "", productId: "", paymentMethod: "UPI", paymentStatus: "Paid", deliveryMode: "Pickup", deliveryAddress: "", notes: "" };
const blankTestimonial = { name: "", role: "Highgrade member", rating: 5, text: "", imageUrl: "", source: "Website", authorMeta: "", reviewDate: "" };
const blankGalleryItem = { title: "", category: "Gym Photos", mediaType: "image" as const, imageUrl: "", videoUrl: "", description: "", sortOrder: 0, isVisible: true };
const blankBlog = { title: "", slug: "", category: "Nutrition", excerpt: "", body: "", imageUrl: "", status: "Draft", featured: false };
const blankCoupon = { code: "", title: "", discountType: "percentage" as const, discountValue: 10, minOrderAmount: 0, maxDiscount: 0, validFrom: "", validTo: "", usageLimit: 0, perUserLimit: 1, isActive: true };
const blankPlanForm: PlanForm = { name: "", note: "", image: "", featuresText: "", visible: true };
const blankCertificateTemplate: CertificateTemplateForm = {
  ...defaultCertificateTemplate,
  name: "",
  backgroundImage: "",
  isDefault: false,
};
const isUploadImage = (value: string) => !value || isUrl(value) || value.startsWith("data:image/");
const certificateFontOptions = [
  "Georgia", "Times New Roman", "Garamond", "Palatino Linotype", "Book Antiqua", "Cambria", "Constantia", "Baskerville",
  "Bodoni 72", "Bodoni MT", "Didot", "Hoefler Text", "Libre Baskerville", "Cormorant Garamond", "Cinzel", "Playfair Display",
  "Merriweather", "Lora", "Crimson Text", "Noto Serif", "Source Serif Pro", "PT Serif", "DM Serif Display", "EB Garamond",
  "Cardo", "Spectral", "Vollkorn", "Alegreya", "Bitter", "Roboto Slab", "Arvo", "Zilla Slab", "Courier New", "Courier",
  "Consolas", "Monaco", "Lucida Console", "Menlo", "Arial", "Helvetica", "Inter", "Verdana", "Tahoma", "Trebuchet MS",
  "Segoe UI", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Raleway", "Nunito", "Ubuntu", "Oswald", "Source Sans Pro",
  "Noto Sans", "PT Sans", "Work Sans", "Fira Sans", "Cabin", "Quicksand", "Mulish", "Manrope", "Rubik", "Karla", "Barlow",
  "Hind", "Mukta", "Assistant", "Heebo", "Jost", "Urbanist", "Lexend", "Archivo", "Sora", "Public Sans", "Avenir",
  "Avenir Next", "Gill Sans", "Century Gothic", "Franklin Gothic Medium", "Futura", "Optima", "Geneva", "Impact", "Arial Black",
  "Copperplate", "Papyrus", "Brush Script MT", "Lucida Handwriting", "Segoe Script", "Monotype Corsiva", "Snell Roundhand",
  "Bradley Hand", "Marker Felt", "Chalkboard", "Noteworthy", "American Typewriter", "Rockwell", "Perpetua", "Candara",
  "Calibri", "Corbel", "Lucida Sans", "Lucida Grande", "System UI", "Serif", "Sans-serif", "Cursive", "Fantasy", "Monospace",
  "Algerian", "Bell MT", "Berlin Sans FB", "Bernard MT Condensed", "Bookman Old Style", "Britannic Bold", "Broadway",
  "Calisto MT", "Centaur", "Century Schoolbook", "Colonna MT", "Cooper Black", "Elephant", "Engravers MT", "Felix Titling",
  "Footlight MT Light", "Goudy Old Style", "Harrington", "High Tower Text", "Imprint MT Shadow", "Javanese Text",
  "Juice ITC", "Kristen ITC", "Magneto", "Matura MT Script Capitals", "Modern No. 20", "Niagara Solid", "Old English Text MT",
  "Onyx", "Poor Richard", "Pristina", "Rage Italic", "Ravie", "Segoe Print", "Showcard Gothic", "Stencil", "Tempus Sans ITC",
  "Tw Cen MT", "Viner Hand ITC", "Vivaldi", "Wide Latin",
];
const blankCertificate: CertificateForm = {
  ...defaultCertificateData,
  studentName: "",
  studentId: "",
  certificateNo: "",
  batchName: "Level 1 Batch",
  duration: "12 weeks",
  enrollmentDate: "",
  completionDate: today(),
  issueDate: today(),
  templateId: "",
  notes: "",
};
const badgeOptions = ["Best Seller", "Best Deal", "Coach Pick", "Daily Use", "New Launch", "Limited Stock", "Hydration", "Lean Choice"];
const defaultPageState = { page: 1, limit: 10, total: 0, totalPages: 1 };

const apiRequest = async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem(tokenKey);
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data as T;
};

const mapProduct = (item: any): Product => ({
  id: Number(item.id || item._id || 0),
  name: item.name || "",
  category: item.category || "",
  brand: item.brand || "",
  price: Number(item.price || item.displayPrice || 0),
  comparePrice: Number(item.comparePrice || item.displayOriginalPrice || 0),
  stock: Number(item.stock || 0),
  image: item.image || item.imageUrl || item.images?.[0] || "",
  badge: item.badge || "",
  rating: Number(item.rating || 0),
  isActive: item.isActive !== false,
  isFeatured: Boolean(item.isFeatured),
  inStock: item.inStock !== false,
  description: item.description || "",
});

const mapOrder = (item: any): Order => ({
  dbId: Number(item.id || item._id || 0),
  id: item.orderId || item.order_id || String(item.id || item._id || ""),
  customer: item.customerName || item.user?.name || "",
  email: item.customerEmail || item.user?.email || "",
  phone: item.customerPhone || item.user?.phone || "",
  product: item.product || "",
  category: item.category || "",
  amount: Number(item.amount || 0),
  paymentStatus: item.paymentStatus || "Pending",
  paymentMethod: item.paymentMethod || "",
  status: item.status || "Pending",
  deliveryMode: item.deliveryMode || "Pickup",
  deliveryAddress: item.deliveryAddress || "",
  invoiceNumber: item.invoiceNumber || "",
  notes: item.notes || "",
  date: String(item.createdAt || item.created_at || today()).slice(0, 10),
  createdAt: String(item.createdAt || item.created_at || today()),
});

const ecommerceCategories = new Set(["Protein", "Creatine", "Recovery", "Performance", "Wellness", "Supplement", "Supplements"]);
const isEcommerceOrder = (order: Order) => {
  const notes = order.notes.toLowerCase();
  return (
    order.paymentMethod === "PhonePe" ||
    notes.includes("website supplement") ||
    notes.includes("website phonepe") ||
    ecommerceCategories.has(order.category)
  );
};

const mapEnquiry = (item: any): Enquiry => ({
  id: Number(item.id || item._id || 0),
  name: item.name || "",
  email: item.email || "",
  phone: item.phone || "",
  program: item.program || "",
  source: item.source || "Website",
  message: item.message || "",
  status: item.status || "New",
  createdAt: String(item.createdAt || item.created_at || today()),
});

const mapMember = (item: any): Member => ({
  id: Number(item.id || item._id || 0),
  name: item.name || "",
  email: item.email || "",
  phone: item.phone || "",
  plan: item.plan || "Member",
  goal: item.goal || "",
  address: item.address || "",
  active: item.isActive !== false,
  orderCount: Number(item.orderCount || 0),
  totalSpent: Number(item.totalSpent || 0),
  createdAt: String(item.createdAt || item.created_at || today()).slice(0, 10),
});

const mapTestimonial = (item: any): Testimonial => ({
  id: Number(item.id || item._id || 0),
  name: item.name || "",
  role: item.role || "",
  rating: Number(item.rating || 5),
  text: item.text || "",
  imageUrl: item.imageUrl || item.image_url || "",
  source: item.source || "Website",
  authorMeta: item.authorMeta || item.author_meta || "",
  reviewDate: item.reviewDate || item.review_date || String(item.createdAt || item.created_at || "").slice(0, 10),
  visible: item.isVisible !== false,
});

const mapBlog = (item: any): Blog => ({
  id: Number(item.id || item._id || 0),
  title: item.title || "",
  slug: item.slug || "",
  category: item.category || "Fitness",
  excerpt: item.excerpt || "",
  body: item.body || item.content || "",
  imageUrl: item.imageUrl || item.image_url || item.image || "",
  status: item.status || "Draft",
  featured: Boolean(item.isFeatured || item.featured),
  createdAt: String(item.createdAt || item.created_at || today()).slice(0, 10),
});

const mapGalleryItem = (item: any): GalleryItem => ({
  id: Number(item.id || item._id || 0),
  title: item.title || "",
  category: item.category || "Gym Photos",
  mediaType: item.mediaType || item.media_type || "image",
  imageUrl: item.imageUrl || item.image_url || "",
  videoUrl: item.videoUrl || item.video_url || "",
  description: item.description || "",
  sortOrder: Number(item.sortOrder || item.sort_order || 0),
  visible: item.isVisible !== false && item.is_visible !== 0,
  createdAt: String(item.createdAt || item.created_at || today()).slice(0, 10),
});

const mapCoupon = (item: any): Coupon => ({
  id: Number(item.id || item._id || 0),
  code: item.code || "",
  title: item.title || "",
  discountType: item.discountType || item.discount_type || "percentage",
  discountValue: Number(item.discountValue || item.discount_value || 0),
  minOrderAmount: Number(item.minOrderAmount || item.min_order_amount || 0),
  maxDiscount: Number(item.maxDiscount || item.max_discount || 0),
  validFrom: item.validFrom || item.valid_from || "",
  validTo: item.validTo || item.valid_to || "",
  usageLimit: Number(item.usageLimit || item.usage_limit || 0),
  perUserLimit: Number(item.perUserLimit || item.per_user_limit || 0),
  usageCount: Number(item.usageCount || item.usage_count || 0),
  isActive: item.isActive !== false && item.is_active !== 0,
  createdAt: String(item.createdAt || item.created_at || today()).slice(0, 10),
});

const mapCertificate = (item: any): Certificate => ({
  id: Number(item.id || item._id || 0),
  templateId: item.templateId || item.template_id ? Number(item.templateId || item.template_id) : "",
  studentName: item.studentName || item.student_name || "",
  studentId: item.studentId || item.student_id || "",
  certificateNo: item.certificateNo || item.certificate_no || "",
  verificationToken: item.verificationToken || item.verification_token || "",
  courseName: item.courseName || item.course_name || "Highgrade Fitness Academy",
  courseLevel: item.courseLevel || item.course_level || "Level 1 - Certified Fitness Trainer",
  batchName: item.batchName || item.batch_name || "",
  duration: item.duration || "",
  enrollmentDate: String(item.enrollmentDate || item.enrollment_date || "").slice(0, 10),
  completionDate: String(item.completionDate || item.completion_date || "").slice(0, 10),
  issueDate: String(item.issueDate || item.issue_date || "").slice(0, 10),
  instructorName: item.instructorName || item.instructor_name || "Manoj Murugesan",
  directorName: item.directorName || item.director_name || "Manoj Murugesan",
  studentPhoto: item.studentPhoto || item.student_photo || "",
  signatureUrl: item.signatureUrl || item.signature_url || "",
  certificatePdfUrl: item.certificatePdfUrl || item.certificate_pdf_url || item.pdfUrl || "",
  pdfUrl: item.pdfUrl || item.certificatePdfUrl || item.certificate_pdf_url || "",
  status: (item.status || "Valid") as CertificateStatus,
  template: item.template,
  notes: item.notes || "",
  updatedAt: item.updatedAt || item.updated_at || "",
  createdAt: String(item.createdAt || item.created_at || today()).slice(0, 10),
});

const adminMediaSrc = (value = "") => {
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
  if (value.startsWith("/uploads/")) return `${API_BASE.replace(/\/api$/, "")}${value}`;
  return value;
};

const uploadAdminImageIfNeeded = async (value = "", folder = "images") => {
  if (!value.startsWith("data:image/")) return value;
  const uploaded = await apiRequest<{ path?: string; url?: string }>("/admin/uploads/image", {
    method: "POST",
    body: JSON.stringify({ image: value, folder }),
  });
  return uploaded.path || uploaded.url || value;
};

const parseCertificateElements = (value: any) => {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return {};
  }
};

const isBuiltInCertificateTemplate = (item: any) =>
  Boolean(item.isDefault || item.is_default) && String(item.name || "").trim() === "Highgrade Academy Classic";

const mapCertificateTemplate = (item: any): CertificateTemplate => {
  const useBuiltInDefaults = isBuiltInCertificateTemplate(item);
  return {
    id: Number(item.id || item._id || 0),
    name: item.name || "Highgrade Academy Classic",
    backgroundImage: item.backgroundImage || item.background_image || "",
    logoImage: item.logoImage || item.logo_image || "",
    signatureImage: item.signatureImage || item.signature_image || "",
    accentColor: item.accentColor || item.accent_color || "#dd0b5b",
    navyColor: item.navyColor || item.navy_color || "#D4AF37",
    goldColor: item.goldColor || item.gold_color || "#bd8a2e",
    logoTop: useBuiltInDefaults ? defaultCertificateTemplate.logoTop : Number(item.logoTop || item.logo_top || defaultCertificateTemplate.logoTop),
    logoLeft: useBuiltInDefaults ? defaultCertificateTemplate.logoLeft : Number(item.logoLeft || item.logo_left || defaultCertificateTemplate.logoLeft),
    logoWidth: useBuiltInDefaults ? defaultCertificateTemplate.logoWidth : Number(item.logoWidth || item.logo_width || defaultCertificateTemplate.logoWidth),
    taglineTop: useBuiltInDefaults ? defaultCertificateTemplate.taglineTop : Number(item.taglineTop || item.tagline_top || defaultCertificateTemplate.taglineTop),
    taglineLeft: useBuiltInDefaults ? defaultCertificateTemplate.taglineLeft : Number(item.taglineLeft || item.tagline_left || defaultCertificateTemplate.taglineLeft),
    taglineWidth: useBuiltInDefaults ? defaultCertificateTemplate.taglineWidth : Number(item.taglineWidth || item.tagline_width || defaultCertificateTemplate.taglineWidth),
    taglineFontSize: useBuiltInDefaults ? defaultCertificateTemplate.taglineFontSize : Number(item.taglineFontSize || item.tagline_font_size || defaultCertificateTemplate.taglineFontSize),
    taglineLetterSpacing: useBuiltInDefaults ? defaultCertificateTemplate.taglineLetterSpacing : Number(item.taglineLetterSpacing || item.tagline_letter_spacing || defaultCertificateTemplate.taglineLetterSpacing),
    nameTop: useBuiltInDefaults ? defaultCertificateTemplate.nameTop : Number(item.nameTop || item.name_top || defaultCertificateTemplate.nameTop),
    nameLeft: useBuiltInDefaults ? defaultCertificateTemplate.nameLeft : Number(item.nameLeft || item.name_left || defaultCertificateTemplate.nameLeft),
    nameWidth: useBuiltInDefaults ? defaultCertificateTemplate.nameWidth : Number(item.nameWidth || item.name_width || defaultCertificateTemplate.nameWidth),
    nameFontSize: useBuiltInDefaults ? defaultCertificateTemplate.nameFontSize : Number(item.nameFontSize || item.name_font_size || defaultCertificateTemplate.nameFontSize),
    nameFont: useBuiltInDefaults ? defaultCertificateTemplate.nameFont : item.nameFont || item.name_font || defaultCertificateTemplate.nameFont,
    nameFontWeight: useBuiltInDefaults ? defaultCertificateTemplate.nameFontWeight : Number(item.nameFontWeight || item.name_font_weight || defaultCertificateTemplate.nameFontWeight),
    nameLetterSpacing: useBuiltInDefaults ? defaultCertificateTemplate.nameLetterSpacing : Number(item.nameLetterSpacing || item.name_letter_spacing || defaultCertificateTemplate.nameLetterSpacing),
    nameAlign: useBuiltInDefaults ? defaultCertificateTemplate.nameAlign : item.nameAlign || item.name_align || defaultCertificateTemplate.nameAlign,
    courseTop: useBuiltInDefaults ? defaultCertificateTemplate.courseTop : Number(item.courseTop || item.course_top || defaultCertificateTemplate.courseTop),
    qrTop: useBuiltInDefaults ? defaultCertificateTemplate.qrTop : Number(item.qrTop || item.qr_top || defaultCertificateTemplate.qrTop),
    qrRight: useBuiltInDefaults ? defaultCertificateTemplate.qrRight : Number(item.qrRight || item.qr_right || defaultCertificateTemplate.qrRight),
    qrSize: useBuiltInDefaults ? defaultCertificateTemplate.qrSize : Number(item.qrSize || item.qr_size || defaultCertificateTemplate.qrSize),
    showQr: item.showQr !== false && item.show_qr !== 0,
    signatureTop: useBuiltInDefaults ? defaultCertificateTemplate.signatureTop : Number(item.signatureTop || item.signature_top || defaultCertificateTemplate.signatureTop),
    signatureLeft: useBuiltInDefaults ? defaultCertificateTemplate.signatureLeft : Number(item.signatureLeft || item.signature_left || defaultCertificateTemplate.signatureLeft),
    signatureWidth: useBuiltInDefaults ? defaultCertificateTemplate.signatureWidth : Number(item.signatureWidth || item.signature_width || defaultCertificateTemplate.signatureWidth),
    photoLeft: useBuiltInDefaults ? defaultCertificateTemplate.photoLeft : Number(item.photoLeft || item.photo_left || defaultCertificateTemplate.photoLeft),
    photoBottom: useBuiltInDefaults ? defaultCertificateTemplate.photoBottom : Number(item.photoBottom || item.photo_bottom || defaultCertificateTemplate.photoBottom),
    photoSize: useBuiltInDefaults ? defaultCertificateTemplate.photoSize : Number(item.photoSize || item.photo_size || defaultCertificateTemplate.photoSize),
    elements: useBuiltInDefaults ? {} : parseCertificateElements(item.elements || item.layoutJson || item.layout_json),
    status: item.status || "Active",
    isDefault: Boolean(item.isDefault || item.is_default),
    createdAt: String(item.createdAt || item.created_at || today()).slice(0, 10),
  };
};

const mapAuthEvent = (item: any): AuthEvent => ({
  id: Number(item.id || item._id || 0),
  userId: item.userId || item.user_id ? Number(item.userId || item.user_id) : null,
  name: item.name || "",
  email: item.email || "",
  phone: item.phone || "",
  eventType: item.eventType || item.event_type || "login",
  method: item.method || "",
  ipAddress: item.ipAddress || item.ip_address || "",
  userAgent: item.userAgent || item.user_agent || "",
  createdAt: String(item.createdAt || item.created_at || today()),
});

const AdminCard = ({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement> & { children: ReactNode }) => (
  <div {...props} className={`admin-card min-w-0 rounded-2xl border p-3 shadow-sm sm:p-4 ${className}`}>{children}</div>
);

const AdminModalShell = ({
  children,
  header,
  footer,
  className = "",
}: {
  children: ReactNode;
  header: ReactNode;
  footer?: ReactNode;
  className?: string;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-amber-800/70 p-3 sm:p-4">
    <div className={`admin-card flex max-h-[calc(100dvh-1.5rem)] w-full min-w-0 flex-col overflow-hidden rounded-2xl border shadow-sm sm:max-h-[calc(100dvh-2rem)] ${className}`}>
      <div className="admin-modal-header shrink-0 border-b p-4 sm:p-5">
        {header}
      </div>
      <div className="admin-modal-body min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
        {children}
      </div>
      {footer && (
        <div className="admin-modal-footer shrink-0 border-t p-4 sm:p-5">
          {footer}
        </div>
      )}
    </div>
  </div>
);

type InputErrorProps = { error?: string; label?: string };

const Field = ({ error, label, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & InputErrorProps) => (
  <div className="min-w-0">
    {(label || props.placeholder || props["aria-label"]) && (
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label || props.placeholder || props["aria-label"]}
      </label>
    )}
    <input {...props} aria-invalid={Boolean(error)} className={`admin-input w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${error ? "border-amber-500" : ""} ${className}`} />
    {error && <p className="mt-1 text-xs text-amber-600">{error}</p>}
  </div>
);

const TextArea = ({ error, label, className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & InputErrorProps) => (
  <div className="min-w-0">
    {(label || props.placeholder || props["aria-label"]) && (
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label || props.placeholder || props["aria-label"]}
      </label>
    )}
    <textarea {...props} aria-invalid={Boolean(error)} className={`admin-input min-h-24 w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${error ? "border-amber-500" : ""} ${className}`} />
    {error && <p className="mt-1 text-xs text-amber-600">{error}</p>}
  </div>
);

const Select = ({ error, label, className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & InputErrorProps) => (
  <div className="min-w-0">
    {(label || props["aria-label"]) && (
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label || props["aria-label"]}
      </label>
    )}
    <select {...props} aria-invalid={Boolean(error)} className={`admin-input w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${error ? "border-amber-500" : ""} ${className}`} />
    {error && <p className="mt-1 text-xs text-amber-600">{error}</p>}
  </div>
);

const RangeField = ({ label, value, min, max, step, onChange, suffix = "%" }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void; suffix?: string }) => (
  <label className="min-w-0">
    <span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
      <span>{label}</span>
      <span>{Number(value).toFixed(step < 0.1 ? 2 : 1)}{suffix}</span>
    </span>
    <input className="w-full accent-amber-600" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
  </label>
);

const StatusPill = ({ children, tone = "neutral" }: { children: ReactNode; tone?: "green" | "red" | "amber" | "neutral" }) => (
  <span className={`admin-pill admin-pill-${tone} inline-flex rounded-full px-3 py-1 text-xs font-medium`}>{children}</span>
);

const nowrapTableHeads = new Set([
  "Action",
  "Actions",
  "Amount",
  "Category",
  "Customer",
  "Date",
  "Deal",
  "Department",
  "Featured",
  "Image",
  "IP",
  "Method",
  "Name",
  "Order",
  "Orders",
  "Payment",
  "Phone",
  "Plan",
  "Price",
  "Rating",
  "Reviewer",
  "Source",
  "Status",
  "Stock",
  "Time",
  "Title",
  "Type",
  "User",
  "Value",
]);
const tableCellClass = (head: string) => nowrapTableHeads.has(head) ? "admin-table-nowrap whitespace-nowrap" : "";

const DataTable = ({ heads, rows, pagination }: { heads: string[]; rows: DataTableRow[]; pagination?: TablePagination }) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const effectivePage = pagination?.page ?? page;
  const effectivePageSize = pagination?.pageSize ?? pageSize;
  const effectiveTotal = pagination?.total ?? rows.length;
  const totalPages = Math.max(pagination?.totalPages ?? Math.ceil(effectiveTotal / effectivePageSize), 1);
  const currentPage = Math.min(effectivePage, totalPages);
  const start = effectiveTotal ? (currentPage - 1) * effectivePageSize : 0;
  const visibleRows = pagination ? rows : rows.slice(start, start + effectivePageSize);

  useEffect(() => {
    if (!pagination) setPage(1);
  }, [rows.length, pageSize, pagination]);

  const changePageSize = (nextSize: number) => {
    if (pagination) {
      pagination.onPageSizeChange(nextSize);
      return;
    }
    setPageSize(nextSize);
  };

  const changePage = (nextPage: number) => {
    const normalized = Math.min(Math.max(nextPage, 1), totalPages);
    if (pagination) {
      pagination.onPageChange(normalized);
      return;
    }
    setPage(normalized);
  };
  const isInteractiveTarget = (target: EventTarget | null) => target instanceof HTMLElement && Boolean(target.closest("button,a,input,select,textarea,label"));

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[740px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-[0.16em] text-slate-500">
              {heads.map((head) => <th key={head} className={`px-2 py-2.5 font-medium sm:px-3 ${tableCellClass(head)}`}>{head}</th>)}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr><td className="px-3 py-10 text-center text-slate-500" colSpan={heads.length}>No records found</td></tr>
            ) : visibleRows.map((row, index) => {
              const cells = Array.isArray(row) ? row : row.cells;
              const onRowClick = Array.isArray(row) ? undefined : row.onClick;
              return (
              <tr
                key={`${currentPage}-${index}`}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? "button" : undefined}
                onClick={(event) => {
                  if (!onRowClick || isInteractiveTarget(event.target)) return;
                  onRowClick();
                }}
                onKeyDown={(event) => {
                  if (!onRowClick || isInteractiveTarget(event.target)) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onRowClick();
                  }
                }}
                className={`admin-table-row border-b ${onRowClick ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500/25" : ""}`}
              >
                {cells.map((cell, cellIndex) => <td key={cellIndex} className={`px-2 py-3 align-middle sm:px-3 ${tableCellClass(heads[cellIndex] || "")}`}>{cell}</td>)}
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <span>Rows per page</span>
          <select
            value={effectivePageSize}
            onChange={(event) => changePageSize(Number(event.target.value))}
            className="admin-input w-20 rounded-xl border px-2 py-2 text-sm outline-none"
          >
            {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </div>
        <div className="text-slate-500">
          {effectiveTotal ? `${start + 1}-${Math.min(start + effectivePageSize, effectiveTotal)} of ${effectiveTotal}` : "0 of 0"}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-full border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-45"
          >
            Previous
          </button>
          <span className="text-slate-500">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="rounded-full border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-45"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminToast = ({ loading, error, notice }: { loading: boolean; error: string; notice: string }) => {
  const message = error || notice || (loading ? "Syncing..." : "");
  if (!message) return null;
  const tone = error ? "border-amber-200 bg-amber-50 text-amber-700" : notice ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-white text-slate-600";
  return (
    <div className="fixed right-4 top-4 z-[70] w-[min(24rem,calc(100vw-2rem))]">
      <div className={`rounded-2xl border px-4 py-3 text-sm shadow-xl backdrop-blur ${tone}`}>
        {message}
      </div>
    </div>
  );
};

export default function HighgradeAdminPanel() {
  const [activeTab, setActiveTabState] = useState<AdminTab>(() => getInitialAdminTab());
  const activeTabRef = useRef<AdminTab>(activeTab);
  const adminTabStackRef = useRef<AdminTab[]>([activeTab]);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [dark, setDark] = useState(document.documentElement.classList.contains("theme-dark"));
  const [query, setQuery] = useState("");
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem(tokenKey) || "");
  const [loginForm, setLoginForm] = useState({ username: "Manoj", password: "" });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>(() => getStoredMembershipPlans());
  const [membershipPlansVisible, setMembershipPlansVisible] = useState(() => getMembershipPlansVisible());
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [certificateTemplates, setCertificateTemplates] = useState<CertificateTemplate[]>([]);
  const [authEvents, setAuthEvents] = useState<AuthEvent[]>([]);
  const [dashboardStats, setDashboardStats] = useState<Record<string, number>>({});
  const [listPages, setListPages] = useState<Record<ListKey, PageState>>({
    products: { ...defaultPageState },
    orders: { ...defaultPageState },
    enquiries: { ...defaultPageState },
    users: { ...defaultPageState },
    testimonials: { ...defaultPageState },
    gallery: { ...defaultPageState },
    blogs: { ...defaultPageState },
    coupons: { ...defaultPageState },
    certificates: { ...defaultPageState },
    certificateTemplates: { ...defaultPageState },
    authEvents: { ...defaultPageState },
  });

  const [productForm, setProductForm] = useState<Product>(blankProduct);
  const [productErrors, setProductErrors] = useState<FormErrors>({});
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [userForm, setUserForm] = useState(blankUser);
  const [userErrors, setUserErrors] = useState<FormErrors>({});
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [billingForm, setBillingForm] = useState(blankBilling);
  const [billingErrors, setBillingErrors] = useState<FormErrors>({});
  const [testimonialForm, setTestimonialForm] = useState(blankTestimonial);
  const [testimonialErrors, setTestimonialErrors] = useState<FormErrors>({});
  const [editingTestimonialId, setEditingTestimonialId] = useState<number | null>(null);
  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);
  const [galleryForm, setGalleryForm] = useState(blankGalleryItem);
  const [galleryErrors, setGalleryErrors] = useState<FormErrors>({});
  const [galleryUploadImages, setGalleryUploadImages] = useState<string[]>([]);
  const [editingGalleryId, setEditingGalleryId] = useState<number | null>(null);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [blogForm, setBlogForm] = useState(blankBlog);
  const [blogErrors, setBlogErrors] = useState<FormErrors>({});
  const [editingBlogId, setEditingBlogId] = useState<number | null>(null);
  const [blogModalOpen, setBlogModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState<PlanForm>(blankPlanForm);
  const [planErrors, setPlanErrors] = useState<FormErrors>({});
  const [editingPlanIndex, setEditingPlanIndex] = useState<number | null>(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState(blankCoupon);
  const [couponErrors, setCouponErrors] = useState<FormErrors>({});
  const [editingCouponId, setEditingCouponId] = useState<number | null>(null);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [certificateForm, setCertificateForm] = useState<CertificateForm>(blankCertificate);
  const [certificateErrors, setCertificateErrors] = useState<FormErrors>({});
  const [editingCertificateId, setEditingCertificateId] = useState<number | null>(null);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [previewCertificate, setPreviewCertificate] = useState<Certificate | null>(null);
  const [certificateTemplateForm, setCertificateTemplateForm] = useState<CertificateTemplateForm>(blankCertificateTemplate);
  const [certificateTemplateErrors, setCertificateTemplateErrors] = useState<FormErrors>({});
  const [editingCertificateTemplateId, setEditingCertificateTemplateId] = useState<number | null>(null);
  const [certificateTemplateModalOpen, setCertificateTemplateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedUser, setSelectedUser] = useState<Member | null>(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationClosing, setNotificationClosing] = useState(false);
  const [readNotifications, setReadNotifications] = useState<string[]>(() => safeJsonArray(localStorage.getItem("highgrade_read_notifications")));
  const [revenuePreset, setRevenuePreset] = useState<RevenuePreset>("thisYear");

  const updateAdminTabUrl = (tab: AdminTab, mode: "push" | "replace" = "push") => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    if (mode === "replace") {
      window.history.replaceState({ adminTab: tab }, "", url);
      return;
    }
    if (url.href !== window.location.href) window.history.pushState({ adminTab: tab }, "", url);
  };

  const navigateAdminTab = (tab: AdminTab, options: { replace?: boolean; closeSidebar?: boolean } = {}) => {
    if (tab === activeTabRef.current && !options.replace) {
      if (options.closeSidebar && window.innerWidth < 1024) setSidebarOpen(false);
      return;
    }
    activeTabRef.current = tab;
    setActiveTabState(tab);
    sessionStorage.setItem("highgrade-admin-tab", tab);
    updateAdminTabUrl(tab, options.replace ? "replace" : "push");
    if (!options.replace) {
      const stack = adminTabStackRef.current;
      if (stack[stack.length - 1] !== tab) adminTabStackRef.current = [...stack, tab].slice(-25);
    }
    if (options.closeSidebar && window.innerWidth < 1024) setSidebarOpen(false);
  };

  const setActiveTab = (tab: AdminTab) => navigateAdminTab(tab);

  const ecommerceOrders = orders.filter(isEcommerceOrder);
  const ecommerceRevenue = ecommerceOrders.reduce((sum, order) => sum + order.amount, 0);
  const totalRevenue = ecommerceRevenue;
  const pendingOrders = Number(dashboardStats.pendingOrders ?? orders.filter((order) => order.status === "Pending").length);
  const lowStock = Number(dashboardStats.lowStock ?? products.filter((product) => product.stock <= 5).length);
  const newEnquiries = Number(dashboardStats.newEnquiries ?? enquiries.filter((item) => item.status === "New").length);
  const selectedProduct = products.find((item) => String(item.id) === billingForm.productId);
  const reportFromDate = revenuePreset === "today" ? today() : revenuePreset === "thisWeek" ? currentWeekStart() : currentYearStart();
  const reportToDate = today();
  const revenuePeriod: RevenuePeriod = revenuePreset === "thisYear" ? "monthly" : "daily";
  const revenuePresetLabel = revenuePreset === "today" ? "Today" : revenuePreset === "thisWeek" ? "This week" : "This year";
  const dashboardCards: Array<{ label: string; value: ReactNode; icon: ReactNode; tab: AdminTab }> = [
    { label: "Revenue", value: money(totalRevenue), icon: <BarChart3 size={22} />, tab: "reports" },
    { label: "Orders", value: Number(dashboardStats.totalOrders ?? listPages.orders.total ?? orders.length), icon: <ShoppingCart size={22} />, tab: "orders" },
    { label: "Pending", value: pendingOrders, icon: <ClipboardList size={22} />, tab: "orders" },
    { label: "Low Stock", value: lowStock, icon: <Boxes size={22} />, tab: "products" },
    { label: "New Enquiries", value: newEnquiries, icon: <MessageSquareText size={22} />, tab: "enquiries" },
  ];
  const revenueByCategory = Object.values(ecommerceOrders.reduce<Record<string, { category: string; orders: number; revenue: number }>>((acc, order) => {
    const category = order.category || "General";
    acc[category] = acc[category] || { category, orders: 0, revenue: 0 };
    acc[category].orders += 1;
    acc[category].revenue += order.amount;
    return acc;
  }, {})).sort((a, b) => b.revenue - a.revenue);
  const maxCategoryRevenue = Math.max(...revenueByCategory.map((item) => item.revenue), 1);
  const revenueRangeOrders = ecommerceOrders.filter((order) => {
    const date = order.date || today();
    return (!reportFromDate || date >= reportFromDate) && (!reportToDate || date <= reportToDate);
  });
  const revenueTrendBuckets = revenueBucketRange(reportFromDate, reportToDate, revenuePeriod);
  const revenueTrendMap = revenueTrendBuckets.reduce<Record<string, { label: string; orders: number; revenue: number }>>((acc, label) => {
    acc[label] = { label, orders: 0, revenue: 0 };
    return acc;
  }, {});
  revenueRangeOrders.forEach((order) => {
    const label = revenueBucket(order.date, revenuePeriod);
    revenueTrendMap[label] = revenueTrendMap[label] || { label, orders: 0, revenue: 0 };
    revenueTrendMap[label].orders += 1;
    revenueTrendMap[label].revenue += order.amount;
  });
  const revenueTrend = Object.values(revenueTrendMap).sort((a, b) => a.label.localeCompare(b.label));
  const rangeRevenue = revenueRangeOrders.reduce((sum, order) => sum + order.amount, 0);
  const trendChartData = revenueTrend.length ? revenueTrend : [{ label: "No revenue", orders: 0, revenue: 0 }];
  const maxTrendRevenue = Math.max(...trendChartData.map((item) => item.revenue), 1);
  const trendPoints = trendChartData.map((item, index) => {
    const x = trendChartData.length === 1 ? 60 : 10 + (index / (trendChartData.length - 1)) * 102;
    const y = 66 - (item.revenue / maxTrendRevenue) * 52;
    return { ...item, x, y: Number.isFinite(y) ? y : 66 };
  });
  const trendLine = trendPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const trendArea = trendPoints.length > 1 ? `M ${trendLine} L ${trendPoints[trendPoints.length - 1].x},66 L ${trendPoints[0].x},66 Z` : "";
  const trendTicks = [1, 0.75, 0.5, 0.25, 0].map((factor) => ({ value: Math.round(maxTrendRevenue * factor), y: 66 - factor * 52 }));
  const reportRows = [
    ["Ecom product revenue", money(totalRevenue), `${ecommerceOrders.length} product orders`, "Sales"],
    ["Average product order", money(ecommerceOrders.length ? totalRevenue / ecommerceOrders.length : 0), "Per ecommerce checkout", "Sales"],
    ["Pending orders", String(pendingOrders), "Needs fulfilment", "Operations"],
    ["Low stock products", String(lowStock), "Stock <= 5", "Inventory"],
    ["New enquiries", String(newEnquiries), "Not contacted yet", "Leads"],
    ["Active users", String(Number(dashboardStats.activeClients ?? members.filter((user) => user.active).length)), `${Number(dashboardStats.totalClients ?? listPages.users.total ?? members.length)} total users`, "Clients"],
    ["Gallery items", String(Number(listPages.gallery.total ?? gallery.length)), "Visible website media", "Gallery"],
    ["Published blogs", String(blogs.filter((blog) => blog.status === "Published").length), `${Number(listPages.blogs.total ?? blogs.length)} total posts`, "Content"],
  ];
  const notifications: AdminNotification[] = [
    ...orders.slice(0, 8).map((order) => ({
      id: `order-${order.dbId}`,
      title: `New order ${order.id}`,
      message: `${order.customer} ordered ${order.product} for ${money(order.amount)}.`,
      date: order.date,
      sortAt: order.createdAt,
      tab: "orders" as AdminTab,
      tone: order.status === "Pending" ? "amber" : "green",
    })),
    ...enquiries.filter((item) => item.status === "New").slice(0, 6).map((item) => ({
      id: `enquiry-${item.id}`,
      title: `New enquiry from ${item.name}`,
      message: `${item.program} enquiry from ${item.phone}.`,
      date: item.createdAt.slice(0, 10),
      sortAt: item.createdAt,
      tab: "enquiries" as AdminTab,
      tone: "red" as const,
    })),
    ...products.filter((product) => product.stock <= 5).slice(0, 6).map((product) => ({
      id: `stock-${product.id}`,
      title: `Low stock: ${product.name}`,
      message: `${product.stock} units remaining in ${product.category}.`,
      date: today(),
      sortAt: today(),
      tab: "products" as AdminTab,
      tone: "amber" as const,
    })),
    ...authEvents.slice(0, 12).map((item) => ({
      id: `auth-${item.id}`,
      title: item.eventType === "register" ? `New registration: ${item.name || item.email}` : `${({
        login: "User login",
        otp_request: "OTP requested",
        otp_login: "OTP login",
        password_reset_request: "Password reset OTP",
        password_reset: "Password reset",
        profile_update: "Profile updated",
        wishlist_update: "Wishlist updated",
        register: "New registration",
      } as Record<AuthEvent["eventType"], string>)[item.eventType]}: ${item.name || item.email}`,
      message: `${item.email}${item.phone ? `, ${item.phone}` : ""} via ${item.method || "website"}.`,
      date: item.createdAt.slice(0, 10),
      sortAt: item.createdAt,
      tab: "notifications" as AdminTab,
      tone: item.eventType === "register" ? "green" as const : "neutral" as const,
    })),
  ].sort((a, b) => sortTime(b.sortAt) - sortTime(a.sortAt));
  const unreadNotifications = notifications.filter((item) => !readNotifications.includes(item.id));

  const tabs: Array<{ id: AdminTab; label: string; icon: ReactNode }> = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={19} /> },
    { id: "products", label: "Products", icon: <Package size={19} /> },
    { id: "billing", label: "Billing", icon: <CreditCard size={19} /> },
    { id: "coupons", label: "Coupons", icon: <TicketPercent size={19} /> },
    { id: "orders", label: "Orders", icon: <ShoppingCart size={19} /> },
    { id: "enquiries", label: "Enquiries", icon: <ClipboardList size={19} /> },
    { id: "users", label: "Users", icon: <Users size={19} /> },
    { id: "testimonials", label: "Reviews", icon: <Star size={19} /> },
    { id: "gallery", label: "Gallery", icon: <Camera size={19} /> },
    { id: "content", label: "Blog", icon: <BookOpen size={19} /> },
    { id: "certificates", label: "Certificates", icon: <Award size={19} /> },
    { id: "certificateTemplates", label: "Certificate Templates", icon: <FileText size={19} /> },
    { id: "reports", label: "Reports", icon: <BarChart3 size={19} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={19} /> },
  ];

  const showMessage = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  };
  const setPageMeta = (key: ListKey, total = 0, page = 1, totalPages = 1) => {
    setListPages((current) => ({
      ...current,
      [key]: { ...current[key], total: Number(total || 0), page: Number(page || 1), totalPages: Math.max(Number(totalPages || 1), 1) },
    }));
  };
  const updateListPage = (key: ListKey, patch: Partial<PageState>) => {
    setListPages((current) => ({
      ...current,
      [key]: { ...current[key], ...patch, page: patch.limit && patch.limit !== current[key].limit ? 1 : patch.page ?? current[key].page },
    }));
  };
  const resetListPages = () => {
    setListPages((current) => Object.fromEntries(
      (Object.entries(current) as Array<[ListKey, PageState]>).map(([key, value]) => [key, { ...value, page: 1 }]),
    ) as Record<ListKey, PageState>);
  };
  const tablePagination = (key: ListKey): TablePagination => ({
    page: listPages[key].page,
    pageSize: listPages[key].limit,
    total: listPages[key].total,
    totalPages: listPages[key].totalPages,
    onPageChange: (page) => updateListPage(key, { page }),
    onPageSizeChange: (limit) => updateListPage(key, { limit }),
  });
  const markNotificationRead = (id: string) => {
    setReadNotifications((current) => {
      const next = Array.from(new Set([...current, id]));
      localStorage.setItem("highgrade_read_notifications", JSON.stringify(next));
      return next;
    });
  };
  const markAllNotificationsRead = () => {
    const next = notifications.map((item) => item.id);
    localStorage.setItem("highgrade_read_notifications", JSON.stringify(next));
    setReadNotifications(next);
  };
  const openNotificationPanel = () => {
    setNotificationClosing(false);
    setNotificationOpen(true);
  };
  const closeNotificationPanel = () => {
    setNotificationClosing(true);
    window.setTimeout(() => {
      setNotificationOpen(false);
      setNotificationClosing(false);
    }, 260);
  };
  const openNotificationTarget = (item: AdminNotification) => {
    markNotificationRead(item.id);
    setActiveTab(item.tab);
    closeNotificationPanel();
  };

  const fetchListPage = async (key: ListKey, page = listPages[key].page, limit = listPages[key].limit, search = query) => {
    const searchParam = clean(search) ? `&search=${encodeURIComponent(clean(search))}` : "";
    const paths: Record<ListKey, string> = {
      products: `/products/admin/all?page=${page}&limit=${limit}${searchParam}`,
      orders: `/admin/orders?page=${page}&limit=${limit}${searchParam}`,
      enquiries: `/admin/enquiries?page=${page}&limit=${limit}${searchParam}`,
      users: `/admin/users?page=${page}&limit=${limit}${searchParam}`,
      testimonials: `/admin/testimonials?page=${page}&limit=${limit}${searchParam}`,
      gallery: `/admin/gallery?page=${page}&limit=${limit}${searchParam}`,
      blogs: `/admin/blogs?page=${page}&limit=${limit}${searchParam}`,
      coupons: `/admin/coupons?page=${page}&limit=${limit}${searchParam}`,
      certificates: `/admin/certificates?page=${page}&limit=${limit}${searchParam}`,
      certificateTemplates: `/admin/certificate-templates?page=${page}&limit=${limit}${searchParam}`,
      authEvents: `/admin/auth-events?page=${page}&limit=${limit}${searchParam}`,
    };
    const data = await apiRequest<any>(paths[key]);
    const total = Number(data.total || 0);
    const currentPage = Number(data.currentPage || data.page || page);
    const totalPages = Number(data.totalPages || Math.ceil(total / limit) || 1);
    setPageMeta(key, total, currentPage, totalPages);

    if (key === "products") setProducts((data.products || []).map(mapProduct));
    if (key === "orders") setOrders((data.orders || []).map(mapOrder));
    if (key === "enquiries") setEnquiries((data.enquiries || []).map(mapEnquiry));
    if (key === "users") setMembers((data.users || []).map(mapMember));
    if (key === "testimonials") setTestimonials((data.testimonials || []).map(mapTestimonial));
    if (key === "gallery") setGallery((data.galleryItems || []).map(mapGalleryItem));
    if (key === "blogs") setBlogs((data.blogs || []).map(mapBlog));
    if (key === "coupons") setCoupons((data.coupons || []).map(mapCoupon));
    if (key === "certificateTemplates") setCertificateTemplates((data.templates || []).map(mapCertificateTemplate));
    if (key === "certificates") {
      const mapped = (data.certificates || []).map(mapCertificate);
      setCertificates(mapped);
      localStorage.setItem("highgrade_certificates_cache", JSON.stringify(mapped));
    }
    if (key === "authEvents") setAuthEvents((data.authEvents || []).map(mapAuthEvent));
  };

  const loadAdminData = async () => {
    setLoading(true);
    setError("");
    try {
      const dashboardData = await apiRequest<any>("/admin/dashboard");
      setDashboardStats(dashboardData.stats || {});
      await Promise.allSettled((Object.keys(listPages) as ListKey[]).map((key) => fetchListPage(key, listPages[key].page, listPages[key].limit, query)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load admin data. Start backend and MySQL.");
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboardStats = async () => {
    const dashboardData = await apiRequest<any>("/admin/dashboard");
    setDashboardStats(dashboardData.stats || {});
  };

  useEffect(() => {
    if (adminToken) loadAdminData();
  }, [adminToken]);

  useEffect(() => {
    if (!adminToken) return;
    const keyByTab: Partial<Record<AdminTab, ListKey>> = {
      products: "products",
      orders: "orders",
      enquiries: "enquiries",
      users: "users",
      testimonials: "testimonials",
      gallery: "gallery",
      content: "blogs",
      coupons: "coupons",
      certificates: "certificates",
      certificateTemplates: "certificateTemplates",
      notifications: "authEvents",
    };
    const key = keyByTab[activeTab];
    if (!key) return;
    setLoading(true);
    fetchListPage(key)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load table data."))
      .finally(() => setLoading(false));
  }, [
    adminToken,
    activeTab,
    query,
    listPages.products.page,
    listPages.products.limit,
    listPages.orders.page,
    listPages.orders.limit,
    listPages.enquiries.page,
    listPages.enquiries.limit,
    listPages.users.page,
    listPages.users.limit,
    listPages.testimonials.page,
    listPages.testimonials.limit,
    listPages.gallery.page,
    listPages.gallery.limit,
    listPages.blogs.page,
    listPages.blogs.limit,
    listPages.coupons.page,
    listPages.coupons.limit,
    listPages.certificates.page,
    listPages.certificates.limit,
    listPages.certificateTemplates.page,
    listPages.certificateTemplates.limit,
    listPages.authEvents.page,
    listPages.authEvents.limit,
  ]);

  useEffect(() => {
    document.documentElement.classList.add("admin-scrollbars-hidden");
    return () => document.documentElement.classList.remove("admin-scrollbars-hidden");
  }, []);

  useEffect(() => {
    const syncPlans = () => {
      setMembershipPlans(getStoredMembershipPlans());
      setMembershipPlansVisible(getMembershipPlansVisible());
    };
    window.addEventListener(membershipPlansChangedEvent, syncPlans);
    window.addEventListener("storage", syncPlans);
    return () => {
      window.removeEventListener(membershipPlansChangedEvent, syncPlans);
      window.removeEventListener("storage", syncPlans);
    };
  }, []);

  useEffect(() => {
    activeTabRef.current = activeTab;
    sessionStorage.setItem("highgrade-admin-tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    updateAdminTabUrl(activeTabRef.current, "replace");
    const handlePopState = () => {
      const tabFromUrl = new URLSearchParams(window.location.search).get("tab");
      const nextTab = isAdminTab(tabFromUrl) ? tabFromUrl : "dashboard";
      activeTabRef.current = nextTab;
      setActiveTabState(nextTab);
      sessionStorage.setItem("highgrade-admin-tab", nextTab);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const loginAdmin = async () => {
    if (clean(loginForm.username).length < 2) {
      setError("Enter admin username or email.");
      return;
    }
    if (clean(loginForm.password).length < 6) {
      setError("Admin password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest<any>("/admin/login", { method: "POST", body: JSON.stringify(loginForm) });
      localStorage.setItem(tokenKey, data.token);
      setAdminToken(data.token);
      showMessage("Admin login successful.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const logoutAdmin = () => {
    localStorage.removeItem(tokenKey);
    setAdminToken("");
  };

  const goBack = () => {
    const stack = adminTabStackRef.current;
    if (stack.length > 1) {
      stack.pop();
      const previousTab = stack[stack.length - 1] || "dashboard";
      navigateAdminTab(previousTab, { replace: true });
      return;
    }
    if (activeTabRef.current !== "dashboard") {
      navigateAdminTab("dashboard", { replace: true });
      return;
    }
    setSidebarOpen(true);
  };

  const toggleTheme = () => {
    setDark((current) => {
      const next = !current;
      document.documentElement.classList.toggle("theme-dark", next);
      localStorage.setItem("high-grade-theme", next ? "dark" : "light");
      return next;
    });
  };

  const validateProductForm = () => {
    const errors: FormErrors = {};
    if (clean(productForm.name).length < 2) errors.name = "Product name must be at least 2 characters.";
    else if (!maxLength(productForm.name, 120)) errors.name = "Product name must be 120 characters or less.";
    if (!clean(productForm.category)) errors.category = "Product category is required.";
    if (!maxLength(productForm.brand, 80)) errors.brand = "Brand must be 80 characters or less.";
    if (!maxLength(productForm.badge, 60)) errors.badge = "Deal badge must be 60 characters or less.";
    if (!isPositiveNumber(productForm.price)) errors.price = "Product price must be greater than 0.";
    if (!isNonNegativeNumber(productForm.comparePrice)) errors.comparePrice = "Compare price cannot be negative.";
    else if (Number(productForm.comparePrice) > 0 && Number(productForm.comparePrice) < Number(productForm.price)) errors.comparePrice = "MRP must be greater than selling price.";
    if (!isNonNegativeNumber(productForm.stock)) errors.stock = "Stock cannot be negative.";
    if (!isRating(productForm.rating)) errors.rating = "Rating must be between 1 and 5.";
    if (!isUrl(productForm.image)) errors.image = "Product image must be a valid URL or upload.";
    if (!maxLength(productForm.description, 1200)) errors.description = "Product features must be 1200 characters or less.";
    return errors;
  };

  const validateBillingForm = () => {
    const errors: FormErrors = {};
    const phone = phoneDigits(billingForm.customerPhone);
    if (!selectedProduct) errors.productId = "Select a product before billing.";
    if (!isName(billingForm.customerName)) errors.customerName = "Enter a valid customer name.";
    if (!isPhone(phone)) errors.customerPhone = "Enter a valid 10 digit customer phone number.";
    if (!isEmail(billingForm.customerEmail)) errors.customerEmail = "Enter a valid customer email or leave it empty.";
    if (billingForm.deliveryMode === "Delivery" && clean(billingForm.deliveryAddress).length < 8) errors.deliveryAddress = "Enter a complete delivery address.";
    else if (!maxLength(billingForm.deliveryAddress, 300)) errors.deliveryAddress = "Delivery address must be 300 characters or less.";
    if (!maxLength(billingForm.notes, 500)) errors.notes = "Admin notes must be 500 characters or less.";
    return errors;
  };

  const validateUserForm = () => {
    const errors: FormErrors = {};
    const phone = phoneDigits(userForm.phone);
    if (!isName(userForm.name)) errors.name = "Enter a valid client name.";
    if (!clean(userForm.email) || !isEmail(userForm.email)) errors.email = "Enter a valid client email.";
    if (phone && !isPhone(phone)) errors.phone = "Enter a valid 10 digit client phone number.";
    if (clean(userForm.password).length < 6) errors.password = "Password must be at least 6 characters.";
    else if (!maxLength(userForm.password, 72)) errors.password = "Password must be 72 characters or less.";
    if (!maxLength(userForm.plan, 80)) errors.plan = "Plan must be 80 characters or less.";
    if (!maxLength(userForm.goal, 120)) errors.goal = "Goal must be 120 characters or less.";
    if (!maxLength(userForm.address, 300)) errors.address = "Address must be 300 characters or less.";
    return errors;
  };

  const validateTestimonialForm = () => {
    const errors: FormErrors = {};
    if (!isName(testimonialForm.name)) errors.name = "Enter a valid reviewer name.";
    if (!maxLength(testimonialForm.role, 120)) errors.role = "Role / result must be 120 characters or less.";
    if (!isRating(testimonialForm.rating)) errors.rating = "Review rating must be between 1 and 5.";
    if (clean(testimonialForm.text).length < 12) errors.text = "Review must be at least 12 characters.";
    else if (!maxLength(testimonialForm.text, 1200)) errors.text = "Review must be 1200 characters or less.";
    if (!isUrl(testimonialForm.imageUrl)) errors.imageUrl = "Image URL must be valid when provided.";
    if (!maxLength(testimonialForm.authorMeta, 120)) errors.authorMeta = "Author meta must be 120 characters or less.";
    if (!maxLength(testimonialForm.reviewDate, 40)) errors.reviewDate = "Review date must be 40 characters or less.";
    return errors;
  };

  const validateGalleryForm = () => {
    const errors: FormErrors = {};
    if (clean(galleryForm.title).length < 2) errors.title = "Gallery title must be at least 2 characters.";
    else if (!maxLength(galleryForm.title, 120)) errors.title = "Gallery title must be 120 characters or less.";
    if (!maxLength(galleryForm.category, 80)) errors.category = "Category must be 80 characters or less.";
    if (!galleryForm.imageUrl) errors.imageUrl = "Please upload a gallery image.";
    else if (!isUrl(galleryForm.imageUrl)) errors.imageUrl = "Gallery image upload is invalid.";
    if (!isUrl(galleryForm.videoUrl)) errors.videoUrl = "Video URL must be valid or empty.";
    if (!maxLength(galleryForm.description, 500)) errors.description = "Description must be 500 characters or less.";
    if (!isNonNegativeNumber(galleryForm.sortOrder)) errors.sortOrder = "Sort order cannot be negative.";
    return errors;
  };

  const validateBlogForm = () => {
    const errors: FormErrors = {};
    if (clean(blogForm.title).length < 3) errors.title = "Blog title must be at least 3 characters.";
    else if (!maxLength(blogForm.title, 160)) errors.title = "Blog title must be 160 characters or less.";
    if (!maxLength(blogForm.slug, 180)) errors.slug = "Blog slug must be 180 characters or less.";
    if (clean(blogForm.category).length < 2) errors.category = "Blog category is required.";
    else if (!maxLength(blogForm.category, 80)) errors.category = "Blog category must be 80 characters or less.";
    if (clean(blogForm.excerpt).length < 20) errors.excerpt = "Blog excerpt must be at least 20 characters.";
    else if (!maxLength(blogForm.excerpt, 300)) errors.excerpt = "Blog excerpt must be 300 characters or less.";
    if (!maxLength(blogForm.body, 10000)) errors.body = "Blog content must be 10000 characters or less.";
    if (!isUrl(blogForm.imageUrl)) errors.imageUrl = "Cover image URL must be valid when provided.";
    return errors;
  };

  const validatePlanForm = () => {
    const errors: FormErrors = {};
    if (clean(planForm.name).length < 2) errors.name = "Plan name must be at least 2 characters.";
    else if (!maxLength(planForm.name, 80)) errors.name = "Plan name must be 80 characters or less.";
    if (clean(planForm.note).length < 4) errors.note = "Plan note is required.";
    else if (!maxLength(planForm.note, 160)) errors.note = "Plan note must be 160 characters or less.";
    if (!isUrl(planForm.image)) errors.image = "Plan image must be a valid URL.";
    const features = planForm.featuresText.split("\n").map(clean).filter(Boolean);
    if (features.length === 0) errors.featuresText = "Add at least one plan feature.";
    else if (features.some((feature) => feature.length > 120)) errors.featuresText = "Each feature must be 120 characters or less.";
    return errors;
  };

  const validateCouponForm = () => {
    const errors: FormErrors = {};
    const code = clean(couponForm.code).toUpperCase();
    if (!/^[A-Z0-9_-]{3,40}$/.test(code)) errors.code = "Use 3-40 letters, numbers, dash or underscore.";
    if (clean(couponForm.title).length < 2) errors.title = "Coupon title is required.";
    if (!isPositiveNumber(couponForm.discountValue)) errors.discountValue = "Discount value must be greater than 0.";
    else if (couponForm.discountType === "percentage" && Number(couponForm.discountValue) > 100) errors.discountValue = "Percentage cannot exceed 100.";
    if (!isNonNegativeNumber(couponForm.minOrderAmount)) errors.minOrderAmount = "Minimum order cannot be negative.";
    if (!isNonNegativeNumber(couponForm.maxDiscount)) errors.maxDiscount = "Max discount cannot be negative.";
    if (!isNonNegativeNumber(couponForm.usageLimit)) errors.usageLimit = "Usage limit cannot be negative.";
    if (!isNonNegativeNumber(couponForm.perUserLimit)) errors.perUserLimit = "Per user limit cannot be negative.";
    if (couponForm.validFrom && couponForm.validTo && new Date(couponForm.validFrom) > new Date(couponForm.validTo)) errors.validTo = "End date must be after start date.";
    return errors;
  };

  const validateCertificateForm = () => {
    const errors: FormErrors = {};
    if (!isName(certificateForm.studentName)) errors.studentName = "Enter the student full name.";
    if (clean(certificateForm.studentId).length < 4) errors.studentId = "Student ID is required.";
    if (clean(certificateForm.certificateNo).length < 4) errors.certificateNo = "Certificate number is required.";
    if (clean(certificateForm.courseName).length < 3) errors.courseName = "Course name is required.";
    if (clean(certificateForm.courseLevel).length < 3) errors.courseLevel = "Course level is required.";
    if (!maxLength(certificateForm.batchName, 120)) errors.batchName = "Batch name must be 120 characters or less.";
    if (!maxLength(certificateForm.duration, 80)) errors.duration = "Duration must be 80 characters or less.";
    if (!isName(certificateForm.instructorName)) errors.instructorName = "Enter the instructor name.";
    if (!isName(certificateForm.directorName)) errors.directorName = "Enter the director name.";
    if (certificateForm.studentPhoto && !isUploadImage(certificateForm.studentPhoto)) errors.studentPhoto = "Student photo upload is invalid.";
    if (certificateForm.signatureUrl && !isUploadImage(certificateForm.signatureUrl)) errors.signatureUrl = "Signature upload is invalid.";
    if (!maxLength(certificateForm.notes, 1000)) errors.notes = "Notes must be 1000 characters or less.";
    return errors;
  };

  const validateCertificateTemplateForm = () => {
    const errors: FormErrors = {};
    if (clean(certificateTemplateForm.name).length < 3) errors.name = "Template name is required.";
    if (certificateTemplateForm.backgroundImage && !isUploadImage(certificateTemplateForm.backgroundImage)) errors.backgroundImage = "Background upload is invalid.";
    if (certificateTemplateForm.logoImage && !isUploadImage(certificateTemplateForm.logoImage)) errors.logoImage = "Logo upload is invalid.";
    if (certificateTemplateForm.signatureImage && !isUploadImage(certificateTemplateForm.signatureImage)) errors.signatureImage = "Signature upload is invalid.";
    if (!maxLength(certificateTemplateForm.nameFont, 120)) errors.nameFont = "Font family must be 120 characters or less.";
    if (!/^#[0-9a-fA-F]{6}$/.test(certificateTemplateForm.accentColor)) errors.accentColor = "Use a valid hex color.";
    if (!/^#[0-9a-fA-F]{6}$/.test(certificateTemplateForm.navyColor)) errors.navyColor = "Use a valid hex color.";
    if (!/^#[0-9a-fA-F]{6}$/.test(certificateTemplateForm.goldColor)) errors.goldColor = "Use a valid hex color.";
    return errors;
  };

  const certificateVerifyUrl = (certificate: Pick<CertificateData, "verificationToken" | "certificateNo">) => {
    const token = certificate.verificationToken || certificate.certificateNo;
    return `${window.location.origin}/highgradeacademy/verify/${encodeURIComponent(token || "")}`;
  };

  const saveProduct = async () => {
    const formErrors = validateProductForm();
    setProductErrors(formErrors);
    const firstError = firstFormError(formErrors);
    if (firstError) return setError(firstError);
    setLoading(true);
    setError("");
    try {
      const body = {
        ...productForm,
        name: clean(productForm.name),
        category: clean(productForm.category),
        brand: clean(productForm.brand),
        badge: clean(productForm.badge),
        comparePrice: Number(productForm.comparePrice || 0),
        image: productForm.image,
        images: productForm.image ? [productForm.image] : [],
        isActive: productForm.isActive,
        isFeatured: productForm.isFeatured,
        inStock: productForm.inStock,
        features: productForm.description ? productForm.description.split("\n").filter(Boolean) : [],
      };
      const savedProduct = await (editingProductId
        ? apiRequest<any>(`/products/${editingProductId}`, { method: "PUT", body: JSON.stringify(body) })
        : apiRequest<any>("/products", { method: "POST", body: JSON.stringify(body) }));
      const mappedProduct = mapProduct(savedProduct.product || savedProduct);
      setProducts((current) => {
        if (editingProductId) return current.map((item) => item.id === mappedProduct.id ? mappedProduct : item);
        return [mappedProduct, ...current].slice(0, listPages.products.limit);
      });
      await fetchListPage("products", editingProductId ? listPages.products.page : 1, listPages.products.limit, query);
      setEditingProductId(null);
      setProductForm(blankProduct);
      setProductErrors({});
      setProductModalOpen(false);
      showMessage(editingProductId ? "Product updated." : "Product created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Product save failed.");
    } finally {
      setLoading(false);
    }
  };

  const editProduct = (product: Product) => {
    setProductForm(product);
    setProductErrors({});
    setEditingProductId(product.id);
    setProductModalOpen(true);
  };

  const openProductModal = () => {
    setProductForm(blankProduct);
    setProductErrors({});
    setEditingProductId(null);
    setProductModalOpen(true);
  };

  const closeProductModal = () => {
    setProductModalOpen(false);
    setEditingProductId(null);
    setProductForm(blankProduct);
    setProductErrors({});
  };

  const deleteProduct = async (product: Product) => {
    setLoading(true);
    setError("");
    try {
      await apiRequest(`/products/${product.id}`, { method: "DELETE" });
      await fetchListPage("products", listPages.products.page, listPages.products.limit, query);
      showMessage("Product deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Product delete failed.");
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = async (product: Product, field: "isActive" | "isFeatured" | "inStock") => {
    const next = { [field]: !product[field] };
    try {
      const data = await apiRequest<any>(`/products/${product.id}/status`, { method: "PATCH", body: JSON.stringify(next) });
      const mapped = mapProduct(data.product || { ...product, ...next });
      setProducts((current) => current.map((item) => item.id === product.id ? mapped : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Product status update failed.");
    }
  };

  const createBill = async () => {
    const formErrors = validateBillingForm();
    setBillingErrors(formErrors);
    const firstError = firstFormError(formErrors);
    if (firstError) return setError(firstError);
    const phone = phoneDigits(billingForm.customerPhone);
    setLoading(true);
    setError("");
    try {
      await apiRequest<any>("/admin/orders", {
        method: "POST",
        body: JSON.stringify({
          ...billingForm,
          customerName: clean(billingForm.customerName),
          customerEmail: clean(billingForm.customerEmail),
          customerPhone: phone,
          deliveryAddress: clean(billingForm.deliveryAddress),
          notes: clean(billingForm.notes),
          productId: selectedProduct.id,
          product: selectedProduct.name,
          category: selectedProduct.category,
          amount: selectedProduct.price,
        }),
      });
      await Promise.allSettled([
        fetchListPage("orders", 1, listPages.orders.limit, query),
        fetchListPage("products", listPages.products.page, listPages.products.limit, query),
        refreshDashboardStats(),
      ]);
      setBillingForm(blankBilling);
      setBillingErrors({});
      showMessage("Bill created and stock updated.");
      setActiveTab("orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Billing failed.");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (order: Order, status: Order["status"], paymentStatus = order.paymentStatus) => {
    setLoading(true);
    setError("");
    try {
      const updated = await apiRequest<any>(`/admin/orders/${order.dbId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, paymentStatus, notes: order.notes }),
      });
      setOrders((current) => current.map((item) => item.dbId === order.dbId ? mapOrder(updated) : item));
      await refreshDashboardStats();
      showMessage("Order updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order update failed.");
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (order: Order) => {
    setLoading(true);
    setError("");
    try {
      await apiRequest(`/admin/orders/${order.dbId}`, { method: "DELETE" });
      await Promise.allSettled([
        fetchListPage("orders", listPages.orders.page, listPages.orders.limit, query),
        refreshDashboardStats(),
      ]);
      showMessage("Order deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order delete failed.");
    } finally {
      setLoading(false);
    }
  };

  const updateEnquiryStatus = async (item: Enquiry, status: Enquiry["status"]) => {
    try {
      const updated = await apiRequest<any>(`/admin/enquiries/${item.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      setEnquiries((current) => current.map((row) => row.id === item.id ? mapEnquiry(updated) : row));
      await refreshDashboardStats();
      showMessage("Enquiry status updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enquiry update failed.");
    }
  };

  const deleteEnquiry = async (item: Enquiry) => {
    try {
      await apiRequest(`/admin/enquiries/${item.id}`, { method: "DELETE" });
      await Promise.allSettled([
        fetchListPage("enquiries", listPages.enquiries.page, listPages.enquiries.limit, query),
        refreshDashboardStats(),
      ]);
      showMessage("Enquiry deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enquiry delete failed.");
    }
  };

  const createUser = async () => {
    const formErrors = validateUserForm();
    setUserErrors(formErrors);
    const firstError = firstFormError(formErrors);
    if (firstError) return setError(firstError);
    const phone = phoneDigits(userForm.phone);
    setLoading(true);
    setError("");
    try {
      await apiRequest<any>("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          ...userForm,
          name: clean(userForm.name),
          email: clean(userForm.email),
          phone,
          goal: clean(userForm.goal),
          address: clean(userForm.address),
        }),
      });
      await fetchListPage("users", 1, listPages.users.limit, query);
      setUserForm(blankUser);
      setUserErrors({});
      setUserModalOpen(false);
      showMessage("Client created and verified.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Client create failed.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = async (member: Member) => {
    try {
      const updated = await apiRequest<any>(`/admin/users/${member.id}/status`, { method: "PATCH", body: JSON.stringify({ isActive: !member.active }) });
      setMembers((current) => current.map((item) => item.id === member.id ? mapMember(updated) : item));
      showMessage("User status updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "User update failed.");
    }
  };

  const deleteUser = async (member: Member) => {
    try {
      await apiRequest(`/admin/users/${member.id}`, { method: "DELETE" });
      await fetchListPage("users", listPages.users.page, listPages.users.limit, query);
      showMessage("User deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "User delete failed.");
    }
  };

  const openUserModal = () => {
    setUserForm(blankUser);
    setUserErrors({});
    setUserModalOpen(true);
  };

  const closeUserModal = () => {
    setUserModalOpen(false);
    setUserForm(blankUser);
    setUserErrors({});
  };

  const saveTestimonial = async () => {
    const formErrors = validateTestimonialForm();
    setTestimonialErrors(formErrors);
    const firstError = firstFormError(formErrors);
    if (firstError) return setError(firstError);
    try {
      await apiRequest<any>(editingTestimonialId ? `/admin/testimonials/${editingTestimonialId}` : "/admin/testimonials", {
        method: editingTestimonialId ? "PUT" : "POST",
        body: JSON.stringify({
          ...testimonialForm,
          name: clean(testimonialForm.name),
          role: clean(testimonialForm.role),
          text: clean(testimonialForm.text),
          imageUrl: clean(testimonialForm.imageUrl),
          source: clean(testimonialForm.source),
          authorMeta: clean(testimonialForm.authorMeta),
          reviewDate: clean(testimonialForm.reviewDate),
        }),
      });
      await fetchListPage("testimonials", editingTestimonialId ? listPages.testimonials.page : 1, listPages.testimonials.limit, query);
      setTestimonialForm(blankTestimonial);
      setTestimonialErrors({});
      setEditingTestimonialId(null);
      setTestimonialModalOpen(false);
      showMessage(editingTestimonialId ? "Review updated." : "Review saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Testimonial save failed.");
    }
  };

  const editTestimonial = (item: Testimonial) => {
    setEditingTestimonialId(item.id);
    setTestimonialErrors({});
    setTestimonialForm({
      name: item.name,
      role: item.role,
      rating: item.rating,
      text: item.text,
      imageUrl: item.imageUrl,
      source: item.source,
      authorMeta: item.authorMeta,
      reviewDate: item.reviewDate,
    });
    setTestimonialModalOpen(true);
  };

  const openTestimonialModal = () => {
    setEditingTestimonialId(null);
    setTestimonialForm(blankTestimonial);
    setTestimonialErrors({});
    setTestimonialModalOpen(true);
  };

  const cancelTestimonialEdit = () => {
    setEditingTestimonialId(null);
    setTestimonialForm(blankTestimonial);
    setTestimonialErrors({});
    setTestimonialModalOpen(false);
  };

  const toggleTestimonial = async (item: Testimonial) => {
    try {
      await apiRequest(`/admin/testimonials/${item.id}/visible`, { method: "PATCH", body: JSON.stringify({ isVisible: !item.visible }) });
      setTestimonials((current) => current.map((row) => row.id === item.id ? { ...row, visible: !row.visible } : row));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Testimonial update failed.");
    }
  };

  const deleteTestimonial = async (item: Testimonial) => {
    try {
      await apiRequest(`/admin/testimonials/${item.id}`, { method: "DELETE" });
      await fetchListPage("testimonials", listPages.testimonials.page, listPages.testimonials.limit, query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Testimonial delete failed.");
    }
  };

  const saveGalleryItem = async () => {
    const bulkImages = !editingGalleryId ? galleryUploadImages.filter(Boolean) : [];
    const formErrors = validateGalleryForm();
    setGalleryErrors(formErrors);
    const firstError = firstFormError(formErrors);
    if (firstError) return setError(firstError);
    try {
      const basePayload = {
        ...galleryForm,
        title: clean(galleryForm.title),
        category: clean(galleryForm.category),
        videoUrl: clean(galleryForm.videoUrl),
        description: clean(galleryForm.description),
        sortOrder: Number(galleryForm.sortOrder || 0),
      };
      if (bulkImages.length > 1) {
        await Promise.all(bulkImages.map((imageUrl, index) => apiRequest<any>("/admin/gallery", {
          method: "POST",
          body: JSON.stringify({
            ...basePayload,
            title: `${basePayload.title} ${index + 1}`,
            imageUrl,
            sortOrder: basePayload.sortOrder + index,
          }),
        })));
      } else {
        await apiRequest<any>(editingGalleryId ? `/admin/gallery/${editingGalleryId}` : "/admin/gallery", {
          method: editingGalleryId ? "PUT" : "POST",
          body: JSON.stringify({
            ...basePayload,
            imageUrl: clean(galleryForm.imageUrl),
          }),
        });
      }
      await fetchListPage("gallery", editingGalleryId ? listPages.gallery.page : 1, listPages.gallery.limit, query);
      setGalleryForm(blankGalleryItem);
      setGalleryErrors({});
      setGalleryUploadImages([]);
      setEditingGalleryId(null);
      setGalleryModalOpen(false);
      showMessage(editingGalleryId ? "Gallery item updated." : bulkImages.length > 1 ? `${bulkImages.length} gallery items added.` : "Gallery item added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gallery save failed.");
    }
  };

  const openGalleryModal = () => {
    setGalleryForm(blankGalleryItem);
    setGalleryErrors({});
    setGalleryUploadImages([]);
    setEditingGalleryId(null);
    setGalleryModalOpen(true);
  };

  const editGalleryItem = (item: GalleryItem) => {
    setGalleryForm({
      title: item.title,
      category: item.category,
      mediaType: item.mediaType,
      imageUrl: item.imageUrl,
      videoUrl: item.videoUrl,
      description: item.description,
      sortOrder: item.sortOrder,
      isVisible: item.visible,
    });
    setGalleryErrors({});
    setGalleryUploadImages([]);
    setEditingGalleryId(item.id);
    setGalleryModalOpen(true);
  };

  const closeGalleryModal = () => {
    setGalleryModalOpen(false);
    setEditingGalleryId(null);
    setGalleryForm(blankGalleryItem);
    setGalleryErrors({});
    setGalleryUploadImages([]);
  };

  const toggleGalleryItem = async (item: GalleryItem) => {
    try {
      const updated = await apiRequest<any>(`/admin/gallery/${item.id}/visible`, { method: "PATCH", body: JSON.stringify({ isVisible: !item.visible }) });
      setGallery((current) => current.map((row) => row.id === item.id ? mapGalleryItem(updated) : row));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gallery visibility update failed.");
    }
  };

  const deleteGalleryItem = async (item: GalleryItem) => {
    try {
      await apiRequest(`/admin/gallery/${item.id}`, { method: "DELETE" });
      await fetchListPage("gallery", listPages.gallery.page, listPages.gallery.limit, query);
      showMessage("Gallery item deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gallery delete failed.");
    }
  };

  const saveBlog = async () => {
    const formErrors = validateBlogForm();
    setBlogErrors(formErrors);
    const firstError = firstFormError(formErrors);
    if (firstError) return setError(firstError);
    try {
      await apiRequest<any>(editingBlogId ? `/admin/blogs/${editingBlogId}` : "/admin/blogs", {
        method: editingBlogId ? "PUT" : "POST",
        body: JSON.stringify({
          ...blogForm,
          title: clean(blogForm.title),
          slug: clean(blogForm.slug),
          category: clean(blogForm.category),
          excerpt: clean(blogForm.excerpt),
          body: clean(blogForm.body),
          imageUrl: clean(blogForm.imageUrl),
        }),
      });
      await fetchListPage("blogs", editingBlogId ? listPages.blogs.page : 1, listPages.blogs.limit, query);
      setBlogForm(blankBlog);
      setBlogErrors({});
      setEditingBlogId(null);
      setBlogModalOpen(false);
      showMessage(editingBlogId ? "Blog post updated." : "Blog post saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Blog save failed.");
    }
  };

  const deleteBlog = async (blog: Blog) => {
    try {
      await apiRequest(`/admin/blogs/${blog.id}`, { method: "DELETE" });
      await fetchListPage("blogs", listPages.blogs.page, listPages.blogs.limit, query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Blog delete failed.");
    }
  };

  const openBlogModal = () => {
    setBlogForm(blankBlog);
    setBlogErrors({});
    setEditingBlogId(null);
    setBlogModalOpen(true);
  };

  const editBlog = (blog: Blog) => {
    setBlogForm({ title: blog.title, slug: blog.slug, category: blog.category, excerpt: blog.excerpt, body: blog.body, imageUrl: blog.imageUrl, status: blog.status, featured: blog.featured });
    setBlogErrors({});
    setEditingBlogId(blog.id);
    setBlogModalOpen(true);
  };

  const closeBlogModal = () => {
    setBlogModalOpen(false);
    setEditingBlogId(null);
    setBlogForm(blankBlog);
    setBlogErrors({});
  };

  const persistPlans = (items: MembershipPlan[], visible = membershipPlansVisible) => {
    setMembershipPlans(items);
    setMembershipPlansVisible(visible);
    saveStoredMembershipPlans(items);
    saveMembershipPlansVisible(visible);
  };

  const toggleMembershipPlansSection = () => {
    const next = !membershipPlansVisible;
    setMembershipPlansVisible(next);
    saveMembershipPlansVisible(next);
    showMessage(next ? "Plan section visible on website." : "Plan section hidden from website.");
  };

  const openPlanModal = () => {
    setPlanForm(blankPlanForm);
    setPlanErrors({});
    setEditingPlanIndex(null);
    setPlanModalOpen(true);
  };

  const editPlan = (plan: MembershipPlan, index: number) => {
    setPlanForm({
      name: plan.name,
      note: plan.note,
      image: plan.image,
      featuresText: plan.features.join("\n"),
      visible: plan.visible !== false,
    });
    setPlanErrors({});
    setEditingPlanIndex(index);
    setPlanModalOpen(true);
  };

  const closePlanModal = () => {
    setPlanModalOpen(false);
    setEditingPlanIndex(null);
    setPlanForm(blankPlanForm);
    setPlanErrors({});
  };

  const savePlan = () => {
    const formErrors = validatePlanForm();
    setPlanErrors(formErrors);
    const firstError = firstFormError(formErrors);
    if (firstError) return setError(firstError);
    const plan: MembershipPlan = {
      name: clean(planForm.name),
      note: clean(planForm.note),
      image: clean(planForm.image),
      features: planForm.featuresText.split("\n").map(clean).filter(Boolean),
      visible: planForm.visible,
    };
    const nextPlans = editingPlanIndex === null
      ? [...membershipPlans, plan]
      : membershipPlans.map((item, index) => index === editingPlanIndex ? plan : item);
    persistPlans(nextPlans);
    closePlanModal();
    showMessage(editingPlanIndex === null ? "Plan added." : "Plan updated.");
  };

  const togglePlan = (index: number) => {
    const nextPlans = membershipPlans.map((plan, planIndex) => planIndex === index ? { ...plan, visible: plan.visible === false } : plan);
    persistPlans(nextPlans);
  };

  const deletePlan = (index: number) => {
    const nextPlans = membershipPlans.filter((_, planIndex) => planIndex !== index);
    persistPlans(nextPlans);
    showMessage("Plan deleted.");
  };

  const resetPlans = () => {
    const defaults = getStoredMembershipPlans().length ? [
      {
        name: "Monthly",
        note: "Flexible starter access",
        image: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=900&q=85",
        features: ["Gym floor access", "Starter workout plan", "Trainer guidance", "Batch access"],
        visible: true,
      },
      {
        name: "Quarterly",
        note: "Best for habit building",
        image: "https://images.unsplash.com/photo-1581009137042-c552e485697a?auto=format&fit=crop&w=900&q=85",
        features: ["Everything in Monthly", "Progress review", "Nutrition support", "Habit coaching"],
        visible: true,
      },
      {
        name: "Half-yearly",
        note: "More savings and consistency",
        image: "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?auto=format&fit=crop&w=900&q=85",
        features: ["Everything in Quarterly", "Personal training discount", "Body composition review", "Priority check-ins"],
        visible: true,
      },
      {
        name: "Annual",
        note: "Best value for committed members",
        image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=85",
        features: ["Everything in Half-yearly", "Priority scheduling", "Transformation tracking", "Exclusive workshops"],
        visible: true,
      },
    ] : [];
    persistPlans(defaults, true);
    showMessage("Plans reset to defaults.");
  };

  const saveCoupon = async () => {
    const formErrors = validateCouponForm();
    setCouponErrors(formErrors);
    const firstError = firstFormError(formErrors);
    if (firstError) return setError(firstError);
    try {
      await apiRequest<any>(editingCouponId ? `/admin/coupons/${editingCouponId}` : "/admin/coupons", {
        method: editingCouponId ? "PUT" : "POST",
        body: JSON.stringify({
          ...couponForm,
          code: clean(couponForm.code).toUpperCase(),
          title: clean(couponForm.title),
          discountValue: Number(couponForm.discountValue || 0),
          minOrderAmount: Number(couponForm.minOrderAmount || 0),
          maxDiscount: Number(couponForm.maxDiscount || 0),
          usageLimit: Number(couponForm.usageLimit || 0),
          perUserLimit: Number(couponForm.perUserLimit || 0),
        }),
      });
      await fetchListPage("coupons", editingCouponId ? listPages.coupons.page : 1, listPages.coupons.limit, query);
      setCouponForm(blankCoupon);
      setCouponErrors({});
      setEditingCouponId(null);
      setCouponModalOpen(false);
      showMessage(editingCouponId ? "Coupon updated." : "Coupon created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coupon save failed.");
    }
  };

  const openCouponModal = () => {
    setCouponForm(blankCoupon);
    setCouponErrors({});
    setEditingCouponId(null);
    setCouponModalOpen(true);
  };

  const editCoupon = (coupon: Coupon) => {
    setCouponForm({
      code: coupon.code,
      title: coupon.title,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscount: coupon.maxDiscount,
      validFrom: coupon.validFrom,
      validTo: coupon.validTo,
      usageLimit: coupon.usageLimit,
      perUserLimit: coupon.perUserLimit,
      isActive: coupon.isActive,
    });
    setCouponErrors({});
    setEditingCouponId(coupon.id);
    setCouponModalOpen(true);
  };

  const closeCouponModal = () => {
    setCouponModalOpen(false);
    setEditingCouponId(null);
    setCouponForm(blankCoupon);
    setCouponErrors({});
  };

  const toggleCoupon = async (coupon: Coupon) => {
    try {
      const updated = await apiRequest<any>(`/admin/coupons/${coupon.id}/active`, { method: "PATCH", body: JSON.stringify({ isActive: !coupon.isActive }) });
      setCoupons((current) => current.map((item) => item.id === coupon.id ? mapCoupon(updated) : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coupon status update failed.");
    }
  };

  const deleteCoupon = async (coupon: Coupon) => {
    try {
      await apiRequest(`/admin/coupons/${coupon.id}`, { method: "DELETE" });
      await fetchListPage("coupons", listPages.coupons.page, listPages.coupons.limit, query);
      showMessage("Coupon deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coupon delete failed.");
    }
  };

  const openCertificateTemplateModal = () => {
    setCertificateTemplateForm({
      ...blankCertificateTemplate,
      name: "Highgrade Academy Classic",
    });
    setCertificateTemplateErrors({});
    setEditingCertificateTemplateId(null);
    setCertificateTemplateModalOpen(true);
  };

  const editCertificateTemplate = (template: CertificateTemplate) => {
    setCertificateTemplateForm({ ...defaultCertificateTemplate, ...template });
    setCertificateTemplateErrors({});
    setEditingCertificateTemplateId(template.id);
    setCertificateTemplateModalOpen(true);
  };

  const closeCertificateTemplateModal = () => {
    setCertificateTemplateModalOpen(false);
    setEditingCertificateTemplateId(null);
    setCertificateTemplateForm(blankCertificateTemplate);
    setCertificateTemplateErrors({});
  };

  const saveCertificateTemplate = async () => {
    const formErrors = validateCertificateTemplateForm();
    setCertificateTemplateErrors(formErrors);
    const firstError = firstFormError(formErrors);
    if (firstError) return setError(firstError);
    setLoading(true);
    setError("");
    try {
      await apiRequest<any>(editingCertificateTemplateId ? `/admin/certificate-templates/${editingCertificateTemplateId}` : "/admin/certificate-templates", {
        method: editingCertificateTemplateId ? "PUT" : "POST",
        body: JSON.stringify({ ...certificateTemplateForm, name: clean(certificateTemplateForm.name) }),
      });
      await fetchListPage("certificateTemplates", editingCertificateTemplateId ? listPages.certificateTemplates.page : 1, listPages.certificateTemplates.limit, query);
      closeCertificateTemplateModal();
      showMessage(editingCertificateTemplateId ? "Certificate template updated." : "Certificate template created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Certificate template save failed.");
    } finally {
      setLoading(false);
    }
  };

  const deleteCertificateTemplate = async (template: CertificateTemplate) => {
    try {
      await apiRequest(`/admin/certificate-templates/${template.id}`, { method: "DELETE" });
      await fetchListPage("certificateTemplates", listPages.certificateTemplates.page, listPages.certificateTemplates.limit, query);
      showMessage("Certificate template deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Certificate template delete failed.");
    }
  };

  const getCertificateTemplate = (templateId?: number | "") =>
    certificateTemplates.find((template) => template.id === Number(templateId)) ||
    certificateTemplates.find((template) => template.isDefault && template.status === "Active") ||
    certificateTemplates.find((template) => template.status === "Active") ||
    defaultCertificateTemplate;

  const openCertificateModal = async () => {
    setEditingCertificateId(null);
    setCertificateErrors({});
    const templateId = getCertificateTemplate().id || "";
    try {
      const next = await apiRequest<{ certificateNo: string; studentId: string }>("/admin/certificates/next");
      setCertificateForm({ ...blankCertificate, templateId, certificateNo: next.certificateNo, studentId: next.studentId });
    } catch {
      setCertificateForm({ ...blankCertificate, templateId, certificateNo: `HGFA-L1-${String(certificates.length + 1).padStart(6, "0")}`, studentId: `HGFA-STU-${String(certificates.length + 1).padStart(4, "0")}` });
    }
    setCertificateModalOpen(true);
  };

  const editCertificate = (certificate: Certificate) => {
    setEditingCertificateId(certificate.id);
    setCertificateErrors({});
    setCertificateForm({
      ...defaultCertificateData,
      ...certificate,
      notes: certificate.notes || "",
    });
    setCertificateModalOpen(true);
  };

  const closeCertificateModal = () => {
    setCertificateModalOpen(false);
    setEditingCertificateId(null);
    setCertificateForm(blankCertificate);
    setCertificateErrors({});
  };

  const saveCertificate = async () => {
    const formErrors = validateCertificateForm();
    setCertificateErrors(formErrors);
    const firstError = firstFormError(formErrors);
    if (firstError) return setError(firstError);
    setLoading(true);
    setError("");
    try {
      const studentPhoto = await uploadAdminImageIfNeeded(certificateForm.studentPhoto, "certificates");
      const signatureUrl = await uploadAdminImageIfNeeded(certificateForm.signatureUrl, "certificates");
      const saved = await apiRequest<any>(editingCertificateId ? `/admin/certificates/${editingCertificateId}` : "/admin/certificates", {
        method: editingCertificateId ? "PUT" : "POST",
        body: JSON.stringify({
          ...certificateForm,
          studentName: clean(certificateForm.studentName),
          studentId: clean(certificateForm.studentId),
          certificateNo: clean(certificateForm.certificateNo),
          courseName: clean(certificateForm.courseName),
          courseLevel: clean(certificateForm.courseLevel),
          batchName: clean(certificateForm.batchName),
          duration: clean(certificateForm.duration),
          instructorName: clean(certificateForm.instructorName),
          directorName: clean(certificateForm.directorName),
          studentPhoto,
          signatureUrl,
          notes: clean(certificateForm.notes),
        }),
      });
      const mapped = mapCertificate(saved.certificate || saved);
      setCertificates((current) => editingCertificateId ? current.map((item) => item.id === mapped.id ? mapped : item) : [mapped, ...current]);
      await fetchListPage("certificates", editingCertificateId ? listPages.certificates.page : 1, listPages.certificates.limit, query);
      closeCertificateModal();
      setPreviewCertificate(mapped);
      showMessage(editingCertificateId ? "Certificate updated." : "Certificate issued.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Certificate save failed.");
    } finally {
      setLoading(false);
    }
  };

  const updateCertificateStatus = async (certificate: Certificate, status: CertificateStatus) => {
    try {
      const updated = await apiRequest<any>(`/admin/certificates/${certificate.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      setCertificates((current) => current.map((item) => item.id === certificate.id ? mapCertificate(updated.certificate || updated) : item));
      showMessage(`Certificate marked ${status}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Certificate status update failed.");
    }
  };

  const duplicateCertificate = async (certificate: Certificate) => {
    try {
      await apiRequest<any>(`/admin/certificates/${certificate.id}/duplicate`, { method: "POST" });
      await fetchListPage("certificates", 1, listPages.certificates.limit, query);
      showMessage("Certificate duplicated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Certificate duplicate failed.");
    }
  };

  const deleteCertificate = async (certificate: Certificate) => {
    try {
      await apiRequest(`/admin/certificates/${certificate.id}`, { method: "DELETE" });
      await fetchListPage("certificates", listPages.certificates.page, listPages.certificates.limit, query);
      showMessage("Certificate deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Certificate delete failed.");
    }
  };

  const copyCertificateLink = async (certificate: Certificate) => {
    const link = certificateVerifyUrl(certificate);
    try {
      await navigator.clipboard.writeText(link);
      showMessage("Verification link copied.");
    } catch {
      setError(link);
    }
  };

  const printInvoice = (order: Order) => {
    const escapeHtml = (value: string | number | undefined | null) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    const formatDate = (value?: string) => {
      const date = value ? new Date(value) : new Date();
      return Number.isNaN(date.getTime()) ? today() : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    };
    const rawItems = order.product
      .split(/\s*,\s*|\s+\+\s+|\n/g)
      .map((item) => item.trim())
      .filter(Boolean);
    const parsedItems = (rawItems.length ? rawItems : [order.product]).map((item) => {
      const match = item.match(/^(.*?)(?:\s+x\s*|\s+Ãƒâ€”\s*)(\d+)$/i);
      return { name: match ? match[1].trim() : item, qty: match ? Number(match[2]) : 1 };
    });
    const totalQty = parsedItems.reduce((sum, item) => sum + item.qty, 0) || 1;
    const unitPrice = order.amount / totalQty;
    const logoUrl = `${window.location.origin}${logoSm.startsWith("/") ? logoSm : `/${logoSm}`}`;
    const invoiceDate = formatDate(order.createdAt || order.date);
    const dueDate = formatDate(order.createdAt || order.date);
    const invoiceNo = order.invoiceNumber || order.id;
    const itemRows = parsedItems.map((item, index) => {
      const lineTotal = unitPrice * item.qty;
      return `
        <tr>
          <td>${index + 1}</td>
          <td>
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(order.category || "Highgrade product")}</span>
          </td>
          <td>${escapeHtml(item.qty)}</td>
          <td>${escapeHtml(money(unitPrice))}</td>
          <td>0</td>
          <td>${escapeHtml(money(lineTotal))}</td>
        </tr>`;
    }).join("");
    const html = `
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(invoiceNo)} Invoice</title>
          <style>
            @page { size: A4; margin: 14mm; }
            * { box-sizing: border-box; }
            body { margin: 0; background: #eef2f7; color: #D4AF37; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.45; }
            .invoice { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; padding: 18mm; }
            .top { display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: start; }
            .brand { display: flex; align-items: center; gap: 14px; }
            .brand-bag { display: grid; height: 76px; width: 76px; place-items: center; border-radius: 22px; background: linear-gradient(135deg, #fff1f2, #ffffff); border: 1px solid #fecdd3; }
            .brand-bag img { max-height: 54px; max-width: 54px; object-fit: contain; }
            .brand h1 { margin: 0; color: #e11d2e; font-size: 20px; letter-spacing: .02em; }
            .brand p { margin: 4px 0 0; color: #64748b; }
            .invoice-title { text-align: right; }
            .invoice-title h2 { margin: 0; font-size: 32px; letter-spacing: -.03em; }
            .invoice-title dl { display: grid; grid-template-columns: auto auto; gap: 4px 14px; margin: 14px 0 0; color: #64748b; }
            .invoice-title dd { margin: 0; color: #D4AF37; font-weight: 700; }
            .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 34px; }
            .party h3, .summary h3, .notes h3 { margin: 0 0 10px; color: #e11d2e; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; }
            .party strong { display: block; font-size: 16px; }
            .party p { margin: 4px 0; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            tr { page-break-inside: avoid; break-inside: avoid; }
            th { background: #e11d2e; color: #fff; font-size: 10px; letter-spacing: .14em; padding: 10px 8px; text-align: left; text-transform: uppercase; }
            th:first-child { border-radius: 12px 0 0 12px; }
            th:last-child { border-radius: 0 12px 12px 0; text-align: right; }
            td { border-bottom: 1px solid #e5e7eb; padding: 13px 8px; vertical-align: top; }
            td:nth-child(1), td:nth-child(3), td:nth-child(5) { color: #64748b; }
            td:nth-child(4), td:nth-child(6) { text-align: right; white-space: nowrap; }
            td span { display: block; margin-top: 3px; color: #64748b; font-size: 11px; }
            .bottom { display: grid; grid-template-columns: 1fr 280px; gap: 34px; margin-top: 28px; page-break-inside: avoid; break-inside: avoid; }
            .notes { color: #475569; }
            .notes p { margin: 0 0 8px; }
            .summary { border-radius: 20px; background: #f8fafc; padding: 18px; }
            .summary-row { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0; color: #475569; }
            .summary-total { margin-top: 8px; border-top: 1px solid #cbd5e1; padding-top: 12px; color: #D4AF37; font-size: 16px; font-weight: 700; }
            .summary-total strong { font-size: 16px; font-weight: 700; }
            .balance { color: #e11d2e; font-size: 10px; }
            .balance strong { font-size: 10px; font-weight: 600; }
            .signature { margin-top: 36px; text-align: right; color: #64748b; page-break-inside: avoid; break-inside: avoid; }
            .signature-line { display: inline-block; min-width: 180px; border-top: 1px solid #94a3b8; padding-top: 8px; }
            .footer { margin-top: 36px; border-top: 1px solid #e5e7eb; padding-top: 12px; color: #64748b; text-align: center; }
            @media print {
              body { background: #fff; }
              .invoice { width: auto; min-height: auto; margin: 0; padding: 0; }
              .no-print { display: none !important; }
            }
            @media screen and (max-width: 760px) {
              .invoice { width: 100%; min-height: auto; padding: 20px; }
              .top, .parties, .bottom { grid-template-columns: 1fr; }
              .invoice-title { text-align: left; }
            }
          </style>
        </head>
        <body>
          <main class="invoice">
            <section class="top">
              <div class="brand">
                <div class="brand-bag"><img src="${logoUrl}" alt="Highgrade" /></div>
                <div>
                  <h1>Highgrade Fitness</h1>
                  <p>Fitness Studio | Supplements | Academy</p>
                  <p>Nagercoil, Tamil Nadu</p>
                </div>
              </div>
              <div class="invoice-title">
                <h2>Invoice</h2>
                <dl>
                  <dt>Invoice no.</dt><dd>${escapeHtml(invoiceNo)}</dd>
                  <dt>Order no.</dt><dd>${escapeHtml(order.id)}</dd>
                  <dt>Invoice date</dt><dd>${escapeHtml(invoiceDate)}</dd>
                  <dt>Due date</dt><dd>${escapeHtml(dueDate)}</dd>
                </dl>
              </div>
            </section>

            <section class="parties">
              <div class="party">
                <h3>From</h3>
                <strong>Highgrade Fitness</strong>
                <p>Highgrade Sports & Supplements</p>
                <p>Nagercoil, Tamil Nadu</p>
                <p>+91 86681 69830 / +91 98943 29507</p>
              </div>
              <div class="party">
                <h3>Bill To</h3>
                <strong>${escapeHtml(order.customer || "Customer")}</strong>
                <p>${escapeHtml(order.email || "-")}</p>
                <p>${escapeHtml(order.phone || "-")}</p>
                <p>${escapeHtml(order.deliveryAddress || (order.deliveryMode === "Pickup" ? "Store pickup" : "-"))}</p>
              </div>
            </section>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Disc</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <section class="bottom">
              <div class="notes">
                <h3>Payment Instruction</h3>
                <p>Payment method: ${escapeHtml(order.paymentMethod || "-")}</p>
                <p>Payment status: ${escapeHtml(order.paymentStatus)}</p>
                <p>For support, contact Highgrade admin with invoice number ${escapeHtml(invoiceNo)}.</p>
                <h3 style="margin-top:22px">Notes</h3>
                <p>${escapeHtml(order.notes || "Thank you for choosing Highgrade.")}</p>
              </div>
              <div class="summary">
                <h3>Summary</h3>
                <div class="summary-row"><span>Subtotal</span><strong>${escapeHtml(money(order.amount))}</strong></div>
                <div class="summary-row"><span>Discount</span><strong>${escapeHtml(money(0))}</strong></div>
                <div class="summary-row"><span>Delivery</span><strong>${escapeHtml(money(0))}</strong></div>
                <div class="summary-row summary-total"><span>Total</span><strong>${escapeHtml(money(order.amount))}</strong></div>
                <div class="summary-row balance"><span>Balance Due</span><strong>${escapeHtml(order.paymentStatus === "Paid" ? money(0) : money(order.amount))}</strong></div>
              </div>
            </section>

            <section class="signature">
              <span class="signature-line">Authorized signature</span>
            </section>
            <section class="footer">
              This is a computer generated invoice from Highgrade Control.
            </section>
          </main>
          <script>
            window.addEventListener("load", function () {
              setTimeout(function () { window.print(); }, 250);
            });
          </script>
        </body>
      </html>`;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const filteredProducts = products;
  const filteredOrders = orders;
  const filteredUsers = members;
  const filteredEnquiries = enquiries;

  if (!adminToken) {
    return (
      <div className="admin-shell grid min-h-screen place-items-center p-4">
        <AdminToast loading={loading} error={error} notice={notice} />
        <AdminCard className="w-full max-w-md">
          <div className="mb-8 text-center">
            <img src={dark ? logoDark : logo} alt="Highgrade" className="mx-auto h-20 w-auto object-contain" />
            <p className="mt-5 text-xs uppercase tracking-[0.24em] text-amber-600">Admin Control</p>
            <h1 className="mt-2 text-3xl font-semibold">Highgrade Login</h1>
            <p className="mt-2 text-sm text-slate-500">Manage products, orders, billing, enquiries, users and website content.</p>
          </div>
          <div className="space-y-3">
            <Field minLength={2} placeholder="Admin name or email" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} />
            <Field minLength={6} placeholder="Password" type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} onKeyDown={(e) => e.key === "Enter" && loginAdmin()} />
            <button disabled={loading} onClick={loginAdmin} className="w-full rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white disabled:opacity-60">
              {loading ? "Signing in..." : "Login to Admin Panel"}
            </button>
          </div>
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="admin-shell min-h-screen">
      <AdminToast loading={loading} error={error} notice={notice} />
      {sidebarOpen && <button aria-label="Close sidebar overlay" className="fixed inset-0 z-30 bg-amber-800/45 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`admin-sidebar fixed inset-y-0 left-0 z-40 flex flex-col border-r transition-all ${sidebarOpen ? "admin-sidebar-open w-64 translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-16"}`}>
        <div className="admin-sidebar-brand relative flex h-16 items-center justify-center border-b px-4 sm:h-[72px]">
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="admin-icon-button absolute right-3 top-3 rounded-xl p-2 lg:hidden" aria-label="Close sidebar">
              <X size={18} />
            </button>
          )}
          {sidebarOpen ? (
            <>
              <img src={logo} alt="Highgrade" className="theme-logo-light max-h-12 w-full object-contain sm:max-h-14" />
              <img src={logoDark} alt="Highgrade" className="theme-logo-dark max-h-12 w-full object-contain sm:max-h-14" />
            </>
          ) : (
            <img src={logoSm} alt="Highgrade" className="mx-auto h-9 w-9 object-contain" />
          )}
          {/* {sidebarOpen && (
            <div className="mt-3 min-w-0">
              <p className="truncate text-base font-semibold leading-tight">Highgrade Admin</p>
              <p className="mt-1 text-sm text-amber-600">Control panel</p>
            </div>
          )} */}
        </div>
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
       
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => navigateAdminTab(tab.id, { closeSidebar: true })} className={`admin-nav-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${activeTab === tab.id ? "is-active" : ""}`}>
              {tab.icon}{sidebarOpen && <span className="flex-1">{tab.label}</span>}{activeTab === tab.id && sidebarOpen && <ChevronRight size={16} />}
            </button>
          ))}
             <button onClick={() => { window.location.href = "/"; }} className="admin-nav-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition">
            <Globe size={19} />{sidebarOpen && <span className="flex-1">Website</span>}
          </button>
        </nav>
        <div className="border-t p-3"><button onClick={logoutAdmin} className="admin-nav-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm"><Power size={18} />{sidebarOpen && "Logout"}</button></div>
      </aside>

      <div className={`min-w-0 transition-all ${sidebarOpen ? "lg:pl-64" : "lg:pl-16"}`}>
        <header className={`admin-topbar fixed left-0 right-0 top-0 z-30 flex h-16 items-center overflow-hidden border-b px-2.5 backdrop-blur-xl transition-all sm:h-[72px] sm:px-4 ${sidebarOpen ? "lg:left-64" : "lg:left-16"}`}>
          <div className="flex w-full min-w-0 flex-nowrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button onClick={() => setSidebarOpen((value) => !value)} className="admin-icon-button shrink-0 rounded-xl p-2"><Menu size={18} /></button>
              <button onClick={goBack} className="admin-icon-button inline-flex shrink-0 rounded-xl p-2" aria-label="Go back to previous page" title="Back"><ArrowLeft size={18} /></button>
              <div className="min-w-0"><h1 className="truncate text-base font-semibold sm:text-xl">Highgrade Control</h1><p className="hidden truncate text-xs text-slate-500 sm:block sm:text-sm">Products, billing, orders, users, enquiries and content.</p></div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button onClick={loadAdminData} className="admin-icon-button rounded-full p-2"><RefreshCcw size={16} /></button>
              <button onClick={toggleTheme} className="admin-icon-button inline-flex items-center gap-1.5 rounded-full p-2 text-sm sm:px-3 sm:py-2">{dark ? <Sun size={15} /> : <Moon size={15} />}<span className="hidden sm:inline">{dark ? "Light" : "Dark"}</span></button>
              <button onClick={openNotificationPanel} className="admin-icon-button relative rounded-full p-2">
                <Bell size={16} />
                {unreadNotifications.length > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-amber-600 px-1 text-[10px] font-semibold text-white">{unreadNotifications.length}</span>}
              </button>
            </div>
          </div>
        </header>

        <main className="min-w-0 overflow-hidden px-3 pb-3 pt-20 sm:px-4 sm:pb-4 sm:pt-[88px]">
          <div className="mb-4 flex flex-nowrap items-center justify-between gap-2 sm:gap-3">
            <label className="admin-search flex min-w-0 flex-1 items-center gap-2 rounded-xl border px-3 py-2.5 sm:gap-3">
              <Search size={18} className="text-amber-600" />
              <input
                value={query}
                onChange={(event) => {
                  resetListPages();
                  setQuery(event.target.value);
                }}
                placeholder="Search admin data..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </label>
            {/* <button onClick={() => window.print()} className="shrink-0 rounded-full bg-amber-600 px-3 py-2.5 text-sm font-medium text-white sm:px-4"><Download className="inline h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Export / Print</span></button> */}
          </div>

          {certificateModalOpen ? (
            <CertificateFormPage form={certificateForm} errors={certificateErrors} templates={certificateTemplates} editing={Boolean(editingCertificateId)} onChange={setCertificateForm} onClose={closeCertificateModal} onSave={saveCertificate} />
          ) : certificateTemplateModalOpen ? (
            <CertificateTemplateEditorPage form={certificateTemplateForm} errors={certificateTemplateErrors} editing={Boolean(editingCertificateTemplateId)} onChange={setCertificateTemplateForm} onClose={closeCertificateTemplateModal} onSave={saveCertificateTemplate} />
          ) : previewCertificate ? (
            <CertificatePreviewPage certificate={previewCertificate} template={getCertificateTemplate(previewCertificate.templateId)} verifyUrl={certificateVerifyUrl(previewCertificate)} onClose={() => setPreviewCertificate(null)} onEdit={() => { editCertificate(previewCertificate); setPreviewCertificate(null); }} />
          ) : (
          <>
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-5">
                {dashboardCards.map(({ label, value, icon, tab }) => (
                  <AdminCard
                    key={label}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveTab(tab)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setActiveTab(tab);
                      }
                    }}
                    className="admin-dashboard-card cursor-pointer transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-white sm:mb-3 sm:h-10 sm:w-10">{icon}</div>
                    <p className="text-xl font-semibold sm:text-2xl">{value}</p>
                    <p className="mt-1 text-sm text-slate-500">{label}</p>
                  </AdminCard>
                ))}
              </div>
            <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
                <AdminCard><h2 className="mb-4 text-xl font-semibold">Recent Orders</h2><OrderTable rows={orders.slice(0, 6)} onView={setSelectedOrder} onPrint={printInvoice} onDelete={deleteOrder} onStatus={updateOrderStatus} /></AdminCard>
                <AdminCard><h2 className="mb-4 text-xl font-semibold">Enquiry Verification</h2><EnquiryList items={enquiries.slice(0, 6)} onView={setSelectedEnquiry} onStatus={updateEnquiryStatus} onDelete={deleteEnquiry} /></AdminCard>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className="min-w-0">
              <AdminCard>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">Product Inventory</h2>
                    <p className="mt-1 text-sm text-slate-500">Manage stock, deal badges, pricing, product photos and visibility.</p>
                  </div>
                  <button onClick={openProductModal} className="rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white shadow-sm">
                    <Plus className="mr-2 inline h-4 w-4" /> Add Product
                  </button>
                </div>
                <DataTable
                  heads={["Image", "Name", "Category", "Price", "Stock", "Deal", "Status", "Actions"]}
                  pagination={tablePagination("products")}
                  rows={filteredProducts.map((product) => ({
                    onClick: () => editProduct(product),
                    cells: [
                      product.image ? <img key={product.id} src={product.image} alt={product.name} className="h-12 rounded-xl object-contain" /> : <Image key={product.id} size={20} />,
                      <div key={product.id}><p className="font-medium">{product.name}</p><p className="text-xs text-slate-500">{product.brand}</p></div>,
                      product.category,
                      <div key={product.id}><p>{money(product.price)}</p>{product.comparePrice > product.price && <p className="text-xs text-green-600">{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}% off</p>}</div>,
                      <span key={product.id} className={product.stock <= 5 ? "text-amber-600" : ""}>{product.stock}</span>,
                      product.isFeatured || product.badge ? <DealBadge key={product.id} label={product.badge || "Best Deal"} /> : "-",
                      <div key={product.id} className="flex flex-col gap-1"><button onClick={() => toggleProduct(product, "isActive")}><StatusPill tone={product.isActive ? "green" : "red"}>{product.isActive ? "Active" : "Draft"}</StatusPill></button><button onClick={() => toggleProduct(product, "inStock")} className="text-xs text-slate-500">{product.inStock ? "In stock" : "Out"}</button></div>,
                      <div key={product.id} className="flex gap-2"><button onClick={() => editProduct(product)} className="text-amber-600"><Edit3 size={16} /></button><button onClick={() => deleteProduct(product)} className="text-amber-600"><Trash2 size={16} /></button></div>,
                    ],
                  }))}
                />
              </AdminCard>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="grid min-w-0 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
              <AdminCard>
                <h2 className="mb-4 text-xl font-semibold">Create Bill / Order</h2>
                <div className="grid gap-3">
                  <Field error={billingErrors.customerName} minLength={2} maxLength={80} pattern="[A-Za-z][A-Za-z .'-]{1,79}" placeholder="Customer name" value={billingForm.customerName} onChange={(e) => setBillingForm({ ...billingForm, customerName: e.target.value })} />
                  <div className="grid grid-cols-2 gap-3"><Field error={billingErrors.customerEmail} placeholder="Email" type="email" maxLength={120} value={billingForm.customerEmail} onChange={(e) => setBillingForm({ ...billingForm, customerEmail: e.target.value })} /><Field error={billingErrors.customerPhone} type="tel" inputMode="numeric" minLength={10} maxLength={10} pattern="[6-9][0-9]{9}" placeholder="Phone" value={billingForm.customerPhone} onChange={(e) => setBillingForm({ ...billingForm, customerPhone: limitPhoneDigits(e.target.value) })} /></div>
                  <Select error={billingErrors.productId} value={billingForm.productId} onChange={(e) => setBillingForm({ ...billingForm, productId: e.target.value })}><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} - {money(product.price)} ({product.stock} stock)</option>)}</Select>
                  <div className="grid grid-cols-2 gap-3"><Select value={billingForm.paymentMethod} onChange={(e) => setBillingForm({ ...billingForm, paymentMethod: e.target.value })}>{["UPI", "Cash", "Card", "NetBanking", "Wallet", "Manual"].map((item) => <option key={item}>{item}</option>)}</Select><Select value={billingForm.paymentStatus} onChange={(e) => setBillingForm({ ...billingForm, paymentStatus: e.target.value })}>{["Paid", "Pending", "Failed", "Refunded"].map((item) => <option key={item}>{item}</option>)}</Select></div>
                  <div className="grid grid-cols-2 gap-3"><button onClick={() => setBillingForm({ ...billingForm, deliveryMode: "Pickup" })} className={`rounded-full border px-4 py-3 text-sm ${billingForm.deliveryMode === "Pickup" ? "bg-amber-600 text-white" : ""}`}>Pickup</button><button onClick={() => setBillingForm({ ...billingForm, deliveryMode: "Delivery" })} className={`rounded-full border px-4 py-3 text-sm ${billingForm.deliveryMode === "Delivery" ? "bg-amber-600 text-white" : ""}`}>Delivery</button></div>
                  <Field error={billingErrors.deliveryAddress} placeholder="Delivery address / pickup note" minLength={billingForm.deliveryMode === "Delivery" ? 8 : undefined} maxLength={300} value={billingForm.deliveryAddress} onChange={(e) => setBillingForm({ ...billingForm, deliveryAddress: e.target.value })} />
                  <TextArea error={billingErrors.notes} placeholder="Admin notes" maxLength={500} value={billingForm.notes} onChange={(e) => setBillingForm({ ...billingForm, notes: e.target.value })} />
                  <button onClick={createBill} className="rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white"><CreditCard className="mr-2 inline h-4 w-4" />Create Bill</button>
                </div>
              </AdminCard>
              <AdminCard>
                <h2 className="mb-4 text-xl font-semibold">Billing Preview</h2>
                {selectedProduct ? (
                  <div className="space-y-4">
                    {selectedProduct.image && <img src={selectedProduct.image} alt={selectedProduct.name} className="h-56 w-full rounded-3xl object-contain" />}
                    <div className="flex justify-between border-b pb-3"><span>Product</span><strong>{selectedProduct.name}</strong></div>
                    <div className="flex justify-between border-b pb-3"><span>Stock after bill</span><strong>{Math.max(selectedProduct.stock - 1, 0)}</strong></div>
                    <div className="flex justify-between text-2xl font-semibold text-amber-600"><span>Total</span><span>{money(selectedProduct.price)}</span></div>
                  </div>
                ) : <p className="text-slate-500">Select a product to preview billing and stock impact.</p>}
              </AdminCard>
            </div>
          )}

          {activeTab === "coupons" && (
            <AdminCard>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Coupon Manager</h2>
                  <p className="mt-1 text-sm text-slate-500">Create checkout coupons with validity dates, discount rules and usage limits.</p>
                </div>
                <button onClick={openCouponModal} className="rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white">
                  <TicketPercent className="mr-2 inline h-4 w-4" /> Add Coupon
                </button>
              </div>
              <DataTable
                heads={["Code", "Discount", "Validity", "Usage", "Status", "Actions"]}
                pagination={tablePagination("coupons")}
                rows={coupons.map((coupon) => ({
                  onClick: () => editCoupon(coupon),
                  cells: [
                    <div key={coupon.id}><p className="font-semibold">{coupon.code}</p><p className="text-xs text-slate-500">{coupon.title}</p></div>,
                    coupon.discountType === "percentage" ? `${coupon.discountValue}%${coupon.maxDiscount ? ` up to ${money(coupon.maxDiscount)}` : ""}` : money(coupon.discountValue),
                    <div key={coupon.id} className="text-sm"><p>{coupon.validFrom ? coupon.validFrom.replace("T", " ") : "Now"}</p><p className="text-slate-500">to {coupon.validTo ? coupon.validTo.replace("T", " ") : "No expiry"}</p></div>,
                    `${coupon.usageCount}${coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}${coupon.perUserLimit ? `, ${coupon.perUserLimit}/user` : ""}`,
                    <button key={coupon.id} onClick={() => toggleCoupon(coupon)}><StatusPill tone={coupon.isActive ? "green" : "red"}>{coupon.isActive ? "Active" : "Inactive"}</StatusPill></button>,
                    <div key={coupon.id} className="flex gap-2"><button onClick={() => editCoupon(coupon)} className="text-amber-600"><Edit3 size={16} /></button><button onClick={() => deleteCoupon(coupon)} className="text-amber-600"><Trash2 size={16} /></button></div>,
                  ],
                }))}
              />
            </AdminCard>
          )}

          {activeTab === "orders" && (
            <AdminCard>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Orders and Invoices</h2>
                  <p className="mt-1 text-sm text-slate-500">Create, verify, print and update customer orders.</p>
                </div>
                <button onClick={() => setActiveTab("billing")} className="rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white">
                  <Plus className="mr-2 inline h-4 w-4" /> Add Order
                </button>
              </div>
              <OrderTable rows={filteredOrders} pagination={tablePagination("orders")} onView={setSelectedOrder} onPrint={printInvoice} onDelete={deleteOrder} onStatus={updateOrderStatus} />
            </AdminCard>
          )}
          {activeTab === "enquiries" && <AdminCard><h2 className="mb-4 text-xl font-semibold">Enquiry Form Verification</h2><EnquiryList items={filteredEnquiries} pagination={tablePagination("enquiries")} onView={setSelectedEnquiry} onStatus={updateEnquiryStatus} onDelete={deleteEnquiry} /></AdminCard>}

          {activeTab === "users" && (
            <AdminCard>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">User Management</h2>
                  <p className="mt-1 text-sm text-slate-500">Create verified clients and manage member access.</p>
                </div>
                <button onClick={openUserModal} className="rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white">
                  <UserPlus className="mr-2 inline h-4 w-4" /> Add User
                </button>
              </div>
              <DataTable heads={["Name", "Contact", "Plan", "Orders", "Status", "Actions"]} pagination={tablePagination("users")} rows={filteredUsers.map((member) => ({ onClick: () => setSelectedUser(member), cells: [<button key={member.id} onClick={() => setSelectedUser(member)} className="text-left font-medium">{member.name}</button>, <div key={member.id}><p>{member.email}</p><p className="text-xs text-slate-500">{member.phone}</p></div>, member.plan, `${member.orderCount} / ${money(member.totalSpent)}`, <button key={member.id} onClick={() => toggleMember(member)}><StatusPill tone={member.active ? "green" : "red"}>{member.active ? "Active" : "Inactive"}</StatusPill></button>, <div key={member.id} className="flex gap-2"><button onClick={() => setSelectedUser(member)} className="text-amber-600"><Eye size={16} /></button><button onClick={() => deleteUser(member)} className="text-amber-600"><Trash2 size={16} /></button></div>] }))} />
            </AdminCard>
          )}

          {activeTab === "testimonials" && (
            <div className="min-w-0">
              <AdminCard>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Reviews</h2>
                    <p className="mt-1 text-sm text-slate-500">Edit imported Google reviews and add website reviews.</p>
                  </div>
                  <button onClick={openTestimonialModal} className="rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white">
                    <Plus className="mr-2 inline h-4 w-4" /> Add Review
                  </button>
                </div>
                <DataTable
                  heads={["Reviewer", "Rating", "Source", "Date", "Review", "Status", "Actions"]}
                  pagination={tablePagination("testimonials")}
                  rows={testimonials.map((item) => ({
                    cells: [
                      <div key={item.id} className="flex items-center gap-3"><img src={item.imageUrl || logoSm} alt={item.name} className="h-10 w-10 rounded-full object-contain" /><div><p className="font-medium">{item.name}</p><p className="text-xs text-slate-500">{item.authorMeta || item.role || "Highgrade Client"}</p></div></div>,
                      <span key={item.id} className="text-amber-600">{"*".repeat(item.rating)}</span>,
                      item.source,
                      item.reviewDate || "-",
                      <p key={item.id} className="max-w-md truncate text-sm text-slate-500">{item.text}</p>,
                      <button key={item.id} onClick={() => toggleTestimonial(item)}><StatusPill tone={item.visible ? "green" : "red"}>{item.visible ? "Visible" : "Hidden"}</StatusPill></button>,
                      <div key={item.id} className="flex gap-2"><button onClick={() => editTestimonial(item)} className="text-amber-600"><Edit3 size={16} /></button><button onClick={() => toggleTestimonial(item)} className="text-amber-600">{item.visible ? "Hide" : "Show"}</button><button onClick={() => deleteTestimonial(item)} className="text-amber-600"><Trash2 size={16} /></button></div>,
                    ],
                  }))}
                />
              </AdminCard>
            </div>
          )}

          {activeTab === "gallery" && (
            <AdminCard>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Gallery Manager</h2>
                  <p className="mt-1 text-sm text-slate-500">Add, edit, sort and hide website gallery media.</p>
                </div>
                <button onClick={openGalleryModal} className="rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white">
                  <ImagePlus className="mr-2 inline h-4 w-4" /> Add Gallery Item
                </button>
              </div>
              <DataTable
                heads={["Image", "Title", "Category", "Type", "Order", "Status", "Actions"]}
                pagination={tablePagination("gallery")}
                rows={gallery.map((item) => ({
                  onClick: () => editGalleryItem(item),
                  cells: [
                    <img key={item.id} src={item.imageUrl || logoSm} alt={item.title} className="h-14 w-16 rounded-xl object-contain" />,
                    <div key={item.id}><p className="font-medium">{item.title}</p><p className="max-w-xs truncate text-xs text-slate-500">{item.description || "No description"}</p></div>,
                    item.category,
                    item.mediaType,
                    item.sortOrder,
                    <button key={item.id} onClick={() => toggleGalleryItem(item)}><StatusPill tone={item.visible ? "green" : "red"}>{item.visible ? "Visible" : "Hidden"}</StatusPill></button>,
                    <div key={item.id} className="flex gap-2"><button onClick={() => editGalleryItem(item)} className="text-amber-600"><Edit3 size={16} /></button><button onClick={() => deleteGalleryItem(item)} className="text-amber-600"><Trash2 size={16} /></button></div>,
                  ],
                }))}
              />
            </AdminCard>
          )}

          {activeTab === "content" && (
            <div className="space-y-4">
              <AdminCard>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Plan Manager</h2>
                    <p className="mt-1 text-sm text-slate-500">Show, hide, add, edit and remove website membership plans.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={toggleMembershipPlansSection} className={`rounded-full px-5 py-3 text-sm font-medium ${membershipPlansVisible ? "bg-amber-600 text-white" : "border text-amber-600"}`}>
                      {membershipPlansVisible ? "Hide Plan Section" : "Show Plan Section"}
                    </button>
                    <button onClick={resetPlans} className="rounded-full border px-5 py-3 text-sm font-medium text-amber-600">Reset</button>
                    <button onClick={openPlanModal} className="rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white">
                      <Plus className="mr-2 inline h-4 w-4" /> Add Plan
                    </button>
                  </div>
                </div>
                <DataTable
                  heads={["Plan", "Image", "Features", "Status", "Actions"]}
                  rows={membershipPlans.map((plan, index) => ({
                    onClick: () => editPlan(plan, index),
                    cells: [
                      <div key={plan.name}><p className="font-medium">{plan.name}</p><p className="max-w-sm truncate text-xs text-slate-500">{plan.note}</p></div>,
                      <img key={plan.name} src={plan.image || logoSm} alt={plan.name} className="h-14 w-20 rounded-xl object-contain" />,
                      <span key={plan.name} className="text-sm text-slate-500">{plan.features.length} items</span>,
                      <button key={plan.name} onClick={() => togglePlan(index)}><StatusPill tone={plan.visible !== false ? "green" : "red"}>{plan.visible !== false ? "Visible" : "Hidden"}</StatusPill></button>,
                      <div key={plan.name} className="flex gap-2"><button onClick={() => editPlan(plan, index)} className="text-amber-600"><Edit3 size={16} /></button><button onClick={() => togglePlan(index)} className="text-amber-600">{plan.visible !== false ? "Hide" : "Show"}</button><button onClick={() => deletePlan(index)} className="text-amber-600"><Trash2 size={16} /></button></div>,
                    ],
                  }))}
                />
              </AdminCard>

              <AdminCard>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Blog Manager</h2>
                    <p className="mt-1 text-sm text-slate-500">Create, categorize, publish and edit website blog posts.</p>
                  </div>
                  <button onClick={openBlogModal} className="rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white">
                    <FileText className="mr-2 inline h-4 w-4" /> Add Post
                  </button>
                </div>
                <DataTable heads={["Post", "Category", "Status", "Featured", "Date", "Action"]} pagination={tablePagination("blogs")} rows={blogs.map((blog) => ({ onClick: () => editBlog(blog), cells: [<div key={blog.id}><p className="font-medium">{blog.title}</p><p className="text-xs text-slate-500">{blog.slug}</p></div>, blog.category, <StatusPill key={blog.id} tone={blog.status === "Published" ? "green" : "amber"}>{blog.status}</StatusPill>, blog.featured ? "Yes" : "No", blog.createdAt, <div key={blog.id} className="flex gap-2"><button onClick={() => editBlog(blog)} className="text-amber-600"><Edit3 size={16} /></button><button onClick={() => deleteBlog(blog)} className="text-amber-600"><Trash2 size={16} /></button></div>] }))} />
              </AdminCard>
            </div>
          )}

          {activeTab === "certificates" && (
            <AdminCard>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Certificate Manager</h2>
                  <p className="mt-1 text-sm text-slate-500">Issue, edit, verify, print and duplicate Highgrade Fitness Academy certificates.</p>
                </div>
                <button onClick={openCertificateModal} className="rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white">
                  <Award className="mr-2 inline h-4 w-4" /> Issue Certificate
                </button>
              </div>
              <DataTable
                heads={["Student", "Student ID", "Certificate No.", "Course", "Issue Date", "Status", "Actions"]}
                pagination={tablePagination("certificates")}
                rows={certificates.map((certificate) => ({
                  onClick: () => setPreviewCertificate(certificate),
                  cells: [
                    <div key={certificate.id} className="flex items-center gap-3">
                      {certificate.studentPhoto ? <img src={certificate.studentPhoto} alt={certificate.studentName} className="h-11 w-11 rounded-xl object-contain" /> : <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-sm font-semibold text-amber-600">{certificate.studentName.slice(0, 1) || "S"}</div>}
                      <button onClick={() => setPreviewCertificate(certificate)} className="text-left font-medium">{certificate.studentName}</button>
                    </div>,
                    <span key={certificate.id} className="whitespace-nowrap">{certificate.studentId}</span>,
                    <span key={certificate.id} className="whitespace-nowrap font-medium">{certificate.certificateNo}</span>,
                    <div key={certificate.id}><p className="font-medium">{certificate.courseLevel}</p><p className="text-xs text-slate-500">{certificate.batchName || certificate.courseName}</p></div>,
                    <span key={certificate.id} className="whitespace-nowrap">{certificate.issueDate || "-"}</span>,
                    <Select key={certificate.id} value={certificate.status} onChange={(event) => updateCertificateStatus(certificate, event.target.value as CertificateStatus)}>
                      {["Valid", "Revoked", "Expired"].map((status) => <option key={status}>{status}</option>)}
                    </Select>,
                    <div key={certificate.id} className="flex flex-wrap gap-2">
                      <button onClick={() => setPreviewCertificate(certificate)} className="text-amber-600" title="View / print"><Eye size={16} /></button>
                      <button onClick={() => editCertificate(certificate)} className="text-amber-600" title="Edit"><Edit3 size={16} /></button>
                      <button onClick={() => duplicateCertificate(certificate)} className="text-amber-600" title="Duplicate"><Copy size={16} /></button>
                      <button onClick={() => copyCertificateLink(certificate)} className="text-amber-600" title="Copy verification link"><FileText size={16} /></button>
                      <a href={certificateVerifyUrl(certificate)} target="_blank" rel="noreferrer" className="text-amber-600" title="Open verification"><ExternalLink size={16} /></a>
                      <button onClick={() => deleteCertificate(certificate)} className="text-amber-600" title="Delete"><Trash2 size={16} /></button>
                    </div>,
                  ],
                }))}
              />
            </AdminCard>
          )}

          {activeTab === "certificateTemplates" && (
            <AdminCard>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Certificate Templates</h2>
                  <p className="mt-1 text-sm text-slate-500">Create, edit and hide certificate layouts used while issuing academy certificates.</p>
                </div>
                <button onClick={openCertificateTemplateModal} className="rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white">
                  <Plus className="mr-2 inline h-4 w-4" /> Add Template
                </button>
              </div>
              <DataTable
                heads={["Template", "Layout", "QR", "Status", "Actions"]}
                pagination={tablePagination("certificateTemplates")}
                rows={certificateTemplates.map((template) => ({
                  onClick: () => editCertificateTemplate(template),
                  cells: [
                    <div key={template.id} className="min-w-[220px]">
                      <p className="font-medium">{template.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{template.isDefault ? "Default template" : "Custom template"}</p>
                    </div>,
                    <span key={template.id} className="whitespace-nowrap">Name {template.nameTop}% / Course {template.courseTop}%</span>,
                    <span key={template.id}>{template.showQr ? "Visible" : "Hidden"}</span>,
                    <StatusPill key={template.id} tone={template.status === "Active" ? "green" : "red"}>{template.status}</StatusPill>,
                    <div key={template.id} className="flex gap-2">
                      <button onClick={() => editCertificateTemplate(template)} className="text-amber-600"><Edit3 size={16} /></button>
                      <button onClick={() => deleteCertificateTemplate(template)} className="text-amber-600 disabled:opacity-40" disabled={template.isDefault}><Trash2 size={16} /></button>
                    </div>,
                  ],
                }))}
              />
            </AdminCard>
          )}

          {activeTab === "reports" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 min-w-0 gap-3 xl:grid-cols-4">
                {[
                  ["Revenue", money(totalRevenue), <BarChart3 key="revenue" />],
                  ["Orders", String(Number(dashboardStats.totalOrders ?? listPages.orders.total ?? orders.length)), <ShoppingCart key="orders" />],
                  ["Inventory Risk", String(lowStock), <Boxes key="stock" />],
                  ["Lead Queue", String(newEnquiries), <MessageSquareText key="leads" />],
                ].map(([title, text, icon]) => (
                  <AdminCard key={title as string}>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600 text-white">{icon}</div>
                    <h2 className="text-xl font-semibold">{title as string}</h2>
                    <p className="mt-2 text-sm text-slate-500">{text as string}</p>
                  </AdminCard>
                ))}
              </div>
              <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <AdminCard>
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">Ecom Revenue by Category</h2>
                      <p className="mt-1 text-sm text-slate-500">Product sales contribution grouped from ecommerce orders.</p>
                    </div>
                    <StatusPill tone="green">{money(totalRevenue)}</StatusPill>
                  </div>
                  <div className="space-y-4">
                    {(revenueByCategory.length ? revenueByCategory : [{ category: "No sales yet", orders: 0, revenue: 0 }]).map((item) => (
                      <div key={item.category}>
                        <div className="mb-2 flex justify-between gap-3 text-sm">
                          <span className="font-medium">{item.category}</span>
                          <span className="text-slate-500">{item.orders} orders / {money(item.revenue)}</span>
                        </div>
                        <div className="admin-track h-3 overflow-hidden rounded-full">
                          <div className="h-full rounded-full bg-amber-600" style={{ width: `${Math.max((item.revenue / maxCategoryRevenue) * 100, item.revenue ? 8 : 0)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </AdminCard>
                <AdminCard>
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">Ecom Product Revenue</h2>
                      <p className="mt-1 text-sm text-slate-500">Quick product-sales view for daily admin tracking.</p>
                    </div>
                    <StatusPill tone="green">{money(rangeRevenue)}</StatusPill>
                  </div>
                  <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(220px,0.55fr)_1fr] sm:items-end">
                    <Select label="Revenue view" value={revenuePreset} onChange={(event) => setRevenuePreset(event.target.value as RevenuePreset)}>
                        <option value="today">Today</option>
                        <option value="thisWeek">This week</option>
                        <option value="thisYear">This year</option>
                      </Select>
                    <div className="admin-soft-panel rounded-2xl border px-4 py-3 text-sm text-slate-500">
                      <span className="font-semibold">{revenuePresetLabel}</span>
                      <span className="mx-2">/</span>
                      <span>{reportFromDate} to {reportToDate}</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto pb-2">
                    <div className="min-w-[520px] sm:min-w-[620px]">
                      <div className="admin-chart-panel rounded-2xl p-4">
                        <svg viewBox="0 0 120 78" className="h-72 w-full overflow-visible">
                          <defs>
                            <linearGradient id="revenueTrendFill" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="#ef2727" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#ef2727" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          {trendTicks.map((tick) => (
                            <g key={tick.y}>
                              <line className="admin-chart-grid" x1="10" x2="112" y1={tick.y} y2={tick.y} strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
                              <text x="0" y={tick.y + 1.5} className="fill-slate-500 text-[3px]">{money(tick.value).replace("Rs. ", "")}</text>
                            </g>
                          ))}
                          <line className="admin-chart-axis" x1="10" x2="10" y1="14" y2="66" strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
                          <line className="admin-chart-axis" x1="10" x2="112" y1="66" y2="66" strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
                          {trendArea && <path d={trendArea} fill="url(#revenueTrendFill)" />}
                          {trendPoints.length > 1 ? (
                            <polyline className="admin-chart-line" points={trendLine} fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                          ) : (
                            <line className="admin-chart-line" x1="18" x2="106" y1={trendPoints[0].y} y2={trendPoints[0].y} strokeWidth="1.7" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                          )}
                          {trendPoints.map((point) => (
                            <circle className="admin-chart-point" key={`point-${point.label}`} cx={point.x} cy={point.y} r="1.8" strokeWidth="0.85" vectorEffect="non-scaling-stroke" />
                          ))}
                        </svg>
                      </div>
                      <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${trendPoints.length}, minmax(90px, 1fr))` }}>
                        {trendPoints.map((item) => (
                          <div key={item.label} className="min-w-0 text-center">
                            <p className="truncate text-xs font-semibold">{money(item.revenue)}</p>
                            <p className="mt-1 truncate text-xs text-slate-500">{item.label}</p>
                            <p className="mt-1 text-[11px] text-slate-500">{item.orders} orders</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-5 text-xs font-semibold">
                        <span className="inline-flex items-center gap-2"><span className="admin-chart-line-swatch h-0.5 w-7 rounded-full" /> Revenue</span>
                      </div>
                    </div>
                  </div>
                </AdminCard>
              </div>
              <AdminCard>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Standard Report Register</h2>
                    <p className="mt-1 text-sm text-slate-500">Operational reports generated from live admin data.</p>
                  </div>
                  <button onClick={() => window.print()} className="rounded-full bg-amber-600 px-4 py-2.5 text-sm font-medium text-white"><Download className="mr-2 inline h-4 w-4" />Export Report</button>
                </div>
                <DataTable heads={["Report", "Value", "Context", "Department"]} rows={reportRows} />
              </AdminCard>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-4">
              <AdminCard>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Notifications</h2>
                    <p className="mt-1 text-sm text-slate-500">{unreadNotifications.length} unread updates from orders, enquiries, stock and user access.</p>
                  </div>
                  <button onClick={markAllNotificationsRead} className="rounded-full bg-amber-600 px-4 py-2.5 text-sm font-medium text-white">Mark all as read</button>
                </div>
              </AdminCard>
              <div className="grid gap-3">
                {notifications.length === 0 ? (
                  <AdminCard><p className="text-sm text-slate-500">No notifications yet.</p></AdminCard>
                ) : notifications.map((item) => {
                  const read = readNotifications.includes(item.id);
                  return (
                    <AdminCard key={item.id} className={`${read ? "opacity-70" : "border-amber-200"} transition`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <button onClick={() => openNotificationTarget(item)} className="min-w-0 flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${read ? "bg-slate-300" : "bg-amber-600"}`} />
                            <h3 className="font-semibold">{item.title}</h3>
                          </div>
                          <p className="mt-2 text-sm text-slate-500">{item.message}</p>
                          <p className="mt-2 text-xs text-slate-500">{item.date}</p>
                        </button>
                        <button onClick={() => markNotificationRead(item.id)} className="rounded-full border px-3 py-2 text-xs text-amber-600">{read ? "Read" : "Mark read"}</button>
                      </div>
                    </AdminCard>
                  );
                })}
              </div>
              <AdminCard>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">User Access Register</h2>
                  <p className="mt-1 text-sm text-slate-500">Website registrations, password logins, OTP requests and OTP logins with time.</p>
                </div>
                <DataTable
                  heads={["User", "Activity", "Method" ]}
                  pagination={tablePagination("authEvents")}
                  rows={authEvents.map((item) => [
                    <div key={item.id}>
                      <p className="font-medium">{item.name || "Website user"}</p>
                      <p className="text-xs text-slate-500">{item.email}</p>
                      {item.phone && <p className="text-xs text-slate-500">{item.phone}</p>}
                    </div>,
                    <StatusPill key={item.id} tone={item.eventType === "register" ? "green" : item.eventType === "otp_request" ? "amber" : "neutral"}>{item.eventType.replace("_", " ")}</StatusPill>,
                    item.method || "Website",
                    // new Date(item.createdAt).toLocaleString(),
                    // item.ipAddress || "-",
                  ])}
                />
              </AdminCard>
            </div>
          )}
          </>
          )}
        </main>
      </div>

      {notificationOpen && (
        <div className={`fixed inset-0 z-50 bg-amber-800/35 transition-opacity duration-300 ${notificationClosing ? "opacity-0" : "opacity-100"}`} onClick={closeNotificationPanel}>
          <aside className={`admin-notification-panel admin-card ml-auto flex h-full w-full max-w-md flex-col border-l p-0 shadow-2xl ${notificationClosing ? "is-closing" : ""}`} onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 border-b p-4">
              <div>
                <h2 className="text-xl font-semibold">Recent Notifications</h2>
                <p className="mt-1 text-sm text-slate-500">{unreadNotifications.length} unread messages</p>
              </div>
              <button onClick={closeNotificationPanel} className="admin-icon-button rounded-xl p-2"><X size={18} /></button>
            </div>
            <div className="flex items-center justify-between gap-3 border-b p-4">
              <button onClick={() => { setActiveTab("notifications"); closeNotificationPanel(); }} className="text-sm font-medium text-amber-600">Open notification page</button>
              <button onClick={markAllNotificationsRead} className="rounded-full bg-amber-600 px-4 py-2 text-xs font-medium text-white">Mark all as read</button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {notifications.length === 0 ? <p className="text-sm text-slate-500">No recent activity.</p> : notifications.slice(0, 12).map((item) => {
                const read = readNotifications.includes(item.id);
                return (
                  <div key={item.id} className={`admin-soft-panel rounded-2xl border p-4 ${read ? "opacity-70" : "border-amber-200"}`}>
                    <button onClick={() => openNotificationTarget(item)} className="w-full text-left">
                      <div className="flex items-start gap-3">
                        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${read ? "bg-slate-300" : "bg-amber-600"}`} />
                        <div className="min-w-0">
                          <p className="font-semibold">{item.title}</p>
                          <p className="mt-1 text-sm leading-5 text-slate-500">{item.message}</p>
                          <p className="mt-2 text-xs text-slate-500">{item.date}</p>
                        </div>
                      </div>
                    </button>
                    <button onClick={() => markNotificationRead(item.id)} className="mt-3 text-xs font-medium text-amber-600">{read ? "Already read" : "Mark as read"}</button>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      )}

      {selectedOrder && <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onPrint={printInvoice} onDelete={deleteOrder} onStatus={updateOrderStatus} />}
      {selectedUser && <UserModal member={selectedUser} orders={orders.filter((order) => order.email === selectedUser.email || order.phone === selectedUser.phone)} onClose={() => setSelectedUser(null)} />}
      {selectedEnquiry && <EnquiryModal item={selectedEnquiry} onClose={() => setSelectedEnquiry(null)} onStatus={updateEnquiryStatus} />}
      {userModalOpen && <UserFormModal form={userForm} errors={userErrors} onChange={setUserForm} onClose={closeUserModal} onSave={createUser} />}
      {testimonialModalOpen && <TestimonialFormModal form={testimonialForm} errors={testimonialErrors} editing={Boolean(editingTestimonialId)} onChange={setTestimonialForm} onClose={cancelTestimonialEdit} onSave={saveTestimonial} />}
      {galleryModalOpen && <GalleryFormModal form={galleryForm} errors={galleryErrors} uploadImages={galleryUploadImages} editing={Boolean(editingGalleryId)} onChange={setGalleryForm} onUploadImages={setGalleryUploadImages} onClose={closeGalleryModal} onSave={saveGalleryItem} />}
      {blogModalOpen && <BlogFormModal form={blogForm} errors={blogErrors} editing={Boolean(editingBlogId)} onChange={setBlogForm} onClose={closeBlogModal} onSave={saveBlog} />}
      {planModalOpen && <PlanFormModal form={planForm} errors={planErrors} editing={editingPlanIndex !== null} onChange={setPlanForm} onClose={closePlanModal} onSave={savePlan} />}
      {couponModalOpen && <CouponFormModal form={couponForm} errors={couponErrors} editing={Boolean(editingCouponId)} onChange={setCouponForm} onClose={closeCouponModal} onSave={saveCoupon} />}
      {productModalOpen && (
        <ProductModal
          product={productForm}
          errors={productErrors}
          editing={Boolean(editingProductId)}
          onChange={setProductForm}
          onClose={closeProductModal}
          onSave={saveProduct}
        />
      )}
    </div>
  );
}

function DealBadge({ label }: { label: string }) {
  const key = label.toLowerCase();
  const tone = key.includes("best") ? "bg-amber-100 text-amber-700" : key.includes("coach") ? "bg-amber-100 text-amber-700" : key.includes("daily") ? "bg-blue-100 text-blue-700" : key.includes("new") ? "bg-green-100 text-green-700" : key.includes("limited") ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-700";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${tone}`}>{label}</span>;
}

function ProductModal({
  product,
  errors,
  editing,
  onChange,
  onClose,
  onSave,
}: {
  product: Product;
  errors: FormErrors;
  editing: boolean;
  onChange: (product: Product) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const updateProduct = (patch: Partial<Product>) => onChange({ ...product, ...patch });
  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => updateProduct({ image: String(reader.result || "") });
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  return (
    <AdminModalShell
      className="max-w-5xl"
      header={
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-600">Product setup</p>
            <h2 className="mt-1 text-2xl font-semibold">{editing ? "Edit Product" : "Add Product"}</h2>
            <p className="mt-1 text-sm text-slate-500">Upload product image, choose deal badge, add pricing and stock details.</p>
          </div>
          <button onClick={onClose} className="admin-icon-button rounded-xl p-2"><X size={18} /></button>
        </div>
      }
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <button onClick={onClose} className="rounded-full border px-5 py-3 text-sm font-medium">Cancel</button>
          <button onClick={onSave} className="rounded-full bg-amber-600 px-6 py-3 text-sm font-medium text-white">
            <Plus className="mr-2 inline h-4 w-4" /> {editing ? "Update Product" : "Create Product"}
          </button>
        </div>
      }
    >
        <div className="grid gap-5 lg:grid-cols-[0.78fr_1fr]">
          <div className="space-y-4">
            <div className="admin-soft-panel overflow-hidden rounded-3xl border bg-white">
              {product.image ? (
                <img src={product.image} alt={product.name || "Product preview"} className="h-72 w-full object-contain p-4" />
              ) : (
                <div className="flex h-72 flex-col items-center justify-center gap-3 text-slate-500">
                  <ImagePlus className="h-10 w-10 text-amber-600" />
                  <span className="text-sm">Upload or paste product image</span>
                </div>
              )}
            </div>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-amber-200 px-5 py-3 text-sm font-medium text-amber-600 transition hover:bg-amber-50">
              <ImagePlus className="h-4 w-4" /> Upload Image
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
            <Field error={errors.image} label="Image URL" placeholder="Or paste image URL" type="url" value={product.image.startsWith("data:image") ? "" : product.image} onChange={(e) => updateProduct({ image: e.target.value })} />
          </div>

          <div className="grid gap-3">
            <Field error={errors.name} label="Product name" minLength={2} maxLength={120} placeholder="Product name" value={product.name} onChange={(e) => updateProduct({ name: e.target.value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Select error={errors.category} label="Category" value={product.category} onChange={(e) => updateProduct({ category: e.target.value })}>{["Protein", "Creatine", "Recovery", "Performance", "Wellness"].map((item) => <option key={item}>{item}</option>)}</Select>
              <Field error={errors.brand} label="Brand" placeholder="Brand" maxLength={80} value={product.brand} onChange={(e) => updateProduct({ brand: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field error={errors.price} label="Selling price" min={1} step="1" placeholder="Price" type="number" value={product.price || ""} onChange={(e) => updateProduct({ price: Number(e.target.value) })} />
              <Field error={errors.comparePrice} label="MRP / compare price" min={0} step="1" placeholder="MRP / compare price" type="number" value={product.comparePrice || ""} onChange={(e) => updateProduct({ comparePrice: Number(e.target.value) })} />
              <Field error={errors.stock} label="Stock quantity" min={0} step="1" placeholder="Stock" type="number" value={product.stock || ""} onChange={(e) => updateProduct({ stock: Number(e.target.value), inStock: Number(e.target.value) > 0 })} />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Deal badge</p>
              <div className="flex flex-wrap gap-2">
                {badgeOptions.map((badge) => (
                  <button key={badge} type="button" onClick={() => updateProduct({ badge, isFeatured: badge.toLowerCase().includes("best") || product.isFeatured })} className={`rounded-full border px-3 py-2 text-xs transition ${product.badge === badge ? "border-amber-600 bg-amber-600 text-white" : "border-slate-200"}`}>
                    {badge}
                  </button>
                ))}
              </div>
              <Field error={errors.badge} className="mt-3" label="Custom badge" maxLength={60} placeholder="Custom badge text" value={product.badge} onChange={(e) => updateProduct({ badge: e.target.value })} />
            </div>

            <TextArea error={errors.description} label="Product features" maxLength={1200} placeholder="Features, one per line" value={product.description} onChange={(e) => updateProduct({ description: e.target.value })} />
            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <Toggle label="Active" checked={product.isActive} onChange={(value) => updateProduct({ isActive: value })} />
              <Toggle label="In stock" checked={product.inStock} onChange={(value) => updateProduct({ inStock: value })} />
              <Toggle label="Best deal" checked={product.isFeatured} onChange={(value) => updateProduct({ isFeatured: value, badge: value && !product.badge ? "Best Deal" : product.badge })} />
            </div>
          </div>
        </div>
    </AdminModalShell>
  );
}

function UserFormModal({
  form,
  errors,
  onChange,
  onClose,
  onSave,
}: {
  form: typeof blankUser;
  errors: FormErrors;
  onChange: (form: typeof blankUser) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <AdminModalShell
      className="max-w-2xl"
      header={
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-600">Client setup</p>
            <h2 className="mt-1 text-2xl font-semibold">Add User</h2>
            <p className="mt-1 text-sm text-slate-500">Create a verified website/admin customer record.</p>
          </div>
          <button onClick={onClose} className="admin-icon-button rounded-xl p-2"><X size={18} /></button>
        </div>
      }
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <button onClick={onClose} className="rounded-full border px-5 py-3 text-sm font-medium">Cancel</button>
          <button onClick={onSave} className="rounded-full bg-amber-600 px-6 py-3 text-sm font-medium text-white"><UserPlus className="mr-2 inline h-4 w-4" />Create User</button>
        </div>
      }
    >
        <div className="grid gap-3">
          <Field error={errors.name} minLength={2} maxLength={80} pattern="[A-Za-z][A-Za-z .'-]{1,79}" placeholder="Name" value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} />
          <Field error={errors.email} type="email" maxLength={120} placeholder="Email" value={form.email} onChange={(e) => onChange({ ...form, email: e.target.value })} />
          <Field error={errors.phone} type="tel" inputMode="numeric" minLength={10} maxLength={10} pattern="[6-9][0-9]{9}" placeholder="Phone" value={form.phone} onChange={(e) => onChange({ ...form, phone: limitPhoneDigits(e.target.value) })} />
          <Field error={errors.password} minLength={6} maxLength={72} type="password" placeholder="Password" value={form.password} onChange={(e) => onChange({ ...form, password: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field error={errors.plan} placeholder="Plan" maxLength={80} value={form.plan} onChange={(e) => onChange({ ...form, plan: e.target.value })} />
            <Field error={errors.goal} placeholder="Goal" maxLength={120} value={form.goal} onChange={(e) => onChange({ ...form, goal: e.target.value })} />
          </div>
          <Field error={errors.address} placeholder="Address" maxLength={300} value={form.address} onChange={(e) => onChange({ ...form, address: e.target.value })} />
        </div>
    </AdminModalShell>
  );
}

function TestimonialFormModal({
  form,
  errors,
  editing,
  onChange,
  onClose,
  onSave,
}: {
  form: typeof blankTestimonial;
  errors: FormErrors;
  editing: boolean;
  onChange: (form: typeof blankTestimonial) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <AdminModalShell
      className="max-w-3xl"
      header={
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-600">Review editor</p>
            <h2 className="mt-1 text-2xl font-semibold">{editing ? "Edit Review" : "Add Review"}</h2>
            <p className="mt-1 text-sm text-slate-500">Modify review text, author details, source and rating.</p>
          </div>
          <button onClick={onClose} className="admin-icon-button rounded-xl p-2"><X size={18} /></button>
        </div>
      }
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <button onClick={onClose} className="rounded-full border px-5 py-3 text-sm font-medium">Cancel</button>
          <button onClick={onSave} className="rounded-full bg-amber-600 px-6 py-3 text-sm font-medium text-white">{editing ? "Update Review" : "Add Review"}</button>
        </div>
      }
    >
        <div className="grid gap-3">
          <Field error={errors.name} minLength={2} maxLength={80} pattern="[A-Za-z][A-Za-z .'-]{1,79}" placeholder="Client name" value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} />
          <Field error={errors.role} placeholder="Role / result" maxLength={120} value={form.role} onChange={(e) => onChange({ ...form, role: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select error={errors.rating} value={form.rating} onChange={(e) => onChange({ ...form, rating: Number(e.target.value) })}>{[5, 4, 3, 2, 1].map((item) => <option key={item} value={item}>{item} star</option>)}</Select>
            <Select value={form.source} onChange={(e) => onChange({ ...form, source: e.target.value })}>{["Website", "Google"].map((item) => <option key={item}>{item}</option>)}</Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field error={errors.authorMeta} placeholder="Author meta" maxLength={120} value={form.authorMeta} onChange={(e) => onChange({ ...form, authorMeta: e.target.value })} />
            <Field error={errors.reviewDate} placeholder="Review date" maxLength={40} value={form.reviewDate} onChange={(e) => onChange({ ...form, reviewDate: e.target.value })} />
          </div>
          <Field error={errors.imageUrl} type="url" maxLength={2000} placeholder="Image URL" value={form.imageUrl} onChange={(e) => onChange({ ...form, imageUrl: e.target.value })} />
          <TextArea error={errors.text} minLength={12} maxLength={1200} placeholder="Review text" value={form.text} onChange={(e) => onChange({ ...form, text: e.target.value })} className="min-h-44" />
        </div>
    </AdminModalShell>
  );
}

function GalleryFormModal({
  form,
  errors,
  uploadImages,
  editing,
  onChange,
  onUploadImages,
  onClose,
  onSave,
}: {
  form: typeof blankGalleryItem;
  errors: FormErrors;
  uploadImages: string[];
  editing: boolean;
  onChange: (form: typeof blankGalleryItem) => void;
  onUploadImages: (images: string[]) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const readImageFile = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Image upload failed."));
    reader.readAsDataURL(file);
  });

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    const invalidFile = files.find((file) => !file.type.startsWith("image/") || file.size > 4 * 1024 * 1024);
    if (invalidFile) {
      alert("Please upload image files under 4 MB each.");
      return;
    }
    try {
      const images = await Promise.all(files.map(readImageFile));
      onChange({ ...form, imageUrl: images[0] || "" });
      onUploadImages(editing ? [] : images);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Image upload failed.");
    }
  };

  return (
    <AdminModalShell
      className="max-w-4xl"
      header={
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-600">Gallery editor</p>
            <h2 className="mt-1 text-2xl font-semibold">{editing ? "Edit Gallery Item" : "Add Gallery Item"}</h2>
            <p className="mt-1 text-sm text-slate-500">Control images, workout videos and facility tour cards shown on the Gallery page.</p>
          </div>
          <button onClick={onClose} className="admin-icon-button rounded-xl p-2"><X size={18} /></button>
        </div>
      }
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <button onClick={onClose} className="rounded-full border px-5 py-3 text-sm font-medium">Cancel</button>
          <button onClick={onSave} className="rounded-full bg-amber-600 px-6 py-3 text-sm font-medium text-white"><ImagePlus className="mr-2 inline h-4 w-4" />{editing ? "Update Item" : "Add Item"}</button>
        </div>
      }
    >
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1fr]">
          <div className="space-y-3">
            <div className="admin-soft-panel overflow-hidden rounded-3xl border">
              {form.imageUrl ? (
                <img src={form.imageUrl} alt={form.title || "Gallery preview"} className="h-72 w-full object-contain" />
              ) : (
                <div className="flex h-72 flex-col items-center justify-center gap-3 text-slate-500">
                  <ImagePlus className="h-10 w-10 text-amber-600" />
                  <span className="text-sm">Upload an image to preview</span>
                </div>
              )}
            </div>
            {errors.imageUrl && <p className="text-xs text-amber-600">{errors.imageUrl}</p>}
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white">
                <ImagePlus className="mr-2 h-4 w-4" />
                {editing ? "Upload Image" : "Upload Images"}
                <input type="file" accept="image/*" multiple={!editing} onChange={handleUpload} className="hidden" />
              </label>
              {form.imageUrl && (
                <button type="button" onClick={() => { onChange({ ...form, imageUrl: "" }); onUploadImages([]); }} className="rounded-full border px-5 py-3 text-sm font-medium text-amber-600">
                  Remove
                </button>
              )}
            </div>
            {!editing && uploadImages.length > 1 && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3 text-sm text-slate-700">
                <p className="font-semibold text-amber-600">{uploadImages.length} photos selected</p>
                <p className="mt-1 text-xs text-slate-500">They will be added as separate gallery items using the same category and description.</p>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {uploadImages.slice(0, 10).map((image, index) => (
                    <img key={`${image.slice(0, 28)}-${index}`} src={image} alt={`Selected gallery ${index + 1}`} className="h-12 w-full rounded-xl object-contain" />
                  ))}
                </div>
              </div>
            )}
            <Toggle label="Visible on website" checked={form.isVisible} onChange={(value) => onChange({ ...form, isVisible: value })} />
          </div>
          <div className="grid gap-3">
            <Field error={errors.title} minLength={2} maxLength={120} placeholder="Title" value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Select error={errors.category} value={form.category} onChange={(e) => onChange({ ...form, category: e.target.value })}>
                {["Gym Photos", "Supplement Banner", "Equipment", "Workout Videos", "Facility Tour", "Transformation", "Events"].map((item) => <option key={item}>{item}</option>)}
              </Select>
              <Select value={form.mediaType} onChange={(e) => onChange({ ...form, mediaType: e.target.value as typeof form.mediaType })}>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="tour">Tour</option>
              </Select>
            </div>
            <Field error={errors.videoUrl} type="url" maxLength={2000} placeholder="Video / tour URL optional" value={form.videoUrl} onChange={(e) => onChange({ ...form, videoUrl: e.target.value })} />
            <Field error={errors.sortOrder} type="number" min={0} step="1" placeholder="Sort order" value={form.sortOrder || ""} onChange={(e) => onChange({ ...form, sortOrder: Number(e.target.value) })} />
            <TextArea error={errors.description} maxLength={500} placeholder="Description" value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} className="min-h-32" />
          </div>
        </div>
    </AdminModalShell>
  );
}

function CertificateFormPage({
  form,
  errors,
  templates,
  editing,
  onChange,
  onClose,
  onSave,
}: {
  form: CertificateForm;
  errors: FormErrors;
  templates: CertificateTemplate[];
  editing: boolean;
  onChange: (form: CertificateForm) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const activeTemplates = templates.filter((template) => template.status === "Active");
  const [cropSource, setCropSource] = useState("");
  const [photoCrop, setPhotoCrop] = useState({ zoom: 1, x: 50, y: 50 });
  const [cropError, setCropError] = useState("");
  const readImageFile = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Image upload failed."));
    reader.readAsDataURL(file);
  });
  const uploadCertificateImage = async (image: string, folder = "certificates") => {
    const uploaded = await apiRequest<{ path?: string; url?: string }>("/admin/uploads/image", {
      method: "POST",
      body: JSON.stringify({ image, folder }),
    });
    return uploaded.path || uploaded.url || image;
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>, field: "studentPhoto" | "signatureUrl") => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 4 * 1024 * 1024) {
      alert("Please upload an image under 4 MB.");
      return;
    }
    try {
      const image = await readImageFile(file);
      if (field === "studentPhoto") {
        setCropSource(image);
        setPhotoCrop({ zoom: 1, x: 50, y: 50 });
        setCropError("");
        return;
      }
      const uploadedPath = await uploadCertificateImage(image, "certificates");
      onChange({ ...form, [field]: uploadedPath });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Image upload failed.");
    }
  };

  const applyStudentCrop = async () => {
    if (!cropSource) return;
    setCropError("");
    try {
      const croppedImage = await new Promise<string>((resolve, reject) => {
        const image = new window.Image();
        image.onload = () => {
          const canvas = document.createElement("canvas");
          const outputSize = 900;
          canvas.width = outputSize;
          canvas.height = outputSize;
          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("Image crop failed."));
            return;
          }
          const safeZoom = Math.max(1, Math.min(photoCrop.zoom, 3));
          const cropSize = Math.min(image.naturalWidth, image.naturalHeight) / safeZoom;
          const maxX = Math.max(image.naturalWidth - cropSize, 0);
          const maxY = Math.max(image.naturalHeight - cropSize, 0);
          const centerX = (photoCrop.x / 100) * image.naturalWidth;
          const centerY = (photoCrop.y / 100) * image.naturalHeight;
          const sourceX = Math.max(0, Math.min(maxX, centerX - cropSize / 2));
          const sourceY = Math.max(0, Math.min(maxY, centerY - cropSize / 2));
          context.fillStyle = "#fff";
          context.fillRect(0, 0, outputSize, outputSize);
          context.drawImage(image, sourceX, sourceY, cropSize, cropSize, 0, 0, outputSize, outputSize);
          resolve(canvas.toDataURL("image/jpeg", 0.9));
        };
        image.onerror = () => reject(new Error("Image crop failed."));
        image.src = cropSource;
      });
      const uploadedPath = await uploadCertificateImage(croppedImage, "certificates");
      onChange({ ...form, studentPhoto: uploadedPath });
      setCropSource("");
    } catch (err) {
      setCropError(err instanceof Error ? err.message : "Image crop failed.");
    }
  };

  return (
    <div className="space-y-4">
      <AdminCard className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <button onClick={onClose} className="admin-icon-button mt-0.5 shrink-0 rounded-xl p-2" aria-label="Back to certificates"><ArrowLeft size={18} /></button>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-600">Academy certificate</p>
            <h2 className="mt-1 text-2xl font-semibold">{editing ? "Edit Certificate" : "Issue Certificate"}</h2>
            <p className="mt-1 text-sm text-slate-500">Use the official Highgrade Fitness Academy template with live verification QR.</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button onClick={onClose} className="rounded-full border px-4 py-2.5 text-sm font-medium">Cancel</button>
          <button onClick={onSave} className="rounded-full bg-amber-600 px-5 py-2.5 text-sm font-medium text-white"><Award className="mr-2 inline h-4 w-4" />{editing ? "Update Certificate" : "Issue Certificate"}</button>
        </div>
      </AdminCard>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(360px,1fr)]">
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field error={errors.studentName} label="Student full name" minLength={2} maxLength={120} value={form.studentName} onChange={(e) => onChange({ ...form, studentName: e.target.value })} />
            <Field error={errors.studentId} label="Student ID" maxLength={60} value={form.studentId} onChange={(e) => onChange({ ...form, studentId: e.target.value })} />
          </div>
          <Select label="Certificate template" value={form.templateId || ""} onChange={(e) => onChange({ ...form, templateId: e.target.value ? Number(e.target.value) : "" })}>
            {(activeTemplates.length ? activeTemplates : [defaultCertificateTemplate]).map((template) => <option key={template.id || template.name} value={template.id || ""}>{template.name}</option>)}
          </Select>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field error={errors.certificateNo} label="Certificate number" maxLength={80} value={form.certificateNo} onChange={(e) => onChange({ ...form, certificateNo: e.target.value })} />
            <Select label="Status" value={form.status} onChange={(e) => onChange({ ...form, status: e.target.value as CertificateStatus })}>
              {["Valid", "Revoked", "Expired"].map((status) => <option key={status}>{status}</option>)}
            </Select>
          </div>
          <Field error={errors.courseName} label="Course name" maxLength={160} value={form.courseName} onChange={(e) => onChange({ ...form, courseName: e.target.value })} />
          <Field error={errors.courseLevel} label="Course level" maxLength={160} value={form.courseLevel} onChange={(e) => onChange({ ...form, courseLevel: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field error={errors.batchName} label="Batch name" maxLength={120} value={form.batchName} onChange={(e) => onChange({ ...form, batchName: e.target.value })} />
            <Field error={errors.duration} label="Course duration" maxLength={80} value={form.duration} onChange={(e) => onChange({ ...form, duration: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Enrollment date" type="date" value={form.enrollmentDate} onChange={(e) => onChange({ ...form, enrollmentDate: e.target.value })} />
            <Field label="Completion date" type="date" value={form.completionDate} onChange={(e) => onChange({ ...form, completionDate: e.target.value })} />
            <Field label="Issue date" type="date" value={form.issueDate} onChange={(e) => onChange({ ...form, issueDate: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field error={errors.instructorName} label="Instructor name" maxLength={120} value={form.instructorName} onChange={(e) => onChange({ ...form, instructorName: e.target.value })} />
            <Field error={errors.directorName} label="Director name" maxLength={120} value={form.directorName} onChange={(e) => onChange({ ...form, directorName: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Student photo</label>
              {form.studentPhoto && !cropSource && (
                <div className="mb-3 flex items-center gap-3 rounded-2xl border bg-white p-3">
                  <img src={adminMediaSrc(form.studentPhoto)} alt={`${form.studentName || "Student"} preview`} className="h-16 w-16 rounded-xl object-contain" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">Photo preview</p>
                    <p className="text-xs text-slate-500">This image will print on the certificate.</p>
                  </div>
                  <button type="button" onClick={() => onChange({ ...form, studentPhoto: "" })} className="rounded-full border px-3 py-2 text-xs font-medium text-amber-600">Remove</button>
                </div>
              )}
              {cropSource && (
                <div className="mb-3 rounded-3xl border bg-white p-3">
                  <div className="mx-auto aspect-square max-w-64 overflow-hidden rounded-2xl border bg-slate-100">
                    <img
                      src={cropSource}
                      alt="Crop student"
                      className="h-full w-full object-contain"
                      style={{ objectPosition: `${photoCrop.x}% ${photoCrop.y}%`, transform: `scale(${photoCrop.zoom})`, transformOrigin: `${photoCrop.x}% ${photoCrop.y}%` }}
                    />
                  </div>
                  <div className="mt-3 grid gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <label>Zoom <input type="range" min="1" max="3" step="0.05" value={photoCrop.zoom} onChange={(e) => setPhotoCrop({ ...photoCrop, zoom: Number(e.target.value) })} className="mt-2 w-full accent-amber-600" /></label>
                    <label>Horizontal focus <input type="range" min="0" max="100" value={photoCrop.x} onChange={(e) => setPhotoCrop({ ...photoCrop, x: Number(e.target.value) })} className="mt-2 w-full accent-amber-600" /></label>
                    <label>Vertical focus <input type="range" min="0" max="100" value={photoCrop.y} onChange={(e) => setPhotoCrop({ ...photoCrop, y: Number(e.target.value) })} className="mt-2 w-full accent-amber-600" /></label>
                  </div>
                  {cropError && <p className="mt-2 text-xs text-amber-600">{cropError}</p>}
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => setCropSource("")} className="flex-1 rounded-full border px-4 py-2 text-sm font-medium">Cancel</button>
                    <button type="button" onClick={applyStudentCrop} className="flex-1 rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white">Apply crop</button>
                  </div>
                </div>
              )}
              <label className="inline-flex w-full cursor-pointer items-center justify-center rounded-full border border-amber-200 px-4 py-3 text-sm font-medium text-amber-600">
                <ImagePlus className="mr-2 h-4 w-4" /> Upload Photo
                <input type="file" accept="image/*" onChange={(event) => handleUpload(event, "studentPhoto")} className="hidden" />
              </label>
              {errors.studentPhoto && <p className="mt-1 text-xs text-amber-600">{errors.studentPhoto}</p>}
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Signature image</label>
              <label className="inline-flex w-full cursor-pointer items-center justify-center rounded-full border border-amber-200 px-4 py-3 text-sm font-medium text-amber-600">
                <ImagePlus className="mr-2 h-4 w-4" /> Upload Signature
                <input type="file" accept="image/*" onChange={(event) => handleUpload(event, "signatureUrl")} className="hidden" />
              </label>
              {errors.signatureUrl && <p className="mt-1 text-xs text-amber-600">{errors.signatureUrl}</p>}
            </div>
          </div>
          <TextArea error={errors.notes} label="Admin notes" maxLength={1000} value={form.notes} onChange={(e) => onChange({ ...form, notes: e.target.value })} />
        </div>
        <div className="rounded-3xl border bg-slate-50 p-6">
          <iframe
            title="Official certificate template"
            src={`${API_BASE}/certificates/default-pdf`}
            className="h-[78vh] min-h-[680px] w-full rounded-2xl border bg-white"
          />
          <p className="mt-3 text-center text-xs text-slate-500">
            Official default certificate template. Dynamic student details, photo, signature and QR are stamped by the backend after save.
          </p>
        </div>
      </div>
    </div>
  );
}

function CertificateTemplateEditorPage({
  form,
  errors,
  editing,
  onChange,
  onClose,
  onSave,
}: {
  form: CertificateTemplateForm;
  errors: FormErrors;
  editing: boolean;
  onChange: (form: CertificateTemplateForm) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  type CertificateTemplatePart = "global" | "background" | CertificateEditableElementKey;
  const [selectedPart, setSelectedPart] = useState<CertificateTemplatePart>("global");
  const templateParts: { id: CertificateTemplatePart; label: string }[] = [
    { id: "global", label: "Basics" },
    { id: "logo", label: "Logo" },
    { id: "tagline", label: "Tagline" },
    { id: "title", label: "Title" },
    { id: "subtitle", label: "Subtitle" },
    { id: "certifyLine", label: "Certify line" },
    { id: "name", label: "Student name" },
    { id: "completedLine", label: "Completed line" },
    { id: "academy", label: "Academy name" },
    { id: "courseLevel", label: "Course level" },
    { id: "descriptionOne", label: "Paragraph 1" },
    { id: "descriptionTwo", label: "Paragraph 2" },
    { id: "quote", label: "Quote" },
    { id: "directorTitle", label: "Director title" },
    { id: "directorOrg", label: "Director org" },
    { id: "issuedByLabel", label: "Issued label" },
    { id: "issuedByValue", label: "Issued by" },
    { id: "completionLabel", label: "Completion label" },
    { id: "completionDate", label: "Completion date" },
    { id: "courseLabel", label: "Course label" },
    { id: "courseValue", label: "Course footer" },
    { id: "issuedDateLabel", label: "Issued date label" },
    { id: "issuedDateValue", label: "Issued date" },
    { id: "qr", label: "QR" },
    { id: "signature", label: "Signature" },
    { id: "photo", label: "Photo" },
    { id: "background", label: "Background" },
  ];

  const readImageFile = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Image upload failed."));
    reader.readAsDataURL(file);
  });

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>, field: "backgroundImage" | "logoImage" | "signatureImage") => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 4 * 1024 * 1024) {
      alert("Please upload an image under 4 MB.");
      return;
    }
    try {
      onChange({ ...form, [field]: await readImageFile(file) });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Image upload failed.");
    }
  };

  const sampleCertificate: CertificateData = {
    ...defaultCertificateData,
    studentName: "XYZ Student",
    studentId: "HGFA-STU-0001",
    certificateNo: "HGFA-L1-000001",
    completionDate: "",
    issueDate: "",
    status: "Valid",
  };
  const textDefaults: Partial<Record<CertificateEditableElementKey, string>> = {
    tagline: "Getting people moving since 2026",
    title: "Certificate",
    subtitle: "Of Completion",
    certifyLine: "This is to certify that",
    name: sampleCertificate.studentName,
    completedLine: "has successfully completed the",
    academy: sampleCertificate.courseName,
    courseLevel: sampleCertificate.courseLevel,
    descriptionOne: "and has demonstrated the required knowledge and practical competency in the fundamental principles of fitness instruction, exercise science, client assessment, human movement, exercise technique, nutrition fundamentals, and professional gym floor practice.",
    descriptionTwo: "This certificate is awarded in recognition of the successful completion of all required coursework, practical assessments, and final evaluation.",
    quote: "This certificate verifies successful completion of the Highgrade Fitness Academy Level 1 - Certified Fitness Trainer programme.",
    directorTitle: "Course Director & Instructor",
    directorOrg: "Highgrade Fitness Academy",
    issuedByLabel: "ISSUED BY",
    issuedByValue: "Highgrade Fitness Academy",
    completionLabel: "DATE OF COMPLETION",
    completionDate: today(),
    courseLabel: "COURSE",
    courseValue: sampleCertificate.courseLevel,
    issuedDateLabel: "ISSUED DATE",
    issuedDateValue: today(),
  };

  const selectPreviewPart = (event: MouseEvent<HTMLDivElement>) => {
    const zone = (event.target as HTMLElement).closest<HTMLElement>("[data-certificate-zone]")?.dataset.certificateZone as CertificateTemplatePart | undefined;
    if (zone && templateParts.some((part) => part.id === zone)) setSelectedPart(zone);
  };

  const uploadControl = (field: "backgroundImage" | "logoImage" | "signatureImage", title: string, action: string, clearText: string) => (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</label>
      <label className="inline-flex w-full cursor-pointer items-center justify-center rounded-full border border-amber-200 px-4 py-3 text-sm font-medium text-amber-600">
        <ImagePlus className="mr-2 h-4 w-4" /> {action}
        <input type="file" accept="image/*" onChange={(event) => handleUpload(event, field)} className="hidden" />
      </label>
      {errors[field] && <p className="mt-1 text-xs text-amber-600">{errors[field]}</p>}
      {form[field] && <button type="button" onClick={() => onChange({ ...form, [field]: "" })} className="mt-2 text-sm font-medium text-amber-600">{clearText}</button>}
    </div>
  );

  const editableTextParts = new Set<CertificateTemplatePart>([
    "tagline", "title", "subtitle", "certifyLine", "name", "completedLine", "academy", "courseLevel",
    "descriptionOne", "descriptionTwo", "quote", "directorTitle", "directorOrg", "issuedByLabel", "issuedByValue",
    "completionLabel", "completionDate", "courseLabel", "courseValue", "issuedDateLabel", "issuedDateValue",
  ]);
  const isEditableElement = (part: CertificateTemplatePart): part is CertificateEditableElementKey => part !== "global" && part !== "background";
  const updateElement = (part: CertificateEditableElementKey, patch: Partial<CertificateEditableElement>) => {
    const elements = { ...(form.elements || {}) };
    elements[part] = { ...(elements[part] || {}), ...patch };
    onChange({ ...form, elements });
  };
  const selectedElement = isEditableElement(selectedPart) ? (form.elements || {})[selectedPart] || {} : {};
  const selectedText = isEditableElement(selectedPart) ? selectedElement.text ?? textDefaults[selectedPart] ?? "" : "";

  const nudgeSelected = (top: number, left: number, width?: number) => {
    if (!isEditableElement(selectedPart)) return;
    if (selectedPart === "logo") return onChange({ ...form, logoTop: top, logoLeft: left, logoWidth: width || form.logoWidth });
    if (selectedPart === "qr") return onChange({ ...form, qrTop: top, qrRight: Math.max(2, 100 - left - (width || form.qrSize)), qrSize: width || form.qrSize });
    if (selectedPart === "signature") return onChange({ ...form, signatureTop: top, signatureLeft: left, signatureWidth: width || form.signatureWidth });
    if (selectedPart === "photo") return onChange({ ...form, photoBottom: Math.max(3, 100 - top - (width || form.photoSize)), photoLeft: left, photoSize: width || form.photoSize });
    updateElement(selectedPart, { top, left, width: width || selectedElement.width || 60 });
  };

  const placementControls = () => (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Quick placement</p>
      <div className="grid grid-cols-3 gap-2">
        <button type="button" className="rounded-full border px-3 py-2 text-xs font-semibold" onClick={() => nudgeSelected(8, 8, 32)}>Top left</button>
        <button type="button" className="rounded-full border px-3 py-2 text-xs font-semibold" onClick={() => nudgeSelected(8, 25, 50)}>Top center</button>
        <button type="button" className="rounded-full border px-3 py-2 text-xs font-semibold" onClick={() => nudgeSelected(8, 60, 32)}>Top right</button>
        <button type="button" className="rounded-full border px-3 py-2 text-xs font-semibold" onClick={() => nudgeSelected(45, 8, 32)}>Left</button>
        <button type="button" className="rounded-full border px-3 py-2 text-xs font-semibold" onClick={() => nudgeSelected(45, 20, 60)}>Center</button>
        <button type="button" className="rounded-full border px-3 py-2 text-xs font-semibold" onClick={() => nudgeSelected(45, 60, 32)}>Right</button>
        <button type="button" className="rounded-full border px-3 py-2 text-xs font-semibold" onClick={() => nudgeSelected(82, 8, 32)}>Bottom left</button>
        <button type="button" className="rounded-full border px-3 py-2 text-xs font-semibold" onClick={() => nudgeSelected(82, 25, 50)}>Bottom</button>
        <button type="button" className="rounded-full border px-3 py-2 text-xs font-semibold" onClick={() => nudgeSelected(82, 60, 32)}>Bottom right</button>
      </div>
    </div>
  );

  const resetElementPosition = (part: CertificateEditableElementKey) => {
    const current = (form.elements || {})[part] || {};
    updateElement(part, { ...current, top: undefined, left: undefined, width: undefined });
  };

  const resetAllPlacements = () => {
    onChange({
      ...form,
      elements: {},
      logoTop: defaultCertificateTemplate.logoTop,
      logoLeft: defaultCertificateTemplate.logoLeft,
      logoWidth: defaultCertificateTemplate.logoWidth,
      qrTop: defaultCertificateTemplate.qrTop,
      qrRight: defaultCertificateTemplate.qrRight,
      qrSize: defaultCertificateTemplate.qrSize,
      signatureTop: defaultCertificateTemplate.signatureTop,
      signatureLeft: defaultCertificateTemplate.signatureLeft,
      signatureWidth: defaultCertificateTemplate.signatureWidth,
      photoLeft: defaultCertificateTemplate.photoLeft,
      photoBottom: defaultCertificateTemplate.photoBottom,
      photoSize: defaultCertificateTemplate.photoSize,
    });
  };

  const defaultLineHeightForPart = (part: CertificateEditableElementKey) => {
    if (part === "title" || part === "subtitle" || part === "name" || part === "courseLevel") return 1.05;
    if (part === "descriptionOne" || part === "descriptionTwo") return 1.4;
    if (part === "quote") return 1.35;
    if (part.includes("Label") || part.includes("Date") || part === "directorTitle" || part === "directorOrg") return 1.15;
    return 1.18;
  };

  const textElementControls = (part: CertificateEditableElementKey) => (
    <div className="grid gap-4">
      <TextArea label="Text content" maxLength={1200} value={selectedText} onChange={(event) => updateElement(part, { text: event.target.value })} className="min-h-28" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select label="Font family" value={selectedElement.fontFamily || form.nameFont} onChange={(event) => updateElement(part, { fontFamily: event.target.value })}>
          {certificateFontOptions.map((font) => <option key={font} value={font}>{font}</option>)}
        </Select>
        <Select label="Align" value={selectedElement.align || form.nameAlign} onChange={(event) => updateElement(part, { align: event.target.value as CertificateTextAlign })}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <RangeField label="Top" value={Number(selectedElement.top ?? 45)} min={2} max={92} step={0.1} onChange={(value) => updateElement(part, { top: value })} />
        <RangeField label="Left" value={Number(selectedElement.left ?? 20)} min={1} max={90} step={0.1} onChange={(value) => updateElement(part, { left: value })} />
        <RangeField label="Width" value={Number(selectedElement.width ?? 60)} min={8} max={96} step={0.1} onChange={(value) => updateElement(part, { width: value })} />
        <RangeField label="Font size" value={Number(selectedElement.fontSize ?? (part === "title" ? 5.65 : part === "name" ? form.nameFontSize : 1.2))} min={0.35} max={7} step={0.05} onChange={(value) => updateElement(part, { fontSize: value })} />
        <RangeField label="Line height" value={Number(selectedElement.lineHeight ?? defaultLineHeightForPart(part))} min={0.75} max={2.4} step={0.05} suffix="x" onChange={(value) => updateElement(part, { lineHeight: value })} />
        <RangeField label="Weight" value={Number(selectedElement.fontWeight ?? (part === "title" || part === "name" ? 800 : 600))} min={100} max={900} step={100} onChange={(value) => updateElement(part, { fontWeight: value })} />
        <RangeField label="Spacing" value={Number(selectedElement.letterSpacing ?? 0)} min={0} max={0.8} step={0.01} onChange={(value) => updateElement(part, { letterSpacing: value })} />
      </div>
      <Field label="Text color" type="color" value={selectedElement.color || form.navyColor} onChange={(event) => updateElement(part, { color: event.target.value })} />
      <div className="grid gap-3 sm:grid-cols-2">
        {placementControls()}
        <button type="button" onClick={() => resetElementPosition(part)} className="self-end rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Use default placement</button>
      </div>
      <button type="button" onClick={() => {
        const elements = { ...(form.elements || {}) };
        delete elements[part];
        onChange({ ...form, elements });
      }} className="rounded-full border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-600">Reset this text</button>
    </div>
  );

  const selectedLabel = templateParts.find((part) => part.id === selectedPart)?.label || "Basics";
  const selectedControls = () => {
    if (isEditableElement(selectedPart) && editableTextParts.has(selectedPart)) return textElementControls(selectedPart);
    if (selectedPart === "logo") {
      return (
        <div className="grid gap-4">
          {uploadControl("logoImage", "Academy logo", "Upload Logo", "Use default logo")}
          {/* {placementControls()} */}
          <div className="grid gap-3 sm:grid-cols-3">
            <RangeField label="Logo top" value={form.logoTop} min={3} max={18} step={0.1} onChange={(value) => onChange({ ...form, logoTop: value })} />
            <RangeField label="Logo left" value={form.logoLeft} min={5} max={55} step={0.1} onChange={(value) => onChange({ ...form, logoLeft: value })} />
            <RangeField label="Logo width" value={form.logoWidth} min={20} max={75} step={0.1} onChange={(value) => onChange({ ...form, logoWidth: value })} />
          </div>
        </div>
      );
    }
    if (selectedPart === "tagline") {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <RangeField label="Tagline top" value={form.taglineTop} min={15} max={27} step={0.1} onChange={(value) => onChange({ ...form, taglineTop: value })} />
          <RangeField label="Tagline left" value={form.taglineLeft} min={8} max={45} step={0.1} onChange={(value) => onChange({ ...form, taglineLeft: value })} />
          <RangeField label="Tagline width" value={form.taglineWidth} min={25} max={84} step={0.1} onChange={(value) => onChange({ ...form, taglineWidth: value })} />
          <RangeField label="Tagline size" value={form.taglineFontSize} min={0.6} max={2} step={0.05} onChange={(value) => onChange({ ...form, taglineFontSize: value })} />
          <RangeField label="Tagline spacing" value={form.taglineLetterSpacing} min={0.1} max={0.8} step={0.01} onChange={(value) => onChange({ ...form, taglineLetterSpacing: value })} />
        </div>
      );
    }
    if (selectedPart === "name") {
      return (
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="Student name font" value={form.nameFont} onChange={(e) => onChange({ ...form, nameFont: e.target.value as CertificateTextFont })}>
              {certificateFontOptions.map((font) => <option key={font} value={font}>{font}</option>)}
            </Select>
            <Field error={errors.nameFont} label="Custom font family" maxLength={120} value={form.nameFont} onChange={(e) => onChange({ ...form, nameFont: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Select label="Name align" value={form.nameAlign} onChange={(e) => onChange({ ...form, nameAlign: e.target.value as CertificateTemplateForm["nameAlign"] })}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </Select>
            <RangeField label="Name weight" value={form.nameFontWeight} min={100} max={900} step={100} onChange={(value) => onChange({ ...form, nameFontWeight: value })} />
            <RangeField label="Name spacing" value={form.nameLetterSpacing} min={0} max={0.3} step={0.01} onChange={(value) => onChange({ ...form, nameLetterSpacing: value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <RangeField label="Name top" value={form.nameTop} min={35} max={52} step={0.1} onChange={(value) => onChange({ ...form, nameTop: value })} />
            <RangeField label="Name left" value={form.nameLeft} min={10} max={40} step={0.1} onChange={(value) => onChange({ ...form, nameLeft: value })} />
            <RangeField label="Name width" value={form.nameWidth} min={30} max={80} step={0.1} onChange={(value) => onChange({ ...form, nameWidth: value })} />
            <RangeField label="Name size" value={form.nameFontSize} min={1.4} max={5} step={0.05} onChange={(value) => onChange({ ...form, nameFontSize: value })} />
          </div>
        </div>
      );
    }
    if (selectedPart === "course") {
      return <RangeField label="Course block top" value={form.courseTop} min={45} max={58} step={0.1} onChange={(value) => onChange({ ...form, courseTop: value })} />;
    }
    if (selectedPart === "qr") {
      return (
        <div className="grid gap-4">
          <Toggle label="Show QR verification block" checked={form.showQr} onChange={(value) => onChange({ ...form, showQr: value })} />
          <div className="grid gap-3 sm:grid-cols-3">
            <RangeField label="QR top" value={form.qrTop} min={2} max={12} step={0.1} onChange={(value) => onChange({ ...form, qrTop: value })} />
            <RangeField label="QR right" value={form.qrRight} min={2} max={12} step={0.1} onChange={(value) => onChange({ ...form, qrRight: value })} />
            <RangeField label="QR size" value={form.qrSize} min={7} max={18} step={0.1} onChange={(value) => onChange({ ...form, qrSize: value })} />
          </div>
        </div>
      );
    }
    if (selectedPart === "signature") {
      return (
        <div className="grid gap-4">
          {uploadControl("signatureImage", "Default signature", "Upload Sign", "Remove default sign")}
          <div className="grid gap-3 sm:grid-cols-3">
            <RangeField label="Signature top" value={form.signatureTop} min={74} max={87} step={0.1} onChange={(value) => onChange({ ...form, signatureTop: value })} />
            <RangeField label="Signature left" value={form.signatureLeft} min={10} max={60} step={0.1} onChange={(value) => onChange({ ...form, signatureLeft: value })} />
            <RangeField label="Signature width" value={form.signatureWidth} min={20} max={70} step={0.1} onChange={(value) => onChange({ ...form, signatureWidth: value })} />
          </div>
        </div>
      );
    }
    if (selectedPart === "photo") {
      return (
        <div className="grid gap-3 sm:grid-cols-3">
          <RangeField label="Photo size" value={form.photoSize} min={8} max={22} step={0.1} onChange={(value) => onChange({ ...form, photoSize: value })} />
          <RangeField label="Photo left" value={form.photoLeft} min={25} max={60} step={0.1} onChange={(value) => onChange({ ...form, photoLeft: value })} />
          <RangeField label="Photo bottom" value={form.photoBottom} min={3} max={16} step={0.1} onChange={(value) => onChange({ ...form, photoBottom: value })} />
        </div>
      );
    }
    if (selectedPart === "background") {
      return (
        <div className="grid gap-4">
          {uploadControl("backgroundImage", "Template background", "Upload Certificate Background", "Use default Highgrade background")}
          <div className="grid gap-3 sm:grid-cols-3">
            <Field error={errors.accentColor} label="Accent color" type="color" value={form.accentColor} onChange={(e) => onChange({ ...form, accentColor: e.target.value })} />
            <Field error={errors.navyColor} label="Navy text" type="color" value={form.navyColor} onChange={(e) => onChange({ ...form, navyColor: e.target.value })} />
            <Field error={errors.goldColor} label="Gold text" type="color" value={form.goldColor} onChange={(e) => onChange({ ...form, goldColor: e.target.value })} />
          </div>
        </div>
      );
    }
    return (
      <div className="grid gap-4">
        <Field error={errors.name} label="Template name" maxLength={140} value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Default text font" value={form.nameFont} onChange={(e) => onChange({ ...form, nameFont: e.target.value })}>
            {certificateFontOptions.map((font) => <option key={font} value={font}>{font}</option>)}
          </Select>
          <Select label="Status" value={form.status} onChange={(e) => onChange({ ...form, status: e.target.value as CertificateTemplateForm["status"] })}>
            <option>Active</option>
            <option>Hidden</option>
          </Select>
          <Toggle label="Make this the default template" checked={Boolean(form.isDefault)} onChange={(value) => onChange({ ...form, isDefault: value })} />
        </div>
        <button
          type="button"
          onClick={() => {
            const elements = { ...(form.elements || {}) };
            editableTextParts.forEach((part) => {
              if (isEditableElement(part)) elements[part] = { ...(elements[part] || {}), fontFamily: form.nameFont };
            });
            onChange({ ...form, elements });
          }}
          className="rounded-full border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-600"
        >
          Apply this font to all certificate text
        </button>
        <button
          type="button"
          onClick={resetAllPlacements}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
        >
          Reset all positions to certificate layout
        </button>
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 p-4 text-sm text-slate-600">
          Single-click any certificate element in the preview to open its exact edit controls.
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <AdminCard className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <button onClick={onClose} className="admin-icon-button mt-0.5 shrink-0 rounded-xl p-2" aria-label="Back to certificate templates"><ArrowLeft size={18} /></button>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-600">Certificate template</p>
            <h2 className="mt-1 text-2xl font-semibold">{editing ? "Edit Template" : "Create Template"}</h2>
            <p className="mt-1 text-sm text-slate-500">Modify the certificate background, colors, text positions, font and QR layout.</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button onClick={onClose} className="rounded-full border px-4 py-2.5 text-sm font-medium">Cancel</button>
          <button onClick={onSave} className="rounded-full bg-amber-600 px-5 py-2.5 text-sm font-medium text-white"><FileText className="mr-2 inline h-4 w-4" />{editing ? "Update Template" : "Save Template"}</button>
        </div>
      </AdminCard>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.82fr)_minmax(360px,1fr)]">
        <div className="grid content-start gap-4">
          {/* <div className="flex flex-wrap gap-2">
            {templateParts.map((part) => (
              <button
                key={part.id}
                type="button"
                onClick={() => setSelectedPart(part.id)}
                className={`rounded-full border px-3 py-2 text-xs font-semibold ${selectedPart === part.id ? "border-amber-600 bg-amber-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}
              >
                {part.label}
              </button>
            ))}
          </div> */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Editing</p>
              <h3 className="mt-1 text-lg font-semibold">{selectedLabel}</h3>
            </div>
            {selectedControls()}
          </div>
        </div>
        <div
          className="certificate-template-preview certificate-template-preview-picker overflow-x-auto rounded-3xl border bg-slate-50 p-3"
          onClick={selectPreviewPart}
        >
          <HighgradeCertificate certificate={sampleCertificate} template={form} verifyUrl={`${window.location.origin}/highgradeacademy/verify/HGFA-L1-000001`} />
        </div>
      </div>
    </div>
  );
}

function certificatePdfSrc(certificate: Pick<Certificate, "id" | "updatedAt" | "pdfUrl" | "certificatePdfUrl">) {
  if (certificate.id) return `${API_BASE}/certificates/${certificate.id}/pdf?v=${encodeURIComponent(certificate.updatedAt || Date.now())}`;
  const value = certificate.pdfUrl || certificate.certificatePdfUrl || "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/uploads/")) return `${API_BASE.replace(/\/api$/, "")}${value}`;
  return "";
}

function CertificatePreviewPage({ certificate, verifyUrl, onClose, onEdit }: { certificate: Certificate; template: CertificateTemplateData; verifyUrl: string; onClose: () => void; onEdit: () => void }) {
  const pdfSrc = certificatePdfSrc(certificate);
  return (
    <div className="certificate-print-modal space-y-4">
      <AdminCard className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <button onClick={onClose} className="admin-icon-button mt-0.5 shrink-0 rounded-xl p-2" aria-label="Back to certificates"><ArrowLeft size={18} /></button>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-600">Certificate preview</p>
            <h2 className="mt-1 text-2xl font-semibold">{certificate.studentName}</h2>
            <p className="mt-1 text-sm text-slate-500">{certificate.certificateNo} / {certificate.status}</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <a href={verifyUrl} target="_blank" rel="noreferrer" className="rounded-full border px-4 py-2.5 text-sm font-medium"><ExternalLink className="mr-2 inline h-4 w-4" />Verify Page</a>
          {pdfSrc && <a href={pdfSrc} target="_blank" rel="noreferrer" className="rounded-full border px-4 py-2.5 text-sm font-medium"><Download className="mr-2 inline h-4 w-4" />Download PDF</a>}
          <button onClick={onEdit} className="rounded-full border px-4 py-2.5 text-sm font-medium"><Edit3 className="mr-2 inline h-4 w-4" />Edit</button>
          <button onClick={() => window.print()} className="rounded-full bg-amber-600 px-5 py-2.5 text-sm font-medium text-white"><Printer className="mr-2 inline h-4 w-4" />Print / PDF</button>
        </div>
      </AdminCard>
      <div className="certificate-modal-preview rounded-3xl border bg-slate-50 p-3">
        {pdfSrc ? (
          <iframe
            title={`Certificate ${certificate.certificateNo}`}
            src={pdfSrc}
            className="h-[78vh] min-h-[680px] w-full rounded-2xl border bg-white"
          />
        ) : (
          <div className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-dashed bg-white p-8 text-center">
            <FileText className="h-12 w-12 text-amber-600" />
            <h3 className="mt-4 text-lg font-semibold">PDF not generated yet</h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">Edit and save this certificate once. The backend will generate the official PDF and show it here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BlogFormModal({
  form,
  errors,
  editing,
  onChange,
  onClose,
  onSave,
}: {
  form: typeof blankBlog;
  errors: FormErrors;
  editing: boolean;
  onChange: (form: typeof blankBlog) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <AdminModalShell
      className="max-w-4xl"
      header={
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-600">Content editor</p>
            <h2 className="mt-1 text-2xl font-semibold">{editing ? "Edit Post" : "Add Post"}</h2>
            <p className="mt-1 text-sm text-slate-500">Create or update website content.</p>
          </div>
          <button onClick={onClose} className="admin-icon-button rounded-xl p-2"><X size={18} /></button>
        </div>
      }
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <button onClick={onClose} className="rounded-full border px-5 py-3 text-sm font-medium">Cancel</button>
          <button onClick={onSave} className="rounded-full bg-amber-600 px-6 py-3 text-sm font-medium text-white"><FileText className="mr-2 inline h-4 w-4" />{editing ? "Update Post" : "Save Post"}</button>
        </div>
      }
    >
        <div className="grid gap-3">
          <Field error={errors.title} minLength={3} maxLength={160} placeholder="Title" value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 180) })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field error={errors.slug} placeholder="Slug" maxLength={180} value={form.slug} onChange={(e) => onChange({ ...form, slug: e.target.value })} />
            <Select error={errors.category} value={form.category} onChange={(e) => onChange({ ...form, category: e.target.value })}>
              {["Nutrition", "Fat Loss", "Strength", "Recovery", "Supplements", "Women Training", "Fitness"].map((item) => <option key={item}>{item}</option>)}
            </Select>
          </div>
          <Field error={errors.imageUrl} type="url" maxLength={2000} placeholder="Cover image URL" value={form.imageUrl} onChange={(e) => onChange({ ...form, imageUrl: e.target.value })} />
          <TextArea error={errors.excerpt} minLength={20} maxLength={300} placeholder="Excerpt" value={form.excerpt} onChange={(e) => onChange({ ...form, excerpt: e.target.value })} />
          <TextArea error={errors.body} maxLength={10000} placeholder="Full post content" value={form.body} onChange={(e) => onChange({ ...form, body: e.target.value })} className="min-h-48" />
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Select value={form.status} onChange={(e) => onChange({ ...form, status: e.target.value })}>{["Draft", "Published"].map((item) => <option key={item}>{item}</option>)}</Select>
            <Toggle label="Featured post" checked={form.featured} onChange={(value) => onChange({ ...form, featured: value })} />
          </div>
        </div>
    </AdminModalShell>
  );
}

function PlanFormModal({
  form,
  errors,
  editing,
  onChange,
  onClose,
  onSave,
}: {
  form: PlanForm;
  errors: FormErrors;
  editing: boolean;
  onChange: (form: PlanForm) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <AdminModalShell
      className="max-w-3xl"
      header={
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-600">Plan editor</p>
            <h2 className="mt-1 text-2xl font-semibold">{editing ? "Edit Plan" : "Add Plan"}</h2>
            <p className="mt-1 text-sm text-slate-500">Update website membership package cards.</p>
          </div>
          <button onClick={onClose} className="admin-icon-button rounded-xl p-2"><X size={18} /></button>
        </div>
      }
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <button onClick={onClose} className="rounded-full border px-5 py-3 text-sm font-medium">Cancel</button>
          <button onClick={onSave} className="rounded-full bg-amber-600 px-6 py-3 text-sm font-medium text-white"><Plus className="mr-2 inline h-4 w-4" />{editing ? "Update Plan" : "Save Plan"}</button>
        </div>
      }
    >
      <div className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Plan name" error={errors.name} maxLength={80} placeholder="Monthly" value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} />
          <Field label="Image URL" error={errors.image} type="url" maxLength={2000} placeholder="https://..." value={form.image} onChange={(e) => onChange({ ...form, image: e.target.value })} />
        </div>
        <Field label="Short note" error={errors.note} maxLength={160} placeholder="Flexible starter access" value={form.note} onChange={(e) => onChange({ ...form, note: e.target.value })} />
        <TextArea
          error={errors.featuresText}
          maxLength={1000}
          placeholder={"One feature per line\nGym floor access\nTrainer guidance"}
          value={form.featuresText}
          onChange={(e) => onChange({ ...form, featuresText: e.target.value })}
          className="min-h-44"
        />
        <Toggle label={form.visible ? "Visible on website" : "Hidden from website"} checked={form.visible} onChange={(value) => onChange({ ...form, visible: value })} />
      </div>
    </AdminModalShell>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <button type="button" onClick={() => onChange(!checked)} className={`rounded-2xl border px-3 py-2 text-xs ${checked ? "bg-amber-600 text-white" : ""}`}><CheckCircle2 className="mr-1 inline h-3 w-3" />{label}</button>;
}

function CouponFormModal({ form, errors, editing, onChange, onClose, onSave }: { form: typeof blankCoupon; errors: FormErrors; editing: boolean; onChange: (form: typeof blankCoupon) => void; onClose: () => void; onSave: () => void }) {
  return (
    <AdminModalShell
      className="max-w-3xl"
      header={<div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.24em] text-amber-600">Coupon Setup</p><h2 className="text-2xl font-semibold">{editing ? "Edit Coupon" : "Add Coupon"}</h2><p className="mt-1 text-sm text-slate-500">Set discount type, validity and usage limits.</p></div><button onClick={onClose} className="admin-icon-button rounded-xl p-2"><X size={18} /></button></div>}
      footer={<div className="flex flex-wrap justify-end gap-3"><button onClick={onClose} className="rounded-full border px-5 py-3 text-sm font-medium">Cancel</button><button onClick={onSave} className="rounded-full bg-amber-600 px-6 py-3 text-sm font-medium text-white"><TicketPercent className="mr-2 inline h-4 w-4" />{editing ? "Update Coupon" : "Save Coupon"}</button></div>}
    >
      <div className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Coupon code" error={errors.code} placeholder="HIGHGRADE10" maxLength={40} value={form.code} onChange={(e) => onChange({ ...form, code: e.target.value.toUpperCase() })} />
          <Field label="Title" error={errors.title} placeholder="Launch offer" maxLength={120} value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Select label="Discount type" value={form.discountType} onChange={(e) => onChange({ ...form, discountType: e.target.value as "percentage" | "flat" })}><option value="percentage">Percentage</option><option value="flat">Flat amount</option></Select>
          <Field label={form.discountType === "percentage" ? "Discount %" : "Flat discount"} error={errors.discountValue} type="number" min={0} max={form.discountType === "percentage" ? 100 : undefined} value={form.discountValue} onChange={(e) => onChange({ ...form, discountValue: Number(e.target.value) })} />
          <Field label="Max discount" error={errors.maxDiscount} type="number" min={0} value={form.maxDiscount} onChange={(e) => onChange({ ...form, maxDiscount: Number(e.target.value) })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Minimum order" error={errors.minOrderAmount} type="number" min={0} value={form.minOrderAmount} onChange={(e) => onChange({ ...form, minOrderAmount: Number(e.target.value) })} />
          <Field label="Total uses" error={errors.usageLimit} type="number" min={0} value={form.usageLimit} onChange={(e) => onChange({ ...form, usageLimit: Number(e.target.value) })} />
          <Field label="Per user limit" error={errors.perUserLimit} type="number" min={0} value={form.perUserLimit} onChange={(e) => onChange({ ...form, perUserLimit: Number(e.target.value) })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Valid from" error={errors.validFrom} type="datetime-local" value={form.validFrom} onChange={(e) => onChange({ ...form, validFrom: e.target.value })} />
          <Field label="Valid to" error={errors.validTo} type="datetime-local" value={form.validTo} onChange={(e) => onChange({ ...form, validTo: e.target.value })} />
        </div>
        <Toggle label={form.isActive ? "Active coupon" : "Inactive coupon"} checked={form.isActive} onChange={(value) => onChange({ ...form, isActive: value })} />
      </div>
    </AdminModalShell>
  );
}

function OrderTable({ rows, pagination, onView, onPrint, onDelete, onStatus }: { rows: Order[]; pagination?: TablePagination; onView: (order: Order) => void; onPrint: (order: Order) => void; onDelete: (order: Order) => void; onStatus: (order: Order, status: Order["status"]) => void }) {
  return <DataTable heads={["Order", "Customer", "Product", "Amount", "Payment", "Status", "Actions"]} pagination={pagination} rows={rows.map((order) => ({ onClick: () => onView(order), cells: [order.id, <div key={order.dbId}><p>{order.customer}</p><p className="text-xs text-slate-500">{order.phone}</p></div>, order.product, money(order.amount), <StatusPill key={order.dbId} tone={order.paymentStatus === "Paid" ? "green" : "amber"}>{order.paymentStatus}</StatusPill>, <Select key={order.dbId} value={order.status} onChange={(e) => onStatus(order, e.target.value as Order["status"])}>{["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => <option key={status}>{status}</option>)}</Select>, <div key={order.dbId} className="flex gap-2"><button onClick={() => onView(order)} className="text-amber-600"><Eye size={16} /></button><button onClick={() => onPrint(order)} className="text-amber-600"><Printer size={16} /></button><button onClick={() => onDelete(order)} className="text-amber-600"><Trash2 size={16} /></button></div>] }))} />;
}

function EnquiryList({ items, pagination, onView, onStatus, onDelete }: { items: Enquiry[]; pagination?: TablePagination; onView: (item: Enquiry) => void; onStatus: (item: Enquiry, status: Enquiry["status"]) => void; onDelete: (item: Enquiry) => void }) {
  return <DataTable heads={["Name", "Phone", "Program", "Source", "Status", "Actions"]} pagination={pagination} rows={items.map((item) => ({ onClick: () => onView(item), cells: [<button key={item.id} onClick={() => onView(item)} className="text-left font-medium">{item.name}</button>, <a key={item.id} className="text-amber-600" href={`tel:${item.phone}`}>{item.phone}</a>, item.program, item.source, <Select key={item.id} value={item.status} onChange={(e) => onStatus(item, e.target.value as Enquiry["status"])}>{["New", "Contacted", "Converted", "Closed"].map((status) => <option key={status}>{status}</option>)}</Select>, <div key={item.id} className="flex gap-2"><button onClick={() => onView(item)} className="text-amber-600"><Eye size={16} /></button><a className="text-green-600" href={`https://wa.me/${item.phone}`} target="_blank" rel="noreferrer">Talk</a><button onClick={() => onDelete(item)} className="text-amber-600"><Trash2 size={16} /></button></div>] }))} />;
}

function OrderModal({ order, onClose, onPrint, onDelete, onStatus }: { order: Order; onClose: () => void; onPrint: (order: Order) => void; onDelete: (order: Order) => void; onStatus: (order: Order, status: Order["status"]) => void }) {
  return (
    <AdminModalShell
      className="max-w-2xl"
      header={<div className="flex justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.24em] text-amber-600">Order Details</p><h2 className="text-2xl font-semibold">{order.id}</h2></div><button onClick={onClose} className="admin-icon-button rounded-xl p-2"><X size={18} /></button></div>}
      footer={<div className="flex flex-wrap gap-2"><button onClick={() => onStatus(order, "Delivered")} className="rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white">Mark Delivered</button><button onClick={() => onPrint(order)} className="rounded-full border px-5 py-3 text-sm">Print Invoice</button><button onClick={() => { onDelete(order); onClose(); }} className="rounded-full border px-5 py-3 text-sm text-amber-600">Delete</button></div>}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {[["Customer", order.customer], ["Phone", order.phone], ["Email", order.email], ["Product", order.product], ["Amount", money(order.amount)], ["Invoice", order.invoiceNumber || "-"], ["Delivery", order.deliveryMode], ["Address", order.deliveryAddress || "-"], ["Notes", order.notes || "-"]].map(([label, value]) => <div key={label} className="admin-soft-panel rounded-2xl border p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold">{value}</p></div>)}
      </div>
    </AdminModalShell>
  );
}

function UserModal({ member, orders, onClose }: { member: Member; orders: Order[]; onClose: () => void }) {
  return (
    <AdminModalShell
      className="max-w-3xl"
      header={<div className="flex justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.24em] text-amber-600">Client Profile</p><h2 className="text-2xl font-semibold">{member.name}</h2></div><button onClick={onClose} className="admin-icon-button rounded-xl p-2"><X size={18} /></button></div>}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {[["Email", member.email], ["Phone", member.phone], ["Plan", member.plan], ["Goal", member.goal], ["Orders", String(member.orderCount)], ["Spent", money(member.totalSpent)]].map(([label, value]) => <div key={label} className="admin-soft-panel rounded-2xl border p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold">{value}</p></div>)}
      </div>
      <h3 className="mt-6 text-lg font-semibold">Order history</h3>
      <OrderTable rows={orders} onView={() => undefined} onPrint={() => undefined} onDelete={() => undefined} onStatus={() => undefined} />
    </AdminModalShell>
  );
}

function EnquiryModal({ item, onClose, onStatus }: { item: Enquiry; onClose: () => void; onStatus: (item: Enquiry, status: Enquiry["status"]) => void }) {
  return (
    <AdminModalShell
      className="max-w-xl"
      header={<div className="flex justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.24em] text-amber-600">Enquiry Detail</p><h2 className="text-2xl font-semibold">{item.name}</h2></div><button onClick={onClose} className="admin-icon-button rounded-xl p-2"><X size={18} /></button></div>}
      footer={<div className="flex flex-wrap gap-2"><a href={`tel:${item.phone}`} className="rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white">Call</a><a href={`https://wa.me/${item.phone}`} target="_blank" rel="noreferrer" className="rounded-full border px-5 py-3 text-sm">WhatsApp</a><button onClick={() => onStatus(item, "Contacted")} className="rounded-full border px-5 py-3 text-sm">Mark Contacted</button><button onClick={() => onStatus(item, "Converted")} className="rounded-full border px-5 py-3 text-sm">Converted</button></div>}
    >
      <div className="space-y-3 text-sm">
        <p><strong>Phone:</strong> {item.phone}</p>
        <p><strong>Email:</strong> {item.email || "-"}</p>
        <p><strong>Program:</strong> {item.program}</p>
        <p><strong>Source:</strong> {item.source}</p>
        <p><strong>Message:</strong> {item.message || "-"}</p>
      </div>
    </AdminModalShell>
  );
}
