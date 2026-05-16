// Centralized navigation config for the AgriExportOS sidebar
import {
  LayoutDashboard, TrendingUp, Truck, DollarSign, Users, UserPlus,
  Sprout, MapPin, GitBranch, UserCheck,
  FileText, FilePlus, FileCheck, ArrowRightLeft,
  ShoppingCart, ClipboardList, PackageCheck, Package2, Boxes,
  Ship, Container, Navigation,
  Package, PackagePlus, Warehouse, AlertTriangle, History,
  Building2, Star, ShoppingBag,
  ClipboardCheck, FlaskConical, BadgeCheck,
  QrCode, ScanLine,
  FileSpreadsheet, FileBox, Award, BookOpen, Eye,
  Wallet, Receipt, AlertCircle, BarChart3, Coins,
  UsersRound, CalendarCheck, ShieldCheck,
  Bell, ScrollText, CreditCard, Settings, Mail, MinusSquare, Trash2, Inbox
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  permission?: string; // permission code required to see this item
};

export type NavGroup = {
  title: string;
  icon: LucideIcon;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    title: "Dashboards",
    icon: LayoutDashboard,
    items: [
      { title: "Executive", url: "/dashboards/executive", icon: LayoutDashboard },
      { title: "Sales Analytics", url: "/dashboards/sales", icon: TrendingUp },
      { title: "Shipment Analytics", url: "/dashboards/shipments", icon: Truck },
      { title: "Financial Overview", url: "/dashboards/financial", icon: DollarSign },
      { title: "Employee Productivity", url: "/dashboards/employees", icon: Users },
      { title: "Roles & Permissions", url: "/employees/roles", icon: ShieldCheck, permission: "settings.manage" },
    ],
  },
  {
    title: "Farmers",
    icon: Users,
    items: [
      { title: "Farmers List", url: "/farmers", icon: Users, permission: "farmers.view" },
      { title: "Create Farmer", url: "/farmers/create", icon: UserPlus, permission: "farmers.create" },
      { title: "Convert to Customer", url: "/farmers/convert", icon: UserCheck, permission: "farmers.manage" }
    ]
  },
  {
    title: "CRM",
    icon: Users,
    items: [
      { title: "Activities", url: "/crm/activities", icon: CalendarCheck, permission: "farmers.view" },
      { title: "Leads", url: "/crm/leads", icon: UserCheck, permission: "farmers.view" },
      { title: "Pipeline", url: "/crm/pipeline", icon: GitBranch, permission: "farmers.view" },
      { title: "Email Integration", url: "/crm/email", icon: Mail, permission: "farmers.view" },
      { title: "Zoho API Sync", url: "/system/integrations/zoho", icon: Mail, permission: "farmers.view" },
    ],
  },

  {
    title: "Procurement",
    icon: ShoppingBag,
    items: [
      { title: "Purchase Orders", url: "/procurement/orders", icon: ShoppingBag, permission: "procurement.view" },
      { title: "Create PO", url: "/procurement/orders/create", icon: FilePlus, permission: "procurement.create" },
      { title: "Suppliers", url: "/procurement/suppliers", icon: Building2 },
      { title: "Supplier Analytics", url: "/procurement/analytics", icon: Star },
    ],
  },
  {
    title: "Quality Control",
    icon: ClipboardCheck,
    items: [
      { title: "Inspections", url: "/qc/inspections", icon: ClipboardCheck, permission: "qc.view" },
      { title: "New Inspection", url: "/qc/inspections/create", icon: FlaskConical, permission: "qc.inspect" },
      { title: "Approvals", url: "/qc/approvals", icon: BadgeCheck, permission: "qc.approve" },
    ],
  },
  {
    title: "Barcode & Tracking",
    icon: QrCode,
    items: [
      { title: "Barcodes", url: "/barcodes", icon: QrCode, permission: "inventory.view" },
      { title: "Generate QR", url: "/barcodes/generate", icon: FilePlus, permission: "inventory.manage" },
      { title: "Scan", url: "/barcodes/scan", icon: ScanLine, permission: "inventory.view" },
    ],
  },
  {
    title: "Inventory",
    icon: Boxes,
    items: [
      { title: "Inventory Batches", url: "/inventory/stock", icon: Boxes, permission: "inventory.view" },
      { title: "Product Catalog", url: "/inventory/products", icon: Package },
      { title: "Add Product", url: "/inventory/products/create", icon: PackagePlus, permission: "inventory.manage" },
      { title: "Stock Movements", url: "/inventory/movements", icon: History },
      { title: "Warehouses", url: "/inventory/warehouses", icon: Warehouse },
      { title: "Low Stock Alerts", url: "/inventory/alerts", icon: AlertTriangle },
    ],
  },
  {
    title: "Quotations",
    icon: FileText,
    items: [
      { title: "Quotations", url: "/quotations", icon: FileText, permission: "orders.view" },
      { title: "Create Quotation", url: "/quotations/create", icon: FilePlus, permission: "orders.manage" },
      { title: "Approvals", url: "/quotations/approvals", icon: FileCheck, permission: "orders.manage" },
      { title: "Convert to Order", url: "/quotations/convert", icon: ArrowRightLeft, permission: "orders.manage" },
    ],
  },
  {
    title: "Export Orders",
    icon: ShoppingCart,
    items: [
      { title: "Orders", url: "/orders", icon: ShoppingCart, permission: "orders.view" },
      { title: "Create Order", url: "/orders/create", icon: ClipboardList, permission: "orders.manage" },
      { title: "Status Tracking", url: "/orders/status", icon: PackageCheck, permission: "orders.view" },
      { title: "Fulfillment", url: "/orders/fulfillment", icon: Package2, permission: "orders.manage" },
    ],
  },
  {
    title: "Shipments",
    icon: Ship,
    items: [
      { title: "Shipment Register", url: "/shipments", icon: Ship, permission: "shipments.view" },
      { title: "Create Shipment", url: "/shipments/create", icon: FilePlus, permission: "shipments.manage" },
      { title: "Container Tracking", url: "/shipments/containers", icon: Container, permission: "shipments.view" },
      { title: "Delivery Status", url: "/shipments/delivery", icon: Navigation, permission: "shipments.view" },
    ],
  },
  {
    title: "Documents",
    icon: FileSpreadsheet,
    items: [
      { title: "Invoices", url: "/documents/invoices", icon: FileSpreadsheet, permission: "orders.view" },
      { title: "Packing Lists", url: "/documents/packing-lists", icon: FileBox, permission: "shipments.view" },
      { title: "Certificate of Origin", url: "/documents/certificates", icon: Award, permission: "orders.view" },
      { title: "Document Viewer", url: "/documents/viewer", icon: Eye, permission: "orders.view" },
    ],
  },
  {
    title: "Finance",
    icon: Wallet,
    items: [
      { title: "Payment Register", url: "/payments", icon: Receipt, permission: "finance.view" },
      { title: "Overdue", url: "/payments/overdue", icon: AlertCircle, permission: "finance.view" },
      { title: "Multi-Currency Ledger", url: "/payments/ledger", icon: Coins, permission: "finance.manage" },
      { title: "Financial Reports", url: "/payments/reports", icon: BarChart3, permission: "finance.view" },
    ],
  },
  {
    title: "TALLY",
    icon: FileSpreadsheet,
    items: [
      { title: "Tally Module", url: "/tally", icon: FileSpreadsheet },
      { title: "Counts", url: "/tally/counts", icon: MinusSquare },
    ],
  },
  {
    title: "Accounts",
    icon: Wallet,
    items: [
      { title: "Journal Entry", url: "/tally/journal-entry", icon: FileText },
      { title: "Ledger", url: "/tally/ledger", icon: FileText },
      { title: "Trial Balance", url: "/tally/trial-balance", icon: FileText },
    ],
  },
  {
    title: "Reports",
    icon: BarChart3,
    items: [
      { title: "GST Reports", url: "/tally/gst-reports", icon: BarChart3 },
      { title: "P&L Statement", url: "/tally/pl-statement", icon: BarChart3 },
      { title: "Balance Sheet", url: "/tally/balance-sheet", icon: BarChart3 },
    ],
  },
  {
    title: "Masters",
    icon: Users,
    items: [
      { title: "Parties", url: "/tally/parties", icon: Users },
      { title: "Chart of Accounts", url: "/tally/chart-of-accounts", icon: Users },
    ],
  },
  {
    title: "HR & Employees",
    icon: UsersRound,
    items: [
      { title: "User Approvals", url: "/approvals", icon: ShieldCheck, permission: "hr.manage" },
      { title: "Directory", url: "/employees", icon: UsersRound, permission: "hr.view" },
      { title: "Attendance", url: "/employees/attendance", icon: CalendarCheck, permission: "hr.view" },
    ],
  },
  {
    title: "System",
    icon: Settings,
    items: [
      { title: "Notifications", url: "/system/notifications", icon: Bell, permission: "settings.view" },
      { title: "Activity Logs", url: "/system/logs", icon: ScrollText, permission: "settings.view" },
      { title: "Subscriptions", url: "/system/subscriptions", icon: CreditCard, permission: "settings.manage" },
      { title: "Settings", url: "/system/settings", icon: Settings, permission: "settings.manage" },
      { title: "Mailbox", url: "/system/mailbox", icon: Inbox, permission: "settings.manage" },
      { title: "Zoho Integration", url: "/system/integrations/zoho", icon: Mail, permission: "settings.manage" },
      { title: "System Reset", url: "/system/maintenance", icon: Trash2, permission: "settings.manage" },
    ],
  },
];



