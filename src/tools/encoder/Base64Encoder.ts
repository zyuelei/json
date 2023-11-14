import {AbsBaseEncoder} from "./AbsBaseEncoder";
import {EncoderType, FactoryEncoder} from "./FactoryEncoder";


export class Base64Encoder extends AbsBaseEncoder {
    name: string = '';

    encode(input: string): string {
        return encodeURIComponent(input);
    }

    decode(input: string): string {
        const UrlEncode = FactoryEncoder.create(EncoderType.Url);
        try {
            return atob(input); // 尝试解码
        } catch (e) {
            try {
                if (input.indexOf('%') != -1) {
                    const decode = UrlEncode.decode(input)
                    if (decode) {
                        return atob(decode)
                    }
                }
            } catch (e) {

            }
            throw e
        }
    }
}
