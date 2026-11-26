import { CopyVendorOptions, VendorEntry, copyVendor } from './copy-vendor';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';

describe(copyVendor.name, () => {
    let testContext: ReturnType<typeof buildTestContext>;

    beforeEach(() => {
        testContext = buildTestContext();
    });
    afterEach(() => {
        testContext?.cleanup();
    });

    it('copies the files matched by each include glob', () => {
        testContext.writeSourceFile('fake-pack', 'css/style.min.css', 'body{}');
        testContext.writeSourceFile('fake-pack', 'css/other.css', 'body{}');
        testContext.writeSourceFile(
            'fake-pack',
            'webfonts/icon.woff2',
            'woff2'
        );
        testContext.writeSourceFile('fake-pack', 'LICENSE', 'MIT license text');

        const manifest: VendorEntry[] = [
            {
                name: 'fake-pack',
                from: 'fake-pack',
                to: 'fonts/fake-pack',
                include: ['css/*.min.css', 'webfonts/*.woff2'],
                licenses: ['LICENSE'],
            },
        ];

        copyVendor(manifest, testContext.options);

        expect(
            testContext.readVendorFile('fonts/fake-pack/css/style.min.css')
        ).toBe('body{}');
        expect(
            testContext.readVendorFile('fonts/fake-pack/webfonts/icon.woff2')
        ).toBe('woff2');
    });

    it('does not copy a file excluded by the glob', () => {
        testContext.writeSourceFile('fake-pack', 'css/style.min.css', 'body{}');
        testContext.writeSourceFile(
            'fake-pack',
            'webfonts/icon.woff2',
            'woff2-bytes'
        );
        testContext.writeSourceFile(
            'fake-pack',
            'webfonts/icon.ttf',
            'ttf-bytes'
        );
        testContext.writeSourceFile('fake-pack', 'LICENSE', 'MIT license text');

        const manifest: VendorEntry[] = [
            {
                name: 'fake-pack',
                from: 'fake-pack',
                to: 'fonts/fake-pack',
                // Only woff2 is included: the .ttf sibling must not be copied.
                include: ['css/*.min.css', 'webfonts/*.woff2'],
                licenses: ['LICENSE'],
            },
        ];

        copyVendor(manifest, testContext.options);

        expect(
            fs.existsSync(
                path.join(
                    testContext.vendorRoot,
                    'fonts/fake-pack/webfonts/icon.ttf'
                )
            )
        ).toBe(false);
    });

    it('copies an exact (non-wildcard) include path', () => {
        testContext.writeSourceFile(
            'fake-pack',
            'js/all.min.js',
            'console.log(1)'
        );
        testContext.writeSourceFile('fake-pack', 'LICENSE', 'MIT license text');

        const manifest: VendorEntry[] = [
            {
                name: 'fake-pack',
                from: 'fake-pack',
                to: 'fonts/fake-pack',
                include: ['js/all.min.js'],
                licenses: ['LICENSE'],
            },
        ];

        copyVendor(manifest, testContext.options);

        expect(
            testContext.readVendorFile('fonts/fake-pack/js/all.min.js')
        ).toBe('console.log(1)');
    });

    it('throws when an include pattern matches no file', () => {
        testContext.writeSourceFile('fake-pack', 'LICENSE', 'MIT license text');

        const manifest: VendorEntry[] = [
            {
                name: 'fake-pack',
                from: 'fake-pack',
                to: 'fonts/fake-pack',
                include: ['css/*.does-not-exist'],
                licenses: ['LICENSE'],
            },
        ];

        expect(() => copyVendor(manifest, testContext.options)).toThrow(
            /matched no file/
        );
    });

    it('writes THIRD-PARTY-LICENSES.txt with name, version, license and notice text', () => {
        testContext.writeSourceFile('fake-pack', 'css/style.min.css', 'body{}');
        testContext.writeSourceFile(
            'fake-pack',
            'LICENSE',
            'MIT License\n\nCopyright (c) Fake'
        );
        testContext.writeSourceFile(
            'fake-pack',
            'package.json',
            JSON.stringify({
                name: '@fake/fake-pack',
                version: '1.2.3',
                license: 'MIT',
            })
        );

        const manifest: VendorEntry[] = [
            {
                name: 'fake-pack',
                from: 'fake-pack',
                to: 'fonts/fake-pack',
                include: ['css/*.min.css'],
                licenses: ['LICENSE'],
            },
        ];

        copyVendor(manifest, testContext.options);

        const notices = testContext.readVendorFile('THIRD-PARTY-LICENSES.txt');
        expect(notices).toContain('@fake/fake-pack@1.2.3');
        expect(notices).toContain('MIT');
        expect(notices).toContain('Copyright (c) Fake');
    });

    describe('dependencyLicenses', () => {
        function writePackage(
            dir: string,
            metadata: Record<string, unknown>,
            files: Record<string, string> = {}
        ) {
            testContext.writeSourceFile(
                dir,
                'package.json',
                JSON.stringify(metadata)
            );
            for (const [name, content] of Object.entries(files)) {
                testContext.writeSourceFile(dir, name, content);
            }
        }

        const manifest: VendorEntry[] = [
            {
                name: 'host',
                from: 'node_modules/host',
                to: 'host',
                include: ['index.js'],
                licenses: ['LICENSE'],
                dependencyLicenses: true,
            },
        ];

        function writeHost(dependencies: Record<string, string>) {
            writePackage(
                'node_modules/host',
                {
                    name: 'host',
                    version: '1.0.0',
                    license: 'MIT',
                    dependencies,
                    devDependencies: { 'dev-only': '1.0.0' },
                },
                { 'index.js': '', LICENSE: 'host license' }
            );
            writePackage('node_modules/dev-only', {
                name: 'dev-only',
                version: '1.0.0',
            });
        }

        it('appends the licenses of the production dependencies, direct and transitive', () => {
            writeHost({ '@scope/direct': '1.0.0', '@types/skipped': '1.0.0' });
            writePackage(
                'node_modules/@scope/direct',
                {
                    name: '@scope/direct',
                    version: '2.0.0',
                    license: 'ISC',
                    dependencies: { nested: '3.0.0' },
                },
                { LICENSE: 'direct license text' }
            );
            // Nested in the dependent package, not hoisted.
            writePackage(
                'node_modules/@scope/direct/node_modules/nested',
                { name: 'nested', version: '3.0.0', license: 'BSD-3-Clause' },
                { 'LICENSE.md': 'nested license text', NOTICE: 'nested notice' }
            );

            copyVendor(manifest, testContext.options);

            const notices = testContext.readVendorFile(
                'THIRD-PARTY-LICENSES.txt'
            );
            expect(notices).toContain('## host@1.0.0 (MIT)');
            expect(notices).toContain('## @scope/direct@2.0.0 (ISC)');
            expect(notices).toContain('direct license text');
            expect(notices).toContain('## nested@3.0.0 (BSD-3-Clause)');
            expect(notices).toContain('nested license text');
            expect(notices).toContain('nested notice');
            expect(notices).not.toContain('dev-only');
            expect(notices).not.toContain('skipped');
        });

        it('lists a package once, even with a cycle or several dependents', () => {
            writeHost({ a: '1.0.0', b: '1.0.0' });
            writePackage(
                'node_modules/a',
                {
                    name: 'a',
                    version: '1.0.0',
                    dependencies: { b: '1.0.0', host: '1.0.0' },
                },
                { LICENSE: 'a' }
            );
            writePackage(
                'node_modules/b',
                { name: 'b', version: '1.0.0' },
                { LICENSE: 'b' }
            );

            copyVendor(manifest, testContext.options);

            const notices = testContext.readVendorFile(
                'THIRD-PARTY-LICENSES.txt'
            );
            expect(notices.match(/## b@1\.0\.0/g)).toHaveLength(1);
            expect(notices.match(/## host@1\.0\.0/g)).toHaveLength(1);
        });

        it('throws when a dependency cannot be found', () => {
            writeHost({ missing: '1.0.0' });

            expect(() => copyVendor(manifest, testContext.options)).toThrow(
                /missing/
            );
        });

        it('throws when a dependency ships no license text', () => {
            writeHost({ bare: '1.0.0' });
            writePackage('node_modules/bare', {
                name: 'bare',
                version: '1.0.0',
            });

            expect(() => copyVendor(manifest, testContext.options)).toThrow(
                /bare@1\.0\.0.*license/
            );
        });
    });

    it('does not write THIRD-PARTY-LICENSES.txt for an empty manifest, but still creates the vendor root', () => {
        copyVendor([], testContext.options);

        expect(fs.existsSync(testContext.vendorRoot)).toBe(true);
        expect(
            fs.existsSync(
                path.join(testContext.vendorRoot, 'THIRD-PARTY-LICENSES.txt')
            )
        ).toBe(false);
    });
});

function buildTestContext() {
    const projectRoot = fs.mkdtempSync(path.join(tmpdir(), 'tc-vendor-src_'));
    const vendorRoot = fs.mkdtempSync(path.join(tmpdir(), 'tc-vendor-dist_'));
    const options: CopyVendorOptions = { projectRoot, vendorRoot };

    return {
        options,
        vendorRoot,
        writeSourceFile(pack: string, relativePath: string, content: string) {
            const filePath = path.join(projectRoot, pack, relativePath);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, content);
        },
        readVendorFile(relativePath: string) {
            return fs.readFileSync(
                path.join(vendorRoot, relativePath),
                'utf-8'
            );
        },
        cleanup() {
            fs.rmSync(projectRoot, { recursive: true, force: true });
            fs.rmSync(vendorRoot, { recursive: true, force: true });
        },
    } as const;
}
