import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import LeadActivities from "./pages/crm/Activities";
import LeadsList from "./pages/crm/LeadsList";
import FollowUps from "./pages/crm/FollowUps";
import { FollowUpReminders } from "./components/crm/FollowUpReminders";
import LeadDetail from "./pages/crm/LeadDetail";
import LeadPipeline from "./pages/crm/Pipeline";
import EmailIntegration from "./pages/crm/EmailIntegration";
import CompleteProfile from "./pages/CompleteProfile";
import WaitingApproval from "./pages/WaitingApproval";
import Pending from "./pages/Pending";
import InvoicePreview from "./pages/documents/InvoicePreview";
import PackingListPreview from "./pages/documents/PackingListPreview";
import CertificatePreview from "./pages/documents/CertificatePreview";

// Dashboards
import Executive from "./pages/dashboards/Executive";
import SalesAnalytics from "./pages/dashboards/SalesAnalytics";
import ShipmentAnalytics from "./pages/dashboards/ShipmentAnalytics";
import FinancialOverview from "./pages/dashboards/FinancialOverview";
import EmployeeProductivity from "./pages/dashboards/EmployeeProductivity";
import FinanceTally from "./pages/dashboards/FinanceTally";
import BdeDashboard from "./pages/dashboards/BdeDashboard";

// Farmers
import FarmersList from "./pages/farmers/FarmersList";
import CreateFarmer from "./pages/farmers/CreateFarmer";
import FarmerDetail from "./pages/farmers/FarmerDetail";
import ConvertToCustomer from "./pages/farmers/ConvertToCustomer";

// Procurement (live)
import PurchaseOrdersListLive from "./pages/procurement/PurchaseOrdersListLive";
import CreatePOLive from "./pages/procurement/CreatePOLive";
import SuppliersList from "./pages/procurement/SuppliersList";
import SupplierDetail from "./pages/procurement/SupplierDetail";
import SupplierAnalytics from "./pages/procurement/SupplierAnalytics";

import InspectionsList from "./pages/qc/InspectionsList";
import CreateInspection from "./pages/qc/CreateInspection";
import QCApprovals from "./pages/qc/QCApprovals";

// Barcode & Tracking
import BarcodesList from "./pages/barcodes/BarcodesList";
import GenerateBarcode from "./pages/barcodes/GenerateBarcode";
import ScanBarcode from "./pages/barcodes/ScanBarcode";
import BarcodeDetail from "./pages/barcodes/BarcodeDetail";

// Inventory
import ProductCatalog from "./pages/inventory/ProductCatalog";
import CreateProduct from "./pages/inventory/CreateProduct";
import StockDashboard from "./pages/inventory/StockDashboard";
import StockMovements from "./pages/inventory/StockMovements";
import Warehouses from "./pages/inventory/Warehouses";
import LowStockAlerts from "./pages/inventory/LowStockAlerts";

// Quotations
import QuotationsList from "./pages/quotations/QuotationsList";
import CreateQuotation from "./pages/quotations/CreateQuotation";
import QuotationPreview from "./pages/quotations/QuotationPreview";
import PublicQuotationView from "./pages/quotations/PublicQuotationView";
import QuotationApprovals from "./pages/quotations/Approvals";
import QuotationReport from "./pages/quotations/QuotationReport";
import ConvertQuotation from "./pages/quotations/Convert";
import EditQuotation from "./pages/quotations/EditQuotation";

// Orders
import OrdersList from "./pages/orders/OrdersList";
import OrderDetail from "./pages/orders/OrderDetail";
import CreateOrder from "./pages/orders/CreateOrder";
import OrderStatus from "./pages/orders/OrderStatus";
import Fulfillment from "./pages/orders/Fulfillment";

// Shipments
import ShipmentsList from "./pages/shipments/ShipmentsList";
import CreateShipment from "./pages/shipments/CreateShipment";
import ShipmentDetail from "./pages/shipments/ShipmentDetail";
import ContainerTracking from "./pages/shipments/ContainerTracking";
import DeliveryStatus from "./pages/shipments/DeliveryStatus";

// Documents
import Invoices from "./pages/documents/Invoices";
import PackingLists from "./pages/documents/PackingLists";
import Certificates from "./pages/documents/Certificates";
import DocumentViewer from "./pages/documents/DocumentViewer";
import InvoiceReport from "./pages/documents/InvoiceReport";

