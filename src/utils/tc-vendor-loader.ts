/**
 * Loader for assets vendored into `dist/vendor/` (icon packs fonts/CSS/JS,
 * Mermaid's ESM build, …). Every icon pack and #92 (Mermaid) share this
 * single mechanism instead of each inventing its own `<link>`/`<script>`
 * injection and its own "where are my assets" option.
 *
 * See `docs/vendor.md` for the consumer-facing contract and `scripts/copy-vendor.ts`
 * for how `dist/vendor/` is populated at build time.
 */

/**
 * Options accepted by {@link configureVendorLoader}, and re-exposed on
 * `ThemeInitializerOptions.vendorBaseUrl` for the common case.
 */
export interface TcVendorLoaderOptions {
    /**
     * Base URL of the vendored assets folder (the `dist/vendor/` folder,
     * deployed anywhere: same origin, a CDN, a sub-path…).
     *
     * Accepts an absolute URL, a root-relative path (`/vendor/`) or a path
     * relative to `document.baseURI`. Defaults to
     * `new URL('./vendor/', import.meta.url)`, which — in the published ESM
     * build — resolves next to `dist/talk-control-revealjs-extensions.js`,
     * i.e. `dist/vendor/`.
     */
    vendorBaseUrl?: string | URL;
}

type VendorAssetKind = 'stylesheet' | 'script' | 'module';

/** Swappable module importer, so `loadVendorModule` can be unit-tested without a real network import. */
type VendorModuleImporter = (url: string) => Promise<unknown>;

const DEFAULT_IMPORTER: VendorModuleImporter = (url) =>
    // The URL is only known at runtime (it depends on `vendorBaseUrl`), so
    // Vite/Rollup cannot statically analyze this import: `@vite-ignore`
    // tells it not to try, and to leave the dynamic `import()` as-is.
    import(/* @vite-ignore */ url);

const DEFAULT_VENDOR_BASE_URL = (): URL =>
    // `dist/vendor/` doesn't exist as a source file Vite/Rollup can resolve
    // at build time (it's populated after the build by copy-vendor.ts), so
    // `@vite-ignore` tells it to leave this expression untouched and let it
    // resolve for real in the browser, next to wherever this module ends up.
    new URL(/* @vite-ignore */ './vendor/', import.meta.url);

let vendorBaseUrl: URL = DEFAULT_VENDOR_BASE_URL();
let moduleImporter: VendorModuleImporter = DEFAULT_IMPORTER;

const stylesheetCache = new Map<string, Promise<void>>();
const scriptCache = new Map<string, Promise<void>>();
const moduleCache = new Map<string, Promise<unknown>>();

/**
 * Error raised when a vendored asset (stylesheet, script or module) fails to
 * load. Callers (`ThemeInitializer.init`, the async icon pack wrappers) are
 * expected to catch it, log it, and keep going without the asset: a missing
 * icon pack must never prevent the slides from rendering.
 */
export class TcVendorLoadError extends Error {
    readonly url: string;
    readonly kind: VendorAssetKind;
    readonly cause?: unknown;

    constructor(url: string, kind: VendorAssetKind, cause?: unknown) {
        super(
            `Cannot load \`${url}\`. The \`vendor/\` folder of TalkControl must be served next to the library script, or set \`vendorBaseUrl\` in \`ThemeInitializer.init\`.`
        );
        this.name = 'TcVendorLoadError';
        this.url = url;
        this.kind = kind;
        this.cause = cause;
    }
}

/**
 * Configures the vendor loader. Called once by `ThemeInitializer.init`
 * (idempotent: the last call wins), and usable directly for the async icon
 * pack API (#95 PR 5) or by #92 (Mermaid) outside of `init`.
 *
 * Does not reset anything already loaded/cached: it only changes where the
 * *next* `resolveVendorUrl` calls resolve against.
 */
export function configureVendorLoader(
    options: TcVendorLoaderOptions = {}
): void {
    if (options.vendorBaseUrl !== undefined) {
        vendorBaseUrl = normalizeVendorBaseUrl(options.vendorBaseUrl);
    }
}

function normalizeVendorBaseUrl(base: string | URL): URL {
    if (base instanceof URL) {
        return base;
    }
    const withTrailingSlash = base.endsWith('/') ? base : `${base}/`;
    return new URL(withTrailingSlash, document.baseURI);
}

/**
 * Resolves a vendor-relative path (e.g. `'fonts/font-awesome/css/all.min.css'`)
 * against the configured `vendorBaseUrl`.
 *
 * Throws synchronously for a path that escapes the vendor folder (`..`
 * segment) or that is already absolute (root-relative or a full URL): such a
 * path is a programming error in a pack's `load()`, not something a consumer
 * should silently get away with.
 */
export function resolveVendorUrl(path: string): URL {
    assertSafeRelativePath(path);
    return new URL(path, vendorBaseUrl);
}

const ABSOLUTE_URL_RE = /^[a-z][a-z0-9+.-]*:/i;

function assertSafeRelativePath(path: string): void {
    if (
        path.startsWith('/') ||
        ABSOLUTE_URL_RE.test(path) ||
        path.split('/').includes('..')
    ) {
        throw new Error(
            `Invalid vendor asset path "${path}": expected a path relative to the vendor folder, without ".." segments or a scheme/leading slash.`
        );
    }
}

