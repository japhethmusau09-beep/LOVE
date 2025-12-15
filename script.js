const params = new URLSearchParams(location.search);
const isViewer = params.has('d');
const selectedGifts = [];
let photoDataURLs = [];

const templates = {
  romantic: `My dearest love,

Every moment with you feels like a dream I never want to wake from. Your smile lights up my world, and your touch sets my heart on fire. I fall in love with you more every single day.

Forever yours ❤️`,

  apology: `I'm truly sorry...

I know I hurt you, and that pain weighs heavily on my heart. My actions/words were wrong, and I take full responsibility. Please forgive me — I promise to do better and make things right.

With all my love and regret,`,

  sorry: `I'm so sorry...

I never meant to cause you pain. Seeing you hurt because of me breaks my heart. Please know that I care deeply and will do anything to make this right.

Forgive me? ❤️`,

  friendship: `To my amazing friend,

You've been there through thick and thin, laughter and tears. Thank you for your unconditional support and endless joy. Our friendship means the world to me.

Love you always!`,

  longlost: `Hey old friend...

It's been way too long! I've been thinking about all our memories — the laughs, adventures, and late-night talks. Life took us different ways, but you’ve never left my heart.

Let's catch up soon? ❤️`,

  family: `To my dear family member,

You've always been my rock, my guide, and my biggest supporter. Thank you for your unconditional love and wisdom. I'm so grateful to have you in my life.

With all my love ❤️`,

  birthday: `Happy Birthday! 🎉

Today is all about YOU! Wishing you a day filled with love, joy, and everything that makes you smile. May this year bring you endless happiness and dreams come true.

Love you so much ❤️`
};

// Mode switch
document.getElementById('creatorHeader').style.display = isViewer ? 'none' : 'flex';
document.getElementById('creator').style.display = isViewer ? 'none' : 'block';
document.getElementById('viewerHeader').classList.toggle('hidden', !isViewer);
document.getElementById('viewer').classList.toggle('hidden', !isViewer);

startFloatingHearts();
if (isViewer) loadViewer();

function applyTemplate() {
  const select = document.getElementById('templateSelect');
  const text = templates[select.value];
  if (text) document.getElementById('loveText').value = text;
}

function handlePhotos(event) {
  const files = event.target.files;
  const preview = document.getElementById('photoPreview');
  preview.innerHTML = '';
  photoDataURLs = [];

  if (files.length > 3) {
    document.getElementById('photoWarning').style.display = 'block';
  } else {
    document.getElementById('photoWarning').style.display = 'none';
  }

  Array.from(files).slice(0, 3).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      photoDataURLs.push(e.target.result);
      const img = document.createElement('img');
      img.src = e.target.result;
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

function previewSong() {
  const link = document.getElementById('youtubeLink').value.trim();
  const match = link.match(/(?:v=|be\/)([^&?]+)/);
  if (match) {
    const id = match[1];
    document.getElementById('songPreview').innerHTML = 
      `<iframe src="https://www.youtube.com/embed/${id}" allow="autoplay" allowfullscreen></iframe>`;
  } else {
    alert('Please enter a valid YouTube link');
  }
}

function toggleGift(el, emoji) {
  el.classList.toggle('selected');
  const i = selectedGifts.indexOf(emoji);
  if (i > -1) selectedGifts.splice(i, 1);
  else selectedGifts.push(emoji);
}

function generateLink() {
  const ytLink = document.getElementById('youtubeLink').value.trim();
  const ytMatch = ytLink.match(/(?:v=|be\/)([^&?]+)/);
  const yt = ytMatch ? ytMatch[1] : '';

  const data = {
    from: document.getElementById('fromName').value || 'Someone',
    to: document.getElementById('toName').value || 'My Dear',
    msg: document.getElementById('loveText').value,
    date: document.getElementById('specialDate').value,
    gifts: selectedGifts,
    yt: yt,
    photos: photoDataURLs
  };

  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  const link = location.href.split('?')[0] + '?d=' + encoded;
  document.getElementById('shareLink').value = link;
}

function openEnvelope() {
  document.querySelector('.envelope').classList.add('open');
  setTimeout(() => {
    document.getElementById('viewer').classList.remove('hidden');
    document.getElementById('viewerHeader').style.display = 'none';
    window.scrollTo(0,0);
  }, 1400);
}

function loadViewer() {
  const raw = params.get('d');
  const decoded = decodeURIComponent(escape(atob(raw)));
  const data = JSON.parse(decoded);

  document.getElementById('dear').textContent = `Dear ${data.to},`;

  const lines = data.msg.split('\n').filter(l => l.trim());
  const prog = document.getElementById('progressive');
  lines.forEach((line, i) => {
    const span = document.createElement('span');
    span.textContent = line || ' ';
    span.style.animationDelay = `${i * 1.6}s`;
    prog.appendChild(span);
  });

  if (data.photos && data.photos.length > 0) {
    data.photos.forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      document.getElementById('viewerPhotos').appendChild(img);
    });
  }

  if (data.gifts.length > 0) {
    document.getElementById('giftsCard').style.display = 'block';
    data.gifts.forEach(g => {
      const div = document.createElement('div');
      div.className = 'gift selected';
      div.textContent = g;
      document.getElementById('viewerGifts').appendChild(div);
    });
  }

  if (data.yt) {
    const iframe = `<iframe src="https://www.youtube.com/embed/${data.yt}?autoplay=1&loop=1&playlist=${data.yt}" allow="autoplay" allowfullscreen></iframe>`;
    document.getElementById('youtubeFrame').innerHTML = iframe;
  }

  if (data.date) {
    const target = new Date(data.date);
    setInterval(() => {
      const diff = target - new Date();
      const days = Math.floor(diff / 86400000);
      document.getElementById('countdown').textContent = diff > 0 
        ? `Special day in: ${days} day${days === 1 ? '' : 's'} ❤️`
        : 'Today is your special day! 🎉';
    }, 1000);
  }
}

function shareWhatsApp() {
  const url = location.href;
  const text = encodeURIComponent(`Someone sent you a special message 💌\nOpen it here: ${url}`);
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

function copyLink() {
  const link = document.getElementById('shareLink').value || location.href;
  navigator.clipboard.writeText(link);
  alert('Link copied! Now send it to your loved one ❤️');
}

function startFloatingHearts() {
  const container = document.getElementById('hearts-container');
  setInterval(() => {
    const h = document.createElement('div');
    h.textContent = '❤️';
    h.style.position = 'fixed';
    h.style.left = Math.random() * 100 + 'vw';
    h.style.bottom = '-50px';
    h.style.fontSize = '2rem';
    h.style.opacity = '0.6';
    h.style.pointerEvents = 'none';
    h.style.animation = 'floatUp 10s linear forwards';
    container.appendChild(h);
    setTimeout(() => h.remove(), 10000);
  }, 1000);
}

const style = document.createElement('style');
style.innerHTML = `@keyframes floatUp { to { transform: translateY(-120vh); opacity:0; } }`;
document.head.appendChild(style);