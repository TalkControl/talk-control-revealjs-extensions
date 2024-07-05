import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        sourcemap: true,
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'talk-control',
            fileName: 'talk-control',
        },
        outDir: resolve(__dirname, 'dist'),
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
