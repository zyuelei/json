import {AbsBaseEncoder} from "./AbsBaseEncoder";
function resolveObject(name: string, object: any) {
    let stringToReturn = '';
    for (const [key, value] of Object.entries(object)) {
        if (value instanceof Object) {
            stringToReturn += resolveObject(`${name}[${key}]`, value);
            continue;
        }
        if (value instanceof Array) {
            stringToReturn += resolveArray(`${name}[${key}]`, value);
            continue;
        }
        stringToReturn += `${name}[${key}]:${value}\n`
    }
    return stringToReturn;
}

function resolveArray(name: string, array: any[]) {
    let stringToReturn = '';
    array.forEach((value, index) => {
        if (value instanceof Object) {
            stringToReturn += resolveObject(`${name}[${index}]`, value);
            return;
        }
        if (value instanceof Array) {
            stringToReturn += resolveArray(`${name}[${index}]`, value);
            return;
        }
        stringToReturn += `${name}[${index}]:${value}\n`
    })
    return stringToReturn;
}

export class FormEncoder extends AbsBaseEncoder {
    name: string = '';

    encode(input: Record<any, any>): string {
        let formDataString = '';
        for (const [key, value] of Object.entries(input)) {
            if (value instanceof Object) {
                formDataString += resolveObject(key, value);
                continue;
            }
            if (value instanceof Array) {
                formDataString += resolveArray(key, value);
            }
            formDataString += `${key}:${value}\n`
        }
        return formDataString;
    }

    decode(input: string): string {
        return input;
    }
}
