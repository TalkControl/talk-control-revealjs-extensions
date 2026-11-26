import fs from 'node:fs';
import path from 'node:path';

/**
 * One vendored third-party asset bundle (an icon pack's fonts/CSS/JS,
 * Mermaid's ESM build…), copied from `node_modules` into `dist/vendor/` so it
 * can be served/fetched by URL at runtime (see `src/utils/tc-vendor-loader.ts`
 * and `docs/vendor.md`).
 */
export interface VendorEntry {
    /** Human-readable name, used in error messages and the licenses notice (e.g. 'font-awesome', 'mermaid'). */
    name: string;
    /** Source directory, relative to the project root (e.g. 'node_modules/@fortawesome/fontawesome-free'). */
    from: string;
    /** Destination directory, relative to the vendor root (e.g. 'fonts/font-awesome'). */
    to: string;
    /** Globs (relative to `from`) of the files to copy (e.g. ['css/all.min.css', 'webfonts/*.woff2']). */
    include: string[];
    /** License file(s), relative to `from`, copied next to the assets and concatenated into `THIRD-PARTY-LICENSES.txt`. */
    licenses: string[];
    /**
     * Also list, in `THIRD-PARTY-LICENSES.txt`, the license texts of every
     * production dependency of the package (direct and transitive, minus
     * `@types/*`). For a package whose build inlines its dependencies, like
     * Mermaid: their code is redistributed with it. Fails if a dependency
     * cannot be found or ships no license text.
     */
    dependencyLicenses?: boolean;
}

export interface CopyVendorOptions {
    /** Project root that `VendorEntry.from` is resolved against. Defaults to `process.cwd()`. */
    projectRoot?: string;
    /** Directory `VendorEntry.to` is resolved against, and where `THIRD-PARTY-LICENSES.txt` is written (e.g. `dist/vendor`). */
    vendorRoot: string;
}

/**
 * Copies every `VendorEntry` of the manifest from `node_modules` (or any
 * other source) into the vendor root, and writes a concatenated
 * `THIRD-PARTY-LICENSES.txt` next to them.
 *
 * Fails loudly (throws) if a glob in `include` matches nothing: a vendor
 * entry whose source package changed its file layout is a build error, not a
 * silently-smaller `dist/vendor/`.
 */
export function copyVendor(
    manifest: VendorEntry[],
    { projectRoot = process.cwd(), vendorRoot }: CopyVendorOptions
): void {
    fs.mkdirSync(vendorRoot, { recursive: true });

    const noticeBlocks: string[] = [];

    for (const entry of manifest) {
        const fromDir = path.resolve(projectRoot, entry.from);
        const toDir = path.resolve(vendorRoot, entry.to);
        fs.mkdirSync(toDir, { recursive: true });

        for (const pattern of entry.include) {
            const matches = expandGlob(fromDir, pattern);
            if (matches.length === 0) {
                throw new Error(
                    `copy-vendor: the pattern "${pattern}" of vendor entry "${entry.name}" matched no file in "${fromDir}". Is the package's file layout still the one this manifest was written for?`
                );
            }
            for (const relativeMatch of matches) {
                const sourceFile = path.join(fromDir, relativeMatch);
                const destFile = path.join(toDir, relativeMatch);
                fs.mkdirSync(path.dirname(destFile), { recursive: true });
                fs.copyFileSync(sourceFile, destFile);
            }
        }

        for (const license of entry.licenses) {
            const licenseSource = path.join(fromDir, license);
            const licenseDest = path.join(toDir, path.basename(license));
            fs.copyFileSync(licenseSource, licenseDest);
        }

        noticeBlocks.push(buildNoticeBlock(entry, fromDir));
        if (entry.dependencyLicenses) {
            for (const dependencyDir of collectDependencyDirs(fromDir)) {
                noticeBlocks.push(buildDependencyNoticeBlock(dependencyDir));
            }
        }
    }

    if (noticeBlocks.length > 0) {
        fs.writeFileSync(
            path.join(vendorRoot, 'THIRD-PARTY-LICENSES.txt'),
            noticeBlocks.join('\n\n')
        );
    }
}

function buildNoticeBlock(entry: VendorEntry, fromDir: string): string {
    const { name, version, license } = readPackageMetadata(fromDir, entry.name);
    const header = noticeHeader(name, version, license);
    const licenseTexts = entry.licenses.map((licenseFile) =>
        fs.readFileSync(path.join(fromDir, licenseFile), 'utf-8')
    );
    return [header, ...licenseTexts].join('\n\n');
}

