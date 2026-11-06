import {
    IncomingMessage,
    Server,
    ServerResponse,
    createServer,
} from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

const MIME_TYPES: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.map': 'application/json; charset=utf-8',
};

export interface StaticServer {
    url: string;
    close: () => Promise<void>;
}

/**
 * Minimal, zero-dependency static file server for the `--dir` CLI target:
 * serving a static folder (e.g. `demo/`) for the scan to navigate to
 * shouldn't require pulling in a new runtime dependency just for that.
 */
export function startStaticServer(
    rootDir: string,
    port = 0
): Promise<StaticServer> {
    const root = resolve(rootDir);

    return new Promise((resolvePromise, reject) => {
        const server: Server = createServer((req, res) => {
            void handleRequest(root, req, res);
        });

        server.once('error', reject);
        server.listen(port, '127.0.0.1', () => {
            const address = server.address();
            const resolvedPort =
                typeof address === 'object' && address !== null
                    ? address.port
                    : port;
            resolvePromise({
                url: `http://127.0.0.1:${resolvedPort}`,
                close: () =>
                    new Promise<void>((closeResolve, closeReject) => {
                        server.close((err) =>
                            err ? closeReject(err) : closeResolve()
                        );
                    }),
            });
        });
    });
}

async function handleRequest(
    root: string,
    req: IncomingMessage,
    res: ServerResponse
): Promise<void> {
    const requestUrl = req.url ?? '/';
    const pathname = decodeURIComponent(requestUrl.split('?')[0] ?? '/');
    const safeSuffix = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
    const withoutLeadingSlash = safeSuffix.replace(/^[/\\]+/, '');

    let filePath = join(root, withoutLeadingSlash);
    if (safeSuffix.endsWith('/') || extname(filePath) === '') {
        filePath = join(filePath, 'index.html');
    }

    try {
        const body = await readFile(filePath);
        const contentType =
            MIME_TYPES[extname(filePath).toLowerCase()] ??
            'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(body);
    } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
    }
}
