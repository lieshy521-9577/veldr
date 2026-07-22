/**
 * Network Monitor Utility
 * Helps debug network requests and responses
 */

class NetworkMonitor {
  constructor() {
    this.requests = new Map();
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Store original fetch
    const originalFetch = window.fetch;
    
    // Override fetch
    window.fetch = async (...args) => {
      const requestId = Date.now() + Math.random();
      const url = args[0];
      const options = args[1] || {};
      
      console.log(`🌐 [${requestId}] Request:`, {
        url,
        method: options.method || 'GET',
        headers: options.headers,
        body: options.body
      });
      
      const startTime = Date.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`✅ [${requestId}] Response:`, {
          status: response.status,
          statusText: response.statusText,
          duration: `${duration}ms`,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        // Clone response to read body
        const clonedResponse = response.clone();
        try {
          const data = await clonedResponse.json();
          console.log(`📦 [${requestId}] Response Data:`, data);
        } catch (e) {
          console.log(`📦 [${requestId}] Response Data: (non-JSON)`);
        }
        
        return response;
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.error(`❌ [${requestId}] Error:`, {
          error: error.message,
          duration: `${duration}ms`
        });
        
        throw error;
      }
    };
  }
}

// Create global instance
const networkMonitor = new NetworkMonitor();

export default networkMonitor;
