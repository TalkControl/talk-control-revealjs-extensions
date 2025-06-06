import type { ErrorCorrectLevel, MaskPattern, QRData } from '../types';
import { PAD0, PAD1, QRErrorCorrectLevel } from '../constants';
import { QR8BitByte } from '../encoders/QR8BitByte';
import { QRBitBuffer } from './QRBitBuffer';
import { QRPolynomial } from '../utils/QRPolynomial';
import { QRRSBlock } from './QRRSBlock';
import { QRUtil } from '../utils/QRUtil';

export class QRCode {
    private typeNumber: number;
    private errorCorrectLevel: number;
    private modules: (boolean | null)[][] | null = null;
    private moduleCount = 0;
    private dataCache: number[] | null = null;
    private dataList: QRData[] = [];

    constructor(typeNumber: number, errorCorrectLevel: ErrorCorrectLevel) {
        this.typeNumber = typeNumber;
        this.errorCorrectLevel = QRErrorCorrectLevel[errorCorrectLevel];
    }

    addData(data: string): void {
        const newData = new QR8BitByte(data);
        this.dataList.push(newData);
        this.dataCache = null;
    }

    isDark(row: number, col: number): boolean {
        if (
            row < 0 ||
            this.moduleCount <= row ||
            col < 0 ||
            this.moduleCount <= col
        ) {
            throw new Error(`${row},${col}`);
        }
        return this.modules![row][col] === true;
    }

    getModuleCount(): number {
        return this.moduleCount;
    }

    make(): void {
        this.makeImpl(false, this.getBestMaskPattern());
    }

    private makeImpl(test: boolean, maskPattern: MaskPattern): void {
        this.moduleCount = this.typeNumber * 4 + 17;
        this.modules = this.createModules(this.moduleCount);

        this.setupPositionProbePattern(0, 0);
        this.setupPositionProbePattern(this.moduleCount - 7, 0);
        this.setupPositionProbePattern(0, this.moduleCount - 7);
        this.setupPositionAdjustPattern();
        this.setupTimingPattern();
        this.setupTypeInfo(test, maskPattern);

        if (this.typeNumber >= 7) {
            this.setupTypeNumber(test);
        }

        if (this.dataCache === null) {
            this.dataCache = this.createData(
                this.typeNumber,
                this.errorCorrectLevel,
                this.dataList
            );
        }

        this.mapData(this.dataCache, maskPattern);
    }

    private createModules(moduleCount: number): (boolean | null)[][] {
        const modules: (boolean | null)[][] = new Array(moduleCount);
        for (let row = 0; row < moduleCount; row++) {
            modules[row] = new Array(moduleCount);
            for (let col = 0; col < moduleCount; col++) {
                modules[row][col] = null;
            }
        }
        return modules;
    }

