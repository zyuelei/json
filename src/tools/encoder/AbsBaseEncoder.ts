import {IEncoder} from "../../interface";

export abstract class AbsBaseEncoder implements IEncoder {
    abstract name: string;

    abstract encode(input: unknown, config?: unknown): string | false;

    abstract decode(input: unknown, config?: unknown): unknown;

    check(input: string): boolean {
        return typeof input !== 'object';
    }

    decodeToJson(input: string): unknown {
        return this.decode(input);
    }
}
