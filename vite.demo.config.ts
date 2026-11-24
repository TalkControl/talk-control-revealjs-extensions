/**
 * Dev server for the demo (`npm run start`), a plain Vite dev server rooted on
 * `demo/`. It replaces `live-server` (unmaintained, vulnerable dependencies):
 * Vite is already a dependency, serves any file type with the right MIME type,
 * falls back to the next free port when 4242 is taken, and can proxy requests
 * to other servers (see `server.proxy`) for demos that talk to a backend.
 *
 * `dist/` is rebuilt and copied to `demo/web_modules/` by the chokidar scripts
 * of package.json; this config only reloads the browser when the copy lands
 * or when the demo content changes.
 */
import { PROJECT_ROOT } from './scripts/utils/dir.utils';
import { defineConfig } from 'vite';
import path from 'node:path';

const DEMO_ROOT = path.resolve(PROJECT_ROOT, 'demo');

export default defineConfig({
    root: DEMO_ROOT,
    // The demo is a static deck: no public dir, no dependency pre-bundling.
    publicDir: false,
    optimizeDeps: { noDiscovery: true, include: [] },
    server: {
        port: 4242,
        // `--port` picks the port; if it is busy Vite uses the next free one
        // (strictPort: false) and prints the actual URL.
        strictPort: false,
        open: true,
        // Demos that talk to a backend: add rules here, for example
        // proxy: { '/api': 'http://localhost:3000' }.
    },
    plugins: [
        {
            // Files that are not part of Vite's module graph (Markdown slides,
            // the copied dist/) still reload the page when they change.
            name: 'tc-demo-full-reload',
            configureServer(server) {
                const reload = (file: string) => {
                    if (
                        file.includes(`${path.sep}web_modules${path.sep}`) ||
                        file.endsWith('.md')
                    ) {
                        server.ws.send({ type: 'full-reload' });
                    }
                };
                server.watcher.on('change', reload);
                server.watcher.on('add', reload);
            },
        },
    ],
});
