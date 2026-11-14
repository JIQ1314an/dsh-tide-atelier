# Changelog

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