// Payments
import PaymentsRegister from "./pages/payments/PaymentsRegister";
import OverduePayments from "./pages/payments/OverduePayments";
import Ledger from "./pages/payments/Ledger";
import FinancialReports from "./pages/payments/FinancialReports";

// Employees
import EmployeeDirectory from "./pages/employees/EmployeeDirectory";
import Attendance from "./pages/employees/Attendance";
import RolesPermissions from "./pages/employees/RolesPermissions";

// System
import Notifications from "./pages/system/Notifications";
import ActivityLogs from "./pages/system/ActivityLogs";
import Subscriptions from "./pages/system/Subscriptions";
import Settings from "./pages/system/Settings";
import Maintenance from "./pages/system/Maintenance";
import ZohoIntegration from "./pages/system/ZohoIntegration";
import Mailbox from "./pages/system/Mailbox";
import TallyIndex from "./pages/Tally/index";
import JournalEntry from "./pages/Tally/JournalEntry";

const queryClient = new QueryClient();

const DashboardRedirect = () => {
  const { roleSlugs, profile } = useAuth();
  const isSecretary = roleSlugs.has("secretary");
  const isBde = roleSlugs.has("bd") ||
    roleSlugs.has("bde") ||
    (profile?.requested_role && ["bd", "bde"].includes(profile.requested_role.toLowerCase()));
  if (isSecretary) return <Navigate to="/dashboards/finance-tally" replace />;
  if (isBde) return <Navigate to="/dashboards/bde" replace />;
  return <Navigate to="/dashboards/executive" replace />;
};

