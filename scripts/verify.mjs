#!/usr/bin/env node
/**
 * Tide Atelier — DSH bundle contract check.
 *
 * Why this file exists: a DSH client-only bundle is discovered by *package name*.
 * The Node half turns each installed bundle into a browser boot-graph row whose
 * id is `package.json.name` (`@deepseek-ai/dsh-client-modules`, graphRow(packageName)),
 * and the browser throws
 *   client-modules: could not load "<name>": ... loaded without registering
 *   "<name>" via __ModuleLoader__.load
 * when the shipped `client.js` registers itself under any other id. That failure is
 * silent on the host side: the plugin installs cleanly, mounts cleanly, and simply
 * never appears in the UI. Renaming the package without regenerating the bundle
 * triggers exactly this. v0.1.0 shipped with the pre-rename id
 * `@local/dsh-activity-quest` and was dead on arrival for that reason.
 *
 * This script is the gate: it fails loudly, before publish, on any drift between the
 * manifest and the artifact, and it smoke-runs the module factory + apply() against
 * stubbed browser and DSH-client APIs so a broken slot contract is also caught here.
 *
 * Usage: node scripts/verify.mjs [packageDir]   (exit 0 = pass, 1 = fail)
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.argv[2] ? resolve(process.argv[2]) : dirname(dirname(fileURLToPath(import.meta.url)));
const failures = [];
const pass = (message) => console.log(`  ok    ${message}`);
const fail = (message, hint) => {
  failures.push(message);
  console.log(`  FAIL  ${message}`);
  if (hint) console.log(`        ↳ ${hint}`);
};
const check = (condition, message, hint) => (condition ? pass(message) : fail(message, hint));

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8', { throws: false }) ?? 'null');
if (pkg === null) {
  console.error('verify: cannot read package.json');
  process.exit(1);
}

console.log(`verify: ${pkg.name}@${pkg.version} (${ROOT})`);

/* -- 1. manifest -------------------------------------------------------------- */

const clientRel = pkg.exports?.['./client'];
check(typeof clientRel === 'string', `exports["./client"] is a string (${JSON.stringify(clientRel)})`,
  'dsh.client requires an "./client" export or client-modules refuses the bundle.');
const clientPath = typeof clientRel === 'string' ? join(ROOT, clientRel) : null;
if (clientPath) check(existsSync(clientPath), `client bundle exists at ${clientRel}`);

const patchRel = pkg.dsh?.bundle?.patch;
const patchPath = typeof patchRel === 'string' ? join(ROOT, patchRel) : null;
if (patchPath && existsSync(patchPath)) {
  const patch = readFileSync(patchPath, 'utf8');
  const names = [...patch.matchAll(/^\s*name:\s*(\S+)\s*$/gm)].map((match) => match[1]);
  check(names.includes(pkg.name), `bundle patch row name === "${pkg.name}" (found ${JSON.stringify(names)})`,
    'the patch row name is how the host resolves the package; a mismatch means the entry never loads.');
} else {
  fail(`bundle patch file missing: ${JSON.stringify(patchRel)}`);
}

const declared = pkg.dsh?.client;
check(declared?.platform === 'web', `dsh.client.platform === "web" (${JSON.stringify(declared?.platform)})`,
  'any other value makes the Node half skip this package for the Web client.');
check(declared?.immediately === undefined || typeof declared.immediately === 'boolean', 'dsh.client.immediately is a boolean when present');
for (const field of ['inject', 'external']) {
  const value = declared?.[field];
  check(value === undefined || (Array.isArray(value) && value.every((item) => typeof item === 'string')),
    `dsh.client.${field} is a string array when present (${JSON.stringify(value)})`);
}
check(typeof pkg.engines?.dsh === 'string' && pkg.engines.dsh.trim() !== '', `engines.dsh range declared (${JSON.stringify(pkg.engines?.dsh)})`,
  'without a range the installer falls back to peerDependencies and may block activation.');

for (const entry of pkg.files ?? []) {
  if (entry.includes('*')) continue;
  check(existsSync(join(ROOT, entry)), `files entry present: ${entry}`);
}

/* -- 2. the registration id, statically -------------------------------------- */

