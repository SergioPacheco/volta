// =============================================================================
// VOLTA — app.js
// Experiência imersiva de passeios urbanos com rádio local
// =============================================================================

/**
 * IIFE para encapsular todo o código e evitar poluição do namespace global
 */
(function() {
  'use strict';

  // -----------------------------------------------------------------------------
  // Configuração centralizada (elimina magic numbers e strings hardcoded)
  // -----------------------------------------------------------------------------
  const CONFIG = {
    VIDEO_READY_DELAY: 1500,
    TOAST_DURATION: 2600,
    STREET_SOUND_VOLUME: 32,
    CLOCK_INTERVAL: 60_000,
    RADIO_RETRY_DELAY: 2000,
    RADIO_MAX_RETRIES: 2,
    DEFAULT_VOLUME: 64,
    AUTOPLAY_INTERVAL: 180_000, // 3 minutos
    POMODORO_DURATION: 25 * 60, // 25 minutos em segundos
    POMODORO_BREAK: 5 * 60, // 5 minutos de pausa
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
    },
  };

  // Mensagens centralizadas para facilitar i18n futura
  const MESSAGES = {
    nowIn: (cityName) => `Agora em ${cityName}`,
    autoplayOn: "Autoplay ativado — troca a cada 3 minutos",
    autoplayOff: "Autoplay desativado",
    pomodoroStart: "Pomodoro iniciado — 25 minutos de foco",
    pomodoroPause: "Pomodoro pausado",
    pomodoroBreakEnd: "☕ Pausa terminou! Hora de focar.",
    pomodoroComplete: "🎉 Pomodoro completo! Pausa de 5 minutos.",
    streetSoundOn: "Som da rua ativado",
    streetSoundOff: "Som da rua desativado",
    noRadio: "Esta cidade ainda não possui rádio disponível.",
    radioRetry: "Rádio não respondeu. Tentando próxima estação...",
    radioUnavailable: "Nenhuma rádio disponível no momento. Tente mais tarde.",
    noVideo: "Nenhum vídeo disponível para esta cidade.",
    videoFallback: "Vídeo indisponível. Carregando alternativa...",
    videoUnavailable: "Vídeo indisponível. Tente outra cidade.",
    fullscreenUnavailable: "Tela cheia não disponível neste navegador.",
    pipUnavailable: "PiP não disponível para vídeos do YouTube incorporados",
    pipError: "Erro ao ativar Picture-in-Picture",
    pipOff: "Picture-in-Picture desativado",
    linkCopied: "Link copiado para a área de transferência!",
    linkCopyFailed: "Não foi possível copiar o link",
    audioReset: "Efeitos de áudio resetados",
    favoriteAdded: (city) => `${city} adicionada aos favoritos ♥`,
    favoriteRemoved: (city) => `${city} removida dos favoritos`,
    randomDestination: (city) => `Destino aleatório: ${city}`,
    rideSpeed: (speed) => `Ritmo do passeio: ${speed}`,
    qualityAuto: "Qualidade: Automática",
    qualitySet: (quality) => `Qualidade: ${quality}p`,
    themeDefault: "Tema: Padrão",
    themeSepia: "Tema: Sépia",
    themeContrast: "Tema: Alto contraste",
    modeSwitch: (mode, city) => `${mode} em ${city}`,
  };

  // -----------------------------------------------------------------------------
  // Dados estáticos
  // -----------------------------------------------------------------------------
  const COUNTRY_INFO = {
    Argentina: ["Argentina", "América do Sul", "America/Argentina/Buenos_Aires"],
    Australia: ["Austrália", "Oceania", "Australia/Sydney"],
    Austria: ["Áustria", "Europa", "Europe/Vienna"],
    Brazil: ["Brasil", "América do Sul", "America/Sao_Paulo"],
    Bulgaria: ["Bulgária", "Europa", "Europe/Sofia"],
    Canada: ["Canadá", "América do Norte", "America/Toronto"],
    China: ["China", "Ásia", "Asia/Shanghai"],
    Cuba: ["Cuba", "Caribe", "America/Havana"],
    Czechia: ["Tchéquia", "Europa", "Europe/Prague"],
    "Dominican Republic": ["República Dominicana", "Caribe", "America/Santo_Domingo"],
    Egypt: ["Egito", "África", "Africa/Cairo"],
    England: ["Inglaterra", "Europa", "Europe/London"],
    France: ["França", "Europa", "Europe/Paris"],
    Germany: ["Alemanha", "Europa", "Europe/Berlin"],
    Greece: ["Grécia", "Europa", "Europe/Athens"],
    Guatemala: ["Guatemala", "América Central", "America/Guatemala"],
    Hungary: ["Hungria", "Europa", "Europe/Budapest"],
    India: ["Índia", "Ásia", "Asia/Kolkata"],
    Indonesia: ["Indonésia", "Ásia", "Asia/Jakarta"],
    Iran: ["Irã", "Ásia", "Asia/Tehran"],
    Ireland: ["Irlanda", "Europa", "Europe/Dublin"],
    Israel: ["Israel", "Ásia", "Asia/Jerusalem"],
    Italy: ["Itália", "Europa", "Europe/Rome"],
    Japan: ["Japão", "Ásia", "Asia/Tokyo"],
    Korea: ["Coreia do Sul", "Ásia", "Asia/Seoul"],
    Malaysia: ["Malásia", "Ásia", "Asia/Kuala_Lumpur"],
    Mexico: ["México", "América do Norte", "America/Mexico_City"],
    Monaco: ["Mônaco", "Europa", "Europe/Monaco"],
    Netherlands: ["Países Baixos", "Europa", "Europe/Amsterdam"],
    "New Zealand": ["Nova Zelândia", "Oceania", "Pacific/Auckland"],
    "Northern Ireland": ["Irlanda do Norte", "Europa", "Europe/London"],
    Norway: ["Noruega", "Europa", "Europe/Oslo"],
    Pakistan: ["Paquistão", "Ásia", "Asia/Karachi"],
    Philippines: ["Filipinas", "Ásia", "Asia/Manila"],
    Poland: ["Polônia", "Europa", "Europe/Warsaw"],
    Portugal: ["Portugal", "Europa", "Europe/Lisbon"],
    Qatar: ["Catar", "Ásia", "Asia/Qatar"],
    Russia: ["Rússia", "Europa/Ásia", "Europe/Moscow"],
    Senegal: ["Senegal", "África", "Africa/Dakar"],
    Singapore: ["Singapura", "Ásia", "Asia/Singapore"],
    Slovenia: ["Eslovênia", "Europa", "Europe/Ljubljana"],
    "South Africa": ["África do Sul", "África", "Africa/Johannesburg"],
    Spain: ["Espanha", "Europa", "Europe/Madrid"],
    Sweden: ["Suécia", "Europa", "Europe/Stockholm"],
    Switzerland: ["Suíça", "Europa", "Europe/Zurich"],
    Taiwan: ["Taiwan", "Ásia", "Asia/Taipei"],
    Turkey: ["Turquia", "Europa/Ásia", "Europe/Istanbul"],
    UAE: ["Emirados Árabes Unidos", "Ásia", "Asia/Dubai"],
    UK: ["Reino Unido", "Europa", "Europe/London"],
    USA: ["Estados Unidos", "América do Norte", "America/New_York"],
    Ukraine: ["Ucrânia", "Europa", "Europe/Kyiv"],
    Uruguay: ["Uruguai", "América do Sul", "America/Montevideo"],
    Uzbekistan: ["Uzbequistão", "Ásia", "Asia/Tashkent"]
  };

  const CITY_NAMES = {
    "Sao Paulo": "São Paulo", Tokyo: "Tóquio", "New York City": "Nova York",
    "Rio De Janeiro": "Rio de Janeiro", London: "Londres", Seoul: "Seul", Lisbon: "Lisboa",
    Rome: "Roma", Moscow: "Moscou", Munich: "Munique", Vienna: "Viena", Warsaw: "Varsóvia",
    Athens: "Atenas", Beijing: "Pequim", "Mexico City": "Cidade do México", Milan: "Milão",
    Cologne: "Colônia", Florence: "Florença", Brussels: "Bruxelas", Istanbul: "Istambul"
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
    "Sao Paulo": "Concreto, luz e o pulso contínuo da maior cidade do hemisfério sul.",
    Tokyo: "Neon, silêncio preciso e vias que atravessam uma cidade quase futurista.",
    Paris: "Boulevards de pedra, luz dourada e esquinas que pedem um caminho mais longo.",
    "New York City": "Faróis, pontes e o ruído elétrico de uma cidade sempre a caminho.",
    "Rio De Janeiro": "A cidade encontra o mar entre túneis, morros e uma luz que muda tudo.",
    London: "Chuva fina, tijolos antigos e o ritmo calmo das ruas à margem do Tâmisa.",
    Seoul: "A madrugada reflete no asfalto entre mercados, letreiros e avenidas largas.",
    Lisbon: "Subidas, azulejos e o Atlântico surgindo no fim de cada rua estreita."
  };

  const MODE_LABELS = { 
    [CONFIG.modes.DRIVE]: "Drive", 
    [CONFIG.modes.BIKE]: "Bike", 
    [CONFIG.modes.WALK]: "Walk" 
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
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
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
      console.warn("[VOLTA] Falha ao carregar preferências:", error.message);
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
      console.warn("[VOLTA] Falha ao salvar preferências (modo privado?):", error.message);
    }
  }

  // -----------------------------------------------------------------------------
  // Processamento do catálogo de cidades
  // -----------------------------------------------------------------------------
  const cities = (window.CITY_CATALOG || []).map((item) => {
    const [country, region, countryTimeZone] = COUNTRY_INFO[item.country] || [item.country, "Mundo", "UTC"];
    return {
      ...item,
      rawName: item.name,
      rawCountry: item.country,
      name: CITY_NAMES[item.name] || item.name,
      country,
      region,
      timeZone: CITY_TIME_ZONES[item.name] || countryTimeZone,
      note: CITY_NOTES[item.name] || `Ruas reais, rádio local e o ritmo de ${CITY_NAMES[item.name] || item.name} pela janela.`,
      radios: item.radios.map((radio) => ({ ...radio, mark: stationMark(radio.name) }))
    };
  });

  // -----------------------------------------------------------------------------
  // Seleção de elementos DOM (cacheados para performance)
  // -----------------------------------------------------------------------------
  const $ = (selector) => document.querySelector(selector);

  const elements = {
    app: $("#app"),
    video: $("#city-video"),
    poster: $("#poster"),
    radio: $("#radio-player"),
    welcome: $("#welcome"),
    start: $("#start-button"),
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
    streetSound: $("#street-sound"),
    randomBtn: $("#random-btn"),
    toast: $("#toast"),
    welcomeCityCount: $("#welcome-city-count"),
    playerCard: document.querySelector(".player-card"),
    playerMinimize: $("#player-minimize"),
    playerRestore: $("#player-restore"),
    // Novas funcionalidades
    favoriteBtn: $("#favorite-btn"),
    infoTimezone: $("#info-timezone"),
    infoPopulation: $("#info-population"),
    filterContinent: $("#filter-continent"),
    statsModal: $("#stats-modal"),
    audioModal: $("#audio-modal"),
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
    mixerBtn: $("#mixer-btn"),
    mixerReset: $("#mixer-reset"),
    // Áudios de efeitos
    fxRain: $("#fx-rain-audio"),
    fxWind: $("#fx-wind-audio"),
    fxCafe: $("#fx-cafe-audio"),
    fxBirds: $("#fx-birds-audio"),
    // Seletores cacheados para grupos de botões
    modeButtons: document.querySelectorAll("[data-mode]"),
    speedButtons: document.querySelectorAll("[data-speed]"),
    closeDrawerButtons: document.querySelectorAll("[data-close-drawer]"),
    closeAboutButtons: document.querySelectorAll("[data-close-about]"),
    closeStatsButtons: document.querySelectorAll("[data-close-stats]"),
    closeAudioButtons: document.querySelectorAll("[data-close-audio]"),
    shareFanButtons: document.querySelectorAll(".share-fan-item"),
    filterButtons: document.querySelectorAll("[data-filter]"),
    mixerSliders: document.querySelectorAll(".mixer-item input"),
  };

  // -----------------------------------------------------------------------------
  // Estado da aplicação (encapsulado dentro do IIFE)
  // -----------------------------------------------------------------------------
  const state = {
    cityIndex: 0,
    radioIndex: 0,
    radioPlaying: false,
    streetSoundOn: false,
    currentSpeed: 1,
    currentMode: CONFIG.modes.DRIVE,
    videoReadyTimer: null,
    toastTimer: null,
    radioRetryCount: 0,
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
      hl: "pt-BR",
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
    try {
      elements.topTime.textContent = new Intl.DateTimeFormat("pt-BR", {
        timeZone: currentCity().timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(new Date());
    } catch (error) {
      console.warn("[VOLTA] Falha ao atualizar relógio:", error.message);
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
  // Controles de modo (Drive/Bike/Walk)
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
        ? `${MODE_LABELS[mode]} em ${currentCity().name}`
        : "Modalidade indisponível nesta cidade";
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
  function setRadio(nextIndex = 0, shouldPlay = state.radioPlaying) {
    const radios = currentCity().radios;
    
    if (!radios.length) {
      elements.radio.removeAttribute("src");
      elements.stationName.innerHTML = "SEM SINAL<small> --</small>";
      elements.lcdMeta.textContent = "-- · NO SIGNAL";
      elements.play.disabled = true;
      elements.stereoLed.classList.remove("is-active");
      elements.rdsLed.classList.remove("is-active");
      setPlayingState(false);
      return;
    }
    
    elements.play.disabled = false;
    state.radioIndex = (nextIndex + radios.length) % radios.length;
    state.radioRetryCount = 0;
    
    const station = radios[state.radioIndex];
    elements.stationName.innerHTML = `${station.name}<small> FM</small>`;
    elements.lcdMeta.textContent = `CH-${String(state.radioIndex + 1).padStart(2, "0")} · ${currentCity().name.toUpperCase().slice(0, 12)}`;
    elements.stereoLed.classList.add("is-active");
    elements.rdsLed.classList.toggle("is-active", station.name.length > 10);
    
    elements.radio.src = station.url;
    elements.radio.volume = Number(elements.volume.value) / 100;
    
    if (shouldPlay) {
      playRadioWithRetry();
    } else {
      setPlayingState(false);
    }
  }

  /**
   * Tenta reproduzir rádio com retry automático
   */
  function playRadioWithRetry() {
    elements.radio.play()
      .then(() => {
        setPlayingState(true);
        state.radioRetryCount = 0;
      })
      .catch((error) => {
        console.warn("[VOLTA] Falha ao reproduzir rádio:", error.message);
        setPlayingState(false);
        
        // Auto-retry: tenta próxima estação automaticamente
        if (state.radioRetryCount < CONFIG.RADIO_MAX_RETRIES) {
          state.radioRetryCount++;
          showToast(MESSAGES.radioRetry);
          setTimeout(() => {
            setRadio(state.radioIndex + 1, true);
          }, CONFIG.RADIO_RETRY_DELAY);
        } else {
          showToast(MESSAGES.radioUnavailable);
          state.radioRetryCount = 0;
        }
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
    
    elements.play.setAttribute("aria-label", playing ? "Pausar rádio" : "Tocar rádio");
    elements.equalizer.classList.toggle("is-playing", playing);
  }

  /**
   * Alterna reprodução do rádio
   */
  function toggleRadio() {
    if (!currentCity().radios.length) {
      return showToast(MESSAGES.noRadio);
    }
    
    if (state.radioPlaying) {
      elements.radio.pause();
      setPlayingState(false);
    } else {
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
      console.warn("[VOLTA] Falha ao salvar estado do player:", error.message);
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
      console.warn("[VOLTA] Falha ao restaurar estado do player:", error.message);
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
      console.warn("[VOLTA] Falha ao carregar favoritos:", error.message);
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
      console.warn("[VOLTA] Falha ao salvar favoritos:", error.message);
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
    elements.favoriteBtn.setAttribute("aria-label", isFav ? "Remover dos favoritos" : "Adicionar aos favoritos");
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
      console.warn("[VOLTA] Falha ao carregar estatísticas:", error.message);
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
      console.warn("[VOLTA] Falha ao salvar estatísticas:", error.message);
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
      console.warn("[VOLTA] Falha ao incrementar sessão:", error.message);
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
    renderGrid();
  }

  /**
   * Define filtro de continente
   * @param {string} continent - Continente a filtrar
   */
  function setContinent(continent) {
    state.currentContinent = continent;
    renderGrid();
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
            document.querySelector(".pomodoro-label").textContent = "foco";
          } else {
            state.pomodoroRemaining = CONFIG.POMODORO_BREAK;
            state.pomodoroIsBreak = true;
            selectCity(state.cityIndex + 1);
            showToast(MESSAGES.pomodoroComplete);
            document.querySelector(".pomodoro-label").textContent = "pausa";
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
      console.warn("[VOLTA] Falha ao salvar tema:", error.message);
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
      console.warn("[VOLTA] Falha ao carregar tema:", error.message);
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
      console.warn("[VOLTA] Erro PiP:", error.message);
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
    const url = `${window.location.origin}${window.location.pathname}?city=${encodeURIComponent(city.city)}`;
    const text = `🌍 Viajando por ${city.name}, ${countryName} no VOLTA — experiência imersiva de passeios urbanos com rádio local`;
    const title = `VOLTA — ${city.name}`;
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
        console.warn("[VOLTA] Erro ao copiar link:", error.message);
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
          console.warn("[VOLTA] Erro ao compartilhar:", error.message);
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
      const cityName = params.get("city");
      
      // CORREÇÃO: Sanitiza entrada para prevenir XSS
      const sanitizedCityName = sanitizeInput(cityName);
      
      if (sanitizedCityName) {
        const index = cities.findIndex(c => 
          c.city.toLowerCase() === sanitizedCityName.toLowerCase()
        );
        if (index !== -1) return index;
      }
    } catch (error) {
      console.warn("[VOLTA] Erro ao carregar cidade da URL:", error.message);
    }
    return null;
  }

  // -----------------------------------------------------------------------------
  // Mixer de áudio
  // -----------------------------------------------------------------------------
  const audioEffects = {
    rain: { element: null, volume: 0 },
    wind: { element: null, volume: 0 },
    cafe: { element: null, volume: 0 },
    birds: { element: null, volume: 0 },
  };

  /**
   * Inicializa elementos de efeitos de áudio
   */
  function initAudioEffects() {
    audioEffects.rain.element = elements.fxRain;
    audioEffects.wind.element = elements.fxWind;
    audioEffects.cafe.element = elements.fxCafe;
    audioEffects.birds.element = elements.fxBirds;
  }

  /**
   * Define volume de um efeito de áudio
   * @param {string} effect - Nome do efeito
   * @param {number} volume - Volume (0-100)
   */
  function setAudioEffect(effect, volume) {
    const fx = audioEffects[effect];
    if (!fx || !fx.element) return;
    
    fx.volume = volume;
    fx.element.volume = volume / 100;
    
    if (volume > 0) {
      if (fx.element.paused) {
        fx.element.play().catch((error) => {
          console.warn(`[VOLTA] Erro ao reproduzir efeito ${effect}:`, error.message);
        });
      }
    } else {
      fx.element.pause();
    }
    
    // Atualiza o display
    const slider = $(`#fx-${effect}`);
    if (slider) {
      slider.value = volume;
      const valueDisplay = slider.nextElementSibling;
      if (valueDisplay) valueDisplay.textContent = `${volume}%`;
    }
  }

  /**
   * Reseta todos os efeitos de áudio
   */
  function resetAudioEffects() {
    Object.keys(audioEffects).forEach(effect => setAudioEffect(effect, 0));
    showToast(MESSAGES.audioReset);
  }

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
        const time = new Date().toLocaleTimeString("pt-BR", { 
          timeZone: info[2], 
          hour: "2-digit", 
          minute: "2-digit" 
        });
        elements.infoTimezone.querySelector("b").textContent = time;
      } catch (error) {
        console.warn("[VOLTA] Erro ao formatar hora:", error.message);
        elements.infoTimezone.querySelector("b").textContent = "--:--";
      }
    }
    
    // População (dados simulados baseados no tamanho da cidade)
    const populations = {
      "São Paulo": "12.3M", "Tokyo": "13.9M", "New York": "8.3M", "London": "8.9M",
      "Paris": "2.1M", "Berlin": "3.6M", "Sydney": "5.3M", "Mumbai": "12.4M",
      "Beijing": "21.5M", "Moscow": "11.9M", "Cairo": "9.5M", "Lagos": "14.3M",
    };
    const pop = populations[city.city] || `${Math.floor(Math.random() * 5 + 1)}.${Math.floor(Math.random() * 9)}M`;
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
              aria-label="Ir para ${cities[index].name}"></button>
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
    
    elements.resultCount.textContent = `${matches.length} ${matches.length === 1 ? "destino" : "destinos"}`;
    
    if (!matches.length) {
      elements.grid.innerHTML = `<p class="empty-state">Nenhuma cidade encontrada.</p>`;
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
          <span class="card-favorite${isFav ? " is-active" : ""}" role="button" tabindex="0" data-favorite="${index}" aria-label="${isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}">
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
    elements.topLocation.textContent = `${city.name}, ${city.country}`;
    document.title = `${city.name} — VOLTA`;
    
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
   * @param {string} mode - Modo (drive/bike/walk)
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
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
    const panel = layer.querySelector(".drawer-panel, .about-card");
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
    initAudioEffects();
    
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
    elements.welcomeCityCount.textContent = `${cities.length} cidades`;
    renderRail();
    renderGrid();
    
    // Seleciona cidade (da URL ou restaura ou inicial)
    const cityFromURL = loadCityFromURL();
    const initialCity = cityFromURL !== null 
      ? cityFromURL 
      : (prefs.cityIndex !== undefined && prefs.cityIndex < cities.length ? prefs.cityIndex : 0);
    selectCity(initialCity, { silent: true });
    
    // Preview mode para QA
    const previewMode = new URLSearchParams(window.location.search).get("preview");
    if (previewMode) elements.welcome.classList.add("is-hidden");
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
    elements.welcome.innerHTML = `
      <div class="welcome-shade"></div>
      <div class="welcome-copy" style="text-align: center; top: 50%; transform: translateY(-50%);">
        <h2 style="font-size: 48px; margin-bottom: 20px;">Ops!</h2>
        <p style="max-width: 400px; margin: 0 auto;">
          Não foi possível carregar o catálogo de cidades. 
          Verifique sua conexão e recarregue a página.
        </p>
        <button onclick="location.reload()" style="
          margin-top: 30px;
          padding: 14px 28px;
          background: var(--acid);
          color: var(--ink);
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
        ">Tentar novamente</button>
      </div>
    `;
  }

  // -----------------------------------------------------------------------------
  // Event Listeners
  // -----------------------------------------------------------------------------
  
  /**
   * Configura todos os event listeners da aplicação
   */
  function setupEventListeners() {
    // Botão iniciar
    elements.start.addEventListener("click", () => {
      elements.welcome.classList.add("is-hidden");
      elements.radio.play()
        .then(() => setPlayingState(true))
        .catch((error) => {
          console.warn("[VOLTA] Autoplay bloqueado:", error.message);
          setPlayingState(false);
        });
      videoCommand("playVideo");
    });
    
    // Navegação de cidades
    $("#cities-button").addEventListener("click", () => {
      openLayer(elements.drawer);
      setTimeout(() => elements.search.focus(), 100);
    });
    
    $("#about-button").addEventListener("click", () => openLayer(elements.about));
    
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
        console.warn("[VOLTA] Fullscreen não disponível:", error.message);
        showToast(MESSAGES.fullscreenUnavailable);
      }
    });
    
    // Eventos do player de vídeo
    elements.video.addEventListener("load", () => {
      setTimeout(() => elements.video.classList.add("is-ready"), 900);
    });
    
    // Erro na rádio
    elements.radio.addEventListener("error", () => {
      if (state.radioPlaying) {
        // Tenta auto-retry
        if (state.radioRetryCount < CONFIG.RADIO_MAX_RETRIES) {
          state.radioRetryCount++;
          setTimeout(() => setRadio(state.radioIndex + 1, true), CONFIG.RADIO_RETRY_DELAY);
        } else {
          setPlayingState(false);
          state.radioRetryCount = 0;
        }
      }
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
    
    elements.filterContinent.addEventListener("change", (e) => setContinent(e.target.value));
    
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
    
    // Mixer de áudio
    elements.mixerBtn.addEventListener("click", () => openLayer(elements.audioModal));
    
    elements.closeAudioButtons.forEach(btn => {
      btn.addEventListener("click", () => closeLayer(elements.audioModal));
    });
    
    elements.mixerSliders.forEach(slider => {
      slider.addEventListener("input", (e) => {
        const effect = e.target.id.replace("fx-", "");
        setAudioEffect(effect, Number(e.target.value));
      });
    });
    
    elements.mixerReset.addEventListener("click", resetAudioEffects);
    
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
          if (elements.welcome.classList.contains("is-hidden")) {
            event.preventDefault();
            toggleRadio();
          }
          break;
        case "Escape":
          closeLayer(elements.drawer);
          closeLayer(elements.about);
          closeLayer(elements.statsModal);
          closeLayer(elements.audioModal);
          closeShareFan();
          break;
        case "r":
        case "R":
          if (elements.welcome.classList.contains("is-hidden")) {
            selectRandomCity();
          }
          break;
        case "h":
        case "H":
          if (elements.welcome.classList.contains("is-hidden")) {
            togglePlayer();
          }
          break;
        case "f":
        case "F":
          if (elements.welcome.classList.contains("is-hidden")) {
            toggleFavorite();
          }
          break;
        case "p":
        case "P":
          if (elements.welcome.classList.contains("is-hidden")) {
            togglePiP();
          }
          break;
        case "a":
        case "A":
          if (elements.welcome.classList.contains("is-hidden")) {
            toggleAutoplay();
          }
          break;
        case "t":
        case "T":
          if (elements.welcome.classList.contains("is-hidden")) {
            cycleTheme();
          }
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
      if (e.target.closest(".player-card, .drawer, .about-modal, button, input, a")) {
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
