import {
  CHARACTERS,
  MODES,
  PORTS,
  STAMPS,
  QUIPS,
  HAZARDS,
  TUNING as T,
  POWERUPS,
} from "./content.js";
import {
  createRun,
  stepRun,
  inputRun,
  drainEvents,
  dailySeed,
  getMedal,
  challengeUrl,
  readChallenge,
} from "./engine.js";
import { loadProfile, saveProfile, recordRun } from "./profile.js";
import { GameAudio } from "./audio.js";
import { loadArt, Renderer } from "./renderer.js";
const $ = (id) => document.getElementById(id);
const canvas = $("gameCanvas"),
  audio = new GameAudio();
let storage;
try {
  storage = window.localStorage;
} catch {
  storage = null;
}
let profile = loadProfile(storage),
  mode = "arcade",
  screen = "home",
  run = null,
  renderer = null;
let lastTime = 0,
  accumulator = 0,
  displayTime = 0,
  toastTime = 0,
  hudTime = 0,
  resultSaved = false;
let party = null,
  challenge = readChallenge(location.search),
  resumeCountdown = 0;
let lastDraw = 0;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const motion = () => profile.motion && !reducedMotion.matches;
const randomSeed = () =>
  `cruise-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`;
function persist() {
  if (!saveProfile(storage, profile))
    $("saveStatus").textContent =
      "STORAGE UNAVAILABLE · RECORDS LAST THIS SESSION";
}
function announce(message) {
  $("announcer").textContent = message;
}
function selectedCharacter() {
  return CHARACTERS.find((c) => c.id === profile.character) || CHARACTERS[0];
}
function renderBoarding() {
  if (renderer) renderer.dirty = true;
  $("barbraPowerOptions").hidden = profile.character !== "barbra";
  $("beerPowerButton").setAttribute(
    "aria-pressed",
    String(profile.barbraPower === "morning-beer"),
  );
  $("espressoPowerButton").setAttribute(
    "aria-pressed",
    String(profile.barbraPower === "espresso"),
  );
  $("bestLabel").replaceChildren(
    document.createTextNode("YOUR BEST "),
    Object.assign(document.createElement("b"), { textContent: profile.best }),
  );
  $("crewOptions").replaceChildren(
    ...CHARACTERS.map((char) => {
      const b = document.createElement("button");
      b.className = "crew-card";
      b.setAttribute("aria-pressed", String(profile.character === char.id));
      b.setAttribute("aria-label", `Play as ${char.name}. ${char.role}`);
      const img = Object.assign(document.createElement("img"), {
        src: `assets/cartoon/${char.id}-portrait.webp`,
        alt: "",
        width: 80,
        height: 90,
      });
      const copy = document.createElement("span");
      copy.append(
        Object.assign(document.createElement("strong"), {
          textContent: char.name,
        }),
        Object.assign(document.createElement("small"), {
          textContent: char.role,
        }),
      );
      b.append(img, copy);
      if (char.id === profile.character)
        b.append(
          Object.assign(document.createElement("span"), {
            className: "check",
            textContent: "✓",
          }),
        );
      b.addEventListener("click", () => {
        profile.character = char.id;
        persist();
        renderBoarding();
      });
      return b;
    }),
  );
  $("characterSpeech").textContent =
    profile.character === "bryan"
      ? "“I heard there were snacks.”"
      : selectedCharacter().quip;
  $("modeOptions").replaceChildren(
    ...Object.entries(MODES).map(([key, info]) => {
      const b = document.createElement("button");
      b.className = "mode-button";
      b.textContent = info.label;
      b.setAttribute("aria-pressed", String(mode === key));
      b.addEventListener("click", () => {
        mode = key;
        if (key !== "arcade") challenge = null;
        renderBoarding();
      });
      return b;
    }),
  );
  $("modeDetail").textContent = MODES[mode].detail;
  $("dailyBest").textContent =
    mode === "daily" ? `TODAY’S BEST ${profile.daily[dailySeed()] || 0}` : "";
  $("partySetup").hidden = mode !== "party";
  $("startButton").textContent =
    mode === "party"
      ? "Let the crew compete ↗"
      : mode === "daily"
        ? "Take today’s departure ↗"
        : mode === "practice"
          ? "Find your sea legs ↗"
          : challenge && !challenge.error
            ? "Take the challenge ↗"
            : "Let’s make a scene ↗";
  $("challengeNotice").hidden = !challenge;
  if (challenge)
    $("challengeNotice").textContent = challenge.error
      ? "That challenge belongs to a different voyage. Start a fresh run below."
      : `A friend left a score of ${challenge.target}. Your ticket includes their exact route. Beat it.`;
  const next = STAMPS.find((s) => !profile.stamps.includes(s.id));
  $("missionTitle").textContent = next
    ? next.title === "Sea legs"
      ? "Earn your sea legs."
      : `${next.title}.`
    : "A full passport. A proud mess.";
  $("missionText").textContent = next
    ? next.detail + ". Earn a stamp to make it official."
    : "All six stamps collected. The next high score is yours to chase.";
  $("stampCount").textContent = `${profile.stamps.length} / 6 STAMPS`;
  $("stampList").replaceChildren(
    ...STAMPS.map((s) => {
      const div = document.createElement("div"),
        earned = profile.stamps.includes(s.id);
      div.className = `stamp ${earned ? "earned" : ""}`;
      div.append(
        Object.assign(document.createElement("span"), {
          className: "stamp-icon",
          textContent: s.icon,
        }),
        Object.assign(document.createElement("strong"), {
          textContent: s.title,
        }),
        Object.assign(document.createElement("small"), {
          textContent: s.detail,
        }),
        Object.assign(document.createElement("span"), {
          className: "earned-label",
          textContent: earned ? "STAMPED ✓" : "STILL TO EARN",
        }),
      );
      return div;
    }),
  );
  syncSettings();
}
function syncSettings() {
  audio.enabled = profile.sound;
  $("soundButton").setAttribute("aria-pressed", String(profile.sound));
  $("soundSetting").checked = profile.sound;
  $("motionSetting").checked = profile.motion;
  $("legacyNote").hidden = !profile.legacyBest;
  $("legacyNote").textContent =
    `Your previous-edition best (${profile.legacyBest}) is preserved. This edition starts a separate record because scoring has changed.`;
}
function setScreen(next) {
  screen = next;
  const playing = next !== "home";
  document.body.dataset.playing = String(playing);
  $("homeScreen").hidden = playing;
  $("boardingControls").hidden = playing;
  $("playHud").hidden = !playing;
  $("touchControls").hidden = next !== "playing";
  $("playFootnote").hidden = !playing;
  $("pauseScreen").hidden = next !== "paused";
  $("resultScreen").hidden = next !== "over";
  $("sceneCaption").hidden = playing;
  canvas.tabIndex = next === "playing" ? 0 : -1;
  if (next !== "playing") $("gameToast").hidden = true;
  for (const id of ["jumpButton", "duckButton", "pauseButton"])
    $(id).disabled = next !== "playing";
  renderer?.resize();
}
function toast(message, duration = 2.5) {
  $("gameToast").textContent = message;
  $("gameToast").hidden = false;
  toastTime = duration;
  announce(message);
}
function parseParty() {
  const names = $("partyNames")
    .value.split(",")
    .map((s) => s.trim().slice(0, 22))
    .filter(Boolean);
  if (names.length < 2 || names.length > 6) {
    $("partyError").textContent =
      "Add between 2 and 6 names, separated by commas.";
    $("partyNames").focus();
    return null;
  }
  $("partyError").textContent = "";
  return { names, seed: randomSeed(), index: 0, scores: [] };
}
function start({ retry = false } = {}) {
  if (!renderer) return;
  audio.unlock();
  if (mode === "party" && !retry) {
    party = parseParty();
    if (!party) return;
  }
  if (mode !== "party") party = null;
  let seed =
    retry && run
      ? run.seed
      : mode === "daily"
        ? dailySeed()
        : mode === "party"
          ? party.seed
          : challenge && !challenge.error
            ? challenge.seed
            : randomSeed();
  if (mode === "party" && retry && party.index >= party.names.length) {
    party = { ...party, index: 0, scores: [] };
    seed = party.seed;
  }
  const runner = party
    ? CHARACTERS.find(
        (c) => c.name.toLowerCase() === party.names[party.index].toLowerCase(),
      )?.id || CHARACTERS[party.index % CHARACTERS.length].id
    : profile.character;
  run = createRun({
    seed,
    mode,
    character: runner,
    power: profile.barbraPower,
  });
  if (party)
    run.participant = {
      name: party.names[party.index],
      turn: party.index + 1,
      total: party.names.length,
    };
  resultSaved = false;
  renderer.clear();
  accumulator = 0;
  resumeCountdown = 0;
  setScreen("playing");
  canvas.focus({ preventScroll: true });
  updateHud();
  const name = party ? `${party.names[party.index]}’s turn. ` : "";
  toast(`${name}Jump the luggage. Duck the gulls.`, 3);
  if (matchMedia("(max-width:560px)").matches)
    $("arena").scrollIntoView({ block: "nearest", behavior: "instant" });
}
function updateHud() {
  if (!run) return;
  $("scoreValue").textContent = run.score;
  $("distanceValue").textContent = `${Math.floor(run.distance)} m`;
  $("portValue").textContent = PORTS[run.port].place.toUpperCase();
  $("bestInRun").textContent =
    `${run.mode === "practice" ? "PRACTICE" : "BEST"} ${run.mode === "practice" ? profile.practiceBest : profile.best}`;
  $("streakValue").replaceChildren(
    document.createTextNode(`◎ ${run.snacks}`),
    Object.assign(document.createElement("span"), {
      textContent: run.multiplier > 1 ? `×${run.multiplier} STREAK` : "DONUTS",
    }),
  );
  $("routeProgress").style.width =
    `${((run.distance % T.portDistance) / T.portDistance) * 100}%`;
  $("livesValue").hidden = run.mode !== "practice";
  $("livesValue").textContent =
    `${run.lives} ${run.lives === 1 ? "life" : "lives"} left`;
  $("boostTicket").hidden = run.boost <= 0;
  $("boostName").textContent = POWERUPS[run.power].label.toUpperCase();
  $("boostTime").textContent = `${run.boost.toFixed(1)} s · protected`;
  $("boostProgress").style.width = `${(run.boost / T.boostDuration) * 100}%`;
  $("runModeLabel").textContent = party
    ? `${run.participant.name} · ${run.participant.turn} of ${run.participant.total} · same route, same rules`
    : mode === "daily"
      ? `Daily departure · ${run.seed.slice(-10)} UTC`
      : challenge && !challenge.error
        ? `Friend’s challenge · beat ${challenge.target}`
        : mode === "practice"
          ? "Easy breezy · practice records stay separate"
          : "One life. Make it ridiculous.";
}
function showResults() {
  if (resultSaved) return;
  resultSaved = true;
  inputRun(run, "release");
  const result = recordRun(profile, run);
  profile = result.profile;
  persist();
  $("bestLabel").querySelector("b").textContent = profile.best;
  if (party)
    party.scores.push({
      name: party.names[party.index],
      score: run.score,
      turn: party.index,
    });
  setScreen("over");
  updateHud();
  $("resultEyebrow").textContent = result.newBest
    ? "A NEW PERSONAL BEST. TELL EVERYONE."
    : QUIPS[profile.runs % QUIPS.length].toUpperCase();
  $("resultTitle").textContent = HAZARDS[run.cause]?.fail || "What a voyage.";
  $("resultTip").textContent =
    HAZARDS[run.cause]?.tip || "There is always another departure.";
  if (challenge && !challenge.error)
    $("resultTip").textContent +=
      run.score > challenge.target
        ? ` You beat your friend’s ${challenge.target}!`
        : ` Your friend’s score: ${challenge.target}.`;
  $("resultScore").textContent = run.score;
  $("resultDistance").textContent = `${Math.floor(run.distance)} m`;
  $("resultSnacks").textContent =
    `${run.snacks} ${run.snacks === 1 ? "donut" : "donuts"} · ${run.boosts} ${run.boosts === 1 ? "boost" : "boosts"} · ${run.cleared} clear`;
  $("resultMedal").textContent = getMedal(run.score);
  $("unlockMessage").hidden = !result.unlocked.length;
  $("unlockMessage").textContent =
    `Passport stamped: ${result.unlocked.map((s) => s.title).join(" + ")}!`;
  $("shareStatus").textContent = "";
  $("shareFallback").hidden = true;
  $("shareButton").hidden = run.mode === "practice";
  $("partyResults").hidden = !party;
  $("partyResults").replaceChildren();
  if (party) {
    party.index++;
    const complete = party.index >= party.names.length;
    $("resultEyebrow").textContent = complete
      ? "THE CREW HAS SPOKEN"
      : `${party.names[party.index - 1].toUpperCase()} HAS LEFT THE DECK`;
    const scores = [...party.scores].sort(
      (a, b) => b.score - a.score || a.turn - b.turn,
    );
    if (complete) {
      const winners = scores
        .filter((s) => s.score === scores[0].score)
        .map((s) => s.name);
      $("resultTitle").textContent =
        winners.length > 1 ? "A glorious tie." : `${winners[0]} wins!`;
      $("resultTip").textContent =
        "Bragging rights valid until the next round.";
    }
    const table = document.createElement("table");
    table.className = "party-table";
    table.setAttribute("aria-label", "Crew scores");
    for (const s of scores) {
      const tr = document.createElement("tr");
      tr.append(
        Object.assign(document.createElement("td"), { textContent: s.name }),
        Object.assign(document.createElement("td"), {
          textContent: `${s.score} pts`,
        }),
      );
      table.append(tr);
    }
    $("partyResults").append(table);
    $("retryButton").textContent = complete
      ? "Rematch. Same questionable crew ↗"
      : `Pass to ${party.names[party.index]} →`;
  } else $("retryButton").textContent = "One more go. Same route ↗";
  announce(
    `Run over. ${run.score} points. ${Math.floor(run.distance)} meters. ${result.newBest ? "New best!" : ""}`,
  );
  $("retryButton").focus({ preventScroll: true });
}
function home() {
  announce("");
  inputRun(run ?? {}, "release");
  setScreen("home");
  run = null;
  party = null;
  resumeCountdown = 0;
  renderer?.clear();
  renderBoarding();
  $("startButton").focus({ preventScroll: true });
}
function pause() {
  if (screen !== "playing") return;
  inputRun(run, "release");
  run.buffer = 0;
  setScreen("paused");
  $("resumeButton").textContent = "Back to the chaos →";
  $("resumeButton").focus({ preventScroll: true });
  announce("Game paused.");
}
function resume() {
  if (screen !== "paused") return;
  setScreen("playing");
  resumeCountdown = 1;
  accumulator = 0;
  toast("Steady…", 1);
  canvas.focus({ preventScroll: true });
}
function openDialog(id) {
  if (screen === "playing") pause();
  $(id).showModal();
}
function jump() {
  if (screen !== "playing" || resumeCountdown > 0) return;
  audio.unlock();
  inputRun(run, "jump");
}
function duck() {
  if (screen !== "playing" || resumeCountdown > 0) return;
  audio.unlock();
  inputRun(run, "duck");
}
function release() {
  if (run) inputRun(run, "release");
}
$("startButton").addEventListener("click", () => start());
$("retryButton").addEventListener("click", () => start({ retry: true }));
$("resultHomeButton").addEventListener("click", home);
$("pauseHomeButton").addEventListener("click", home);
$("pauseButton").addEventListener("click", pause);
$("resumeButton").addEventListener("click", resume);
$("helpButton").addEventListener("click", () => openDialog("helpDialog"));
$("settingsButton").addEventListener("click", () =>
  openDialog("settingsDialog"),
);
$("helpDone").addEventListener("click", () => $("helpDialog").close());
$("settingsDone").addEventListener("click", () => $("settingsDialog").close());
$("soundButton").addEventListener("click", () => {
  profile.sound = !profile.sound;
  syncSettings();
  audio.unlock();
  persist();
});
$("soundSetting").addEventListener("change", (e) => {
  profile.sound = e.target.checked;
  syncSettings();
  audio.unlock();
  persist();
});
$("motionSetting").addEventListener("change", (e) => {
  profile.motion = e.target.checked;
  persist();
});
$("passportButton").addEventListener("click", () => {
  const open = $("stampList").hidden;
  $("stampList").hidden = !open;
  $("passportButton").setAttribute("aria-expanded", String(open));
  $("passportButton").textContent = open ? "Close stamps −" : "View stamps +";
});
for (const id of ["jumpButton", "gameCanvas"]) {
  $(id).addEventListener("contextmenu", (e) => e.preventDefault());
  $(id).addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    $(id).setPointerCapture?.(e.pointerId);
    jump();
  });
  $(id).addEventListener("pointerup", release);
  $(id).addEventListener("pointercancel", release);
  $(id).addEventListener("lostpointercapture", release);
}
$("duckButton").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  duck();
});
// Keyboard activation for assistive technology and focused touch buttons.
$("jumpButton").addEventListener("click", (e) => {
  if (e.detail === 0) jump();
});
$("duckButton").addEventListener("click", (e) => {
  if (e.detail === 0) duck();
});
window.addEventListener("keydown", (e) => {
  if (
    e.altKey ||
    e.metaKey ||
    e.ctrlKey ||
    document.querySelector("dialog[open]") ||
    ["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)
  )
    return;
  if (["Escape", "KeyP"].includes(e.code)) {
    e.preventDefault();
    if (e.repeat) return;
    if (screen === "playing") pause();
    else if (screen === "paused") resume();
    return;
  }
  if (screen !== "playing" || e.target.tagName === "BUTTON") return;
  if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
    e.preventDefault();
    if (!e.repeat) jump();
  }
  if (["ArrowDown", "KeyS", "ShiftLeft", "ShiftRight"].includes(e.code)) {
    e.preventDefault();
    if (!e.repeat) duck();
  }
});
window.addEventListener("keyup", (e) => {
  if (["Space", "ArrowUp", "KeyW"].includes(e.code)) release();
});
window.addEventListener("blur", pause);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
  lastTime = 0;
});
window.addEventListener("resize", () => {
  if (screen === "playing") pause();
  renderer?.resize();
});
new ResizeObserver(() => renderer?.resize()).observe($("arena"));
$("shareButton").addEventListener("click", async () => {
  const url = challengeUrl(location.href, run),
    text = `${CHARACTERS.find((c) => c.id === run.character).name} scored ${run.score} in Bryan’s Bonkers Cruise Dash. Same route. Think you can beat it?`;
  try {
    if (navigator.share) {
      await navigator.share({
        title: "A very unrelaxing challenge",
        text,
        url,
      });
      $("shareStatus").textContent = "Challenge ready for your crew.";
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      $("shareStatus").textContent =
        "Challenge copied. Drop it in your group chat.";
    } else throw new Error("clipboard unavailable");
  } catch (e) {
    if (e.name === "AbortError") return;
    $("shareFallback").hidden = false;
    $("shareFallback").value = url;
    $("shareFallback").focus();
    $("shareFallback").select();
    $("shareStatus").textContent = "Copy this link to challenge your crew.";
  }
});
function frame(now) {
  const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.08) : 0;
  lastTime = now;
  displayTime += dt;
  if (screen === "playing") {
    if (resumeCountdown > 0) {
      resumeCountdown = Math.max(0, resumeCountdown - dt);
      if (resumeCountdown === 0) toast("Go!", 0.5);
    } else {
      accumulator += dt;
      while (accumulator >= T.step && run.status === "running") {
        stepRun(run, T.step);
        accumulator -= T.step;
      }
      for (const e of drainEvents(run)) {
        renderer.event(e);
        audio.play(e.type);
        if (e.type === "boost") toast(POWERUPS[e.power].toast, 2);
        if (e.type === "port")
          toast(`${PORTS[e.port].name}! ${PORTS[e.port].toast}`, 2.8);
        if (e.type === "voyage")
          toast("Voyage complete! The buffet legend sails on.", 3);
        if (e.type === "hit" && run.lives > 0)
          toast(`${run.lives} lives left. Shake it off.`, 1.8);
      }
      if (run.status === "over") showResults();
    }
    hudTime += dt;
    if (hudTime > 0.08) {
      updateHud();
      hudTime = 0;
    }
    if (toastTime > 0) {
      toastTime -= dt;
      if (toastTime <= 0) $("gameToast").hidden = true;
    }
  }
  if (
    renderer &&
    (renderer.dirty ||
      screen === "playing" ||
      (screen === "home" && motion() && now - lastDraw >= 1000 / 30))
  ) {
    renderer.draw(run, {
      home: screen === "home",
      character: profile.character,
      power: profile.barbraPower,
      time: screen === "paused" ? run.time : displayTime,
      dt: screen === "playing" ? dt : 0,
      motion: motion(),
    });
    lastDraw = now;
  }
  requestAnimationFrame(frame);
}
for (const [id, power] of [
  ["beerPowerButton", "morning-beer"],
  ["espressoPowerButton", "espresso"],
]) {
  $(id).addEventListener("click", () => {
    if (profile.character !== "barbra") return;
    profile.barbraPower = power;
    persist();
    renderBoarding();
  });
}
renderBoarding();
setScreen("home");
persist();
try {
  const art = await loadArt();
  renderer = new Renderer(canvas, art);
  $("startButton").disabled = false;
  requestAnimationFrame(frame);
} catch (error) {
  $("startButton").textContent = "Reload to finish boarding";
  $("startButton").disabled = false;
  $("startButton").addEventListener("click", () => location.reload(), {
    once: true,
  });
  announce("The artwork could not load. Reload to try again.");
  console.error(error);
}

// Only production builds include the offline worker marker. Development stays uncached.
if (
  "serviceWorker" in navigator &&
  document.querySelector("meta[name=cruise-build]")
) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
