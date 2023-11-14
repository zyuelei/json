import {AbsBaseEncoder} from "./AbsBaseEncoder";
import {jsonDecode} from "../AllEncoder.ts";


export class EscapeEncoder extends AbsBaseEncoder {
    name: string = '';

    encode(input: string): string {
        return input;
    }

    decode(input: unknown): unknown {
        if (typeof input === 'string') {
            return this.parse(input)
        }
        if (typeof input !== 'object' || input === null) {
            return input
        }

        if (Array.isArray(input)) {
            input = input.map((item) => this.decode(this.parse(item)));
            return input
        }

        const escapedJson: any = {};
        for (let key in input) {
            if (Object.hasOwnProperty.call(input, key)) {
                const value = (input as { [key: string]: any })[key]
                escapedJson[key] = this.parse(value)
            }
        }

        return escapedJson;
    }

    parse(value: any) {
        let result
        if (typeof value === 'string') {
            try {
                if (!isNaN(Number(value)) && !isNaN(parseFloat(value))) {
                    result = value
                } else if (value === 'false' || value === 'true' || value === 'null') {
                    result = value
                } else {
                    const json = jsonDecode(value);
                    result = this.decode(json)
                }
            } catch (e) {
                result = value;
                try {
                    const json = jsonDecode(value.replace(/\\\\/g, "\\").replace(/\\"/g, '"'));
                    result = this.decode(json)
                } catch (e) {
                }
            }
        } else if (Array.isArray(value)) {
            result = value.map((item) => this.decode(item));
        } else if (typeof value === 'object') {
            result = this.decode(value);
        } else {
            result = value;
        }
        return result
    }


}