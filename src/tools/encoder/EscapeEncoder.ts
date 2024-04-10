import {AbsBaseEncoder} from "./AbsBaseEncoder";
import {jsonDecode} from "../AllEncoder.ts";


export class EscapeEncoder extends AbsBaseEncoder {
    name: string = '';

    encode(input: string): string {
        return input.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    }

    decode(input: unknown, multi?: boolean): unknown {
        let result
        if (typeof input === 'string') {
            let isJson = false
            try {
                if (!isNaN(Number(input)) && !isNaN(parseFloat(input))) {
                    result = input
                } else if (input === 'false' || input === 'true' || input === 'null') {
                    result = input
                } else {
                    result = jsonDecode(input);
                    isJson = true
                }
            } catch (e) {
                result = input;
                try {
                    result = jsonDecode(input.replace(/\\\\/g, "\\").replace(/\\"/g, '"'));
                    isJson = true
                } catch (e) {
                }
            }
            if (isJson && multi) {
                result = this.decode(result, multi)
            }
        } else if (Array.isArray(input)) {
            result = input.map((item) => this.decode(item, multi));
        } else if (input === null) {
            result = input
        } else if (typeof input === 'object') {
            result = {} as { [key: string]: any }
            for (let key in input) {
                if (Object.hasOwnProperty.call(input, key)) {
                    result[key] = this.decode((input as { [key: string]: any })[key], multi)
                }
            }
        } else {
            result = input;
        }
        return result
    }

}