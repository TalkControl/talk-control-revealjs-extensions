export type ErrorCorrectLevel = 'L' | 'M' | 'Q' | 'H';

export type QRMode =
    | 'MODE_NUMBER'
    | 'MODE_ALPHA_NUM'
    | 'MODE_8BIT_BYTE'
    | 'MODE_KANJI';

export type MaskPattern = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface QROptions {
    typeNumber?: number;
    errorCorrectLevel?: ErrorCorrectLevel;
    size?: number;
}

export interface DrawOptions extends QROptions {
    cellSize?: number;
    margin?: number;
}

export interface RSBlock {
    totalCount: number;
    dataCount: number;
}

export interface QRData {
    getMode(): number;
    getLength(): number;
    write(buffer: QRBitBuffer): void;
}

export interface QRBitBuffer {
    getBuffer(): number[];
    getAt(index: number): boolean;
    put(num: number, length: number): void;
    getLengthInBits(): number;
    putBit(bit: boolean): void;
}

export interface QRPolynomial {
    getAt(index: number): number;
    getLength(): number;
    multiply(e: QRPolynomial): QRPolynomial;
    mod(e: QRPolynomial): QRPolynomial;
}

export interface OutputStream {
    writeByte(b: number): void;
    writeShort(i: number): void;
    writeBytes(b: number[], off?: number, len?: number): void;
    writeString(s: string): void;
}
