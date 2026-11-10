import { describe, expect, it } from 'vitest';
import {
    escapeHtmlAttribute,
    extractFlagOption,
    extractQuotedOption,
} from './marked-inline-options';

describe(extractQuotedOption.name, () => {
    it('should extract the value and remove it from the remaining options', () => {
        const result = extractQuotedOption(
            'tc-icons tc-a11y-label="Open menu" tc-big',
            'tc-a11y-label'
        );
        expect(result).toEqual({
            value: 'Open menu',
            remaining: 'tc-icons tc-big',
        });
    });

    it('should return undefined and the untouched options when the key is absent', () => {
        const result = extractQuotedOption('tc-icons tc-big', 'tc-a11y-label');
        expect(result).toEqual({
            value: undefined,
            remaining: 'tc-icons tc-big',
        });
    });

    it('should extract an empty value', () => {
        const result = extractQuotedOption(
            'tc-icons tc-a11y-label=""',
            'tc-a11y-label'
        );
        expect(result).toEqual({ value: '', remaining: 'tc-icons' });
    });
});

describe(extractFlagOption.name, () => {
    it('should detect the flag and remove it from the remaining options', () => {
        const result = extractFlagOption(
            'tc-icons tc-a11y-hidden tc-big',
            'tc-a11y-hidden'
        );
        expect(result).toEqual({ present: true, remaining: 'tc-icons tc-big' });
    });

    it('should report absence and keep the options untouched', () => {
        const result = extractFlagOption('tc-icons tc-big', 'tc-a11y-hidden');
        expect(result).toEqual({
            present: false,
            remaining: 'tc-icons tc-big',
        });
    });

    it('should detect the flag at the start or end of the options', () => {
        expect(
            extractFlagOption('tc-a11y-hidden tc-icons', 'tc-a11y-hidden')
                .present
        ).toBe(true);
        expect(
            extractFlagOption('tc-icons tc-a11y-hidden', 'tc-a11y-hidden')
                .present
        ).toBe(true);
    });
});

describe(escapeHtmlAttribute.name, () => {
    it('should escape ampersand, quote and angle brackets', () => {
        expect(escapeHtmlAttribute('A & B "C" <D>')).toBe(
            'A &amp; B &quot;C&quot; &lt;D&gt;'
        );
    });

    it('should leave plain text untouched', () => {
        expect(escapeHtmlAttribute('Open menu')).toBe('Open menu');
    });
});
