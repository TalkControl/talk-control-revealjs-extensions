import type { QRBitBuffer as IQRBitBuffer } from '../types';

export class QRBitBuffer implements IQRBitBuffer {
    private buffer: number[] = [];
    private length = 0;

    getBuffer(): number[] {
        return this.buffer;
    }

    getAt(index: number): boolean {
        const bufIndex = Math.floor(index / 8);
        return ((this.buffer[bufIndex] >>> (7 - (index % 8))) & 1) === 1;
    }

    put(num: number, length: number): void {
        for (let i = 0; i < length; i++) {
            this.putBit(((num >>> (length - i - 1)) & 1) === 1);
        }
    }

    getLengthInBits(): number {
        return this.length;
    }

    putBit(bit: boolean): void {
        const bufIndex = Math.floor(this.length / 8);
        if (this.buffer.length <= bufIndex) {
            this.buffer.push(0);
        }

        if (bit) {
            this.buffer[bufIndex] |= 0x80 >>> this.length % 8;
        }

        this.length++;
    }
}
