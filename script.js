// Anime Discovery App - Gogoanime Streaming Integration with Advanced Video Player

const apiBase = 'https://gogoanime.dev';
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let darkMode = true;

const elements = {
  searchBtn: document.getElementById('searchBtn'),
  upcomingBtn: document.getElementById('upcomingBtn'),
  favoritesBtn: document.getElementById('favoritesBtn'),
  exportBtn: document.getElementById('exportBtn'),
  importBtn: document.getElementById('importBtn'),
  themeBtn: document.getElementById('themeBtn'),
  shareBtn: document.getElementById('shareBtn'),
  searchInput: document.getElementById('searchInput'),
  genreSelect: document.getElementById('genreSelect'),
  typeSelect: document.getElementById('typeSelect'),
  results: document.getElementById('results'),
  modal: document.getElementById('modal'),
  modalBody: document.getElementById('modalBody'),
  modalClose: document.getElementById('modalClose')
};

// Gogoanime genres (static as example)
const genres = [
  'Action', 'Adventure', 'Cars', 'Comedy', 'Dementia', 'Demons',
  'Drama', 'Ecchi', 'Fantasy', 'Game', 'Harem', 'Historical', 'Horror',
  'Josei', 'Kids', 'Magic', 'Martial Arts', 'Mecha', 'Military', 'Music',
  'Mystery', 'Parody', 'Police', 'Psychological', 'Romance', 'Samurai',
  'School', 'Sci-Fi', 'Seinen', 'Shoujo', 'Shoujo Ai', 'Shounen', 'Shounen Ai',
  'Slice of Life', 'Space', 'Sports', 'Super Power', 'Supernatural', 'Thriller',
  'Vampire', 'Yaoi', 'Yuri'
];

function fetchGenres() {
  elements.genreSelect.innerHTML = '';
  genres.forEach(genre => {
    const opt = document.createElement('option');
    opt.value = genre.toLowerCase().replace(/ /g, '-');
    opt.textContent = genre;
    elements.genreSelect.appendChild(opt);
  });
}

fetchGenres();
renderFavorites();

// Event Listeners
elements.searchBtn.onclick = () => searchAnime();
elements.upcomingBtn.onclick = () => fetchUpcoming();
elements.favoritesBtn.onclick = () => renderFavorites();
elements.exportBtn.onclick = () => exportFavorites();
elements.importBtn.onclick = () => importFavorites();
elements.themeBtn.onclick = () => toggleTheme();
elements.shareBtn.onclick = () => shareSite();
elements.modalClose.onclick = () => closeModal();

function searchAnime() {
  const query = elements.searchInput.value;
  fetch(`${apiBase}/search?keyw=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => renderResults(data));
}

function fetchUpcoming() {
  fetch(`${apiBase}/recent-release`)
    .then(res => res.json())
    .then(data => renderResults(data));
}

function renderResults(animeList) {
  elements.results.innerHTML = (animeList || []).map(anime => `
    <div class="card">
      <img src="${anime.animeImg}" alt="${anime.animeTitle}" />
      <div class="title">${anime.animeTitle}</div>
      <div class="info">${anime.latestEp || ''}</div>
      <button onclick="showDetails('${anime.animeId}')">More</button>
      <button onclick="toggleFavorite('${anime.animeId}', '${anime.animeTitle.replace(/'/g, "\\'")}', '${anime.animeImg}')">
        ${favorites.find(f => f.id === anime.animeId) ? '★' : '☆'} Favorite
      </button>
    </div>`).join('');
}

function renderFavorites() {
  if (favorites.length === 0) {
    elements.results.innerHTML = '<p>No favorites yet.</p>';
    return;
  }
  elements.results.innerHTML = favorites.map(fav => `
    <div class="card">
      <img src="${fav.img}" alt="${fav.title}" />
      <div class="title">${fav.title}</div>
      <button onclick="toggleFavorite('${fav.id}', '${fav.title.replace(/'/g, "\\'")}', '${fav.img}')">★ Remove</button>
      <button onclick="showDetails('${fav.id}')">More</button>
    </div>`).join('');
}

function toggleFavorite(id, title, img) {
  const index = favorites.findIndex(f => f.id === id);
  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push({ id, title, img });
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
  renderFavorites();
}

function exportFavorites() {
  const blob = new Blob([JSON.stringify(favorites)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'favorites.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importFavorites() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        favorites = JSON.parse(reader.result);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderFavorites();
      } catch {
        alert('Invalid file');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function toggleTheme() {
  darkMode = !darkMode;
  document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
}

function showDetails(animeId) {
  // Get anime details and episode list
  fetch(`${apiBase}/anime-details/${animeId}`)
    .then(res => res.json())
    .then(anime => {
      elements.modalBody.innerHTML = `
        <h2>${anime.animeTitle}</h2>
        <img src="${anime.animeImg}" alt="${anime.animeTitle}" style="width:100%; max-width:300px;" />
        <p><strong>Type:</strong> ${anime.type}</p>
        <p><strong>Status:</strong> ${anime.status}</p>
        <p><strong>Released:</strong> ${anime.releasedDate || ''}</p>
        <p><strong>Description:</strong> ${anime.synopsis || 'No synopsis available.'}</p>
        <div id="episodeList"><em>Loading episodes...</em></div>
      `;
      elements.modal.classList.add('active');
      renderEpisodeList(anime.episodesList || [], animeId);
    });
}

function renderEpisodeList(episodes, animeId) {
  if (!episodes || episodes.length === 0) {
    document.getElementById('episodeList').innerHTML = '<p>No episodes found.</p>';
    return;
  }
  document.getElementById('episodeList').innerHTML =
    '<h3>Episodes:</h3>' +
    '<ul>' +
    episodes.map(ep => `
      <li>
        <button onclick="playEpisode('${ep.episodeId}')">Episode ${ep.episodeNum}</button>
      </li>
    `).join('') +
    '</ul>';
}

window.playEpisode = function(episodeId) {
  fetch(`https://gogoanime.dev/vidcdn/watch/${episodeId}`)
    .then(res => res.json())
    .then(data => {
      // Get all sources (qualities)
      let sources = data.sources || [];
      let videoUrl = sources.length ? sources[0].file : '';
      setupAdvancedPlayer(videoUrl, sources);
    });
};