const LICENSE_FILE_REGEX = /^(?:licen[cs]e|copying|notice)(?:\.|$)/i;

function noticeHeader(
    name: string,
    version?: string,
    license?: string
): string {
    return `## ${name}${version ? `@${version}` : ''}${license ? ` (${license})` : ''}`;
}

function buildDependencyNoticeBlock(dir: string): string {
    const { name, version, license } = readPackageMetadata(dir, dir);
    const files = fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((file) => file.isFile() && LICENSE_FILE_REGEX.test(file.name))
        .map((file) => file.name)
        .sort();
    if (files.length === 0) {
        throw new Error(
            `copy-vendor: the dependency ${name}@${version} ("${dir}") ships no license text. Add it by hand to the manifest, or drop the dependency.`
        );
    }
    return [
        noticeHeader(name, version, license),
        ...files.map((file) => fs.readFileSync(path.join(dir, file), 'utf-8')),
    ].join('\n\n');
}

/** Resolves a package the way Node does: the closest `node_modules` upwards. */
function findPackageDir(name: string, fromDir: string): string | undefined {
    for (let dir = fromDir; ; dir = path.dirname(dir)) {
        const candidate = path.join(dir, 'node_modules', name);
        if (fs.existsSync(path.join(candidate, 'package.json'))) {
            return candidate;
        }
        if (path.dirname(dir) === dir) {
            return undefined;
        }
    }
}

/**
 * Directories of the production dependency closure of the package in
 * `rootDir`, root excluded, each package once, in a stable order.
 */
function collectDependencyDirs(packageDir: string): string[] {
    const rootDir = fs.realpathSync(packageDir);
    const visited = new Set<string>([rootDir]);
    const queue = [rootDir];
    while (queue.length > 0) {
        const dir = queue.shift() as string;
        const { dependencies = {} } = JSON.parse(
            fs.readFileSync(path.join(dir, 'package.json'), 'utf-8')
        ) as { dependencies?: Record<string, string> };
        for (const name of Object.keys(dependencies)) {
            if (name.startsWith('@types/')) {
                continue;
            }
            const dependencyDir = findPackageDir(name, dir);
            if (!dependencyDir) {
                throw new Error(
                    `copy-vendor: the dependency "${name}" of "${dir}" is not installed.`
                );
            }
            const real = fs.realpathSync(dependencyDir);
            if (!visited.has(real)) {
                visited.add(real);
                queue.push(real);
            }
        }
    }
    visited.delete(rootDir);
    return [...visited].sort();
}

function readPackageMetadata(
    fromDir: string,
    fallbackName: string
): { name: string; version?: string; license?: string } {
    try {
        const raw = fs.readFileSync(
            path.join(fromDir, 'package.json'),
            'utf-8'
        );
        const packageJson = JSON.parse(raw) as {
            name?: string;
            version?: string;
            license?: string;
        };
        return {
            name: packageJson.name ?? fallbackName,
            version: packageJson.version,
            license: packageJson.license,
        };
    } catch {
        return { name: fallbackName };
    }
}

/**
 * Minimal glob expansion, limited to what vendor manifests actually need: a
 * `/`-separated pattern where any segment may contain `*` (matching anything
 * but `/`, within that segment). Good enough for `'webfonts/*.woff2'`,
 * `'css/*.min.css'` or an exact `'js/all.min.js'` — not a general-purpose
 * glob (no `**`, no brace expansion): adding one of those is a KISS violation
 * until a vendor entry actually needs it.
 */
function expandGlob(baseDir: string, pattern: string): string[] {
    const segments = pattern.split('/');
    let candidates = [''];

    for (const segment of segments) {
        const isWildcard = segment.includes('*');
        const next: string[] = [];

        for (const candidate of candidates) {
            if (!isWildcard) {
                next.push(path.join(candidate, segment));
                continue;
            }
            const dir = path.join(baseDir, candidate);
            if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
                continue;
            }
            const regex = segmentToRegExp(segment);
            for (const dirEntry of fs.readdirSync(dir)) {
                if (regex.test(dirEntry)) {
                    next.push(path.join(candidate, dirEntry));
                }
            }
        }

        candidates = next;
    }

    return candidates.filter((relativePath) => {
        const fullPath = path.join(baseDir, relativePath);
        return fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
    });
}

function segmentToRegExp(segment: string): RegExp {
    const escaped = segment
        .split('*')
        .map((part) => part.replace(/[.+^${}()|[\]\\]/g, '\\$&'))
        .join('.*');
    return new RegExp(`^${escaped}$`);
}
