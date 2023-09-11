export interface config {
    tabSize?: number
    fontSize?: number
    useWrap?: boolean
    printMargin?: boolean
    theme?: string
}

export interface rangeMy {
    startLine: number,
    endLine: number,
    startColumn: number,
    endColumn: number,
}

export interface matchRangeMy extends rangeMy {
    matchText: string,
    isCursor: boolean,

    newContent(str: any): string,
}

export interface editContentMy extends rangeMy {
    positionLine: number,
    positionColumn: number,
    firstLine: number,
    firstColumn: number,
    lastLine: number,
    lastColumn: number,
    selectText: string,
    lineText: string,
    baseCount: 0,
}