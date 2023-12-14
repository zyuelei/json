export enum supportEditTemplateType {
    brace,
    monaco,
}

export enum supportAutoType {
    get_param,
    utf8,
    unserialize,
    archive,
    extractJson,
    unicode,
}

export interface systemConfig {
    tabSize?: number
    fontSize?: number
    useWrap?: boolean
    printMargin?: boolean
    theme?: string
    render: supportEditTemplateType,
    autoFormat: supportAutoType[]
}

export interface rangeMy {
    startLine: number,
    endLine: number,
    startColumn: number,
    endColumn: number,
}

export interface matchRangeMy extends rangeMy {
    matchText: string,
    oldText: string,
    isCursor: boolean,

    newContent(str: any): { isJson: boolean, text: string },
}

export interface editContentMy extends rangeMy {
    positionLine: number,
    positionColumn: number,
    firstLine: number,
    firstColumn: number,
    lastLine: number,
    lastColumn: number,
}

export enum ContentSelectType {
    line_number,
    line_quotes,
    select,
}

export interface panesInterface {
    title: string,
    key: number,
    closable?: boolean,
    content: string,
    favorite?: boolean,
    time: number,
    render: supportEditTemplateType,
}


export function getNextEnumValue<T extends Record<string, string | number>>(enumType: T, currentEnum: number): T[keyof T] {
    const enumValues = (Object.values(enumType).filter(value => typeof value === 'number') as unknown) as Array<T[keyof T]>;
    const index = enumValues.indexOf(currentEnum as unknown as T[keyof T]);
    // 如果没有找到对应的枚举值或者当前枚举值是最后一个，则返回第一个枚举值
    if (index === -1 || index === enumValues.length - 1) {
        return enumValues[0];
    } else {
        // 否则返回下一个枚举值
        return enumValues[index + 1];
    }
}

export interface IEncoder {
    name: string;

    encode(input: unknown, config?: unknown): unknown;

    decode(input: unknown, config?: unknown): unknown;

    decodeToJson(input: unknown): unknown;

    check(input: string): boolean;
}