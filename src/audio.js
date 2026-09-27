// Tiny synthesized sound palette; no downloads, autoplay, or timers outside user gestures.
export class GameAudio {
  constructor() {
    this.enabled = true;
    this.context = null;
  }
  unlock() {
    if (!this.enabled) return;
    try {
      this.context ??= new (window.AudioContext || window.webkitAudioContext)();
      if (this.context.state === "suspended")
        this.context.resume().catch(() => {});
    } catch {
      this.enabled = false;
    }
  }
  play(type) {
    const ctx = this.context;
    if (!this.enabled || !ctx || ctx.state !== "running") return;
    const tones = {
      jump: [330, 510, 0.09],
      snack: [750, 1050, 0.09],
      boost: [420, 1400, 0.4],
      hit: [170, 55, 0.22],
      port: [440, 880, 0.3],
      duck: [200, 130, 0.08],
      land: [90, 55, 0.035],
      clear: [350, 390, 0.035],
    };
    const [a, b, d] = tones[type] || tones.port;
    const osc = ctx.createOscillator(),
      gain = ctx.createGain();
    osc.type = type === "hit" ? "triangle" : "sine";
    osc.frequency.setValueAtTime(a, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(b, ctx.currentTime + d);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      type === "land" ? 0.018 : 0.065,
      ctx.currentTime + 0.008,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + d + 0.02);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }
}
