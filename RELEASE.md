# Release checklist — Tide Atelier

This directory is the clean publish candidate. It intentionally contains only
runtime files, docs, licenses and the model preview. Do not copy the development
workspace's `reference/`, `tools/`, `.tools/`, `node_modules/`, old backups or the
HF token file into this repository.

## 0. Name

- Brand: **Tide Atelier / 潮汐工坊**
- npm package: **`dsh-tide-atelier`** (checked available on 2026-11-13)
- GitHub repository: **`JIQ1314an/dsh-tide-atelier`** (public repo not created yet as of this writing)
- GitHub account: **`JIQ1314an`**
- The GitHub user `tide-atelier` already exists; do not use that identity.

## 1. Metadata (filled)

- `package.json`: `repository`, `bugs` and `homepage` point to
  `JIQ1314an/dsh-tide-atelier`.
- `README.md`: repository link is filled in.
- `package.json`: `author` is `Tide Atelier contributors`; change it to your
  personal name/handle only if you want to.
- `license` is `MIT AND CC-BY-NC-SA-4.0`; both `LICENSE` and
  `LICENSE-ASSETS` are present.
- Before npm publish, create the public GitHub repository and push this
  directory so the `repository` URL resolves.

## 2. Verify locally

```powershell
cd D:\Project\dsh-tide-atelier
npm run verify
npm run check
npm run pack:check
```

`npm run verify` (`scripts/verify.mjs`) is the gate that the broken `v0.1.0`
would have caught: it compares the shipped `client.js` against the manifest and
proves the module actually comes up.

- `window.__ModuleLoader__.load({ id: … })` must be **exactly**
  `package.json.name`. DSH keys every browser boot-graph row by the installed
  package name, so a stale id (the pre-rename `@local/dsh-activity-quest`)
  installs cleanly, mounts cleanly, and renders nothing — the browser fails with
  `client-modules: could not load "dsh-tide-atelier": … loaded without registering "dsh-tide-atelier" via __ModuleLoader__.load`.
- The bundle-patch row `name:` must equal the package name.
- `dsh.client.platform` must be `web`; `immediately`/`inject`/`external` keep their declared types.
- every `files` entry exists;
- the bundle evaluates, `factory(require)` materializes, `apply(ctx)` registers the
  `conversation.input.dock` and `shell.overlay` entries and the locale dictionary.

**Never rename the package without re-running `npm run verify`.**
**Do not add a `prepare` script.** The artifact is committed so that
`dsh plugin … add <git>#<tag>` stays a one-command install with no build-script
approval; a `prepare` hook would make every user approve it first.

`npm pack --dry-run` must list:

- `index.js`
- `client.js`
- `cordis.patch.yml`
- `locale/en.json`, `locale/zh.json`
- `icon.svg`
- `README.md`
- `CHANGELOG.md`
- `LICENSE`
- `LICENSE-ASSETS`
- `NOTICE`
- `docs/model-preview.png`

The tarball should be roughly 3 MB. No token, no reference images, no
development scripts.

If testing installation, disable/uninstall the live `@local/dsh-activity-quest`
first, then install this directory in a clean profile. Both register a pet
overlay; running both at once is not supported.

## 3. Publish

### 3a. Git tag (the current install path, npm publication pending)

Users install with one command, so the tag *is* the release artifact:

```powershell
npm run verify                                  # must pass
git add -A && git commit -m "fix(client): register module id as the package name"
git tag -f v0.1.0
git push origin main
git push -f origin refs/tags/v0.1.0
```

```powershell
dsh plugin --profile web add https://github.com/JIQ1314an/dsh-tide-atelier.git#v0.1.0
```

Re-pointing a tag is only acceptable while the version is young and nobody has
published against it; record the superseded commit in `CHANGELOG.md` and tell
existing installs to re-run the add command, because a profile's
`pnpm-lock.yaml` pins the resolved commit.

### 3b. npm

```powershell
npm login
npm publish --access public
```

Then verify:

```powershell
npm view dsh-tide-atelier version license repository.url
dsh plugin --profile web add dsh-tide-atelier
```

