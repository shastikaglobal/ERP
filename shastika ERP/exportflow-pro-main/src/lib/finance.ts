import { supabase } from "@/integrations/supabase/client";

export type InvoiceRecord = {
  id: string;
  company_id: string;
  order_id: string | null;
  customer: string;
  amount: number;
  currency: string;
  status: string;
  issued_at: string | null;
  due_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentRecord = {
  id: string;
  company_id: string;
  invoice_id: string | null;
  customer: string;
  amount: number;
  currency: string;
  method: string | null;
  status: string;
  received_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function getInvoices(): Promise<InvoiceRecord[]> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load invoices: ${error.message}`);
  }

  return (data ?? []) as InvoiceRecord[];
}

export async function getPayments(): Promise<PaymentRecord[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load payments: ${error.message}`);
  }

  return (data ?? []) as PaymentRecord[];
}

export async function seedFinanceData(company_id: string) {
  // Insert 1 invoice
  const { data: invData, error: invErr } = await supabase
    .from("invoices")
    .insert({
      company_id,
      order_id: "SO-2025-0089",
      customer: "Mumbai Textiles Ltd",
      amount: 48500,
      currency: "USD",
      status: "Pending",
      due_at: "2025-05-16T00:00:00Z"
    })
    .select()
    .single();

  if (invErr) throw invErr;

  // Insert 1 payment
  const { error: payErr } = await supabase
    .from("payments")
    .insert({
      company_id,
      invoice_id: invData.id,
      customer: "Osaka Electronics",
      amount: 215000,
      currency: "USD",
      method: "Wire Transfer",
      status: "Completed",
      received_at: "2025-04-20T00:00:00Z"
    });

  if (payErr) throw payErr;
}
