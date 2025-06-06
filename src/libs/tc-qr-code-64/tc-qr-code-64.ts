/**
 *
 * Transformation with Claude Code of this repository : https://github.com/pudon/weapp-qrcode-base64/tree/master
 *
 */
import type { ErrorCorrectLevel, QROptions } from './types';
import { createStringToBytes, stringToBytes } from './utils/StringUtils';
import { QRCodeExtended } from './core/QRCodeExtended';

export * from './constants';
export * from './types';
export { QRCode } from './core/QRCode';
export { QRCodeExtended } from './core/QRCodeExtended';
export { QRBitBuffer } from './core/QRBitBuffer';
export { QRRSBlock } from './core/QRRSBlock';
export { QR8BitByte } from './encoders/QR8BitByte';
export { QRUtil } from './utils/QRUtil';
export { QRMath } from './utils/QRMath';
export { QRPolynomial } from './utils/QRPolynomial';

// Factory function compatible with original API
export function qrcode(
    typeNumber: number,
    errorCorrectLevel: ErrorCorrectLevel
): QRCodeExtended {
    return new QRCodeExtended(typeNumber, errorCorrectLevel);
}

// Main drawing function compatible with original API
export function drawImg(text: string, options: QROptions = {}): string {
    const typeNumber = options.typeNumber || 4;
    const errorCorrectLevel = options.errorCorrectLevel || 'M';
    const size = options.size || 500;

    let qr: QRCodeExtended;

    try {
        qr = qrcode(typeNumber, errorCorrectLevel);
        qr.addData(text);
        qr.make();
    } catch (e) {
        if (typeNumber >= 40) {
            throw new Error('Text too long to encode');
        } else {
            return drawImg(text, {
                size: size,
                errorCorrectLevel: errorCorrectLevel,
                typeNumber: typeNumber + 1,
            });
        }
    }

    // calc cellsize and margin
    const cellsize = parseInt((size / qr.getModuleCount()).toString());
    const margin = parseInt(
        ((size - qr.getModuleCount() * cellsize) / 2).toString()
    );

    return qr.createImgTag(cellsize, margin, size);
}

// Static utility functions
export const QRCodeUtils = {
    stringToBytes,
    createStringToBytes,
};

// Default export for compatibility
export default {
    drawImg,
    qrcode,
    QRCodeUtils,
};
