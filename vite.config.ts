import { PROJECT_ROOT } from './scripts/utils/dir.utils';
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
    build: {
        sourcemap: true,
        lib: {
            entry: path.resolve(PROJECT_ROOT, 'src', 'index.ts'),
            name: 'talk-control-extensions',
            fileName: 'talk-control-extensions',
        },
        outDir: path.resolve(PROJECT_ROOT, 'dist'),
        rollupOptions: {
            output: {
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name == 'style.css')
                        return 'talk-control-theme.css';
                    return assetInfo.name ?? 'vendor.css';
                },
            },
        },
    },
});
