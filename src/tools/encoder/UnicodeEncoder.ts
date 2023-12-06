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
        let result = input
        // 替换输入字符串中所有的UTF-8转义序列
        if (mode.includes('4')) {
            result = result.replace(/\\u([\dA-Fa-f]{4})/g, (_, match) => {
                return String.fromCharCode(parseInt(match, 16));
            });
        }
        if (mode.includes('2')) {
            // 定义TextDecoder来解码UTF-8
            // const decoder = new TextDecoder('utf-8', {fatal: true});
            // 使用TextDecoder对字节数据进行解码，忽略错误
            const decoder = new TextDecoder();
            // 替换函数，用于处理匹配到的序列
            const replaceFunc = function (match: string) {
                // 从匹配中提取所有十六进制数，如果是null则返回空数组
                const hexMatch = match.match(/[0-9A-Fa-f]{2}/g) || [];
                const bytes = hexMatch.map(b => parseInt(b, 16));
                // 创建一个Uint8Array来存储字节数据
                const uint8Array = new Uint8Array(bytes);
                try {
                    // 尝试解码，如果失败就返回原始匹配字符串
                    return decoder.decode(uint8Array);
                } catch {
                    // 如果解码失败，返回未解码的十六进制序列
                    return match;
                }
            }
            result = result.replace(/(?:\\x([0-9A-Fa-f]{2}))+/g, replaceFunc);
        }
        return result;
    }
}
