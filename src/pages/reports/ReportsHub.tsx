import { PageHeader } from "@/components/shared/PageHeader";
import Card from "@/components/Card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Package, 
  Truck, 
  Container, 
  AlertTriangle, 
  Calendar, 
  CheckCircle,
  ArrowRight
} from "lucide-react";

const reports = [
  {
    id: "stock-summary",
    title: "Stock Summary Report",
    description: "Overview of warehouse inventory levels, stock status, and product distribution",
    icon: Package,
    color: "from-blue-500 to-blue-600",
    path: "/reports/stock-summary",
  },
  {
    id: "batch-tracking",
    title: "Batch Tracking Report",
    description: "Monitor individual batch movements, status changes, and quality metrics",
    icon: BarChart3,
    color: "from-purple-500 to-purple-600",
    path: "/reports/batch-tracking",
  },
  {
    id: "dispatch",
    title: "Dispatch Report",
    description: "Track shipments, delivery status, and customer orders",
    icon: Truck,
    color: "from-green-500 to-green-600",
    path: "/reports/dispatch",
  },
  {
    id: "container-loading",
    title: "Container Loading Report",
    description: "Monitor container utilization, loading status, and seal numbers",
    icon: Container,
    color: "from-orange-500 to-orange-600",
    path: "/reports/container-loading",
  },
  {
    id: "damage-wastage",
    title: "Damage/Wastage Report",
    description: "Monitor damaged, rejected, and quarantined inventory items",
    icon: AlertTriangle,
    color: "from-red-500 to-red-600",
    path: "/reports/damage-wastage",
  },
  {
    id: "inventory-aging",
    title: "Inventory Aging Report",
    description: "Monitor how long inventory items have been in storage",
    icon: Calendar,
    color: "from-yellow-500 to-yellow-600",
    path: "/reports/inventory-aging",
  },
  {
    id: "export-ready",
    title: "Export Ready Stock Report",
    description: "Monitor inventory that has passed QC and is ready for export",
    icon: CheckCircle,
    color: "from-emerald-500 to-emerald-600",
    path: "/reports/export-ready",
  },
];

export default function ReportsHub() {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Reports & Analytics"
        description="Comprehensive warehouse and inventory insights. Monitor inventory movements, track stock availability, analyze warehouse performance, and generate operational reports."
        breadcrumbs={[{ label: "Reports" }, { label: "Dashboard" }]}
      />

      <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <h3 className="font-semibold mb-2">Available Reports</h3>
        <p className="text-sm text-muted-foreground">
          Access detailed reports on inventory, shipments, and warehouse operations. Each report includes filtering options and export functionality.
        </p>
      </Card>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card 
              key={report.id} 
              className="p-6 hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => navigate(report.path)}
            >
              {/* Icon Background */}
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${report.color} p-2.5 mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="h-full w-full text-white" />
              </div>

              {/* Content */}
              <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                {report.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {report.description}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  View Report
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats Section */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Report Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary"></span>
              Advanced Filtering
            </h4>
            <p className="text-sm text-muted-foreground">
              Filter reports by date range, warehouse, product, status, and more to focus on the data that matters most.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary"></span>
              Export to CSV
            </h4>
            <p className="text-sm text-muted-foreground">
              Export all report data to CSV format for analysis in spreadsheet applications and data tools.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary"></span>
              Real-time Data
            </h4>
            <p className="text-sm text-muted-foreground">
              All reports display real-time data from your warehouse management system with automatic updates.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary"></span>
              Summary Analytics
            </h4>
            <p className="text-sm text-muted-foreground">
              View key metrics, charts, and breakdowns to quickly understand warehouse performance.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
