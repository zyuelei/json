import {AbsBaseEncoder} from "./AbsBaseEncoder";

export class UnicodeEncoder extends AbsBaseEncoder {
    name: string = '';
    encode(input: string): string {
        return encodeURIComponent(input);
    }

    decode(input: string): string {
        return input.replace(/\\u([\dA-Fa-f]{4})|\\x([0-9A-Fa-f]{2})/g, (match, grpU, grpX) => {
            if (grpU) {
                return String.fromCharCode(parseInt(grpU, 16));
            }
            if (grpX) {
                return String.fromCharCode(parseInt(grpX, 16));
            }
            return match;
        })
    }
}