    private setupPositionProbePattern(row: number, col: number): void {
        for (let r = -1; r <= 7; r++) {
            if (row + r <= -1 || this.moduleCount <= row + r) continue;

            for (let c = -1; c <= 7; c++) {
                if (col + c <= -1 || this.moduleCount <= col + c) continue;

                if (
                    (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
                    (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
                    (2 <= r && r <= 4 && 2 <= c && c <= 4)
                ) {
                    this.modules![row + r][col + c] = true;
                } else {
                    this.modules![row + r][col + c] = false;
                }
            }
        }
    }

    private getBestMaskPattern(): MaskPattern {
        let minLostPoint = 0;
        let pattern: MaskPattern = 0;

        for (let i = 0; i < 8; i++) {
            this.makeImpl(true, i as MaskPattern);
            const lostPoint = QRUtil.getLostPoint(this);

            if (i === 0 || minLostPoint > lostPoint) {
                minLostPoint = lostPoint;
                pattern = i as MaskPattern;
            }
        }

        return pattern;
    }

    private setupTimingPattern(): void {
        for (let r = 8; r < this.moduleCount - 8; r++) {
            if (this.modules![r][6] !== null) {
                continue;
            }
            this.modules![r][6] = r % 2 === 0;
        }

        for (let c = 8; c < this.moduleCount - 8; c++) {
            if (this.modules![6][c] !== null) {
                continue;
            }
            this.modules![6][c] = c % 2 === 0;
        }
    }

    private setupPositionAdjustPattern(): void {
        const pos = QRUtil.getPatternPosition(this.typeNumber);

        for (let i = 0; i < pos.length; i++) {
            for (let j = 0; j < pos.length; j++) {
                const row = pos[i];
                const col = pos[j];

                if (this.modules![row][col] !== null) {
                    continue;
                }

                for (let r = -2; r <= 2; r++) {
                    for (let c = -2; c <= 2; c++) {
                        if (
                            r === -2 ||
                            r === 2 ||
                            c === -2 ||
                            c === 2 ||
                            (r === 0 && c === 0)
                        ) {
                            this.modules![row + r][col + c] = true;
                        } else {
                            this.modules![row + r][col + c] = false;
                        }
                    }
                }
            }
        }
    }

    private setupTypeNumber(test: boolean): void {
        const bits = QRUtil.getBCHTypeNumber(this.typeNumber);

        for (let i = 0; i < 18; i++) {
            const mod = !test && ((bits >> i) & 1) === 1;
            this.modules![Math.floor(i / 3)][
                (i % 3) + this.moduleCount - 8 - 3
            ] = mod;
        }

        for (let i = 0; i < 18; i++) {
            const mod = !test && ((bits >> i) & 1) === 1;
            this.modules![(i % 3) + this.moduleCount - 8 - 3][
                Math.floor(i / 3)
            ] = mod;
        }
    }

    private setupTypeInfo(test: boolean, maskPattern: MaskPattern): void {
        const data = (this.errorCorrectLevel << 3) | maskPattern;
        const bits = QRUtil.getBCHTypeInfo(data);

        // vertical
        for (let i = 0; i < 15; i++) {
            const mod = !test && ((bits >> i) & 1) === 1;

            if (i < 6) {
                this.modules![i][8] = mod;
            } else if (i < 8) {
                this.modules![i + 1][8] = mod;
            } else {
                this.modules![this.moduleCount - 15 + i][8] = mod;
            }
        }

        // horizontal
        for (let i = 0; i < 15; i++) {
            const mod = !test && ((bits >> i) & 1) === 1;

            if (i < 8) {
                this.modules![8][this.moduleCount - i - 1] = mod;
            } else if (i < 9) {
                this.modules![8][15 - i - 1 + 1] = mod;
            } else {
                this.modules![8][15 - i - 1] = mod;
            }
        }

        // fixed module
        this.modules![this.moduleCount - 8][8] = !test;
    }

    private mapData(data: number[], maskPattern: MaskPattern): void {
        let inc = -1;
        let row = this.moduleCount - 1;
        let bitIndex = 7;
        let byteIndex = 0;
        const maskFunc = QRUtil.getMaskFunction(maskPattern);

        for (let col = this.moduleCount - 1; col > 0; col -= 2) {
            if (col === 6) col -= 1;

            while (true) {
                for (let c = 0; c < 2; c++) {
                    if (this.modules![row][col - c] === null) {
                        let dark = false;

                        if (byteIndex < data.length) {
                            dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
                        }

                        const mask = maskFunc(row, col - c);

                        if (mask) {
                            dark = !dark;
                        }

                        this.modules![row][col - c] = dark;
                        bitIndex -= 1;

                        if (bitIndex === -1) {
                            byteIndex += 1;
                            bitIndex = 7;
                        }
                    }
                }

                row += inc;

                if (row < 0 || this.moduleCount <= row) {
                    row -= inc;
                    inc = -inc;
                    break;
                }
            }
        }
    }

    private createBytes(buffer: QRBitBuffer, rsBlocks: QRRSBlock[]): number[] {
        let offset = 0;
        let maxDcCount = 0;
        let maxEcCount = 0;

        const dcdata: number[][] = new Array(rsBlocks.length);
        const ecdata: number[][] = new Array(rsBlocks.length);

        for (let r = 0; r < rsBlocks.length; r++) {
            const dcCount = rsBlocks[r].dataCount;
            const ecCount = rsBlocks[r].totalCount - dcCount;

            maxDcCount = Math.max(maxDcCount, dcCount);
            maxEcCount = Math.max(maxEcCount, ecCount);

            dcdata[r] = new Array(dcCount);

            for (let i = 0; i < dcdata[r].length; i++) {
                dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset];
            }
            offset += dcCount;

            const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
            const rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);

            const modPoly = rawPoly.mod(rsPoly);
            ecdata[r] = new Array(rsPoly.getLength() - 1);
            for (let i = 0; i < ecdata[r].length; i++) {
                const modIndex = i + modPoly.getLength() - ecdata[r].length;
                ecdata[r][i] = modIndex >= 0 ? modPoly.getAt(modIndex) : 0;
            }
        }

        let totalCodeCount = 0;
        for (let i = 0; i < rsBlocks.length; i++) {
            totalCodeCount += rsBlocks[i].totalCount;
        }

        const data = new Array(totalCodeCount);
        let index = 0;

        for (let i = 0; i < maxDcCount; i++) {
            for (let r = 0; r < rsBlocks.length; r++) {
                if (i < dcdata[r].length) {
                    data[index] = dcdata[r][i];
                    index += 1;
                }
            }
        }

        for (let i = 0; i < maxEcCount; i++) {
            for (let r = 0; r < rsBlocks.length; r++) {
                if (i < ecdata[r].length) {
                    data[index] = ecdata[r][i];
                    index += 1;
                }
            }
        }

        return data;
    }

