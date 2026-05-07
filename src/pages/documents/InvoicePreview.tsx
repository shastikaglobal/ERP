import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import logo from "@/logo.webp";

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function InvoicePreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShipment = async () => {
      try {
        const { data, error } = await supabase
          .from("export_shipments")
          .select(`
            *,
            export_orders:order_id (*)
          `)
          .eq('id', id)
          .maybeSingle();
        
        if (error) {
          setFetchError(error.message);
          throw error;
        }
        setShipment(data);
      } catch (err: any) {
        setFetchError(err.message || 'Unknown error');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchShipment();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f0f0f0]">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  if (fetchError || !shipment) {
    return <div style={{color:'red', padding:'20px', background: '#f0f0f0', minHeight: '100vh'}}>Failed to load invoice. ID: {id}. Error: {fetchError || 'Not found'}</div>;
  }

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    if (window.opener) {
      window.close();
    } else {
      navigate('/documents/invoices');
    }
  };

  const order = (Array.isArray(shipment.export_orders) 
    ? shipment.export_orders[0] 
    : shipment.export_orders) || {};
    
  const today = formatDate(shipment?.created_at || new Date().toISOString());

  return (
    <div style={{ background: '#f0f0f0', color: 'black', minHeight: '100vh', paddingBottom: '40px' }} className="flex flex-col items-center print:p-0 print:bg-white">
      {/* Professional Theme - Top Toolbar */}
      <div className="fixed top-0 left-0 right-0 bg-[#1e1e1e] py-3 px-6 flex justify-between items-center no-print print:hidden z-[110] shadow-md">
        <Button onClick={handleBack} className="bg-gray-700 hover:bg-gray-600 text-white rounded-full h-9 px-4 text-sm border-none">
          ← Back to Invoices
        </Button>
        <div className="text-white font-bold tracking-wide">
          {order.order_number?.replace('EXP', 'PI') || 'PROFORMA INVOICE'}
        </div>
        <Button onClick={handlePrint} className="bg-[#1a472a] hover:bg-[#12331d] text-white rounded-full h-9 px-6 font-bold shadow-lg border-none">
          <Printer className="h-4 w-4 mr-2" /> Download PDF
        </Button>
      </div>

      <div className="relative w-full max-w-[210mm] mt-24 mb-12 print:mt-0 print:mb-0">
        {/* The Invoice Document */}
        <div className="bg-white text-black print:shadow-none shadow-[0_4px_24px_rgba(0,0,0,0.15)] min-h-[297mm] flex flex-col border-[1px] border-[#ccc] print:border-[#ccc] font-sans relative overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-2 border-b-[1px] border-[#ccc] h-[180px] relative z-10 bg-white">
            <div className="p-6 border-r-[1px] border-[#ccc] flex flex-col items-center justify-center text-center">
              <img src={logo} alt="Company Logo" style={{ height: '60px', width: 'auto', marginBottom: '8px' }} />
              <div className="flex items-center gap-4 mb-3">
                 <h1 className="text-black font-bold text-[20px] leading-[1.1] tracking-[1px]">SHASTIKA GLOBAL IMPEX<br/>PRIVATE LIMITED</h1>
              </div>
              <div className="text-[10px] leading-relaxed text-black">
                Address: 41/1, ST-5, Sathy Athani Main Road, Thuckanayakanpalayam,<br/>
                Erode - 638506, Tamil Nadu, India.<br/>
                Phone: <span className="font-bold">7397612015</span> | GSTIN: <span className="font-bold">33ABPCS0605LIZ8</span>
              </div>
            </div>
            <div className="p-6 flex flex-col items-center justify-center text-center relative">
              <h2 className="text-[#1a472a] font-bold text-[26px] mb-4 tracking-wider">PROFORMA INVOICE</h2>
              <div className="w-full max-w-[220px] space-y-1 text-[11px] text-left">
                <div className="flex justify-between"><span>PI NO:</span> <span className="font-bold underline">{order.order_number?.replace('EXP', 'PI') || '044/26-27'}</span></div>
                <div className="flex justify-between"><span>DATE:</span> <span className="font-bold">{today}</span></div>
                <div className="flex justify-between"><span>VALID PI DATE:</span> <span className="font-bold">{today}</span></div>
              </div>
            </div>
          </div>

          {/* Section Headers */}
          <div className="grid grid-cols-3 border-b-[1px] border-[#ccc] text-[10px] font-bold text-black bg-white">
            <div className="p-1.5 border-r-[1px] border-[#ccc] text-center border-b-[1px] border-[#ccc] uppercase tracking-wide">BILL TO :</div>
            <div className="p-1.5 border-r-[1px] border-[#ccc] text-center border-b-[1px] border-[#ccc] uppercase tracking-wide">SHIPMENT & TRADE TERMS</div>
            <div className="p-1.5 text-center border-b-[1px] border-[#ccc] uppercase tracking-wide">PACKING DETAILS</div>
          </div>

          {/* Section Content */}
          <div className="grid grid-cols-3 border-b-[1px] border-[#ccc] text-[11px] min-h-[140px]">
            <div className="p-4 border-r-[1px] border-[#ccc]">
              <div className="font-bold text-[13px] mb-1">{shipment.customer_name}</div>
              <div className="text-black whitespace-pre-wrap">{order.customer_country || 'International Client'}</div>
            </div>
            <div className="p-4 border-r-[1px] border-[#ccc] space-y-2">
              <div className="flex justify-between"><span>Country of Origin:</span> <span className="font-medium text-black">India</span></div>
              <div className="flex justify-between"><span>Mode of Transport:</span> <span className="font-medium text-black">Ship</span></div>
              <div className="flex justify-between"><span>Incoterms:</span> <span className="font-medium text-black">{order.incoterms || 'CIF'}</span></div>
              <div className="flex justify-between"><span>Port of Loading:</span> <span className="font-medium text-black">{shipment.origin_port}</span></div>
              <div className="flex justify-between"><span>Port of Discharge:</span> <span className="font-medium text-black">{shipment.destination_port}</span></div>
              <div className="flex justify-between"><span>Est. Shipment:</span> <span className="font-medium text-black">{shipment.departure_date || 'TBD'}</span></div>
            </div>
            <div className="p-4 flex flex-col items-center space-y-2">
              <div className="flex justify-between w-full"><span>Packing Type:</span> <span className="font-medium">{(order.packing_details?.split(' ') || [])[1] || 'Box'}</span></div>
            </div>
          </div>

          {/* Items Table */}
          <div className="flex-1 relative flex flex-col z-0">
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
              <img 
                src={logo} 
                alt="Watermark" 
                style={{ 
                  width: '400px', 
                  height: 'auto', 
                  opacity: 0.15 
                }} 
              />
            </div>

            <table className="w-full border-collapse relative z-[1]">
              <thead>
                <tr className="border-b-[1px] border-[#ccc] text-[10px] font-bold text-white bg-[#1a472a] print:bg-[#1a472a] print:text-white relative z-[1]">
                  <th className="border-r-[1px] border-[#ccc] p-2 w-[40px]">ID</th>
                  <th className="border-r-[1px] border-[#ccc] p-2 text-left">DESCRIPTION</th>
                  <th className="border-r-[1px] border-[#ccc] p-2 w-[80px]">HSN</th>
                  <th className="border-r-[1px] border-[#ccc] p-2 w-[80px]">QUANTITY</th>
                  <th className="border-r-[1px] border-[#ccc] p-2 w-[60px]">UNIT</th>
                  <th className="border-r-[1px] border-[#ccc] p-2 w-[90px]">PRICE</th>
                  <th className="p-2 w-[110px] text-right">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="text-[11px] relative z-[1]">
                <tr className="border-b-[0.5px] border-[#ccc] h-10 odd:bg-transparent even:bg-transparent print:bg-transparent">
                  <td className="border-r-[1px] border-[#ccc] text-center">1</td>
                  <td className="border-r-[1px] border-[#ccc] p-2 font-medium">{order.product}</td>
                  <td className="border-r-[1px] border-[#ccc] text-center">{order.hsn_code || '08039010'}</td>
                  <td className="border-r-[1px] border-[#ccc] text-center">{order.quantity}</td>
                  <td className="border-r-[1px] border-[#ccc] text-center">{order.unit}</td>
                  <td className="border-r-[1px] border-[#ccc] text-center font-mono">{order.currency} {order.unit_price ? Number(order.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                  <td className="text-right p-2 font-bold font-mono">{order.total_amount ? Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                </tr>
                {/* Visual grid filler rows */}
                {[...Array(10)].map((_, i) => (
                  <tr key={i} className="h-8 border-b-[0.2px] border-[#ccc] odd:bg-transparent even:bg-transparent print:border-[#ccc]">
                    <td className="border-r-[1px] border-[#ccc]"></td>
                    <td className="border-r-[1px] border-[#ccc]"></td>
                    <td className="border-r-[1px] border-[#ccc]"></td>
                    <td className="border-r-[1px] border-[#ccc]"></td>
                    <td className="border-r-[1px] border-[#ccc]"></td>
                    <td className="border-r-[1px] border-[#ccc]"></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="grid grid-cols-2 border-t-[1px] border-[#ccc]">
            <div className="p-4 border-r-[1px] border-[#ccc] flex flex-col justify-between">
              <div>
                <h3 className="text-black font-bold text-[11px] mb-2 underline underline-offset-4 uppercase">Terms of Payment</h3>
                <p className="text-[10px] leading-relaxed text-black font-medium">
                  Based on Negotiation
                </p>
              </div>
              <div className="mt-4 text-[10px] font-bold text-black">Note: Including packing, loading and Transport.</div>
            </div>
            <div className="flex flex-col border-l-[1px] border-[#ccc]">
              <div className="grid grid-cols-2 text-[11px] border-b border-[#ccc] print:border-[#ccc] h-8 items-center">
                <div className="pl-4 font-bold text-black">SUB TOTAL</div>
                <div className="text-right pr-4 font-bold font-mono">{order.total_amount ? Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</div>
              </div>
              <div className="grid grid-cols-2 text-[11px] border-b border-[#ccc] print:border-[#ccc] h-8 items-center text-black">
                <div className="pl-4">Tax Rate</div>
                <div className="text-right pr-4">0.00%</div>
              </div>
              <div className="grid grid-cols-2 text-[11px] border-b-[1px] border-[#ccc] h-8 items-center text-black">
                <div className="pl-4">Tax</div>
                <div className="text-right pr-4 font-mono">0.00</div>
              </div>
              <div className="grid grid-cols-2 text-[14px] font-bold h-10 items-center bg-gray-50 print:bg-transparent">
                <div className="pl-4 uppercase tracking-wide">Total Amount</div>
                <div className="text-right pr-4 font-mono">{order.currency} {order.total_amount ? Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</div>
              </div>
            </div>
          </div>

          {/* Declaration and Signature */}
          <div className="grid grid-cols-2 border-t-2 border-[#1a472a] bg-[#f5f5f5] print:bg-[#f5f5f5] min-h-[140px]">
            <div className="p-4 border-r-[1px] border-[#ccc] text-[9px] flex flex-col justify-end text-black">
              <p className="mb-1 leading-relaxed">
                Declaration: We hereby certify that the goods mentioned above are of Indian origin and the price and details stated in this proforma invoice are true and correct.
              </p>
            </div>
            <div className="p-4 flex flex-col justify-between text-[11px]">
              <div className="font-bold text-black text-center uppercase tracking-wide">FOR SHASTIKA GLOBAL IMPEX PRIVATE LIMITED</div>
              <div className="space-y-6 pt-6">
                <div className="text-black font-medium">Authorized Signatory :</div>
                <div className="text-black font-medium">Seal & Sign :</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 0; }
          body { background: white !important; margin: 0 !important; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print\\:hidden { display: none !important; }
          .max-w-\\[210mm\\] { max-width: 100% !important; margin: 0 !important; width: 100% !important; border: none !important; box-shadow: none !important; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
        .font-sans { font-family: 'Inter', sans-serif !important; }
      `}} />
    </div>
  );
}
