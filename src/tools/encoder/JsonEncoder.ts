import {AbsBaseEncoder} from "./AbsBaseEncoder";
import JSONbigOrigin from "json-bigint";

const JSONbig = JSONbigOrigin({useNativeBigInt: true});
type tConfig = {
    tabSize?: number
};

export class JsonEncoder extends AbsBaseEncoder {
    name: string = '';

    encode(input: any, config?: tConfig): string {
        try {
            return JSONbig.stringify(input, null, config?.tabSize)
        } catch (e) {
            return JSON.stringify(input, null, config?.tabSize)
        }
    }

    decode(input: string): any {
        try {
            return JSONbig.parse(input);
        } catch (e) {
            return JSON.parse(input)
        }
    }
}
