import {Base64Encoder} from './Base64Encoder';
import {GetParamEncoder} from './GetParamEncoder';
import {UrlEncoder} from './UrlEncoder';
import {SerializeEncoder} from './SerializeEncoder';
import {TimeEncoder} from './TimeEncoder';
import {UnicodeEncoder} from './UnicodeEncoder';
import {Utf8Encoder} from './Utf8Encoder';
import {JsonEncoder} from "./JsonEncoder";
import {FormEncoder} from "./FormEncoder.ts";
import {EscapeEncoder} from "./EscapeEncoder.ts";

export enum EncoderType {
    Json,
    GetParam,
    Url,
    Base64,
    Serialize,
    Time,
    Unicode,
    Utf8,
    Form,
    Escape,
}

const encoderMapping = {
    [EncoderType.GetParam]: new GetParamEncoder,
    [EncoderType.Url]: new UrlEncoder,
    [EncoderType.Base64]: new Base64Encoder,
    [EncoderType.Serialize]: new SerializeEncoder,
    [EncoderType.Time]: new TimeEncoder,
    [EncoderType.Unicode]: new UnicodeEncoder,
    [EncoderType.Utf8]: new Utf8Encoder,
    [EncoderType.Json]: new JsonEncoder,
    [EncoderType.Form]: new FormEncoder,
    [EncoderType.Escape]: new EscapeEncoder,
}
type EncoderMap = typeof encoderMapping;

export class FactoryEncoder {
    static create<T extends keyof EncoderMap>(type: T): EncoderMap[T] {
        return encoderMapping[type];
    }
}
