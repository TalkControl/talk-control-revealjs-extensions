export class Base64DecodeInputStream {
    private str: string;
    private pos = 0;
    private buffer = 0;
    private buflen = 0;

    constructor(str: string) {
        this.str = str;
    }

    read(): number {
        while (this.buflen < 8) {
            if (this.pos >= this.str.length) {
                if (this.buflen === 0) {
                    return -1;
                }
                throw new Error(`unexpected end of file./${this.buflen}`);
            }

            const c = this.str.charAt(this.pos);
            this.pos += 1;

            if (c === '=') {
                this.buflen = 0;
                return -1;
            } else if (c.match(/^\s$/)) {
                // ignore if whitespace.
                continue;
            }

            this.buffer = (this.buffer << 6) | this.decode(c.charCodeAt(0));
            this.buflen += 6;
        }

        const n = (this.buffer >>> (this.buflen - 8)) & 0xff;
        this.buflen -= 8;
        return n;
    }

    private decode(c: number): number {
        if (0x41 <= c && c <= 0x5a) {
            return c - 0x41;
        } else if (0x61 <= c && c <= 0x7a) {
            return c - 0x61 + 26;
        } else if (0x30 <= c && c <= 0x39) {
            return c - 0x30 + 52;
        } else if (c === 0x2b) {
            return 62;
        } else if (c === 0x2f) {
            return 63;
        } else {
            throw new Error(`c: ${c}`);
        }
    }
}
