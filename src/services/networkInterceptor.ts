import { getSystemTimezone } from '@/utils/dateTimeUtils';

// Intercept and wrap global fetch
if (global.fetch) {
  const originalFetch = global.fetch;
  global.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const timezone = getSystemTimezone();
    
    if (!init) {
      init = {};
    }
    
    // Normalize and add X-Timezone header
    let headers: HeadersInit = {};
    if (init.headers) {
      if (init.headers instanceof Headers) {
        headers = new Headers(init.headers);
        headers.set('X-Timezone', timezone);
      } else if (Array.isArray(init.headers)) {
        headers = [...init.headers];
        const hasTimezone = headers.some(([key]) => key.toLowerCase() === 'x-timezone');
        if (!hasTimezone) {
          headers.push(['X-Timezone', timezone]);
        }
      } else {
        headers = { ...init.headers, 'X-Timezone': timezone };
      }
    } else {
      headers = { 'X-Timezone': timezone };
    }
    
    init.headers = headers;
    return originalFetch(input, init);
  };
}
