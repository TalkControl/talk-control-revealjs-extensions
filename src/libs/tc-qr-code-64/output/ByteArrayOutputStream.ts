import type { OutputStream } from '../types.js';

export class ByteArrayOutputStream implements OutputStream {
    private bytes: number[] = [];

    writeByte(b: number): void {
        this.bytes.push(b & 0xff);
    }

    writeShort(i: number): void {
        this.writeByte(i);
        this.writeByte(i >>> 8);
    }

    writeBytes(b: number[], off = 0, len?: number): void {
        const length = len ?? b.length;
        for (let i = 0; i < length; i++) {
            this.writeByte(b[i + off]);
        }
    }

    writeString(s: string): void {
        for (let i = 0; i < s.length; i++) {
            this.writeByte(s.charCodeAt(i));
        }
    }

    toByteArray(): number[] {
        return this.bytes;
    }

    toString(): string {
        let s = '';
        s += '[';
        for (let i = 0; i < this.bytes.length; i++) {
            if (i > 0) {
                s += ',';
            }
            s += this.bytes[i];
        }
        s += ']';
        return s;
    }
}