const source = clientPath && existsSync(clientPath) ? readFileSync(clientPath, 'utf8') : '';
const registrationBlocks = [...source.matchAll(/__ModuleLoader__\.load\(\s*\{([\s\S]{0,400})/g)];
check(registrationBlocks.length === 1,
  `exactly one __ModuleLoader__.load() registration (found ${registrationBlocks.length})`,
  'the browser expects one registration per package row.');
const registeredIds = registrationBlocks.map((match) => match[1].match(/\bid:\s*(['"])(.*?)\1/)?.[2] ?? null);
for (const id of registeredIds) {
  check(id === pkg.name, `registered module id === package name (bundle: ${JSON.stringify(id)}, package: ${JSON.stringify(pkg.name)})`,
    `edit client.js: the load({ id: ... }) must be exactly '${pkg.name}'. A stale id installs fine, mounts fine, and shows nothing — the browser errors with "loaded without registering \\"${pkg.name}\\"".`);
}
check(!/@local\/[a-z0-9-]+/i.test(source), 'no "@local/<dev-name>" identifiers left in the shipped artifact',
  'dev-only package names must not reach a published bundle.');

/* -- 3. smoke: evaluate the bundle and run the module ------------------------ */

const BROWSER_GLOBALS = [
  'window', 'document', 'localStorage', 'sessionStorage', 'navigator', 'self', 'globalThis',
  'Image', 'HTMLElement', 'Element', 'customElements', 'matchMedia', 'requestAnimationFrame',
  'cancelAnimationFrame', 'AudioContext', 'webkitAudioContext', 'OffscreenCanvas', 'WebGLRenderingContext',
  'location', 'indexedDB', 'getComputedStyle', 'ResizeObserver', 'MutationObserver', 'IntersectionObserver',
  'XMLHttpRequest', 'WebSocket', 'Worker', 'fetch', 'createImageBitmap', 'importScripts', 'crypto',
];

const store = new Map();
const localStorageStub = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => void store.set(key, String(value)),
  removeItem: (key) => void store.delete(key),
  clear: () => store.clear(),
};
const node = () => ({
  style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  append() {}, appendChild() {}, remove() {}, setAttribute() {}, removeAttribute() {},
  addEventListener() {}, removeEventListener() {}, focus() {}, click() {},
  getContext: () => null, toDataURL: () => '', children: [],
});
const documentStub = {
  createElement: node, createElementNS: node, getElementById: () => null,
  querySelector: () => null, querySelectorAll: () => [],
  head: node(), body: node(), documentElement: node(),
  addEventListener() {}, removeEventListener() {}, visibilityState: 'visible',
};
const React = {
  createElement: (type, props, ...children) => ({ type, props, children }),
  useState: (initial) => [initial, () => {}],
  useEffect: () => {},
  useRef: (initial) => ({ current: initial }),
  useMemo: (factory) => factory(),
  useCallback: (factory) => factory,
  useContext: () => undefined,
  createContext: (value) => ({ _currentValue: value }),
  Fragment: 'Fragment',
};
const requireStub = (specifier) => {
  if (specifier === 'react') return React;
  if (specifier === 'react/jsx-runtime') return { jsx: React.createElement, jsxs: React.createElement, Fragment: React.Fragment };
  throw new Error(`unexpected require("${specifier}") — add it to the stub or declare it in dsh.client.external`);
};

const locationStub = { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', protocol: 'http:', host: '127.0.0.1', pathname: '/' };
const windowStub = {
  __ModuleLoader__: { load: (registration) => registrations.push(registration) },
  localStorage: localStorageStub,
  document: documentStub,
  location: locationStub,
  addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true,
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
  requestAnimationFrame: () => 0, cancelAnimationFrame() {},
  innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
};
const registrations = [];
const audioNode = () => ({ connect() {}, disconnect() {}, gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {} } });
const AudioContextStub = function () {
  return {
    state: 'suspended', currentTime: 0, sampleRate: 48000, destination: audioNode(),
    createGain: audioNode, createBiquadFilter: () => ({ ...audioNode(), frequency: { value: 0, setValueAtTime() {} }, Q: { value: 0 } }),
    createOscillator: () => ({ ...audioNode(), type: 'sine', frequency: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {} }, start() {}, stop() {} }),
    createBufferSource: () => ({ ...audioNode(), buffer: null, loop: false, playbackRate: { value: 1 }, start() {}, stop() {} }),
    createBuffer: (channels, length) => ({ length, numberOfChannels: channels, getChannelData: () => new Float32Array(length) }),
    decodeAudioData: () => Promise.reject(new Error('unavailable')),
    resume: () => Promise.resolve(), close: () => Promise.resolve(),
  };
};

const globals = {
  window: windowStub, self: windowStub, globalThis: {}, document: documentStub,
  localStorage: localStorageStub, sessionStorage: localStorageStub,
  navigator: { userAgent: 'node-verify', language: 'zh-CN', platform: 'win32', maxTouchPoints: 0, onLine: true, clipboard: {}, mediaDevices: {} },
  location: locationStub, indexedDB: undefined,
  Image: function () { return node(); }, HTMLElement: function () {}, Element: function () {},
  customElements: { define() {}, get: () => undefined, whenDefined: () => Promise.resolve() },
  matchMedia: windowStub.matchMedia,
  requestAnimationFrame: windowStub.requestAnimationFrame, cancelAnimationFrame: () => {},
  AudioContext: AudioContextStub, webkitAudioContext: undefined,
  OffscreenCanvas: undefined, WebGLRenderingContext: undefined,
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
  ResizeObserver: function () { return { observe() {}, unobserve() {}, disconnect() {} }; },
  MutationObserver: function () { return { observe() {}, disconnect() {} }; },
  IntersectionObserver: function () { return { observe() {}, unobserve() {}, disconnect() {} }; },
  XMLHttpRequest: function () { return { open() {}, send() {}, setRequestHeader() {} }; },
  WebSocket: function () {}, Worker: function () {},
  fetch: () => Promise.reject(new Error('this plugin must not use the network')),
  createImageBitmap: () => Promise.reject(new Error('unavailable')),
  importScripts: () => {},
  crypto: { getRandomValues: (array) => array, randomUUID: () => '00000000-0000-0000-0000-000000000000' },
};

try {
  // eslint-disable-next-line no-new-func
  new Function(...BROWSER_GLOBALS, source)(...BROWSER_GLOBALS.map((name) => globals[name]));
  pass('client bundle evaluates without throwing');
} catch (error) {
  fail(`client bundle evaluation threw: ${error?.message ?? error}`);
}

check(registrations.length === 1, `bundle called window.__ModuleLoader__.load exactly once (found ${registrations.length})`);

const registration = registrations.find((item) => item?.id === pkg.name) ?? registrations[0];
if (registration === undefined || typeof registration.factory !== 'function') {
  fail('registration carries no factory function', 'the browser half materializes factory(require) as the module exports.');
} else {
  let exports;
  try {
    exports = registration.factory(requireStub);
    pass(`factory(require) materialized under id ${JSON.stringify(registration.id)}`);
  } catch (error) {
    fail(`factory(require) threw: ${error?.message ?? error}`);
  }

  if (exports !== undefined) {
    check(Array.isArray(exports.inject), `module declares inject services (${JSON.stringify(exports.inject)})`);
    check(typeof exports.apply === 'function', 'module exposes apply(ctx)');

    if (typeof exports.apply === 'function') {
      const injectedSlots = [];
      const slotEntries = [];
      const dictionaries = [];
      const ctx = {
        effect: (body) => {
          try {
            const cleanup = body();
            if (typeof cleanup === 'function') cleanup();
          } catch (error) {
            fail(`apply() effect threw: ${error?.message ?? error}`);
          }
        },
        locale: { register: (namespace, dictionary) => dictionaries.push({ namespace, languages: Object.keys(dictionary ?? {}) }) },
        slots: {
          inject: (name, build) => {
            injectedSlots.push(name);
            const result = build();
            const entry = typeof result?.[Symbol.iterator] === 'function' ? [...result][0] : result;
            if (entry !== undefined) slotEntries.push(entry);
          },
          register: (entry) => entry,
        },
      };
      try {
        exports.apply(ctx);
        pass('apply(ctx) ran without throwing');
      } catch (error) {
        fail(`apply(ctx) threw: ${error?.message ?? error}`);
      }

      for (const slot of ['conversation.input.dock', 'shell.overlay']) {
        check(injectedSlots.includes(slot), `injects into slot "${slot}" (got ${JSON.stringify(injectedSlots)})`,
          'a slot name that no longer exists in this DSH version silently renders nothing.');
      }
      const ids = slotEntries.map((entry) => entry?.id).filter(Boolean);
      check(ids.length >= 2, `slot entries registered: ${JSON.stringify(ids)}`);
      check(dictionaries.length >= 1, `locale dictionaries registered: ${JSON.stringify(dictionaries.map((item) => item.namespace))}`);
    }
  }
}

/* -- 4. host half ------------------------------------------------------------ */

try {
  const host = await import(new URL(`file://${join(ROOT, pkg.main ?? 'index.js')}`).href);
  check(typeof host.apply === 'function' || typeof host.default === 'function',
    `host half exposes a plugin (${JSON.stringify(Object.keys(host))})`,
    'dsh-cordis-host-runner accepts either a default function or an object with apply().');
} catch (error) {
  fail(`host half failed to import: ${error?.message ?? error}`);
}

console.log(failures.length === 0
  ? '\nPASS — the artifact matches the DSH client-module contract for this package name.'
  : `\nFAIL — ${failures.length} problem(s):\n${failures.map((item) => `  - ${item}`).join('\n')}`);
process.exit(failures.length === 0 ? 0 : 1);
