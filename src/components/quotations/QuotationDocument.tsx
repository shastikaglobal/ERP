import React, { useRef, useState } from "react";
import { Download, X, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Loader2 } from "lucide-react";

interface QuotationDocumentProps {
  quotation: any;
  onClose: () => void;
}

export function QuotationDocument({ quotation, onClose }: QuotationDocumentProps) {
  if (!quotation) return null;
  const docRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!docRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(docRef.current, {
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
      pdf.save(`Quotation-${quotation.quotation_number || 'download'}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setDownloading(false);
    }
  };

  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const validityDate = quotation.valid_until
    ? new Date(quotation.valid_until).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : 'TBD';

  const totalAmount = Number(quotation.amount || 0);
  const currencySym = quotation.currency === 'USD' ? 'USD' : quotation.currency === 'EUR' ? 'EUR' : (quotation.currency || 'INR');
  const items = quotation.quotation_items || quotation.items || [];

  return (
    <div style={{ background: '#f0f2f5', color: 'black', minHeight: '100vh', padding: '40px 20px', fontFamily: 'sans-serif' }} className="flex flex-col items-center print:bg-white print:p-0">

      {/* Top Controls */}
      <div className="mb-6 w-full max-w-[210mm] flex justify-between items-center px-4 print:hidden">
        <Button
          variant="outline"
          onClick={onClose}
          className="rounded-full border-[#1A5276] text-[#1A5276] hover:bg-[#1A5276]/5"
        >
          <X className="h-4 w-4 mr-2" /> Close
        </Button>
        <div className="flex gap-3">
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
            className="bg-[#1A5276] text-white hover:bg-[#154360] shadow-lg rounded-full px-6 min-w-[160px]"
          >
            {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {downloading ? "Generating PDF..." : "Save as PDF"}
          </Button>
        </div>
      </div>

      {/* Document */}
      <div ref={docRef} className="bg-white w-full max-w-[210mm] shadow-2xl print:shadow-none border-[1.5px] border-black text-black leading-tight">
        
        {/* Header Section */}
        <div className="grid grid-cols-[55%_45%] border-b-[1.5px] border-black">
          <div className="p-4 border-r-[1.5px] border-black flex flex-col items-center">
            <h1 className="text-[12px] font-extrabold text-[#1A5276] mb-4 tracking-tight uppercase">SHASTIKA GLOBAL IMPEX PRIVATE LIMITED</h1>
            <div className="flex w-full items-start gap-4">
              <div className="w-20 h-20 flex-shrink-0">
                <img src="/logo.webp" alt="Logo" className="w-full h-auto object-contain" />
              </div>
              <div className="flex flex-col text-[9px] space-y-1 text-gray-800">
                <div className="flex gap-2"><span>Address:</span> <span className="font-bold">41/1, ST-5, Sathy Athani Main Road,</span></div>
                <div className="flex gap-2 ml-12"><span className="font-bold">Thuckanayakanpalayam</span></div>
                <div className="flex gap-2 ml-12"><span className="font-bold">Erode - 638506, Tamil Nadu, India.</span></div>
                <div className="flex gap-2 mt-2"><span>Phone  :</span> <span className="font-bold text-black">+91 7397612015</span></div>
                <div className="flex gap-2"><span>GSTIN  :</span> <span className="font-bold text-black">33ABPCS0605LIZ8</span></div>
                <div className="flex gap-2"><span>whatsapp number :</span> <span className="font-bold text-black">+91 9566266241</span></div>
              </div>
            </div>
          </div>
          <div className="p-4 flex flex-col items-center">
            <h2 className="text-[14px] font-extrabold text-[#1A5276] mb-4 tracking-wider uppercase">QUOTATION</h2>
            <div className="w-full space-y-2 text-[9.5px] pl-8">
              <div className="grid grid-cols-[110px_1fr]"><span>Quotation No :</span> <span className="font-bold">{quotation.quotation_number}</span></div>
              <div className="grid grid-cols-[110px_1fr]"><span>Date :</span> <span className="font-bold">{today}</span></div>
              <div className="grid grid-cols-[110px_1fr]"><span>Valid Until :</span> <span className="font-bold">{validityDate}</span></div>
              <div className="grid grid-cols-[110px_1fr]"><span>Currency :</span> <span className="font-bold">{quotation.currency || 'INR'}</span></div>
              <div className="grid grid-cols-[110px_1fr]"><span>Incoterm :</span> <span className="font-bold">{quotation.incoterms || quotation.incoterm || 'EXW'}</span></div>
              <div className="grid grid-cols-[110px_1fr]"><span>Packing Method :</span> <span className="font-bold">{quotation.packaging_type || '---'}</span></div>
              <div className="grid grid-cols-[110px_1fr]"><span>Packing Charge :</span> <span className="font-bold">{currencySym} {Number(quotation.packaging_cost || 0).toFixed(2)}</span></div>
              <div className="grid grid-cols-[110px_1fr]"><span>Net Weight :</span> <span className="font-bold">{quotation.net_weight || '---'}</span></div>
            </div>
          </div>
        </div>

        {/* Grid Row 1 (2 cols) */}
        <div className="grid grid-cols-[55%_45%] border-b-[1.5px] border-black text-[9px] font-bold text-[#1A5276] bg-[#f8fafc] uppercase tracking-tighter">
          <div className="border-r-[1.5px] border-black py-1.5 text-center">BILL TO :</div>
          <div className="py-1.5 text-center">TERMS OF PAYMENT</div>
        </div>
        <div className="grid grid-cols-[55%_45%] border-b-[1.5px] border-black min-h-[100px] text-[10px]">
          <div className="p-3 border-r-[1.5px] border-black flex flex-col">
            <div className="font-bold text-[11px] mb-1.5 uppercase">{quotation.customer?.name || quotation.customer_name || 'Customer Name'}</div>
            <div className="text-gray-800 whitespace-pre-wrap leading-tight text-[9px]">
              {quotation.customer?.address || 'Address not provided'}
            </div>
            {quotation.customer_phone && (
              <div className="text-[9px] mt-2">
                <span className="font-bold">Phone no : </span>{quotation.customer_phone}
              </div>
            )}
          </div>
          <div className="p-3">
            <p className="text-[9px] leading-tight text-gray-800 whitespace-pre-wrap">
              {quotation.payment_terms || "Standard payment terms apply."}
            </p>
          </div>
        </div>

        {/* Grid Row 2 (2 cols) */}
        <div className="grid grid-cols-[60%_40%] border-b-[1.5px] border-black text-[10px] font-bold text-[#1A5276] bg-[#f8fafc]">
          <div className="border-r-[1.5px] border-black py-1.5 text-center">SHIPMENT &amp; TRADE TERMS</div>
          <div className="py-1.5 text-center">TRANSPORT DETAILS</div>
        </div>
        <div className="grid grid-cols-[60%_40%] border-b-[1.5px] border-black min-h-[120px] text-[10px]">
          <div className="p-4 border-r-[1.5px] border-black space-y-2">
            <div className="grid grid-cols-[130px_1fr]"><span>Country of Origin :</span> <span className="font-bold">{quotation.country_of_origin || 'India'}</span></div>
            <div className="grid grid-cols-[130px_1fr]"><span>Mode of Transport :</span> <span className="font-bold">{quotation.mode_of_transport || 'Truck'}</span></div>
            <div className="grid grid-cols-[130px_1fr]"><span>Incoterms :</span> <span className="font-bold">{quotation.incoterms || quotation.incoterm || 'EXW'}</span></div>
            <div className="grid grid-cols-[130px_1fr]"><span>Port of Loading :</span> <span className="font-bold">{quotation.port_of_loading || 'Nhava Sheva Port, India'}</span></div>
            <div className="grid grid-cols-[130px_1fr]"><span>Port of Discharge :</span> <span className="font-bold">{quotation.port_of_discharge || '---'}</span></div>
          </div>
          <div className="p-4 space-y-2">
            <div className="grid grid-cols-[110px_1fr]"><span>Transport :</span> <span className="font-bold">{quotation.shipment_type || 'Truck'}</span></div>
            <div className="grid grid-cols-[110px_1fr]"><span>Transport Charges :</span> <span className="font-bold">{currencySym} {Number(quotation.shipping_cost || 0).toLocaleString()}</span></div>
          </div>
        </div>

        {/* Table Section */}
        <div className="flex-1 min-h-[300px]">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="border-b-[1.5px] border-black text-[8px] font-bold text-[#1A5276] uppercase bg-[#f8fafc]">
                <th className="border-r-[1.5px] border-black w-[5%] py-2 text-center">ID</th>
                <th className="border-r-[1.5px] border-black w-[35%] px-4 py-2 text-left">DESCRIPTION</th>
                <th className="border-r-[1.5px] border-black w-[12%] py-2 text-center">HSN</th>
                <th className="border-r-[1.5px] border-black w-[12%] py-2 text-center">QUANTITY</th>
                <th className="border-r-[1.5px] border-black w-[10%] py-2 text-center">UNIT</th>
                <th className="border-r-[1.5px] border-black w-[13%] py-2 text-center text-[7px]">UNIT PRICE ({currencySym})</th>
                <th className="w-[13%] py-2 text-center text-[7px]">AMOUNT ({currencySym})</th>
              </tr>
            </thead>
            <tbody className="text-[10px]">
              {items.map((item: any, i: number) => (
                <tr key={i} className="border-b border-black min-h-[40px]">
                  <td className="border-r border-black text-center py-2">{i + 1}</td>
                  <td className="border-r border-black px-4 py-2 font-medium leading-tight text-[9px] break-words">
                    {item.description || item.product?.name || item.products?.name || item.product_name || 'Product'}
                  </td>
                  <td className="border-r border-black text-center py-2 font-mono text-[9px]">{item.hsn_code || item.product?.hs_code || item.products?.hs_code || '—'}</td>
                  <td className="border-r border-black text-center py-2 font-bold">{item.quantity}</td>
                  <td className="border-r border-black text-center py-2 font-bold uppercase">{item.product?.unit || item.products?.unit || item.unit || 'PCS'}</td>
                  <td className="border-r border-black text-right pr-4 py-2 font-bold">{Number(item.unit_price).toFixed(2)}</td>
                  <td className="text-right pr-4 py-2 font-bold">{Number(item.total_price || (item.quantity * item.unit_price)).toFixed(2)}</td>
                </tr>
              ))}
              {/* Fill remaining space with empty rows to maintain grid alignment */}
              {[...Array(Math.max(0, 8 - items.length))].map((_, i) => (
                <tr key={`e-${i}`} className="border-b border-gray-100 h-10">
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="grid grid-cols-[55%_45%] border-t-[1.5px] border-black min-h-[140px]">
          <div className="border-r-[1.5px] border-black flex flex-col">
            <div className="p-3 border-b border-black flex-1">
              <h4 className="text-[10px] font-bold text-[#1A5276] mb-2 uppercase">NOTE</h4>
              <p className="text-[9px] leading-relaxed text-gray-800 whitespace-pre-wrap">
                {quotation.notes || "Including packing, loading and Transport."}
              </p>
            </div>
            <div className="p-3">
              <p className="text-[8px] uppercase font-bold text-gray-700 mb-4">DECLARATION</p>
              <p className="text-[8.5px] italic text-gray-600 leading-tight">We hereby certify that the goods mentioned above are of Indian origin and the price and details stated in this quotation are true and correct.</p>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="border-b border-black">
              <div className="grid grid-cols-2 px-4 py-1.5 text-[10px]">
                <span className="text-gray-700 font-bold uppercase">SUB TOTAL</span>
                <span className="text-right font-bold">{currencySym} {Number(quotation.subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 px-4 py-1.5 text-[10px]">
                <span className="text-gray-700 font-bold uppercase">PACKING CHARGE</span>
                <span className="text-right font-bold">{currencySym} {Number(quotation.packaging_cost || 0).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 px-4 py-1.5 text-[10px]">
                <span className="text-gray-700 font-bold uppercase">TRANSPORT CHARGES</span>
                <span className="text-right font-bold">{currencySym} {Number(quotation.shipping_cost || 0).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 px-4 py-1.5 text-[10px]">
                <span className="text-gray-700 font-bold uppercase">TAX</span>
                <span className="text-right font-bold">{currencySym} {Number(quotation.tax_amount || 0).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 px-4 py-2 text-[11px] font-black bg-[#BDD7EE] text-[#1A5276] border-t border-black">
                <span>TOTAL AMOUNT</span>
                <span className="text-right">{currencySym} {totalAmount.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="p-4 flex flex-col flex-1 justify-between text-[10px]">
              <div className="font-extrabold text-[9px] uppercase tracking-tighter text-right">FOR SHASTIKA GLOBAL IMPEX PRIVATE LIMITED</div>
              <div className="space-y-4 mt-6">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[9.5px]">Authorized Signatory :</span>
                  <div className="flex-1 border-b border-dotted border-black h-4 px-2 italic text-gray-400 font-normal">__________________________</div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="font-bold text-[9.5px] pt-1">Seal &amp; Sign :</span>
                  <div className="h-16 w-36 border border-black rounded flex items-center justify-center text-gray-300 text-[8px]">STAMP BOX</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Watermark Logo */}
        <div className="absolute top-[35%] left-[20%] right-[20%] z-0 opacity-10 pointer-events-none select-none">
          <img src="/logo.webp" alt="Watermark" className="w-full h-auto object-contain" />
        </div>

      </div>
    </div>
  );
}
