import { Base64EncodeOutputStream } from '../output/Base64EncodeOutputStream';
import { ByteArrayOutputStream } from '../output/ByteArrayOutputStream';
import { GifImage } from '../output/GifImage';

export function createImgTag(
    width: number,
    height: number,
    getPixel: (x: number, y: number) => number
): string {
    const gif = new GifImage(width, height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            gif.setPixel(x, y, getPixel(x, y));
        }
    }

    const b = new ByteArrayOutputStream();
    gif.write(b);

    const base64 = new Base64EncodeOutputStream();
    const bytes = b.toByteArray();
    for (let i = 0; i < bytes.length; i++) {
        base64.writeByte(bytes[i]);
    }
    base64.flush();

    let img = '';
    img += 'data:image/gif;base64,';
    img += base64.toString();

    return img;
}
