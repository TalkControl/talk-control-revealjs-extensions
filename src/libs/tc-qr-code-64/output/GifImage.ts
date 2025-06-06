import { ByteArrayOutputStream } from './ByteArrayOutputStream.js';
import type { OutputStream } from '../types.js';

interface BitOutputStream {
    write(data: number, length: number): void;
    flush(): void;
}

interface LZWTable {
    add(key: string): void;
    size(): number;
    indexOf(key: string): number;
    contains(key: string): boolean;
}

export class GifImage {
    private width: number;
    private height: number;
    private data: number[];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.data = new Array(width * height);
    }

    setPixel(x: number, y: number, pixel: number): void {
        this.data[y * this.width + x] = pixel;
    }

    write(out: OutputStream): void {
        //---------------------------------
        // GIF Signature
        out.writeString('GIF87a');

        //---------------------------------
        // Screen Descriptor
        out.writeShort(this.width);
        out.writeShort(this.height);

        out.writeByte(0x80); // 2bit
        out.writeByte(0);
        out.writeByte(0);

        //---------------------------------
        // Global Color Map

        // black
        out.writeByte(0x00);
        out.writeByte(0x00);
        out.writeByte(0x00);

        // white
        out.writeByte(0xff);
        out.writeByte(0xff);
        out.writeByte(0xff);

        //---------------------------------
        // Image Descriptor
        out.writeString(',');
        out.writeShort(0);
        out.writeShort(0);
        out.writeShort(this.width);
        out.writeShort(this.height);
        out.writeByte(0);

        //---------------------------------
        // Raster Data
        const lzwMinCodeSize = 2;
        const raster = this.getLZWRaster(lzwMinCodeSize);

        out.writeByte(lzwMinCodeSize);

        let offset = 0;

        while (raster.length - offset > 255) {
            out.writeByte(255);
            out.writeBytes(raster, offset, 255);
            offset += 255;
        }

        out.writeByte(raster.length - offset);
        out.writeBytes(raster, offset, raster.length - offset);
        out.writeByte(0x00);

        //---------------------------------
        // GIF Terminator
        out.writeString(';');
    }

    private createBitOutputStream(out: OutputStream): BitOutputStream {
        let bitLength = 0;
        let bitBuffer = 0;

        return {
            write(data: number, length: number): void {
                if (data >>> length !== 0) {
                    throw new Error('length over');
                }

                while (bitLength + length >= 8) {
                    out.writeByte(0xff & ((data << bitLength) | bitBuffer));
                    length -= 8 - bitLength;
                    data >>>= 8 - bitLength;
                    bitBuffer = 0;
                    bitLength = 0;
                }

                bitBuffer = (data << bitLength) | bitBuffer;
                bitLength = bitLength + length;
            },

            flush(): void {
                if (bitLength > 0) {
                    out.writeByte(bitBuffer);
                }
            },
        };
    }

    private getLZWRaster(lzwMinCodeSize: number): number[] {
        const clearCode = 1 << lzwMinCodeSize;
        const endCode = (1 << lzwMinCodeSize) + 1;
        let bitLength = lzwMinCodeSize + 1;

        // Setup LZWTable
        const table = this.createLZWTable();

        for (let i = 0; i < clearCode; i++) {
            table.add(String.fromCharCode(i));
        }
        table.add(String.fromCharCode(clearCode));
        table.add(String.fromCharCode(endCode));

        const byteOut = new ByteArrayOutputStream();
        const bitOut = this.createBitOutputStream(byteOut);

        // clear code
        bitOut.write(clearCode, bitLength);

        let dataIndex = 0;
        let s = String.fromCharCode(this.data[dataIndex]);
        dataIndex += 1;

        while (dataIndex < this.data.length) {
            const c = String.fromCharCode(this.data[dataIndex]);
            dataIndex += 1;

            if (table.contains(s + c)) {
                s = s + c;
            } else {
                bitOut.write(table.indexOf(s), bitLength);

                if (table.size() < 0xfff) {
                    if (table.size() === 1 << bitLength) {
                        bitLength += 1;
                    }

                    table.add(s + c);
                }

                s = c;
            }
        }

        bitOut.write(table.indexOf(s), bitLength);

        // end code
        bitOut.write(endCode, bitLength);

        bitOut.flush();

        return byteOut.toByteArray();
    }

    private createLZWTable(): LZWTable {
        const map: Record<string, number> = {};
        let size = 0;

        return {
            add(key: string): void {
                if (this.contains(key)) {
                    throw new Error(`dup key: ${key}`);
                }
                map[key] = size;
                size += 1;
            },

            size(): number {
                return size;
            },

            indexOf(key: string): number {
                return map[key];
            },

            contains(key: string): boolean {
                return typeof map[key] !== 'undefined';
            },
        };
    }
}
