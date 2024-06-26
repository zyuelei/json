import {EncoderType, FactoryEncoder} from "./encoder";

const JsonEncode = FactoryEncoder.create(EncoderType.Json);
const GetParamEncode = FactoryEncoder.create(EncoderType.GetParam);
const UrlEncode = FactoryEncoder.create(EncoderType.Url);
const Base64Encode = FactoryEncoder.create(EncoderType.Base64);
const SerializeEncode = FactoryEncoder.create(EncoderType.Serialize);
const Utf8Encode = FactoryEncoder.create(EncoderType.Utf8);
const TimeEncode = FactoryEncoder.create(EncoderType.Time);
const UnicodeEncode = FactoryEncoder.create(EncoderType.Unicode);
const FormEncode = FactoryEncoder.create(EncoderType.Form);
const EscapeEncode = FactoryEncoder.create(EncoderType.Escape);

export function jsonEncode(value: any, space?: number) {
    return JsonEncode.encode(value, {
        tabSize: space
    })
}

export function jsonDecode(value: any) {
    return JsonEncode.decode(value);
}

export function jsonArchive(value: string) {
    return JsonEncode.archive(value);
}

export function unicodeDecode(str: string) {
    return UnicodeEncode.decode(str)
}

export function utf8Decode(str: string) {
    return Utf8Encode.decode(str)
}

export function getParamDecode(paramsString: string) {
    return GetParamEncode.decode(paramsString);
}

export function base64Decode(str: string) {
    return Base64Encode.decode(str);
}

export function urlDecode(parseText: string) {
    return UrlEncode.decode(parseText);
}

export function serializeDecode(parseText: string) {
    return SerializeEncode.decode(parseText);
}

export function timeDecode(timestamp: number | string, format?: string) {
    return TimeEncode.decode(timestamp, {format: format});
}

export function timeEncode(str: string) {
    return TimeEncode.encode(str)
}

export function escapeDecode(json: unknown, multi?: boolean) {
    return EscapeEncode.decode(json, multi);
}

export function escapeEncode(value: any) {
    return EscapeEncode.encode(value);
}

export function formEncode(jsonValues: Record<any, any>) {
    return FormEncode.encode(jsonValues)
}

export function extractJson(input: string): string {
    // 正则匹配JSON字符串的开始和结束位置
    const jsonPattern = /{.*}|\[.*]/;
    const match = input.match(jsonPattern);
    const result = match ? match[0] : input;
    return result
}

