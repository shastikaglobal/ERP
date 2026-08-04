import { useState, useCallback } from 'react';
import { toast } from 'sonner';
// import { vpsDb } from '@/lib/vpsDb'; // Removed

export function useVpsDbCrud(tableName: string) {
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/${tableName}`);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      return { data, error: null };
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch');
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  const addRecord = async (newData: any) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/${tableName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });
      if (!res.ok) throw new Error('Insert failed');
      const data = await res.json();
      return { data, error: null };
    } catch (err: any) {
      toast.error(err.message || 'Failed to insert');
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const updateRecord = async (id: string, updateData: any) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/${tableName}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (!res.ok) throw new Error('Update failed');
      const data = await res.json();
      return { data, error: null };
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/${tableName}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      return { error: null };
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  return { loading, fetchRecords, addRecord, updateRecord, deleteRecord };
}
