# Changelog

## 0.1.0 — release candidate

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
