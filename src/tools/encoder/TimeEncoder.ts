import {AbsBaseEncoder} from "./AbsBaseEncoder";

type tConfig = {
    format?: string,
}

export class TimeEncoder extends AbsBaseEncoder {
    name: string = '';

    encode(input: string): string {
        input = '' + input
        const length = input.length == 23 ? 13 : 10;
        const timestamp = Date.parse(input);
        const timestampString = timestamp.toString();
        return timestampString.substring(0, length);
    }

    decode(input: number | string, config?: tConfig): string {
        let length = ('' + input).length;
        let format = config?.format;
        if (length == 10) {
            input = parseInt(input + '') * 1000;
            format = format || 'YYYY-mm-dd HH:MM:SS'
        } else if (length == 13) {
            input = parseInt(input + '');
            format = format || 'YYYY-mm-dd HH:MM:SS.SSS'
        }
        if (!format) {
            return ''
        }
        const date = new Date(input);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        const second = String(date.getSeconds()).padStart(2, '0');
        const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
        return format
            .replace('YYYY', '' + year)
            .replace('mm', month)
            .replace('dd', day)
            .replace('HH', hour)
            .replace('MM', minute)
            .replace('SS', second)
            .replace('SSS', milliseconds);
    }
}
