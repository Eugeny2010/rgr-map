// Границы Кавказа: примерно от юга Ставрополья до Тбилиси и Баку
const worldBounds = L.latLngBounds(
  L.latLng(42.0, 37.0),   // юго-запад (примерно Грузия, граница с Турцией)
  L.latLng(47.0, 49.0)    // северо-восток (включает Ставрополь, Дагестан, чуть-чуть Каспия)
);

// Создаем карту с ограничениями
const map = L.map('map', {
  maxBounds: worldBounds,
  maxBoundsViscosity: 1,
  minZoom: 7,
  maxZoom: 18,
  worldCopyJump: false,
  zoomControl: false,
  tap: false,
  bubblingMouseEvents: false
}).setView([43, 44], 7); // Центр Кавказа

// Добавляем тёмные тайлы в стиле ТНО (CartoDB DarkMatter)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
  noWrap: true,
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  subdomains: 'abcd',
}).addTo(map);

// Кастомные иконки
const whiteMachineIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div class="custom-marker-inner"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const capitalIcon = L.divIcon({
  className: 'custom-marker capital',
  html: '<div class="custom-marker-inner"><span class="star">★</span></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Функция создания содержимого popup для точек (показываем все свойства кроме служебных и name)
function createPopupContent(feature) {
  if (!feature.properties) return "Нет данных";

  let content = "<div style='max-width:250px'>";

  // Флаг (только картинка)
  if (feature.properties.flag) {
    content += `<div class='flag-container'><img src="${feature.properties.flag}" class="flag-img" alt="Флаг" onerror="this.parentNode.innerHTML='<div class=\\'no-flag\\'>Флаг не загружен</div>'"></div>`;
  }

  // Скрываем служебные ключи и name
  const ignoredKeys = ['stroke', 'stroke-width', 'stroke-opacity', 'fill', 'fill-opacity', 'flag', 'z-index', 'capital', 'name'];

  const propsToShow = Object.keys(feature.properties).filter(k => !ignoredKeys.includes(k));

  if (propsToShow.length) {
    content += '<div class="properties-list">';
    propsToShow.forEach(key => {
      content += `<div><b>${key}</b> ${feature.properties[key] || ''}</div>`;
    });
    content += '</div>';
  }

  content += "</div>";
  return content;
}

function createPolygonPopupContent(feature) {
  if (!feature.properties) return "Нет данных";

  let content = "<div style='max-width:250px'>";

  // Флаг для полигона (если есть)
  if (feature.properties.flag) {
    content += `<div class='flag-container'><img src="${feature.properties.flag}" class="flag-img" alt="Флаг" onerror="this.parentNode.innerHTML='<div class=\\'no-flag\\'>Флаг не загружен</div>'"></div>`;
  }

  // Жирный заголовок name
  if (feature.properties.name) {
    content += `<div style="font-weight:bold; font-size:1.2em;">${feature.properties.name}</div>`;
  } else {
    content += "Нет названия";
  }

  content += "</div>";
  return content;
}


// Загрузка и отображение GeoJSON
fetch('map.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      pointToLayer: (feature, latlng) => {
        const isCapital = feature.properties && (feature.properties.capital === true || feature.properties.capital === 'true');
        const marker = L.marker(latlng, {
          icon: isCapital ? capitalIcon : whiteMachineIcon,
          bubblingMouseEvents: false
        });
        marker.bindPopup(createPopupContent(feature), {
          maxWidth: 300,
          minWidth: 150,
          className: 'dark-popup'
        });
        return marker;
      },
      style: feature => {
        const p = feature.properties || {};
        return {
          stroke: true,
          color: p['stroke'] || '#555',
          weight: parseInt(p['stroke-width']) || 2,
          opacity: parseFloat(p['stroke-opacity']) || 0.8,
          fill: true,
          fillColor: p['fill'] || '#333',
          fillOpacity: parseFloat(p['fill-opacity']) || 0.5
        };
      },
      onEachFeature: (feature, layer) => {
        if (feature.geometry.type !== 'Point') {
          // Для полигонов показываем popup только с жирным названием
          layer.bindPopup(createPolygonPopupContent(feature), {
            maxWidth: 300,
            minWidth: 150,
            className: 'dark-popup'
          });
        }
        // Для точек popup уже привязан выше
      }
    }).addTo(map);
  })
  .catch(error => {
    console.error("Ошибка загрузки GeoJSON:", error);
    const errorElem = document.getElementById('error');
    if (errorElem) {
      errorElem.innerHTML = `<b>Ошибка загрузки данных</b><br>${error.message}`;
    }
  });

