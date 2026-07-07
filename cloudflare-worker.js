/**
 * Cloudflare Worker CDN for Supabase Storage Images
 * Caches optimized images at the edge.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Only allow GET requests for image retrieval
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }

    const cache = caches.default;
    
    // Normalize URL to generate a clean cache key
    const cacheUrl = new URL(request.url);
    
    // Strip common marketing and tracking query parameters that fragment the cache
    const trackingParams = ["utm_source", "utm_medium", "utm_campaign", "fbclid", "gclid", "msclkid", "sc_cid"];
    trackingParams.forEach(param => cacheUrl.searchParams.delete(param));
    
    // Create a clean request key using only the GET method and normalized URL.
    // This strips Cookies, Authorization, User-Agent, and other headers that prevent caching.
    const cacheKey = new Request(cacheUrl.toString(), {
      method: "GET"
    });

    // Check if the request is already cached by Cloudflare using the clean key
    let response = await cache.match(cacheKey);

    if (!response) {
      // Configuration variables (can be set in Cloudflare dashboard env vars)
      const SUPABASE_DOMAIN = env.SUPABASE_DOMAIN || "abldpbbhlqsnufmzojgc.supabase.co";
      
      let path = url.pathname;
      const routePrefix = env.ROUTE_PREFIX || ""; // e.g. "/cdn-image" if not using a subdomain
      if (routePrefix && path.startsWith(routePrefix)) {
        path = path.substring(routePrefix.length);
      }

      // Construct the URL to fetch from Supabase public storage
      const targetUrl = `https://${SUPABASE_DOMAIN}/storage/v1/object/public${path}`;

      try {
        const res = await fetch(targetUrl, {
          headers: {
            "User-Agent": "Cloudflare-Worker-CDN",
          },
          cf: {
            cacheTtl: 31536000, // Caches sub-request at the edge for 1 year, overriding Supabase 3600s headers
            cacheEverything: true
          }
        });

        // If not found or error, return the original error without caching
        if (!res.ok) {
          return new Response(res.body, {
            status: res.status,
            statusText: res.statusText,
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "X-Cache-Status": "MISS"
            }
          });
        }

        const contentType = res.headers.get("Content-Type") || "image/webp";

        // Create a new response with browser & edge caching headers
        response = new Response(res.body, {
          status: res.status,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
            "Access-Control-Allow-Origin": "*",
            "X-Cache-Status": "MISS",
            "X-Content-Type-Options": "nosniff"
          },
        });

        // Store response in cache asynchronously
        ctx.waitUntil(cache.put(cacheKey, response.clone()));

      } catch (err) {
        return new Response(`Error fetching image: ${err.message}`, { status: 500 });
      }
    } else {
      // Add a header indicator for cache HITs
      response = new Response(response.body, response);
      response.headers.set("X-Cache-Status", "HIT");
    }

    return response;
  },
};
