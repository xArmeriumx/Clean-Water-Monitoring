/**
 * Vercel Edge Middleware
 * 
 * Adds X-Proxy-Secret header to API requests before forwarding
 * to the backend, preventing unauthorized proxy usage.
 */

export const config = {
  matcher: '/api/:path*',
};

export default function middleware(request) {
  // Get the proxy secret from environment
  const proxySecret = process.env.PROXY_SECRET;
  
  if (!proxySecret) {
    console.warn('[Middleware] PROXY_SECRET not configured');
    return;
  }

  // Get the backend URL from vercel.json destination
  const backendUrl = 'https://api-water-monitoring.onrender.com';
  
  // Build the destination URL
  const url = new URL(request.url);
  const apiPath = url.pathname; // e.g., /api/users
  const destinationUrl = `${backendUrl}${apiPath}${url.search}`;

  // Clone headers and add proxy secret
  const headers = new Headers(request.headers);
  headers.set('X-Proxy-Secret', proxySecret);

  // Forward the request with the secret header
  return fetch(destinationUrl, {
    method: request.method,
    headers: headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    redirect: 'manual',
  });
}
