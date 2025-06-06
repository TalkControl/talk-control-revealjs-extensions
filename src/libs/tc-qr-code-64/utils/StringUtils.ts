import { Base64DecodeInputStream } from '../output/Base64DecodeInputStream.js';

export function stringToBytes(s: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        bytes.push(c & 0xff);
    }
    return bytes;
}

export function createStringToBytes(
    unicodeData: string,
    numChars: number
): (s: string) => number[] {
    // create conversion map.
    const unicodeMap = (() => {
        const bin = new Base64DecodeInputStream(unicodeData);
        const read = (): number => {
            const b = bin.read();
            if (b === -1) throw new Error();
            return b;
        };

        let count = 0;
        const unicodeMap: Record<string, number> = {};

        while (true) {
            const b0 = bin.read();
            if (b0 === -1) break;
            const b1 = read();
            const b2 = read();
            const b3 = read();
            const k = String.fromCharCode((b0 << 8) | b1);
            const v = (b2 << 8) | b3;
            unicodeMap[k] = v;
            count += 1;
        }

        if (count !== numChars) {
            throw new Error(`${count} != ${numChars}`);
        }

        return unicodeMap;
    })();

    const unknownChar = '?'.charCodeAt(0);

    return function (s: string): number[] {
        const bytes: number[] = [];
        for (let i = 0; i < s.length; i++) {
            const c = s.charCodeAt(i);
            if (c < 128) {
                bytes.push(c);
            } else {
                const b = unicodeMap[s.charAt(i)];
                if (typeof b === 'number') {
                    if ((b & 0xff) === b) {
                        // 1byte
                        bytes.push(b);
                    } else {
                        // 2bytes
                        bytes.push(b >>> 8);
                        bytes.push(b & 0xff);
                    }
                } else {
                    bytes.push(unknownChar);
                }
            }
        }
        return bytes;
    };
}
