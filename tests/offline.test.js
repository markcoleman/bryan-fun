import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createOfflineWorker } from "../scripts/offline-worker.mjs";
function worker({ offline = false } = {}) {
  const scope = "https://example.com/bryan-fun/",
    handlers = {},
    deleted = [],
    added = [];
  const key = (url) =>
    new URL(typeof url === "string" ? url : url.url, scope).href;
  const entries = new Map([
    [key("./"), "cached HTML"],
    [key("./src/game.js?v=3"), "cached JS"],
  ]);
  const cache = {
    async addAll(files) {
      added.push(...files);
    },
    async match(req, options = {}) {
      let target = key(req);
      if (options.ignoreSearch) target = target.split("?")[0];
      return entries.get(target);
    },
  };
  const sandbox = {
    URL,
    self: {
      registration: { scope },
      location: { origin: "https://example.com" },
      skipWaiting: async () => {},
      clients: { claim: async () => {} },
      addEventListener: (type, fn) => {
        handlers[type] = fn;
      },
    },
    caches: {
      open: async () => cache,
      keys: async () => [
        `cruise:${scope}:old`,
        `cruise:${scope}:new`,
        "cruise:https://example.com/other/:old",
        "unrelated",
      ],
      delete: async (name) => {
        deleted.push(name);
      },
    },
    fetch: async () => {
      if (offline) throw Error("Offline");
      return "network HTML";
    },
  };
  vm.runInNewContext(
    createOfflineWorker("new", ["./", "./index.html", "./src/game.js?v=3"]),
    sandbox,
  );
  const dispatch = async (type, request) => {
    let promise;
    handlers[type]({
      request,
      waitUntil: (p) => {
        promise = p;
      },
      respondWith: (p) => {
        promise = p;
      },
    });
    return promise;
  };
  return { dispatch, deleted, added };
}
test("offline install precaches exact entrypoint URLs and activation preserves other apps", async () => {
  const w = worker();
  await w.dispatch("install");
  assert.ok(w.added.includes("./src/game.js?v=3"));
  await w.dispatch("activate");
  assert.deepEqual(w.deleted, ["cruise:https://example.com/bryan-fun/:old"]);
});
test("offline challenge navigation falls back to the cached shell and assets remain available", async () => {
  const w = worker({ offline: true });
  assert.equal(
    await w.dispatch("fetch", {
      url: "https://example.com/bryan-fun/?course=abc&target=42",
      method: "GET",
      mode: "navigate",
    }),
    "cached HTML",
  );
  assert.equal(
    await w.dispatch("fetch", {
      url: "https://example.com/bryan-fun/src/game.js?v=3",
      method: "GET",
      mode: "cors",
    }),
    "cached JS",
  );
});
test("online navigation refreshes HTML; unrelated origins and writes are not intercepted", async () => {
  const w = worker();
  assert.equal(
    await w.dispatch("fetch", {
      url: "https://example.com/bryan-fun/",
      method: "GET",
      mode: "navigate",
    }),
    "network HTML",
  );
  assert.equal(
    await w.dispatch("fetch", {
      url: "https://elsewhere.com/",
      method: "GET",
      mode: "navigate",
    }),
    undefined,
  );
  assert.equal(
    await w.dispatch("fetch", {
      url: "https://example.com/",
      method: "POST",
      mode: "cors",
    }),
    undefined,
  );
});
