const fs = require('fs');
let code = fs.readFileSync('src/pages/crm/ScreenMonitor.tsx', 'utf8');

// Replace pc.onicecandidate in LiveViewerModal
code = code.replace(/pc\.onicecandidate = async \(e\) => \{[\s\S]*?    \};/g, 
  `pc.onicecandidate = (e) => {
      if (e.candidate && window._ws && window._ws.readyState === 1) {
        window._ws.send(JSON.stringify({ type: 'candidate', targetId: targetUser.id, candidate: e.candidate }));
      }
    };`);

// Replace requestWatch block
code = code.replace(/const requestWatch = async \(\) => \{[\s\S]*?requestWatch\(\);/g, 
  `const wsUrl = import.meta.env.VITE_VPS_API_URL?.replace('http', 'ws') || "ws://" + window.location.hostname + ":8082";
    const ws = new WebSocket(wsUrl);
    window._ws = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'register', userId: adminId.current }));
      ws.send(JSON.stringify({ type: 'watch_request', targetId: targetUser.id }));
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: 'answer', targetId: targetUser.id, answer }));
      } else if (data.type === 'candidate' && data.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    };`);

// Add ws.close()
code = code.replace(/pc\.close\(\);/, 'pc.close();\n      if(window._ws) window._ws.close();');

// Replace useScreenBroadcaster
code = code.replace(/function useScreenBroadcaster\(userId: string \| undefined, stream: MediaStream \| null\) \{[\s\S]*?\}\n/g, 
  `function useScreenBroadcaster(userId: string | undefined, stream: MediaStream | null) {
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  useEffect(() => {
    if (!userId || !stream) return;

    const wsUrl = import.meta.env.VITE_VPS_API_URL?.replace('http', 'ws') || "ws://" + window.location.hostname + ":8082";
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'register', userId }));
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      const fromId = data.fromId;
      if (!fromId) return;

      if (data.type === 'watch_request') {
        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcsRef.current.set(fromId, pc);

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.onicecandidate = (e) => {
          if (e.candidate && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'candidate', targetId: fromId, candidate: e.candidate }));
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'offer', targetId: fromId, offer }));
        }
      } else if (data.type === 'answer' && data.answer) {
        const pc = pcsRef.current.get(fromId);
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      } else if (data.type === 'candidate' && data.candidate) {
        const pc = pcsRef.current.get(fromId);
        if (pc) await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    };

    return () => {
      ws.close();
      pcsRef.current.forEach(pc => pc.close());
      pcsRef.current.clear();
    };
  }, [userId, stream]);
}\n`);

fs.writeFileSync('src/pages/crm/ScreenMonitor.tsx', code);
console.log('Fixed WebRTC Signaling!');