// --- Плеер ---


// Инициализация переменных
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const volumeBtn = document.getElementById('volume-btn');
const volumeSlider = document.getElementById('volume-slider');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const trackTitleEl = document.getElementById('track-title');
const audioPlayer = document.getElementById('audio-player');
const minimizeBtn = document.getElementById('minimize-btn');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const volumeHighIcon = document.getElementById('volume-high');
const volumeMuteIcon = document.getElementById('volume-mute');
const expandIcon = document.getElementById('expand-icon');
const collapseIcon = document.getElementById('collapse-icon');

const tracks = [
  { element: document.getElementById('track1'), title: "TNO OST - Toolbox Theory" },
  { element: document.getElementById('track2'), title: "The New Order: Russian Fairytale" },
  { element: document.getElementById('track3'), title: "Half-Life 2: Particle Ghost (Remix)" },
  { element: document.getElementById('track4'), title: "TNO OST - Burgundian Lullaby" },
  { element: document.getElementById('track5'), title: "TNO OST - Between the Bombings" }
];

let currentTrackIndex = Math.floor(Math.random() * tracks.length);
let isPlaying = false;
let isDraggingProgress = false;
let wasPlayingBeforeDrag = false;

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function updateTrackInfo() {
  const track = tracks[currentTrackIndex];
  trackTitleEl.textContent = track.title;
  totalTimeEl.textContent = formatTime(track.element.duration || 0);
}

function updateProgress() {
  if (isDraggingProgress) return;
  const track = tracks[currentTrackIndex].element;
  if (!track.duration) return;
  const progress = (track.currentTime / track.duration) * 100;
  progressBar.style.width = `${progress}%`;
  currentTimeEl.textContent = formatTime(track.currentTime);
}

function updatePlayPauseButton() {
  if (isPlaying) {
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
  } else {
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
  }
}

function updateVolumeButton() {
  const volume = tracks[currentTrackIndex].element.volume;
  if (volume === 0) {
    volumeHighIcon.style.display = 'none';
    volumeMuteIcon.style.display = 'block';
  } else {
    volumeHighIcon.style.display = 'block';
    volumeMuteIcon.style.display = 'none';
  }
}

function playTrack() {
  // Остановить все треки
  tracks.forEach(t => {
    t.element.pause();
    t.element.currentTime = 0;
  });

  const track = tracks[currentTrackIndex].element;
  track.play().then(() => {
    isPlaying = true;
    updatePlayPauseButton();
    updateTrackInfo();
    updateVolumeButton();
  }).catch(err => {
    console.error("Playback failed:", err);
    playNextTrack();
  });
}

function playNextTrack() {
  currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
  playTrack();
}

function playPrevTrack() {
  const track = tracks[currentTrackIndex].element;
  if (track.currentTime > 3) {
    track.currentTime = 0;
    updateProgress();
  } else {
    currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    playTrack();
  }
}

function togglePlayPause() {
  const track = tracks[currentTrackIndex].element;
  if (isPlaying) {
    track.pause();
    isPlaying = false;
    updatePlayPauseButton();
  } else {
    track.play().then(() => {
      isPlaying = true;
      updatePlayPauseButton();
    }).catch(err => {
      console.error("Playback failed:", err);
    });
  }
}

function setVolume(volume) {
  volume = Math.max(0, Math.min(1, volume));
  tracks.forEach(t => t.element.volume = volume);
  volumeSlider.value = volume;
  updateVolumeButton();
  localStorage.setItem('playerVolume', volume);
}

