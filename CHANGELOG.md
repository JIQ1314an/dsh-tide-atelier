# Changelog

## 0.1.1 — 2026-11-14

Same fixed artifact as the re-pointed `v0.1.0` tag; this version exists **only to
repair the npm channel**, where `0.1.0` was published broken on 2026-11-13 and
npm refuses to overwrite a published version.

- `client.js` registers as `dsh-tide-atelier` (the package name).
- `scripts/verify.mjs` contract gate, wired into `npm run check` / `prepublishOnly`.
- `CHANGELOG.md` now ships inside the package so installs can read what happened.

### Publish record

Published 2026-11-14 from this commit as a tarball (`npm publish dsh-tide-atelier-0.1.1.tgz`),
because the machine's default npm registry is the `registry.npmmirror.com` mirror —
publishing has to name the source registry explicitly:

```powershell
npm publish --registry=https://registry.npmjs.org --access public
```

- shasum `0d3b7703672ed839a65f20c49c54059c33ed0783`
- integrity `sha512-SbKQkzxmrv26WDRLqMsXrNppQM89YAI60kOATLtV7+66RUCksZSfE5EulUAfazOL2RZkLKPH8mMsAmBvju4/AQ==`
- `latest` → `0.1.1`; the mirror had it within ~2 minutes.
- Deprecated: `0.1.0` ("broken: client bundle registered the pre-rename module id
  `@local/dsh-activity-quest`, so the plugin renders nothing. Use 0.1.1.") and
  `0.0.0-stage` (placeholder publish, no usable client bundle).

### Upgrade notes by channel

| Channel | State | Action |
|---|---|---|
| npm `latest` | ✅ `0.1.1`, verified | `dsh plugin --profile web add dsh-tide-atelier` |
| npm `0.1.0` | ❌ dead artifact, immutable, now deprecated | `remove` + `add dsh-tide-atelier@0.1.1` |
| Git `#v0.1.1` | ✅ same bytes as npm | works without a registry |
| Git `#v0.1.0` | ✅ fixed (re-pointed to `2e81516`) | already-working installs |
| Existing broken install | pinned to an old commit or npm `0.1.0` | `remove` then `add`; a changed git specifier is required for pnpm to re-resolve |

## 0.1.0 — release candidate

### Fixed (tag `v0.1.0` re-pointed, 2026-11-14)

- **Client module registration id.** `client.js` registered itself as
  `@local/dsh-activity-quest`, the pre-rename development package name. DSH's
  browser module system keys every boot-graph row by the *installed package
  name* (`dsh-tide-atelier`), so the bundle was fetched, executed, and then
  rejected with
  `client-modules: could not load "dsh-tide-atelier": ... loaded without registering "dsh-tide-atelier" via __ModuleLoader__.load`.
  Symptom: clean install, host entry mounted, and **nothing visible in the UI**.
  The registration now uses `dsh-tide-atelier`.
- Added `scripts/verify.mjs` (wired into `npm run check` and `prepublishOnly`):
  it fails on any drift between `package.json` and the shipped artifact — the
  registration id, the bundle-patch row name, `dsh.client` fields, `files`
  presence — and smoke-runs `factory(require)` + `apply(ctx)` against stubbed
  browser/DSH APIs to confirm the `conversation.input.dock` and `shell.overlay`
  slots still register. Renaming the package can no longer ship a dead plugin.

> The original `v0.1.0` tag pointed at commit `4b17606`, which contains the
> defect above. The tag now points at the fixed commit. Anyone who installed
> before this fix must re-run the install command to pick it up
> (git dependencies are pinned to the commit recorded in the profile lock).

### Features

- Initial public release candidate of Tide Atelier / 潮汐工坊.
- Client-only DSH Web plugin with a floating, draggable whale-maid pet.
- Three generative forms driven by real agent activity: constellation, garden, city.
- Tool calls, completed calls, subagents, errors and streamed characters map to
  visual events.
- Gallery stores compact task descriptors so past tasks can be re-rendered in
  any form; up to 8 entries per session.
- Three chiptune motifs with activity layers; mute preference persisted.
- 3D whale-maid GLB generated from the project's three-view reference with
  Tencent Hunyuan3D 2.1, compressed and embedded in the client bundle.
- Front-facing 3D presentation: idle bob, pointer lean, click bounce, drag tilt,
  state reactions. No skeleton; no 360° spin; the single-image back side is not
  shown.
- No host process, no network requests, no model-facing tools.
- Split licensing: MIT for code; CC BY-NC-SA 4.0 for character assets.

### Known limits

- The 3D model is generated from a single front view; the back is incomplete.
- No skeletal animation, blink, walking or independent arm motion.
- The client bundle is about 2.7 MB because it embeds Three.js and the model.
- The artwork is driven by activity counts, not semantic understanding.
