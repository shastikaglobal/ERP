import { useQuery } from "@tanstack/react-query";
import { Users, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { supabase } from "@/integrations/supabase/client";

export default function CustomersList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div>
      <PageHeader 
        title="Customers" 
        description="View and manage all converted customers" 
        breadcrumbs={[{ label: "CRM" }, { label: "Customers" }]} 
      />

      {isLoading ? (
        <div className="erp-card flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md my-4">
          Error loading customers: {(error as Error).message}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No customers yet"
          description="Converted customers will appear here."
        />
      ) : (
        <DataTable
          data={data}
          searchKeys={["name", "country", "email", "phone", "address"]}
          columns={[
            { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "email", header: "Email", render: (r) => <span className="text-sm">{r.email || "—"}</span> },
            { key: "phone", header: "Phone", render: (r) => <span className="text-sm">{r.phone || "—"}</span> },
            { key: "address", header: "Location", render: (r) => <span className="text-sm">{r.address || r.country || "—"}</span> },
            { key: "crops", header: "Crops", render: (r) => <span className="text-sm text-muted-foreground">{(r.crops || []).join(", ") || "—"}</span> },
            { key: "date", header: "Added On", render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span> },
          ]}
        />
      )}
    </div>
  );
}
