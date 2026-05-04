import { Download, FileBarChart } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/FormShell";

const reports = [
  { name: "Profit & Loss Statement", desc: "Monthly P&L with year-over-year comparison" },
  { name: "Balance Sheet", desc: "Assets, liabilities and equity snapshot" },
  { name: "Cash Flow Statement", desc: "Operating, investing and financing activities" },
  { name: "Accounts Receivable Aging", desc: "Outstanding invoices by age bucket" },
  { name: "Accounts Payable Aging", desc: "Vendor invoices due breakdown" },
  { name: "Sales Tax Report", desc: "GST/VAT collected and payable" },
];

export default function FinancialReports() {
  return (
    <div>
      <PageHeader title="Financial Reports" description="Pre-built financial statements" breadcrumbs={[{ label: "Payments" }, { label: "Reports" }]} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => (
          <Section key={r.name}>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-md bg-primary-muted text-primary flex items-center justify-center shrink-0"><FileBarChart className="h-5 w-5" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{r.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{r.desc}</div>
                <Button variant="outline" size="sm" className="mt-3"><Download className="h-3.5 w-3.5 mr-1.5" />Generate</Button>
              </div>
            </div>
          </Section>
        ))}
      </div>
    </div>
  );
}
