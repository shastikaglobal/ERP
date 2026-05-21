import React from "react";
import { useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function CommercialInvoicePreview() {
  const { id } = useParams();
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Commercial Invoice Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Preview for invoice ID: {id}</p>
        </CardContent>
      </Card>
    </div>
  );
}
