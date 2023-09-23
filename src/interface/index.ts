export interface config {
    tabSize?: number
    fontSize?: number
    useWrap?: boolean
    printMargin?: boolean
    theme?: string
    render: string,
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

export enum supportAutoType {
    'get_param',
    'utf8',
    'unicode',
    'unserialize'
}