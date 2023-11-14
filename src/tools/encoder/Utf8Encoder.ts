import {AbsBaseEncoder} from "./AbsBaseEncoder";
import utf8 from "utf8";

export class Utf8Encoder extends AbsBaseEncoder {
    name: string = '';

    encode(input: string): string {
        return encodeURIComponent(input);
    }

    decode(input: string): string {
        try {
            return utf8.decode(input);
        } catch (e) {
            throw e
        }
    }
}
