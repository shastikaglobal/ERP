import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function CommercialInvoices() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Commercial Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">List of commercial invoices will be available here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
