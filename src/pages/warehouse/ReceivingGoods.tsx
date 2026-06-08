import React, { useState, useRef, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import Card from "@/components/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    ArrowRight,
    Truck,
    PackageCheck,
    ClipboardCheck,
    CheckCircle2,
    Database,
    UploadCloud,
    Image as ImageIcon,
    List,
    Plus,
    Loader2,
    Trash2,
    AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const STAGES = [
    { id: "supplier", label: "Supplier", icon: Truck },
    { id: "arrival", label: "Goods Arrival", icon: PackageCheck },
    { id: "verification", label: "Verification", icon: CheckCircle2 },
    { id: "quality", label: "Quality Check", icon: ClipboardCheck },
    { id: "stock", label: "Stock Entry", icon: Database },
];

export default function ReceivingGoods() {
    const queryClient = useQueryClient();
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState<"entry" | "list">("entry");
    const [savedStocks, setSavedStocks] = useState<any[]>([]);

    // Fetch products and warehouses using useQuery
    const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery({
        queryKey: ["warehouse-products"],
        queryFn: async () => {
            try {
                const { data, error } = await supabase.from('products').select('id, name').limit(1);
                if (error) throw error;
                return data || [];
            } catch (err: any) {
                console.error("Error fetching products:", err);
                return [];
            }
        }
    });

    const { data: warehouses = [], isLoading: warehousesLoading, error: warehousesError } = useQuery({
        queryKey: ["warehouse-locations"],
        queryFn: async () => {
            try {
                const { data, error } = await supabase.from('warehouses').select('id, name').limit(1);
                if (error) throw error;
                return data || [];
            } catch (err: any) {
                console.error("Error fetching warehouses:", err);
                return [];
            }
        }
    });

    useEffect(() => {
        const saved = localStorage.getItem("warehouseStockEntries");
        if (saved) {
            try {
                setSavedStocks(JSON.parse(saved));
            } catch (e) {
                console.error("Error parsing saved stocks:", e);
                setSavedStocks([]);
            }
        }
    }, []);

    const [currentStage, setCurrentStage] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        grn: `GRN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        supplierInfo: "",
        expectedQty: "",
        receivedQty: "",
        qualityStatus: "",
        batchNumber: `BATCH-${Math.floor(100000 + Math.random() * 900000)}`,
        entryDate: new Date().toISOString().split("T")[0],
        notes: ""
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const nextStage = async () => {
        if (currentStage < STAGES.length - 1) {
            setCurrentStage(prev => prev + 1);
        } else {
            // Validate required fields before submission
            if (!formData.receivedQty) {
                toast.error("Please enter received quantity");
                return;
            }
            if (!formData.qualityStatus) {
                toast.error("Please select quality status");
                return;
            }

            setIsSubmitting(true);
            try {
                // Get company ID from profile
                let company_id = profile?.company_id;

                if (!company_id) {
                    const { data: { session } } = await supabase.auth.getSession();
                    const userId = session?.user?.id;

                    if (userId) {
                        const { data: profileData, error: profileError } = await supabase
                            .from('profiles')
                            .select('company_id')
                            .eq('id', userId)
                            .single();
                        
                        if (profileError) throw profileError;
                        company_id = profileData?.company_id;
                    }
                }

                // Validate we have required references
                if (!products?.[0]?.id || !warehouses?.[0]?.id) {
                    toast.error("Products or warehouses not available. Please ensure they are configured.");
                    setIsSubmitting(false);
                    return;
                }

                // Insert into real database
                const { error } = await supabase.from("inventory_batches").insert({
                    company_id,
                    lot_number: formData.batchNumber,
                    product_id: products[0].id,
                    warehouse_id: warehouses[0].id,
                    quantity_kg: Number(formData.receivedQty) || 0,
                    quantity_remaining_kg: Number(formData.receivedQty) || 0,
                    status: formData.qualityStatus === 'pass' ? 'qc_passed' : 'pending_qc',
                    is_export_ready: formData.qualityStatus === 'pass',
                    received_date: formData.entryDate
                });

                if (error) {
                    console.error("Database insert error:", error);
                    throw error;
                }

                // Also save to local storage for the list display
                const newEntry = { ...formData, id: new Date().getTime() };
                const updated = [newEntry, ...savedStocks];
                setSavedStocks(updated);
                localStorage.setItem("warehouseStockEntries", JSON.stringify(updated));

                toast.success("Goods received and saved to database successfully!");
                queryClient.invalidateQueries({ queryKey: ["warehouse-inventory"] });
                queryClient.invalidateQueries({ queryKey: ["inventory_batches"] });

                // Reset after completion
                setTimeout(() => {
                    setCurrentStage(0);
                    setActiveTab("list");
                    setFormData({
                        grn: `GRN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                        supplierInfo: "",
                        expectedQty: "",
                        receivedQty: "",
                        qualityStatus: "",
                        batchNumber: `BATCH-${Math.floor(100000 + Math.random() * 900000)}`,
                        entryDate: new Date().toISOString().split("T")[0],
                        notes: ""
                    });
                    setSelectedFile(null);
                }, 1500);
            } catch (err: any) {
                console.error("Backend error:", err);
                toast.error(err.message || "Failed to save to database. Please check your connection and try again.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const prevStage = () => {
        if (currentStage > 0) {
            setCurrentStage(prev => prev - 1);
        }
    };

    return (
        <div className="p-6 space-y-6 animate-fade-in max-w-5xl mx-auto">
            <PageHeader
                title="Goods Receiving"
                description="Process incoming shipments, perform quality checks, and allocate to stock"
                breadcrumbs={[{ label: "Warehouse" }, { label: "Receiving" }]}
            />

            {/* Show warnings if data is missing */}
            {(productsError || warehousesError || (!productsLoading && products.length === 0) || (!warehousesLoading && warehouses.length === 0)) && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-amber-600">Configuration Required</p>
                        <p className="text-sm text-amber-600/80">
                            {!productsLoading && products.length === 0 && "No products configured. "}
                            {!warehousesLoading && warehouses.length === 0 && "No warehouses configured. "}
                            Please set up products and warehouses before receiving goods.
                        </p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex space-x-1 p-1 bg-muted/30 rounded-lg max-w-sm border border-border">
                <button
                    onClick={() => setActiveTab('entry')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${activeTab === 'entry' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Plus className="w-4 h-4" />
                    New Entry
                </button>
                <button
                    onClick={() => setActiveTab('list')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${activeTab === 'list' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <List className="w-4 h-4" />
                    Stock List
                </button>
            </div>

            {activeTab === 'entry' && (
                <>
                    {/* Workflow Progress */}
                    <div className="w-full mb-8">
                        <div className="flex items-center justify-between relative">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border rounded-full -z-10"></div>
                            <div
                                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full -z-10 transition-all duration-300"
                                style={{ width: `${(currentStage / (STAGES.length - 1)) * 100}%` }}
                            ></div>

                            {STAGES.map((stage, index) => {
                                const Icon = stage.icon;
                                const isActive = index === currentStage;
                                const isCompleted = index < currentStage;

                                return (
                                    <div key={stage.id} className="flex flex-col items-center gap-2">
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-background transition-colors ${isActive ? 'bg-primary text-primary-foreground shadow-[0_0_15px_var(--primary)]'
                                                : isCompleted ? 'bg-primary/80 text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground'}`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className={`text-xs font-semibold ${isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {stage.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div >
                    </div >

                    <Card className="bg-card border-border overflow-hidden shadow-lg">
                        <div className="p-6 border-b border-border bg-muted/30">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
                                {React.createElement(STAGES[currentStage].icon, { className: "w-6 h-6" })}
                                {STAGES[currentStage].label}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Complete the required details for this step to proceed to the next stage.
                            </p>
                        </div>

                        <div className="p-6 space-y-6 min-h-[300px]">
                            {currentStage === 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                                    <div className="space-y-4 md:col-span-2">
                                        <div>
                                            <Label>Goods Receipt Note (GRN)</Label>
                                            <Input
                                                value={formData.grn}
                                                readOnly
                                                className="bg-muted font-mono font-bold text-primary mt-1.5"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">Auto-generated unique receipt identifier.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4 md:col-span-2">
                                        <div>
                                            <Label>Supplier Information</Label>
                                            <Input
                                                placeholder="Enter Supplier Name or ID"
                                                value={formData.supplierInfo}
                                                onChange={(e) => handleInputChange("supplierInfo", e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStage === 1 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                                    <div className="space-y-4">
                                        <Label>Warehouse Entry Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.entryDate}
                                            onChange={(e) => handleInputChange("entryDate", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <Label>Expected Quantity (units or kg)</Label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={formData.expectedQty}
                                            onChange={(e) => handleInputChange("expectedQty", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-4 md:col-span-2">
                                        <Label>Arrival Notes</Label>
                                        <Textarea
                                            placeholder="Condition of package, driver details, etc."
                                            value={formData.notes}
                                            onChange={(e) => handleInputChange("notes", e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            )}

                            {currentStage === 2 && (
                                <div className="grid grid-cols-1 gap-6 animate-fade-in">
                                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                                        <h3 className="font-semibold text-primary mb-2">Quantity Reconciliation</h3>
                                        <div className="flex justify-between items-center text-sm">
                                            <span>Expected: <strong className="text-foreground">{formData.expectedQty || '0'}</strong></span>
                                            <span>Difference: <strong className={`${Number(formData.receivedQty) - Number(formData.expectedQty) < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {formData.receivedQty ? Number(formData.receivedQty) - Number(formData.expectedQty) : '0'}
                                            </strong>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label>Actual Received Quantity</Label>
                                        <Input
                                            type="number"
                                            placeholder="Enter physical count"
                                            value={formData.receivedQty}
                                            onChange={(e) => handleInputChange("receivedQty", e.target.value)}
                                            className="text-lg py-6"
                                        />
                                    </div>
                                </div>
                            )}

                            {currentStage === 3 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                                    <div className="space-y-4 md:col-span-2">
                                        <Label>Product Quality Inspection</Label>
                                        <Select value={formData.qualityStatus} onValueChange={(v) => handleInputChange("qualityStatus", v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Inspection Result" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pass">Passed - Good Condition</SelectItem>
                                                <SelectItem value="minor_defect">Passed with Minor Defects</SelectItem>
                                                <SelectItem value="quarantine">Quarantine Needed</SelectItem>
                                                <SelectItem value="rejected">Rejected - Return to Supplier</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Image Upload section */}
                                    <div className="space-y-4 md:col-span-2 mt-4">
                                        <Label>Product Image Upload</Label>
                                        <div
                                            className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center bg-muted/20 cursor-pointer"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setSelectedFile(e.target.files[0]);
                                                        toast.success(`Selected image: ${e.target.files[0].name}`);
                                                    }
                                                }}
                                                className="hidden"
                                                accept="image/*"
                                            />
                                            {selectedFile ? (
                                                <>
                                                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                                                        <CheckCircle2 className="h-8 w-8" />
                                                    </div>
                                                    <p className="font-semibold text-foreground mb-1">{selectedFile.name}</p>
                                                    <p className="text-xs text-muted-foreground mb-4">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
                                                        Remove Image
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                                    </div>
                                                    <p className="font-semibold text-foreground mb-1">Click to upload or drag and drop</p>
                                                    <p className="text-xs text-muted-foreground mb-4">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                                                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                                                        <UploadCloud className="h-4 w-4 mr-2" />
                                                        Select Image
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStage === 4 && (
                                <div className="grid grid-cols-1 gap-6 animate-fade-in">
                                    <div className="space-y-4">
                                        <Label>Allocated Batch Number</Label>
                                        <div className="flex gap-4">
                                            <Input
                                                value={formData.batchNumber}
                                                onChange={(e) => handleInputChange("batchNumber", e.target.value)}
                                                className="font-mono text-lg font-bold"
                                            />
                                            <Button variant="outline" onClick={() => handleInputChange("batchNumber", `BATCH-${Math.floor(100000 + Math.random() * 900000)}`)}>
                                                Generate New
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">This batch number will be used for all internal tracking and export procedures.</p>
                                    </div>

                                    <div className="bg-muted p-4 rounded-lg mt-6 border border-border">
                                        <h4 className="font-bold mb-3 text-sm flex items-center"><Database className="h-4 w-4 mr-2" /> Stock Entry Summary</h4>
                                        <ul className="space-y-2 text-sm">
                                            <li className="flex justify-between"><span className="text-muted-foreground">GRN:</span> <strong>{formData.grn}</strong></li>
                                            <li className="flex justify-between"><span className="text-muted-foreground">Supplier:</span> <strong>{formData.supplierInfo || 'Not specified'}</strong></li>
                                            <li className="flex justify-between"><span className="text-muted-foreground">Quantity:</span> <strong>{formData.receivedQty || '0'} units</strong></li>
                                            <li className="flex justify-between"><span className="text-muted-foreground">Quality:</span> <strong>{formData.qualityStatus === 'pass' ? 'Passed' : formData.qualityStatus || 'Pending'}</strong></li>
                                            <li className="flex justify-between text-primary mt-2 pt-2 border-t border-border"><span className="font-semibold">Allocated Batch:</span> <strong className="font-mono">{formData.batchNumber}</strong></li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div >

                        <div className="p-4 border-t border-border bg-muted/10 flex justify-between">
                            <Button
                                variant="outline"
                                onClick={prevStage}
                                disabled={currentStage === 0 || isSubmitting}
                            >
                                Previous Step
                            </Button>

                            <Button
                                onClick={nextStage}
                                disabled={isSubmitting || (currentStage === STAGES.length - 1 && (products.length === 0 || warehouses.length === 0))}
                                className={currentStage === STAGES.length - 1 ? "bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed" : ""}
                            >
                                {isSubmitting ? (
                                    <>Saving... <Loader2 className="w-4 h-4 ml-2 animate-spin" /></>
                                ) : currentStage === STAGES.length - 1 ? (
                                    <>Confirm Stock Entry <CheckCircle2 className="w-4 h-4 ml-2" /></>
                                ) : (
                                    <>Next Step <ArrowRight className="w-4 h-4 ml-2" /></>
                                )}
                            </Button>
                        </div>
                    </Card >
                </>
            )}

            {activeTab === 'list' && (
                <Card className="bg-card border-border overflow-hidden shadow-lg p-6 animate-fade-in">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Database className="w-5 h-5 text-primary" />
                        Received Stock List
                    </h2>

                    {savedStocks.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/10">
                            <List className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No stock entries found.</p>
                            <Button variant="outline" className="mt-4" onClick={() => setActiveTab('entry')}>
                                Create First Entry
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-border">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Date</th>
                                        <th className="px-6 py-4 font-semibold">GRN</th>
                                        <th className="px-6 py-4 font-semibold">Batch</th>
                                        <th className="px-6 py-4 font-semibold">Supplier</th>
                                        <th className="px-6 py-4 font-semibold">Quantity</th>
                                        <th className="px-6 py-4 font-semibold">Quality</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {savedStocks.map((stock) => (
                                        <tr key={stock.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">{stock.entryDate}</td>
                                            <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{stock.grn}</td>
                                            <td className="px-6 py-4 font-mono text-xs text-primary font-bold">{stock.batchNumber}</td>
                                            <td className="px-6 py-4">{stock.supplierInfo || '—'}</td>
                                            <td className="px-6 py-4 font-semibold">{stock.receivedQty || '0'} units</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 flex items-center w-max gap-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${stock.qualityStatus === 'pass' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${stock.qualityStatus === 'pass' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                                    {stock.qualityStatus === 'pass' ? 'Passed' : stock.qualityStatus || 'Pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}
        </div >
    );
}
