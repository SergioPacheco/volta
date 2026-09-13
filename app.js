// =============================================================================
// YouCity — app.js
// Immersive urban rides with local radio
// =============================================================================

/**
 * IIFE to encapsulate all code and avoid polluting the global namespace
 */
(function() {
  'use strict';

  // -----------------------------------------------------------------------------
  // Centralized configuration (avoids magic numbers and hardcoded strings)
  // -----------------------------------------------------------------------------
  const CONFIG = {
    VIDEO_READY_DELAY: 1500,
    TOAST_DURATION: 2600,
    STREET_SOUND_VOLUME: 32,
    CLOCK_INTERVAL: 60_000,
    RADIO_RETRY_DELAY: 2000,
    RADIO_MAX_RETRIES: 2,
    DEFAULT_VOLUME: 64,
    AUTOPLAY_INTERVAL: 180_000, // 3 minutes
    POMODORO_DURATION: 25 * 60, // 25 minutes in seconds
    POMODORO_BREAK: 5 * 60, // 5-minute break
    VOLUME_ROTATION_FACTOR: 2.4,
    VOLUME_DRAG_SENSITIVITY: 0.5,
    VOLUME_WHEEL_STEP: 5,
    storageKeys: {
      prefs: "volta-prefs",
      playerHidden: "volta-player-hidden",
      favorites: "volta-favorites",
      stats: "volta-stats",
      theme: "volta-theme",
    },
    filters: {
      ALL: "all",
      FAVORITES: "favorites",
    },
    themes: {
      DEFAULT: "",
      SEPIA: "theme-sepia",
      CONTRAST: "theme-contrast",
    },
    qualities: {
      AUTO: "auto",
      HD720: "720",
      HD1080: "1080",
    },
    modes: {
      DRIVE: "drive",
      BIKE: "bike",
      WALK: "walk",
      DRONE: "drone",
    },
  };

  // Centralized messages for future i18n
  const MESSAGES = {
    nowIn: (cityName) => `Now in ${cityName}`,
    autoplayOn: "Autoplay on — switching every 3 minutes",
    autoplayOff: "Autoplay off",
    pomodoroStart: "Pomodoro started — 25 minutes of focus",
    pomodoroPause: "Pomodoro paused",
    pomodoroBreakEnd: "☕ Break over! Time to focus.",
    pomodoroComplete: "🎉 Pomodoro complete! Take a 5-minute break.",
    streetSoundOn: "Street sound on",
    streetSoundOff: "Street sound off",
    noRadio: "This city has no radio station available yet.",
    radioRetry: "The radio did not respond. Trying the next station...",
    radioUnavailable: "No radio station is available right now. Try again later.",
    noVideo: "No video is available for this city.",
    videoFallback: "Video unavailable. Loading an alternative...",
    videoUnavailable: "Video unavailable. Try another city.",
    fullscreenUnavailable: "Fullscreen is not available in this browser.",
    pipUnavailable: "PiP is not available for embedded YouTube videos",
    pipError: "Error enabling Picture-in-Picture",
    pipOff: "Picture-in-Picture off",
    linkCopied: "Link copied to clipboard!",
    linkCopyFailed: "Could not copy the link",
    favoriteAdded: (city) => `${city} added to favorites ♥`,
    favoriteRemoved: (city) => `${city} removed from favorites`,
    randomDestination: (city) => `Random destination: ${city}`,
    rideSpeed: (speed) => `Ride speed: ${speed}`,
    qualityAuto: "Quality: Auto",
    qualitySet: (quality) => `Quality: ${quality}p`,
    themeDefault: "Theme: Default",
    themeSepia: "Theme: Sepia",
    themeContrast: "Theme: High contrast",
    modeSwitch: (mode, city) => `${mode} in ${city}`,
  };

  // -----------------------------------------------------------------------------
  // Dados estáticos
  // -----------------------------------------------------------------------------
  const COUNTRY_INFO = {
    Argentina: ["Argentina", "South America", "America/Argentina/Buenos_Aires"],
    Australia: ["Australia", "Oceania", "Australia/Sydney"],
    Austria: ["Austria", "Europe", "Europe/Vienna"],
    Brazil: ["Brazil", "South America", "America/Sao_Paulo"],
    Bulgaria: ["Bulgaria", "Europe", "Europe/Sofia"],
    Canada: ["Canada", "North America", "America/Toronto"],
    China: ["China", "Asia", "Asia/Shanghai"],
    Cuba: ["Cuba", "Caribbean", "America/Havana"],
    Czechia: ["Czechia", "Europe", "Europe/Prague"],
    "Dominican Republic": ["Dominican Republic", "Caribbean", "America/Santo_Domingo"],
    Egypt: ["Egypt", "Africa", "Africa/Cairo"],
    England: ["England", "Europe", "Europe/London"],
    France: ["France", "Europe", "Europe/Paris"],
    Germany: ["Germany", "Europe", "Europe/Berlin"],
    Greece: ["Greece", "Europe", "Europe/Athens"],
    Guatemala: ["Guatemala", "Central America", "America/Guatemala"],
    Hungary: ["Hungary", "Europe", "Europe/Budapest"],
    India: ["India", "Asia", "Asia/Kolkata"],
    Indonesia: ["Indonesia", "Asia", "Asia/Jakarta"],
    Iran: ["Iran", "Asia", "Asia/Tehran"],
    Ireland: ["Ireland", "Europe", "Europe/Dublin"],
    Israel: ["Israel", "Asia", "Asia/Jerusalem"],
    Italy: ["Italy", "Europe", "Europe/Rome"],
    Japan: ["Japan", "Asia", "Asia/Tokyo"],
    Korea: ["South Korea", "Asia", "Asia/Seoul"],
    Malaysia: ["Malaysia", "Asia", "Asia/Kuala_Lumpur"],
    Mexico: ["Mexico", "North America", "America/Mexico_City"],
    Monaco: ["Monaco", "Europe", "Europe/Monaco"],
    Netherlands: ["Netherlands", "Europe", "Europe/Amsterdam"],
    "New Zealand": ["New Zealand", "Oceania", "Pacific/Auckland"],
    "Northern Ireland": ["Northern Ireland", "Europe", "Europe/London"],
    Norway: ["Norway", "Europe", "Europe/Oslo"],
    Pakistan: ["Pakistan", "Asia", "Asia/Karachi"],
    Philippines: ["Philippines", "Asia", "Asia/Manila"],
    Poland: ["Poland", "Europe", "Europe/Warsaw"],
    Portugal: ["Portugal", "Europe", "Europe/Lisbon"],
    Qatar: ["Qatar", "Asia", "Asia/Qatar"],
    Russia: ["Russia", "Europe/Asia", "Europe/Moscow"],
    Senegal: ["Senegal", "Africa", "Africa/Dakar"],
    Singapore: ["Singapore", "Asia", "Asia/Singapore"],
    Slovenia: ["Slovenia", "Europe", "Europe/Ljubljana"],
    "South Africa": ["South Africa", "Africa", "Africa/Johannesburg"],
    Spain: ["Spain", "Europe", "Europe/Madrid"],
    Sweden: ["Sweden", "Europe", "Europe/Stockholm"],
    Switzerland: ["Switzerland", "Europe", "Europe/Zurich"],
    Taiwan: ["Taiwan", "Asia", "Asia/Taipei"],
    Turkey: ["Turkey", "Europe/Asia", "Europe/Istanbul"],
    UAE: ["United Arab Emirates", "Asia", "Asia/Dubai"],
    UK: ["United Kingdom", "Europe", "Europe/London"],
    USA: ["United States", "North America", "America/New_York"],
    Ukraine: ["Ukraine", "Europe", "Europe/Kyiv"],
    Uruguay: ["Uruguay", "South America", "America/Montevideo"],
    Uzbekistan: ["Uzbekistan", "Asia", "Asia/Tashkent"]
  };

  const CITY_NAMES = {
    "Sao Paulo": "São Paulo", Tokyo: "Tokyo", "New York City": "New York City",
    "Rio De Janeiro": "Rio de Janeiro", London: "London", Seoul: "Seoul", Lisbon: "Lisbon",
    Rome: "Rome", Moscow: "Moscow", Munich: "Munich", Vienna: "Vienna", Warsaw: "Warsaw",
    Athens: "Athens", Beijing: "Beijing", "Mexico City": "Mexico City", Milan: "Milan",
    Cologne: "Cologne", Florence: "Florence", Brussels: "Brussels", Istanbul: "Istanbul"
  };

  const CITY_TIME_ZONES = {
    Albuquerque: "America/Denver", Anchorage: "America/Anchorage", Aspen: "America/Denver",
    Austin: "America/Chicago", Chicago: "America/Chicago", Dallas: "America/Chicago",
    Denver: "America/Denver", Hawaii: "Pacific/Honolulu", Houston: "America/Chicago",
    "Las Vegas": "America/Los_Angeles", "Los Angeles": "America/Los_Angeles",
    Minneapolis: "America/Chicago", Nashville: "America/Chicago", "New Orleans": "America/Chicago",
    Phoenix: "America/Phoenix", "San Diego": "America/Los_Angeles", "San Francisco": "America/Los_Angeles",
    Seattle: "America/Los_Angeles", Vancouver: "America/Vancouver", Brisbane: "Australia/Brisbane",
    "Gold Coast": "Australia/Brisbane", Melbourne: "Australia/Melbourne", Dunedin: "Pacific/Auckland",
    Cancun: "America/Cancun", Tijuana: "America/Tijuana", Novosibirsk: "Asia/Novosibirsk",
    Yekaterinburg: "Asia/Yekaterinburg", "St. Petersburg": "Europe/Moscow"
  };

  const CITY_NOTES = {
    "Sao Paulo": "Concrete, light, and the constant pulse of the largest city in the Southern Hemisphere.",
    Tokyo: "Neon, precise silence, and roads crossing a city that feels almost futuristic.",
    Paris: "Stone boulevards, golden light, and corners that call for a longer route.",
    "New York City": "Traffic lights, bridges, and the electric hum of a city always on the move.",
    "Rio De Janeiro": "The city meets the sea between tunnels, hills, and a light that changes everything.",
    London: "Fine rain, old brick, and the calm rhythm of streets along the Thames.",
    Seoul: "Dawn reflects on the asphalt between markets, signs, and wide avenues.",
    Lisbon: "Hills, tiled facades, and the Atlantic appearing at the end of every narrow street."
  };

  const MODE_LABELS = { 
    [CONFIG.modes.DRIVE]: "Drive", 
    [CONFIG.modes.BIKE]: "Bike", 
    [CONFIG.modes.WALK]: "Walk",
    [CONFIG.modes.DRONE]: "Drone"
  };

  const THEME_NAMES = {
    [CONFIG.themes.DEFAULT]: MESSAGES.themeDefault,
    [CONFIG.themes.SEPIA]: MESSAGES.themeSepia,
    [CONFIG.themes.CONTRAST]: MESSAGES.themeContrast,
  };

  // -----------------------------------------------------------------------------
  // Utilitários
  // -----------------------------------------------------------------------------
  
  /**
   * Gera uma marca de 2 letras a partir do nome da estação de rádio
   * @param {string} name - Nome da estação
   * @returns {string} Marca de 2 letras (ex: "FM", "AN")
   */
  function stationMark(name) {
    const words = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[A-Za-z0-9]+/g) || [];
    return (words.length > 1 ? words.map((word) => word[0]).join("") : words[0] || "FM").slice(0, 2).toUpperCase();
  }

  /**
   * Normaliza string para busca (remove acentos, converte para minúsculas)
   * @param {string} value - String a normalizar
   * @returns {string} String normalizada
   */
  function normalizeSearch(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("en-US");
  }

  /**
   * Creates the stable URL segment used by prerendered city pages.
   */
  function citySlug(value) {
    return normalizeSearch(value)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Sanitiza entrada de URL para prevenir XSS
   * @param {string} value - Valor a sanitizar
   * @returns {string} Valor sanitizado
   */
  function sanitizeInput(value) {
    if (!value) return "";
    return value.replace(/[<>"'&]/g, "");
  }

  // -----------------------------------------------------------------------------
  // Persistência de preferências (localStorage) com tratamento de erro apropriado
  // -----------------------------------------------------------------------------
  
  /**
   * Carrega preferências do localStorage
   * @returns {Object} Objeto de preferências ou vazio se falhar
   */
  function loadPreferences() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.storageKeys.prefs)) || {};
    } catch (error) {
      console.warn("[YouCity] Failed to load preferences:", error.message);
      return {};
    }
  }

  /**
   * Salva preferências no localStorage
   * @param {Object} prefs - Preferências a salvar
   */
  function savePreferences(prefs) {
    try {
      const current = loadPreferences();
      localStorage.setItem(CONFIG.storageKeys.prefs, JSON.stringify({ ...current, ...prefs }));
    } catch (error) {
      console.warn("[YouCity] Failed to save preferences (private mode?):", error.message);
    }
  }

  // -----------------------------------------------------------------------------
  // City catalog processing
  // -----------------------------------------------------------------------------
  const cities = (window.CITY_CATALOG || []).map((item) => {
    const [country, region, countryTimeZone] = COUNTRY_INFO[item.country] || [item.country, "World", "UTC"];
    return {
      ...item,
      rawName: item.name,
      rawCountry: item.country,
      name: CITY_NAMES[item.name] || item.name,
      country,
      region,
      timeZone: CITY_TIME_ZONES[item.name] || countryTimeZone,
      note: CITY_NOTES[item.name] || `Real streets, local radio, and the rhythm of ${CITY_NAMES[item.name] || item.name} through the window.`,
      videos: {
        ...item.videos,
        [CONFIG.modes.DRONE]: (window.DRONE_CATALOG?.[item.name] || []).map((id) => ({ id, start: 0 }))
      },
      radios: [...(window.RADIO_CATALOG?.[item.name] || []), ...item.radios]
        .filter((radio, index, radios) => radios.findIndex((candidate) => candidate.url === radio.url) === index)
        .slice(0, 5)
        .map((radio) => ({ ...radio, mark: stationMark(radio.name) }))
    };
  });

  // -----------------------------------------------------------------------------
  // DOM element selection (cached for performance)
  // -----------------------------------------------------------------------------
  const $ = (selector) => document.querySelector(selector);

  const elements = {
    app: $("#app"),
    video: $("#city-video"),
    poster: $("#poster"),
    radio: $("#radio-player"),
    cityName: $("#city-name"),
    cityRegion: $("#city-region"),
    cityNote: $("#city-note"),
    cityIndex: $("#city-index"),
    cityTotal: $("#city-total"),
    topLocation: $("#top-location"),
    topTime: $("#top-time"),
    stationName: $("#station-name"),
    lcdMeta: $("#lcd-meta"),
    equalizer: $("#equalizer"),
    stereoLed: $("#stereo-led"),
    rdsLed: $("#rds-led"),
    play: $("#play-button"),
    volume: $("#volume"),
    volumeKnob: $("#volume-knob"),
    rail: $("#rail-track"),
    drawer: $("#city-drawer"),
    grid: $("#city-grid"),
    search: $("#city-search"),
    resultCount: $("#result-count"),
    about: $("#about-modal"),
    mapModal: $("#map-modal"),
    mapContainer: $("#world-map"),
    mapResultCount: $("#map-result-count"),
    mapDirectory: $("#map-directory"),
    mapButton: $("#map-button"),
    streetSound: $("#street-sound"),
    randomBtn: $("#random-btn"),
    toast: $("#toast"),
    playerCard: document.querySelector(".player-card"),
    playerMinimize: $("#player-minimize"),
    playerRestore: $("#player-restore"),
    // Novas funcionalidades
    favoriteBtn: $("#favorite-btn"),
    infoTimezone: $("#info-timezone"),
    infoPopulation: $("#info-population"),
    filterContinent: $("#filter-continent"),
    statsModal: $("#stats-modal"),
    pipBtn: $("#pip-button"),
    shareBtn: $("#share-button"),
    statsBtn: $("#stats-button"),
    themeBtn: $("#theme-button"),
    autoplayBtn: $("#autoplay-btn"),
    pomodoroBtn: $("#pomodoro-btn"),
    pomodoroPanel: $("#pomodoro-panel"),
    pomodoroTime: $("#pomodoro-time"),
    autoplayPanel: $("#autoplay-panel"),
    autoplayTime: $("#autoplay-time"),
    qualityBtn: $("#quality-btn"),
    // Seletores cacheados para grupos de botões
    modeButtons: document.querySelectorAll("[data-mode]"),
    speedButtons: document.querySelectorAll("[data-speed]"),
    closeDrawerButtons: document.querySelectorAll("[data-close-drawer]"),
    closeAboutButtons: document.querySelectorAll("[data-close-about]"),
    closeMapButtons: document.querySelectorAll("[data-close-map]"),
    closeStatsButtons: document.querySelectorAll("[data-close-stats]"),
    shareFanButtons: document.querySelectorAll(".share-fan-item"),
    filterButtons: document.querySelectorAll("[data-filter]"),
  };

  // -----------------------------------------------------------------------------
  // Estado da aplicação (encapsulado dentro do IIFE)
  // -----------------------------------------------------------------------------
  const state = {
    cityIndex: 0,
    radioIndex: 0,
    radioPlaying: false,
    radioWantsPlay: false,
    streetSoundOn: false,
    currentSpeed: 1,
    currentMode: CONFIG.modes.DRIVE,
    videoReadyTimer: null,
    toastTimer: null,
    radioRetryCount: 0,
    radioRetryTimer: null,
    radioRequestId: 0,
    clockIntervalId: null,
    // Novas funcionalidades
    favorites: new Set(),
    visitedCities: new Set(),
    currentFilter: CONFIG.filters.ALL,
    currentContinent: "",
    autoplayOn: false,
    autoplayTimer: null,
    autoplayRemaining: CONFIG.AUTOPLAY_INTERVAL / 1000,
    pomodoroOn: false,
    pomodoroTimer: null,
    pomodoroRemaining: CONFIG.POMODORO_DURATION,
    pomodoroIsBreak: false,
    currentTheme: CONFIG.themes.DEFAULT,
    currentQuality: CONFIG.qualities.AUTO,
    sessionStartTime: Date.now(),
    totalTravelTime: 0,
    playerHidden: false,
    // Volume knob drag state
    volumeKnob: {
      isDragging: false,
      startY: 0,
      startVolume: 0,
    },
  };

  let worldMap = null;
  let leafletAssetsPromise = null;

  // -----------------------------------------------------------------------------
  // Funções auxiliares
  // -----------------------------------------------------------------------------
  
  /**
   * Formata índice com zeros à esquerda
   * @param {number} value - Valor a formatar
   * @returns {string} Valor formatado
   */
  function pad(value) {
    return String(value).padStart(String(cities.length).length, "0");
  }

  /**
   * Retorna a cidade atual
   * @returns {Object} Objeto da cidade atual
   */
  function currentCity() {
    return cities[state.cityIndex];
  }

  /**
   * Retorna o vídeo atual para o modo selecionado
   * @param {Object} [city] - Cidade (padrão: cidade atual)
   * @returns {Object|undefined} Objeto do vídeo ou undefined
   */
  function currentRide(city = currentCity()) {
    const modeVideos = city.videos[state.currentMode];
    if (modeVideos?.length) return modeVideos[0];
    return city.videos[CONFIG.modes.DRIVE][0];
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildYoutubeWatchUrl(ride) {
    const url = new URL(`https://www.youtube.com/watch?v=${encodeURIComponent(ride.id)}`);
    if (Number(ride.start) > 0) url.searchParams.set("t", `${Math.floor(Number(ride.start))}s`);
    return url.toString();
  }

  function travelRecommendationMarkup(city) {
    const recommendations = window.YOUCITY_TRAVEL_RECOMMENDATIONS?.byCity?.[city.rawName];
    if (!recommendations) return "";

    const labels = { hotels: "Hotels", flights: "Flights", carRental: "Car rental" };
    const sections = Object.entries(labels).map(([category, label]) => {
      const entries = Array.isArray(recommendations[category]) ? recommendations[category] : [];
      if (!entries.length) return "";
      return `<div class="map-travel-group"><strong>${label}</strong><ul>${entries.map((entry) => `<li><a href="${escapeHtml(entry.url)}" target="_blank" rel="noopener noreferrer sponsored">${escapeHtml(entry.name || "Explore options")} ↗</a></li>`).join("")}</ul></div>`;
    }).join("");

    return sections ? `<div class="map-travel"><span>Travel options</span>${sections}</div>` : "";
  }

  function mapPopup(city, index) {
    const modeSections = Object.entries(city.videos)
      .filter(([, videos]) => videos?.length)
      .map(([mode, videos]) => {
        const label = MODE_LABELS[mode] || mode;
        const links = videos.map((ride, videoIndex) => `
          <li>
            <a href="${escapeHtml(buildYoutubeWatchUrl(ride))}" target="_blank" rel="noopener noreferrer">Watch video ${videoIndex + 1} ↗</a>
          </li>`).join("");
        return `
          <div class="map-video-group">
            <div class="map-video-heading">
              <strong>${escapeHtml(label)}</strong>
              <button type="button" data-map-play data-city="${index}" data-mode="${escapeHtml(mode)}">Play in YouCity</button>
            </div>
            <ul>${links}</ul>
          </div>`;
      }).join("");

    return `<div class="map-popup">
      <div class="map-popup-title"><strong>${escapeHtml(city.name)}</strong><span>${escapeHtml(city.country)}</span></div>
      <div class="map-popup-videos">${modeSections || "<p>No videos available.</p>"}${travelRecommendationMarkup(city)}</div>
    </div>`;
  }

  function loadLeafletAssets() {
    if (window.L) return Promise.resolve(window.L);
    if (leafletAssetsPromise) return leafletAssetsPromise;

    const config = window.YOUCITY_MAP_CONFIG || {};
    const cssUrl = config.leafletCssUrl || "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    const jsUrl = config.leafletJsUrl || "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

    leafletAssetsPromise = new Promise((resolve, reject) => {
      if (!document.querySelector("link[data-youcity-leaflet]") && cssUrl) {
        const stylesheet = document.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.href = cssUrl;
        stylesheet.dataset.youcityLeaflet = "true";
        document.head.appendChild(stylesheet);
      }

      const existingScript = document.querySelector("script[data-youcity-leaflet]");
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(window.L), { once: true });
        existingScript.addEventListener("error", () => reject(new Error("Leaflet failed to load")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = jsUrl;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.dataset.youcityLeaflet = "true";
      script.addEventListener("load", () => resolve(window.L), { once: true });
      script.addEventListener("error", () => reject(new Error("Leaflet failed to load")), { once: true });
      document.body.appendChild(script);
    });

    return leafletAssetsPromise;
  }

  function renderMapDirectory() {
    if (!elements.mapDirectory) return;
    elements.mapDirectory.innerHTML = cities.map((city, index) => {
      const modes = Object.entries(city.videos)
        .filter(([, videos]) => videos?.length)
        .map(([mode, videos]) => {
          const links = videos.map((ride, videoIndex) => `<a href="${escapeHtml(buildYoutubeWatchUrl(ride))}" target="_blank" rel="noopener noreferrer">${escapeHtml(MODE_LABELS[mode] || mode)} ${videoIndex + 1}</a>`).join("");
          return `<div class="map-directory-mode"><strong>${escapeHtml(MODE_LABELS[mode] || mode)}</strong><button type="button" data-map-play data-city="${index}" data-mode="${escapeHtml(mode)}">Play</button><span>${links}</span></div>`;
        }).join("");
      return `<article class="map-directory-item"><h3><button type="button" data-map-city-select="${index}">${escapeHtml(city.name)}</button><span>${escapeHtml(city.country)}</span></h3>${modes}</article>`;
    }).join("");
  }

  async function initializeWorldMap() {
    if (!elements.mapContainer || worldMap) {
      worldMap?.invalidateSize();
      return;
    }

    elements.mapContainer.innerHTML = '<p class="map-unavailable map-loading">Loading world map…</p>';
    let L;
    try {
      L = await loadLeafletAssets();
    } catch (error) {
      console.warn("[YouCity] Map library unavailable:", error.message);
      elements.mapContainer.innerHTML = '<p class="map-unavailable">The map library could not be loaded. Check your connection and try again.</p>';
      return;
    }

    if (!L) {
      elements.mapContainer.innerHTML = '<p class="map-unavailable">The map library could not be loaded. Check your connection and try again.</p>';
      return;
    }

    worldMap = L.map(elements.mapContainer, { worldCopyJump: true, minZoom: 2, maxZoom: 12, zoomControl: true }).setView([20, 0], 2);
    const mapConfig = window.YOUCITY_MAP_CONFIG || {};
    L.tileLayer(mapConfig.tileUrl || "https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: mapConfig.attribution || "&copy; OpenStreetMap contributors",
      maxZoom: mapConfig.maxZoom || 19,
      tileSize: 256
    }).addTo(worldMap);

    const bounds = [];
    let mappedCities = 0;
    cities.forEach((city, index) => {
      const coordinates = window.CITY_COORDINATES?.[city.rawName];
      if (!Array.isArray(coordinates)) return;
      mappedCities += 1;
      bounds.push(coordinates);
      L.circleMarker(coordinates, {
        radius: 6,
        color: "#d7ff43",
        weight: 2,
        fillColor: "#111411",
        fillOpacity: 0.95,
        bubblingMouseEvents: false
      }).bindPopup(mapPopup(city, index), { maxWidth: 340, minWidth: 260 }).addTo(worldMap);
    });

    if (elements.mapResultCount) elements.mapResultCount.textContent = `${mappedCities} cities · ${cities.length} destinations`;
    renderMapDirectory();
    if (bounds.length) worldMap.fitBounds(bounds, { padding: [28, 28], maxZoom: 3 });
    setTimeout(() => worldMap?.invalidateSize(), 50);
  }

  function playMapRide(cityIndex, mode) {
    if (!Number.isInteger(cityIndex) || !cities[cityIndex]?.videos[mode]?.length) return;
    closeLayer(elements.mapModal);
    selectCity(cityIndex, { silent: true });
    if (state.currentMode !== mode) switchMode(mode);
    else updateVideo(currentCity());
  }

  // -----------------------------------------------------------------------------
  // Controle do player de vídeo (YouTube iframe API)
  // -----------------------------------------------------------------------------
  
  /**
   * Envia comando para o iframe do YouTube
   * @param {string} func - Nome da função
   * @param {Array} [args] - Argumentos
   */
  function videoCommand(func, args = []) {
    elements.video.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "*"
    );
  }

  /**
   * Constrói URL do vídeo do YouTube
   * @param {Object} ride - Objeto do vídeo com id e start
   * @returns {string} URL completa do embed
   */
  function buildVideoUrl(ride) {
    const params = new URLSearchParams({
      autoplay: "1",
      mute: state.streetSoundOn ? "0" : "1",
      controls: "0",
      loop: "1",
      playlist: ride.id,
      modestbranding: "1",
      rel: "0",
      playsinline: "1",
      enablejsapi: "1",
      disablekb: "1",
      fs: "0",
      cc_load_policy: "0",
      iv_load_policy: "3",
      hl: "en-US",
      start: String(ride.start),
      origin: window.location.origin
    });
    return `https://www.youtube-nocookie.com/embed/${ride.id}?${params}`;
  }

  /**
   * Atualiza o vídeo da cidade
   * @param {Object} city - Objeto da cidade
   */
  function updateVideo(city) {
    const ride = currentRide(city);
    if (!ride) {
      // Fallback: cidade sem vídeo disponível
      elements.video.classList.remove("is-ready");
      elements.poster.style.backgroundImage = "";
      showToast(MESSAGES.noVideo);
      return;
    }
    
    clearTimeout(state.videoReadyTimer);
    elements.video.classList.remove("is-ready");
    
    // Poster com fallback de qualidade
    elements.poster.style.backgroundImage = `url("https://i.ytimg.com/vi/${ride.id}/maxresdefault.jpg"), url("https://i.ytimg.com/vi/${ride.id}/hqdefault.jpg")`;
    elements.video.src = buildVideoUrl(ride);
    
    state.videoReadyTimer = setTimeout(() => {
      elements.video.classList.add("is-ready");
      videoCommand("setPlaybackRate", [state.currentSpeed]);
      if (!state.streetSoundOn) videoCommand("mute");
    }, CONFIG.VIDEO_READY_DELAY);
  }

  /**
   * Trata erros de vídeo indisponível
   */
  function handleVideoError() {
    const city = currentCity();
    const modeVideos = city.videos[state.currentMode];
    
    // Tenta próximo vídeo do mesmo modo
    if (modeVideos && modeVideos.length > 1) {
      modeVideos.shift(); // Remove vídeo com problema
      updateVideo(city);
      showToast(MESSAGES.videoFallback);
    } else {
      showToast(MESSAGES.videoUnavailable);
    }
  }

  // -----------------------------------------------------------------------------
  // Relógio sincronizado com minuto cheio
  // -----------------------------------------------------------------------------
  
  /**
   * Atualiza o relógio com o horário local da cidade
   */
  function updateClock() {
    if (!elements.topTime) return;
    try {
      elements.topTime.textContent = new Intl.DateTimeFormat("en-US", {
        timeZone: currentCity().timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(new Date());
    } catch (error) {
      console.warn("[YouCity] Failed to update clock:", error.message);
      elements.topTime.textContent = "--:--";
    }
  }

  /**
   * Agenda atualização do relógio sincronizada com o minuto cheio
   */
  function scheduleClockUpdate() {
    // Limpa intervalo anterior se existir
    if (state.clockIntervalId) clearInterval(state.clockIntervalId);
    
    // Atualiza imediatamente
    updateClock();
    
    // Calcula ms até o próximo minuto cheio
    const now = new Date();
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    
    // Agenda primeira atualização no minuto cheio, depois a cada 60s
    setTimeout(() => {
      updateClock();
      state.clockIntervalId = setInterval(updateClock, CONFIG.CLOCK_INTERVAL);
    }, msToNextMinute);
  }

  // -----------------------------------------------------------------------------
  // Ride mode controls (Drive/Bike/Walk/Drone)
  // -----------------------------------------------------------------------------
  
  /**
   * Atualiza os controles de modo baseado na disponibilidade
   */
  function updateModeControls() {
    elements.modeButtons.forEach((button) => {
      const mode = button.dataset.mode;
      const available = currentCity().videos[mode]?.length > 0;
      button.disabled = !available;
      button.classList.toggle("is-active", mode === state.currentMode);
      button.title = available
        ? `${MODE_LABELS[mode]} in ${currentCity().name}`
        : "This ride type is unavailable in this city";
    });
    elements.cityRegion.textContent = `${currentCity().region} · ${MODE_LABELS[state.currentMode]}`;
  }

  // -----------------------------------------------------------------------------
  // Controle de rádio com auto-retry
  // -----------------------------------------------------------------------------
  
  /**
   * Configura uma estação de rádio
   * @param {number} [nextIndex=0] - Índice da estação
   * @param {boolean} [shouldPlay] - Se deve tocar automaticamente
   */
  function clearRadioRetryTimer() {
    if (state.radioRetryTimer) {
      clearTimeout(state.radioRetryTimer);
      state.radioRetryTimer = null;
    }
  }

  /**
   * Schedules one retry for the current radio failure.
   */
  function scheduleRadioRetry() {
    if (!state.radioWantsPlay || state.radioRetryTimer) return;

    if (state.radioRetryCount >= CONFIG.RADIO_MAX_RETRIES) {
      state.radioWantsPlay = false;
      state.radioRetryCount = 0;
      setPlayingState(false);
      showToast(MESSAGES.radioUnavailable);
      return;
    }

    state.radioRetryCount++;
    showToast(MESSAGES.radioRetry);
    state.radioRetryTimer = setTimeout(() => {
      state.radioRetryTimer = null;
      if (state.radioWantsPlay) setRadio(state.radioIndex + 1, true, { preserveRetries: true });
    }, CONFIG.RADIO_RETRY_DELAY);
  }

  function setRadio(nextIndex = 0, shouldPlay = state.radioPlaying, options = {}) {
    const radios = currentCity().radios;

    clearRadioRetryTimer();
    state.radioWantsPlay = shouldPlay;
    if (!options.preserveRetries) state.radioRetryCount = 0;
    const requestId = ++state.radioRequestId;
    
    if (!radios.length) {
      elements.radio.removeAttribute("src");
      elements.stationName.innerHTML = "NO SIGNAL<small> --</small>";
      elements.lcdMeta.textContent = "-- · NO SIGNAL";
      elements.play.disabled = true;
      elements.stereoLed.classList.remove("is-active");
      elements.rdsLed.classList.remove("is-active");
      setPlayingState(false);
      return;
    }
    
    elements.play.disabled = false;
    state.radioIndex = (nextIndex + radios.length) % radios.length;
    
    const station = radios[state.radioIndex];
    elements.stationName.innerHTML = `${station.name}<small> FM</small>`;
    elements.lcdMeta.textContent = `CH-${String(state.radioIndex + 1).padStart(2, "0")} · ${currentCity().name.toUpperCase().slice(0, 12)}`;
    elements.stereoLed.classList.add("is-active");
    elements.rdsLed.classList.toggle("is-active", station.name.length > 10);
    
    elements.radio.src = station.url;
    elements.radio.volume = Number(elements.volume.value) / 100;
    
    if (shouldPlay) {
      playRadioWithRetry(requestId);
    } else {
      setPlayingState(false);
    }
  }

  /**
   * Tenta reproduzir rádio com retry automático
   */
  function playRadioWithRetry(requestId = state.radioRequestId) {
    elements.radio.play()
      .then(() => {
        if (requestId !== state.radioRequestId) return;
        setPlayingState(true);
        state.radioRetryCount = 0;
      })
      .catch((error) => {
        if (requestId !== state.radioRequestId || !state.radioWantsPlay) return;
        console.warn("[YouCity] Failed to play radio:", error.message);
        setPlayingState(false);
        scheduleRadioRetry();
      });
  }

  /**
   * Atualiza estado visual do player de rádio
   * @param {boolean} playing - Se está tocando
   */
  function setPlayingState(playing) {
    state.radioPlaying = playing;
    const pauseText = elements.play.querySelector(".pause-text");
    const playText = elements.play.querySelector(".play-text");
    
    if (pauseText && playText) {
      pauseText.style.display = playing ? "inline" : "none";
      playText.style.display = playing ? "none" : "inline";
    }
    
    elements.play.setAttribute("aria-label", playing ? "Pause radio" : "Play radio");
    elements.equalizer.classList.toggle("is-playing", playing);
  }

  /**
   * Alterna reprodução do rádio
   */
  function toggleRadio() {
    if (!currentCity().radios.length) {
      return showToast(MESSAGES.noRadio);
    }
    
    if (state.radioPlaying || state.radioWantsPlay) {
      state.radioWantsPlay = false;
      clearRadioRetryTimer();
      state.radioRequestId++;
      elements.radio.pause();
      setPlayingState(false);
    } else {
      state.radioWantsPlay = true;
      playRadioWithRetry();
    }
  }

  // -----------------------------------------------------------------------------
  // Minimizar / Restaurar Player
  // -----------------------------------------------------------------------------
  
  /**
   * Alterna visibilidade do player
   * @param {boolean} [hide] - Forçar estado
   */
  function togglePlayer(hide) {
    state.playerHidden = hide !== undefined ? hide : !state.playerHidden;
    
    elements.playerCard.classList.toggle("is-hidden", state.playerHidden);
    elements.playerRestore.classList.toggle("is-visible", state.playerHidden);
    
    // Salva preferência
    try {
      localStorage.setItem(CONFIG.storageKeys.playerHidden, state.playerHidden);
    } catch (error) {
      console.warn("[YouCity] Failed to save player state:", error.message);
    }
  }

  /**
   * Restaura estado do player do localStorage
   */
  function restorePlayerFromStorage() {
    try {
      const saved = localStorage.getItem(CONFIG.storageKeys.playerHidden);
      if (saved === "true") {
        togglePlayer(true);
      }
    } catch (error) {
      console.warn("[YouCity] Failed to restore player state:", error.message);
    }
  }

  // -----------------------------------------------------------------------------
  // Favoritos
  // -----------------------------------------------------------------------------
  
  /**
   * Carrega favoritos do localStorage
   * @returns {Set} Set de favoritos
   */
  function loadFavorites() {
    try {
      const saved = localStorage.getItem(CONFIG.storageKeys.favorites);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (error) {
      console.warn("[YouCity] Failed to load favorites:", error.message);
      return new Set();
    }
  }

  /**
   * Salva favoritos no localStorage
   */
  function saveFavorites() {
    try {
      localStorage.setItem(CONFIG.storageKeys.favorites, JSON.stringify([...state.favorites]));
    } catch (error) {
      console.warn("[YouCity] Failed to save favorites:", error.message);
    }
  }

  /**
   * Alterna favorito de uma cidade
   * @param {number} [index] - Índice da cidade
   */
  function toggleFavorite(index = state.cityIndex) {
    const cityKey = cities[index].rawName;
    if (state.favorites.has(cityKey)) {
      state.favorites.delete(cityKey);
      showToast(MESSAGES.favoriteRemoved(cities[index].name));
    } else {
      state.favorites.add(cityKey);
      showToast(MESSAGES.favoriteAdded(cities[index].name));
    }
    saveFavorites();
    updateFavoriteButton();
    renderGrid();
    updateStats();
  }

  /**
   * Atualiza botão de favorito
   */
  function updateFavoriteButton() {
    const isFav = state.favorites.has(cities[state.cityIndex].rawName);
    elements.favoriteBtn.classList.toggle("is-active", isFav);
    elements.favoriteBtn.setAttribute("aria-label", isFav ? "Remove from favorites" : "Add to favorites");
  }

  /**
   * Verifica se cidade é favorita
   * @param {number} index - Índice da cidade
   * @returns {boolean}
   */
  function isFavorite(index) {
    return state.favorites.has(cities[index].rawName);
  }

  // -----------------------------------------------------------------------------
  // Estatísticas
  // -----------------------------------------------------------------------------
  
  /**
   * Carrega estatísticas do localStorage
   * @returns {Object} Objeto de estatísticas
   */
  function loadStats() {
    try {
      const saved = localStorage.getItem(CONFIG.storageKeys.stats);
      return saved ? JSON.parse(saved) : { visited: [], totalTime: 0, sessions: 0 };
    } catch (error) {
      console.warn("[YouCity] Failed to load statistics:", error.message);
      return { visited: [], totalTime: 0, sessions: 0 };
    }
  }

  /**
   * Salva estatísticas no localStorage
   */
  function saveStats() {
    try {
      const stats = loadStats();
      stats.visited = [...state.visitedCities];
      stats.totalTime = state.totalTravelTime + Math.floor((Date.now() - state.sessionStartTime) / 1000);
      localStorage.setItem(CONFIG.storageKeys.stats, JSON.stringify(stats));
    } catch (error) {
      console.warn("[YouCity] Failed to save statistics:", error.message);
    }
  }

  /**
   * Atualiza exibição de estatísticas
   */
  function updateStats() {
    const stats = loadStats();
    $("#stat-cities").textContent = state.visitedCities.size;
    $("#stat-favorites").textContent = state.favorites.size;
    const totalSeconds = stats.totalTime + Math.floor((Date.now() - state.sessionStartTime) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    $("#stat-time").textContent = `${hours}h ${minutes}m`;
    $("#stat-sessions").textContent = stats.sessions;
  }

  /**
   * Registra visita a uma cidade
   * @param {number} index - Índice da cidade
   */
  function trackVisit(index) {
    state.visitedCities.add(cities[index].city);
    saveStats();
  }

  /**
   * Incrementa contador de sessões
   */
  function incrementSession() {
    try {
      const stats = loadStats();
      stats.sessions = (stats.sessions || 0) + 1;
      localStorage.setItem(CONFIG.storageKeys.stats, JSON.stringify(stats));
    } catch (error) {
      console.warn("[YouCity] Failed to increment session count:", error.message);
    }
  }

  // -----------------------------------------------------------------------------
  // Filtros
  // -----------------------------------------------------------------------------
  
  /**
   * Define filtro ativo
   * @param {string} filter - Filtro a aplicar
   */
  function setFilter(filter) {
    state.currentFilter = filter;
    elements.filterButtons.forEach(btn => {
      btn.classList.toggle("is-active", btn.dataset.filter === filter);
    });
    renderGrid(elements.search.value);
  }

  /**
   * Define filtro de continente
   * @param {string} continent - Continente a filtrar
   */
  function setContinent(continent) {
    state.currentContinent = continent;
    renderGrid(elements.search.value);
  }

  // -----------------------------------------------------------------------------
  // Autoplay
  // -----------------------------------------------------------------------------
  
  /**
   * Alterna modo autoplay
   */
  function toggleAutoplay() {
    state.autoplayOn = !state.autoplayOn;
    elements.autoplayBtn.classList.toggle("is-active", state.autoplayOn);
    elements.autoplayBtn.setAttribute("aria-pressed", state.autoplayOn);
    elements.autoplayPanel.classList.toggle("is-visible", state.autoplayOn);
    
    if (state.autoplayOn) {
      state.autoplayRemaining = CONFIG.AUTOPLAY_INTERVAL / 1000;
      updateAutoplayDisplay();
      state.autoplayTimer = setInterval(() => {
        state.autoplayRemaining--;
        updateAutoplayDisplay();
        if (state.autoplayRemaining <= 0) {
          selectCity(state.cityIndex + 1);
          state.autoplayRemaining = CONFIG.AUTOPLAY_INTERVAL / 1000;
        }
      }, 1000);
      showToast(MESSAGES.autoplayOn);
    } else {
      clearInterval(state.autoplayTimer);
      state.autoplayTimer = null;
      showToast(MESSAGES.autoplayOff);
    }
  }

  /**
   * Atualiza display do autoplay
   */
  function updateAutoplayDisplay() {
    const min = Math.floor(state.autoplayRemaining / 60);
    const sec = state.autoplayRemaining % 60;
    elements.autoplayTime.textContent = `${min}:${String(sec).padStart(2, "0")}`;
  }

  // -----------------------------------------------------------------------------
  // Pomodoro
  // -----------------------------------------------------------------------------
  
  /**
   * Alterna modo pomodoro
   */
  function togglePomodoro() {
    state.pomodoroOn = !state.pomodoroOn;
    elements.pomodoroBtn.classList.toggle("is-active", state.pomodoroOn);
    elements.pomodoroBtn.setAttribute("aria-pressed", state.pomodoroOn);
    elements.pomodoroPanel.classList.toggle("is-visible", state.pomodoroOn);
    
    if (state.pomodoroOn) {
      state.pomodoroRemaining = CONFIG.POMODORO_DURATION;
      state.pomodoroIsBreak = false;
      updatePomodoroDisplay();
      state.pomodoroTimer = setInterval(() => {
        state.pomodoroRemaining--;
        updatePomodoroDisplay();
        if (state.pomodoroRemaining <= 0) {
          if (state.pomodoroIsBreak) {
            state.pomodoroRemaining = CONFIG.POMODORO_DURATION;
            state.pomodoroIsBreak = false;
            showToast(MESSAGES.pomodoroBreakEnd);
            document.querySelector(".pomodoro-label").textContent = "focus";
          } else {
            state.pomodoroRemaining = CONFIG.POMODORO_BREAK;
            state.pomodoroIsBreak = true;
            selectCity(state.cityIndex + 1);
            showToast(MESSAGES.pomodoroComplete);
            document.querySelector(".pomodoro-label").textContent = "break";
          }
        }
      }, 1000);
      showToast(MESSAGES.pomodoroStart);
    } else {
      clearInterval(state.pomodoroTimer);
      state.pomodoroTimer = null;
      showToast(MESSAGES.pomodoroPause);
    }
  }

  /**
   * Atualiza display do pomodoro
   */
  function updatePomodoroDisplay() {
    const min = Math.floor(state.pomodoroRemaining / 60);
    const sec = state.pomodoroRemaining % 60;
    elements.pomodoroTime.textContent = `${min}:${String(sec).padStart(2, "0")}`;
  }

  // -----------------------------------------------------------------------------
  // Temas
  // -----------------------------------------------------------------------------
  
  /**
   * Cicla entre temas visuais
   */
  function cycleTheme() {
    const themes = [CONFIG.themes.DEFAULT, CONFIG.themes.SEPIA, CONFIG.themes.CONTRAST];
    const currentIdx = themes.indexOf(state.currentTheme);
    state.currentTheme = themes[(currentIdx + 1) % themes.length];
    
    elements.app.classList.remove(CONFIG.themes.SEPIA, CONFIG.themes.CONTRAST);
    if (state.currentTheme) elements.app.classList.add(state.currentTheme);
    
    try {
      localStorage.setItem(CONFIG.storageKeys.theme, state.currentTheme);
    } catch (error) {
      console.warn("[YouCity] Failed to save theme:", error.message);
    }
    
    showToast(THEME_NAMES[state.currentTheme]);
  }

  /**
   * Carrega tema do localStorage
   */
  function loadTheme() {
    try {
      state.currentTheme = localStorage.getItem(CONFIG.storageKeys.theme) || CONFIG.themes.DEFAULT;
      if (state.currentTheme) elements.app.classList.add(state.currentTheme);
    } catch (error) {
      console.warn("[YouCity] Failed to load theme:", error.message);
    }
  }

  // -----------------------------------------------------------------------------
  // Qualidade de vídeo (CORRIGIDO: usava loadVideo inexistente)
  // -----------------------------------------------------------------------------
  
  /**
   * Cicla entre qualidades de vídeo
   */
  function cycleQuality() {
    const qualities = [CONFIG.qualities.AUTO, CONFIG.qualities.HD720, CONFIG.qualities.HD1080];
    const currentIdx = qualities.indexOf(state.currentQuality);
    state.currentQuality = qualities[(currentIdx + 1) % qualities.length];
    
    elements.qualityBtn.textContent = state.currentQuality === CONFIG.qualities.AUTO 
      ? "HD" 
      : state.currentQuality + "p";
    
    // CORREÇÃO: Usar updateVideo em vez da inexistente loadVideo
    const city = currentCity();
    updateVideo(city);
    
    const message = state.currentQuality === CONFIG.qualities.AUTO 
      ? MESSAGES.qualityAuto 
      : MESSAGES.qualitySet(state.currentQuality);
    showToast(message);
  }

  // -----------------------------------------------------------------------------
  // Picture-in-Picture
  // -----------------------------------------------------------------------------
  
  /**
   * Alterna Picture-in-Picture
   */
  async function togglePiP() {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        showToast(MESSAGES.pipOff);
      } else {
        // Cria um vídeo temporário para PiP (iframe não suporta diretamente)
        showToast(MESSAGES.pipUnavailable);
      }
    } catch (error) {
      console.warn("[YouCity] PiP error:", error.message);
      showToast(MESSAGES.pipError);
    }
  }

  // -----------------------------------------------------------------------------
  // Compartilhar
  // -----------------------------------------------------------------------------
  
  /**
   * Alterna visibilidade do menu leque de share
   */
  function toggleShareFan() {
    const fan = $("#share-fan");
    const btn = elements.shareBtn;
    const isOpen = fan.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", isOpen);
    
    // Fecha ao clicar fora
    if (isOpen) {
      setTimeout(() => {
        document.addEventListener("click", closeShareFanOnClickOutside);
      }, 10);
    }
  }
  
  /**
   * Fecha o leque ao clicar fora
   */
  function closeShareFanOnClickOutside(e) {
    const fan = $("#share-fan");
    const wrapper = e.target.closest(".share-fan-wrapper");
    if (!wrapper && fan.classList.contains("is-open")) {
      fan.classList.remove("is-open");
      elements.shareBtn.setAttribute("aria-expanded", "false");
      document.removeEventListener("click", closeShareFanOnClickOutside);
    }
  }
  
  /**
   * Fecha o leque de share
   */
  function closeShareFan() {
    const fan = $("#share-fan");
    fan.classList.remove("is-open");
    elements.shareBtn.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", closeShareFanOnClickOutside);
  }

  /**
   * Gera URL de compartilhamento
   * @returns {Object} Objeto com url e text
   */
  function getShareData() {
    const city = currentCity();
    const countryName = COUNTRY_INFO[city.country]?.[0] || city.country;
    const url = `${window.location.origin}/city/${citySlug(city.rawName || city.name)}`;
    const text = `🌍 Exploring ${city.name}, ${countryName} on YouCity — an immersive urban ride with local radio`;
    const title = `YouCity — ${city.name}`;
    return { url, text, title };
  }

  /**
   * Compartilha em rede social específica
   * @param {string} platform - Plataforma de compartilhamento
   */
  async function shareToSocial(platform) {
    const { url, text, title } = getShareData();
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);
    const encodedTitle = encodeURIComponent(title);
    
    const shareUrls = {
      whatsapp: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    };
    
    if (platform === "copy") {
      try {
        await navigator.clipboard.writeText(url);
        showToast(MESSAGES.linkCopied);
      } catch (error) {
        console.warn("[YouCity] Could not copy link:", error.message);
        showToast(MESSAGES.linkCopyFailed);
      }
      closeShareFan();
      return;
    }
    
    const shareUrl = shareUrls[platform];
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400,menubar=no,toolbar=no");
      closeShareFan();
    }
  }

  /**
   * Compartilha cidade atual (fallback para Web Share API ou abre leque)
   */
  async function shareCity() {
    // Em mobile com Web Share API nativa, usa ela diretamente
    if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      const { url, text, title } = getShareData();
      try {
        await navigator.share({ title, text, url });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.warn("[YouCity] Could not share:", error.message);
        }
      }
    } else {
      // Em desktop, abre leque com opções de redes sociais
      toggleShareFan();
    }
  }

  /**
   * Carrega cidade da URL (com sanitização)
   * @returns {number|null} Índice da cidade ou null
   */
  function loadCityFromURL() {
    try {
      const params = new URLSearchParams(window.location.search);
      const cityPath = window.location.pathname.match(/^\/city\/([^/]+)\/?$/i)?.[1];
      const cityName = params.get("city");

      if (cityPath) {
        const requestedSlug = citySlug(decodeURIComponent(cityPath));
        const pathIndex = cities.findIndex((city) =>
          citySlug(city.name) === requestedSlug || citySlug(city.rawName) === requestedSlug
        );
        if (pathIndex !== -1) return pathIndex;
      }
      
      // CORREÇÃO: Sanitiza entrada para prevenir XSS
      const sanitizedCityName = sanitizeInput(cityName);
      
      if (sanitizedCityName) {
        const normalizedRequestedCity = normalizeSearch(sanitizedCityName);
        const index = cities.findIndex((city) =>
          [city.name, city.rawName].some((name) => normalizeSearch(name) === normalizedRequestedCity)
        );
        if (index !== -1) return index;
      }
    } catch (error) {
      console.warn("[YouCity] Could not load city from URL:", error.message);
    }
    return null;
  }

  // -----------------------------------------------------------------------------
  // -----------------------------------------------------------------------------
  // Info da cidade
  // -----------------------------------------------------------------------------
  
  /**
   * Atualiza informações da cidade
   */
  function updateCityInfo() {
    const city = currentCity();
    const info = COUNTRY_INFO[city.country];
    
    // Hora local
    if (info && info[2]) {
      try {
        const time = new Date().toLocaleTimeString("en-US", {
          timeZone: info[2], 
          hour: "2-digit", 
          minute: "2-digit" 
        });
        elements.infoTimezone.querySelector("b").textContent = time;
      } catch (error) {
      console.warn("[YouCity] Could not format time:", error.message);
        elements.infoTimezone.querySelector("b").textContent = "--:--";
      }
    }
    
    // População (dados simulados baseados no tamanho da cidade)
    const populations = {
      "São Paulo": "12.3M", "Tokyo": "13.9M", "New York": "8.3M", "London": "8.9M",
      "Paris": "2.1M", "Berlin": "3.6M", "Sydney": "5.3M", "Mumbai": "12.4M",
      "Beijing": "21.5M", "Moscow": "11.9M", "Cairo": "9.5M", "Lagos": "14.3M",
    };
    const pop = populations[city.name] || populations[city.rawName] || `${Math.floor(Math.random() * 5 + 1)}.${Math.floor(Math.random() * 9)}M`;
    elements.infoPopulation.querySelector("b").textContent = pop;
  }

  // -----------------------------------------------------------------------------
  // Renderização de UI
  // -----------------------------------------------------------------------------
  
  /**
   * Renderiza trilho de navegação
   */
  function renderRail() {
    const indexes = [-3, -2, -1, 0, 1, 2, 3].map(
      (offset) => (state.cityIndex + offset + cities.length) % cities.length
    );
    
    elements.rail.innerHTML = indexes.map((index) => `
      <button class="rail-dot${index === state.cityIndex ? " is-active" : ""}" 
              type="button" 
              data-city="${index}" 
              aria-label="Go to ${cities[index].name}"></button>
    `).join("");
  }

  /**
   * Renderiza grid de cidades
   * @param {string} [filter=""] - Filtro de busca
   */
  function renderGrid(filter = "") {
    const normalized = normalizeSearch(filter.trim());
    let matches = cities
      .map((city, index) => ({ city, index }))
      .filter(({ city }) =>
        normalizeSearch(`${city.name} ${city.rawName} ${city.country} ${city.rawCountry} ${city.region}`).includes(normalized)
      );
    
    // Aplica filtros adicionais
    if (state.currentFilter === CONFIG.filters.FAVORITES) {
      matches = matches.filter(({ index }) => isFavorite(index));
    }
    if (state.currentContinent) {
      matches = matches.filter(({ city }) => city.region === state.currentContinent);
    }
    
    elements.resultCount.textContent = `${matches.length} ${matches.length === 1 ? "destination" : "destinations"}`;
    
    if (!matches.length) {
      elements.grid.innerHTML = `<p class="empty-state">No cities found.</p>`;
      return;
    }
    
    elements.grid.innerHTML = matches.map(({ city, index }) => {
      const thumbnail = city.videos[CONFIG.modes.DRIVE][0]?.id;
      const modes = Object.entries(city.videos)
        .filter(([, videos]) => videos.length)
        .map(([mode]) => MODE_LABELS[mode])
        .join(" · ");
      const isFav = isFavorite(index);
      
      return `
        <div class="city-card${index === state.cityIndex ? " is-current" : ""}" 
             role="button" 
             tabindex="0"
             data-city="${index}">
          <img src="https://i.ytimg.com/vi/${thumbnail}/hqdefault.jpg" alt="" loading="lazy" />
          <span class="card-favorite${isFav ? " is-active" : ""}" role="button" tabindex="0" data-favorite="${index}" aria-label="${isFav ? "Remove from favorites" : "Add to favorites"}">
            <svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
          </span>
          <span class="city-card-copy">
            <span><strong>${city.name}</strong><span>${city.country} · ${modes}</span></span>
            <i>↗</i>
          </span>
        </div>`;
    }).join("");
  }

  // -----------------------------------------------------------------------------
  // Navegação entre cidades
  // -----------------------------------------------------------------------------
  
  /**
   * Seleciona uma cidade
   * @param {number} nextIndex - Índice da cidade
   * @param {Object} [options] - Opções
   * @param {boolean} [options.silent] - Não mostrar toast
   * @param {boolean} [options.autoplayRadio] - Iniciar rádio automaticamente
   */
  function selectCity(nextIndex, options = {}) {
    state.cityIndex = (nextIndex + cities.length) % cities.length;
    state.radioIndex = 0;
    
    const city = currentCity();
    
    // Se modo atual não disponível, volta para drive
    if (!city.videos[state.currentMode]?.length) {
      state.currentMode = CONFIG.modes.DRIVE;
    }
    
    // Atualiza UI
    elements.cityName.textContent = city.name;
    elements.cityNote.textContent = city.note;
    elements.cityIndex.textContent = pad(state.cityIndex + 1);
    if (elements.topLocation) {
      elements.topLocation.textContent = `${city.name}, ${city.country}`;
    }
    document.title = `${city.name} — YouCity`;
    
    updateModeControls();
    updateVideo(city);
    scheduleClockUpdate();
    setRadio(0, state.radioPlaying || options.autoplayRadio);
    renderRail();
    renderGrid(elements.search.value);
    
    // Novas funcionalidades
    updateFavoriteButton();
    updateCityInfo();
    trackVisit(state.cityIndex);
    
    // Salva preferência
    savePreferences({ cityIndex: state.cityIndex, currentMode: state.currentMode });
    
    if (!options.silent) {
      showToast(MESSAGES.nowIn(city.name));
    }
  }

  /**
   * Seleciona cidade aleatória
   */
  function selectRandomCity() {
    const randomIndex = Math.floor(Math.random() * cities.length);
    selectCity(randomIndex);
    showToast(MESSAGES.randomDestination(cities[randomIndex].name));
  }

  /**
   * Troca modo de passeio
   * @param {string} mode - Mode (drive/bike/walk/drone)
   */
  function switchMode(mode) {
    if (!currentCity().videos[mode]?.length || mode === state.currentMode) return;
    
    state.currentMode = mode;
    updateModeControls();
    updateVideo(currentCity());
    savePreferences({ currentMode: state.currentMode });
    showToast(MESSAGES.modeSwitch(MODE_LABELS[mode], currentCity().name));
  }

  // -----------------------------------------------------------------------------
  // Modais e Drawer (com focus trap)
  // -----------------------------------------------------------------------------
  
  /**
   * Retorna elementos focáveis dentro de um container
   * @param {HTMLElement} container - Container
   * @returns {NodeList} Elementos focáveis
   */
  function getFocusableElements(container) {
    return container.querySelectorAll(
      'button:not([disabled]), [href], summary, input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
  }

  /**
   * Implementa trap de foco para acessibilidade
   * @param {KeyboardEvent} event - Evento de teclado
   * @param {HTMLElement} container - Container
   */
  function trapFocus(event, container) {
    const focusable = getFocusableElements(container);
    if (!focusable.length) return;
    
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];
    
    if (event.shiftKey && document.activeElement === firstFocusable) {
      event.preventDefault();
      lastFocusable.focus();
    } else if (!event.shiftKey && document.activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable.focus();
    }
  }

  let previouslyFocusedElement = null;

  /**
   * Abre camada modal/drawer
   * @param {HTMLElement} layer - Elemento da camada
   */
  function openLayer(layer) {
    previouslyFocusedElement = document.activeElement;
    layer.classList.add("is-open");
    layer.setAttribute("aria-hidden", "false");
    
    // Foca no primeiro elemento focável
    const panel = layer.querySelector(".drawer-panel, .about-card, .map-card");
    if (panel) {
      const focusable = getFocusableElements(panel);
      if (focusable.length) {
        setTimeout(() => focusable[0].focus(), 100);
      }
    }
    
    // Adiciona trap de foco
    layer._focusTrapHandler = (e) => {
      if (e.key === "Tab") {
        trapFocus(e, panel || layer);
      }
    };
    layer.addEventListener("keydown", layer._focusTrapHandler);
  }

  /**
   * Fecha camada modal/drawer
   * @param {HTMLElement} layer - Elemento da camada
   */
  function closeLayer(layer) {
    layer.classList.remove("is-open");
    layer.setAttribute("aria-hidden", "true");
    
    // Remove trap de foco
    if (layer._focusTrapHandler) {
      layer.removeEventListener("keydown", layer._focusTrapHandler);
      delete layer._focusTrapHandler;
    }
    
    // Restaura foco anterior
    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus();
      previouslyFocusedElement = null;
    }
  }

  // -----------------------------------------------------------------------------
  // Toast (notificações)
  // -----------------------------------------------------------------------------
  
  /**
   * Exibe notificação toast
   * @param {string} message - Mensagem a exibir
   */
  function showToast(message) {
    clearTimeout(state.toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    state.toastTimer = setTimeout(() => {
      elements.toast.classList.remove("is-visible");
    }, CONFIG.TOAST_DURATION);
  }

  // -----------------------------------------------------------------------------
  // Volume Knob (CORRIGIDO: listeners com cleanup apropriado)
  // -----------------------------------------------------------------------------
  
  /**
   * Atualiza volume a partir do knob
   * @param {number} newVolume - Novo volume (0-100)
   */
  function updateVolumeFromKnob(newVolume) {
    const vol = Math.max(0, Math.min(100, newVolume));
    elements.volume.value = vol;
    elements.radio.volume = vol / 100;
    elements.volumeKnob.setAttribute("aria-valuenow", vol);
    elements.volumeKnob.style.transform = `rotate(${(vol - 50) * CONFIG.VOLUME_ROTATION_FACTOR}deg)`;
    savePreferences({ volume: vol });
  }

  /**
   * Handler para movimento do mouse durante drag do knob
   * @param {MouseEvent} e - Evento
   */
  function handleKnobMouseMove(e) {
    if (!state.volumeKnob.isDragging) return;
    const delta = (state.volumeKnob.startY - e.clientY) * CONFIG.VOLUME_DRAG_SENSITIVITY;
    updateVolumeFromKnob(state.volumeKnob.startVolume + delta);
  }

  /**
   * Handler para soltar o mouse após drag do knob
   */
  function handleKnobMouseUp() {
    if (!state.volumeKnob.isDragging) return;
    state.volumeKnob.isDragging = false;
    // CORREÇÃO: Remove listeners quando não mais necessários
    document.removeEventListener("mousemove", handleKnobMouseMove);
    document.removeEventListener("mouseup", handleKnobMouseUp);
  }

  /**
   * Configura event listeners do volume knob
   */
  function setupVolumeKnobListeners() {
    elements.volumeKnob.addEventListener("mousedown", (e) => {
      state.volumeKnob.isDragging = true;
      state.volumeKnob.startY = e.clientY;
      state.volumeKnob.startVolume = Number(elements.volume.value);
      e.preventDefault();
      
      // CORREÇÃO: Adiciona listeners apenas durante o drag
      document.addEventListener("mousemove", handleKnobMouseMove);
      document.addEventListener("mouseup", handleKnobMouseUp);
    });

    elements.volumeKnob.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -CONFIG.VOLUME_WHEEL_STEP : CONFIG.VOLUME_WHEEL_STEP;
      updateVolumeFromKnob(Number(elements.volume.value) + delta);
    });

    // Inicializa rotação do knob
    const initialVolume = Number(elements.volume.value);
    elements.volumeKnob.style.transform = `rotate(${(initialVolume - 50) * CONFIG.VOLUME_ROTATION_FACTOR}deg)`;
  }

  // -----------------------------------------------------------------------------
  // Inicialização
  // -----------------------------------------------------------------------------
  
  /**
   * Inicializa a aplicação
   */
  function initApp() {
    // Verifica se catálogo carregou
    if (!cities.length) {
      showCatalogError();
      return;
    }
    
    // Carrega preferências salvas
    const prefs = loadPreferences();
    
    // Carrega dados das novas funcionalidades
    state.favorites = loadFavorites();
    const stats = loadStats();
    state.visitedCities = new Set(stats.visited || []);
    state.totalTravelTime = stats.totalTime || 0;
    incrementSession();
    loadTheme();
    
    // Restaura estado
    if (prefs.volume !== undefined) {
      elements.volume.value = prefs.volume;
      elements.volumeKnob.style.transform = `rotate(${(prefs.volume - 50) * CONFIG.VOLUME_ROTATION_FACTOR}deg)`;
      elements.volumeKnob.setAttribute("aria-valuenow", prefs.volume);
    }
    
    if (prefs.currentMode && Object.values(CONFIG.modes).includes(prefs.currentMode)) {
      state.currentMode = prefs.currentMode;
    }
    
    if (prefs.currentSpeed) {
      state.currentSpeed = prefs.currentSpeed;
      elements.speedButtons.forEach((btn) => {
        btn.classList.toggle("is-active", Number(btn.dataset.speed) === state.currentSpeed);
      });
    }
    
    if (prefs.streetSoundOn) {
      state.streetSoundOn = true;
      elements.streetSound.classList.add("is-active");
      elements.streetSound.setAttribute("aria-pressed", "true");
    }
    
    // Restaura estado do player (minimizado ou não)
    restorePlayerFromStorage();
    
    // Inicializa UI
    elements.cityTotal.textContent = pad(cities.length);
    renderRail();
    renderGrid();
    
    // Seleciona cidade da URL ou uma cidade aleatória ao abrir o site
    const cityFromURL = loadCityFromURL();
    const initialCity = cityFromURL !== null 
      ? cityFromURL 
      : Math.floor(Math.random() * cities.length);
    selectCity(initialCity, { silent: true });
    
    // Preview mode para QA
    const previewMode = new URLSearchParams(window.location.search).get("preview");
    if (previewMode === "drawer") openLayer(elements.drawer);
    
    // Salva estatísticas ao fechar a página
    window.addEventListener("beforeunload", saveStats);
    
    // Configura event listeners
    setupEventListeners();
  }

  /**
   * Exibe erro quando catálogo não carrega
   */
  function showCatalogError() {
    // UI amigável quando catálogo não carrega
    elements.app.innerHTML = `
      <section class="catalog-error" role="alert">
        <h1>Ops!</h1>
        <p>Could not load the city catalog. Check your connection and reload the page.</p>
        <button type="button" onclick="location.reload()">Try again</button>
      </section>
    `;
  }

  // -----------------------------------------------------------------------------
  // Event Listeners
  // -----------------------------------------------------------------------------
  
  /**
   * Configura todos os event listeners da aplicação
   */
  function setupEventListeners() {
    // Navegação de cidades
    $("#cities-button").addEventListener("click", () => {
      openLayer(elements.drawer);
      setTimeout(() => elements.search.focus(), 100);
    });
    
    $("#about-button").addEventListener("click", () => openLayer(elements.about));

    elements.mapButton.addEventListener("click", () => {
      openLayer(elements.mapModal);
      initializeWorldMap();
    });

    elements.closeMapButtons.forEach((button) => {
      button.addEventListener("click", () => closeLayer(elements.mapModal));
    });

    elements.mapContainer.addEventListener("click", (event) => {
      const playButton = event.target.closest("[data-map-play]");
      if (!playButton) return;

      event.preventDefault();
      playMapRide(Number(playButton.dataset.city), playButton.dataset.mode);
    });

    elements.mapDirectory.addEventListener("click", (event) => {
      const playButton = event.target.closest("[data-map-play]");
      if (playButton) {
        event.preventDefault();
        playMapRide(Number(playButton.dataset.city), playButton.dataset.mode);
        return;
      }

      const cityButton = event.target.closest("[data-map-city-select]");
      if (cityButton) {
        closeLayer(elements.mapModal);
        selectCity(Number(cityButton.dataset.mapCitySelect), { silent: true });
      }
    });
    
    elements.closeDrawerButtons.forEach((button) => {
      button.addEventListener("click", () => closeLayer(elements.drawer));
    });
    
    elements.closeAboutButtons.forEach((button) => {
      button.addEventListener("click", () => closeLayer(elements.about));
    });
    
    // Rail de navegação
    elements.rail.addEventListener("click", (event) => {
      const dot = event.target.closest("[data-city]");
      if (dot) selectCity(Number(dot.dataset.city));
    });
    
    // Busca
    elements.search.addEventListener("input", () => renderGrid(elements.search.value));
    
    // Navegação prev/next
    $("#previous-city").addEventListener("click", () => selectCity(state.cityIndex - 1));
    $("#next-city").addEventListener("click", () => selectCity(state.cityIndex + 1));
    
    // Navegação hint (botões ← →)
    $("#hint-prev").addEventListener("click", () => selectCity(state.cityIndex - 1));
    $("#hint-next").addEventListener("click", () => selectCity(state.cityIndex + 1));
    
    // Minimizar / Restaurar player
    elements.playerMinimize.addEventListener("click", () => togglePlayer(true));
    elements.playerRestore.addEventListener("click", () => togglePlayer(false));
    
    // Controles de rádio
    elements.play.addEventListener("click", toggleRadio);
    $("#radio-previous").addEventListener("click", () => setRadio(state.radioIndex - 1, true));
    $("#radio-next").addEventListener("click", () => setRadio(state.radioIndex + 1, true));
    
    // Modos de passeio
    elements.modeButtons.forEach((button) => {
      button.addEventListener("click", () => switchMode(button.dataset.mode));
    });
    
    // Volume (input hidden ainda funciona para acessibilidade)
    elements.volume.addEventListener("input", () => {
      const value = Number(elements.volume.value);
      elements.radio.volume = value / 100;
      elements.volumeKnob.style.transform = `rotate(${(value - 50) * CONFIG.VOLUME_ROTATION_FACTOR}deg)`;
      elements.volumeKnob.setAttribute("aria-valuenow", value);
      savePreferences({ volume: value });
    });
    
    // Som da rua
    elements.streetSound.addEventListener("click", () => {
      state.streetSoundOn = !state.streetSoundOn;
      elements.streetSound.classList.toggle("is-active", state.streetSoundOn);
      elements.streetSound.setAttribute("aria-pressed", String(state.streetSoundOn));
      videoCommand(state.streetSoundOn ? "unMute" : "mute");
      videoCommand("setVolume", [state.streetSoundOn ? CONFIG.STREET_SOUND_VOLUME : 0]);
      savePreferences({ streetSoundOn: state.streetSoundOn });
      showToast(state.streetSoundOn ? MESSAGES.streetSoundOn : MESSAGES.streetSoundOff);
    });
    
    // Velocidade
    elements.speedButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.currentSpeed = Number(button.dataset.speed);
        elements.speedButtons.forEach((item) => {
          item.classList.toggle("is-active", item === button);
        });
        videoCommand("setPlaybackRate", [state.currentSpeed]);
        savePreferences({ currentSpeed: state.currentSpeed });
        showToast(MESSAGES.rideSpeed(button.textContent));
      });
    });
    
    // Botão RDM - cidade aleatória
    elements.randomBtn.addEventListener("click", selectRandomCity);
    
    // Volume knob - controle por drag/scroll (com cleanup apropriado)
    setupVolumeKnobListeners();
    
    // Tela cheia
    $("#fullscreen-button").addEventListener("click", async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      } catch (error) {
        console.warn("[YouCity] Fullscreen unavailable:", error.message);
        showToast(MESSAGES.fullscreenUnavailable);
      }
    });
    
    // Eventos do player de vídeo
    elements.video.addEventListener("load", () => {
      setTimeout(() => elements.video.classList.add("is-ready"), 900);
    });
    
    // Radio errors share the same guarded retry scheduler as play() failures.
    elements.radio.addEventListener("error", () => {
      setPlayingState(false);
      scheduleRadioRetry();
    });
    
    // =========================================================================
    // NOVAS FUNCIONALIDADES - Event Listeners
    // =========================================================================
    
    // Favoritos
    elements.favoriteBtn.addEventListener("click", () => toggleFavorite());
    
    // Favoritos no grid (delegação)
    elements.grid.addEventListener("click", (event) => {
      const favBtn = event.target.closest("[data-favorite]");
      if (favBtn) {
        event.stopPropagation();
        toggleFavorite(Number(favBtn.dataset.favorite));
        return;
      }
      const card = event.target.closest("[data-city]");
      if (!card) return;
      selectCity(Number(card.dataset.city));
      closeLayer(elements.drawer);
    });
    
    // Filtros
    elements.filterButtons.forEach(btn => {
      btn.addEventListener("click", () => setFilter(btn.dataset.filter));
    });
    
    if (elements.filterContinent) {
      elements.filterContinent.addEventListener("change", (e) => setContinent(e.target.value));
    } else {
      console.warn("[YouCity] filter-continent element not found");
    }
    
    // Autoplay
    elements.autoplayBtn.addEventListener("click", toggleAutoplay);
    
    // Pomodoro
    elements.pomodoroBtn.addEventListener("click", togglePomodoro);
    
    // Tema
    elements.themeBtn.addEventListener("click", cycleTheme);
    
    // Qualidade
    elements.qualityBtn.addEventListener("click", cycleQuality);
    
    // PiP
    elements.pipBtn.addEventListener("click", togglePiP);
    
    // Compartilhar
    elements.shareBtn.addEventListener("click", shareCity);
    
    // Botões do leque de share
    elements.shareFanButtons.forEach(btn => {
      btn.addEventListener("click", () => shareToSocial(btn.dataset.share));
    });
    
    // Estatísticas
    elements.statsBtn.addEventListener("click", () => {
      updateStats();
      openLayer(elements.statsModal);
    });
    
    elements.closeStatsButtons.forEach(btn => {
      btn.addEventListener("click", () => closeLayer(elements.statsModal));
    });
    
    // Atalhos de teclado
    document.addEventListener("keydown", (event) => {
      // Ignora se estiver em input
      if (event.target.matches("input, textarea")) return;
      
      switch (event.key) {
        case "ArrowRight":
          selectCity(state.cityIndex + 1);
          break;
        case "ArrowLeft":
          selectCity(state.cityIndex - 1);
          break;
        case " ":
          event.preventDefault();
          toggleRadio();
          break;
        case "Escape":
          closeLayer(elements.drawer);
          closeLayer(elements.about);
          closeLayer(elements.mapModal);
          closeLayer(elements.statsModal);
          closeShareFan();
          break;
        case "m":
        case "M":
          openLayer(elements.mapModal);
          initializeWorldMap();
          break;
        case "r":
        case "R":
          selectRandomCity();
          break;
        case "h":
        case "H":
          togglePlayer();
          break;
        case "f":
        case "F":
          toggleFavorite();
          break;
        case "p":
        case "P":
          togglePiP();
          break;
        case "a":
        case "A":
          toggleAutoplay();
          break;
        case "t":
        case "T":
          cycleTheme();
          break;
      }
    });
    
    // Mensagens do iframe do YouTube (para detectar erros)
    window.addEventListener("message", (event) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        // Detecta erro de vídeo indisponível
        if (data.event === "onError" || (data.info && data.info.playerState === -1)) {
          handleVideoError();
        }
      } catch {
        // Ignora mensagens que não são JSON válido
      }
    });
    
    // Touch/Swipe gestures para mobile
    setupTouchGestures();
  }
  
  // -----------------------------------------------------------------------------
  // Touch Gestures para Mobile
  // -----------------------------------------------------------------------------
  
  /**
   * Configura gestos de toque para navegação mobile
   */
  function setupTouchGestures() {
    const touchState = {
      startX: 0,
      startY: 0,
      startTime: 0,
      isScrolling: null,
    };
    
    const SWIPE_THRESHOLD = 50; // pixels mínimos para considerar swipe
    const SWIPE_TIME_LIMIT = 300; // ms máximo para swipe
    const VELOCITY_THRESHOLD = 0.3; // pixels/ms
    
    // Área principal para swipe (exclui player e drawer)
    const swipeArea = elements.app;
    
    swipeArea.addEventListener("touchstart", (e) => {
      // Ignora se tocar em controles interativos
      if (e.target.closest(".player-card, .drawer, .about-modal, .map-modal, button, input, a")) {
        return;
      }
      
      const touch = e.touches[0];
      touchState.startX = touch.clientX;
      touchState.startY = touch.clientY;
      touchState.startTime = Date.now();
      touchState.isScrolling = null;
    }, { passive: true });
    
    swipeArea.addEventListener("touchmove", (e) => {
      if (touchState.startX === 0) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchState.startX;
      const deltaY = touch.clientY - touchState.startY;
      
      // Determina se é scroll vertical ou swipe horizontal
      if (touchState.isScrolling === null) {
        touchState.isScrolling = Math.abs(deltaY) > Math.abs(deltaX);
      }
    }, { passive: true });
    
    swipeArea.addEventListener("touchend", (e) => {
      if (touchState.startX === 0 || touchState.isScrolling) {
        touchState.startX = 0;
        return;
      }
      
      // Ignora se tocar em controles interativos
      if (e.target.closest(".player-card, .drawer, .about-modal, button, input, a")) {
        touchState.startX = 0;
        return;
      }
      
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchState.startX;
      const deltaTime = Date.now() - touchState.startTime;
      const velocity = Math.abs(deltaX) / deltaTime;
      
      // Verifica se é um swipe válido
      if (Math.abs(deltaX) >= SWIPE_THRESHOLD && 
          deltaTime <= SWIPE_TIME_LIMIT && 
          velocity >= VELOCITY_THRESHOLD) {
        
        // Swipe para esquerda = próxima cidade
        // Swipe para direita = cidade anterior
        if (deltaX < 0) {
          selectCity(state.cityIndex + 1);
        } else {
          selectCity(state.cityIndex - 1);
        }
      }
      
      touchState.startX = 0;
      touchState.isScrolling = null;
    }, { passive: true });
    
    // Double tap para play/pause rádio
    let lastTap = 0;
    swipeArea.addEventListener("touchend", (e) => {
      // Ignora se tocar em controles
      if (e.target.closest(".player-card, .drawer, .about-modal, button, input, a")) {
        return;
      }
      
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;
      
      if (now - lastTap < DOUBLE_TAP_DELAY) {
        toggleRadio();
        lastTap = 0;
      } else {
        lastTap = now;
      }
    }, { passive: true });
  }

  // -----------------------------------------------------------------------------
  // Inicializa a aplicação
  // -----------------------------------------------------------------------------
  initApp();

})();
