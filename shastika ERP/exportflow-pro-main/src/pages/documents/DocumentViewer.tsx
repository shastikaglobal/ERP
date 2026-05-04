import { FileText, Download, Printer } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/FormShell";

export default function DocumentViewer() {
  return (
    <div>
      <PageHeader title="Document Viewer" description="Preview any export document" breadcrumbs={[{ label: "Documents" }, { label: "Viewer" }]}
        actions={<>
          <Button variant="outline" size="sm"><Printer className="h-4 w-4 mr-1.5" />Print</Button>
          <Button size="sm"><Download className="h-4 w-4 mr-1.5" />Download</Button>
        </>} />
      <Section>
        <div className="bg-muted/40 border border-border rounded-md min-h-[600px] flex flex-col items-center justify-center p-8">
          <div className="bg-card border border-border rounded-md shadow-sm w-full max-w-2xl p-12">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Commercial Invoice</div>
                <div className="font-bold">INV-2025-0156</div>
              </div>
            </div>
            <div className="text-sm space-y-3">
              <p className="text-muted-foreground">Document preview area. Select any document from another module to display it here.</p>
              <div className="border-t border-border pt-3 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-xs text-muted-foreground">From</div><div className="font-medium">Acme Exports Ltd</div></div>
                  <div><div className="text-xs text-muted-foreground">To</div><div className="font-medium">Mumbai Textiles Ltd</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
