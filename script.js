const params = new URLSearchParams(location.search);
const isViewer = params.has('d');
const selectedGifts = [];
let memoryImages = [];

// Mode switching
document.getElementById('creatorHeader').style.display = isViewer ? 'none' : 'flex';
document.getElementById('creator').style.display = isViewer ? 'none' : 'block';
document.getElementById('viewerHeader').classList.toggle('hidden', !isViewer);
document.getElementById('viewer').classList.toggle('hidden', !isViewer);

// Start floating hearts on all modes
startFloatingHearts();

if (isViewer) {
  loadViewer();
}

function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

function toggleGift(el, name) {
  el.classList.toggle('selected');
  const index = selectedGifts.indexOf(name);
  if (index > -1) selectedGifts.splice(index, 1);
  else selectedGifts.push(name);
}

function loadMemories(event) {
  const grid = document.getElementById('memoryGrid');
  grid.innerHTML = ''; // Clear previous
  memoryImages = [];
  for (const file of event.target.files) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement('img');
      img.src = e.target.result;
      grid.appendChild(img);
      memoryImages.push(e.target.result);
    };
    reader.readAsDataURL(file);
  }
}

function generateLink() {
  const predefined = document.getElementById('predefinedSong').value;
  const custom = document.getElementById('customYoutube').value.trim();
  const youtubeId = predefined || (custom.match(/(?:v=|be\/)([^&?]+)/) || [])[1] || '';

  const data = {
    from: document.getElementById('fromName').value || 'Someone Special',
    to: document.getElementById('toName').value || 'My Love',
    msg: document.getElementById('loveText').value || 'I love you more than words can say ❤️',
    date: document.getElementById('specialDate').value,
    gifts: selectedGifts,
    yt: youtubeId,
    memories: memoryImages
  };

  const jsonString = JSON.stringify(data);
  const encoded = btoa(unescape(encodeURIComponent(jsonString)));
  const link = location.href.split('?')[0] + '?d=' + encoded;
  document.getElementById('shareLink').value = link;
}

function openEnvelope() {
  document.querySelector('.envelope').classList.add('open');
  setTimeout(() => {
    document.getElementById('viewer').classList.remove('hidden');
    document.getElementById('viewerHeader').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 1400);
}

function loadViewer() {
  const raw = params.get('d');
  const decoded = decodeURIComponent(escape(atob(raw)));
  const data = JSON.parse(decoded);

  document.getElementById('dear').textContent = `Dear ${data.to},`;

  // Progressive reveal of message
  const lines = data.msg.split('\n').filter(l => l.trim() !== '');
  const container = document.getElementById('progressive');
  lines.forEach((line, i) => {
    const span = document.createElement('span');
    span.textContent = line || '\u00A0';
    span.style.animationDelay = `${i * 1.5}s`;
    container.appendChild(span);
  });

  // Gifts
  if (data.gifts.length > 0) {
    data.gifts.forEach(g => {
      const div = document.createElement('div');
      div.className = 'gift selected';
      div.textContent = g;
      document.getElementById('viewerGifts').appendChild(div);
    });
  }

  // Memories
  if (data.memories && data.memories.length > 0) {
    const grid = document.getElementById('viewerMemories');
    data.memories.forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      grid.appendChild(img);
    });
  }

  // YouTube video
  if (data.yt) {
    const iframe = `<iframe src="https://www.youtube.com/embed/${data.yt}?autoplay=1&mute=0&loop=1&playlist=${data.yt}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    document.getElementById('youtubeFrame').innerHTML = iframe;
  }

  // Countdown
  if (data.date) {
    const target = new Date(data.date);
    setInterval(() => {
      const diff = target - new Date();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const text = diff > 0
        ? `Countdown to our special day: ${days} day${days !== 1 ? 's' : ''} left ❤️`
        : 'Today is our special day! ❤️';
      document.getElementById('countdown').textContent = text;
    }, 1000);
  }
}

function shareWhatsApp() {
  const text = encodeURIComponent("I made this Valentine letter just for you 💕\n" + location.href);
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

function startFloatingHearts() {
  const container = document.getElementById('hearts-container');
  setInterval(() => {
    const heart = document.createElement('div');
    heart.textContent = '❤️';
    heart.style.position = 'fixed';
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.bottom = '-50px';
    heart.style.fontSize = '1.8rem';
    heart.style.opacity = '0.7';
    heart.style.pointerEvents = 'none';
    heart.style.animation = 'floatUp 8s linear forwards';
    container.appendChild(heart);
    setTimeout(() => heart.remove(), 8000);
  }, 800);
}

// Floating hearts animation
const style = document.createElement('style');
style.innerHTML = `
@keyframes floatUp {
  to {
    transform: translateY(-110vh) rotate(360deg);
    opacity: 0;
  }
}`;
document.head.appendChild(style);