import type { Plugin } from "opencode-sdk";

export const AutoFormat: Plugin = async ({ $ }) => ({
    tool: {
        execute: {
            after: async (input, output) => {
                if (input.tool === "edit") {
                    const filePath: string = output.args?.filePath ?? "";
                    if (/\/src\/.*\.(ts|scss)$/.test(filePath)) {
                        await $`npm run lint:fix`;
                        await $`npm run prettier:fix`;
                    }
                }
            },
        },
    },
});
