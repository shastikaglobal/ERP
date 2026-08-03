import { useEffect, useRef } from "react";


export function useScreenBroadcaster(userId: string | undefined, stream: MediaStream | null) {
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  useEffect(() => {
    if (!userId || !stream) return;

    const channelName = `broadcaster_${userId}_${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
    
    // NOTE: VpsDb Realtime has been disabled. 
    // This feature will degrade gracefully.
    /*
    
    */

    return () => {
      // 
      pcsRef.current.forEach(pc => pc.close());
      pcsRef.current.clear();
    };
  }, [userId, stream]);
}
