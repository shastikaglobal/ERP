import { supabase } from "@/integrations/supabase/client";

export type Container = {
  id: string;
  shipmentId: string;
  container_number: string;
  type: string;
  weight: number;
  status: string;
  location: string;
};

let listeners: Array<() => void> = [];

export const shipmentStore = {
  getContainers: async () => {
    const { data, error } = await supabase
      .from("shipment_containers")
      .select(`
        id,
        container_number,
        type,
        weight,
        status,
        location,
        shipments (
          shipment_number,
          customer_name,
          origin,
          destination,
          carrier
        )
      `);
    
    if (error) {
      console.error("Error fetching containers:", error);
      return [];
    }

    return (data || []).map((c: any) => ({
      id: c.id,
      shipmentId: c.shipments?.shipment_number || "Unknown",
      customer: c.shipments?.customer_name || "—",
      route: (c.shipments?.origin && c.shipments?.destination) 
        ? `${c.shipments.origin} → ${c.shipments.destination}` 
        : "—",
      carrier: c.shipments?.carrier || "—",
      container_number: c.container_number,
      type: c.type,
      weight: parseFloat(c.weight),
      status: c.status,
      location: c.location,
    }));
  },

  updateContainerStatus: async (id: string, status: string) => {
    const { error } = await supabase
      .from("shipment_containers")
      .update({ status })
      .eq("id", id);
    
    if (error) {
      console.error("Error updating container status:", error);
      throw error;
    }

    listeners.forEach(l => l());
  },

  subscribe: (listener: () => void) => {
    listeners.push(listener);
    
    // Set up real-time subscription via Supabase
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipment_containers'
        },
        () => {
          listener();
        }
      )
      .subscribe();

    return () => {
      listeners = listeners.filter(l => l !== listener);
      supabase.removeChannel(channel);
    };
  }
};
