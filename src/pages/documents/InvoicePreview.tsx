import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function InvoicePreview() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const autoDownload = searchParams.get("download") === "true";
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [hasAutoDownloaded, setHasAutoDownloaded] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try fetching as a Shipment first
        let { data, error: fetchErr } = await supabase
          .from("export_shipments")
          .select("*, export_orders(*)")
          .eq("id", id)
          .maybeSingle();

        if (fetchErr || !data) {
          // If not found, try fetching as an Order directly
          const { data: orderOnly, error: orderErr } = await supabase
            .from("export_orders")
            .select("*, export_shipments(*)")
            .eq("id", id)
            .maybeSingle();

          if (orderErr) throw orderErr;
          
          const shipmentData = orderOnly.export_shipments?.[0] || {
            origin_port: 'TBD',
            destination_port: 'TBD',
            departure_date: null
          };
          
          setShipment({
            ...shipmentData,
            customer_name: orderOnly.customer_name,
            export_orders: orderOnly
          });
          data = { export_orders: orderOnly };
        } else {
          setShipment(data);
        }

        const orderData = Array.isArray(data.export_orders) ? data.export_orders[0] : data.export_orders;
        
        if (orderData?.company_id) {
          const { data: compData } = await supabase
            .from("companies")
            .select("signature_url")
            .eq("id", orderData.company_id)
            .maybeSingle();
          setCompany(compData);
        }

        if (orderData?.created_by) {
          const { data: userData } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", orderData.created_by)
            .maybeSingle();
          if (userData) orderData.creator_name = userData.full_name;
        }
      } catch (err: any) {
        console.error("Report load error:", err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  useEffect(() => {
    if (autoDownload && !hasAutoDownloaded && !loading && shipment && invoiceRef.current) {
      setHasAutoDownloaded(true);
      setTimeout(() => {
        handleDownloadPDF();
      }, 1000);
    }
  }, [autoDownload, hasAutoDownloaded, loading, shipment]);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setDownloading(true);
    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice-${shipment?.shipment_number || 'download'}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <Loader2 className="h-10 w-10 animate-spin text-[#1A5276]" />
    </div>
  );

  if (error || !shipment) return (
    <div className="p-10 bg-white min-h-screen font-sans text-red-600">
      <h2 className="text-2xl font-bold">Failed to load invoice.</h2>
      <pre className="mt-4 p-4 bg-gray-50 border">{error}</pre>
    </div>
  );

  const order = Array.isArray(shipment.export_orders) 
    ? (shipment.export_orders[0] || {}) 
    : (shipment.export_orders || {});
    
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const totalAmount = Number(order.total_amount || 0);
  const currencySym = order.currency || 'USD';

  // Constants for design
  const NAVY = "#1B3A6B";
  const MID_BLUE = "#2E5FA3";
  const LIGHT_BLUE = "#D6E4F7";
  const LIGHT_GRAY = "#F5F7FA";

  const SectionHeader = ({ label }: { label: string }) => (
    <div style={{
      background: MID_BLUE,
      color: "#fff",
      fontWeight: 700,
      fontSize: "10px",
      padding: "5px 12px",
      letterSpacing: "0.5px",
    }}>
      ▌ {label}
    </div>
  );

  const LabelVal = ({ label, value }: { label: string, value: any }) => (
    <div className="grid grid-cols-[130px_1fr] text-[10px] leading-relaxed">
      <span className="text-gray-600">{label}</span>
      <span className="font-bold">: {value || "—"}</span>
    </div>
  );

  return (
    <div className="bg-[#f0f2f5] min-h-screen py-10 flex flex-col items-center print:bg-white print:py-0">
      
      {/* Controls */}
      <div className="mb-6 w-full max-w-[210mm] flex justify-end gap-3 print:hidden px-4">
        <Button 
          variant="outline"
          onClick={() => window.print()}
          className="rounded-full border-[#1A5276] text-[#1A5276] hover:bg-[#1A5276]/5"
        >
          <Printer className="h-4 w-4 mr-2" /> Print
        </Button>
        <Button 
          onClick={handleDownloadPDF} 
          disabled={downloading}
          className="bg-[#1A5276] text-white hover:bg-[#154360] shadow-lg rounded-full px-6"
        >
          {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          {downloading ? "Generating PDF..." : "Save as PDF"}
        </Button>
      </div>

      <div ref={invoiceRef} className="bg-white w-full max-w-[210mm] shadow-2xl print:shadow-none border-[1.5px] border-black text-black font-sans leading-tight overflow-hidden p-[36px] print:p-0">
        
        {/* Header Section */}
        <div className="flex border-[1.5px] border-black mb-4">
          {/* Left Block */}
          <div className="w-[60%] p-5 bg-white border-r-[1.5px] border-black">
            <div className="flex flex-col items-center mb-4">
              <img src="/logo.webp" alt="SGI Logo" className="w-20 h-auto mb-2" />
              <h1 className="text-[13px] font-extrabold text-[#1A5276] tracking-tight text-center">SHASTIKA GLOBAL IMPEX PRIVATE LIMITED</h1>
            </div>
            <div className="text-[9.5px] space-y-1 text-gray-800 text-center">
              <p>41/1, ST-5, Sathy Athani Main Road, Thuckanayakanpalayam, Erode – 638506, Tamil Nadu, India</p>
              <p><span className="font-bold">Phone:</span> +91 7397612015 &emsp; <span className="font-bold">GSTIN:</span> 33ABPCS0605LIZ8</p>
            </div>
          </div>
          {/* Right Block */}
          <div className="w-[40%] p-5 bg-[#EBF2FD] flex flex-col justify-center items-center">
            <h2 className="text-[20px] font-black text-[#1B3A6B] tracking-widest leading-none">PACKING LIST</h2>
            <p className="text-[9px] text-gray-500 italic mb-4">For Customs Clearance</p>
            <div className="w-full bg-white p-3 rounded space-y-1 text-[10px]">
              <div className="flex justify-between font-bold"><span>PL No:</span> <span>{order.order_number?.replace('EXP', 'PL') || '—'}</span></div>
              <div className="flex justify-between"><span>Date:</span> <span>{today}</span></div>
              <div className="flex justify-between font-bold text-[#1B3A6B]"><span>Currency:</span> <span>{order.currency || 'USD'}</span></div>
            </div>
          </div>
        </div>

        {/* Exporter / Importer Section */}
        <div className="grid grid-cols-2 border-x-[1.5px] border-t-[1.5px] border-black">
          <div className="border-r-[1.5px] border-black">
            <SectionHeader label="EXPORTER / SELLER" />
            <div className="p-4 text-[10px] space-y-1 bg-[#F5F7FA]">
              <p className="font-bold text-[#1B3A6B]">SHASTIKA GLOBAL IMPEX PRIVATE LIMITED</p>
              <p>41/1, ST-5, Sathy Athani Main Road,</p>
              <p>Thuckanayakanpalayam, Erode - 638506,</p>
              <p>Tamil Nadu, India.</p>
              <p>GSTIN: 33ABPCS0605LIZ8</p>
            </div>
          </div>
          <div>
            <SectionHeader label="IMPORTER / CONSIGNEE" />
            <div className="p-4 text-[10px] space-y-1">
              <p className="font-bold text-[#1B3A6B] uppercase">{order.customer_name || 'Customer Name'}</p>
              <p className="whitespace-pre-wrap">{order.shipping_address || 'Address not provided'}</p>
              <p><span className="font-medium text-gray-500">Country:</span> {order.customer_country || '—'}</p>
            </div>
          </div>
        </div>

        {/* Shipment & Banking Section */}
        <div className="grid grid-cols-2 border-x-[1.5px] border-y-[1.5px] border-black">
          <div className="border-r-[1.5px] border-black">
            <SectionHeader label="SHIPMENT & TRADE DETAILS" />
            <div className="p-4 space-y-1 bg-[#F5F7FA]">
              <LabelVal label="Country of Origin" value={order.country_of_origin} />
              <LabelVal label="Mode of Transport" value={order.mode_of_transport} />
              <LabelVal label="Incoterms" value={order.incoterms} />
              <LabelVal label="Port of Loading" value={order.port_of_loading} />
              <LabelVal label="Port of Discharge" value={order.port_of_discharge} />
              <LabelVal label="Container Type" value={order.container_type} />
              <LabelVal label="Loading Type" value={order.loading_type} />
            </div>
          </div>
          <div>
            <SectionHeader label="PAYMENT & BANKING DETAILS" />
            <div className="p-4 space-y-1">
              <LabelVal label="Payment Terms" value={order.payment_terms} />
              <LabelVal label="Invoice Currency" value={order.currency} />
              <LabelVal label="Bank Name" value={order.bank_name || 'State Bank of India'} />
              <LabelVal label="Branch" value={order.bank_branch || 'Erode, Tamil Nadu'} />
              <LabelVal label="Account No" value={order.account_no || '43841179923'} />
              <LabelVal label="IFSC Code" value={order.ifsc_code || 'SBIN02278'} />
              <LabelVal label="Swift Code" value={order.swift_code || 'SBININBB'} />
            </div>
          </div>
        </div>

        {/* Goods Table */}
        <div className="border-x-[1.5px] border-black">
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-[#1B3A6B] text-white">
                <th className="border border-white/20 p-2 w-10">S.No</th>
                <th className="border border-white/20 p-2 text-left">Description</th>
                <th className="border border-white/20 p-2">HS Code</th>
                <th className="border border-white/20 p-2 w-20">No. of Pkgs</th>
                <th className="border border-white/20 p-2 w-20">Qty (Nos)</th>
                <th className="border border-white/20 p-2 w-14">Unit</th>
                <th className="border border-white/20 p-2 w-24">Unit Price</th>
                <th className="border border-white/20 p-2 w-28">Total Value</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-[#F5F7FA]">
                <td className="border border-black/10 p-2 text-center">1</td>
                <td className="border border-black/10 p-2 font-bold">{order.product}</td>
                <td className="border border-black/10 p-2 text-center">{order.hsn_code}</td>
                <td className="border border-black/10 p-2 text-center font-bold">{order.total_cartons}</td>
                <td className="border border-black/10 p-2 text-center font-bold">{order.quantity}</td>
                <td className="border border-black/10 p-2 text-center">{order.unit}</td>
                <td className="border border-black/10 p-2 text-center">{order.unit_price}</td>
                <td className="border border-black/10 p-2 text-right font-bold text-[#1B3A6B]">{currencySym} {totalAmount.toLocaleString()}</td>
              </tr>
              {/* Padding empty rows */}
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="border border-black/10 p-2">&nbsp;</td>
                  <td className="border border-black/10 p-2"></td>
                  <td className="border border-black/10 p-2"></td>
                  <td className="border border-black/10 p-2"></td>
                  <td className="border border-black/10 p-2"></td>
                  <td className="border border-black/10 p-2"></td>
                  <td className="border border-black/10 p-2"></td>
                  <td className="border border-black/10 p-2"></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6} className="border-r border-black/10 py-2"></td>
                <td className="p-2 font-bold bg-[#D6E4F7] text-[#1B3A6B] border border-black/10">Sub Total</td>
                <td className="p-2 font-bold bg-[#D6E4F7] text-[#1B3A6B] border border-black/10 text-right">{currencySym} {totalAmount.toLocaleString()}</td>
              </tr>
              <tr>
                <td colSpan={6} className="border-r border-black/10 py-1"></td>
                <td className="p-2 text-gray-500 border border-black/10">Tax / GST (Export 0%)</td>
                <td className="p-2 text-right text-gray-500 border border-black/10">0.00</td>
              </tr>
              <tr className="bg-[#1B3A6B] text-white">
                <td colSpan={6}></td>
                <td className="p-2 font-black">TOTAL FOB VALUE</td>
                <td className="p-2 font-black text-right">{currencySym} {totalAmount.toLocaleString()}</td>
              </tr>
              <tr className="bg-[#D6E4F7]/50">
                <td colSpan={8} className="p-3 border-t-[1.5px] border-black">
                  <span className="font-bold text-[#1B3A6B]">Amount in Words:</span> <span className="italic uppercase ml-2 text-[9px]">Zero {order.currency} Only (Convert to words feature needed)</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Packing & Weight Section */}
        <div className="grid grid-cols-2 border-x-[1.5px] border-y-[1.5px] border-black">
          <div className="border-r-[1.5px] border-black">
            <SectionHeader label="PACKING DETAILS" />
            <div className="p-4 space-y-1 bg-[#F5F7FA]">
              <LabelVal label="Packing Type" value={order.packing_details} />
              <LabelVal label="No. of Cartons" value={order.total_cartons} />
              <LabelVal label="Qty per Carton" value={order.qty_per_carton} />
              <LabelVal label="Total Quantity" value={`${order.quantity} ${order.unit}`} />
              <LabelVal label="Container Type" value={order.container_type} />
            </div>
          </div>
          <div>
            <SectionHeader label="WEIGHT DETAILS" />
            <div className="p-4 space-y-1">
              <LabelVal label="Net Wt / Unit" value={order.unit_net_weight} />
              <LabelVal label="Net Wt / Carton" value={order.unit_net_weight && order.qty_per_carton ? (order.unit_net_weight * order.qty_per_carton).toFixed(2) : null} />
              <LabelVal label="Gross Wt / Carton" value={order.gross_weight_per_carton} />
              <LabelVal label="Total Net Weight" value={order.total_net_weight} />
              <LabelVal label="Total Gross Weight" value={order.total_gross_weight} />
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="grid grid-cols-[60%_40%] border-x-[1.5px] border-b-[1.5px] border-black">
          <div className="border-r-[1.5px] border-black">
            <SectionHeader label="DECLARATION" />
            <div className="p-5 text-[9px] leading-relaxed space-y-2 bg-[#F5F7FA] text-gray-700">
              <p>1. The goods described in this packing list are of Indian origin.</p>
              <p>2. The details stated herein are true, correct and are the actual packing details.</p>
              <p>3. This document is issued solely for customs clearance and export purposes.</p>
            </div>
          </div>
          <div>
            <SectionHeader label="AUTHORISED SIGNATORY" />
            <div className="p-5 flex flex-col justify-between h-full bg-white">
              <p className="font-extrabold text-[9px] text-[#1B3A6B]">For SHASTIKA GLOBAL IMPEX PVT LTD</p>
              <div className="mt-8 border-t border-black pt-2 flex flex-col items-center">
                {company?.signature_url && <img src={company.signature_url} alt="Signature" className="h-10 w-auto mix-blend-multiply mb-1" />}
                <p className="text-[10px] font-bold">Authorised Signatory</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-[8px] text-gray-400">
          Generated via ERP System | Shastika Global Impex Pvt Ltd
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 0; size: A4; }
          body { background: white !important; margin: 0 !important; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print\\:hidden { display: none !important; }
          .max-w-\\[210mm\\] { max-width: 100% !important; margin: 0 !important; width: 100% !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap');
        .font-sans { font-family: 'Roboto', sans-serif !important; }
      `}} />
    </div>
  );
}