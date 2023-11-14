import {AbsBaseEncoder} from "./AbsBaseEncoder";

type supportMode = '4' | '2'
type tConfig = {
    mode?: supportMode[]
}

export class UnicodeEncoder extends AbsBaseEncoder {
    name: string = '';

    encode(input: string): string {
        return encodeURIComponent(input);
    }

    decode(input: string, config?: tConfig): string {
        const mode = config?.mode || ['4', '2'];
        return input.replace(/\\u([\dA-Fa-f]{4})|\\x([0-9A-Fa-f]{2})/g, (match, grpU, grpX) => {
            if (grpU && mode.includes('4')) {
                return String.fromCharCode(parseInt(grpU, 16));
            }
            if (grpX&& mode.includes('2')) {
                return String.fromCharCode(parseInt(grpX, 16));
            }
            return match;
        })
    }
}
