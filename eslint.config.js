import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
    { files: ['src/**/*.{js,mjs,cjs,ts}'] },
    {
        ignores: [
            'dist/**/*',
            'demo/web_modules/**/*',
            'fixtures/a11y/web_modules/**/*',
            // Contract snapshots are generated files (e.g. api.d.ts)
            '**/__snapshots__/**/*',
        ],
    },
    { languageOptions: { globals: globals.browser } },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    { rules: { 'sort-imports': ['error'] } },
];