    private createData(
        typeNumber: number,
        errorCorrectLevel: number,
        dataList: QRData[]
    ): number[] {
        const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
        const buffer = new QRBitBuffer();

        for (let i = 0; i < dataList.length; i++) {
            const data = dataList[i];
            buffer.put(data.getMode(), 4);
            buffer.put(
                data.getLength(),
                QRUtil.getLengthInBits(data.getMode(), typeNumber)
            );
            data.write(buffer);
        }

        // calc num max data.
        let totalDataCount = 0;
        for (let i = 0; i < rsBlocks.length; i++) {
            totalDataCount += rsBlocks[i].dataCount;
        }

        if (buffer.getLengthInBits() > totalDataCount * 8) {
            throw new Error(
                `code length overflow. (${buffer.getLengthInBits()}>${totalDataCount * 8})`
            );
        }

        // end code
        if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
            buffer.put(0, 4);
        }

        // padding
        while (buffer.getLengthInBits() % 8 !== 0) {
            buffer.putBit(false);
        }

        // padding
        while (true) {
            if (buffer.getLengthInBits() >= totalDataCount * 8) {
                break;
            }
            buffer.put(PAD0, 8);

            if (buffer.getLengthInBits() >= totalDataCount * 8) {
                break;
            }
            buffer.put(PAD1, 8);
        }

        return this.createBytes(buffer, rsBlocks);
    }

    createTableTag(cellSize = 2, margin?: number): string {
        const actualMargin =
            typeof margin === 'undefined' ? cellSize * 4 : margin;

        let qrHtml = '';

        qrHtml += '<table style="';
        qrHtml += ' border-width: 0px; border-style: none;';
        qrHtml += ' border-collapse: collapse;';
        qrHtml += ` padding: 0px; margin: ${actualMargin}px;`;
        qrHtml += '">';
        qrHtml += '<tbody>';

        for (let r = 0; r < this.getModuleCount(); r++) {
            qrHtml += '<tr>';

            for (let c = 0; c < this.getModuleCount(); c++) {
                qrHtml += '<td style="';
                qrHtml += ' border-width: 0px; border-style: none;';
                qrHtml += ' border-collapse: collapse;';
                qrHtml += ' padding: 0px; margin: 0px;';
                qrHtml += ` width: ${cellSize}px;`;
                qrHtml += ` height: ${cellSize}px;`;
                qrHtml += ' background-color: ';
                qrHtml += this.isDark(r, c) ? '#000000' : '#ffffff';
                qrHtml += ';';
                qrHtml += '"/>';
            }

            qrHtml += '</tr>';
        }

        qrHtml += '</tbody>';
        qrHtml += '</table>';

        return qrHtml;
    }
}