function seekTo(event) {
  if (!isDraggingProgress) return;

  const track = tracks[currentTrackIndex].element;
  const rect = progressContainer.getBoundingClientRect();
  const pos = (event.clientX - rect.left) / rect.width;
  track.currentTime = pos * track.duration;
  updateProgress();
}

// События
playPauseBtn.addEventListener('click', togglePlayPause);
prevBtn.addEventListener('click', playPrevTrack);
nextBtn.addEventListener('click', playNextTrack);

volumeBtn.addEventListener('click', () => {
  const currentVolume = tracks[currentTrackIndex].element.volume;
  setVolume(currentVolume === 0 ? 0.5 : 0);
});

volumeSlider.addEventListener('input', e => {
  setVolume(parseFloat(e.target.value));
});

progressContainer.addEventListener('mousedown', e => {
  isDraggingProgress = true;
  wasPlayingBeforeDrag = isPlaying;
  if (isPlaying) {
    tracks[currentTrackIndex].element.pause();
    isPlaying = false;
    updatePlayPauseButton();
  }
  seekTo(e);
});
document.addEventListener('mousemove', e => {
  if (isDraggingProgress) seekTo(e);
});
document.addEventListener('mouseup', () => {
  if (isDraggingProgress) {
    isDraggingProgress = false;
    if (wasPlayingBeforeDrag) {
      tracks[currentTrackIndex].element.play()
        .then(() => {
          isPlaying = true;
          updatePlayPauseButton();
        })
        .catch(err => console.error("Playback failed:", err));
    }
  }
});

// Тач события для мобилок
progressContainer.addEventListener('touchstart', e => {
  isDraggingProgress = true;
  wasPlayingBeforeDrag = isPlaying;
  if (isPlaying) {
    tracks[currentTrackIndex].element.pause();
    isPlaying = false;
    updatePlayPauseButton();
  }
  seekTo(e.touches[0]);
});
document.addEventListener('touchmove', e => {
  if (isDraggingProgress) seekTo(e.touches[0]);
});
document.addEventListener('touchend', () => {
  if (isDraggingProgress) {
    isDraggingProgress = false;
    if (wasPlayingBeforeDrag) {
      tracks[currentTrackIndex].element.play()
        .then(() => {
          isPlaying = true;
          updatePlayPauseButton();
        })
        .catch(err => console.error("Playback failed:", err));
    }
  }
});

minimizeBtn.addEventListener('click', () => {
  audioPlayer.classList.toggle('minimized');
  audioPlayer.classList.toggle('expanded');
  expandIcon.style.display = audioPlayer.classList.contains('minimized') ? 'block' : 'none';
  collapseIcon.style.display = audioPlayer.classList.contains('minimized') ? 'none' : 'block';
});

// Подписка на события треков
tracks.forEach((track, i) => {
  track.element.addEventListener('ended', playNextTrack);
  track.element.addEventListener('timeupdate', updateProgress);
  track.element.addEventListener('loadedmetadata', updateTrackInfo);
  track.element.addEventListener('error', e => {
    console.error(`Ошибка трека ${i}:`, e);
    playNextTrack();
  });
});

// Загружаем сохранённую громкость
const savedVolume = localStorage.getItem('playerVolume');
if (savedVolume !== null) setVolume(parseFloat(savedVolume));
else setVolume(0.5);

// Автовоспроизведение после первого взаимодействия
function handleFirstInteraction() {
  if (!isPlaying) playTrack();
  document.removeEventListener('click', handleFirstInteraction);
  document.removeEventListener('keydown', handleFirstInteraction);
  document.removeEventListener('touchstart', handleFirstInteraction);
}
document.addEventListener('click', handleFirstInteraction);
document.addEventListener('keydown', handleFirstInteraction);
document.addEventListener('touchstart', handleFirstInteraction);

// Начальная инициализация
updateTrackInfo();
updatePlayPauseButton();
