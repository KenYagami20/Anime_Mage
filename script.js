// Anime Discovery App - Advanced Script

const apiBase = 'https://api.jikan.moe/v4';
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

// Init
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

function fetchGenres() {
  fetch(`${apiBase}/genres/anime`)
    .then(res => res.json())
    .then(data => {
      elements.genreSelect.innerHTML = '';
      data.data.forEach(genre => {
        const opt = document.createElement('option');
        opt.value = genre.mal_id;
        opt.textContent = genre.name;
        elements.genreSelect.appendChild(opt);
      });
    });
}

function searchAnime() {
  const query = elements.searchInput.value;
  const genres = Array.from(elements.genreSelect.selectedOptions).map(opt => opt.value);
  const type = elements.typeSelect.value;

  const params = new URLSearchParams({
    q: query,
    type: type,
    genres: genres.join(','),
    order_by: 'popularity',
    sort: 'desc',
    sfw: 'true'
  });

  fetch(`${apiBase}/anime?${params}`)
    .then(res => res.json())
    .then(data => renderResults(data.data));
}

function fetchUpcoming() {
  fetch(`${apiBase}/seasons/upcoming`)
    .then(res => res.json())
    .then(data => renderResults(data.data));
}

function renderResults(animeList) {
  elements.results.innerHTML = animeList.map(anime => `
    <div class="card">
      <span class="badge">${anime.type}</span>
      <img src="${anime.images.jpg.image_url}" alt="${anime.title}" />
      <div class="title">${anime.title}</div>
      <div class="info">${anime.episodes || 'Unknown'} eps | Score: ${anime.score || 'N/A'}</div>
      <button onclick="showDetails(${anime.mal_id})">More</button>
      <button onclick="toggleFavorite(${anime.mal_id}, '${anime.title.replace(/'/g, "\'")}', '${anime.images.jpg.image_url}')">
        ${favorites.find(f => f.id === anime.mal_id) ? '★' : '☆'} Favorite
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
      <button onclick="toggleFavorite(${fav.id}, '${fav.title.replace(/'/g, "\'")}', '${fav.img}')">★ Remove</button>
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

function showDetails(id) {
  fetch(`${apiBase}/anime/${id}/full`)
    .then(res => res.json())
    .then(data => {
      const anime = data.data;
      elements.modalBody.innerHTML = `
        <h2>${anime.title}</h2>
        <img src="${anime.images.jpg.image_url}" alt="${anime.title}" style="width:100%; max-width:300px;" />
        <p><strong>Episodes:</strong> ${anime.episodes}</p>
        <p><strong>Score:</strong> ${anime.score}</p>
        <p>${anime.synopsis || 'No synopsis available.'}</p>
        <video controls src="${anime.trailer?.url || ''}"></video>
      `;
      elements.modal.classList.add('active');
    });
}

function closeModal() {
  elements.modal.classList.remove('active');
}

function shareSite() {
  navigator.clipboard.writeText(window.location.href).then(() => alert('URL copied!'));
}
