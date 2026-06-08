import React, { useEffect, useState } from 'react';
import { useAuth, useCan } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import VehicleEntryForm from '@/components/dispatch/VehicleEntryForm';
import DriverSelect from '@/components/dispatch/DriverSelect';
import SchedulerCalendar from '@/components/dispatch/SchedulerCalendar';
import GatePassCard from '@/components/dispatch/GatePassCard';
import ChallanPreview from '@/components/dispatch/ChallanPreview';
import StatusTimeline from '@/components/dispatch/StatusTimeline';
import { useNavigate } from 'react-router-dom';

const Dispatch = () => {
  const { profile } = useAuth();
  const canDispatch = useCan('shipments.dispatch');
  const navigate = useNavigate();

  const [vehicleId, setVehicleId] = useState<string>('');
  const [driverId, setDriverId] = useState<string>('');
  const [schedule, setSchedule] = useState<{ start: string; end: string } | null>(null);
  const [gatePassToken, setGatePassToken] = useState<string>('');
  const [statusLogs, setStatusLogs] = useState<any[]>([]);

  // Real‑time subscription
  useEffect(() => {
    const channel = supabase.channel('public:shipment_status_logs');
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipment_status_logs' }, payload => {
        setStatusLogs(prev => [...prev, payload.new]);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreateShipment = async () => {
    if (!vehicleId || !driverId || !schedule) return;
    try {
      const { data: shipment } = await supabase.from('shipments').insert([
        {
          vehicle_id: vehicleId,
          driver_id: driverId,
          schedule_start: schedule.start,
          schedule_end: schedule.end,
          status: 'pending',
        },
      ]).select().single();
      // generate gate pass token
      const token = `SHIP-${shipment.id}-${Date.now()}`;
      await supabase.from('shipments').update({ gate_pass_token: token }).eq('id', shipment.id);
      setGatePassToken(token);
      // redirect to detail view if needed
      navigate(`/shipments/${shipment.id}`);
    } catch (err) {
      console.error('Failed to create shipment', err);
    }
  };

  if (!canDispatch) {
    return <div className="p-4 text-red-500">You do not have permission to dispatch shipments.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">New Shipment Dispatch</h1>
      <VehicleEntryForm onSelect={setVehicleId} />
      <DriverSelect onSelect={setDriverId} />
      <SchedulerCalendar onSchedule={setSchedule} />
      <button
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80"
        onClick={handleCreateShipment}
      >
        Create Shipment
      </button>
      {gatePassToken && <GatePassCard token={gatePassToken} />}
      {/* Placeholder for challan preview – could be generated after shipment creation */}
      {gatePassToken && <ChallanPreview shipmentId={gatePassToken.split('-')[1]} />}
      <StatusTimeline logs={statusLogs} />
    </div>
  );
};

export default Dispatch;
