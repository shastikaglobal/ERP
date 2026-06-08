import React, { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

type Vehicle = {
  id: string;
  license_plate: string;
  type: string;
};

type Props = {
  onSelect: (vehicleId: string) => void;
};

const VehicleEntryForm: React.FC<Props> = ({ onSelect }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    const fetchVehicles = async () => {
      const { data, error } = await supabase.from('vehicles').select('*');
      if (!error && data) setVehicles(data as Vehicle[]);
    };
    fetchVehicles();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelected(id);
    onSelect(id);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Vehicle</label>
      <select
        value={selected}
        onChange={handleChange}
        className="w-full rounded-md border bg-sidebar p-2 text-sidebar-foreground"
      >
        <option value="">Select a vehicle</option>
        {vehicles.map(v => (
          <option key={v.id} value={v.id}>
            {v.license_plate} – {v.type}
          </option>
        ))}
      </select>
    </div>
  );
};

export default VehicleEntryForm;