// Advanced Video Player Setup
function setupAdvancedPlayer(videoUrl, sources = []) {
  elements.modalBody.innerHTML += `
    <div id="advancedPlayerContainer" style="margin-top:1em;">
      <video id="animeVideo" controls style="width:100%;border-radius:10px;" autoplay>
        ${sources.map(src => `<source src="${src.file}" type="video/mp4" data-quality="${src.label}">`).join('')}
      </video>
      <div class="player-controls" style="margin-top:0.5em;">
        <button id="playPauseBtn">⏯️</button>
        <button id="seekBackBtn">⏪ 10s</button>
        <button id="seekFwdBtn">10s ⏩</button>
        <select id="speedSelector">
          <option value="0.5">0.5x</option>
          <option value="1" selected>1x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
        </select>
        <button id="pipBtn">🗔 PiP</button>
        <button id="fullscreenBtn">⛶</button>
        <input type="range" id="volumeSlider" min="0" max="1" step="0.01" value="1" style="width:80px;">
        <button id="downloadBtn">⬇️</button>
      </div>
      <div style="margin-top:0.5em;">
        <label for="qualitySelector">Quality: </label>
        <select id="qualitySelector"></select>
      </div>
      <input type="file" id="subtitleInput" accept=".vtt,.srt" style="margin-top:10px;">
    </div>
  `;

  const video = document.getElementById('animeVideo');
  // Set src for direct playback if sources are not in <source>
  if (!sources.length) video.src = videoUrl;

  // Quality selection
  const qualitySelector = document.getElementById('qualitySelector');
  sources.forEach((src, i) => {
    const opt = document.createElement('option');
    opt.value = src.file;
    opt.textContent = src.label || `Quality ${i + 1}`;
    qualitySelector.appendChild(opt);
  });
  qualitySelector.onchange = function() {
    video.src = this.value;
    video.load();
    video.play();
  };

  // Play/Pause
  document.getElementById('playPauseBtn').onclick = () => {
    if (video.paused) video.play();
    else video.pause();
  };
  // Seek
  document.getElementById('seekBackBtn').onclick = () => video.currentTime -= 10;
  document.getElementById('seekFwdBtn').onclick = () => video.currentTime += 10;
  // Speed
  document.getElementById('speedSelector').onchange = function() {
    video.playbackRate = parseFloat(this.value);
  };
  // PiP
  document.getElementById('pipBtn').onclick = () => {
    if ('pictureInPictureEnabled' in document) video.requestPictureInPicture();
  };
  // Fullscreen
  document.getElementById('fullscreenBtn').onclick = () => {
    if (video.requestFullscreen) video.requestFullscreen();
    else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
  };
  // Volume
  document.getElementById('volumeSlider').oninput = function() {
    video.volume = parseFloat(this.value);
  };
  // Download
  document.getElementById('downloadBtn').onclick = () => {
    const a = document.createElement('a');
    a.href = video.src;
    a.download = 'anime-episode.mp4';
    a.click();
  };
  // Subtitle support
  document.getElementById('subtitleInput').onchange = function() {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function() {
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = 'Custom';
        track.src = reader.result;
        track.default = true;
        video.appendChild(track);
      };
      reader.readAsDataURL(file);
    }
  };

  // Keyboard shortcuts (optional)
  video.tabIndex = 0;
  video.addEventListener('keydown', function(e) {
    switch (e.key) {
      case " ": if (video.paused) video.play(); else video.pause(); e.preventDefault(); break;
      case "ArrowLeft": video.currentTime -= 10; break;
      case "ArrowRight": video.currentTime += 10; break;
      case "ArrowUp": video.volume = Math.min(video.volume + 0.1, 1); break;
      case "ArrowDown": video.volume = Math.max(video.volume - 0.1, 0); break;
      case "f": if (video.requestFullscreen) video.requestFullscreen(); break;
      case "p": if ('pictureInPictureEnabled' in document) video.requestPictureInPicture(); break;
    }
  });
}

function closeModal() {
  elements.modal.classList.remove('active');
  elements.modalBody.innerHTML = '';
}

function shareSite() {
  navigator.clipboard.writeText(window.location.href).then(() => alert('URL copied!'));
}

// Expose showDetails globally for inline onclick
window.showDetails = showDetails;
window.toggleFavorite = toggleFavorite;
