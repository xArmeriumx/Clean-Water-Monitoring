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

  // 🔒 Security: Check Referer/Origin to prevent direct access
  // This ensures the request comes from our website, not typed in the browser
  const referer = request.headers.get('referer');
  const origin = request.headers.get('origin');
  
  // Define allowed domains (adjust as needed)
  const isAllowed = 
    (referer && (
      referer.includes('cleanwatermonitoring.com') || 
      referer.includes('vercel.app') || 
      referer.includes('localhost')
    )) ||
    (origin && (
      origin.includes('cleanwatermonitoring.com') || 
      origin.includes('vercel.app') || 
      origin.includes('localhost')
    ));

  // If request doesn't come from our site, block it
  if (!isAllowed) {
    return new Response(JSON.stringify({ 
      error: 'Forbidden', 
      message: 'Direct API access is not allowed.' 
    }), {
      status: 403, 
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get the backend URL from environment
  const backendUrl = process.env.API_URL;
  
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
