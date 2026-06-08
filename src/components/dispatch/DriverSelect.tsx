import React, { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

type Driver = {
  id: string;
  full_name: string;
  license_number: string;
};

type Props = {
  onSelect: (driverId: string) => void;
};

const DriverSelect: React.FC<Props> = ({ onSelect }) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    const fetchDrivers = async () => {
      const { data, error } = await supabase.from('drivers').select('id, full_name, license_number');
      if (!error && data) setDrivers(data as Driver[]);
    };
    fetchDrivers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelected(id);
    onSelect(id);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Driver</label>
      <select
        value={selected}
        onChange={handleChange}
        className="w-full rounded-md border bg-sidebar p-2 text-sidebar-foreground"
      >
        <option value="">Select a driver</option>
        {drivers.map(d => (
          <option key={d.id} value={d.id}>
            {d.full_name} – {d.license_number}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DriverSelect;
