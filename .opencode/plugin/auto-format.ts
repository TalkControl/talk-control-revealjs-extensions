import type { Plugin } from 'opencode-sdk';

export const AutoFormat: Plugin = async ({ $ }) => ({
    tool: {
        execute: {
            after: async (input, output) => {
                if (input.tool === 'edit') {
                    const filePath: string = output.args?.filePath ?? '';
                    if (filePath) {
                        await $`./.hooks/post-file-change.sh ${filePath}`;
                    }
                }
            },
        },
    },
});