/**
 * Injects `<link rel="stylesheet">` for the given vendor-relative path and
 * resolves once it has loaded.
 *
 * Deduplicated per resolved URL: two concurrent calls for the same asset
 * share one `<link>` and one promise. Does not re-inject if a stylesheet
 * with that exact URL is already present in the DOM (e.g. a consumer that
 * added its own). A failed load removes the cache entry, so a later call
 * can retry.
 */
export function loadVendorStylesheet(path: string): Promise<void> {
    const href = resolveVendorUrl(path).href;
    return loadElementOnce(stylesheetCache, 'stylesheet', href, {
        alreadyPresent: () =>
            Array.from(
                document.querySelectorAll<HTMLLinkElement>(
                    'link[rel="stylesheet"]'
                )
            ).some((link) => link.href === href),
        createElement: () => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            return link;
        },
    });
}

/**
 * Injects a classic (non-module) `<script>` for the given vendor-relative
 * path and resolves once it has loaded. For UMD/IIFE vendor files (e.g.
 * `feather.min.js`, `all.min.js`) that only work as a plain `<script src>`.
 *
 * Same cache/dedup/no-reinject/retry-after-failure rules as
 * {@link loadVendorStylesheet}.
 */
export function loadVendorScript(path: string): Promise<void> {
    const src = resolveVendorUrl(path).href;
    return loadElementOnce(scriptCache, 'script', src, {
        alreadyPresent: () =>
            Array.from(
                document.querySelectorAll<HTMLScriptElement>('script')
            ).some((script) => script.src === src),
        createElement: () => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            return script;
        },
    });
}

function loadElementOnce(
    cache: Map<string, Promise<void>>,
    kind: 'stylesheet' | 'script',
    resolvedUrl: string,
    hooks: {
        alreadyPresent: () => boolean;
        createElement: () => HTMLLinkElement | HTMLScriptElement;
    }
): Promise<void> {
    const cached = cache.get(resolvedUrl);
    if (cached) {
        return cached;
    }

    const promise = new Promise<void>((resolve, reject) => {
        if (hooks.alreadyPresent()) {
            resolve();
            return;
        }
        const element = hooks.createElement();
        element.addEventListener('load', () => resolve(), { once: true });
        element.addEventListener(
            'error',
            () => {
                // Remove the failed element: leaving it in the DOM would make
                // the next retry's `alreadyPresent()` check find it and
                // resolve immediately, as if the (broken) asset had loaded.
                element.remove();
                reject(new TcVendorLoadError(resolvedUrl, kind));
            },
            { once: true }
        );
        document.head.appendChild(element);
    }).catch((error: unknown) => {
        cache.delete(resolvedUrl);
        throw error;
    });

    cache.set(resolvedUrl, promise);
    return promise;
}

/**
 * Dynamically imports the ES module at the given vendor-relative path
 * (Mermaid's ESM build, #92). Cached per resolved URL: a second concurrent
 * call for the same URL returns the same promise/module namespace. A
 * rejected import is wrapped in {@link TcVendorLoadError} and removed from
 * the cache so a later call can retry.
 */
export function loadVendorModule<T = unknown>(path: string): Promise<T> {
    const href = resolveVendorUrl(path).href;

    const cached = moduleCache.get(href);
    if (cached) {
        return cached as Promise<T>;
    }

    const promise = moduleImporter(href).catch((cause: unknown) => {
        moduleCache.delete(href);
        throw new TcVendorLoadError(href, 'module', cause);
    });

    moduleCache.set(href, promise);
    return promise as Promise<T>;
}

const DEFAULT_FONT_WAIT_TIMEOUT_MS = 3000;

/**
 * Waits for the given CSS font-face specs (e.g.
 * `'900 1em "Font Awesome 6 Free"'`) to finish loading via
 * `document.fonts.load`, up to `timeoutMs`. Used after
 * {@link loadVendorStylesheet} to avoid a flash of missing icons before the
 * first Markdown render.
 *
 * Never rejects: a font that fails to load, or isn't loaded within the
 * timeout, is simply not waited for any further — the slides still render,
 * possibly without that icon/font.
 */
export function waitForFonts(
    specs: string[],
    timeoutMs: number = DEFAULT_FONT_WAIT_TIMEOUT_MS
): Promise<void> {
    const fontsApi =
        typeof document !== 'undefined' ? document.fonts : undefined;

    const fontsReady: Promise<void> =
        fontsApi == null
            ? Promise.resolve()
            : Promise.all(
                  specs.map((spec) =>
                      Promise.resolve(fontsApi.load(spec)).catch(
                          () => undefined
                      )
                  )
              ).then(() => undefined);

    const timeout = new Promise<void>((resolve) => {
        setTimeout(resolve, timeoutMs);
    });

    return Promise.race([fontsReady, timeout]);
}

function resetCache(): void {
    stylesheetCache.clear();
    scriptCache.clear();
    moduleCache.clear();
    vendorBaseUrl = DEFAULT_VENDOR_BASE_URL();
    moduleImporter = DEFAULT_IMPORTER;
}

function setImporter(importer: VendorModuleImporter): void {
    moduleImporter = importer;
}

// Add conditionnal export
export const _internals =
    typeof process !== 'undefined' && process?.env?.NODE_ENV === 'test'
        ? {
              resetCache,
              setImporter,
          }
        : undefined;
