import {AbsBaseEncoder} from "./AbsBaseEncoder";

export class GetParamEncoder extends AbsBaseEncoder {
    name: string = '';

    encode(input: string): string {
        return encodeURIComponent(input);
    }

    decode(input: string): object | string {
        const paramObj: any = {};
        const queryString = input.replace(/^[^?]*\?/, '');

        let startIndex = 0;
        let endIndex = 0;
        while (startIndex < queryString.length) {
            // 搜索等号位置
            const equalIndex = queryString.indexOf("=", startIndex);
            if (equalIndex === -1) {
                break;
            }
            // 搜索下一个键值对的等号位置
            endIndex = queryString.indexOf("&", equalIndex);
            if (endIndex === -1) {
                endIndex = queryString.length;
            }
            // 取出键和值，并解码
            const key = decodeURIComponent(queryString.slice(startIndex, equalIndex));
            // 将键值对存储到 paramObj
            const val = decodeURIComponent(queryString.slice(equalIndex + 1, endIndex));

            paramObj[key] = val.replace(/\+/g, ' ')
            // 更新下一个的开始位置
            startIndex = endIndex + 1;
        }

        if (Object.keys(paramObj).length === 0) {
            return input;
        }

        return paramObj;
    }
}
