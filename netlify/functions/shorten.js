exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body = {};
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (e) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const url = body.url;
  if (!url) return { statusCode: 400, body: 'Missing url' };

  try {
    const api = 'https://is.gd/create.php?format=json&url=' + encodeURIComponent(url);
    const res = await fetch(api);
    if (!res.ok) {
      const text = await res.text();
      return { statusCode: 502, body: 'Shortener error: ' + text };
    }
    const json = await res.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ shorturl: json.shorturl || null, fullurl: url })
    };
  } catch (err) {
    return { statusCode: 500, body: 'Shortener failed: ' + String(err) };
  }
};
