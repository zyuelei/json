import {AbsBaseEncoder} from "./AbsBaseEncoder";
import {unserialize} from "serialize-php";

export class SerializeEncoder extends AbsBaseEncoder {
    name: string = '';

    encode(input: string): string {
        return encodeURIComponent(input);
    }

    escapeString(text: string): string {
        return text.replace(/\\\\/g, "\\").replace(/\\"/g, '"')
    }

    decode(input: string): string {
        try {
            return unserialize(input)
        } catch (e) {
            const escape = this.escapeString(input)
            if (escape != input) {
                try {
                    return unserialize(escape)
                } catch (e) {
                    throw e
                }
            }
            throw e
        }
    }
}
