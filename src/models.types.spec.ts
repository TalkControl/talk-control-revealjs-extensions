import type {
    PluginFunction,
    RevealApi,
    RevealConfig,
    RevealPlugin,
    RevealPluginFactory,
    ThemeInitializerOptions,
} from './index';
import { describe, expectTypeOf, it } from 'vitest';

describe('public reveal.js 6 types', () => {
    it('ThemeInitializerOptions.plugins accepts a RevealPluginFactory', () => {
        type Plugins = NonNullable<ThemeInitializerOptions['plugins']>;
        expectTypeOf<RevealPluginFactory>().toMatchTypeOf<Plugins[number]>();
    });

    it('keeps the deprecated PluginFunction alias', () => {
        expectTypeOf<PluginFunction>().toEqualTypeOf<RevealPluginFactory>();
    });

    it('a plugin factory returns a RevealPlugin', () => {
        expectTypeOf<
            ReturnType<RevealPluginFactory>
        >().toEqualTypeOf<RevealPlugin>();
        expectTypeOf<RevealPlugin['init']>()
            .parameter(0)
            .toEqualTypeOf<RevealApi>();
        expectTypeOf<RevealConfig>().toHaveProperty('transition');
    });
});
