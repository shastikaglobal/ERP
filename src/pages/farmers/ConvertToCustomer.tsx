import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

// Minimal Farmer type for demo
interface Farmer {
  id: string;
  full_name: string;
  is_customer?: boolean;
}

export default function ConvertToCustomer() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);

  // Fetch farmers on mount (exclude soft-deleted)
  useEffect(() => {
    let mounted = true
    setLoading(true);
    supabase
      .from("farmers")
      .select("id, full_name, is_customer")
      .neq('is_deleted', true)
      .order('full_name', { ascending: true })
      .then(({ data, error }) => {
        if (!mounted) return
        if (error) {
          console.error('Failed to load farmers', error)
          setFarmers([])
        } else {
          setFarmers(data || [])
        }
        setLoading(false);
      });
    return () => { mounted = false }
  }, []);

  const handleConvert = async (id: string) => {
    setConverting(id);
    // Simulate conversion: update is_customer to true
    await supabase.from("farmers").update({ is_customer: true }).eq("id", id);
    setFarmers((prev) =>
      prev.map((f) => (f.id === id ? { ...f, is_customer: true } : f))
    );
    setConverting(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Convert Farmer to Customer</h1>
      <p className="mb-6 text-muted-foreground">Here you can convert farmers into customers.</p>
      {loading ? (
        <div>Loading farmers...</div>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border px-4 py-2 text-left">Name</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {farmers.map((farmer) => (
              <tr key={farmer.id}>
                <td className="border px-4 py-2">{farmer.full_name}</td>
                <td className="border px-4 py-2">
                  {farmer.is_customer ? (
                    <span className="text-green-600">Customer</span>
                  ) : (
                    <span className="text-yellow-600">Farmer</span>
                  )}
                </td>
                <td className="border px-4 py-2">
                  <Button
                    size="sm"
                    disabled={!!farmer.is_customer || converting === farmer.id}
                    onClick={() => handleConvert(farmer.id)}
                  >
                    {farmer.is_customer
                      ? "Already Customer"
                      : converting === farmer.id
                      ? "Converting..."
                      : "Convert to Customer"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
