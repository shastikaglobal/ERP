import { useNavigate } from "react-router-dom";
import { Loader2, QrCode, Plus, ScanLine, Printer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { supabase } from "@/integrations/supabase/client";

export default function BarcodesList() {
  const nav = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["batch_barcodes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("batch_barcodes")
        .select(
          "id, code, level, box_number, current_location, status, scan_count, last_scanned_at, created_at, batch:inventory_batches(lot_number, grade, product:products(name), farmer:farmers(full_name))"
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  return (
    <div>
      <PageHeader
        title="Barcodes"
        description="QR codes generated from QC-approved batches"
        breadcrumbs={[{ label: "Barcode & Tracking" }, { label: "Barcodes" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => nav("/barcodes/scan")}>
              <ScanLine className="h-4 w-4 mr-1.5" /> Scan
            </Button>
            <Button size="sm" className="btn-gold" onClick={() => nav("/barcodes/generate")}>
              <Plus className="h-4 w-4 mr-1.5" /> Generate QR
            </Button>
          </div>
        }
      />
      {isLoading ? (
        <div className="erp-card flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<QrCode className="h-5 w-5" />}
          title="No barcodes yet"
          description="Generate a QR code for any batch that has passed QC."
          action={
            <Button size="sm" className="btn-gold" onClick={() => nav("/barcodes/generate")}>
              <Plus className="h-4 w-4 mr-1.5" /> Generate QR
            </Button>
          }
        />
      ) : (
        <DataTable
          data={data}
          searchKeys={["code"] as any}
          columns={[
            {
              key: "code",
              header: "Code",
              render: (r: any) => <span className="font-mono text-xs text-primary-glow">{r.code}</span>,
            },
            {
              key: "level",
              header: "Type",
              render: (r: any) => (
                <span className="text-xs capitalize">
                  {r.level}
                  {r.box_number != null ? ` · #${r.box_number}` : ""}
                </span>
              ),
            },
            {
              key: "lot",
              header: "Lot",
              render: (r: any) => <span className="font-mono text-xs">{r.batch?.lot_number || "—"}</span>,
            },
            {
              key: "product",
              header: "Product",
              render: (r: any) => <span className="font-medium">{r.batch?.product?.name || "—"}</span>,
            },
            {
              key: "grade",
              header: "Grade",
              render: (r: any) => r.batch?.grade || "—",
            },
            {
              key: "loc",
              header: "Location",
              render: (r: any) => <StatusBadge status={r.current_location} />,
            },
            {
              key: "scans",
              header: "Scans",
              render: (r: any) => <span className="tabular-nums text-sm">{r.scan_count}</span>,
            },
            {
              key: "actions",
              header: "",
              render: (r: any) => (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => nav(`/barcodes/${r.id}`)}
                  className="h-7 px-2"
                >
                  <Printer className="h-3.5 w-3.5 mr-1" /> Print
                </Button>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