If `npm publish` says the name is taken, stop and re-check before renaming.
The package name was free at the time of writing, but npm names are global and
first-come.

## 4. GitHub

- Create a public repository `dsh-tide-atelier`.
- Push this directory.
- Add topics: `dsh`, `dsh-plugin`, `deepseek-harness`, `desktop-pet`,
  `whale-girl`, `threejs`, `generative-art`, `constellation`.
- Add a social preview image (1280×640).
- Create a release tag `v0.1.0` **on a commit where `npm run verify` passes** (see §3a; the
  first tag was moved because the commit behind it shipped a stale module id).
- Add the npm install command and a 20–30 s demo GIF to the README.
- Add 4–6 real UI screenshots:
  1. collapsed pet over the DSH page
  2. constellation while a tool is running
  3. garden after a task
  4. city with an error
  5. gallery
  6. form switcher / expanded panel
- Do not use logos, decorative borders or ads as market screenshots; use real
  usage and redact keys/personal data.

## 5. Submit to the market

The market is the independent community index
[Open Plugin Market](https://dshopen.org/), which DSH can read as a plugin
market. It is not an official DeepSeek product.

Open the
[plugin-add issue](https://github.com/polang233/dsh-plugin-index/issues/new?template=plugin-add.yml)
with:

- npm package: `dsh-tide-atelier`
- one-sentence purpose, for example:
  “把 DSH 的工具调用、子代理和错误画成星图/花园/城市，并配一只 3D 大肥鱼伙伴。”
- 1–6 real screenshots, each captioned
- Logo: `icon.svg`
- Tested DSH version: `0.2.1-rc.5`, Web, Windows
- Difference from existing pets: this is a **work visualizer** first, pet second;
  it has three generative forms, a gallery and a soundtrack.

Requirements from the market's contributing guide:

- public npm release (or pinned GitHub commit)
- `dsh.bundle.patch` in `package.json`, patch in the package
- public source repo and clear license (`license` field + LICENSE file)
- `repository` field
- clear purpose

After listing, add the market badge:

```md
[![Open Plugin Market](https://img.shields.io/endpoint?url=https%3A%2F%2Fdshopen.org%2Fbadge%2Fdsh-tide-atelier.json)](https://dshopen.org/zh/plugins/dsh-tide-atelier/)
```

## 6. Promotion

The pet niche is crowded. Lead with the **work visualization**, not “another
desktop pet”.

Launch assets:

- 20–30 s screen recording: start a real task → tool calls become stars → switch
  to garden/city → finish stamp → gallery → pet interaction. Keep the soundtrack.
- 4–6 screenshots focused on the generated artwork, not just the character.
- One-line pitch:
  “把 DSH 的每一次工具调用，画成一片会生长的潮汐星图。”
- README demo GIF and a GitHub social preview.

Channels:

- [鲸鱼娘开源资产库](https://treapgogo.github.io/deepseek-whale-girl/) —
  contribute / community resources; this is the exact character audience.
- Bilibili demo (Chinese DSH + whale-girl audience).
- 小红书 / 即刻 / V2EX.
- Reddit (r/DeepSeek), X, GitHub topics.
- Cross-link from the npm README to the GitHub demo.

Market mechanics:

- Default picks rotate every 6 hours and weight recent growth, updates, likes,
  downloads and stars; new plugins get some Smart-pick exposure.
- Get the first real users to install, star and like; do not fake engagement.
- Keep releasing meaningful fixes; the “Frequent updates” label needs real
  releases.
- Ask for the “Reviewed” label by keeping the package, license and repository
  clean.

## 7. Next product step for promotion

Add an **Export share card** button to the expanded panel:

- compose the current constellation/garden/city, task title, finish stamp and
  “Tide Atelier” mark into a PNG;
- include a QR code or short URL to the repository;
- use the Web Share API where available;
- this gives users a reason to post the artwork and gives the market real
  screenshots.

The 3D model's back side is incomplete. Do not add a 360° spin until a
multi-view/rigged model is produced. A backend-facing model and simple skeletal
idle would be the next visual upgrade.
