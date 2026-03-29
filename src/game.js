import {
  buildPatternDeck,
  CHALLENGE_CURRENT_VERSION,
  createDefaultProfileV2,
  decodeChallengePayload,
  encodeChallengePayload,
  getNotesSince as getNotesSinceVersion,
  getDailyQuestSeed,
  getProgressiveSpeedGain as calculateProgressiveSpeedGain,
  migrateProfileV2,
  normalizeLevelId as clampLevelId
} from "./game-logic.js";
import confetti from "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/+esm";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

"use strict";

(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const splashScreen = document.getElementById("splashScreen");
  const splashContinueButton = document.getElementById("splashContinueButton");
  const overlay = document.getElementById("overlay");
  const actionButton = document.getElementById("actionButton");
  const shareLink = document.getElementById("shareLink");
  const scoreValue = document.getElementById("scoreValue");
  const levelValue = document.getElementById("levelValue");
  const nextLevelValue = document.getElementById("nextLevelValue");
  const livesValue = document.getElementById("livesValue");
  const comboHudItem = document.getElementById("comboHudItem");
  const comboValue = document.getElementById("comboValue");
  const rescueHudItem = document.getElementById("rescueHudItem");
  const settingsButton = document.getElementById("settingsButton");
  const settingsBackButton = document.getElementById("settingsBackButton");
  const helpButton = document.getElementById("helpButton");
  const mainMenuScreen = document.getElementById("mainMenuScreen");
  const settingsMenuScreen = document.getElementById("settingsMenuScreen");
  const notesDialog = document.getElementById("notesDialog");
  const notesIntro = document.getElementById("notesIntro");
  const notesScrollRegion = document.getElementById("notesScrollRegion");
  const notesCloseButton = document.getElementById("notesCloseButton");
  const characterSelect = document.getElementById("characterSelect");
  const characterDetails = document.getElementById("characterDetails");
  const startLevelSelect = document.getElementById("startLevelSelect");
  const startLevelDetails = document.getElementById("startLevelDetails");
  const controlSchemeSelect = document.getElementById("controlSchemeSelect");
  const speedScaleSelect = document.getElementById("speedScaleSelect");
  const contrastToggle = document.getElementById("contrastToggle");
  const musicVolumeRange = document.getElementById("musicVolumeRange");
  const sfxVolumeRange = document.getElementById("sfxVolumeRange");
  const authStatus = document.getElementById("authStatus");
  const authEmailInput = document.getElementById("authEmailInput");
  const authPasswordInput = document.getElementById("authPasswordInput");
  const createAccountButton = document.getElementById("createAccountButton");
  const signInButton = document.getElementById("signInButton");
  const signOutButton = document.getElementById("signOutButton");
  const runStats = document.getElementById("runStats");
  const rescueValue = document.getElementById("rescueValue");
  const perkSelect = document.getElementById("perkSelect");
  const perkDetails = document.getElementById("perkDetails");
  const titleEl = overlay.querySelector(".title");
  const subtitleEl = overlay.querySelector(".subtitle");
  const uiPixelFont = "\"Press Start 2P\", \"Courier New\", monospace";
  const uiMonoFont = "\"VT323\", \"Courier New\", monospace";

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
    bonusSpawnChance: 0.1,
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
    levelAnnouncementDuration: 2.35,
    maxLives: 3,
    checkpointInterval: 5,
    comboWindowSeconds: 2.6,
    comboStep: 3,
    maxComboMultiplier: 3,
    slideDuration: 0.58,
    slideCooldown: 0.34,
    shortHopCutoffVelocity: 280,
    shortHopReleaseDampen: 0.5,
    speedBoostDuration: 2.4,
    speedBoostEveryCombos: 2,
    speedBoostAmount: 36,
    screenTransitionMs: 320,
    milestonePopupDuration: 1.35,
    lowBarClearance: 42,
    actOneDuration: 45,
    actTwoDuration: 105,
    riskGateIntervalSeconds: 20,
    rescueTokenComboMilestone: 6,
    challengeDefaultHours: 48,
    passXpPerLevel: 180,
    runQuestCount: 3
  };
  const imagePath = (fileName) => `assets/images/${fileName}`;
  const levelBackgroundSources = [
    imagePath("levels/level-1-existing-cruise.svg"),
    imagePath("levels/level-2-island-adventure.svg"),
    imagePath("levels/level-3-bahamas.svg"),
    imagePath("levels/level-4-cruise-deck.svg"),
    imagePath("levels/level-5-miami.svg")
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
      abilityLabel: "Steady Runner",
      abilityDetail: "Balanced jump and slide timing for reliable runs.",
      runnerIdleSrc: imagePath("characters/bryan.png"),
      runnerStepSrc: imagePath("characters/bryan2.png"),
      runnerJumpSrc: imagePath("characters/bryan-jump.png"),
      collectibleSrc: imagePath("items/drink.png"),
      runnerScale: 1,
      speedGainMultiplier: 1,
      jumpVelocityMultiplier: 1,
      slideDurationMultiplier: 1,
      unlockCost: 0,
      fallbackColor: "#f26a4b",
      collectibleGlyph: "💊",
      collectibleColor: "#ffd95e"
    },
    barbra: {
      name: "Barbra",
      collectibleName: "Morning Beer",
      details: "Extra zip after pickups, with a slightly lower jump arc.",
      abilityLabel: "Long Slide",
      abilityDetail: "Slides 25% longer for tighter low-obstacle clears.",
      runnerIdleSrc: imagePath("characters/barbra.png"),
      runnerStepSrc: imagePath("characters/barbra2.png"),
      runnerJumpSrc: imagePath("characters/barbra-jump.png"),
      runnerJumpFallbackSrc: imagePath("characters/barbra-jump.png"),
      collectibleSrc: imagePath("items/morning-beer.png"),
      runnerScale: 1.5,
      speedGainMultiplier: 1.08,
      jumpVelocityMultiplier: 0.96,
      slideDurationMultiplier: 1.25,
      unlockCost: 80,
      fallbackColor: "#f48cb4",
      collectibleGlyph: "🍺",
      collectibleColor: "#ffc857"
    },
    kyle: {
      name: "Kyle",
      collectibleName: "Champagne",
      details: "Higher jumps and smoother landings with moderate acceleration.",
      abilityLabel: "Skybound",
      abilityDetail: "Higher jump arc makes long obstacle chains easier.",
      runnerIdleSrc: imagePath("characters/kyle.png"),
      runnerStepSrc: imagePath("characters/kyle2.png"),
      runnerJumpSrc: imagePath("characters/kyle-jump.png"),
      collectibleSrc: imagePath("items/champagne.png"),
      runnerScale: 1.5,
      speedGainMultiplier: 0.94,
      jumpVelocityMultiplier: 1.05,
      slideDurationMultiplier: 1,
      unlockCost: 130,
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
    currentVersion: "2.4.0",
    notes: [
      {
        version: "2.4.0",
        date: "2026-03-28",
        title: "Main menu settings split + scrolling improvements",
        bullets: [
          "Split start flow into dedicated Main Menu and Settings screens for easier navigation.",
          "Added a direct Settings button from the main menu with one-tap return back.",
          "Improved menu overflow behavior so full menu content remains reachable on smaller displays."
        ]
      },
      {
        version: "2.3.0",
        date: "2026-03-28",
        title: "Run feedback + progression expansion",
        bullets: [
          "Added near-runner heart lives, coin counter, and milestone combo/checkpoint popups.",
          "Added a persistent coin bank with unlockable runners and gear in the setup menu.",
          "Added separate music and SFX sliders plus end-of-run stats and achievement progress.",
          "Added new obstacle types (beach balls, surfboards, low bars) and rotating scenery sections."
        ]
      },
      {
        version: "2.2.0",
        date: "2026-03-28",
        title: "Level-up celebration polish",
        bullets: [
          "Integrated the open-source canvas-confetti package for milestone celebrations.",
          "Added confetti bursts when unlocking a new level.",
          "Added a larger game-over celebration when at least one achievement is earned."
        ]
      },
      {
        version: "2.1.0",
        date: "2026-03-28",
        title: "Audio feedback + animated screen transitions",
        bullets: [
          "Added cruise-style background music with an in-menu audio toggle.",
          "Added sound effects for jumps, pickups, level ups, and collisions.",
          "Added smoother fade/slide transitions between splash, menu, and run states.",
          "Enhanced the splash 'Press Start' presentation with subtle motion."
        ]
      },
      {
        version: "2.0.0",
        date: "2026-03-28",
        title: "Difficulty smoothing, combos, and accessibility",
        bullets: [
          "Added three-life runs with score checkpoints every five points so a single collision no longer ends a run.",
          "Introduced variable jump height, mid-air double-jump, and a manual slide action for tighter control.",
          "Added combo scoring multipliers plus temporary drink speed boosts for streak play.",
          "Added quick-restart game-over flow with earned milestone achievements displayed.",
          "Added control remap, game-speed selection, and high-contrast HUD mode."
        ]
      },
      {
        version: "1.9.0",
        date: "2026-03-27",
        title: "Splash screen + streamlined HUD/menu",
        bullets: [
          "Added a dedicated opening splash screen using ui/bryan-splash.png before the main menu.",
          "Simplified the start screen to a single-column setup flow: Character, Level, Help, then Start Run.",
          "Removed lower-value in-run HUD items so core stats remain focused during gameplay.",
          "Updated game-over behavior so Run Again returns to the main menu instead of instantly restarting."
        ]
      },
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
          "Updated casino bonus visuals to use backgrounds/casino.png as the background and items/slot-machine.png in the foreground with aspect-ratio-safe scaling.",
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
    bankStorageKey: "bbcd:coinBank",
    unlockStorageKey: "bbcd:unlockedCharacters",
    profileStorageKey: "bbcd:profile:v2",
    maxUnlockedLevel: 1,
    selectedStartLevel: 1,
    coinBank: 0,
    unlockedCharacters: new Set(["bryan"])
  };
  const profileState = {
    data: createDefaultProfileV2()
  };
  const perkCatalog = {
    safe_landing: {
      id: "safe_landing",
      name: "Safe Landing",
      detail: "Extends coyote window for safer late jumps.",
      coyoteMultiplier: 1.55
    },
    combo_shield: {
      id: "combo_shield",
      name: "Combo Shield",
      detail: "The first combo drop in a run is forgiven.",
      comboShield: true
    },
    lucky_pull: {
      id: "lucky_pull",
      name: "Lucky Pull",
      detail: "Raises bonus token odds from slot markers.",
      bonusChanceMultiplier: 1.6
    }
  };
  const voyageQuestTemplates = [
    {
      key: "coins",
      title: "Collect {target} drinks",
      metric: "coinsCollected",
      targets: [8, 10, 12, 14],
      rewardXp: 34,
      rewardCoins: 8
    },
    {
      key: "combo",
      title: "Reach combo streak {target}",
      metric: "longestCombo",
      targets: [6, 8, 10],
      rewardXp: 40,
      rewardCoins: 10
    },
    {
      key: "score",
      title: "Reach score {target}",
      metric: "score",
      targets: [16, 20, 24, 30],
      rewardXp: 46,
      rewardCoins: 12
    },
    {
      key: "level",
      title: "Reach destination level {target}",
      metric: "levelReached",
      targets: [2, 3, 4],
      rewardXp: 55,
      rewardCoins: 12
    },
    {
      key: "survive",
      title: "Survive {target}s in one run",
      metric: "survivalSeconds",
      targets: [45, 60, 80],
      rewardXp: 48,
      rewardCoins: 11
    }
  ];
  const dailyState = {
    storageKey: "bbcd:daily:v1",
    dateKey: "",
    seed: 0,
    completedQuestIds: new Set()
  };
  const challengeState = {
    storageKey: "bbcd:challenge-history:v1",
    active: null,
    history: {
      received: [],
      sent: []
    }
  };
  const questState = {
    runQuests: [],
    dailyQuests: [],
    completedRunQuestIds: new Set(),
    comboShieldUsed: false
  };
  const accessibilityState = {
    controlsStorageKey: "bbcd:controlScheme",
    speedStorageKey: "bbcd:gameSpeedScale",
    contrastStorageKey: "bbcd:highContrast",
    musicVolumeStorageKey: "bbcd:musicVolume",
    sfxVolumeStorageKey: "bbcd:sfxVolume",
    controlScheme: "right",
    speedScale: 1,
    highContrast: false,
    musicVolume: 0.7,
    sfxVolume: 0.8
  };
  const audioState = {
    context: null,
    masterGain: null,
    musicGain: null,
    musicTimer: null,
    musicStep: 0,
    sfxGain: null
  };
  const achievements = [
    { score: 8, label: "Island Adventure Unlocked" },
    { score: 18, label: "Adults-Only Pool Veteran" },
    { score: 31, label: "Bahamas Blazer" }
  ];
  const mainMenuCopy = {
    title: "Bryan's Bonkers Cruise Dash",
    subtitle: "Pick a runner, choose a start level, load a perk, and hit Start Run. Open Settings for controls, audio, and help."
  };
  const menuState = {
    screen: "main"
  };
  const supabaseConfig = {
    url: "https://gzigwxvukzxyfphuzmmy.supabase.co",
    anonKey: window.__SUPABASE_ANON_KEY__ || "",
    storageKey: "bbcd:supabaseAnonKey"
  };
  const authState = {
    client: null,
    user: null,
    busy: false
  };
  const shareMeta = {
    ogImage: document.querySelector('meta[property="og:image"]'),
    ogImageAlt: document.querySelector('meta[property="og:image:alt"]'),
    ogImageWidth: document.querySelector('meta[property="og:image:width"]'),
    ogImageHeight: document.querySelector('meta[property="og:image:height"]'),
    twitterImage: document.querySelector('meta[name="twitter:image"]')
  };

  function inferAuthRedirectUrl() {
    const { origin } = window.location;
    if (origin === "http://localhost:8080") {
      return "http://localhost:8080/";
    }
    if (origin === "https://markcoleman.github.io") {
      return "https://markcoleman.github.io/bryan-fun/";
    }
    return `${origin}/`;
  }

  function readStoredAnonKey() {
    try {
      return window.localStorage.getItem(supabaseConfig.storageKey) || "";
    } catch (_) {
      return "";
    }
  }

  function getSupabaseAnonKey() {
    const fromStorage = readStoredAnonKey();
    return supabaseConfig.anonKey || fromStorage;
  }

  function stashAnonKeyFromUrl() {
    const url = new URL(window.location.href);
    const urlKey = url.searchParams.get("sbAnonKey");
    if (!urlKey) {
      return;
    }
    try {
      window.localStorage.setItem(supabaseConfig.storageKey, urlKey);
      url.searchParams.delete("sbAnonKey");
      window.history.replaceState({}, "", url.toString());
    } catch (_) {
      // Ignore storage errors and continue without persistence.
    }
  }

  function setAuthStatusMessage(message, isError = false) {
    if (!authStatus) {
      return;
    }
    authStatus.textContent = message;
    authStatus.style.color = isError ? "#ffb3ad" : "#d7eff9";
  }

  function setAuthBusy(isBusy) {
    authState.busy = isBusy;
    const disabled = isBusy || !authState.client;
    createAccountButton.disabled = disabled;
    signInButton.disabled = disabled;
    signOutButton.disabled = disabled || !authState.user;
  }

  function updateAuthUi() {
    if (!authState.client) {
      setAuthStatusMessage("Supabase not configured. Add window.__SUPABASE_ANON_KEY__ to enable account login.");
      setAuthBusy(false);
      createAccountButton.disabled = true;
      signInButton.disabled = true;
      signOutButton.disabled = true;
      return;
    }
    if (authState.user) {
      setAuthStatusMessage(`Signed in as ${authState.user.email || "account user"}.`);
      authEmailInput.value = authState.user.email || authEmailInput.value;
      signOutButton.disabled = authState.busy;
      return;
    }
    setAuthStatusMessage("Not signed in.");
    signOutButton.disabled = true;
  }

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

  const lazyAssetSources = {
    slide: imagePath("items/slide.png"),
    deck: imagePath("grounds/deck.png"),
    umbrella: imagePath("items/umbrella.png"),
    casinoBackground: imagePath("backgrounds/casino.png"),
    slotMachine: imagePath("items/slot-machine.png"),
    rescueDoctor: imagePath("npc/dr-m.png"),
    beachBackground: imagePath("backgrounds/beach-background.png"),
    beachGround: imagePath("grounds/beach.png"),
    bahamasGround: imagePath("grounds/bahamas.png"),
    miamiBackground: imagePath("backgrounds/miami-background.png"),
    miamiGround: imagePath("grounds/miami.png")
  };

  const requestedLazyAssets = new Set();

  function ensureLazyAssetLoaded(assetKey) {
    if (requestedLazyAssets.has(assetKey)) {
      return;
    }
    requestedLazyAssets.add(assetKey);
    assets[assetKey].src = lazyAssetSources[assetKey];
  }
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

  // Prime only core assets at startup; defer larger stage/background textures until needed.
  ensureLazyAssetLoaded("deck");
  ensureLazyAssetLoaded("umbrella");
  ensureLazyAssetLoaded("slide");
  ensureLazyAssetLoaded("rescueDoctor");
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
    coins: 0,
    lives: config.maxLives,
    checkpoint: {
      score: 0,
      speed: config.startSpeed,
      levelIndex: 0,
      nextAt: config.checkpointInterval
    },
    combo: {
      count: 0,
      timer: 0,
      multiplier: 1
    },
    speedBoostTimer: 0,
    levelIndex: 0,
    pendingLevelRestart: false,
    lastTime: 0,
    elapsed: 0,
    levelElapsed: 0,
    levelAnnouncement: {
      text: "",
      timer: 0
    },
    milestonePopup: {
      text: "",
      timer: 0
    },
    stats: {
      coinsCollected: 0,
      combosTriggered: 0,
      longestCombo: 0,
      questsCompleted: 0,
      rescueTokensUsed: 0
    },
    walls: [],
    obstacles: [],
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
    rescueTokens: 0,
    activePerk: "safe_landing",
    runSeed: 0,
    runStartLevel: 1,
    spawnDirector: {
      activeAct: 1,
      deck: [],
      cursor: 0,
      nextRiskGateAt: config.riskGateIntervalSeconds,
      rngState: 1,
      gateIndex: 0,
      actAnnouncementShown: false
    },
    challenge: {
      active: false,
      targetScore: 0,
      seed: 0,
      chainDepth: 0,
      beaten: false
    },
    invulnerableTime: 0
  };

  const runner = {
    width: 52,
    height: 64,
    slideHeight: 40,
    y: 0,
    vy: 0,
    onGround: true,
    jumpHeld: false,
    canDoubleJump: true,
    isSliding: false,
    slideTimer: 0,
    slideCooldown: 0,
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

  function randomBetween(min, max, rng = Math.random) {
    return min + rng() * (max - min);
  }

  function hashSeed(input) {
    const text = String(input ?? "");
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function setRunSeed(seed) {
    const safeSeed = Number.isFinite(seed) ? seed >>> 0 : hashSeed(`${Date.now()}-${Math.random()}`);
    world.runSeed = safeSeed;
    world.spawnDirector.rngState = safeSeed || 1;
  }

  function runRandom() {
    world.spawnDirector.rngState =
      (Math.imul(world.spawnDirector.rngState || 1, 1664525) + 1013904223) >>> 0;
    return (world.spawnDirector.rngState & 0xffffffff) / 0x100000000;
  }

  function getActivePerkConfig() {
    return perkCatalog[world.activePerk] || perkCatalog.safe_landing;
  }

  function getBaseCoyoteWindow() {
    const perk = getActivePerkConfig();
    return 0.1 * (perk.coyoteMultiplier || 1);
  }

  function getBonusSpawnChance() {
    const perk = getActivePerkConfig();
    return Math.min(0.9, config.bonusSpawnChance * (perk.bonusChanceMultiplier || 1));
  }

  function getCurrentLevel() {
    return levels[Math.max(0, Math.min(levels.length - 1, world.levelIndex))];
  }

  function normalizeLevelId(value, fallback = 1) {
    return clampLevelId(value, levels.length, fallback);
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

  function safeParseJson(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (_) {
      return fallback;
    }
  }

  function getPassLevelFromXp(xp) {
    const safeXp = Number.isFinite(xp) ? Math.max(0, xp) : 0;
    return Math.max(1, Math.floor(safeXp / config.passXpPerLevel) + 1);
  }

  function updateProfileFromRuntime() {
    const nextProfile = {
      ...profileState.data,
      pass: {
        ...profileState.data.pass,
        level: getPassLevelFromXp(profileState.data.pass?.xp || 0)
      },
      progression: {
        ...profileState.data.progression,
        maxUnlockedLevel: progressionState.maxUnlockedLevel,
        coinBank: progressionState.coinBank,
        unlockedCharacters: [...progressionState.unlockedCharacters]
      }
    };
    profileState.data = nextProfile;
  }

  function saveProfileState() {
    updateProfileFromRuntime();
    try {
      window.localStorage.setItem(
        progressionState.profileStorageKey,
        JSON.stringify(profileState.data)
      );
    } catch (_) {
      // Ignore persistence errors.
    }
  }

  function getLocalDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function hydrateDailyState() {
    const now = new Date();
    const todayKey = getLocalDateKey(now);
    const seed = getDailyQuestSeed(now, "voyage");
    dailyState.dateKey = todayKey;
    dailyState.seed = seed;
    dailyState.completedQuestIds = new Set();
    try {
      const parsed = safeParseJson(window.localStorage.getItem(dailyState.storageKey) || "{}", {});
      if (parsed?.dateKey === todayKey && Array.isArray(parsed.completedQuestIds)) {
        dailyState.completedQuestIds = new Set(parsed.completedQuestIds.map(String));
      }
      window.localStorage.setItem(
        dailyState.storageKey,
        JSON.stringify({
          dateKey: todayKey,
          seed,
          completedQuestIds: [...dailyState.completedQuestIds]
        })
      );
    } catch (_) {
      // Ignore local storage failures.
    }
  }

  function persistDailyState() {
    try {
      window.localStorage.setItem(
        dailyState.storageKey,
        JSON.stringify({
          dateKey: dailyState.dateKey,
          seed: dailyState.seed,
          completedQuestIds: [...dailyState.completedQuestIds]
        })
      );
    } catch (_) {
      // Ignore local storage failures.
    }
  }

  function hydrateChallengeHistory() {
    challengeState.history = { received: [], sent: [] };
    try {
      const parsed = safeParseJson(
        window.localStorage.getItem(challengeState.storageKey) || "{}",
        {}
      );
      if (Array.isArray(parsed.received)) {
        challengeState.history.received = parsed.received.slice(0, 20);
      }
      if (Array.isArray(parsed.sent)) {
        challengeState.history.sent = parsed.sent.slice(0, 20);
      }
    } catch (_) {
      // Ignore malformed history.
    }
  }

  function persistChallengeHistory() {
    try {
      window.localStorage.setItem(
        challengeState.storageKey,
        JSON.stringify({
          received: challengeState.history.received.slice(0, 20),
          sent: challengeState.history.sent.slice(0, 20)
        })
      );
    } catch (_) {
      // Ignore local storage failures.
    }
  }

  function recordChallengeHistory(direction, payload, outcome = "pending") {
    if (!payload) {
      return;
    }
    const bucket = direction === "sent" ? "sent" : "received";
    challengeState.history[bucket].unshift({
      at: Date.now(),
      outcome,
      seed: payload.seed,
      targetScore: payload.targetScore,
      runner: payload.runner,
      level: payload.level,
      chainDepth: payload.chainDepth || 0,
      expiresAt: payload.expiresAt
    });
    challengeState.history[bucket] = challengeState.history[bucket].slice(0, 20);
    persistChallengeHistory();
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
    saveProgressionMeta();
    refreshStartLevelOptions();
  }

  function hydrateProgressionState() {
    let snapshot = {};
    try {
      snapshot = {
        [progressionState.profileStorageKey]:
          window.localStorage.getItem(progressionState.profileStorageKey),
        [progressionState.storageKey]:
          window.localStorage.getItem(progressionState.storageKey),
        [progressionState.bankStorageKey]:
          window.localStorage.getItem(progressionState.bankStorageKey),
        [progressionState.unlockStorageKey]:
          window.localStorage.getItem(progressionState.unlockStorageKey)
      };
    } catch (_) {
      snapshot = {};
    }

    const migrationResult = migrateProfileV2(snapshot);
    profileState.data = migrationResult.profile;
    progressionState.maxUnlockedLevel = normalizeLevelId(
      profileState.data.progression?.maxUnlockedLevel,
      readMaxUnlockedLevel()
    );
    progressionState.selectedStartLevel = progressionState.maxUnlockedLevel;
    progressionState.coinBank = Math.max(0, Number.parseInt(profileState.data.progression?.coinBank || 0, 10) || 0);
    const unlocked = Array.isArray(profileState.data.progression?.unlockedCharacters)
      ? profileState.data.progression.unlockedCharacters.filter(isValidCharacter)
      : ["bryan"];
    progressionState.unlockedCharacters = new Set(["bryan", ...unlocked]);

    world.activePerk = profileState.data.perks?.selected || "safe_landing";
    if (!perkCatalog[world.activePerk]) {
      world.activePerk = "safe_landing";
    }
    refreshStartLevelOptions();
    saveProgressionMeta();
    hydrateDailyState();
    hydrateChallengeHistory();
  }

  function saveProgressionMeta() {
    updateProfileFromRuntime();
    profileState.data.perks = {
      ...profileState.data.perks,
      selected: world.activePerk
    };
    profileState.data.pass.level = getPassLevelFromXp(profileState.data.pass.xp || 0);
    try {
      window.localStorage.setItem(progressionState.bankStorageKey, String(progressionState.coinBank));
      window.localStorage.setItem(
        progressionState.unlockStorageKey,
        JSON.stringify([...progressionState.unlockedCharacters])
      );
      window.localStorage.setItem(
        progressionState.storageKey,
        String(progressionState.maxUnlockedLevel)
      );
      window.localStorage.setItem(
        progressionState.profileStorageKey,
        JSON.stringify(profileState.data)
      );
    } catch (_) {
      // Ignore local storage persistence errors.
    }
  }

  function getPerkOptions() {
    const unlocked = new Set(profileState.data.perks?.unlocked || []);
    return Object.values(perkCatalog).filter((perk) => unlocked.has(perk.id));
  }

  function updatePerkUi() {
    if (!perkSelect || !perkDetails) {
      return;
    }
    const options = getPerkOptions();
    perkSelect.innerHTML = "";
    options.forEach((perk) => {
      const option = document.createElement("option");
      option.value = perk.id;
      option.textContent = perk.name;
      perkSelect.appendChild(option);
    });
    if (!options.length) {
      const fallback = document.createElement("option");
      fallback.value = "safe_landing";
      fallback.textContent = perkCatalog.safe_landing.name;
      perkSelect.appendChild(fallback);
      world.activePerk = "safe_landing";
    }
    if (!options.some((perk) => perk.id === world.activePerk)) {
      world.activePerk = options[0]?.id || "safe_landing";
    }
    perkSelect.value = world.activePerk;
    const perk = getActivePerkConfig();
    perkDetails.textContent = `${perk.name}: ${perk.detail}`;
  }

  function toQuestTitle(template, target) {
    return template.title.replace("{target}", String(target));
  }

  function buildQuestFromTemplate(template, seed, index, origin = "run") {
    const questRng = hashSeed(`${seed}:${template.key}:${index}`);
    const targetIndex = questRng % template.targets.length;
    const target = template.targets[targetIndex];
    return {
      id: `${origin}:${template.key}:${target}:${index}`,
      key: template.key,
      metric: template.metric,
      target,
      rewardXp: template.rewardXp + (origin === "daily" ? 18 : 0),
      rewardCoins: template.rewardCoins + (origin === "daily" ? 4 : 0),
      title: toQuestTitle(template, target),
      origin
    };
  }

  function buildQuestSet(seed, count, origin = "run") {
    const pool = [...voyageQuestTemplates];
    const quests = [];
    for (let index = 0; index < count && pool.length; index += 1) {
      const pickIndex = hashSeed(`${seed}:${origin}:${index}`) % pool.length;
      const [template] = pool.splice(pickIndex, 1);
      quests.push(buildQuestFromTemplate(template, seed, index, origin));
    }
    return quests;
  }

  function getQuestMetricValue(metric) {
    if (metric === "coinsCollected") {
      return world.stats.coinsCollected;
    }
    if (metric === "longestCombo") {
      return world.stats.longestCombo;
    }
    if (metric === "score") {
      return world.score;
    }
    if (metric === "levelReached") {
      return world.levelIndex + 1;
    }
    if (metric === "survivalSeconds") {
      return Math.floor(world.elapsed);
    }
    return 0;
  }

  function getQuestProgressText(quest) {
    const current = Math.min(quest.target, getQuestMetricValue(quest.metric));
    return `${current}/${quest.target}`;
  }

  function updateMetaPanels() {
    // Progression systems still update and surface in post-run stats,
    // but they no longer occupy persistent menu real estate.
  }

  function grantPassRewards({ xp = 0, coins = 0, reason = "" } = {}) {
    const safeXp = Math.max(0, Number.parseInt(xp, 10) || 0);
    const safeCoins = Math.max(0, Number.parseInt(coins, 10) || 0);
    const previousLevel = getPassLevelFromXp(profileState.data.pass?.xp || 0);
    profileState.data.pass.xp = (profileState.data.pass?.xp || 0) + safeXp;
    if (safeCoins > 0) {
      progressionState.coinBank += safeCoins;
    }
    const nextLevel = getPassLevelFromXp(profileState.data.pass.xp || 0);
    profileState.data.pass.unlockedPerkSlots = nextLevel >= 8 ? 3 : nextLevel >= 4 ? 2 : 1;
    if (nextLevel > previousLevel) {
      showMilestonePopup(`Cruise Pass up! Level ${nextLevel}`);
    } else if (reason) {
      showMilestonePopup(`${reason} +${safeXp} XP`);
    }
    saveProgressionMeta();
    updateCharacterUi();
    updateMetaPanels();
  }

  function buildRunQuests(seed) {
    questState.runQuests = buildQuestSet(seed, config.runQuestCount, "run");
    questState.completedRunQuestIds = new Set();
    questState.comboShieldUsed = false;
  }

  function buildDailyQuests() {
    questState.dailyQuests = buildQuestSet(dailyState.seed, 3, "daily");
  }

  function completeQuest(quest, completedSet) {
    if (!quest || completedSet.has(quest.id)) {
      return;
    }
    completedSet.add(quest.id);
    world.stats.questsCompleted += 1;
    grantPassRewards({
      xp: quest.rewardXp,
      coins: quest.rewardCoins,
      reason: `${quest.origin === "daily" ? "Daily" : "Voyage"} quest clear`
    });
  }

  function evaluateQuestProgress() {
    questState.runQuests.forEach((quest) => {
      if (questState.completedRunQuestIds.has(quest.id)) {
        return;
      }
      if (getQuestMetricValue(quest.metric) >= quest.target) {
        completeQuest(quest, questState.completedRunQuestIds);
      }
    });
    questState.dailyQuests.forEach((quest) => {
      if (dailyState.completedQuestIds.has(quest.id)) {
        return;
      }
      if (getQuestMetricValue(quest.metric) >= quest.target) {
        completeQuest(quest, dailyState.completedQuestIds);
        persistDailyState();
      }
    });
  }

  function getRunnerHitboxHeight() {
    return runner.isSliding ? runner.slideHeight : runner.height;
  }

  function readAccessibilityState() {
    try {
      const storedScheme = window.localStorage.getItem(accessibilityState.controlsStorageKey);
      if (storedScheme === "left" || storedScheme === "right") {
        accessibilityState.controlScheme = storedScheme;
      }
      const storedSpeed = Number.parseFloat(
        window.localStorage.getItem(accessibilityState.speedStorageKey) || "1"
      );
      if (Number.isFinite(storedSpeed) && storedSpeed >= 0.7 && storedSpeed <= 1.3) {
        accessibilityState.speedScale = storedSpeed;
      }
      accessibilityState.highContrast =
        window.localStorage.getItem(accessibilityState.contrastStorageKey) === "1";
      const storedMusic = Number.parseFloat(
        window.localStorage.getItem(accessibilityState.musicVolumeStorageKey) || "0.7"
      );
      const storedSfx = Number.parseFloat(
        window.localStorage.getItem(accessibilityState.sfxVolumeStorageKey) || "0.8"
      );
      if (Number.isFinite(storedMusic) && storedMusic >= 0 && storedMusic <= 1) {
        accessibilityState.musicVolume = storedMusic;
      }
      if (Number.isFinite(storedSfx) && storedSfx >= 0 && storedSfx <= 1) {
        accessibilityState.sfxVolume = storedSfx;
      }
    } catch (_) {
      // Ignore local storage errors and keep defaults.
    }
  }

  function saveAccessibilityState() {
    try {
      window.localStorage.setItem(
        accessibilityState.controlsStorageKey,
        accessibilityState.controlScheme
      );
      window.localStorage.setItem(
        accessibilityState.speedStorageKey,
        String(accessibilityState.speedScale)
      );
      window.localStorage.setItem(
        accessibilityState.contrastStorageKey,
        accessibilityState.highContrast ? "1" : "0"
      );
      window.localStorage.setItem(
        accessibilityState.musicVolumeStorageKey,
        String(accessibilityState.musicVolume)
      );
      window.localStorage.setItem(
        accessibilityState.sfxVolumeStorageKey,
        String(accessibilityState.sfxVolume)
      );
    } catch (_) {
      // Ignore local storage errors.
    }
  }

  function applyAccessibilityUi() {
    controlSchemeSelect.value = accessibilityState.controlScheme;
    speedScaleSelect.value = String(accessibilityState.speedScale);
    contrastToggle.checked = accessibilityState.highContrast;
    musicVolumeRange.value = String(Math.round(accessibilityState.musicVolume * 100));
    sfxVolumeRange.value = String(Math.round(accessibilityState.sfxVolume * 100));
    document.body.classList.toggle("high-contrast", accessibilityState.highContrast);
  }

  function ensureAudioContext() {
    if (audioState.context) {
      return audioState.context;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return null;
    }
    const context = new AudioCtx();
    const masterGain = context.createGain();
    masterGain.gain.value = 0.24;
    masterGain.connect(context.destination);

    const musicGain = context.createGain();
    musicGain.gain.value = 0.18 * accessibilityState.musicVolume;
    musicGain.connect(masterGain);
    const sfxGain = context.createGain();
    sfxGain.gain.value = 0.24 * accessibilityState.sfxVolume;
    sfxGain.connect(masterGain);

    audioState.context = context;
    audioState.masterGain = masterGain;
    audioState.musicGain = musicGain;
    audioState.sfxGain = sfxGain;
    return context;
  }

  function playTone({ frequency, duration = 0.12, type = "sine", volume = 0.1, when = 0 }) {
    const context = ensureAudioContext();
    if (!context || accessibilityState.sfxVolume <= 0) {
      return;
    }
    const startTime = context.currentTime + when;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.connect(gainNode);
    gainNode.connect(audioState.sfxGain || audioState.masterGain);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
  }

  function playJumpSfx() {
    playTone({ frequency: 480, duration: 0.1, type: "triangle", volume: 0.08 });
  }

  function playCollectSfx() {
    playTone({ frequency: 740, duration: 0.08, type: "sine", volume: 0.06 });
    playTone({ frequency: 980, duration: 0.11, type: "sine", volume: 0.05, when: 0.03 });
  }

  function playLevelUpSfx() {
    playTone({ frequency: 520, duration: 0.1, type: "triangle", volume: 0.08 });
    playTone({ frequency: 660, duration: 0.12, type: "triangle", volume: 0.07, when: 0.06 });
    playTone({ frequency: 880, duration: 0.14, type: "triangle", volume: 0.06, when: 0.12 });
  }

  function playHitSfx() {
    playTone({ frequency: 170, duration: 0.16, type: "sawtooth", volume: 0.09 });
  }

  function burstCelebration({
    particleCount = 70,
    spread = 80,
    originY = 0.65
  } = {}) {
    if (typeof confetti !== "function") {
      return;
    }
    confetti({
      particleCount,
      spread,
      startVelocity: 38,
      scalar: 0.95,
      ticks: 220,
      origin: { y: originY }
    });
  }

  function startMusicLoop() {
    const context = ensureAudioContext();
    if (!context || audioState.musicTimer || accessibilityState.musicVolume <= 0) {
      return;
    }
    const progression = [
      [220, 277, 330],
      [196, 247, 294],
      [247, 311, 370],
      [174, 220, 262]
    ];
    audioState.musicStep = 0;
    audioState.musicTimer = window.setInterval(() => {
      if (accessibilityState.musicVolume <= 0) {
        return;
      }
      const chord = progression[audioState.musicStep % progression.length];
      chord.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(frequency, context.currentTime);
        gainNode.gain.value = 0.0001;
        gainNode.gain.exponentialRampToValueAtTime(0.028 - index * 0.004, context.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.55);
        oscillator.connect(gainNode);
        gainNode.connect(audioState.musicGain);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.58);
      });
      playTone({ frequency: 110, duration: 0.09, type: "sine", volume: 0.03 });
      audioState.musicStep += 1;
    }, 620);
  }

  function stopMusicLoop() {
    if (audioState.musicTimer) {
      window.clearInterval(audioState.musicTimer);
      audioState.musicTimer = null;
    }
  }

  function updateCheckpoint(force = false) {
    if (!force && world.score < world.checkpoint.nextAt) {
      return;
    }
    world.checkpoint.score = world.score;
    world.checkpoint.speed = world.speed;
    world.checkpoint.levelIndex = world.levelIndex;
    world.checkpoint.nextAt = world.score + config.checkpointInterval;
  }

  function restoreCheckpointAfterHit() {
    if (world.lives <= 0) {
      endRun();
      return;
    }
    world.score = world.checkpoint.score;
    world.speed = Math.max(config.startSpeed, world.checkpoint.speed);
    world.levelIndex = world.checkpoint.levelIndex;
    world.combo.count = 0;
    world.combo.timer = 0;
    world.combo.multiplier = 1;
    world.speedBoostTimer = 0;
    restartStageForCurrentLevel();
    world.invulnerableTime = Math.max(world.invulnerableTime, 1.3);
    updateHud();
  }

  function getCurrentTheme() {
    return getCurrentLevel().theme || levels[0].theme;
  }

  function isParallaxTextureLevel() {
    return world.levelIndex === 1 || world.levelIndex === 2 || world.levelIndex === 4;
  }

  function getParallaxBackgroundTexture() {
    if (world.levelIndex === 1 || world.levelIndex === 2) {
      ensureLazyAssetLoaded("beachBackground");
    }
    if ((world.levelIndex === 1 || world.levelIndex === 2) && assets.beachBackgroundReady) {
      return assets.beachBackground;
    }
    if (world.levelIndex === 4) {
      ensureLazyAssetLoaded("miamiBackground");
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
    if (world.levelIndex === 1) {
      ensureLazyAssetLoaded("beachGround");
    }
    if (world.levelIndex === 1 && assets.beachGroundReady) {
      return assets.beachGround;
    }
    if (world.levelIndex === 2) {
      ensureLazyAssetLoaded("bahamasGround");
    }
    if (world.levelIndex === 2 && assets.bahamasGroundReady) {
      return assets.bahamasGround;
    }
    if (world.levelIndex === 4) {
      ensureLazyAssetLoaded("miamiGround");
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
    playLevelUpSfx();
    burstCelebration({ particleCount: 92, spread: 92, originY: 0.58 });
  }

  function restartStageForCurrentLevel() {
    world.cameraX = 0;
    world.walls.length = 0;
    world.obstacles.length = 0;
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
    runner.canDoubleJump = true;
    runner.isSliding = false;
    runner.slideTimer = 0;
    runner.slideCooldown = 0;
    runner.coyoteTime = getBaseCoyoteWindow();
    runner.jumpBuffer = 0;
    runner.tilt = 0;

    ensureSpawnDirectorAct();
    ensureGenerated();
  }

  function applyStartingLevel(levelId) {
    const normalizedId = normalizeLevelId(levelId, 1);
    const startingIndex = normalizedId - 1;
    world.levelIndex = startingIndex;
    world.score = getLevelStartScore(startingIndex);
    world.coins = 0;
    world.lives = config.maxLives;
    world.combo.count = 0;
    world.combo.timer = 0;
    world.combo.multiplier = 1;
    world.speedBoostTimer = 0;
    world.checkpoint.score = world.score;
    world.checkpoint.speed = world.speed;
    world.checkpoint.levelIndex = world.levelIndex;
    world.checkpoint.nextAt = world.score + config.checkpointInterval;
    restartStageForCurrentLevel();
    world.invulnerableTime = 0;
    world.levelAnnouncement.text = "";
    world.levelAnnouncement.timer = 0;
    world.milestonePopup.text = "";
    world.milestonePopup.timer = 0;
    world.stats.coinsCollected = 0;
    world.stats.combosTriggered = 0;
    world.stats.longestCombo = 0;
    world.stats.questsCompleted = 0;
    world.stats.rescueTokensUsed = 0;
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

  function hasUnseenReleaseNotes() {
    const lastSeenVersion = readLastSeenVersion();
    if (!lastSeenVersion) {
      return true;
    }
    return compareVersions(lastSeenVersion, releaseState.currentVersion) < 0;
  }

  function updateHelpButtonLabel() {
    if (!helpButton) {
      return;
    }
    const hasUnseen = hasUnseenReleaseNotes();
    helpButton.textContent = hasUnseen ? "Open Help & Notes (New)" : "Open Help & Notes";
    helpButton.dataset.fresh = hasUnseen ? "true" : "false";
  }

  function getNotesSince(version) {
    if (!version) {
      return [...releaseState.notes];
    }
    return getNotesSinceVersion(version, releaseState.notes).filter(
      (note) => compareVersions(note.version, releaseState.currentVersion) <= 0
    );
  }

  function renderNotesList(notes) {
    notesScrollRegion.innerHTML = "";
    const fragment = document.createDocumentFragment();
    const sortedNotes = [...notes].sort((a, b) => {
      const versionDiff = compareVersions(b.version, a.version);
      if (versionDiff !== 0) {
        return versionDiff;
      }
      return String(b.date || "").localeCompare(String(a.date || ""));
    });

    sortedNotes.forEach((note) => {
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
    updateHelpButtonLabel();
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
    updateHelpButtonLabel();
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
    world.coins = 0;
    world.lives = config.maxLives;
    world.checkpoint.score = 0;
    world.checkpoint.speed = config.startSpeed;
    world.checkpoint.levelIndex = 0;
    world.checkpoint.nextAt = config.checkpointInterval;
    world.combo.count = 0;
    world.combo.timer = 0;
    world.combo.multiplier = 1;
    world.speedBoostTimer = 0;
    world.levelIndex = 0;
    world.pendingLevelRestart = false;
    world.elapsed = 0;
    world.levelElapsed = 0;
    world.lastTime = 0;
    world.levelAnnouncement.text = "";
    world.levelAnnouncement.timer = 0;
    world.milestonePopup.text = "";
    world.milestonePopup.timer = 0;
    world.stats.coinsCollected = 0;
    world.stats.combosTriggered = 0;
    world.stats.longestCombo = 0;
    world.stats.questsCompleted = 0;
    world.stats.rescueTokensUsed = 0;
    world.walls.length = 0;
    world.obstacles.length = 0;
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
    world.rescueTokens = 0;
    world.spawnDirector.activeAct = 1;
    world.spawnDirector.deck = [];
    world.spawnDirector.cursor = 0;
    world.spawnDirector.nextRiskGateAt = config.riskGateIntervalSeconds;
    world.spawnDirector.gateIndex = 0;
    world.spawnDirector.actAnnouncementShown = false;
    world.invulnerableTime = 0;

    runner.y = world.groundY - runner.height;
    runner.vy = 0;
    runner.onGround = true;
    runner.canDoubleJump = true;
    runner.isSliding = false;
    runner.slideTimer = 0;
    runner.slideCooldown = 0;
    runner.jumpHeld = false;
    runner.coyoteTime = getBaseCoyoteWindow();
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
    url.searchParams.set("runner", currentCharacter);
    url.searchParams.set("character", currentCharacter);
    url.searchParams.delete("challenge");
    return url.toString();
  }

  function buildChallengePayload(targetScore, options = {}) {
    const createdAt = Number.isFinite(options.createdAt) ? options.createdAt : Date.now();
    const expiresAt = Number.isFinite(options.expiresAt)
      ? options.expiresAt
      : createdAt + config.challengeDefaultHours * 60 * 60 * 1000;
    const previousChainDepth = challengeState.active?.chainDepth || 0;
    return {
      version: CHALLENGE_CURRENT_VERSION,
      seed: Number.isFinite(options.seed) ? options.seed : world.runSeed || hashSeed(`${createdAt}:${targetScore}`),
      targetScore: Math.max(0, Math.floor(targetScore)),
      runner: options.runner || currentCharacter,
      level: normalizeLevelId(options.level || getSelectedStartLevelId(), 1),
      createdAt,
      expiresAt,
      chainDepth: Number.isFinite(options.chainDepth) ? options.chainDepth : previousChainDepth + 1
    };
  }

  function buildChallengeUrl(payload) {
    const encoded = encodeChallengePayload(payload);
    const url = new URL(window.location.href);
    url.searchParams.set("challenge", encoded);
    url.searchParams.set("runner", payload.runner || currentCharacter);
    url.searchParams.set("character", payload.runner || currentCharacter);
    url.searchParams.delete("score");
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

  function clearActiveChallenge(options = {}) {
    const { stripUrl = true } = options;
    challengeState.active = null;
    if (stripUrl) {
      const url = new URL(window.location.href);
      if (url.searchParams.has("challenge")) {
        url.searchParams.delete("challenge");
        window.history.replaceState(null, "", url.toString());
      }
    }
    updateMetaPanels();
  }

  function parseChallengeFromUrl() {
    const url = new URL(window.location.href);
    const encoded = url.searchParams.get("challenge");
    if (!encoded) {
      clearActiveChallenge({ stripUrl: false });
      return;
    }
    const decoded = decodeChallengePayload(encoded, {
      supportedVersions: [CHALLENGE_CURRENT_VERSION]
    });
    if (!decoded.ok || !decoded.payload) {
      clearActiveChallenge({ stripUrl: true });
      if (decoded.error === "expired") {
        showMilestonePopup("Challenge expired. Generating a fresh run.");
      }
      return;
    }
    challengeState.active = decoded.payload;
    if (isValidCharacter(challengeState.active.runner)) {
      currentCharacter = challengeState.active.runner;
      progressionState.unlockedCharacters.add(challengeState.active.runner);
    }
    unlockLevel(challengeState.active.level);
    progressionState.selectedStartLevel = normalizeLevelId(challengeState.active.level, 1);
    refreshStartLevelOptions();
    recordChallengeHistory("received", challengeState.active, "loaded");
    updateMetaPanels();
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
    shareLink.dataset.mode = "";
    shareLink.dataset.target = "";
  }

  function showShareLink({ score = 0, mode = "score", url = "", target = null }) {
    const safeMode = mode === "challenge" ? "challenge" : "score";
    const shareUrl = url || (safeMode === "challenge" ? buildChallengeUrl(buildChallengePayload(score)) : buildShareUrl(score));
    shareLink.href = shareUrl;
    shareLink.dataset.score = String(score);
    shareLink.dataset.mode = safeMode;
    shareLink.dataset.target = Number.isFinite(target) ? String(target) : "";
    shareLink.textContent =
      safeMode === "challenge"
        ? `Send Challenge: Beat ${score}`
        : `Share Score: ${score}`;
    shareLink.classList.remove("hidden");
  }

  function refreshShareLinkForCharacter() {
    if (shareLink.classList.contains("hidden")) {
      return;
    }
    const mode = shareLink.dataset.mode || "score";
    const score = Number.parseInt(shareLink.dataset.score || "", 10);
    if (!Number.isFinite(score)) {
      return;
    }
    if (mode === "challenge") {
      const target = Number.parseInt(shareLink.dataset.target || "", 10);
      const payload = buildChallengePayload(score, {
        runner: currentCharacter,
        level: getSelectedStartLevelId(),
        chainDepth: Number.isFinite(challengeState.active?.chainDepth) ? challengeState.active.chainDepth + 1 : 1
      });
      if (Number.isFinite(target)) {
        payload.targetScore = target;
      }
      shareLink.href = buildChallengeUrl(payload);
      return;
    }
    shareLink.href = buildShareUrl(score);
  }

  function showOverlay(title, subtitle, buttonText, shareData = null, options = {}) {
    const { layout = "compact", preserveStats = false } = options;
    titleEl.textContent = title;
    subtitleEl.textContent = subtitle;
    actionButton.textContent = buttonText;
    overlay.dataset.layout = layout;
    if (Number.isFinite(shareData)) {
      showShareLink({ score: shareData, mode: "score" });
    } else if (shareData && typeof shareData === "object") {
      showShareLink(shareData);
    } else {
      hideShareLink();
    }
    if (!preserveStats && !Number.isFinite(shareData) && !(shareData && typeof shareData === "object")) {
      runStats.classList.add("hidden");
      runStats.innerHTML = "";
    }
    revealScreen(overlay);
    updateCharacterUi();
  }

  function setMenuScreen(screen, options = {}) {
    const { focus = null } = options;
    const nextScreen = screen === "settings" ? "settings" : "main";
    menuState.screen = nextScreen;
    mainMenuScreen?.classList.toggle("hidden", nextScreen !== "main");
    settingsMenuScreen?.classList.toggle("hidden", nextScreen !== "settings");
    settingsButton?.setAttribute("aria-expanded", String(nextScreen === "settings"));
    if (focus === "settings" && nextScreen === "settings") {
      settingsBackButton?.focus();
    } else if (focus === "main" && nextScreen === "main") {
      settingsButton?.focus();
    }
  }

  function hideOverlay() {
    concealScreen(overlay);
  }

  function revealScreen(element) {
    element.classList.remove("hidden");
    requestAnimationFrame(() => {
      element.classList.add("is-visible");
    });
  }

  function concealScreen(element) {
    element.classList.remove("is-visible");
    window.setTimeout(() => {
      if (!element.classList.contains("is-visible")) {
        element.classList.add("hidden");
      }
    }, config.screenTransitionMs);
  }

  function showMainMenu() {
    stopMusicLoop();
    resetWorld();
    applyStartingLevel(challengeState.active ? challengeState.active.level : getSelectedStartLevelId());
    world.mode = "ready";
    setMenuScreen("main");
    buildDailyQuests();
    updatePerkUi();
    updateMetaPanels();
    updateHelpButtonLabel();
    const subtitle = challengeState.active
      ? `Challenge loaded: beat ${challengeState.active.targetScore} with ${challengeState.active.runner} on Level ${challengeState.active.level}.`
      : mainMenuCopy.subtitle;
    showOverlay(mainMenuCopy.title, subtitle, "Start Run", null, { layout: "start" });
  }

  function showSplashScreen() {
    world.mode = "splash";
    hideOverlay();
    revealScreen(splashScreen);
    splashContinueButton.focus();
  }

  function dismissSplashToMainMenu() {
    if (world.mode !== "splash") {
      return;
    }
    concealScreen(splashScreen);
    showMainMenu();
    maybeShowWhatsNew();
  }

  function startRun() {
    startMusicLoop();
    const selectedPerk = String(perkSelect?.value || world.activePerk || "safe_landing");
    if (perkCatalog[selectedPerk]) {
      world.activePerk = selectedPerk;
    }
    const selectedStartLevel = getSelectedStartLevelId();
    let runChallenge = challengeState.active;
    if (runChallenge) {
      const challengeLevel = normalizeLevelId(runChallenge.level, selectedStartLevel);
      const challengeRunner = isValidCharacter(runChallenge.runner) ? runChallenge.runner : currentCharacter;
      if (selectedStartLevel !== challengeLevel || currentCharacter !== challengeRunner) {
        clearActiveChallenge({ stripUrl: true });
        runChallenge = null;
      }
    }
    if (runChallenge && isValidCharacter(runChallenge.runner)) {
      currentCharacter = runChallenge.runner;
    }
    const startLevelId = runChallenge
      ? normalizeLevelId(runChallenge.level, selectedStartLevel)
      : selectedStartLevel;
    const seededRun = runChallenge
      ? Number.parseInt(runChallenge.seed, 10)
      : hashSeed(`${Date.now()}-${currentCharacter}-${startLevelId}`);
    setRunSeed(seededRun);
    world.runStartLevel = startLevelId;
    world.challenge.active = Boolean(runChallenge);
    world.challenge.targetScore = runChallenge?.targetScore || 0;
    world.challenge.seed = runChallenge?.seed || seededRun;
    world.challenge.chainDepth = runChallenge?.chainDepth || 0;
    world.challenge.beaten = false;
    world.spawnDirector.nextRiskGateAt = config.riskGateIntervalSeconds;
    world.spawnDirector.gateIndex = 0;
    world.spawnDirector.actAnnouncementShown = false;
    world.rescueTokens = 0;
    questState.comboShieldUsed = false;
    buildRunQuests(seededRun);
    buildDailyQuests();

    resetWorld();
    world.spawnDirector.activeAct = 1;
    world.spawnDirector.deck = buildPatternDeck(world.runSeed, 1);
    world.spawnDirector.cursor = 0;
    applyStartingLevel(startLevelId);
    world.mode = "running";
    hideOverlay();
    updateHud();
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
    stopMusicLoop();
    const preset = getActivePreset();
    const level = getCurrentLevel();
    const earnedAchievements = achievements
      .filter((entry) => world.score >= entry.score)
      .map((entry) => entry.label);
    const nextDestinationHint = Number.isFinite(level.nextScore)
      ? `${Math.max(0, level.nextScore - world.score)} more points unlocks Level ${level.id + 1}.`
      : "You reached the final destination.";
    const achievementText = earnedAchievements.length
      ? ` Achievements: ${earnedAchievements.join(", ")}.`
      : "";
    progressionState.coinBank += world.coins;
    const runBaseXp = Math.max(12, world.score * 2 + world.stats.coinsCollected);
    grantPassRewards({ xp: runBaseXp, coins: 0, reason: "Run complete" });

    const priorBest = Number.parseInt(profileState.data.personalBests?.overall || 0, 10) || 0;
    const isPersonalBest = world.score > priorBest;
    if (isPersonalBest) {
      profileState.data.personalBests.overall = world.score;
      profileState.data.personalBests.byRunner = {
        ...profileState.data.personalBests.byRunner,
        [currentCharacter]: Math.max(
          world.score,
          Number.parseInt(profileState.data.personalBests.byRunner?.[currentCharacter] || 0, 10) || 0
        )
      };
    }

    const clearedDestinations = new Set(profileState.data.progression?.clearedDestinations || []);
    const firstDestinationClear = !clearedDestinations.has(level.id);
    if (firstDestinationClear) {
      clearedDestinations.add(level.id);
      profileState.data.progression.clearedDestinations = [...clearedDestinations];
    }

    let challengeOutcomeText = "No challenge active.";
    let challengeShareData = null;
    let challengeBeaten = false;
    if (world.challenge.active && challengeState.active) {
      challengeBeaten = world.score > challengeState.active.targetScore;
      world.challenge.beaten = challengeBeaten;
      challengeOutcomeText = challengeBeaten
        ? `Challenge beaten: ${world.score} > ${challengeState.active.targetScore}.`
        : `Challenge missed: ${world.score} / ${challengeState.active.targetScore}.`;
      recordChallengeHistory(
        "received",
        challengeState.active,
        challengeBeaten ? "beaten" : "missed"
      );
      if (challengeBeaten) {
        const rematchPayload = buildChallengePayload(world.score, {
          seed: hashSeed(`${world.runSeed}:${Date.now()}:${world.score}`),
          level: level.id,
          runner: currentCharacter,
          chainDepth: (challengeState.active.chainDepth || 0) + 1
        });
        const rematchUrl = buildChallengeUrl(rematchPayload);
        challengeShareData = {
          mode: "challenge",
          score: world.score,
          target: rematchPayload.targetScore,
          url: rematchUrl
        };
        recordChallengeHistory("sent", rematchPayload, "rematch");
      }
      clearActiveChallenge({ stripUrl: true });
    }

    const challengeCardPayload = buildChallengePayload(world.score, {
      level: level.id,
      runner: currentCharacter,
      chainDepth: world.challenge.chainDepth + 1
    });
    const challengeCardUrl = buildChallengeUrl(challengeCardPayload);
    recordChallengeHistory("sent", challengeCardPayload, "created");

    saveProgressionMeta();
    updateMetaPanels();
    const achievementProgress = achievements
      .map((entry) => `${entry.label}: ${Math.min(100, Math.round((world.score / entry.score) * 100))}%`)
      .join(" | ");
    const runQuestLines = questState.runQuests
      .map((quest) => {
        const done = questState.completedRunQuestIds.has(quest.id);
        return `${done ? "✓" : "•"} ${quest.title} (${getQuestProgressText(quest)})`;
      })
      .join("<br>");
    const dailyQuestLines = questState.dailyQuests
      .map((quest) => {
        const done = dailyState.completedQuestIds.has(quest.id);
        return `${done ? "✓" : "•"} ${quest.title} (${getQuestProgressText(quest)})`;
      })
      .join("<br>");
    runStats.innerHTML = `
      <h3>Run Statistics</h3>
      <p>Coins this run: ${world.coins} (Bank: ${progressionState.coinBank})</p>
      <p>Combos triggered: ${world.stats.combosTriggered} · Longest streak: ${world.stats.longestCombo}</p>
      <p>Rescue tokens used: ${world.stats.rescueTokensUsed} · Quests completed this run: ${world.stats.questsCompleted}</p>
      <p>Achievement progress: ${achievementProgress}</p>
      <p>Voyage Quests:<br>${runQuestLines || "No run quests tracked."}</p>
      <p>Daily Quests:<br>${dailyQuestLines || "No daily quests tracked."}</p>
      <p>Challenge: ${challengeOutcomeText}</p>
      <p>Beat Me Link: <a href="${challengeCardUrl}" target="_blank" rel="noopener">Send challenge</a></p>
    `;
    runStats.classList.remove("hidden");
    world.mode = "gameOver";
    if (world.score >= achievements[0].score) {
      burstCelebration({ particleCount: 120, spread: 108, originY: 0.52 });
    }
    const shareReasons = [];
    if (isPersonalBest) {
      shareReasons.push("personal best");
    }
    if (firstDestinationClear) {
      shareReasons.push("first destination clear");
    }
    if (challengeBeaten) {
      shareReasons.push("friend challenge win");
    }
    const sharePrompt = challengeShareData ||
      (shareReasons.length
        ? {
          mode: "challenge",
          score: world.score,
          target: challengeCardPayload.targetScore,
          url: challengeCardUrl
        }
        : null);

    showOverlay(
      "Run Over",
      `You reached Level ${level.id} (${level.name}) with ${preset.name}. Final score: ${world.score}. ${nextDestinationHint}${achievementText}${shareReasons.length ? ` Share unlocked (${shareReasons.join(", ")}).` : ""}`,
      "Quick Restart",
      sharePrompt,
      { preserveStats: true }
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
    runner.canDoubleJump = true;
    runner.isSliding = false;
    runner.slideTimer = 0;
    runner.coyoteTime = getBaseCoyoteWindow();
    runner.jumpBuffer = 0;
    world.mode = "running";
  }

  function updateRescue(dt) {
    world.elapsed += dt;
    evaluateQuestProgress();
    updateHud();
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
    if (world.rescueTokens <= 0) {
      return false;
    }
    world.rescueTokens = Math.max(0, world.rescueTokens - 1);
    world.stats.rescueTokensUsed += 1;
    if (cause === "wall") {
      clearCollidingWall(collisionData);
    } else if (cause === "slide") {
      world.slide.active = false;
    }
    runner.vy = 0;
    runner.onGround = true;
    runner.coyoteTime = 0;
    world.mode = "rescue";
    showMilestonePopup("Rescue Token used!");
    updateHud();
    setupRescueDoctor();
    return true;
  }

  function queueJump() {
    if (world.mode === "splash") {
      dismissSplashToMainMenu();
      return;
    }
    if (world.mode === "ready" || world.mode === "gameOver") {
      startRun();
      return;
    }
    if (world.mode !== "running") {
      return;
    }
    runner.jumpHeld = true;
    runner.jumpBuffer = 0.12;
    attemptJump();
  }

  function releaseJump() {
    runner.jumpHeld = false;
    if (runner.vy < -config.shortHopCutoffVelocity) {
      runner.vy *= config.shortHopReleaseDampen;
    }
  }

  function queueSlide() {
    if (world.mode !== "running" || !runner.onGround || runner.slideCooldown > 0) {
      return;
    }
    const slideDuration = config.slideDuration * (getActivePreset().slideDurationMultiplier || 1);
    runner.isSliding = true;
    runner.slideTimer = slideDuration;
    runner.slideCooldown = config.slideCooldown + slideDuration;
  }

  function attemptJump() {
    if (runner.jumpBuffer <= 0) {
      return;
    }
    if (runner.onGround || runner.coyoteTime > 0) {
      runner.vy = -config.jumpVelocity * getActivePreset().jumpVelocityMultiplier;
      playJumpSfx();
      runner.onGround = false;
      runner.canDoubleJump = true;
      runner.coyoteTime = 0;
      runner.jumpBuffer = 0;
      return;
    }
    if (runner.canDoubleJump && !runner.isSliding) {
      runner.vy = -config.jumpVelocity * getActivePreset().jumpVelocityMultiplier * 0.92;
      playJumpSfx();
      runner.canDoubleJump = false;
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
    const dynamicBase = config.speedGainPerCollectibleBase + config.speedGainPerCollectibleScale * difficulty;
    return calculateProgressiveSpeedGain({
      score: world.score,
      speedGainPerCollectibleBase: dynamicBase,
      speedGainPerCollectibleScale: config.speedGainPerCollectibleScale,
      speedGainMultiplier: preset.speedGainMultiplier,
      maxSpeed: config.maxSpeed,
      currentSpeed: world.speed
    }) - world.speed;
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

  function getRunAct() {
    if (world.elapsed < config.actOneDuration) {
      return 1;
    }
    if (world.elapsed < config.actTwoDuration) {
      return 2;
    }
    return 3;
  }

  function getActLabel(act) {
    if (act === 1) {
      return "Act 1: Warm-up";
    }
    if (act === 2) {
      return "Act 2: Pressure Build";
    }
    return "Final Sprint!";
  }

  function setSpawnDirectorAct(nextAct) {
    const act = Math.max(1, Math.min(3, nextAct));
    world.spawnDirector.activeAct = act;
    world.spawnDirector.deck = buildPatternDeck(world.runSeed, act);
    world.spawnDirector.cursor = 0;
    if (world.mode === "running") {
      showMilestonePopup(getActLabel(act));
      if (act === 3) {
        world.levelAnnouncement.text = "Final Sprint";
        world.levelAnnouncement.timer = config.levelAnnouncementDuration;
      }
    }
  }

  function ensureSpawnDirectorAct() {
    const activeAct = getRunAct();
    if (activeAct !== world.spawnDirector.activeAct || !world.spawnDirector.deck.length) {
      setSpawnDirectorAct(activeAct);
    }
  }

  function getNextSpawnPattern() {
    ensureSpawnDirectorAct();
    const deck = world.spawnDirector.deck;
    if (!deck.length) {
      return {
        id: "runtime-fallback",
        act: getRunAct(),
        difficulty: "medium",
        gapScale: 1,
        wallHeightScale: 1,
        extraObstacle: "none",
        riskGateBias: 0.6
      };
    }
    const pattern = deck[world.spawnDirector.cursor % deck.length];
    world.spawnDirector.cursor += 1;
    if (!pattern || typeof pattern !== "object") {
      return {
        id: "runtime-fallback",
        act: getRunAct(),
        difficulty: "medium",
        gapScale: 1,
        wallHeightScale: 1,
        extraObstacle: "none",
        riskGateBias: 0.6
      };
    }
    return pattern;
  }

  function pushObstacle(type, x) {
    if (type === "beachBall") {
      world.obstacles.push({
        type: "beachBall",
        x: x + randomBetween(90, 180, runRandom),
        y: world.groundY - 34,
        width: 34,
        height: 34
      });
      return;
    }
    if (type === "surfboard") {
      world.obstacles.push({
        type: "surfboard",
        x: x + randomBetween(120, 220, runRandom),
        y: world.groundY - 30,
        width: 88,
        height: 30
      });
      return;
    }
    if (type === "lowBar") {
      world.obstacles.push({
        type: "lowBar",
        x: x + randomBetween(140, 220, runRandom),
        y: world.groundY - 110,
        width: 120,
        height: 18
      });
    }
  }

  function maybeSpawnExtraObstacle(x, forcedType = null) {
    if (forcedType && forcedType !== "none") {
      pushObstacle(forcedType, x);
      return;
    }
    if (runRandom() > 0.45) {
      return;
    }
    const variantRoll = runRandom();
    if (variantRoll < 0.34) {
      pushObstacle("beachBall", x);
      return;
    }
    if (variantRoll < 0.67) {
      pushObstacle("surfboard", x);
      return;
    }
    pushObstacle("lowBar", x);
  }

  function spawnRiskGate(baseX, wallHeight, pattern) {
    if (world.elapsed + 0.5 < world.spawnDirector.nextRiskGateAt) {
      return;
    }
    const gateId = `gate-${world.spawnDirector.gateIndex++}`;
    const riskBias = pattern?.riskGateBias || 0.6;
    const safeX = baseX + config.wallWidth * 0.3;
    const riskyX = baseX + config.wallWidth * (0.64 + riskBias * 0.25);
    world.collectibles.push({
      x: safeX,
      y: world.groundY - Math.max(84, wallHeight + 36),
      radius: 11,
      width: config.collectibleW * 0.75,
      height: config.collectibleH * 0.75,
      phase: runRandom() * Math.PI * 2,
      type: "riskSafe",
      gateId,
      taken: false
    });
    world.collectibles.push({
      x: riskyX,
      y: world.groundY - Math.max(132, wallHeight + 92),
      radius: 12,
      width: config.collectibleW * 0.85,
      height: config.collectibleH * 0.85,
      phase: runRandom() * Math.PI * 2,
      type: "riskRisky",
      gateId,
      taken: false
    });
    world.spawnDirector.nextRiskGateAt += config.riskGateIntervalSeconds;
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

  function isCasinoBonusLevel() {
    const levelId = getCurrentLevel().id;
    return levelId === 1 || levelId === 4;
  }

  function consumeRiskGate(gateId, consumedItem) {
    for (const item of world.collectibles) {
      if (item.gateId === gateId && item !== consumedItem) {
        item.taken = true;
      }
    }
  }

  function maybeGrantRescueTokenFromCombo() {
    if (
      world.combo.count > 0 &&
      world.combo.count % config.rescueTokenComboMilestone === 0 &&
      world.rescueTokens < 1
    ) {
      world.rescueTokens = 1;
      showMilestonePopup("Rescue Token earned!");
    }
  }

  function applyPickupReward({
    comboIncrement = 1,
    pointBonus = 0,
    coinBonus = 1,
    setComboWindow = true,
    showComboPopup = true
  } = {}) {
    world.combo.count += comboIncrement;
    world.stats.longestCombo = Math.max(world.stats.longestCombo, world.combo.count);
    playCollectSfx();
    if (setComboWindow) {
      world.combo.timer = config.comboWindowSeconds;
    }
    const comboTier = Math.floor(world.combo.count / config.comboStep);
    world.combo.multiplier = Math.min(
      config.maxComboMultiplier,
      1 + comboTier * 0.5
    );
    const comboPoints = Math.max(1, Math.round(world.combo.multiplier));
    world.score += comboPoints + pointBonus;
    world.coins += coinBonus;
    world.stats.coinsCollected += coinBonus;
    world.speed = Math.min(config.maxSpeed, world.speed + getProgressiveSpeedGain());
    maybeGrantRescueTokenFromCombo();

    if (world.score > 0 && world.score % config.checkpointInterval === 0) {
      showMilestonePopup(`Checkpoint reached: ${world.score} points!`);
    }
    if (
      comboTier > 0 &&
      world.combo.count % (config.comboStep * config.speedBoostEveryCombos) === 0
    ) {
      world.stats.combosTriggered += 1;
      world.speedBoostTimer = config.speedBoostDuration;
      if (showComboPopup) {
        showMilestonePopup(`Combo chain x${world.combo.multiplier.toFixed(1)}!`);
      }
    }
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
        if (item.type === "riskSafe" || item.type === "riskRisky") {
          consumeRiskGate(item.gateId, item);
          applyPickupReward({
            comboIncrement: item.type === "riskRisky" ? 2 : 1,
            pointBonus: item.type === "riskRisky" ? 2 : 0,
            coinBonus: item.type === "riskRisky" ? 2 : 1,
            showComboPopup: item.type !== "riskSafe"
          });
          showMilestonePopup(item.type === "riskRisky" ? "Risk line cleared! Bonus reward." : "Safe line banked.");
        } else {
          applyPickupReward();
        }
        updateLevelProgression();
        updateCheckpoint();
        evaluateQuestProgress();
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
      symbols[Math.floor(runRandom() * symbols.length)],
      symbols[Math.floor(runRandom() * symbols.length)],
      symbols[Math.floor(runRandom() * symbols.length)]
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
    const pattern = getNextSpawnPattern();
    const width = config.wallWidth;
    const heightScale = pattern?.wallHeightScale || 1;
    const height = Math.round(getWallHeight() * heightScale);
    world.walls.push({ x, width, height, patternId: pattern?.id || "default" });
    const liftMin = config.collectibleLiftMin + (pattern?.act === 1 ? -8 : 0);
    const liftMax = config.collectibleLiftMax + (pattern?.act === 3 ? 18 : 0);
    world.collectibles.push({
      x: x + width * 0.5 + config.collectibleXOffset,
      y:
        world.groundY -
        height -
        randomBetween(liftMin, liftMax, runRandom),
      radius: 10,
      width: config.collectibleW,
      height: config.collectibleH,
      phase: runRandom() * Math.PI * 2,
      type: "drink",
      label: preset.collectibleName,
      taken: false
    });
    if (isCasinoBonusLevel() && runRandom() < getBonusSpawnChance()) {
      world.collectibles.push({
        x: x + width * 0.5 - 24,
        y:
          world.groundY -
          height -
          randomBetween(config.collectibleLiftMin + 48, config.collectibleLiftMax + 68, runRandom),
        radius: 16,
        width: 34,
        height: 34,
        phase: runRandom() * Math.PI * 2,
        type: "bonus",
        taken: false
      });
    }
    maybeSpawnExtraObstacle(x, pattern?.extraObstacle || null);
    spawnRiskGate(x + width, height, pattern);
    const gapRange = getSpawnGapRange();
    let gapScale = pattern?.gapScale || 1;
    if (pattern?.act === 3) {
      const burstCycle = Math.floor(world.elapsed / 9) % 2;
      if (burstCycle === 0) {
        gapScale *= 0.9;
      }
    }
    const minGap = Math.max(120, gapRange.min * gapScale);
    const maxGap = Math.max(minGap + 40, gapRange.max * gapScale);
    world.nextSpawnX = x + width + randomBetween(minGap, maxGap, runRandom);
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
    world.obstacles = world.obstacles.filter((obstacle) => obstacle.x + obstacle.width > cullX);
    world.collectibles = world.collectibles.filter(
      (item) => !item.taken && item.x > cullX
    );
  }

  function updateObstacleHits(runnerRect) {
    if (world.invulnerableTime > 0) {
      return false;
    }
    for (const obstacle of world.obstacles) {
      const rect = {
        left: obstacle.x - world.cameraX,
        top: obstacle.y,
        width: obstacle.width,
        height: obstacle.height
      };
      if (obstacle.type === "lowBar") {
        if (runner.isSliding) {
          continue;
        }
        if (runner.y + runner.height < obstacle.y + config.lowBarClearance) {
          continue;
        }
      }
      if (hasAabbCollision(runnerRect, rect)) {
        return true;
      }
    }
    return false;
  }

  function updateHud() {
    scoreValue.textContent = String(world.score);
    const level = getCurrentLevel();
    const pointsToNext = Number.isFinite(level.nextScore)
      ? Math.max(0, level.nextScore - world.score)
      : null;
    levelValue.textContent = `Level ${level.id}`;
    nextLevelValue.textContent =
      pointsToNext === null ? "Final destination reached" : `${pointsToNext} pts to L${level.id + 1}`;
    livesValue.textContent = String(Math.max(0, world.lives));

    const comboActive = world.combo.multiplier > 1 || world.speedBoostTimer > 0;
    if (comboHudItem) {
      comboHudItem.classList.toggle("hidden", !comboActive);
    }
    if (comboValue) {
      const comboBits = [];
      if (world.combo.multiplier > 1) {
        comboBits.push(`Combo x${world.combo.multiplier.toFixed(1)}`);
      }
      if (world.speedBoostTimer > 0) {
        comboBits.push("Boost active");
      }
      comboValue.textContent = comboBits.join(" • ") || "Momentum ready";
    }

    const rescueActive = world.rescueTokens > 0;
    if (rescueHudItem) {
      rescueHudItem.classList.toggle("hidden", !rescueActive);
    }
    if (rescueValue) {
      rescueValue.textContent = world.rescueTokens === 1 ? "1 token" : `${world.rescueTokens} tokens`;
    }

    const destinationText =
      pointsToNext === null
        ? "Final destination reached."
        : `${pointsToNext} points to Level ${level.id + 1}.`;
    const comboNarration = comboActive && comboValue ? ` Momentum ${comboValue.textContent}.` : "";
    const rescueNarration = rescueActive ? ` Rescue tokens ${world.rescueTokens}.` : "";
    const hudNarration = `Score ${world.score}. Lives ${world.lives}. Destination Level ${level.id}. ${destinationText}${comboNarration}${rescueNarration}`;
    document.querySelector(".hud")?.setAttribute("aria-label", hudNarration);
  }

  function showMilestonePopup(text) {
    world.milestonePopup.text = text;
    world.milestonePopup.timer = config.milestonePopupDuration;
  }

  function update(dt) {
    const scaledDt = dt * accessibilityState.speedScale;
    world.elapsed += scaledDt;
    world.cameraX += world.speed * scaledDt;
    world.speed = Math.min(config.maxSpeed, world.speed + scaledDt * (0.8 + getDifficulty() * 1.4));
    if (world.speedBoostTimer > 0) {
      world.speedBoostTimer = Math.max(0, world.speedBoostTimer - scaledDt);
      world.speed = Math.min(config.maxSpeed, world.speed + config.speedBoostAmount * scaledDt);
    }
    if (world.combo.timer > 0) {
      world.combo.timer = Math.max(0, world.combo.timer - scaledDt);
      if (world.combo.timer <= 0) {
        const comboShieldActive =
          getActivePerkConfig().comboShield && !questState.comboShieldUsed && world.combo.count > 0;
        if (comboShieldActive) {
          questState.comboShieldUsed = true;
          world.combo.timer = 1.1;
          showMilestonePopup("Combo Shield saved your streak!");
        } else {
          world.combo.count = 0;
          world.combo.multiplier = 1;
        }
      }
    }
    if (world.invulnerableTime > 0) {
      world.invulnerableTime = Math.max(0, world.invulnerableTime - scaledDt);
    }
    if (world.milestonePopup.timer > 0) {
      world.milestonePopup.timer = Math.max(0, world.milestonePopup.timer - scaledDt);
    }

    if (runner.jumpBuffer > 0) {
      runner.jumpBuffer = Math.max(0, runner.jumpBuffer - scaledDt);
    }
    if (runner.coyoteTime > 0) {
      runner.coyoteTime = Math.max(0, runner.coyoteTime - scaledDt);
    }
    if (runner.slideCooldown > 0) {
      runner.slideCooldown = Math.max(0, runner.slideCooldown - scaledDt);
    }
    if (runner.slideTimer > 0) {
      runner.slideTimer = Math.max(0, runner.slideTimer - scaledDt);
      runner.isSliding = runner.slideTimer > 0;
    } else {
      runner.isSliding = false;
    }
    attemptJump();
    ensureSpawnDirectorAct();

    runner.vy += config.gravity * scaledDt;
    runner.y += runner.vy * scaledDt;

    const runnerWorldX = world.cameraX + world.width * config.runnerScreenRatio;
    const worldLeft = runnerWorldX;
    const worldRight = runnerWorldX + runner.width;
    if (runner.y + runner.height >= world.groundY) {
      runner.y = world.groundY - runner.height;
      runner.vy = 0;
      runner.onGround = true;
      runner.canDoubleJump = true;
      runner.coyoteTime = getBaseCoyoteWindow();
    } else {
      if (runner.onGround) {
        runner.coyoteTime = getBaseCoyoteWindow();
      }
      runner.onGround = false;
    }

    const hitboxHeight = getRunnerHitboxHeight();
    const runnerTop = runner.y + (runner.height - hitboxHeight) + 6;
    const runnerBottom = runner.y + runner.height - 5;
    const runnerLeft = worldLeft + 8;
    const runnerRight = worldRight - 8;
    const runnerRect = {
      left: world.width * config.runnerScreenRatio + 8,
      top: runnerTop,
      width: runner.width - 16,
      height: Math.max(10, runnerBottom - runnerTop)
    };
    if (world.invulnerableTime <= 0) {
      const collidingWall = getWallCollision(runnerLeft, runnerRight, runnerTop, runnerBottom);
      if (collidingWall) {
        if (!maybeTriggerRescue("wall", collidingWall)) {
          playHitSfx();
          world.lives -= 1;
          restoreCheckpointAfterHit();
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
    const hitSlide = updateSlideObstacle(scaledDt, runnerRect);
    if (hitSlide && world.invulnerableTime <= 0) {
      if (!maybeTriggerRescue("slide")) {
        playHitSfx();
        world.lives -= 1;
        restoreCheckpointAfterHit();
      }
      return;
    }
    const hitObstacle = updateObstacleHits(runnerRect);
    if (hitObstacle) {
      playHitSfx();
      world.lives -= 1;
      restoreCheckpointAfterHit();
      return;
    }
    ensureGenerated();
    pruneWorld();
    evaluateQuestProgress();
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

  function drawObstacles() {
    for (const obstacle of world.obstacles) {
      const x = obstacle.x - world.cameraX;
      if (x + obstacle.width < -60 || x > world.width + 60) {
        continue;
      }
      if (obstacle.type === "beachBall") {
        ctx.fillStyle = "#ff9a42";
        ctx.beginPath();
        ctx.arc(x + obstacle.width * 0.5, obstacle.y + obstacle.height * 0.5, obstacle.width * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff6d5";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + obstacle.width * 0.5, obstacle.y + obstacle.height * 0.5, obstacle.width * 0.32, 0, Math.PI * 2);
        ctx.stroke();
      } else if (obstacle.type === "surfboard") {
        ctx.fillStyle = "#ef5f83";
        fillRoundedRect(x, obstacle.y, obstacle.width, obstacle.height, 14);
        ctx.fillStyle = "#ffe4b4";
        ctx.fillRect(x + 14, obstacle.y + 10, obstacle.width - 28, 4);
      } else if (obstacle.type === "lowBar") {
        ctx.fillStyle = "#6fd8ff";
        fillRoundedRect(x, obstacle.y, obstacle.width, obstacle.height, 8);
        ctx.fillStyle = "rgba(111, 216, 255, 0.35)";
        ctx.fillRect(x + 8, obstacle.y + obstacle.height, 5, 48);
        ctx.fillRect(x + obstacle.width - 13, obstacle.y + obstacle.height, 5, 48);
      }
    }
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
      const isRisk = item.type === "riskSafe" || item.type === "riskRisky";
      ctx.fillStyle = isBonus ? "rgba(255, 210, 79, 0.4)" : "rgba(255, 225, 122, 0.33)";
      ctx.beginPath();
      ctx.arc(x, y + 2, item.radius + 11, 0, Math.PI * 2);
      ctx.fill();

      if (isRisk) {
        ctx.fillStyle = item.type === "riskRisky" ? "#ff9c58" : "#8ce2ff";
        ctx.beginPath();
        ctx.arc(x, y, item.radius + 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = item.type === "riskRisky" ? "#7a2e12" : "#1b4b5e";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#10213a";
        ctx.font = `700 12px ${uiPixelFont}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.type === "riskRisky" ? "R" : "S", x, y + 1);
      } else if (!isBonus && activeAssets.collectible.ready) {
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
        ctx.font = `700 14px ${uiPixelFont}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("B", x, y + 1);
      } else {
        ctx.fillStyle = preset.collectibleColor;
        ctx.beginPath();
        ctx.arc(x, y, item.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#4b3a11";
        ctx.font = "700 14px \"Segoe UI Emoji\", \"Apple Color Emoji\", \"Noto Color Emoji\", sans-serif";
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
    const slideScale = runner.isSliding ? 0.7 : 1;
    const drawH = runner.height * visualScale * slideScale;
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

  function drawLivesNearRunner() {
    const x = world.width * config.runnerScreenRatio + runner.width * 0.5;
    const y = runner.y - 22;
    const lives = Math.max(0, world.lives);
    for (let i = 0; i < config.maxLives; i += 1) {
      ctx.globalAlpha = i < lives ? 1 : 0.24;
      ctx.font = "18px \"Segoe UI Emoji\", sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("❤️", x + i * 20 - 20, y);
    }
    ctx.globalAlpha = 1;
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
    ensureLazyAssetLoaded("casinoBackground");
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

    ensureLazyAssetLoaded("slotMachine");
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
    ctx.font = `700 32px ${uiPixelFont}`;
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

  function drawLevelAnnouncement() {
    if (world.levelAnnouncement.timer <= 0 || !world.levelAnnouncement.text) {
      return;
    }
    const fadeIn = Math.min(1, (config.levelAnnouncementDuration - world.levelAnnouncement.timer) / 0.24);
    const fadeOut = Math.min(1, world.levelAnnouncement.timer / 0.4);
    const alpha = Math.min(fadeIn, fadeOut);
    const cardWidth = Math.min(620, world.width * 0.9);
    const cardHeight = 66;
    const x = world.width * 0.5 - cardWidth * 0.5;
    const y = world.height * 0.13;

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = "rgba(5, 16, 26, 0.95)";
    ctx.fillRect(x, y, cardWidth, cardHeight);
    ctx.strokeStyle = "rgba(255, 230, 109, 0.95)";
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, y + 1.5, cardWidth - 3, cardHeight - 3);
    ctx.fillStyle = "#ebfff8";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `30px ${uiMonoFont}`;
    ctx.fillText(world.levelAnnouncement.text.toUpperCase(), world.width * 0.5, y + cardHeight * 0.53, cardWidth - 18);
    ctx.restore();
  }

  function drawMilestonePopup() {
    if (world.milestonePopup.timer <= 0 || !world.milestonePopup.text) {
      return;
    }
    const alpha = Math.min(1, world.milestonePopup.timer / config.milestonePopupDuration);
    const y = world.height * 0.24 - (1 - alpha) * 20;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(12, 18, 30, 0.92)";
    fillRoundedRect(world.width * 0.2, y, world.width * 0.6, 46, 10);
    ctx.fillStyle = "#ffe495";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `26px ${uiMonoFont}`;
    ctx.fillText(world.milestonePopup.text, world.width * 0.5, y + 24);
    ctx.restore();
  }

  function drawScenerySection() {
    const sections = ["Casino Deck", "Pool Area", "Nighttime Sailing"];
    const sectionIndex = Math.floor(world.levelElapsed / 12) % sections.length;
    const label = sections[sectionIndex];
    if (label === "Nighttime Sailing") {
      ctx.fillStyle = "rgba(9, 18, 48, 0.18)";
      ctx.fillRect(0, 0, world.width, world.height);
    }
    ctx.fillStyle = "rgba(8, 18, 28, 0.56)";
    fillRoundedRect(12, world.height - 54, 210, 36, 8);
    ctx.fillStyle = "#d8f4ff";
    ctx.font = `22px ${uiMonoFont}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 24, world.height - 36);
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
    drawObstacles();
    drawCollectibles();
    drawScenerySection();
    drawRunner();
    drawLivesNearRunner();
    drawRescueDoctor();
    drawLevelAnnouncement();
    drawMilestonePopup();
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
    const jumpKeys = new Set(["Space", "ArrowUp", "KeyW"]);
    const slideKey = () => (accessibilityState.controlScheme === "left" ? "ArrowLeft" : "ArrowDown");

    window.addEventListener("keydown", (event) => {
      const context = ensureAudioContext();
      if (context && context.state === "suspended") {
        context.resume().catch(() => {});
      }
      if (
        world.mode === "splash" &&
        (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW" || event.code === "Enter")
      ) {
        event.preventDefault();
        if (!event.repeat) {
          dismissSplashToMainMenu();
        }
        return;
      }

      if (jumpKeys.has(event.code)) {
        event.preventDefault();
        if (!event.repeat) {
          queueJump();
        }
        return;
      }

      if (event.code === slideKey() || event.code === "KeyS" || event.code === "ShiftLeft") {
        event.preventDefault();
        if (!event.repeat) {
          queueSlide();
        }
      }
    });
    window.addEventListener("keyup", (event) => {
      if (jumpKeys.has(event.code)) {
        releaseJump();
      }
    });

    canvas.addEventListener("pointerdown", queueJump);
    canvas.addEventListener("pointerdown", () => {
      const context = ensureAudioContext();
      if (context && context.state === "suspended") {
        context.resume().catch(() => {});
      }
    });
    splashScreen.addEventListener("pointerdown", dismissSplashToMainMenu);
    splashContinueButton.addEventListener("click", dismissSplashToMainMenu);
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
      if (world.mode === "gameOver") {
        startRun();
        return;
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
      const shareMode = shareLink.dataset.mode || "score";
      const targetScore = Number.parseInt(shareLink.dataset.target || "0", 10) || score;
      const shareText = shareMode === "challenge"
        ? `I just posted a cruise challenge as ${preset.name}. Beat ${targetScore} and send me a rematch.`
        : `I scored ${score} with ${preset.name} on Bonkers Cruise Dash.`;
      const shareData = {
        title: `${preset.name}'s Bonkers Cruise Dash`,
        text: shareText,
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
      if (event.key !== "Escape") {
        return;
      }
      if (releaseState.isOpen) {
        closeReleaseNotes();
        return;
      }
      if (world.mode === "ready" && menuState.screen === "settings") {
        setMenuScreen("main", { focus: "main" });
      }
    });
    helpButton.addEventListener("click", () => {
      const lastSeenVersion = readLastSeenVersion();
      const unseenNotes = getNotesSince(lastSeenVersion);
      const hasSavedVersion = Boolean(lastSeenVersion);
      const hasUnseen = Boolean(unseenNotes.length) &&
        (!lastSeenVersion || compareVersions(lastSeenVersion, releaseState.currentVersion) < 0);
      openReleaseNotes({
        notes: hasSavedVersion && hasUnseen ? unseenNotes : [...releaseState.notes],
        introText: !hasSavedVersion
          ? "Mission guide: Collect drinks, chain combos, and dodge walls with jump/double-jump/slide. You have 3 lives with checkpoints every 5 points. Here are the full release notes."
          : hasUnseen
          ? `Mission guide: Collect drinks, chain combos, and dodge walls with jump/double-jump/slide. You have 3 lives with checkpoints every 5 points. New in v${releaseState.currentVersion}:`
          : "Mission guide: Collect drinks, chain combos, and dodge walls with jump/double-jump/slide. You have 3 lives with checkpoints every 5 points. Level milestones are 8, 18, 31, and 46 points.",
        triggerEl: helpButton,
        markSeen: hasUnseen
      });
    });
    settingsButton?.addEventListener("click", () => {
      setMenuScreen("settings", { focus: "settings" });
    });
    settingsBackButton?.addEventListener("click", () => {
      setMenuScreen("main", { focus: "main" });
    });
    notesCloseButton.addEventListener("click", closeReleaseNotes);
    characterSelect.addEventListener("change", (event) => {
      const selected = String(event.target.value || "").toLowerCase();
      if (!isValidCharacter(selected)) {
        return;
      }
      const preset = characterPresets[selected];
      const isUnlocked = progressionState.unlockedCharacters.has(selected);
      if (!isUnlocked && progressionState.coinBank >= (preset.unlockCost || 0)) {
        progressionState.coinBank -= preset.unlockCost || 0;
        progressionState.unlockedCharacters.add(selected);
        saveProgressionMeta();
      }
      if (!progressionState.unlockedCharacters.has(selected)) {
        updateCharacterUi();
        return;
      }
      const challengeRunner = challengeState.active?.runner || "";
      if (challengeState.active && selected !== challengeRunner) {
        clearActiveChallenge({ stripUrl: true });
        subtitleEl.textContent = mainMenuCopy.subtitle;
      }
      currentCharacter = selected;
      updateCharacterUi();
      if (world.mode !== "running" && world.mode !== "casino") {
        resetWorld();
      }
    });
    startLevelSelect.addEventListener("change", (event) => {
      const selectedLevel = normalizeLevelId(event.target.value, 1);
      progressionState.selectedStartLevel = selectedLevel;
      const challengeLevel = normalizeLevelId(challengeState.active?.level, selectedLevel);
      if (challengeState.active && selectedLevel !== challengeLevel) {
        clearActiveChallenge({ stripUrl: true });
        subtitleEl.textContent = mainMenuCopy.subtitle;
      }
      updateStartLevelDetails();
      if (world.mode !== "running" && world.mode !== "casino" && world.mode !== "rescue") {
        applyStartingLevel(progressionState.selectedStartLevel);
        world.mode = "ready";
      }
    });
    perkSelect?.addEventListener("change", (event) => {
      const selectedPerk = String(event.target.value || "safe_landing");
      if (!perkCatalog[selectedPerk]) {
        return;
      }
      world.activePerk = selectedPerk;
      updatePerkUi();
      saveProgressionMeta();
      updateMetaPanels();
    });
    controlSchemeSelect.addEventListener("change", (event) => {
      accessibilityState.controlScheme = event.target.value === "left" ? "left" : "right";
      saveAccessibilityState();
    });
    speedScaleSelect.addEventListener("change", (event) => {
      const selected = Number.parseFloat(event.target.value || "1");
      accessibilityState.speedScale = Number.isFinite(selected) ? selected : 1;
      saveAccessibilityState();
    });
    contrastToggle.addEventListener("change", (event) => {
      accessibilityState.highContrast = Boolean(event.target.checked);
      applyAccessibilityUi();
      saveAccessibilityState();
    });
    musicVolumeRange.addEventListener("input", (event) => {
      accessibilityState.musicVolume = Math.max(0, Math.min(1, Number(event.target.value) / 100));
      ensureAudioContext();
      if (audioState.musicGain) {
        audioState.musicGain.gain.value = 0.18 * accessibilityState.musicVolume;
      }
      if (world.mode === "running" && accessibilityState.musicVolume > 0) {
        startMusicLoop();
      } else if (accessibilityState.musicVolume <= 0) {
        stopMusicLoop();
      }
      saveAccessibilityState();
    });
    sfxVolumeRange.addEventListener("input", (event) => {
      accessibilityState.sfxVolume = Math.max(0, Math.min(1, Number(event.target.value) / 100));
      ensureAudioContext();
      if (audioState.sfxGain) {
        audioState.sfxGain.gain.value = 0.24 * accessibilityState.sfxVolume;
      }
      saveAccessibilityState();
    });
    createAccountButton?.addEventListener("click", () => {
      createSupabaseAccount().catch(() => {
        setAuthStatusMessage("Create account failed unexpectedly.", true);
        setAuthBusy(false);
      });
    });
    signInButton?.addEventListener("click", () => {
      signInSupabaseAccount().catch(() => {
        setAuthStatusMessage("Sign in failed unexpectedly.", true);
        setAuthBusy(false);
      });
    });
    signOutButton?.addEventListener("click", () => {
      signOutSupabaseAccount().catch(() => {
        setAuthStatusMessage("Sign out failed unexpectedly.", true);
        setAuthBusy(false);
      });
    });
  }

  function updateCharacterUi() {
    if (!progressionState.unlockedCharacters.has(currentCharacter)) {
      currentCharacter = "bryan";
    }
    const preset = getActivePreset();
    Array.from(characterSelect.options).forEach((option) => {
      const key = String(option.value || "").toLowerCase();
      const optionPreset = characterPresets[key];
      if (!optionPreset) {
        return;
      }
      const unlocked = progressionState.unlockedCharacters.has(key);
      const lockSuffix = unlocked ? "" : ` (Locked: ${optionPreset.unlockCost})`;
      option.textContent = `${optionPreset.name} + ${optionPreset.collectibleName}${lockSuffix}`;
    });
    const isUnlocked = progressionState.unlockedCharacters.has(currentCharacter);
    const lockStatus = isUnlocked
      ? "Unlocked."
      : `Locked. ${preset.unlockCost} bank coins needed.`;
    characterSelect.value = currentCharacter;
    characterDetails.textContent = `${preset.name}: ${preset.abilityLabel}. ${preset.abilityDetail} ${lockStatus} Bank: ${progressionState.coinBank} coins.`;
    updatePerkUi();
    updateShareImageMeta();
    refreshShareLinkForCharacter();
    syncCharacterInLocation();
    updateMetaPanels();
  }

  async function initializeSupabaseAuth() {
    const anonKey = getSupabaseAnonKey();
    if (!anonKey) {
      updateAuthUi();
      return;
    }
    authState.client = createClient(supabaseConfig.url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    const { data, error } = await authState.client.auth.getUser();
    if (!error) {
      authState.user = data?.user || null;
    }
    authState.client.auth.onAuthStateChange((_event, session) => {
      authState.user = session?.user || null;
      updateAuthUi();
    });
    updateAuthUi();
  }

  function readAuthCredentials() {
    const email = String(authEmailInput.value || "").trim();
    const password = String(authPasswordInput.value || "");
    if (!email || !password) {
      setAuthStatusMessage("Enter email and password first.", true);
      return null;
    }
    return { email, password };
  }

  async function createSupabaseAccount() {
    if (!authState.client || authState.busy) {
      return;
    }
    const credentials = readAuthCredentials();
    if (!credentials) {
      return;
    }
    setAuthBusy(true);
    const redirectTo = inferAuthRedirectUrl();
    const { error } = await authState.client.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: { emailRedirectTo: redirectTo }
    });
    if (error) {
      setAuthStatusMessage(`Create account failed: ${error.message}`, true);
    } else {
      setAuthStatusMessage("Account created. Check your inbox for the confirmation link.");
      authPasswordInput.value = "";
    }
    setAuthBusy(false);
    updateAuthUi();
  }

  async function signInSupabaseAccount() {
    if (!authState.client || authState.busy) {
      return;
    }
    const credentials = readAuthCredentials();
    if (!credentials) {
      return;
    }
    setAuthBusy(true);
    const { error } = await authState.client.auth.signInWithPassword(credentials);
    if (error) {
      setAuthStatusMessage(`Sign in failed: ${error.message}`, true);
    } else {
      setAuthStatusMessage(`Signed in as ${credentials.email}.`);
      authPasswordInput.value = "";
    }
    setAuthBusy(false);
    updateAuthUi();
  }

  async function signOutSupabaseAccount() {
    if (!authState.client || authState.busy) {
      return;
    }
    setAuthBusy(true);
    const { error } = await authState.client.auth.signOut();
    if (error) {
      setAuthStatusMessage(`Sign out failed: ${error.message}`, true);
    } else {
      setAuthStatusMessage("Signed out.");
    }
    setAuthBusy(false);
    updateAuthUi();
  }

  resizeCanvas();
  parseSharedRunnerFromUrl();
  readAccessibilityState();
  applyAccessibilityUi();
  hydrateProgressionState();
  buildDailyQuests();
  parseChallengeFromUrl();
  unlockLevel(1);
  updateCharacterUi();
  stashAnonKeyFromUrl();
  setAuthBusy(false);
  updateAuthUi();
  initializeSupabaseAuth().catch(() => {
    setAuthStatusMessage("Supabase initialization failed. Check your anon key setup.", true);
    setAuthBusy(false);
  });
  setupInput();
  showSplashScreen();
  requestAnimationFrame(onFrame);
})();
