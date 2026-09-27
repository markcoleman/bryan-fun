import { TUNING as T, HAZARDS, POWERUPS, characterPower } from "./content.js";
import { POSE, runnerPose, spriteSize, tilePositions } from "./animation.js";
const root = new URL("../assets/cartoon/", import.meta.url);
export async function loadArt() {
  const names = [
    "bryan",
    "barbra",
    "kyle",
    "props",
    "drinks",
    ...Array.from({ length: 5 }, (_, i) => `port-${i + 1}`),
  ];
  const entries = await Promise.all(
    names.map(
      (name) =>
        new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve([name, image]);
          image.onerror = () => reject(new Error(`Could not load ${name}`));
          image.src = new URL(`${name}.webp`, root).href;
        }),
    ),
  );
  const response = await fetch(new URL("frames.json", root));
  if (!response.ok) throw new Error("Sprite metadata unavailable");
  return {
    ...Object.fromEntries(entries),
    metadata: await response.json(),
  };
}
export class Renderer {
  constructor(canvas, art) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.art = art;
    this.particles = [];
    this.labels = [];
    this.shake = 0;
    this.motion = true;
    this.resize();
  }
  resize() {
    this.dirty = true;
    const r = this.canvas.getBoundingClientRect(),
      dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = r.width;
    this.height = r.height;
    this.canvas.width = Math.round(r.width * dpr);
    this.canvas.height = Math.round(r.height * dpr);
    this.ctx.imageSmoothingQuality = "high";
    this.dpr = dpr;
    this.scale = this.width / T.worldWidth;
    this.h = this.height / this.scale;
    this.ground = this.h - Math.max(68, Math.min(125, this.h * 0.17));
  }
  event(e) {
    if (e.type === "hit" && this.motion) this.shake = 0.2;
    if (e.type === "snack") {
      this.labels.push({ x: e.x, y: e.y, text: `+${e.value}`, life: 0.65 });
      if (this.motion)
        for (let i = 0; i < 7; i++)
          this.particles.push({
            x: e.x,
            y: e.y,
            vx: (i - 3) * 35,
            vy: -70 - Math.abs(i - 3) * 17,
            life: 0.5,
            color: i % 2 ? "#f4cb70" : "#df9379",
          });
    }
    if (e.type === "land" && this.motion)
      for (let i = 0; i < 4; i++)
        this.particles.push({
          x: T.runnerX + 22,
          y: T.groundY - 5,
          vx: -40 - i * 17,
          vy: -25 - i * 6,
          life: 0.3,
          color: "#bca783",
        });
  }
  clear() {
    this.particles = [];
    this.labels = [];
    this.shake = 0;
  }
  draw(
    run,
    {
      home = false,
      character = "bryan",
      power = "morning-beer",
      time = 0,
      dt = 0,
      motion = true,
    } = {},
  ) {
    this.dirty = false;
    const c = this.ctx;
    this.motion = motion;
    c.setTransform(this.dpr * this.scale, 0, 0, this.dpr * this.scale, 0, 0);
    c.clearRect(0, 0, 800, this.h);
    const port = home ? 0 : run.port;
    const sky = ["#72b9ed", "#70b9ed", "#83ccec", "#bd9a9a", "#aa91b9"][port];
    c.fillStyle = sky;
    c.fillRect(0, 0, 800, this.h);
    // Wide side-on scenery travels through the world; the deck and clouds move at distinct depths.
    const scroll = home ? (motion ? time * 30 : 0) : run.scroll;
    const bg = this.art[`port-${port + 1}`];
    const railBottom = [0.805, 0.775, 0.775, 0.82, 0.815][port];
    const bh = Math.min(620, this.ground / railBottom);
    const top = this.ground - bh * railBottom;
    const bw = (bg.width / bg.height) * bh;
    const tileIndex = Math.floor((scroll * 0.36 + bw * 0.1) / bw);
    for (const [i, x] of tilePositions(
      scroll,
      0.36,
      bw,
      800,
      bw * 0.1,
    ).entries()) {
      // Alternating the wide, text-free panoramas joins identical edge pixels at each wrap.
      c.save();
      c.translate(x + bw / 2, 0);
      c.scale((tileIndex + i) % 2 ? -1 : 1, 1);
      c.drawImage(bg, -bw / 2, top, bw + 1, bh);
      c.restore();
    }
    if (top > 0) {
      const horizonBlend = c.createLinearGradient(0, top, 0, top + 80);
      horizonBlend.addColorStop(0, sky);
      horizonBlend.addColorStop(1, `${sky}00`);
      c.fillStyle = horizonBlend;
      c.fillRect(0, top - 1, 800, 81);
    }
    if (motion) {
      c.globalAlpha = 0.55;
      for (const x of tilePositions(scroll, 0.075, 480, 960, 140))
        this.prop(5, x + 100, this.ground * 0.14, 110, 70);
      c.globalAlpha = 1;
    }
    c.save();
    c.translate(0, this.ground - T.groundY);
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt);
      c.translate(Math.sin(this.shake * 150) * this.shake * 13, 0);
    }
    // Sunlit deck with paper fibers, moving ink seams and cast shadows.
    c.fillStyle = ["#dda671", "#d9a578", "#e0b477", "#c38a52", "#a07364"][port];
    c.fillRect(0, T.groundY, 800, this.h);
    c.strokeStyle = ["#ae784c", "#a87951", "#b8874f", "#956339", "#80584f"][
      port
    ];
    c.lineWidth = 1;
    for (let y = T.groundY + 26; y < this.h + T.groundY; y += 37) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(800, y + 3);
      c.stroke();
    }
    for (let x = -(scroll * 0.95) % 140; x < 900; x += 140) {
      c.beginPath();
      c.moveTo(x, T.groundY + 2);
      c.lineTo(x - 45, T.groundY + 160);
      c.stroke();
      c.globalAlpha = 0.25;
      c.beginPath();
      c.moveTo(x + 25, T.groundY + 40);
      c.lineTo(x + 45, T.groundY + 39);
      c.stroke();
      c.globalAlpha = 1;
    }
    c.strokeStyle = "#f4c58e";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(0, T.groundY);
    c.lineTo(800, T.groundY + 1);
    c.stroke();
    if (home) {
      const mobile = this.width < 560,
        x = mobile ? 370 : 610;
      this.runner(
        character,
        motion ? 1 + (Math.floor(time * 10) % 6) : POSE.idle,
        x,
        T.groundY,
        mobile ? 190 : 185,
      );
      this.prop(
        POWERUPS[characterPower(character, power)].frame,
        x + 110,
        T.groundY - 54,
        44,
        54,
      );
    } else {
      for (const p of run.pickups) {
        if (p.taken || p.missed) continue;
        const x = p.x - run.scroll;
        if (x < -40 || x > 840) continue;
        const bob = motion ? Math.sin(time * 4 + p.x) * 2 : 0;
        const isBoost = Boolean(POWERUPS[p.kind]);
        this.prop(
          isBoost ? POWERUPS[p.kind].frame : 3,
          x,
          T.groundY - p.y + bob,
          isBoost ? 43 : 30,
          isBoost ? 52 : 30,
        );
        if (isBoost) {
          c.fillStyle = "#fff2bd";
          c.strokeStyle = "#845335";
          c.lineWidth = 1.5;
          c.beginPath();
          c.roundRect(x - 25, T.groundY - p.y - 48, 50, 16, 4);
          c.fill();
          c.stroke();
          c.font = "bold 9px sans-serif";
          c.textAlign = "center";
          c.fillStyle = "#6d422b";
          c.fillText("BOOST", x, T.groundY - p.y - 37);
        }
      }
      for (const o of run.obstacles) {
        const x = o.x - run.scroll,
          h = HAZARDS[o.type];
        if (x < -100 || x > 880) continue;
        c.globalAlpha = o.hit ? 0.4 : 1;
        c.fillStyle = "#6c684b25";
        c.beginPath();
        c.ellipse(
          x + h.width * 0.65 + 10,
          T.groundY + 5,
          h.width * 0.62,
          5,
          0,
          0,
          Math.PI * 2,
        );
        c.fill();
        if (o.type === "baggage") {
          for (const offset of [0, 47])
            this.prop(
              0,
              x + offset + 23,
              T.groundY,
              51,
              h.height + 13,
              "bottom",
            );
        } else {
          const gull = o.type === "gull";
          if (gull) {
            c.save();
            c.translate(2 * (x + h.width / 2), 0);
            c.scale(-1, 1);
          }
          this.prop(
            h.frame,
            x + h.width / 2,
            T.groundY - h.bottom,
            gull ? 94 : h.width + 12,
            gull ? 105 : h.height + 12,
            "bottom",
          );
          if (gull) c.restore();
        }
        c.globalAlpha = 1;
        if (!o.passed && !o.hit) {
          c.font = "bold 9px sans-serif";
          c.textAlign = "center";
          c.fillStyle = o.type === "gull" ? "#fff7dc" : "#fff8e7";
          c.strokeStyle = o.type === "gull" ? "#527f85" : "#ac7656";
          c.lineWidth = 1;
          const labelY =
            T.groundY - h.bottom - (o.type === "gull" ? 105 : h.height) - 30;
          c.beginPath();
          c.roundRect(x + h.width / 2 - 23, labelY, 46, 17, 3);
          c.fill();
          c.stroke();
          c.fillStyle = o.type === "gull" ? "#38666d" : "#825840";
          c.fillText(h.instruction, x + h.width / 2, labelY + 11);
        }
      }
      const frame = runnerPose(run);
      if (run.boost > 0) {
        const x = T.runnerX + T.runnerWidth / 2;
        c.fillStyle = "#ffd25b45";
        c.strokeStyle = "#f7ce65";
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(x, T.groundY - run.y - 45, 44, 56, -0.1, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        if (motion) {
          c.strokeStyle = "#ffecb9";
          c.lineWidth = 4;
          c.lineCap = "round";
          for (let i = 0; i < 5; i++) {
            const end = x - 30 - ((run.scroll * 0.6 + i * 17) % 45);
            const y = T.groundY - run.y - 15 - i * 15;
            c.beginPath();
            c.moveTo(end - 30, y);
            c.lineTo(end, y);
            c.stroke();
          }
        }
      }
      c.globalAlpha =
        run.boost === 0 && run.invulnerable > 0 && Math.floor(run.time * 12) % 2
          ? 0.65
          : 1;
      this.runner(
        run.character,
        frame,
        T.runnerX + T.runnerWidth / 2,
        T.groundY - run.y,
        104,
        run.y,
      );
      c.globalAlpha = 1;
      for (const p of this.particles) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 200 * dt;
        c.globalAlpha = Math.max(0, p.life * 2);
        c.fillStyle = p.color;
        c.fillRect(p.x, p.y, 4, 4);
      }
      c.globalAlpha = 1;
      for (const l of this.labels) {
        l.life -= dt;
        l.y -= dt * 32;
        c.globalAlpha = Math.max(0, l.life * 1.5);
        c.font = "bold 17px Georgia";
        c.textAlign = "center";
        c.fillStyle = "#8e5943";
        c.fillText(l.text, l.x, l.y);
      }
      c.globalAlpha = 1;
      this.particles = this.particles.filter((p) => p.life > 0);
      this.labels = this.labels.filter((p) => p.life > 0);
    }
    c.restore();
    // Warm light in the sun's direction, without obscuring obstacle silhouettes.
    const light = c.createLinearGradient(800, 0, 160, this.h);
    light.addColorStop(0, "#ffe9a81c");
    light.addColorStop(1, "#fff5d900");
    c.fillStyle = light;
    c.fillRect(0, 0, 800, this.h);
  }
  prop(frame, x, y, maxWidth, maxHeight, anchor = "center") {
    const f = this.art.metadata.props[frame];
    const scale = Math.min(maxWidth / f.w, maxHeight / f.h);
    const w = f.w * scale,
      h = f.h * scale;
    this.ctx.drawImage(
      this.art[f.image || "props"],
      f.x,
      f.y,
      f.w,
      f.h,
      x - w / 2,
      y - (anchor === "bottom" ? h : h / 2),
      w,
      h,
    );
  }
  runner(character, frame, x, y, size, height = 0) {
    const c = this.ctx;
    c.fillStyle = "#3b51442b";
    c.beginPath();
    c.ellipse(
      x + 12,
      y + height + 3,
      Math.max(10, size * 0.25 - height * 0.035),
      Math.max(3, size * 0.045),
      -0.05,
      0,
      Math.PI * 2,
    );
    c.fill();
    const frames = this.art.metadata.characters[character];
    const f = frames[frame];
    const { width: drawWidth, height: drawHeight } = spriteSize(
      frames,
      frame,
      size * 0.86,
    );
    // The airborne stride has tucked legs; lift the feet instead of planting that pose on deck.
    const strideLift = frame === 4 ? size * 0.12 : 0;
    c.drawImage(
      this.art[character],
      f.x,
      f.y,
      f.w,
      f.h,
      x - drawWidth / 2,
      y - drawHeight - strideLift,
      drawWidth,
      drawHeight,
    );
  }
}
