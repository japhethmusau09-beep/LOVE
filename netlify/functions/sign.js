const crypto = require('crypto');

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

  const folder = body.folder ? String(body.folder) : undefined;
  const timestamp = Math.floor(Date.now() / 1000);

  if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
    return { statusCode: 500, body: 'Cloudinary env variables not configured' };
  }

  let paramsToSign = `timestamp=${timestamp}`;
  if (folder) paramsToSign += `&folder=${folder}`;

  const signature = crypto.createHash('sha1').update(paramsToSign + process.env.CLOUDINARY_API_SECRET).digest('hex');

  return {
    statusCode: 200,
    body: JSON.stringify({
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      timestamp,
      signature,
      folder: folder || ''
    })
  };
};
