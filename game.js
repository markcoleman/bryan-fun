"use strict";

(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const actionButton = document.getElementById("actionButton");
  const jumpButton = document.getElementById("jumpButton");
  const scoreValue = document.getElementById("scoreValue");
  const speedValue = document.getElementById("speedValue");
  const titleEl = overlay.querySelector(".title");
  const subtitleEl = overlay.querySelector(".subtitle");

  const config = {
    gravity: 2050,
    jumpVelocity: 790,
    startSpeed: 280,
    maxSpeed: 760,
    speedGainPerCollectible: 28,
    runnerScreenRatio: 0.24,
    pitMin: 95,
    pitMax: 180,
    wallMinWidth: 44,
    wallMaxWidth: 78,
    wallMinHeight: 62,
    wallMaxHeight: 132
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
    pits: [],
    walls: [],
    collectibles: [],
    nextSpawnX: 0
  };

  const runner = {
    width: 46,
    height: 58,
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
    world.pits.length = 0;
    world.walls.length = 0;
    world.collectibles.length = 0;
    world.nextSpawnX = world.width * 0.9;

    runner.y = world.groundY - runner.height;
    runner.vy = 0;
    runner.onGround = true;
    runner.coyoteTime = 0;
    runner.jumpBuffer = 0;
    runner.tilt = 0;

    ensureGenerated();
    updateHud();
  }

  function showOverlay(title, subtitle, buttonText) {
    titleEl.textContent = title;
    subtitleEl.textContent = subtitle;
    actionButton.textContent = buttonText;
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

  function endRun(reason) {
    world.mode = "gameOver";
    const subtitle =
      reason === "pit"
        ? "You fell into a pit. Time that jump better."
        : "You hit a wall. Jump earlier to clear it.";
    showOverlay("Run Over", subtitle, "Run Again");
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

  function isOverPit(worldLeft, worldRight) {
    for (const pit of world.pits) {
      const pitLeft = pit.x;
      const pitRight = pit.x + pit.width;
      if (worldRight > pitLeft && worldLeft < pitRight) {
        return true;
      }
    }
    return false;
  }

  function hasWallCollision(worldLeft, worldRight, runnerTop, runnerBottom) {
    for (const wall of world.walls) {
      const wallLeft = wall.x;
      const wallRight = wall.x + wall.width;
      const wallTop = world.groundY - wall.height;
      const xOverlaps = worldRight > wallLeft && worldLeft < wallRight;
      const yHitsFace = runnerBottom > wallTop + 4 && runnerTop < world.groundY;
      if (xOverlaps && yHitsFace) {
        return true;
      }
    }
    return false;
  }

  function collectItems(runnerCenterX, runnerCenterY) {
    for (const item of world.collectibles) {
      if (item.taken) {
        continue;
      }
      const bobY = item.y + Math.sin(world.elapsed * 5 + item.phase) * 5;
      const dx = runnerCenterX - item.x;
      const dy = runnerCenterY - bobY;
      const radius = item.radius + 14;
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

  function spawnPit(x) {
    const width = randomBetween(config.pitMin, config.pitMax);
    world.pits.push({ x, width });
    world.collectibles.push({
      x: x + width * 0.52,
      y: world.groundY - randomBetween(130, 195),
      radius: 11,
      phase: Math.random() * Math.PI * 2,
      taken: false
    });
    world.nextSpawnX = x + width + randomBetween(120, 220);
  }

  function spawnWall(x) {
    const width = randomBetween(config.wallMinWidth, config.wallMaxWidth);
    const height = randomBetween(config.wallMinHeight, config.wallMaxHeight);
    world.walls.push({ x, width, height });
    world.collectibles.push({
      x: x + width * 0.5,
      y: world.groundY - height - randomBetween(58, 115),
      radius: 10,
      phase: Math.random() * Math.PI * 2,
      taken: false
    });
    world.nextSpawnX = x + width + randomBetween(150, 240);
  }

  function ensureGenerated() {
    const target = world.cameraX + world.width * 2.3;
    while (world.nextSpawnX < target) {
      if (Math.random() < 0.52) {
        spawnPit(world.nextSpawnX);
      } else {
        spawnWall(world.nextSpawnX);
      }
    }
  }

  function pruneWorld() {
    const cullX = world.cameraX - 220;
    world.pits = world.pits.filter((pit) => pit.x + pit.width > cullX);
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
    const overPit = isOverPit(worldLeft + 8, worldRight - 8);

    if (!overPit && runner.y + runner.height >= world.groundY) {
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

    const runnerTop = runner.y;
    const runnerBottom = runner.y + runner.height;
    if (hasWallCollision(worldLeft, worldRight, runnerTop, runnerBottom)) {
      endRun("wall");
      return;
    }

    collectItems(runnerWorldX + runner.width * 0.5, runner.y + runner.height * 0.5);
    ensureGenerated();
    pruneWorld();
    updateHud();

    if (runner.y > world.height + 120) {
      endRun("pit");
    }
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
    ctx.fillStyle = "#e7d5a6";
    ctx.fillRect(0, world.groundY, world.width, world.height - world.groundY);

    ctx.fillStyle = "rgba(196, 154, 80, 0.35)";
    const stripeWidth = 64;
    const offset = (world.cameraX * 0.7) % stripeWidth;
    for (let x = -stripeWidth - offset; x < world.width + stripeWidth; x += stripeWidth) {
      ctx.fillRect(x, world.groundY + 28, stripeWidth * 0.5, 7);
    }
  }

  function drawPits() {
    for (const pit of world.pits) {
      const x = pit.x - world.cameraX;
      if (x + pit.width < -80 || x > world.width + 80) {
        continue;
      }
      const gradient = ctx.createLinearGradient(0, world.groundY, 0, world.height);
      gradient.addColorStop(0, "#443623");
      gradient.addColorStop(1, "#0e0b08");
      ctx.fillStyle = gradient;
      ctx.fillRect(x, world.groundY, pit.width, world.height - world.groundY + 20);
    }
  }

  function drawWalls() {
    for (const wall of world.walls) {
      const x = wall.x - world.cameraX;
      if (x + wall.width < -80 || x > world.width + 80) {
        continue;
      }
      const top = world.groundY - wall.height;
      ctx.fillStyle = "#a85842";
      ctx.fillRect(x, top, wall.width, wall.height);
      ctx.fillStyle = "#c97055";
      ctx.fillRect(x + 4, top + 4, wall.width - 8, wall.height - 8);
    }
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
      ctx.fillStyle = "rgba(255, 230, 114, 0.38)";
      ctx.beginPath();
      ctx.arc(x, y, item.radius + 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffd95e";
      ctx.beginPath();
      ctx.arc(x, y, item.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff6cc";
      ctx.beginPath();
      ctx.arc(x - 3, y - 3, item.radius * 0.36, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawRunner() {
    const x = world.width * config.runnerScreenRatio;
    const y = runner.y;
    const runCycle = world.elapsed * Math.max(5, world.speed / 56);

    runner.tilt += (Math.max(-0.2, Math.min(0.2, -runner.vy * 0.0008)) - runner.tilt) * 0.2;

    ctx.save();
    ctx.translate(x + runner.width * 0.5, y + runner.height * 0.5);
    ctx.rotate(runner.tilt);

    ctx.fillStyle = "rgba(20, 35, 50, 0.25)";
    ctx.beginPath();
    ctx.ellipse(0, runner.height * 0.54, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    const legSwing = Math.sin(runCycle) * (runner.onGround ? 7 : 2);
    ctx.strokeStyle = "#1a3345";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-10, 20);
    ctx.lineTo(-8, 34 + legSwing);
    ctx.moveTo(8, 20);
    ctx.lineTo(10, 34 - legSwing);
    ctx.stroke();

    ctx.fillStyle = "#f26a4b";
    fillRoundedRect(-16, -12, 32, 34, 10);

    ctx.fillStyle = "#ffd4b6";
    ctx.beginPath();
    ctx.arc(0, -22, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#13273a";
    ctx.beginPath();
    ctx.arc(3, -24, 2, 0, Math.PI * 2);
    ctx.fill();

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
    drawPits();
    drawWalls();
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
    window.addEventListener("resize", resizeCanvas);
  }

  resizeCanvas();
  resetWorld();
  showOverlay(
    "Right Runner",
    "Jump pits, walls, and grab floating items to run faster.",
    "Start Run"
  );
  setupInput();
  requestAnimationFrame(onFrame);
})();
