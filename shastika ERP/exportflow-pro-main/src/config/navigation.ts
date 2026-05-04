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
  Bell, ScrollText, CreditCard, Settings
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
    ],
  },
  {
    title: "Farmers",
    icon: Users,
    items: [
      {
        title: "Farmers List",
        url: "/farmers",
        icon: Users
      },
      {
        title: "Create Farmer",
        url: "/farmers/create",
        icon: UserPlus
        },
        {
          title: "Customers",
          url: "/customers",
          icon: UserCheck
      }
    ]
  },
  {
    title: "CRM",
    icon: Users,
    items: [
      { title: "Activities", url: "/crm/activities", icon: CalendarCheck },
      { title: "Leads", url: "/crm/leads", icon: UserCheck },
      { title: "Pipeline", url: "/crm/pipeline", icon: GitBranch },
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
      { title: "Quotations", url: "/quotations", icon: FileText },
      { title: "Create Quotation", url: "/quotations/create", icon: FilePlus },
      { title: "Approvals", url: "/quotations/approvals", icon: FileCheck },
      { title: "Convert to Order", url: "/quotations/convert", icon: ArrowRightLeft },
    ],
  },
  {
    title: "Export Orders",
    icon: ShoppingCart,
    items: [
      { title: "Orders", url: "/orders", icon: ShoppingCart },
      { title: "Create Order", url: "/orders/create", icon: ClipboardList },
      { title: "Status Tracking", url: "/orders/status", icon: PackageCheck },
      { title: "Fulfillment", url: "/orders/fulfillment", icon: Package2 },
    ],
  },
  {
    title: "Shipments",
    icon: Ship,
    items: [
      { title: "Shipment Register", url: "/shipments", icon: Ship },
      { title: "Create Shipment", url: "/shipments/create", icon: FilePlus },
      { title: "Container Tracking", url: "/shipments/containers", icon: Container },
      { title: "Delivery Status", url: "/shipments/delivery", icon: Navigation },
    ],
  },
  {
    title: "Documents",
    icon: FileSpreadsheet,
    items: [
      { title: "Invoices", url: "/documents/invoices", icon: FileSpreadsheet },
      { title: "Packing Lists", url: "/documents/packing-lists", icon: FileBox },
      { title: "Certificate of Origin", url: "/documents/certificates", icon: Award },
      { title: "Bill of Lading", url: "/documents/bills-of-lading", icon: BookOpen },
      { title: "Document Viewer", url: "/documents/viewer", icon: Eye },
    ],
  },
  {
    title: "Finance",
    icon: Wallet,
    items: [
      { title: "Payment Register", url: "/payments", icon: Receipt },
      { title: "Overdue", url: "/payments/overdue", icon: AlertCircle },
      { title: "Multi-Currency Ledger", url: "/payments/ledger", icon: Coins },
      { title: "Financial Reports", url: "/payments/reports", icon: BarChart3 },
    ],
  },
  {
    title: "HR & Employees",
    icon: UsersRound,
    items: [
      { title: "User Approvals", url: "/approvals", icon: ShieldCheck },
      { title: "Directory", url: "/employees", icon: UsersRound },
      { title: "Attendance", url: "/employees/attendance", icon: CalendarCheck },
      { title: "Roles & Permissions", url: "/employees/roles", icon: ShieldCheck },
    ],
  },
  {
    title: "System",
    icon: Settings,
    items: [
      { title: "Notifications", url: "/system/notifications", icon: Bell },
      { title: "Activity Logs", url: "/system/logs", icon: ScrollText },
      { title: "Subscriptions", url: "/system/subscriptions", icon: CreditCard },
      { title: "Settings", url: "/system/settings", icon: Settings },
    ],
  },
];
