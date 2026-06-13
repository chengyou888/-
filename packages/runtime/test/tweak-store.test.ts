import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTweakPublishIssueUrl,
  DEFAULT_TWEAK_STORE_INDEX_URL,
  normalizeGitHubRepo,
  normalizeStoreRegistry,
  shuffleStoreEntries,
  storeArchiveUrl,
} from "../src/tweak-store";

test("default tweak store index is mirrored to the project owner repository", () => {
  assert.equal(
    DEFAULT_TWEAK_STORE_INDEX_URL,
    "https://raw.githubusercontent.com/chengyou888/-/main/codex-plusplus-store/index.json",
  );
});

test("normalizeGitHubRepo accepts common GitHub repo forms", () => {
  assert.equal(normalizeGitHubRepo("example/codex-plusplus"), "example/codex-plusplus");
  assert.equal(
    normalizeGitHubRepo("https://github.com/example/codex-plusplus.git"),
    "example/codex-plusplus",
  );
  assert.equal(
    normalizeGitHubRepo("git@github.com:example/codex-plusplus.git"),
    "example/codex-plusplus",
  );
});

test("normalizeStoreRegistry requires approved full commit shas and sorts by name", () => {
  const registry = normalizeStoreRegistry({
    schemaVersion: 1,
    entries: [
      storeEntry("co.example.low", "Low"),
      storeEntry("co.example.high", "High"),
    ],
  });

  assert.deepEqual(registry.entries.map((entry) => entry.id), ["co.example.high", "co.example.low"]);
  assert.throws(
    () =>
      normalizeStoreRegistry({
        schemaVersion: 1,
        entries: [{ ...storeEntry("co.example.bad", "Bad"), approvedCommitSha: "main" }],
      }),
    /full approved commit SHA/,
  );
});

test("storeArchiveUrl installs from the approved commit archive", () => {
  const entry = storeEntry("co.example.good", "Good");
  assert.equal(
    storeArchiveUrl(entry),
    `https://codeload.github.com/example/good/tar.gz/${entry.approvedCommitSha}`,
  );
});

test("storeArchiveUrl prefers a mirrored approved archive URL", () => {
  const archiveUrl =
    "https://raw.githubusercontent.com/chengyou888/-/main/codex-plusplus-store/archives/co.example.good/1234567890abcdef1234567890abcdef12345678.tar.gz";
  const registry = normalizeStoreRegistry({
    schemaVersion: 1,
    entries: [
      {
        ...storeEntry("co.example.good", "Good"),
        archiveUrl,
      },
    ],
  });

  assert.equal(storeArchiveUrl(registry.entries[0]!), archiveUrl);
});

test("shuffleStoreEntries randomizes presentation order without mutating the registry", () => {
  const entries = ["a", "b", "c", "d"];
  const draws = [0, 1, 1];
  const shuffled = shuffleStoreEntries(entries, (exclusiveMax) => {
    assert.ok(exclusiveMax >= 2);
    return draws.shift() ?? 0;
  });

  assert.deepEqual(shuffled, ["d", "c", "b", "a"]);
  assert.deepEqual(entries, ["a", "b", "c", "d"]);
});

test("shuffleStoreEntries rejects biased out-of-range random indexes", () => {
  assert.throws(
    () => shuffleStoreEntries(["a", "b"], () => 2),
    /expected an integer from 0 to 1/,
  );
});

test("publish issue URL pins the commit admins must review", () => {
  const url = new URL(buildTweakPublishIssueUrl({
    repo: "example/good",
    defaultBranch: "main",
    commitSha: "1234567890abcdef1234567890abcdef12345678",
    commitUrl: "https://github.com/example/good/commit/1234567890abcdef1234567890abcdef12345678",
    manifest: {
      id: "co.example.good",
      name: "Good",
      version: "1.0.0",
      description: "A useful tweak.",
      iconUrl: "https://example.com/icon.png",
    },
  }));
  assert.equal(url.origin + url.pathname, "https://aiopentool.com/");
  assert.equal(url.searchParams.get("title"), "Tweak store review: example/good");
  assert.match(url.searchParams.get("body") ?? "", /1234567890abcdef1234567890abcdef12345678/);
  assert.match(url.searchParams.get("body") ?? "", /Do not approve a different commit/);
  assert.match(url.searchParams.get("body") ?? "", /iconUrl: https:\/\/example\.com\/icon\.png/);
});

function storeEntry(id: string, name: string) {
  const repo = `example/${name.toLowerCase()}`;
  return {
    id,
    repo,
    approvedCommitSha: "1234567890abcdef1234567890abcdef12345678",
    approvedAt: "2026-05-02T00:00:00.000Z",
    approvedBy: "bennett",
    manifest: {
      id,
      name,
      version: "1.0.0",
      githubRepo: repo,
      iconUrl: "https://example.com/icon.png",
    },
  };
}
