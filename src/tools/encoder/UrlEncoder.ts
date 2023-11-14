import {AbsBaseEncoder} from "./AbsBaseEncoder";

export class UrlEncoder extends AbsBaseEncoder {
    name: string = '';
    encode(input: string): string {
        return encodeURIComponent(input);
    }

    decode(input: string): string { /// todo
        try {
            return decodeURIComponent(input);
        } catch (e) {
            throw e
        }
    }
}
