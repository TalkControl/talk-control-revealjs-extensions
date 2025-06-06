import type { QRBitBuffer, QRData } from '../types';
import { QR_MODE } from '../constants';

export class QR8BitByte implements QRData {
    private readonly mode = QR_MODE.MODE_8BIT_BYTE;
    private readonly data: string;
    private readonly parsedData: number[];
    private readonly bytes: number[];

    constructor(data: string) {
        this.data = data;
        this.parsedData = [];

        // Added to support UTF-8 Characters
        for (let i = 0, l = this.data.length; i < l; i++) {
            const byteArray: number[] = [];
            const code = this.data.charCodeAt(i);

            if (code > 0x10000) {
                byteArray[0] = 0xf0 | ((code & 0x1c0000) >>> 18);
                byteArray[1] = 0x80 | ((code & 0x3f000) >>> 12);
                byteArray[2] = 0x80 | ((code & 0xfc0) >>> 6);
                byteArray[3] = 0x80 | (code & 0x3f);
            } else if (code > 0x800) {
                byteArray[0] = 0xe0 | ((code & 0xf000) >>> 12);
                byteArray[1] = 0x80 | ((code & 0xfc0) >>> 6);
                byteArray[2] = 0x80 | (code & 0x3f);
            } else if (code > 0x80) {
                byteArray[0] = 0xc0 | ((code & 0x7c0) >>> 6);
                byteArray[1] = 0x80 | (code & 0x3f);
            } else {
                byteArray[0] = code;
            }

            // Fix Unicode corruption bug
            this.parsedData.push(...byteArray);
        }

        this.parsedData = Array.prototype.concat.apply([], this.parsedData);

        if (this.parsedData.length !== this.data.length) {
            this.parsedData.unshift(191);
            this.parsedData.unshift(187);
            this.parsedData.unshift(239);
        }

        this.bytes = this.parsedData;
    }

    getMode(): number {
        return this.mode;
    }

    getLength(): number {
        return this.bytes.length;
    }

    write(buffer: QRBitBuffer): void {
        for (let i = 0; i < this.bytes.length; i++) {
            buffer.put(this.bytes[i], 8);
        }
    }
}
