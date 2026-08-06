export async function apiFetch(url: string, options: RequestInit = {}, retries = 2, timeoutMs = 15000): Promise<Response> {
  let attempt = 0;
  
  while (attempt <= retries) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(id);
      
      if (!response.ok) {
        let errorMsg = `HTTP Error: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errorMsg = errData.error;
          }
        } catch(e) {}
        throw new Error(errorMsg);
      }
      
      return response;
    } catch (error: any) {
      attempt++;
      if (attempt > retries) {
        if (error.name === 'AbortError') {
          console.error('[API] Request timed out:', url);
          throw new Error('Connection error. Please check your internet or try again.');
        }
        console.error('[API] Fetch failed:', error.message);
        throw new Error('Connection error. Please check your internet or try again.');
      }
      // Wait before retrying (exponential backoff)
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  
  throw new Error('Connection error. Please check your internet or try again.');
}
