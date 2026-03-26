"use strict";

(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const actionButton = document.getElementById("actionButton");
  const shareLink = document.getElementById("shareLink");
  const jumpButton = document.getElementById("jumpButton");
  const scoreValue = document.getElementById("scoreValue");
  const speedValue = document.getElementById("speedValue");
  const titleEl = overlay.querySelector(".title");
  const subtitleEl = overlay.querySelector(".subtitle");

  const config = {
    gravity: 1820,
    jumpVelocity: 900,
    startSpeed: 280,
    maxSpeed: 760,
    speedGainPerCollectible: 24,
    runnerScreenRatio: 0.2,
    wallWidth: 64,
    wallHeight: 98,
    wallGapMin: 200,
    wallGapMax: 320,
    collectibleW: 50,
    collectibleH: 73,
    collectibleXOffset: 18,
    collectibleLiftMin: 118,
    collectibleLiftMax: 144,
    collectiblePickupPadding: 24,
    slideTriggerScore: 3,
    slideMinSpeed: 500,
    slideHeight: 64,
    deckWalkableRatio: 0.38,
    deckMinTileHeight: 210
  };

  const assets = {
    bryan: new Image(),
    bryanStep: new Image(),
    slide: new Image(),
    drink: new Image(),
    deck: new Image(),
    umbrella: new Image(),
    bryanReady: false,
    bryanStepReady: false,
    slideReady: false,
    drinkReady: false,
    deckReady: false,
    umbrellaReady: false
  };

  assets.bryan.src = "bryan.png";
  assets.bryanStep.src = "bryan2.png";
  assets.slide.src = "slide.png";
  assets.drink.src = "drink.png";
  assets.deck.src = "deck.png";
  assets.umbrella.src = "umbrella.png";
  assets.bryan.onload = () => {
    assets.bryanReady = true;
  };
  assets.bryanStep.onload = () => {
    assets.bryanStepReady = true;
  };
  assets.slide.onload = () => {
    assets.slideReady = true;
  };
  assets.drink.onload = () => {
    assets.drinkReady = true;
  };
  assets.deck.onload = () => {
    assets.deckReady = true;
  };
  assets.umbrella.onload = () => {
    assets.umbrellaReady = true;
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

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
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

    runner.y = world.groundY - runner.height;
    runner.vy = 0;
    runner.onGround = true;
    runner.coyoteTime = 0;
    runner.jumpBuffer = 0;
    runner.tilt = 0;

    ensureGenerated();
    updateHud();
  }

  function buildShareUrl(score) {
    const url = new URL(window.location.href);
    url.searchParams.set("score", String(score));
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
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function startRun() {
    resetWorld();
    world.mode = "running";
    hideOverlay();
  }

  function endRun() {
    world.mode = "gameOver";
    showOverlay(
      "Run Over",
      `You hit an obstacle. Final score: ${world.score}`,
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
      runner.vy = -config.jumpVelocity;
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
    const slideSpeed = Math.max(config.slideMinSpeed, world.speed + 40);
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
        world.score += 1;
        world.speed = Math.min(
          config.maxSpeed,
          world.speed + config.speedGainPerCollectible
        );
      }
    }
  }

  function spawnWall(x) {
    const width = config.wallWidth;
    const height = config.wallHeight;
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
      taken: false
    });
    world.nextSpawnX = x + width + randomBetween(config.wallGapMin, config.wallGapMax);
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
    world.speed = Math.min(config.maxSpeed, world.speed + dt * 2.4);

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
      ctx.fillStyle = "rgba(255, 225, 122, 0.33)";
      ctx.beginPath();
      ctx.arc(x, y + 2, item.radius + 11, 0, Math.PI * 2);
      ctx.fill();

      if (assets.drinkReady) {
        ctx.drawImage(assets.drink, x - drawW * 0.5, y - drawH * 0.5, drawW, drawH);
      } else {
        ctx.fillStyle = "#ffd95e";
        ctx.beginPath();
        ctx.arc(x, y, item.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawRunner() {
    const x = world.width * config.runnerScreenRatio;
    const y = runner.y;
    const runCycle = world.elapsed * Math.max(5.5, world.speed / 50);
    const isWalking = world.mode === "running" && runner.onGround;
    const walkFrame = Math.floor(runCycle * 1.4) % 2;

    runner.tilt += (Math.max(-0.2, Math.min(0.2, -runner.vy * 0.0008)) - runner.tilt) * 0.2;
    const bob = runner.onGround ? Math.sin(runCycle) * 1.9 : 0;
    const drawW = runner.width * 1.24;
    const drawH = runner.height * 1.24;

    ctx.save();
    ctx.translate(x + runner.width * 0.5, y + runner.height * 0.5 + bob);
    ctx.rotate(runner.tilt);

    ctx.fillStyle = "rgba(20, 35, 50, 0.25)";
    ctx.beginPath();
    ctx.ellipse(0, runner.height * 0.54, 24, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    if (assets.bryanReady) {
      const runnerImage =
        isWalking && walkFrame === 1 && assets.bryanStepReady ? assets.bryanStep : assets.bryan;
      ctx.drawImage(runnerImage, -drawW * 0.5, -drawH * 0.5, drawW, drawH);
    } else {
      ctx.fillStyle = "#f26a4b";
      fillRoundedRect(-16, -12, 32, 34, 10);
      ctx.fillStyle = "#ffd4b6";
      ctx.beginPath();
      ctx.arc(0, -22, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
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
    jumpButton.addEventListener("pointerdown", queueJump);
    actionButton.addEventListener("click", startRun);
    shareLink.addEventListener("click", (event) => {
      if (!navigator.share) {
        return;
      }
      event.preventDefault();
      const score = Number.parseInt(shareLink.dataset.score || "0", 10) || 0;
      navigator
        .share({
          title: "Bryan's Bonkers Cruise Dash",
          text: `I scored ${score} on Bryan's Bonkers Cruise Dash.`,
          url: shareLink.href
        })
        .catch(() => {});
    });
    window.addEventListener("resize", resizeCanvas);
  }

  resizeCanvas();
  resetWorld();
  showOverlay(
    "Bryan's Bonkers Cruise Dash",
    "Jump walls, then grab drinks to run faster.",
    "Start Run"
  );
  setupInput();
  requestAnimationFrame(onFrame);
})();
