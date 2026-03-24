const URLS: Record<string, string> = {
  schedule:
    "https://script.googleusercontent.com/macros/echo?user_content_key=AY5xjrTW6rX1zzFe4P5-JajuVPCw9Cm_S_aTN53pCY5CDMiIrTvwa5rT4BizToJ2EYfP-Bgdtcd8qU8njoLb09y939BFJurflo5LybTdLHGpXOI_kuM_ZxoNh08eZcRl0iCItcUKuM91-r2ea45NROd4yBYSC-wSnOYQY_IMCQ8zXzYyn3f1LXtYOj_6-UzdzFrWLDgtd5p2BffsVKYcM0WN-b7gwokYJiLdFYV_SPiTmobUvkHSkSOxmR6f9riErWYeJNF7pm8ZEy-_Bn-sICbeJ0NOvuzxFqsKBlxDtwTJ7UY7reKb6Hnwdq7I63nBJA&lib=MEoXfsZS0V3rHY2Z_S8VN8jTDv19RCRyF",
  pools:
    "https://script.googleusercontent.com/macros/echo?user_content_key=AY5xjrQdVQ0emQ4m2f7AU6s3fSWWZLoEPapOkuAPFkDA6flCwvAaUxQb_aSlAzwViPTK3jiY0irQqIzM78B-DVt50s5Mh0FUt66q1UxbX5t8hzrpU3S7X9ByUHlp_g0fwwI3bKoe_nlxxUfBNcGYOUgML2b6SGYq-EPCVNPyd96EPZQKJ2vFHkFuP7LKDqrU4FxtHMUDy7dUQkMQR9oYeMF8VVKOTjX-GThPDcm3eLV5u8O2dxIQ8XXJ2N4fvyo3SQEML5tbOEq1zOf9iv_OcPb_fZI0BiQvqxBf5aH6AkFhS-RlLFqC5zk&lib=MEoXfsZS0V3rHY2Z_S8VN8jTDv19RCRyF",
};

// Cache for 1 hour, but refresh in background after 10 minutes
const MAX_AGE = 3600;
const STALE_AFTER = 600;

async function fetchUpstream(upstream: string): Promise<Response> {
  const response = await fetch(upstream, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Upstream error");
  return response;
}

function buildResponse(data: string): Response {
  return new Response(data, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${MAX_AGE}, s-maxage=${MAX_AGE}`,
      "X-Cached-At": String(Date.now()),
    },
  });
}

export const onRequest: PagesFunction = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const route = url.pathname.replace("/api/", "");
  const upstream = URLS[route];

  if (!upstream) {
    return new Response("Not found", { status: 404 });
  }

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), request);
  const cached = await cache.match(cacheKey);

  if (cached) {
    // Check if stale — if so, refresh in background but serve immediately
    const cachedAt = Number(cached.headers.get("X-Cached-At") || 0);
    if (Date.now() - cachedAt > STALE_AFTER * 1000) {
      context.waitUntil(
        fetchUpstream(upstream)
          .then(async (res) => {
            const data = await res.text();
            await cache.put(cacheKey, buildResponse(data));
          })
          .catch(() => {}),
      );
    }
    return cached;
  }

  // Cold cache — must wait (only happens once ever)
  try {
    const res = await fetchUpstream(upstream);
    const data = await res.text();
    const result = buildResponse(data);
    await cache.put(cacheKey, result.clone());
    return result;
  } catch {
    return new Response("Upstream error", { status: 502 });
  }
};
