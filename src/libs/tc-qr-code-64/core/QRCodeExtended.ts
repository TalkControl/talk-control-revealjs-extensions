import type { ErrorCorrectLevel } from '../types.js';
import { QRCode } from './QRCode.js';
import { createImgTag } from '../utils/ImageUtils.js';

export class QRCodeExtended extends QRCode {
    constructor(typeNumber: number, errorCorrectLevel: ErrorCorrectLevel) {
        super(typeNumber, errorCorrectLevel);
    }

    createImgTag(cellSize = 2, margin?: number, size?: number): string {
        const actualMargin =
            typeof margin === 'undefined' ? cellSize * 4 : margin;

        const min = actualMargin;
        const max = this.getModuleCount() * cellSize + actualMargin;

        return createImgTag(size || max, size || max, (x, y) => {
            if (min <= x && x < max && min <= y && y < max) {
                const c = Math.floor((x - min) / cellSize);
                const r = Math.floor((y - min) / cellSize);
                return this.isDark(r, c) ? 0 : 1;
            } else {
                return 1;
            }
        });
    }
}
