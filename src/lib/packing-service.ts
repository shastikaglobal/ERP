import { supabase } from "./supabase";

export interface PackingProtocol {
    id: string;
    receiving_id: string;
    carton_count: number;
    net_weight: number;
    gross_weight: number;
    pallet_config: string;
    export_marks: string;
    status: "draft" | "in_progress" | "completed" | "archived";
    company_id: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface CreatePackingInput {
    receiving_id: string;
    carton_count: number;
    net_weight: number;
    gross_weight: number;
    pallet_config: string;
    export_marks: string;
    status?: "draft" | "in_progress" | "completed";
}

// Create packing protocol
export async function createPackingProtocol(
    data: CreatePackingInput,
    companyId: string,
    userId: string
): Promise<PackingProtocol> {
    try {
        const { data: packing, error } = await supabase
            .from("packing_protocols")
            .insert([
                {
                    receiving_id: data.receiving_id,
                    carton_count: data.carton_count,
                    net_weight: data.net_weight,
                    gross_weight: data.gross_weight,
                    pallet_config: data.pallet_config,
                    export_marks: data.export_marks,
                    status: data.status || "draft",
                    company_id: companyId,
                    created_by: userId,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error("Supabase error:", error);
            throw new Error(
                error.message || "Failed to create packing protocol. Please ensure the database table exists."
            );
        }

        return packing;
    } catch (error: any) {
        console.error("Error in createPackingProtocol:", error);
        throw error;
    }
}

// Get all packing protocols for a company
export async function getPackingProtocols(
    companyId: string,
    filters?: {
        status?: string;
        search?: string;
    }
): Promise<PackingProtocol[]> {
    let query = supabase
        .from("packing_protocols")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

    if (filters?.status) {
        query = query.eq("status", filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
}

// Get single packing protocol
export async function getPackingProtocolById(
    id: string
): Promise<PackingProtocol> {
    const { data, error } = await supabase
        .from("packing_protocols")
        .select("*")
        .eq("id", id)
        .single();

    if (error) throw error;
    return data;
}

// Update packing protocol
export async function updatePackingProtocol(
    id: string,
    updates: Partial<PackingProtocol>
): Promise<PackingProtocol> {
    const { data, error } = await supabase
        .from("packing_protocols")
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Delete packing protocol
export async function deletePackingProtocol(id: string): Promise<void> {
    const { error } = await supabase
        .from("packing_protocols")
        .delete()
        .eq("id", id);

    if (error) throw error;
}

// Get packing statistics
export async function getPackingStats(companyId: string) {
    const { data, error } = await supabase
        .from("packing_protocols")
        .select("status")
        .eq("company_id", companyId);

    if (error) throw error;

    const stats = {
        total: data?.length || 0,
        completed: data?.filter((p) => p.status === "completed").length || 0,
        in_progress: data?.filter((p) => p.status === "in_progress").length || 0,
        pending: data?.filter((p) => p.status === "draft").length || 0,
    };

    return stats;
}

// Get packing data for PDF generation
export async function getPackingListPDF(packingId: string) {
    const packing = await getPackingProtocolById(packingId);

    let receiving = { receiving_number: packing.receiving_id };

    try {
        // Try to fetch receiving details from inventory_batches if possible
        if (packing.receiving_id && packing.receiving_id.length === 36 && packing.receiving_id.includes('-')) {
            const { data } = await supabase.from("inventory_batches").select("lot_number").eq("id", packing.receiving_id).maybeSingle();
            if (data) receiving.receiving_number = data.lot_number;
        } else {
            const { data } = await supabase.from("inventory_batches").select("lot_number").eq("lot_number", packing.receiving_id).maybeSingle();
            if (data) receiving.receiving_number = data.lot_number;
        }
    } catch (e) {
        console.warn("Could not fetch receiving info, using raw ID", e);
    }

    // Get company details
    const { data: company, error: compError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", packing.company_id)
        .single();

    if (compError) throw compError;

    return {
        packing,
        receiving,
        company,
    };
}

// Get receiving not yet packed
export async function getUnpackedReceivings(
    companyId: string
): Promise<any[]> {
    const { data, error } = await supabase
        .from("inventory_batches")
        .select(`
            id,
            lot_number,
            status,
            quantity_kg,
            received_date
        `)
        .eq("company_id", companyId)
        .order("received_date", { ascending: false });

    if (error) {
        console.error("Error fetching batches:", error);
        return [];
    }

    return (data || []).map((batch: any) => ({
        id: batch.id,
        receiving_number: batch.lot_number || `BATCH-${batch.id.substring(0, 6)}`,
        supplier_id: null,
        status: batch.status,
        total_items: batch.quantity_kg,
        created_at: batch.received_date
    }));
}

// Validate packing data
export function validatePackingData(data: CreatePackingInput): string[] {
    const errors: string[] = [];

    if (!data.receiving_id) errors.push("Receiving ID is required");
    if (data.carton_count <= 0) errors.push("Carton count must be greater than 0");
    if (data.net_weight <= 0) errors.push("Net weight must be greater than 0");
    if (data.gross_weight <= 0) errors.push("Gross weight must be greater than 0");
    if (data.net_weight > data.gross_weight) {
        errors.push("Net weight cannot be greater than gross weight");
    }

    return errors;
}
