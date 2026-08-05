import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, Download, Search, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Payslips() {
  const { session } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [payslipData, setPayslipData] = useState(null);
  const [loading, setLoading] = useState(false);
  const payslipRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch employees for dropdown
    const fetchEmployees = async () => {
      try {
        const res = await fetch('/api/employees', {
          headers: { }
        });
        if (res.ok) {
          const data = await res.json();
          setEmployees(data);
        }
      } catch (e) {
        console.error('Failed to fetch employees', e);
      }
    };
    fetchEmployees();
  }, [session]);

  const handleGenerate = async () => {
    if (!selectedEmployee || !selectedMonth) {
      toast.error('Please select an employee and a month');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/payslips?employee_id=${selectedEmployee}&month=${selectedMonth}`, {
        headers: { }
      });
      if (res.ok) {
        const data = await res.json();
        setPayslipData(data);
        toast.success('Payslip generated successfully');
      } else {
        toast.error('Failed to generate payslip');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error generating payslip');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!payslipRef.current) return;
    try {
      toast.info("Generating PDF...");
      const canvas = await html2canvas(payslipRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      pdf.save(`Payslip_${payslipData?.employee_name || 'Employee'}_${selectedMonth}.pdf`);
      toast.success("PDF Downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Controls - Hide when printing */}
      <div className="flex flex-col md:flex-row gap-4 items-end bg-card p-4 rounded-xl border border-white/10 print:hidden">
        <div className="space-y-2 flex-1">
          <label className="text-sm font-medium text-muted-foreground">Select Employee</label>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger>
              <SelectValue placeholder="Select Employee..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp: any) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.employee_id} - {emp.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 flex-1">
          <label className="text-sm font-medium text-muted-foreground">Month & Year</label>
          <Input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>
        <Button onClick={handleGenerate} disabled={loading} className="gap-2 bg-primary text-black hover:bg-primary/90">
          <FileText className="w-4 h-4" />
          {loading ? 'Generating...' : 'Generate Payslip'}
        </Button>
        {payslipData && (
          <>
            <Button onClick={handlePrint} variant="outline" className="gap-2">
              <Printer className="w-4 h-4" /> Print
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
              <Download className="w-4 h-4" /> PDF
            </Button>
          </>
        )}
      </div>

      {/* Payslip View */}
      {payslipData && (
        <Card ref={payslipRef} className="bg-white text-black p-8 shadow-xl max-w-4xl mx-auto print:shadow-none print:p-0 print:border-none">
          <CardHeader className="text-center border-b-2 border-black pb-4 mb-6">
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="w-16 h-16 flex items-center justify-center overflow-hidden">
                <img src="/logo.webp" alt="Company Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold uppercase tracking-widest text-black">Shastika Global Impex Pvt Ltd</h1>
                <p className="text-sm text-gray-600">41/1, ST-5, Sathy Athani Main Road, Thuckanayakanpalayam, Erode, Tamil Nadu — 638506</p>
              </div>
            </div>
            <h2 className="text-xl font-bold underline mt-4 text-black">SALARY SLIP - MONTH OF {selectedMonth}</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Employee Details */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
              <div className="grid grid-cols-2">
                <span className="font-bold text-black">E. Code:</span>
                <span className="text-black">{payslipData.emp_code}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-bold text-black">Bank Name:</span>
                <span className="text-black">{payslipData.bank_name || '-'}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-bold text-black">Employee Name:</span>
                <span className="text-black">{payslipData.employee_name}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-bold text-black">Bank A/c No:</span>
                <span className="text-black">{payslipData.bank_account_no || '-'}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-bold text-black">Department:</span>
                <span className="text-black">{payslipData.department || '-'}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-bold text-black">PF No:</span>
                <span className="text-black">{payslipData.pf_no || '-'}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-bold text-black">Designation:</span>
                <span className="text-black">{payslipData.role || '-'}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-bold text-black">PAN No:</span>
                <span className="text-black">{payslipData.pan_no || '-'}</span>
              </div>
            </div>

            {/* Earnings & Deductions Table */}
            <div className="border border-black flex flex-col mt-8">
              <div className="grid grid-cols-2 border-b border-black font-bold text-sm bg-gray-100">
                <div className="p-2 border-r border-black text-center text-black">EARNINGS</div>
                <div className="p-2 text-center text-black">DEDUCTIONS</div>
              </div>
              <div className="grid grid-cols-2 text-sm min-h-[200px]">
                {/* Earnings Column */}
                <div className="border-r border-black p-0">
                  <div className="grid grid-cols-2 p-2 border-b border-gray-200">
                    <span className="text-black">Basic Salary</span>
                    <span className="text-right text-black">{payslipData.basic_earnings || 0}</span>
                  </div>
                  <div className="grid grid-cols-2 p-2 border-b border-gray-200">
                    <span className="text-black">HRA</span>
                    <span className="text-right text-black">{payslipData.hra_earnings || 0}</span>
                  </div>
                </div>
                {/* Deductions Column */}
                <div className="p-0">
                  <div className="grid grid-cols-2 p-2 border-b border-gray-200">
                    <span className="text-black">PF</span>
                    <span className="text-right text-black">{payslipData.pf_deduction || 0}</span>
                  </div>
                  <div className="grid grid-cols-2 p-2 border-b border-gray-200">
                    <span className="text-black">ESI</span>
                    <span className="text-right text-black">{payslipData.esi_deduction || 0}</span>
                  </div>
                  <div className="grid grid-cols-2 p-2 border-b border-gray-200">
                    <span className="text-black">TDS</span>
                    <span className="text-right text-black">{payslipData.tds_deduction || 0}</span>
                  </div>
                </div>
              </div>
              
              {/* Totals Row */}
              <div className="grid grid-cols-2 border-t border-black font-bold text-sm bg-gray-100">
                <div className="p-2 border-r border-black grid grid-cols-2">
                  <span className="text-black">TOTAL EARNINGS:</span>
                  <span className="text-right text-black">₹ {payslipData.gross_pay || 0}</span>
                </div>
                <div className="p-2 grid grid-cols-2">
                  <span className="text-black">TOTAL DEDUCTIONS:</span>
                  <span className="text-right text-black">₹ {payslipData.total_deductions || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 border border-black p-4 font-bold text-center mt-4">
              <span className="text-black">NET PAY: </span>
              <span className="text-xl text-black">₹ {payslipData.net_pay || 0}</span>
            </div>
            
            <div className="flex justify-between items-end mt-24 px-8 text-sm font-bold text-black">
              <div className="border-t border-black pt-2 w-48 text-center">Employer Signature</div>
              <div className="border-t border-black pt-2 w-48 text-center">Employee Signature</div>
            </div>

          </CardContent>
        </Card>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          @page { margin: 0; size: A4; }
          body { 
            margin: 1cm;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
