import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// TEMPORARY: Global network interceptor to debug 400 errors
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
  return originalFetch.apply(this, args).then((response) => {
    if (response.status === 400) {
      console.error('❌ 400 ERROR DETECTED:', {
        url,
        status: response.status,
        statusText: response.statusText
      });
    }
    return response;
  }).catch(err => {
    console.error('❌ FETCH ERROR:', { url, error: err });
    throw err;
  });
};

// Intercept XMLHttpRequest as well
const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...rest: any[]) {
  (this as any)._requestURL = url;
  return originalXHROpen.apply(this, [method, url, ...rest] as any);
};
const originalXHRSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function(...args: any[]) {
  this.addEventListener('load', function() {
    if (this.status === 400) {
      console.error('❌ 400 ERROR DETECTED (XHR):', {
        url: (this as any)._requestURL,
        status: this.status,
        statusText: this.statusText,
        responseURL: this.responseURL
      });
    }
  });
  return originalXHRSend.apply(this, args);
};

createRoot(document.getElementById("root")!).render(<App />);
