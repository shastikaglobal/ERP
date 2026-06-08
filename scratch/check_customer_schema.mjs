import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://sxebygxpjzntogzpjnga.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZWJ5Z3hwanpudG9nenBqbmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMjc5MzksImV4cCI6MjA5MjkwMzkzOX0.rtClmtuPuNicVQvBkITzY6PfFsh8yOYq3ykWoL9Ab_4";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const { data: customerData } = await supabase.from('customers').select('*').limit(1);
  console.log("Customer Columns:", customerData ? Object.keys(customerData[0] || {}) : "No data");

  const { data: orderData } = await supabase.from('export_orders').select('*').limit(1);
  console.log("Export Order Columns:", orderData ? Object.keys(orderData[0] || {}) : "No data");
}
main();
