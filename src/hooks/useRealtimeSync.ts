import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';


// Global counter for non-React Query components
let globalSyncCounter = 0;
const subscribers = new Set<(counter: number) => void>();

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const [syncCounter, setSyncCounter] = useState(globalSyncCounter);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Local subscription to global sync counter
    const handleUpdate = (newCounter: number) => {
      setSyncCounter(newCounter);
    };
    subscribers.add(handleUpdate);

    // Only set up Supabase channel once globally (first subscriber does it)
    if (globalSyncCounter === 0 && subscribers.size === 1) {
      // NOTE: Supabase Realtime has been disabled due to quota limits and 
      // the authentication migration. The global sync counter remains for 
      // future local WebSocket implementations.
      
      /*
      
      */

      return () => {
        subscribers.delete(handleUpdate);
        if (subscribers.size === 0) {
          // 
        }
      };
    }

    return () => {
      subscribers.delete(handleUpdate);
    };
  }, [queryClient]);

  return { syncCounter };
}
