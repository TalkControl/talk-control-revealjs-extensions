import { StaticServer, startStaticServer } from './static-server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('startStaticServer', () => {
    let dir: string;
    let server: StaticServer;

    beforeAll(async () => {
        dir = await mkdtemp(join(tmpdir(), 'tc-a11y-static-server-'));
        await writeFile(
            join(dir, 'index.html'),
            '<!doctype html><title>t</title>'
        );
        await writeFile(join(dir, 'style.css'), 'body { color: red; }');
        server = await startStaticServer(dir, 0);
    });

    afterAll(async () => {
        await server.close();
        await rm(dir, { recursive: true, force: true });
    });

    it('should serve index.html for the root path', async () => {
        const response = await fetch(`${server.url}/`);

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('text/html');
        expect(await response.text()).toContain('<title>t</title>');
    });

    it('should serve a static asset with the right content type', async () => {
        const response = await fetch(`${server.url}/style.css`);

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('text/css');
        expect(await response.text()).toContain('color: red');
    });

    it('should return 404 for a missing file', async () => {
        const response = await fetch(`${server.url}/does-not-exist.html`);

        expect(response.status).toBe(404);
    });

    it('should not escape the root directory via path traversal', async () => {
        const response = await fetch(
            `${server.url}/../../../../../../etc/passwd`
        );

        expect(response.status).toBe(404);
    });
});
