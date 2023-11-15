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

    archive(input: string) {
        let result = [];
        let quoteChar: any = false;
        input = input.replace(/\n/g, " ");

        for (let currentChar of input) {
            if (quoteChar && currentChar === quoteChar && !result[result.length - 1].endsWith("\\")) {
                quoteChar = false;
            } else if (!quoteChar && (currentChar === '"' || currentChar === "'")) {
                quoteChar = currentChar;
            } else if (!quoteChar && (currentChar === " " || currentChar === " " || currentChar === "\t")) {
                currentChar = "";
            }
            result.push(currentChar);
        }
        return result.join("");
    }
}