const RootRedirect = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const code = searchParams.get("code");
  const hash = location.hash;

  if (code || hash.includes("access_token") || hash.includes("error")) {
    return <Navigate to={`/auth/callback${location.search}${location.hash}`} replace />;
  }

  return <Navigate to="/auth" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <FollowUpReminders />
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/pending" element={<Pending />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/waiting-approval" element={<WaitingApproval />} />
            <Route path="/select-profile" element={<Navigate to="/dashboard" replace />} />

            {/* Public / Standalone Preview Routes (no AppLayout) */}
            <Route path="/invoices/:id/preview" element={<InvoicePreview />} />
            <Route path="/packing-lists/:id/preview" element={<PackingListPreview />} />
            <Route path="/documents/packing-lists/:id/preview" element={<PackingListPreview />} />
            <Route path="/documents/commercial-invoices/:id/preview" element={<InvoicePreview />} />
            <Route path="/certificates/:id/preview" element={<CertificatePreview />} />
            <Route path="/share/quote/:id" element={<PublicQuotationView />} />

            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardRedirect />} />
              <Route path="/approvals" element={<Navigate to="/employees/roles" replace />} />

              {/* Dashboards */}
              <Route path="/dashboards/executive" element={<Executive />} />
              <Route path="/dashboards/finance-tally" element={<FinanceTally />} />
              <Route path="/dashboards/bde" element={<BdeDashboard />} />
              <Route path="/dashboards/sales" element={<SalesAnalytics />} />
              <Route path="/dashboards/shipments" element={<ShipmentAnalytics />} />
              <Route path="/dashboards/financial" element={<FinancialOverview />} />
              <Route path="/dashboards/employees" element={<EmployeeProductivity />} />

              {/* Farmers */}
              <Route path="/farmers" element={<FarmersList />} />
              <Route path="/farmers/create" element={<CreateFarmer />} />
              <Route path="/farmers/convert" element={<ConvertToCustomer />} />
              <Route path="/farmers/:id" element={<FarmerDetail />} />

              {/* Procurement */}
              <Route path="/procurement/orders" element={<PurchaseOrdersListLive />} />
              <Route path="/procurement/orders/create" element={<CreatePOLive />} />
              <Route path="/procurement/suppliers" element={<SuppliersList />} />
              <Route path="/procurement/suppliers/:id" element={<SupplierDetail />} />
              <Route path="/procurement/analytics" element={<SupplierAnalytics />} />

              {/* Quality Control */}
              <Route path="/qc/inspections" element={<InspectionsList />} />
              <Route path="/qc/inspections/create" element={<CreateInspection />} />
              <Route path="/qc/approvals" element={<QCApprovals />} />

              {/* Barcode & Tracking */}
              <Route path="/barcodes" element={<BarcodesList />} />
              <Route path="/barcodes/generate" element={<GenerateBarcode />} />
              <Route path="/barcodes/scan" element={<ScanBarcode />} />
              <Route path="/barcodes/:id" element={<BarcodeDetail />} />

              {/* Inventory */}
              <Route path="/inventory/products" element={<ProductCatalog />} />
              <Route path="/inventory/products/create" element={<CreateProduct />} />
              <Route path="/inventory/stock" element={<StockDashboard />} />
              <Route path="/inventory/movements" element={<StockMovements />} />
              <Route path="/inventory/warehouses" element={<Warehouses />} />
              <Route path="/inventory/alerts" element={<LowStockAlerts />} />

              {/* Quotations */}
              <Route path="/quotations" element={<QuotationsList />} />
              <Route path="/quotations/create" element={<CreateQuotation />} />
              <Route path="/quotations/edit/:id" element={<EditQuotation />} />
              <Route path="/quotations/approvals" element={<QuotationApprovals />} />
              <Route path="/quotations/convert" element={<ConvertQuotation />} />
              <Route path="/quotations/:id" element={<QuotationPreview />} />
              <Route path="/quotations/:id/report" element={<QuotationReport />} />

              {/* CRM */}
              <Route path="/crm/activities" element={<LeadActivities />} />
              <Route path="/crm/leads" element={<LeadsList />} />
              <Route path="/crm/follow-ups" element={<FollowUps />} />
              <Route path="/crm/leads/:id" element={<LeadDetail />} />
              <Route path="/crm/pipeline" element={<LeadPipeline />} />
              <Route path="/crm/email" element={<EmailIntegration />} />

              {/* Orders */}
              <Route path="/orders" element={<OrdersList />} />
              <Route path="/orders/create" element={<CreateOrder />} />
              <Route path="/orders/status" element={<OrderStatus />} />
              <Route path="/orders/fulfillment" element={<Fulfillment />} />
              <Route path="/orders/:id" element={<OrderDetail />} />

              {/* Shipments */}
              <Route path="/shipments" element={<ShipmentsList />} />
              <Route path="/shipments/create" element={<CreateShipment />} />
              <Route path="/shipments/:id" element={<ShipmentDetail />} />
              <Route path="/shipments/containers" element={<ContainerTracking />} />
              <Route path="/shipments/delivery" element={<DeliveryStatus />} />

              {/* Documents */}
              <Route path="/documents" element={<Navigate to="/documents/invoices" replace />} />
              <Route path="/documents/invoices" element={<Invoices />} />
              <Route path="/documents/invoices/:id" element={<InvoiceReport />} />
              <Route path="/documents/packing-lists" element={<PackingLists />} />
              <Route path="/documents/commercial-invoices" element={<Invoices />} />
              <Route path="/documents/certificates" element={<Certificates />} />
              <Route path="/documents/viewer" element={<DocumentViewer />} />

              {/* Payments */}
              <Route path="/payments" element={<PaymentsRegister />} />
              <Route path="/payments/overdue" element={<OverduePayments />} />
              <Route path="/payments/ledger" element={<Ledger />} />
              <Route path="/payments/reports" element={<FinancialReports />} />

              {/* Tally */}
              <Route path="/tally/*" element={<TallyIndex />} />
              <Route path="/journal" element={<JournalEntry />} />
              <Route path="/gst-reports" element={<Navigate to="/tally/gst-reports" replace />} />

              {/* Employees */}
              <Route path="/employees" element={<EmployeeDirectory />} />
              <Route path="/employees/attendance" element={<Attendance />} />
              <Route path="/employees/roles" element={<RolesPermissions />} />

              {/* System */}
              <Route path="/system/notifications" element={<Notifications />} />
              <Route path="/system/logs" element={<ActivityLogs />} />
              <Route path="/system/subscriptions" element={<Subscriptions />} />
              <Route path="/system/settings" element={<Settings />} />
              <Route path="/system/maintenance" element={<Maintenance />} />
              <Route path="/system/integrations/zoho" element={<ZohoIntegration />} />
              <Route path="/system/mailbox" element={<Mailbox />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;