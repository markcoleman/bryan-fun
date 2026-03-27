"use strict";

(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const actionButton = document.getElementById("actionButton");
  const shareLink = document.getElementById("shareLink");
  const scoreValue = document.getElementById("scoreValue");
  const speedValue = document.getElementById("speedValue");
  const helpButton = document.getElementById("helpButton");
  const notesDialog = document.getElementById("notesDialog");
  const notesIntro = document.getElementById("notesIntro");
  const notesScrollRegion = document.getElementById("notesScrollRegion");
  const notesCloseButton = document.getElementById("notesCloseButton");
  const characterSelect = document.getElementById("characterSelect");
  const characterDetails = document.getElementById("characterDetails");
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
    slideTriggerScore: 12,
    slideMinSpeed: 380,
    slideHeight: 64,
    deckWalkableRatio: 0.38,
    deckMinTileHeight: 210
  };
  const imagePath = (fileName) => `assets/images/${fileName}`;

  const assets = {
    slide: new Image(),
    deck: new Image(),
    umbrella: new Image(),
    casinoBackground: new Image(),
    slotMachine: new Image(),
    slideReady: false,
    deckReady: false,
    umbrellaReady: false,
    casinoBackgroundReady: false,
    slotMachineReady: false
  };

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
    currentVersion: "1.5.0",
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
      }
    ],
    isOpen: false,
    triggerEl: null
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

  const world = {
    mode: "ready",
    width: 0,
    height: 0,
    groundY: 0,
    cameraX: 0,
    speed: config.startSpeed,
    score: 0,
    lastTime: 0,
    elapsed: 0,
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
    casino: {
      pendingPull: false,
      pendingResume: false
    }
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
    world.elapsed = 0;
    world.lastTime = 0;
    world.walls.length = 0;
    world.collectibles.length = 0;
    world.nextSpawnX = world.width * 0.9;
    world.slide.active = false;
    world.slide.hasSpawned = false;
    world.slide.x = 0;
    world.slide.y = 0;
    world.slide.width = 0;
    world.slide.height = 0;
    world.casino.pendingPull = false;
    world.casino.pendingResume = false;

    runner.y = world.groundY - runner.height;
    runner.vy = 0;
    runner.onGround = true;
    runner.coyoteTime = 0;
    runner.jumpBuffer = 0;
    runner.tilt = 0;

    ensureGenerated();
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
    hideOverlay();
  }

  function endRun() {
    const preset = getActivePreset();
    world.mode = "gameOver";
    showOverlay(
      "Run Over",
      `You hit an obstacle. Final score with ${preset.name}: ${world.score}`,
      "Run Again",
      world.score
    );
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

  function hasWallCollision(worldLeft, worldRight, runnerTop, runnerBottom) {
    for (const wall of world.walls) {
      const wallLeft = wall.x;
      const wallRight = wall.x + wall.width;
      const wallTop = world.groundY - wall.height;
      const xOverlaps = worldRight > wallLeft + 2 && worldLeft < wallRight - 2;
      const yHitsFace = runnerBottom > wallTop + 8 && runnerTop < world.groundY - 4;
      if (xOverlaps && yHitsFace) {
        return true;
      }
    }
    return false;
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
    return Math.min(1, world.score / 30);
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
    world.slide.x = world.width + slideWidth + 28;
    world.slide.y = world.groundY - slideHeight;
  }

  function updateSlideObstacle(dt, runnerRect) {
    if (!world.slide.hasSpawned && world.score >= config.slideTriggerScore) {
      activateSlideObstacle();
    }
    if (!world.slide.active) {
      return false;
    }

    world.slide.y = world.groundY - world.slide.height;
    const slideSpeed = Math.max(config.slideMinSpeed, world.speed + 24 + getDifficulty() * 40);
    world.slide.x -= slideSpeed * dt;
    if (world.slide.x + world.slide.width < -80) {
      world.slide.active = false;
      return false;
    }

    const slideRect = {
      left: world.slide.x + 8,
      top: world.slide.y + 10,
      width: Math.max(12, world.slide.width - 16),
      height: Math.max(12, world.slide.height - 14)
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
  }

  function update(dt) {
    world.elapsed += dt;
    world.cameraX += world.speed * dt;
    world.speed = Math.min(config.maxSpeed, world.speed + dt * (0.8 + getDifficulty() * 1.4));

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
    if (hasWallCollision(runnerLeft, runnerRight, runnerTop, runnerBottom)) {
      endRun();
      return;
    }
    collectItems(runnerWorldX + runner.width * 0.5, runner.y + runner.height * 0.5);
    if (updateSlideObstacle(dt, runnerRect)) {
      endRun();
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
    const groundHeight = world.height - world.groundY;
    ctx.fillStyle = "#e7d5a6";
    ctx.fillRect(0, world.groundY, world.width, groundHeight);

    if (assets.deckReady) {
      const sourceW = Math.max(1, assets.deck.naturalWidth);
      const sourceH = Math.max(1, assets.deck.naturalHeight);
      const walkableRatio = Math.max(0.08, Math.min(0.9, config.deckWalkableRatio));
      const requiredTileH = groundHeight / (1 - walkableRatio);
      const tileH = Math.max(config.deckMinTileHeight, requiredTileH);
      const tileW = Math.max(72, (sourceW * tileH) / sourceH);
      const drawY = world.groundY - tileH * walkableRatio;
      const offset = world.cameraX % tileW;

      for (let x = -tileW - offset; x < world.width + tileW; x += tileW) {
        ctx.drawImage(assets.deck, x, drawY, tileW, tileH);
      }
    } else {
      ctx.fillStyle = "rgba(196, 154, 80, 0.35)";
      const stripeWidth = 64;
      const offset = (world.cameraX * 0.7) % stripeWidth;
      for (let x = -stripeWidth - offset; x < world.width + stripeWidth; x += stripeWidth) {
        ctx.fillRect(x, world.groundY + 28, stripeWidth * 0.5, 7);
      }
    }
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

  function render() {
    ctx.clearRect(0, 0, world.width, world.height);

    if (world.mode === "casino") {
      drawCasinoMode();
      return;
    }

    const sky = ctx.createLinearGradient(0, 0, 0, world.height);
    sky.addColorStop(0, "#96dfff");
    sky.addColorStop(0.58, "#d3f2ff");
    sky.addColorStop(1, "#f8efcb");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, world.width, world.height);

    drawClouds();
    drawLayer("#cfe6bf", world.height * 0.69, 38, 220, 0.16);
    drawLayer("#a9d095", world.height * 0.75, 52, 260, 0.3);
    drawGround();
    drawWalls();
    drawSlideObstacle();
    drawCollectibles();
    drawRunner();
  }

  function onFrame(timestamp) {
    const elapsedMs = world.lastTime ? timestamp - world.lastTime : 16;
    world.lastTime = timestamp;
    const dt = Math.min(0.033, elapsedMs / 1000);

    if (world.mode === "running") {
      update(dt);
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
    shareLink.addEventListener("click", (event) => {
      if (!navigator.share) {
        return;
      }
      event.preventDefault();
      const score = Number.parseInt(shareLink.dataset.score || "0", 10) || 0;
      const preset = getActivePreset();
      navigator
        .share({
          title: `${preset.name}'s Bonkers Cruise Dash`,
          text: `I scored ${score} with ${preset.name} on Bonkers Cruise Dash.`,
          url: shareLink.href
        })
        .catch(() => {});
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
  resetWorld();
  showOverlay(
    "Bryan's Bonkers Cruise Dash",
    "Jump walls and collect pickups. Difficulty ramps up gradually.",
    "Start Run"
  );
  updateCharacterUi();
  setupInput();
  maybeShowWhatsNew();
  requestAnimationFrame(onFrame);
})();
