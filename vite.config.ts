import { PROJECT_ROOT } from './scripts/utils/dir.utils';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'node:path';

export default defineConfig({
    build: {
        sourcemap: true,
        lib: {
            entry: path.resolve(PROJECT_ROOT, 'src', 'index.ts'),
            name: 'talk-control-revealjs-extensions',
            fileName: 'talk-control-revealjs-extensions',
        },
        outDir: path.resolve(PROJECT_ROOT, 'dist'),
        rollupOptions: {
            output: {
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name == 'style.css')
                        return 'talk-control-revealjs-theme.css';
                    return assetInfo.name ?? 'vendor.css';
                },
            },
        },
    },
    plugins: [dts({ rollupTypes: true })],
});
