export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '');
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders() });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response('Invalid JSON', { status: 400, headers: corsHeaders() });
    }

    if (path.endsWith('/sign')) {
      const folder = body.folder ? String(body.folder) : '';
      if (!env.CLOUDINARY_API_SECRET || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_CLOUD_NAME) {
        return new Response('Cloudinary env vars not set', { status: 500, headers: corsHeaders() });
      }
      const timestamp = Math.floor(Date.now() / 1000);
      let paramsToSign = `timestamp=${timestamp}`;
      if (folder) paramsToSign += `&folder=${folder}`;

      const signature = await sha1Hex(paramsToSign + env.CLOUDINARY_API_SECRET);

      return new Response(JSON.stringify({
        api_key: env.CLOUDINARY_API_KEY,
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        timestamp,
        signature,
        folder
      }), { status: 200, headers: jsonHeaders() });
    }

    if (path.endsWith('/shorten')) {
      const fullUrl = body.url;
      if (!fullUrl) return new Response('Missing url', { status: 400, headers: corsHeaders() });
      try {
        const api = 'https://is.gd/create.php?format=json&url=' + encodeURIComponent(fullUrl);
        const res = await fetch(api);
        const json = await res.json();
        return new Response(JSON.stringify({ shorturl: json.shorturl || null, fullurl: fullUrl }), { status: 200, headers: jsonHeaders() });
      } catch (err) {
        return new Response('Shortener failed: ' + String(err), { status: 500, headers: corsHeaders() });
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders() });

    function jsonHeaders() {
      return { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
    }
    function corsHeaders() {
      return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST,OPTIONS' };
    }

    async function sha1Hex(str) {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  }
};
