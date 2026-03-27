"use strict";

(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const actionButton = document.getElementById("actionButton");
  const shareLink = document.getElementById("shareLink");
  const scoreValue = document.getElementById("scoreValue");
  const speedValue = document.getElementById("speedValue");
  const levelValue = document.getElementById("levelValue");
  const destinationValue = document.getElementById("destinationValue");
  const nextLevelValue = document.getElementById("nextLevelValue");
  const helpButton = document.getElementById("helpButton");
  const notesDialog = document.getElementById("notesDialog");
  const notesIntro = document.getElementById("notesIntro");
  const notesScrollRegion = document.getElementById("notesScrollRegion");
  const notesCloseButton = document.getElementById("notesCloseButton");
  const characterSelect = document.getElementById("characterSelect");
  const characterDetails = document.getElementById("characterDetails");
  const startLevelSelect = document.getElementById("startLevelSelect");
  const startLevelDetails = document.getElementById("startLevelDetails");
  const titleEl = overlay.querySelector(".title");
  const subtitleEl = overlay.querySelector(".subtitle");

  const config = {
    gravity: 1820,
    jumpVelocity: 900,
    startSpeed: 220,
    maxSpeed: 560,
    speedGainPerCollectibleBase: 10,
    speedGainPerCollectibleScale: 9,
    runnerScreenRatio: 0.2,
    wallWidth: 64,
    wallHeight: 98,
    wallGapMin: 180,
    wallGapMax: 420,
    collectibleW: 50,
    collectibleH: 73,
    collectibleXOffset: 18,
    collectibleLiftMin: 118,
    collectibleLiftMax: 144,
    collectiblePickupPadding: 24,
    bonusSpawnChance: 0.2,
    slideTriggerScore: 14,
    slideMinSpeed: 250,
    slideHeight: 54,
    deckWalkableRatio: 0.38,
    deckMinTileHeight: 210,
    rescueChance: 0.38,
    rescueDoctorHeight: 124,
    rescueDoctorSpeed: 520,
    rescueReviveHold: 0.55,
    rescuePostInvulnerability: 1.4,
    levelAnnouncementDuration: 2.35
  };
  const imagePath = (fileName) => `assets/images/${fileName}`;
  const levelBackgroundSources = [
    imagePath("level-1-existing-cruise.svg"),
    imagePath("level-2-island-adventure.svg"),
    imagePath("level-3-bahamas.svg"),
    imagePath("level-4-cruise-deck.svg"),
    imagePath("level-5-miami.svg")
  ];

  const assets = {
    slide: new Image(),
    deck: new Image(),
    umbrella: new Image(),
    casinoBackground: new Image(),
    slotMachine: new Image(),
    rescueDoctor: new Image(),
    beachBackground: new Image(),
    beachGround: new Image(),
    bahamasGround: new Image(),
    miamiBackground: new Image(),
    miamiGround: new Image(),
    levelBackgrounds: levelBackgroundSources.map(() => new Image()),
    slideReady: false,
    deckReady: false,
    umbrellaReady: false,
    casinoBackgroundReady: false,
    slotMachineReady: false,
    rescueDoctorReady: false,
    beachBackgroundReady: false,
    beachGroundReady: false,
    bahamasGroundReady: false,
    miamiBackgroundReady: false,
    miamiGroundReady: false,
    levelBackgroundsReady: levelBackgroundSources.map(() => false)
  };

  const levels = [
    {
      id: 1,
      name: "Existing Cruise Deck",
      nextScore: 8,
      difficulty: 0.08,
      theme: {
        skyTop: "#96dfff",
        skyMid: "#d3f2ff",
        skyBottom: "#f8efcb",
        layerFar: "#cfe6bf",
        layerNear: "#a9d095",
        ground: "#e7d5a6",
        stripe: "rgba(196, 154, 80, 0.35)"
      }
    },
    {
      id: 2,
      name: "Island Adventure with Adults-Only Pool",
      nextScore: 18,
      difficulty: 0.24,
      theme: {
        skyTop: "#63ddd8",
        skyMid: "#bff7ec",
        skyBottom: "#fef0be",
        layerFar: "#9dd9b4",
        layerNear: "#77bc97",
        ground: "#dcc497",
        stripe: "rgba(111, 164, 123, 0.34)"
      }
    },
    {
      id: 3,
      name: "Bahamas",
      nextScore: 31,
      difficulty: 0.42,
      theme: {
        skyTop: "#45b8f4",
        skyMid: "#99e1ff",
        skyBottom: "#ffe5b1",
        layerFar: "#8fd5c3",
        layerNear: "#5eb9a7",
        ground: "#d6b884",
        stripe: "rgba(119, 138, 93, 0.32)"
      }
    },
    {
      id: 4,
      name: "Cruise Deck",
      nextScore: 46,
      difficulty: 0.6,
      theme: {
        skyTop: "#ffb16d",
        skyMid: "#ffd5a8",
        skyBottom: "#fde4c4",
        layerFar: "#d6be8e",
        layerNear: "#ba9c6d",
        ground: "#c89d64",
        stripe: "rgba(150, 101, 58, 0.34)"
      }
    },
    {
      id: 5,
      name: "Miami",
      nextScore: null,
      difficulty: 0.78,
      theme: {
        skyTop: "#ff7e73",
        skyMid: "#ffb29f",
        skyBottom: "#ffd5c8",
        layerFar: "#d89bcf",
        layerNear: "#a977c4",
        ground: "#ca9b79",
        stripe: "rgba(122, 74, 121, 0.35)"
      }
    }
  ];

  const characterPresets = {
    bryan: {
      name: "Bryan",
      collectibleName: "Pill",
      details: "Balanced speed and control. Uses existing Bryan + pill art.",
      runnerIdleSrc: imagePath("bryan.png"),
      runnerStepSrc: imagePath("bryan2.png"),
      runnerJumpSrc: imagePath("bryan-jump.png"),
      collectibleSrc: imagePath("drink.png"),
      runnerScale: 1,
      speedGainMultiplier: 1,
      jumpVelocityMultiplier: 1,
      fallbackColor: "#f26a4b",
      collectibleGlyph: "💊",
      collectibleColor: "#ffd95e"
    },
    barbra: {
      name: "Barbra",
      collectibleName: "Morning Beer",
      details: "Extra zip after pickups, with a slightly lower jump arc.",
      runnerIdleSrc: imagePath("barbra.png"),
      runnerStepSrc: imagePath("barbra2.png"),
      runnerJumpSrc: imagePath("babra-jump.png"),
      runnerJumpFallbackSrc: imagePath("barbra-jump.png"),
      collectibleSrc: imagePath("morning-beer.png"),
      runnerScale: 1.5,
      speedGainMultiplier: 1.08,
      jumpVelocityMultiplier: 0.96,
      fallbackColor: "#f48cb4",
      collectibleGlyph: "🍺",
      collectibleColor: "#ffc857"
    },
    kyle: {
      name: "Kyle",
      collectibleName: "Champagne",
      details: "Higher jumps and smoother landings with moderate acceleration.",
      runnerIdleSrc: imagePath("kyle.png"),
      runnerStepSrc: imagePath("kyle2.png"),
      runnerJumpSrc: imagePath("kyle-jump.png"),
      collectibleSrc: imagePath("champagne.png"),
      runnerScale: 1.5,
      speedGainMultiplier: 0.94,
      jumpVelocityMultiplier: 1.05,
      fallbackColor: "#7da2ff",
      collectibleGlyph: "🍾",
      collectibleColor: "#cde88f"
    }
  };

  const availableCharacters = new Set(Object.keys(characterPresets));

  function isValidCharacter(value) {
    return availableCharacters.has(value);
  }

  function getCharacterFromUrl() {
    const selected = new URL(window.location.href).searchParams.get("character");
    if (!selected) {
      return null;
    }
    const normalized = selected.toLowerCase();
    return isValidCharacter(normalized) ? normalized : null;
  }

  const characterAssets = {};
  let currentCharacter = getCharacterFromUrl() || "bryan";
  const releaseState = {
    storageKey: "bbcd:lastSeenVersion",
    currentVersion: "1.8.0",
    notes: [
      {
        version: "1.2.0",
        date: "2026-03-22",
        title: "Casino bonus event",
        bullets: [
          "Added bonus coin pickups with a one-pull slot machine reward.",
          "Winnings now grant extra points and a burst of speed.",
          "Created smoother transitions between running and bonus moments."
        ]
      },
      {
        version: "1.3.0",
        date: "2026-03-25",
        title: "Character roster expansion",
        bullets: [
          "Added Barbra and Kyle as playable runners with unique movement tuning.",
          "Updated character picker details so each style is easier to understand.",
          "Improved collectible rendering with character-specific artwork fallbacks."
        ]
      },
      {
        version: "1.4.0",
        date: "2026-03-27",
        title: "What’s New + help release notes",
        bullets: [
          "Added an accessible What’s New prompt that appears when your saved version is older.",
          "Stored the latest seen version in local storage to avoid repeat prompts.",
          "Added a Help & Notes menu option with a scrollable release notes view."
        ]
      },
      {
        version: "1.5.0",
        date: "2026-03-27",
        title: "Casino polish + asset organization",
        bullets: [
          "Reorganized the project for easier maintenance with code in src/ and art in assets/images/.",
          "Updated casino bonus visuals to use casino.png as the background and slot-machine.png in the foreground with aspect-ratio-safe scaling.",
          "Adjusted character presentation so Barbra and Kyle render larger than Bryan during runs.",
          "Added per-character jump sprites (bryan-jump, babra/barbra-jump fallback, and kyle-jump).",
          "Removed the runner shadow while airborne and hid the character during casino mode."
        ]
      },
      {
        version: "1.6.0",
        date: "2026-03-27",
        title: "Rescue mode + share-image fixes",
        bullets: [
          "Added rescue mode: when you crash, there is now a random chance Dr M enters from right to left and revives your run.",
          "After revive, your run resumes from the crash moment with score and speed preserved, plus a short invulnerability window.",
          "Updated share behavior so Web Share uses the selected runner image instead of always defaulting to Bryan.",
          "Share links now include the selected runner so shared URLs reopen with the right character."
        ]
      },
      {
        version: "1.7.0",
        date: "2026-03-27",
        title: "Destination leveling system",
        bullets: [
          "Added five unlockable destinations with score milestones: Existing Cruise Deck, Island Adventure with Adults-Only Pool, Bahamas, Cruise Deck, and Miami.",
          "Added HUD tracking for current level, destination, and exact points needed for the next level.",
          "Adjusted difficulty to scale by level progression so each destination remains obtainable while still feeling faster and tougher over time."
        ]
      },
      {
        version: "1.8.0",
        date: "2026-03-27",
        title: "Persistent level unlocks + start level select",
        bullets: [
          "Unlocked levels are now saved in local storage, so progression persists across sessions.",
          "Added a start-level picker on the start screen that lets you begin from any unlocked level.",
          "Starting from an unlocked level now seeds score to that level threshold while keeping core run speed behavior unchanged."
        ]
      }
    ],
    isOpen: false,
    triggerEl: null
  };
  const progressionState = {
    storageKey: "bbcd:maxUnlockedLevel",
    maxUnlockedLevel: 1,
    selectedStartLevel: 1
  };
  const shareMeta = {
    ogImage: document.querySelector('meta[property="og:image"]'),
    ogImageAlt: document.querySelector('meta[property="og:image:alt"]'),
    ogImageWidth: document.querySelector('meta[property="og:image:width"]'),
    ogImageHeight: document.querySelector('meta[property="og:image:height"]'),
    twitterImage: document.querySelector('meta[name="twitter:image"]')
  };

  function loadImageWithReadyFlag(src, fallbackSrc = null) {
    const image = new Image();
    const record = {
      image,
      ready: false
    };
    let usedFallback = false;
    image.onload = () => {
      record.ready = true;
      if (characterAssets[currentCharacter]?.idle.image === image) {
        updateShareImageMeta();
      }
    };
    image.onerror = () => {
      if (fallbackSrc && !usedFallback) {
        usedFallback = true;
        image.src = fallbackSrc;
      }
    };
    image.src = src;
    return record;
  }

  for (const [key, preset] of Object.entries(characterPresets)) {
    characterAssets[key] = {
      idle: loadImageWithReadyFlag(preset.runnerIdleSrc),
      step: loadImageWithReadyFlag(preset.runnerStepSrc),
      jump: loadImageWithReadyFlag(preset.runnerJumpSrc, preset.runnerJumpFallbackSrc),
      collectible: loadImageWithReadyFlag(preset.collectibleSrc)
    };
  }

  assets.slide.src = imagePath("slide.png");
  assets.deck.src = imagePath("deck.png");
  assets.umbrella.src = imagePath("umbrella.png");
  assets.casinoBackground.src = imagePath("casino.png");
  assets.slotMachine.src = imagePath("slot-machine.png");
  assets.rescueDoctor.src = imagePath("dr-m.png");
  assets.beachBackground.src = imagePath("beach-background.png");
  assets.beachGround.src = imagePath("beach.png");
  assets.bahamasGround.src = imagePath("bahamas.png");
  assets.miamiBackground.src = imagePath("miami-background.png");
  assets.miamiGround.src = imagePath("miami.png");
  assets.slide.onload = () => {
    assets.slideReady = true;
  };
  assets.deck.onload = () => {
    assets.deckReady = true;
  };
  assets.umbrella.onload = () => {
    assets.umbrellaReady = true;
  };
  assets.casinoBackground.onload = () => {
    assets.casinoBackgroundReady = true;
  };
  assets.slotMachine.onload = () => {
    assets.slotMachineReady = true;
  };
  assets.rescueDoctor.onload = () => {
    assets.rescueDoctorReady = true;
  };
  assets.beachBackground.onload = () => {
    assets.beachBackgroundReady = true;
  };
  assets.beachGround.onload = () => {
    assets.beachGroundReady = true;
  };
  assets.bahamasGround.onload = () => {
    assets.bahamasGroundReady = true;
  };
  assets.miamiBackground.onload = () => {
    assets.miamiBackgroundReady = true;
  };
  assets.miamiGround.onload = () => {
    assets.miamiGroundReady = true;
  };
  levelBackgroundSources.forEach((source, index) => {
    assets.levelBackgrounds[index].onload = () => {
      assets.levelBackgroundsReady[index] = true;
    };
    assets.levelBackgrounds[index].src = source;
  });

  const world = {
    mode: "ready",
    width: 0,
    height: 0,
    groundY: 0,
    cameraX: 0,
    speed: config.startSpeed,
    score: 0,
    levelIndex: 0,
    pendingLevelRestart: false,
    lastTime: 0,
    elapsed: 0,
    levelElapsed: 0,
    levelAnnouncement: {
      text: "",
      timer: 0
    },
    walls: [],
    collectibles: [],
    nextSpawnX: 0,
    slide: {
      active: false,
      hasSpawned: false,
      x: 0,
      y: 0,
      width: 0,
      height: 0
    },
    rescue: {
      active: false,
      stage: "idle",
      doctorX: 0,
      doctorY: 0,
      doctorWidth: 0,
      doctorHeight: 0,
      targetX: 0,
      holdTimer: 0
    },
    casino: {
      pendingPull: false,
      pendingResume: false,
      levelRestartQueued: false
    },
    invulnerableTime: 0
  };

  const runner = {
    width: 52,
    height: 64,
    y: 0,
    vy: 0,
    onGround: true,
    coyoteTime: 0,
    jumpBuffer: 0,
    tilt: 0
  };

  function getActivePreset() {
    return characterPresets[currentCharacter] || characterPresets.bryan;
  }

  function getActiveAssets() {
    return characterAssets[currentCharacter] || characterAssets.bryan;
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function getCurrentLevel() {
    return levels[Math.max(0, Math.min(levels.length - 1, world.levelIndex))];
  }

  function normalizeLevelId(value, fallback = 1) {
    const parsed = Number.parseInt(String(value), 10);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.max(1, Math.min(levels.length, parsed));
  }

  function readMaxUnlockedLevel() {
    try {
      return normalizeLevelId(
        window.localStorage.getItem(progressionState.storageKey),
        1
      );
    } catch (_) {
      return 1;
    }
  }

  function saveMaxUnlockedLevel(levelId) {
    try {
      window.localStorage.setItem(
        progressionState.storageKey,
        String(normalizeLevelId(levelId, progressionState.maxUnlockedLevel))
      );
    } catch (_) {
      // Local storage may be blocked; continue without persistence.
    }
  }

  function getSelectedStartLevelId() {
    return normalizeLevelId(startLevelSelect?.value || progressionState.selectedStartLevel, 1);
  }

  function updateStartLevelDetails() {
    const levelId = getSelectedStartLevelId();
    const levelIndex = levelId - 1;
    const level = levels[levelIndex];
    const threshold = getLevelStartScore(levelIndex);
    const intro = threshold > 0 ? `Starts at ${threshold} score.` : "Starts fresh at score 0.";
    startLevelDetails.textContent = `${level.name}. ${intro}`;
  }

  function refreshStartLevelOptions() {
    const maxUnlocked = normalizeLevelId(progressionState.maxUnlockedLevel, 1);
    const selected = Math.min(
      normalizeLevelId(progressionState.selectedStartLevel, 1),
      maxUnlocked
    );

    startLevelSelect.innerHTML = "";
    for (let levelId = 1; levelId <= maxUnlocked; levelId += 1) {
      const option = document.createElement("option");
      option.value = String(levelId);
      option.textContent = `Level ${levelId} - ${levels[levelId - 1].name}`;
      startLevelSelect.appendChild(option);
    }

    progressionState.selectedStartLevel = selected;
    startLevelSelect.value = String(selected);
    updateStartLevelDetails();
  }

  function unlockLevel(levelId) {
    const safeLevelId = normalizeLevelId(levelId, 1);
    if (safeLevelId <= progressionState.maxUnlockedLevel) {
      return;
    }
    progressionState.maxUnlockedLevel = safeLevelId;
    saveMaxUnlockedLevel(safeLevelId);
    refreshStartLevelOptions();
  }

  function hydrateProgressionState() {
    progressionState.maxUnlockedLevel = readMaxUnlockedLevel();
    progressionState.selectedStartLevel = progressionState.maxUnlockedLevel;
    refreshStartLevelOptions();
  }

  function getCurrentTheme() {
    return getCurrentLevel().theme || levels[0].theme;
  }

  function isParallaxTextureLevel() {
    return world.levelIndex === 1 || world.levelIndex === 2 || world.levelIndex === 4;
  }

  function getParallaxBackgroundTexture() {
    if ((world.levelIndex === 1 || world.levelIndex === 2) && assets.beachBackgroundReady) {
      return assets.beachBackground;
    }
    if (world.levelIndex === 4 && assets.miamiBackgroundReady) {
      return assets.miamiBackground;
    }
    return null;
  }

  function getParallaxBackgroundSpeed() {
    if (world.levelIndex === 4) {
      return 0.14;
    }
    return 0.2;
  }

  function getParallaxGroundTexture() {
    if (world.levelIndex === 1 && assets.beachGroundReady) {
      return assets.beachGround;
    }
    if (world.levelIndex === 2 && assets.bahamasGroundReady) {
      return assets.bahamasGround;
    }
    if (world.levelIndex === 4 && assets.miamiGroundReady) {
      return assets.miamiGround;
    }
    return null;
  }

  function isSlideObstacleLevel() {
    return world.levelIndex === 1;
  }

  function getLevelStartScore(index = world.levelIndex) {
    if (index <= 0) {
      return 0;
    }
    const previousTarget = levels[index - 1].nextScore;
    return Number.isFinite(previousTarget) ? previousTarget : 0;
  }

  function getCurrentLevelProgress() {
    const level = getCurrentLevel();
    const levelStart = getLevelStartScore();
    if (!Number.isFinite(level.nextScore)) {
      return Math.min(1, Math.max(0, (world.score - levelStart) / 18));
    }
    const span = Math.max(1, level.nextScore - levelStart);
    return Math.max(0, Math.min(1, (world.score - levelStart) / span));
  }

  function announceLevelUp(level) {
    world.levelAnnouncement.text = `Level ${level.id}: ${level.name}`;
    world.levelAnnouncement.timer = config.levelAnnouncementDuration;
  }

  function restartStageForCurrentLevel() {
    world.cameraX = 0;
    world.walls.length = 0;
    world.collectibles.length = 0;
    world.nextSpawnX = world.width * 0.9;
    world.slide.active = false;
    world.slide.hasSpawned = false;
    world.slide.x = 0;
    world.slide.y = 0;
    world.slide.width = 0;
    world.slide.height = 0;
    world.rescue.active = false;
    world.rescue.stage = "idle";
    world.rescue.doctorX = 0;
    world.rescue.doctorY = 0;
    world.rescue.doctorWidth = 0;
    world.rescue.doctorHeight = 0;
    world.rescue.targetX = 0;
    world.rescue.holdTimer = 0;
    world.pendingLevelRestart = false;
    world.casino.levelRestartQueued = false;
    world.invulnerableTime = Math.max(world.invulnerableTime, 0.9);
    world.levelElapsed = 0;

    runner.y = world.groundY - runner.height;
    runner.vy = 0;
    runner.onGround = true;
    runner.coyoteTime = 0.1;
    runner.jumpBuffer = 0;
    runner.tilt = 0;

    ensureGenerated();
  }

  function applyStartingLevel(levelId) {
    const normalizedId = normalizeLevelId(levelId, 1);
    const startingIndex = normalizedId - 1;
    world.levelIndex = startingIndex;
    world.score = getLevelStartScore(startingIndex);
    restartStageForCurrentLevel();
    world.invulnerableTime = 0;
    world.levelAnnouncement.text = "";
    world.levelAnnouncement.timer = 0;
    updateLevelProgression({ announce: false });
    updateHud();
  }

  function updateLevelProgression(options = {}) {
    const { announce = true } = options;
    const previousLevelIndex = world.levelIndex;
    const nextTarget = levels[world.levelIndex]?.nextScore;
    if (
      world.levelIndex < levels.length - 1 &&
      Number.isFinite(nextTarget) &&
      world.score >= nextTarget
    ) {
      world.levelIndex += 1;
      unlockLevel(world.levelIndex + 1);
    }
    if (announce && world.levelIndex > previousLevelIndex) {
      announceLevelUp(getCurrentLevel());
      world.invulnerableTime = Math.max(world.invulnerableTime, 0.7);
      world.levelElapsed = 0;
      if (world.mode === "casino") {
        world.casino.levelRestartQueued = true;
      } else {
        world.pendingLevelRestart = true;
      }
    }
  }

  function parseVersion(version) {
    const parts = String(version || "")
      .split(".")
      .map((part) => Number.parseInt(part, 10));
    if (parts.length !== 3 || parts.some((part) => Number.isNaN(part) || part < 0)) {
      return null;
    }
    return parts;
  }

  function compareVersions(a, b) {
    const parsedA = parseVersion(a);
    const parsedB = parseVersion(b);
    if (!parsedA || !parsedB) {
      return 0;
    }
    for (let i = 0; i < 3; i += 1) {
      if (parsedA[i] > parsedB[i]) {
        return 1;
      }
      if (parsedA[i] < parsedB[i]) {
        return -1;
      }
    }
    return 0;
  }

  function readLastSeenVersion() {
    try {
      return window.localStorage.getItem(releaseState.storageKey);
    } catch (_) {
      return null;
    }
  }

  function saveCurrentVersion() {
    try {
      window.localStorage.setItem(releaseState.storageKey, releaseState.currentVersion);
    } catch (_) {
      // Local storage may be blocked; silently continue without persistence.
    }
  }

  function getNotesSince(version) {
    if (!version) {
      return [...releaseState.notes];
    }
    return releaseState.notes.filter(
      (note) =>
        compareVersions(note.version, version) > 0 &&
        compareVersions(note.version, releaseState.currentVersion) <= 0
    );
  }

  function renderNotesList(notes) {
    notesScrollRegion.innerHTML = "";
    const fragment = document.createDocumentFragment();
    notes.forEach((note) => {
      const section = document.createElement("section");
      section.className = "notes-version";

      const heading = document.createElement("h3");
      heading.textContent = `v${note.version} — ${note.title}`;
      section.appendChild(heading);

      const date = document.createElement("p");
      date.textContent = `Released: ${note.date}`;
      section.appendChild(date);

      const list = document.createElement("ul");
      note.bullets.forEach((bullet) => {
        const item = document.createElement("li");
        item.textContent = bullet;
        list.appendChild(item);
      });
      section.appendChild(list);
      fragment.appendChild(section);
    });
    notesScrollRegion.appendChild(fragment);
  }

  function openReleaseNotes(options = {}) {
    const { notes = [], introText = "", triggerEl = null, markSeen = false } = options;
    const safeNotes = notes.length ? notes : [...releaseState.notes];
    notesIntro.textContent = introText || "Latest improvements and changes.";
    renderNotesList(safeNotes);
    notesDialog.classList.remove("hidden");
    releaseState.isOpen = true;
    releaseState.triggerEl = triggerEl;
    notesCloseButton.focus();
    if (markSeen) {
      saveCurrentVersion();
    }
  }

  function closeReleaseNotes() {
    if (!releaseState.isOpen) {
      return;
    }
    notesDialog.classList.add("hidden");
    releaseState.isOpen = false;
    if (releaseState.triggerEl) {
      releaseState.triggerEl.focus();
    }
    releaseState.triggerEl = null;
  }

  function maybeShowWhatsNew() {
    const lastSeenVersion = readLastSeenVersion();
    if (lastSeenVersion && compareVersions(lastSeenVersion, releaseState.currentVersion) >= 0) {
      return;
    }
    const unseenNotes = getNotesSince(lastSeenVersion);
    const hasSavedVersion = Boolean(lastSeenVersion);
    const introText = hasSavedVersion && unseenNotes.length
      ? `You are now on v${releaseState.currentVersion}. Here is what changed since v${lastSeenVersion}.`
      : "Welcome! Here are the full release notes.";
    openReleaseNotes({
      notes: unseenNotes.length ? unseenNotes : [...releaseState.notes],
      introText,
      triggerEl: helpButton,
      markSeen: true
    });
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    world.width = Math.max(320, rect.width);
    world.height = Math.max(420, rect.height);
    world.groundY = world.height * 0.8;

    canvas.width = Math.floor(world.width * dpr);
    canvas.height = Math.floor(world.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (world.mode !== "running") {
      runner.y = world.groundY - runner.height;
    }
  }

  function resetWorld() {
    world.cameraX = 0;
    world.speed = config.startSpeed;
    world.score = 0;
    world.levelIndex = 0;
    world.pendingLevelRestart = false;
    world.elapsed = 0;
    world.levelElapsed = 0;
    world.lastTime = 0;
    world.levelAnnouncement.text = "";
    world.levelAnnouncement.timer = 0;
    world.walls.length = 0;
    world.collectibles.length = 0;
    world.nextSpawnX = world.width * 0.9;
    world.slide.active = false;
    world.slide.hasSpawned = false;
    world.slide.x = 0;
    world.slide.y = 0;
    world.slide.width = 0;
    world.slide.height = 0;
    world.rescue.active = false;
    world.rescue.stage = "idle";
    world.rescue.doctorX = 0;
    world.rescue.doctorY = 0;
    world.rescue.doctorWidth = 0;
    world.rescue.doctorHeight = 0;
    world.rescue.targetX = 0;
    world.rescue.holdTimer = 0;
    world.casino.pendingPull = false;
    world.casino.pendingResume = false;
    world.casino.levelRestartQueued = false;
    world.invulnerableTime = 0;

    runner.y = world.groundY - runner.height;
    runner.vy = 0;
    runner.onGround = true;
    runner.coyoteTime = 0;
    runner.jumpBuffer = 0;
    runner.tilt = 0;

    ensureGenerated();
    updateLevelProgression({ announce: false });
    updateHud();
  }

  function syncCharacterInLocation() {
    const url = new URL(window.location.href);
    if (url.searchParams.get("character") === currentCharacter) {
      return;
    }
    url.searchParams.set("character", currentCharacter);
    window.history.replaceState(null, "", url.toString());
  }

  function updateShareImageMeta() {
    const preset = getActivePreset();
    const activeAssets = getActiveAssets();
    const shareImageUrl = new URL(preset.runnerIdleSrc, window.location.href).toString();

    if (shareMeta.ogImage) {
      shareMeta.ogImage.setAttribute("content", shareImageUrl);
    }
    if (shareMeta.twitterImage) {
      shareMeta.twitterImage.setAttribute("content", shareImageUrl);
    }
    if (shareMeta.ogImageAlt) {
      shareMeta.ogImageAlt.setAttribute(
        "content",
        `${preset.name} character from Bryan's Bonkers Cruise Dash`
      );
    }

    const width = activeAssets.idle.image.naturalWidth || 0;
    const height = activeAssets.idle.image.naturalHeight || 0;
    if (width > 0 && height > 0) {
      if (shareMeta.ogImageWidth) {
        shareMeta.ogImageWidth.setAttribute("content", String(width));
      }
      if (shareMeta.ogImageHeight) {
        shareMeta.ogImageHeight.setAttribute("content", String(height));
      }
    }
  }

  function buildShareUrl(score) {
    const url = new URL(window.location.href);
    url.searchParams.set("score", String(score));
    url.searchParams.set("character", currentCharacter);
    return url.toString();
  }

  function updateShareMetaTags() {
    const preset = getActivePreset();
    const imageUrl = new URL(preset.runnerIdleSrc, window.location.href).toString();
    const imageAlt = `${preset.name} character from Bryan's Bonkers Cruise Dash`;
    const ogImageMeta = document.querySelector('meta[property="og:image"]');
    const ogImageAltMeta = document.querySelector('meta[property="og:image:alt"]');
    const twitterImageMeta = document.querySelector('meta[name="twitter:image"]');

    if (ogImageMeta) {
      ogImageMeta.setAttribute("content", imageUrl);
    }
    if (ogImageAltMeta) {
      ogImageAltMeta.setAttribute("content", imageAlt);
    }
    if (twitterImageMeta) {
      twitterImageMeta.setAttribute("content", imageUrl);
    }
  }

  function parseSharedRunnerFromUrl() {
    const url = new URL(window.location.href);
    const sharedRunner = url.searchParams.get("runner");
    if (sharedRunner && characterPresets[sharedRunner]) {
      currentCharacter = sharedRunner;
    }
  }

  async function buildShareImageFile() {
    const preset = getActivePreset();
    try {
      const imageUrl = new URL(preset.runnerIdleSrc, window.location.href);
      const response = await fetch(imageUrl.toString(), { cache: "force-cache" });
      if (!response.ok) {
        return null;
      }
      const blob = await response.blob();
      const fileType = blob.type || "image/png";
      return new File([blob], `${currentCharacter}-share.png`, { type: fileType });
    } catch (_) {
      return null;
    }
  }

  function hideShareLink() {
    shareLink.classList.add("hidden");
    shareLink.removeAttribute("href");
    shareLink.dataset.score = "";
  }

  function showShareLink(score) {
    const shareUrl = buildShareUrl(score);
    shareLink.href = shareUrl;
    shareLink.dataset.score = String(score);
    shareLink.textContent = `Share Score: ${score}`;
    shareLink.classList.remove("hidden");
  }

  function refreshShareLinkForCharacter() {
    if (shareLink.classList.contains("hidden")) {
      return;
    }
    const score = Number.parseInt(shareLink.dataset.score || "", 10);
    if (!Number.isFinite(score)) {
      return;
    }
    shareLink.href = buildShareUrl(score);
  }

  function showOverlay(title, subtitle, buttonText, shareScore = null) {
    titleEl.textContent = title;
    subtitleEl.textContent = subtitle;
    actionButton.textContent = buttonText;
    if (Number.isFinite(shareScore)) {
      showShareLink(shareScore);
    } else {
      hideShareLink();
    }
    overlay.classList.remove("hidden");
    updateCharacterUi();
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function startRun() {
    resetWorld();
    applyStartingLevel(getSelectedStartLevelId());
    world.mode = "running";
    hideOverlay();
  }

  function resumeRunFromCasino() {
    if (world.mode !== "casino") {
      return;
    }
    world.casino.pendingPull = false;
    world.casino.pendingResume = false;
    world.mode = "running";
    if (world.casino.levelRestartQueued) {
      restartStageForCurrentLevel();
      updateHud();
    }
    hideOverlay();
  }

  function endRun() {
    const preset = getActivePreset();
    const level = getCurrentLevel();
    const nextDestinationHint = Number.isFinite(level.nextScore)
      ? `${Math.max(0, level.nextScore - world.score)} more points unlocks Level ${level.id + 1}.`
      : "You reached the final destination.";
    world.mode = "gameOver";
    showOverlay(
      "Run Over",
      `You reached Level ${level.id} (${level.name}) with ${preset.name}. Final score: ${world.score}. ${nextDestinationHint}`,
      "Run Again",
      world.score
    );
  }

  function clearCollidingWall(collidingWall) {
    if (!collidingWall) {
      return;
    }
    world.walls = world.walls.filter((wall) => wall !== collidingWall);
  }

  function setupRescueDoctor() {
    const fallbackAspect = 0.62;
    const sourceW = assets.rescueDoctor.naturalWidth || 0;
    const sourceH = assets.rescueDoctor.naturalHeight || 0;
    const aspect = sourceW > 0 && sourceH > 0 ? sourceW / sourceH : fallbackAspect;
    const doctorHeight = config.rescueDoctorHeight;
    const doctorWidth = doctorHeight * aspect;
    const targetX = world.width * config.runnerScreenRatio + runner.width * 0.58;

    world.rescue.active = true;
    world.rescue.stage = "arriving";
    world.rescue.doctorHeight = doctorHeight;
    world.rescue.doctorWidth = doctorWidth;
    world.rescue.doctorX = world.width + doctorWidth + 28;
    world.rescue.doctorY = world.groundY - doctorHeight + 2;
    world.rescue.targetX = targetX;
    world.rescue.holdTimer = config.rescueReviveHold;
  }

  function completeRescue() {
    world.rescue.active = false;
    world.rescue.stage = "idle";
    world.invulnerableTime = config.rescuePostInvulnerability;
    runner.y = world.groundY - runner.height;
    runner.vy = 0;
    runner.onGround = true;
    runner.coyoteTime = 0.08;
    runner.jumpBuffer = 0;
    world.mode = "running";
  }

  function updateRescue(dt) {
    world.elapsed += dt;
    if (!world.rescue.active) {
      return;
    }

    if (world.rescue.stage === "arriving") {
      world.rescue.doctorX -= config.rescueDoctorSpeed * dt;
      if (world.rescue.doctorX <= world.rescue.targetX) {
        world.rescue.doctorX = world.rescue.targetX;
        world.rescue.stage = "reviving";
      }
      return;
    }

    if (world.rescue.stage === "reviving") {
      world.rescue.holdTimer = Math.max(0, world.rescue.holdTimer - dt);
      if (world.rescue.holdTimer <= 0) {
        world.rescue.stage = "leaving";
      }
      return;
    }

    if (world.rescue.stage === "leaving") {
      world.rescue.doctorX -= config.rescueDoctorSpeed * 1.5 * dt;
      if (world.rescue.doctorX + world.rescue.doctorWidth < -60) {
        completeRescue();
      }
    }
  }

  function maybeTriggerRescue(cause, collisionData = null) {
    if (Math.random() > config.rescueChance) {
      return false;
    }
    if (cause === "wall") {
      clearCollidingWall(collisionData);
    } else if (cause === "slide") {
      world.slide.active = false;
    }
    runner.vy = 0;
    runner.onGround = true;
    runner.coyoteTime = 0;
    world.mode = "rescue";
    setupRescueDoctor();
    return true;
  }

  function queueJump() {
    if (world.mode === "ready" || world.mode === "gameOver") {
      startRun();
      return;
    }
    if (world.mode !== "running") {
      return;
    }
    runner.jumpBuffer = 0.12;
    attemptJump();
  }

  function attemptJump() {
    if (runner.jumpBuffer <= 0) {
      return;
    }
    if (runner.onGround || runner.coyoteTime > 0) {
      runner.vy = -config.jumpVelocity * getActivePreset().jumpVelocityMultiplier;
      runner.onGround = false;
      runner.coyoteTime = 0;
      runner.jumpBuffer = 0;
    }
  }

  function getWallCollision(worldLeft, worldRight, runnerTop, runnerBottom) {
    for (const wall of world.walls) {
      const wallLeft = wall.x;
      const wallRight = wall.x + wall.width;
      const wallTop = world.groundY - wall.height;
      const xOverlaps = worldRight > wallLeft + 2 && worldLeft < wallRight - 2;
      const yHitsFace = runnerBottom > wallTop + 8 && runnerTop < world.groundY - 4;
      if (xOverlaps && yHitsFace) {
        return wall;
      }
    }
    return null;
  }

  function hasAabbCollision(a, b) {
    return (
      a.left < b.left + b.width &&
      a.left + a.width > b.left &&
      a.top < b.top + b.height &&
      a.top + a.height > b.top
    );
  }


  function getDifficulty() {
    const level = getCurrentLevel();
    const levelProgress = getCurrentLevelProgress();
    if (!Number.isFinite(level.nextScore)) {
      return Math.min(1, level.difficulty + levelProgress * 0.2);
    }
    const nextLevel = levels[Math.min(levels.length - 1, world.levelIndex + 1)];
    return Math.min(
      1,
      level.difficulty + (nextLevel.difficulty - level.difficulty) * levelProgress
    );
  }

  function getProgressiveSpeedGain() {
    const preset = getActivePreset();
    const difficulty = getDifficulty();
    return (
      (config.speedGainPerCollectibleBase +
      config.speedGainPerCollectibleScale * difficulty) * preset.speedGainMultiplier
    );
  }

  function getSpawnGapRange() {
    const difficulty = getDifficulty();
    return {
      min: config.wallGapMax - (config.wallGapMax - config.wallGapMin) * difficulty,
      max: config.wallGapMax + 75 - 140 * difficulty
    };
  }

  function getWallHeight() {
    return Math.round((config.wallHeight - 14) + 20 * getDifficulty());
  }
  function activateSlideObstacle() {
    const slideHeight = config.slideHeight;
    const slideAspect =
      assets.slideReady && assets.slide.naturalHeight > 0
        ? assets.slide.naturalWidth / assets.slide.naturalHeight
        : 3;
    const slideWidth = slideHeight * slideAspect;
    world.slide.active = true;
    world.slide.hasSpawned = true;
    world.slide.width = slideWidth;
    world.slide.height = slideHeight;
    world.slide.x = world.width + slideWidth + 160;
    world.slide.y = world.groundY - slideHeight;
  }

  function updateSlideObstacle(dt, runnerRect) {
    if (!isSlideObstacleLevel()) {
      world.slide.active = false;
      world.slide.hasSpawned = false;
      return false;
    }
    if (!world.slide.hasSpawned && world.score >= config.slideTriggerScore) {
      activateSlideObstacle();
    }
    if (!world.slide.active) {
      return false;
    }

    world.slide.y = world.groundY - world.slide.height;
    const slideSpeed = Math.max(
      config.slideMinSpeed,
      world.speed * 0.62 + 40 + getDifficulty() * 24
    );
    world.slide.x -= slideSpeed * dt;
    if (world.slide.x + world.slide.width < -80) {
      world.slide.active = false;
      return false;
    }

    const slideRect = {
      left: world.slide.x + 14,
      top: world.slide.y + 18,
      width: Math.max(10, world.slide.width - 28),
      height: Math.max(10, world.slide.height - 28)
    };
    return hasAabbCollision(runnerRect, slideRect);
  }

  function collectItems(runnerCenterX, runnerCenterY) {
    for (const item of world.collectibles) {
      if (item.taken) {
        continue;
      }
      const bobY = item.y + Math.sin(world.elapsed * 5 + item.phase) * 5;
      const dx = runnerCenterX - item.x;
      const dy = runnerCenterY - bobY;
      const radius = item.radius + config.collectiblePickupPadding;
      if (dx * dx + dy * dy <= radius * radius) {
        item.taken = true;
        if (item.type === "bonus") {
          triggerCasinoBonus();
          return;
        }
        world.score += 1;
        world.speed = Math.min(config.maxSpeed, world.speed + getProgressiveSpeedGain());
        updateLevelProgression();
        updateHud();
      }
    }
  }

  function triggerCasinoBonus() {
    world.mode = "casino";
    world.casino.pendingPull = true;
    world.casino.pendingResume = false;
    showOverlay(
      "Bonus Casino!",
      "You found a bonus coin. Pull once to win extra points.",
      "Pull Slot"
    );
  }

  function evaluateSlotPull() {
    const symbols = ["🍒", "🍋", "⭐", "7️⃣", "💎"];
    const roll = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)]
    ];
    const counts = roll.reduce((memo, symbol) => {
      memo[symbol] = (memo[symbol] || 0) + 1;
      return memo;
    }, {});
    const highestMatch = Math.max(...Object.values(counts));
    let payout = 0;
    if (highestMatch === 3) {
      payout = 15;
    } else if (highestMatch === 2) {
      payout = 7;
    } else if (roll.includes("🍒")) {
      payout = 3;
    }
    return { roll, payout };
  }

  function pullSlotMachine() {
    if (world.mode !== "casino" || !world.casino.pendingPull) {
      return;
    }
    const result = evaluateSlotPull();
    world.score += result.payout;
    if (result.payout > 0) {
      world.speed = Math.min(config.maxSpeed, world.speed + result.payout * 2);
    }
    updateLevelProgression();
    updateHud();
    world.casino.pendingPull = false;
    world.casino.pendingResume = true;
    showOverlay(
      "Bonus Casino Result",
      `${result.roll.join("  ")} — You won ${result.payout} points!`,
      "Return to Run"
    );
  }

  function spawnWall(x) {
    const preset = getActivePreset();
    const width = config.wallWidth;
    const height = getWallHeight();
    world.walls.push({ x, width, height });
    world.collectibles.push({
      x: x + width * 0.5 + config.collectibleXOffset,
      y:
        world.groundY -
        height -
        randomBetween(config.collectibleLiftMin, config.collectibleLiftMax),
      radius: 10,
      width: config.collectibleW,
      height: config.collectibleH,
      phase: Math.random() * Math.PI * 2,
      type: "drink",
      label: preset.collectibleName,
      taken: false
    });
    if (Math.random() < config.bonusSpawnChance) {
      world.collectibles.push({
        x: x + width * 0.5 - 24,
        y:
          world.groundY -
          height -
          randomBetween(config.collectibleLiftMin + 48, config.collectibleLiftMax + 68),
        radius: 16,
        width: 34,
        height: 34,
        phase: Math.random() * Math.PI * 2,
        type: "bonus",
        taken: false
      });
    }
    const gapRange = getSpawnGapRange();
    world.nextSpawnX = x + width + randomBetween(gapRange.min, gapRange.max);
  }

  function ensureGenerated() {
    const target = world.cameraX + world.width * 2.3;
    while (world.nextSpawnX < target) {
      spawnWall(world.nextSpawnX);
    }
  }

  function pruneWorld() {
    const cullX = world.cameraX - 220;
    world.walls = world.walls.filter((wall) => wall.x + wall.width > cullX);
    world.collectibles = world.collectibles.filter(
      (item) => !item.taken && item.x > cullX
    );
  }

  function updateHud() {
    scoreValue.textContent = String(world.score);
    speedValue.textContent = String(Math.round(world.speed));
    const level = getCurrentLevel();
    const pointsToNext = Number.isFinite(level.nextScore)
      ? Math.max(0, level.nextScore - world.score)
      : null;
    levelValue.textContent = String(level.id);
    destinationValue.textContent = level.name;
    nextLevelValue.textContent =
      pointsToNext === null ? "Final destination reached" : `${pointsToNext} pts to L${level.id + 1}`;
  }

  function update(dt) {
    world.elapsed += dt;
    world.cameraX += world.speed * dt;
    world.speed = Math.min(config.maxSpeed, world.speed + dt * (0.8 + getDifficulty() * 1.4));
    if (world.invulnerableTime > 0) {
      world.invulnerableTime = Math.max(0, world.invulnerableTime - dt);
    }

    if (runner.jumpBuffer > 0) {
      runner.jumpBuffer = Math.max(0, runner.jumpBuffer - dt);
    }
    if (runner.coyoteTime > 0) {
      runner.coyoteTime = Math.max(0, runner.coyoteTime - dt);
    }
    attemptJump();

    runner.vy += config.gravity * dt;
    runner.y += runner.vy * dt;

    const runnerWorldX = world.cameraX + world.width * config.runnerScreenRatio;
    const worldLeft = runnerWorldX;
    const worldRight = runnerWorldX + runner.width;
    if (runner.y + runner.height >= world.groundY) {
      runner.y = world.groundY - runner.height;
      runner.vy = 0;
      runner.onGround = true;
      runner.coyoteTime = 0.1;
    } else {
      if (runner.onGround) {
        runner.coyoteTime = 0.1;
      }
      runner.onGround = false;
    }

    const runnerTop = runner.y + 6;
    const runnerBottom = runner.y + runner.height - 5;
    const runnerLeft = worldLeft + 8;
    const runnerRight = worldRight - 8;
    const runnerRect = {
      left: world.width * config.runnerScreenRatio + 8,
      top: runnerTop,
      width: runner.width - 16,
      height: runnerBottom - runnerTop
    };
    if (world.invulnerableTime <= 0) {
      const collidingWall = getWallCollision(runnerLeft, runnerRight, runnerTop, runnerBottom);
      if (collidingWall) {
        if (!maybeTriggerRescue("wall", collidingWall)) {
          endRun();
        }
        return;
      }
    }
    collectItems(runnerWorldX + runner.width * 0.5, runner.y + runner.height * 0.5);
    if (world.pendingLevelRestart) {
      restartStageForCurrentLevel();
      updateHud();
      return;
    }
    const hitSlide = updateSlideObstacle(dt, runnerRect);
    if (hitSlide && world.invulnerableTime <= 0) {
      if (!maybeTriggerRescue("slide")) {
        endRun();
      }
      return;
    }
    ensureGenerated();
    pruneWorld();
    updateHud();

  }

  function drawLayer(color, baseY, amplitude, segmentWidth, speedFactor) {
    const offset = (world.cameraX * speedFactor) % segmentWidth;
    ctx.fillStyle = color;
    for (let x = -segmentWidth - offset; x < world.width + segmentWidth; x += segmentWidth) {
      ctx.beginPath();
      ctx.moveTo(x, world.height);
      ctx.lineTo(x, baseY);
      ctx.quadraticCurveTo(
        x + segmentWidth * 0.5,
        baseY - amplitude,
        x + segmentWidth,
        baseY
      );
      ctx.lineTo(x + segmentWidth, world.height);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawImageCover(image, x, y, width, height) {
    const sourceW = image.naturalWidth || 0;
    const sourceH = image.naturalHeight || 0;
    if (sourceW <= 0 || sourceH <= 0) {
      ctx.drawImage(image, x, y, width, height);
      return;
    }

    const sourceRatio = sourceW / sourceH;
    const targetRatio = width / height;
    let cropW = sourceW;
    let cropH = sourceH;
    let cropX = 0;
    let cropY = 0;

    if (sourceRatio > targetRatio) {
      cropW = sourceH * targetRatio;
      cropX = (sourceW - cropW) * 0.5;
    } else {
      cropH = sourceW / targetRatio;
      cropY = (sourceH - cropH) * 0.5;
    }

    ctx.drawImage(image, cropX, cropY, cropW, cropH, x, y, width, height);
  }

  function drawScrollingBackdrop(image, speedFactor, opacity = 1) {
    const sourceW = image.naturalWidth || 0;
    const sourceH = image.naturalHeight || 0;
    if (sourceW <= 0 || sourceH <= 0) {
      return;
    }
    const drawH = world.height;
    const drawW = (sourceW * drawH) / sourceH;
    const offset = (world.cameraX * speedFactor) % drawW;

    ctx.save();
    ctx.globalAlpha = opacity;
    for (let x = -drawW - offset; x < world.width + drawW; x += drawW) {
      ctx.drawImage(image, x, 0, drawW, drawH);
    }
    ctx.restore();
  }

  function drawTiledGroundTexture(image, speedFactor = 1) {
    const sourceW = image.naturalWidth || 0;
    const sourceH = image.naturalHeight || 0;
    if (sourceW <= 0 || sourceH <= 0) {
      return false;
    }
    const groundHeight = world.height - world.groundY;
    const walkableRatio = Math.max(0.08, Math.min(0.9, config.deckWalkableRatio));
    const requiredTileH = groundHeight / (1 - walkableRatio);
    const tileH = Math.max(config.deckMinTileHeight, requiredTileH);
    const tileW = Math.max(72, (sourceW * tileH) / sourceH);
    const drawY = world.groundY - tileH * walkableRatio;
    const offset = (world.cameraX * speedFactor) % tileW;

    for (let x = -tileW - offset; x < world.width + tileW; x += tileW) {
      ctx.drawImage(image, x, drawY, tileW, tileH);
    }
    return true;
  }

  function drawLevelBackground() {
    const theme = getCurrentTheme();
    const sky = ctx.createLinearGradient(0, 0, 0, world.height);
    sky.addColorStop(0, theme.skyTop);
    sky.addColorStop(0.58, theme.skyMid);
    sky.addColorStop(1, theme.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, world.width, world.height);

    const parallaxBackgroundTexture = getParallaxBackgroundTexture();
    if (parallaxBackgroundTexture) {
      drawScrollingBackdrop(
        parallaxBackgroundTexture,
        getParallaxBackgroundSpeed(),
        0.94
      );
      return;
    }

    const levelIndex = Math.max(0, Math.min(levelBackgroundSources.length - 1, world.levelIndex));
    if (assets.levelBackgroundsReady[levelIndex]) {
      ctx.save();
      ctx.globalAlpha = 0.92;
      drawImageCover(assets.levelBackgrounds[levelIndex], 0, 0, world.width, world.height);
      ctx.restore();
    }
  }

  function drawImageContainBottomCenter(image, centerX, bottomY, maxWidth, maxHeight) {
    const sourceW = image.naturalWidth || 0;
    const sourceH = image.naturalHeight || 0;
    if (sourceW <= 0 || sourceH <= 0) {
      return null;
    }

    const scale = Math.min(maxWidth / sourceW, maxHeight / sourceH);
    const drawW = sourceW * scale;
    const drawH = sourceH * scale;
    const drawX = centerX - drawW * 0.5;
    const drawY = bottomY - drawH;
    ctx.drawImage(image, drawX, drawY, drawW, drawH);
    return { x: drawX, y: drawY, width: drawW, height: drawH };
  }

  function drawClouds() {
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    const span = world.width + 300;
    for (let i = 0; i < 6; i += 1) {
      let x = (i * 240 - world.cameraX * 0.08) % span;
      if (x < -160) {
        x += span;
      }
      const y = 80 + (i % 3) * 44;
      ctx.beginPath();
      ctx.arc(x, y, 24, 0, Math.PI * 2);
      ctx.arc(x + 26, y + 2, 18, 0, Math.PI * 2);
      ctx.arc(x - 24, y + 4, 16, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawGround() {
    const theme = getCurrentTheme();
    const groundHeight = world.height - world.groundY;
    ctx.fillStyle = theme.ground;
    ctx.fillRect(0, world.groundY, world.width, groundHeight);

    const parallaxGroundTexture = getParallaxGroundTexture();
    if (parallaxGroundTexture) {
      drawTiledGroundTexture(parallaxGroundTexture, 1);
      return;
    }

    if (assets.deckReady && drawTiledGroundTexture(assets.deck, 1)) {
      return;
    }

    ctx.fillStyle = theme.stripe;
    const stripeWidth = 64;
    const offset = (world.cameraX * 0.7) % stripeWidth;
    for (let x = -stripeWidth - offset; x < world.width + stripeWidth; x += stripeWidth) {
      ctx.fillRect(x, world.groundY + 28, stripeWidth * 0.5, 7);
    }
  }

  function drawLevelFourCruiseShip() {
    if (world.levelIndex !== 3) {
      return;
    }

    const shipHeight = Math.max(64, world.height * 0.12);
    const shipWidth = shipHeight * 3.7;
    const startX = world.width + shipWidth + 46;
    const endX = -shipWidth - 120;
    const travelDuration = 17;
    const travelProgress = Math.max(0, Math.min(1, world.levelElapsed / travelDuration));
    const shipX = startX + (endX - startX) * travelProgress;
    const waterlineY = world.height * 0.68;
    const shipY = waterlineY - shipHeight;

    ctx.save();
    ctx.globalAlpha = 0.95;

    ctx.fillStyle = "rgba(255, 255, 255, 0.32)";
    ctx.beginPath();
    ctx.ellipse(shipX + shipWidth * 0.5, waterlineY + 8, shipWidth * 0.46, shipHeight * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f7fbff";
    fillRoundedRect(shipX + shipWidth * 0.06, shipY + shipHeight * 0.49, shipWidth * 0.88, shipHeight * 0.38, shipHeight * 0.1);

    ctx.beginPath();
    ctx.moveTo(shipX + shipWidth * 0.04, shipY + shipHeight * 0.82);
    ctx.lineTo(shipX + shipWidth * 0.95, shipY + shipHeight * 0.82);
    ctx.lineTo(shipX + shipWidth * 0.86, shipY + shipHeight);
    ctx.lineTo(shipX + shipWidth * 0.14, shipY + shipHeight);
    ctx.closePath();
    ctx.fillStyle = "#dfe9f2";
    ctx.fill();

    ctx.fillStyle = "#edf5fb";
    fillRoundedRect(shipX + shipWidth * 0.24, shipY + shipHeight * 0.2, shipWidth * 0.48, shipHeight * 0.2, shipHeight * 0.06);
    fillRoundedRect(shipX + shipWidth * 0.32, shipY + shipHeight * 0.08, shipWidth * 0.3, shipHeight * 0.11, shipHeight * 0.05);

    ctx.fillStyle = "#8bb6d8";
    const windowRows = [0.57, 0.67];
    windowRows.forEach((row) => {
      for (let i = 0; i < 11; i += 1) {
        const wx = shipX + shipWidth * 0.12 + i * shipWidth * 0.07;
        const wy = shipY + shipHeight * row;
        fillRoundedRect(wx, wy, shipWidth * 0.036, shipHeight * 0.06, shipHeight * 0.02);
      }
    });

    ctx.fillStyle = "#ffffff";
    fillRoundedRect(shipX + shipWidth * 0.49, shipY - shipHeight * 0.09, shipWidth * 0.024, shipHeight * 0.16, shipHeight * 0.01);
    ctx.restore();
  }

  function drawWalls() {
    for (const wall of world.walls) {
      const x = wall.x - world.cameraX;
      if (x + wall.width < -80 || x > world.width + 80) {
        continue;
      }
      const top = world.groundY - wall.height;
      if (assets.umbrellaReady) {
        ctx.drawImage(assets.umbrella, x, top, wall.width, wall.height);
      } else {
        ctx.fillStyle = "#a85842";
        ctx.fillRect(x, top, wall.width, wall.height);
        ctx.fillStyle = "#c97055";
        ctx.fillRect(x + 4, top + 4, wall.width - 8, wall.height - 8);
      }
    }
  }

  function drawSlideObstacle() {
    if (!world.slide.active) {
      return;
    }

    if (assets.slideReady) {
      ctx.drawImage(
        assets.slide,
        world.slide.x,
        world.slide.y,
        world.slide.width,
        world.slide.height
      );
      return;
    }

    ctx.fillStyle = "#2f8fca";
    fillRoundedRect(
      world.slide.x,
      world.slide.y + world.slide.height * 0.2,
      world.slide.width,
      world.slide.height * 0.8,
      10
    );
  }

  function drawCollectibles() {
    const preset = getActivePreset();
    const activeAssets = getActiveAssets();
    for (const item of world.collectibles) {
      if (item.taken) {
        continue;
      }
      const x = item.x - world.cameraX;
      const y = item.y + Math.sin(world.elapsed * 5 + item.phase) * 5;
      if (x < -50 || x > world.width + 50) {
        continue;
      }
      const drawW = item.width || config.collectibleW;
      const drawH = item.height || config.collectibleH;
      const isBonus = item.type === "bonus";
      ctx.fillStyle = isBonus ? "rgba(255, 210, 79, 0.4)" : "rgba(255, 225, 122, 0.33)";
      ctx.beginPath();
      ctx.arc(x, y + 2, item.radius + 11, 0, Math.PI * 2);
      ctx.fill();

      if (!isBonus && activeAssets.collectible.ready) {
        ctx.drawImage(
          activeAssets.collectible.image,
          x - drawW * 0.5,
          y - drawH * 0.5,
          drawW,
          drawH
        );
      } else if (isBonus) {
        ctx.fillStyle = "#ffcc33";
        ctx.beginPath();
        ctx.arc(x, y, item.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#cf8d00";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = "#7d4f00";
        ctx.font = "bold 14px Trebuchet MS, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("B", x, y + 1);
      } else {
        ctx.fillStyle = preset.collectibleColor;
        ctx.beginPath();
        ctx.arc(x, y, item.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#4b3a11";
        ctx.font = "bold 14px Trebuchet MS, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(preset.collectibleGlyph, x, y + 1);
      }
    }
  }

  function drawRunner() {
    const preset = getActivePreset();
    const activeAssets = getActiveAssets();
    const x = world.width * config.runnerScreenRatio;
    const y = runner.y;
    const runCycle = world.elapsed * Math.max(5.5, world.speed / 50);
    const isWalking = world.mode === "running" && runner.onGround;
    const walkFrame = Math.floor(runCycle * 1.4) % 2;

    runner.tilt += (Math.max(-0.2, Math.min(0.2, -runner.vy * 0.0008)) - runner.tilt) * 0.2;
    const bob = runner.onGround ? Math.sin(runCycle) * 1.9 : 0;
    const baseDrawScale = 1.24;
    const visualScale = baseDrawScale * Math.max(1, preset.runnerScale || 1);
    const drawW = runner.width * visualScale;
    const drawH = runner.height * visualScale;
    const baseDrawH = runner.height * baseDrawScale;
    const drawYOffset = (baseDrawH - drawH) * 0.5;
    const shadowScale = visualScale / baseDrawScale;

    ctx.save();
    ctx.translate(x + runner.width * 0.5, y + runner.height * 0.5 + bob);
    ctx.rotate(runner.tilt);
    if (world.invulnerableTime > 0) {
      const pulse = 0.62 + Math.abs(Math.sin(world.elapsed * 14)) * 0.3;
      ctx.globalAlpha = pulse;
    }

    if (runner.onGround) {
      ctx.fillStyle = "rgba(20, 35, 50, 0.25)";
      ctx.beginPath();
      ctx.ellipse(
        0,
        runner.height * 0.54,
        24 * shadowScale,
        9 * Math.max(0.9, shadowScale * 0.95),
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    if (activeAssets.idle.ready) {
      let runnerImage = activeAssets.idle.image;
      if (!runner.onGround && activeAssets.jump.ready) {
        runnerImage = activeAssets.jump.image;
      } else if (isWalking && walkFrame === 1 && activeAssets.step.ready) {
        runnerImage = activeAssets.step.image;
      }
      ctx.drawImage(runnerImage, -drawW * 0.5, -drawH * 0.5 + drawYOffset, drawW, drawH);
    } else {
      ctx.save();
      ctx.translate(0, drawYOffset);
      ctx.scale(shadowScale, shadowScale);
      ctx.fillStyle = preset.fallbackColor;
      fillRoundedRect(-16, -12, 32, 34, 10);
      ctx.fillStyle = "#ffd4b6";
      ctx.beginPath();
      ctx.arc(0, -22, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  function drawRescueDoctor() {
    if (!world.rescue.active) {
      return;
    }

    if (world.rescue.stage === "reviving") {
      const runnerX = world.width * config.runnerScreenRatio + runner.width * 0.5;
      const runnerY = runner.y + runner.height * 0.5;
      const halo = ctx.createRadialGradient(runnerX, runnerY, 8, runnerX, runnerY, 72);
      halo.addColorStop(0, "rgba(240, 255, 178, 0.5)");
      halo.addColorStop(1, "rgba(240, 255, 178, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(runnerX, runnerY, 72, 0, Math.PI * 2);
      ctx.fill();
    }

    if (assets.rescueDoctorReady) {
      ctx.drawImage(
        assets.rescueDoctor,
        world.rescue.doctorX,
        world.rescue.doctorY,
        world.rescue.doctorWidth,
        world.rescue.doctorHeight
      );
      return;
    }

    ctx.fillStyle = "#fefefe";
    fillRoundedRect(
      world.rescue.doctorX,
      world.rescue.doctorY,
      world.rescue.doctorWidth,
      world.rescue.doctorHeight,
      10
    );
    ctx.fillStyle = "#d13535";
    fillRoundedRect(
      world.rescue.doctorX + world.rescue.doctorWidth * 0.36,
      world.rescue.doctorY + world.rescue.doctorHeight * 0.2,
      world.rescue.doctorWidth * 0.28,
      world.rescue.doctorHeight * 0.12,
      6
    );
  }

  function drawCasinoMode() {
    if (assets.casinoBackgroundReady) {
      drawImageCover(assets.casinoBackground, 0, 0, world.width, world.height);
    } else {
      const casinoGradient = ctx.createLinearGradient(0, 0, 0, world.height);
      casinoGradient.addColorStop(0, "#30052f");
      casinoGradient.addColorStop(0.55, "#4d0a2f");
      casinoGradient.addColorStop(1, "#1d0317");
      ctx.fillStyle = casinoGradient;
      ctx.fillRect(0, 0, world.width, world.height);
    }

    ctx.fillStyle = "rgba(7, 9, 18, 0.2)";
    ctx.fillRect(0, 0, world.width, world.height);

    const slotMargin = Math.max(18, world.width * 0.03);
    const maxSlotWidth = world.width * 0.72;
    const maxSlotHeight = world.height * 0.86;
    const slotBottomY = world.height - slotMargin;

    if (assets.slotMachineReady) {
      drawImageContainBottomCenter(
        assets.slotMachine,
        world.width * 0.52,
        slotBottomY,
        maxSlotWidth,
        maxSlotHeight
      );
      return;
    }

    const fallbackW = Math.min(world.width * 0.55, 300);
    const fallbackH = Math.min(world.height * 0.7, 390);
    const fallbackX = world.width * 0.5 - fallbackW * 0.5;
    const fallbackY = slotBottomY - fallbackH;
    ctx.fillStyle = "#d14168";
    fillRoundedRect(fallbackX, fallbackY, fallbackW, fallbackH, 28);
    ctx.fillStyle = "#f6dc58";
    fillRoundedRect(
      fallbackX + fallbackW * 0.18,
      fallbackY + fallbackH * 0.23,
      fallbackW * 0.64,
      fallbackH * 0.2,
      14
    );
    ctx.fillStyle = "#2f0f1f";
    ctx.font = "bold 38px Trebuchet MS, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("777", world.width * 0.5, fallbackY + fallbackH * 0.33);
  }

  function fillRoundedRect(x, y, width, height, radius) {
    const r = Math.min(radius, width * 0.5, height * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  function drawLevelProgressTrack() {
    const level = getCurrentLevel();
    const progress = getCurrentLevelProgress();
    const trackWidth = Math.min(280, world.width * 0.5);
    const trackHeight = 13;
    const x = world.width - trackWidth - 24;
    const y = 22;
    const fillWidth = Math.max(0, (trackWidth - 4) * progress);

    ctx.save();
    ctx.fillStyle = "rgba(11, 24, 33, 0.28)";
    fillRoundedRect(x, y, trackWidth, trackHeight, 999);
    ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
    fillRoundedRect(x + 2, y + 2, fillWidth, trackHeight - 4, 999);
    ctx.fillStyle = "rgba(16, 28, 40, 0.72)";
    ctx.font = "700 12px Trebuchet MS, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(
      Number.isFinite(level.nextScore) ? `Level ${level.id} to ${level.id + 1}` : "Final Level",
      x + trackWidth,
      y - 5
    );
    ctx.restore();
  }

  function drawLevelAnnouncement() {
    if (world.levelAnnouncement.timer <= 0 || !world.levelAnnouncement.text) {
      return;
    }
    const fadeIn = Math.min(1, (config.levelAnnouncementDuration - world.levelAnnouncement.timer) / 0.24);
    const fadeOut = Math.min(1, world.levelAnnouncement.timer / 0.4);
    const alpha = Math.min(fadeIn, fadeOut);
    const cardWidth = Math.min(420, world.width * 0.82);
    const cardHeight = 58;
    const x = world.width * 0.5 - cardWidth * 0.5;
    const y = world.height * 0.13;

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = "rgba(9, 26, 39, 0.78)";
    fillRoundedRect(x, y, cardWidth, cardHeight, 16);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, cardWidth - 2, cardHeight - 2);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "800 22px Trebuchet MS, sans-serif";
    ctx.fillText(world.levelAnnouncement.text, world.width * 0.5, y + cardHeight * 0.52);
    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, world.width, world.height);

    if (world.mode === "casino") {
      drawCasinoMode();
      return;
    }

    const theme = getCurrentTheme();
    drawLevelBackground();
    drawClouds();
    if (!isParallaxTextureLevel()) {
      drawLayer(theme.layerFar, world.height * 0.69, 38, 220, 0.16);
      drawLayer(theme.layerNear, world.height * 0.75, 52, 260, 0.3);
    }
    drawLevelFourCruiseShip();
    drawGround();
    drawWalls();
    drawSlideObstacle();
    drawCollectibles();
    drawRunner();
    drawRescueDoctor();
    drawLevelProgressTrack();
    drawLevelAnnouncement();
  }

  function onFrame(timestamp) {
    const elapsedMs = world.lastTime ? timestamp - world.lastTime : 16;
    world.lastTime = timestamp;
    const dt = Math.min(0.033, elapsedMs / 1000);
    world.levelElapsed += dt;
    if (world.levelAnnouncement.timer > 0) {
      world.levelAnnouncement.timer = Math.max(0, world.levelAnnouncement.timer - dt);
    }

    if (world.mode === "running") {
      update(dt);
    } else if (world.mode === "rescue") {
      updateRescue(dt);
    } else {
      world.elapsed += dt;
    }

    render();
    requestAnimationFrame(onFrame);
  }

  function setupInput() {
    window.addEventListener("keydown", (event) => {
      if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
        event.preventDefault();
        if (!event.repeat) {
          queueJump();
        }
      }
    });

    canvas.addEventListener("pointerdown", queueJump);
    actionButton.addEventListener("click", () => {
      if (world.mode === "casino") {
        if (world.casino.pendingPull) {
          pullSlotMachine();
          return;
        }
        if (world.casino.pendingResume) {
          resumeRunFromCasino();
          return;
        }
      }
      startRun();
    });
    shareLink.addEventListener("click", async (event) => {
      if (!navigator.share) {
        return;
      }
      event.preventDefault();
      const score = Number.parseInt(shareLink.dataset.score || "0", 10) || 0;
      const preset = getActivePreset();
      const shareData = {
        title: `${preset.name}'s Bonkers Cruise Dash`,
        text: `I scored ${score} with ${preset.name} on Bonkers Cruise Dash.`,
        url: shareLink.href
      };
      const shareFile = await buildShareImageFile();
      if (
        shareFile &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [shareFile] })
      ) {
        shareData.files = [shareFile];
      }
      navigator.share(shareData).catch(() => {});
    });
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && releaseState.isOpen) {
        closeReleaseNotes();
      }
    });
    helpButton.addEventListener("click", () => {
      openReleaseNotes({
        notes: [...releaseState.notes],
        introText: "Browse all release notes. Use Tab to move through controls.",
        triggerEl: helpButton
      });
    });
    notesCloseButton.addEventListener("click", closeReleaseNotes);
    characterSelect.addEventListener("change", (event) => {
      const selected = String(event.target.value || "").toLowerCase();
      if (!isValidCharacter(selected)) {
        return;
      }
      currentCharacter = selected;
      updateCharacterUi();
      if (world.mode !== "running" && world.mode !== "casino") {
        resetWorld();
      }
    });
    startLevelSelect.addEventListener("change", (event) => {
      progressionState.selectedStartLevel = normalizeLevelId(event.target.value, 1);
      updateStartLevelDetails();
    });
  }

  function updateCharacterUi() {
    const preset = getActivePreset();
    characterSelect.value = currentCharacter;
    characterDetails.textContent = `${preset.name} collects ${preset.collectibleName}. ${preset.details}`;
    updateShareImageMeta();
    refreshShareLinkForCharacter();
    syncCharacterInLocation();
  }

  resizeCanvas();
  parseSharedRunnerFromUrl();
  hydrateProgressionState();
  unlockLevel(1);
  resetWorld();
  showOverlay(
    "Bryan's Bonkers Cruise Dash",
    "Jump walls, collect pickups, and unlock destinations from Existing Cruise Deck to Miami.",
    "Start Run"
  );
  updateCharacterUi();
  setupInput();
  maybeShowWhatsNew();
  requestAnimationFrame(onFrame);
})();
