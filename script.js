// script.js
// Client script updated to use server-side signing (Netlify/Cloudflare) and server-side shortening.

(function () {
  function base64Encode(str) { return btoa(unescape(encodeURIComponent(str))); }
  function base64Decode(b64) { return decodeURIComponent(escape(atob(b64))); }
  function toBase64Url(json) { return base64Encode(JSON.stringify(json)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function fromBase64Url(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return JSON.parse(base64Decode(s)); }

  const fromName = document.getElementById('fromName');
  const toName = document.getElementById('toName');
  const specialDate = document.getElementById('specialDate');
  const templateSelect = document.getElementById('templateSelect');
  const loveText = document.getElementById('loveText');
  const photoInput = document.getElementById('photoInput');
  const photoWarning = document.getElementById('photoWarning');
  const youtubeLinkInput = document.getElementById('youtubeLink');
  const shareLinkInput = document.getElementById('shareLink');
  const viewerHeader = document.getElementById('viewerHeader');
  const viewerSection = document.getElementById('viewer');
  const creatorSection = document.getElementById('creator');
  const dearEl = document.getElementById('dear');
  const viewerGifts = document.getElementById('viewerGifts');
  const youtubeFrame = document.getElementById('youtubeFrame');
  const viewerPhotos = document.getElementById('viewerPhotos');
  const giftsCard = document.getElementById('giftsCard');
  const progressive = document.getElementById('progressive');
  const photoPreview = document.getElementById('photoPreview');

  let selectedGifts = new Set();
  let uploadedPhotoUrls = [];

  window.toggleGift = function (el, emoji) { if (!selectedGifts) selectedGifts = new Set(); if (selectedGifts.has(emoji)) { selectedGifts.delete(emoji); el.classList.remove('selected'); } else { selectedGifts.add(emoji); el.classList.add('selected'); } };

  function compressImage(file, maxDimension = 1200) { return new Promise((resolve, reject) => { const img = new Image(); const fr = new FileReader(); fr.onload = () => { img.src = fr.result; }; fr.onerror = reject; img.onload = () => { let { width, height } = img; const scale = Math.min(1, maxDimension / Math.max(width, height)); if (scale < 1) { width = Math.round(width * scale); height = Math.round(height * scale); } const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); canvas.toBlob(blob => { if (blob) resolve(new File([blob], file.name, { type: blob.type })); else reject(new Error('Canvas toBlob failed')); }, 'image/jpeg', 0.85); }; fr.readAsDataURL(file); }); }

  async function getSigner(folder = '') {
    const endpoints = ['/.netlify/functions/sign', '/api/sign'];
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder }) });
        if (!res.ok) continue;
        return await res.json();
      } catch (e) { continue; }
    }
    return null;
  }

  async function uploadToCloudinarySigned(file, folder = '') {
    const signer = await getSigner(folder);
    if (!signer) throw new Error('No signing endpoint available');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('timestamp', String(signer.timestamp));
    fd.append('api_key', signer.api_key);
    fd.append('signature', signer.signature);
    if (signer.folder) fd.append('folder', signer.folder);
    const uploadUrl = 'https://api.cloudinary.com/v1_1/' + signer.cloud_name + '/upload';
    const res = await fetch(uploadUrl, { method: 'POST', body: fd });
    if (!res.ok) { const text = await res.text(); throw new Error('Upload failed: ' + text); }
    const json = await res.json();
    return json.secure_url || json.url;
  }

  async function shortenServerSide(fullUrl) {
    const endpoints = ['/.netlify/functions/shorten', '/api/shorten'];
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: fullUrl }) });
        if (!res.ok) continue;
        const j = await res.json();
        if (j && j.shorturl) return j.shorturl;
      } catch (e) { continue; }
    }
    return null;
  }

  window.handlePhotos = async function (ev) {
    const files = ev.target.files;
    uploadedPhotoUrls = [];
    if (files.length > 3) photoWarning.style.display = 'block'; else photoWarning.style.display = 'none';
    if (!photoPreview) return;
    photoPreview.innerHTML = '';

    const list = Array.from(files).slice(0, 3);
    const signer = await getSigner();
    if (signer) {
      const uploadNote = document.createElement('div'); uploadNote.textContent = 'Uploading photos...'; photoPreview.appendChild(uploadNote);
      for (const file of list) {
        try {
          const compressed = await compressImage(file, 1200);
          const url = await uploadToCloudinarySigned(compressed);
          uploadedPhotoUrls.push(url);
          const img = document.createElement('img'); img.src = url; img.alt = 'memory'; photoPreview.appendChild(img);
        } catch (err) { console.error('Photo upload failed', err); alert('A photo failed to upload. It will be skipped.'); }
      }
      if (uploadNote.parentNode) uploadNote.parentNode.removeChild(uploadNote);
    } else {
      list.forEach(file => { const fr = new FileReader(); fr.onload = () => { const img = document.createElement('img'); img.src = fr.result; img.alt = 'memory'; photoPreview.appendChild(img); }; fr.readAsDataURL(file); });
    }
  };

  function buildPayload() { return { from: fromName.value || '', to: toName.value || '', date: specialDate.value || '', template: templateSelect.value || '', text: loveText.value || '', gifts: Array.from(selectedGifts || []), youtube: youtubeLinkInput ? youtubeLinkInput.value || '' : '', photos: uploadedPhotoUrls.slice(0,3) }; }
  function createFullUrl(payload) { const encoded = toBase64Url(payload); return location.origin + location.pathname + '#data=' + encoded; }

  window.generateLink = async function () {
    const payload = buildPayload();
    const fullUrl = createFullUrl(payload);
    if (fullUrl.length > 1800) { if (!confirm('The generated link is quite large and may not shorten reliably. Continue anyway?')) return; }
    shareLinkInput.value = 'Generating...';
    const short = await shortenServerSide(fullUrl);
    if (short) shareLinkInput.value = short; else { shareLinkInput.value = fullUrl; alert('Could not shorten the link (shortener unavailable). The full link is provided instead.'); }
  };

  window.copyLink = async function () { const val = shareLinkInput.value; if (!val) return alert('No link to copy — generate one first.'); try { await navigator.clipboard.writeText(val); alert('Link copied to clipboard!'); } catch (err) { const tmp = document.createElement('textarea'); tmp.value = val; document.body.appendChild(tmp); tmp.select(); document.execCommand('copy'); document.body.removeChild(tmp); alert('Link copied to clipboard!'); } };

  window.shareWhatsApp = function () { const link = shareLinkInput.value; if (!link) return alert('No link to share — generate one first.'); const text = encodeURIComponent('I made this for you: ' + link); const wa = 'https://wa.me/?text=' + text; window.open(wa, '_blank'); };

  function renderViewer(payload) { if (creatorSection) creatorSection.classList.add('hidden'); if (viewerHeader) viewerHeader.classList.remove('hidden'); if (viewerSection) viewerSection.classList.remove('hidden'); dearEl.textContent = payload.to ? 'Dear ' + payload.to : 'Hello'; progressive.innerText = payload.text || ''; viewerGifts.innerHTML = ''; if (payload.gifts && payload.gifts.length) { payload.gifts.forEach(g => { const d = document.createElement('div'); d.className = 'gift'; d.textContent = g; viewerGifts.appendChild(d); }); giftsCard.style.display = ''; } else { giftsCard.style.display = 'none'; } youtubeFrame.innerHTML = ''; if (payload.youtube && payload.youtube.includes('youtube')) { const m = payload.youtube.match(/[?&]v=([^&]+)/); const id = m ? m[1] : null; if (id) { const iframe = document.createElement('iframe'); iframe.width = '100%'; iframe.height = '250'; iframe.src = 'https://www.youtube.com/embed/' + id + '?rel=0'; iframe.frameBorder = '0'; iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'; iframe.allowFullscreen = true; youtubeFrame.appendChild(iframe); } } viewerPhotos.innerHTML = ''; if (payload.photos && payload.photos.length) { payload.photos.forEach(url => { const img = document.createElement('img'); img.src = url; img.alt = 'memory'; viewerPhotos.appendChild(img); }); } }

  function tryLoadFromFragment() { const hash = location.hash || ''; if (!hash.startsWith('#data=')) return false; const encoded = hash.slice(6); try { const payload = fromBase64Url(encoded); renderViewer(payload); const fullUrl = createFullUrl(payload); shareLinkInput.value = fullUrl; shortenServerSide(fullUrl).then(short => { if (short) shareLinkInput.value = short; }); return true; } catch (err) { console.warn('Failed to parse payload from URL fragment.', err); return false; } }

  document.addEventListener('DOMContentLoaded', () => { const loaded = tryLoadFromFragment(); if (!loaded) { if (creatorSection) creatorSection.classList.remove('hidden'); if (viewerHeader) viewerHeader.classList.add('hidden'); if (viewerSection) viewerSection.classList.add('hidden'); } });

  window.previewSong = function () { const url = youtubeLinkInput ? youtubeLinkInput.value : ''; if (!url) return alert('Paste a YouTube link first.'); const songPreview = document.getElementById('songPreview'); if (!songPreview) return alert('No preview area found.'); const m = url.match(/[?&]v=([^&]+)/); const id = m ? m[1] : null; if (!id) return alert('Invalid YouTube URL.'); songPreview.innerHTML = ''; const iframe = document.createElement('iframe'); iframe.width = '100%'; iframe.height = '200'; iframe.src = 'https://www.youtube.com/embed/' + id + '?rel=0'; iframe.frameBorder = '0'; iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'; iframe.allowFullscreen = true; songPreview.appendChild(iframe); };

  window.openEnvelope = function () { const hash = location.hash || ''; if (hash.startsWith('#data=')) return; const payload = buildPayload(); renderViewer(payload); const fullUrl = createFullUrl(payload); history.replaceState(null, '', fullUrl); shareLinkInput.value = fullUrl; shortenServerSide(fullUrl).then(short => { if (short) shareLinkInput.value = short; }); };

})();
