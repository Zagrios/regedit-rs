/// <reference types="node" />

import { RegistryType } from "./js-binding"

//#region RegistryItemValueMapper

export abstract class RegistryItemValueMapper {
    private static readonly registryTypeToClass: Record<RegistryType, typeof RegistryItemValue>;

    public static from(buffer: Buffer | string, type: RegistryType.RegSz): RegSzValue;
    public static from(buffer: Buffer | string, type: RegistryType.RegExpandSz): RegExpandSzValue;
    public static from(buffer: Buffer | number, type: RegistryType.RegDword): RegDwordValue;
    public static from(buffer: Buffer | BigInt, type: RegistryType.RegQword): RegQwordValue;
    public static from(buffer: Buffer | string[], type: RegistryType.RegMultiSz): RegMultiSzValue;
    public static from(buffer: Buffer, type: RegistryType.RegBinary): RegBinaryValue;
    public static from(buffer: Buffer, type: RegistryType.RegNone): RegNoneValue;
    public static from(buffer: Buffer | string, type: RegistryType.RegLink): RegLinkValue;
    public static from(buffer: Buffer, type: RegistryType.RegResourceList): RegResourceListValue;
    public static from(buffer: Buffer, type: RegistryType.RegFullResourceDescriptor): RegFullResourceDescriptorValue;
    public static from(buffer: Buffer, type: RegistryType.RegResourceRequirementsList): RegResourceRequirementsListValue;
    public static from(buffer: Buffer | number, type: RegistryType.RegDwordBigEndian): RegDwordBigEndianValue;
}

//#endregion

//#region RegistryItemValue classes

export abstract class RegistryItemValue<ValueType = unknown, RegType = RegistryType> {
    
    public static valueToBuffer(value: unknown): Buffer;
    public static bufferToValue(buffer: Buffer): unknown;

    readonly rawValue: Buffer;
    readonly type: RegType;
    constructor(value: Buffer|ValueType, type: RegistryType);
    get value(): ValueType;
}

export class RegSzValue extends RegistryItemValue<string, RegistryType.RegSz> {
    public static valueToBuffer(value: string): Buffer;
    public static bufferToValue(buffer: Buffer): string;
    constructor(value: Buffer|string);
}

export class RegExpandSzValue extends RegistryItemValue<string, RegistryType.RegExpandSz> {
    public static valueToBuffer(value: string): Buffer;
    public static bufferToValue(buffer: Buffer): string;
    constructor(value: Buffer|string);
    readonly type: RegistryType.RegExpandSz;
    get expandedValue(): string;
}

export class RegDwordValue extends RegistryItemValue<number, RegistryType.RegDword> {
    public static valueToBuffer(value: number): Buffer;
    public static bufferToValue(buffer: Buffer): number;
    constructor(value: Buffer|number);
}

export class RegQwordValue extends RegistryItemValue<BigInt, RegistryType.RegQword> {

    public static valueToBuffer(value: BigInt): Buffer;
    public static bufferToValue(buffer: Buffer): BigInt;
    constructor(value: Buffer|BigInt);
}

export class RegMultiSzValue extends RegistryItemValue<string[], RegistryType.RegMultiSz> {
    public static valueToBuffer(value: string[]): Buffer;
    public static bufferToValue(buffer: Buffer): string[];
    constructor(value: Buffer|string[]);
}

export class RegBinaryValue extends RegistryItemValue<Buffer, RegistryType.RegBinary> {
    public static valueToBuffer(value: Buffer): Buffer;
    public static bufferToValue(buffer: Buffer): Buffer;
    constructor(value: Buffer);
}

export class RegNoneValue extends RegistryItemValue<Buffer, RegistryType.RegNone> {
    public static valueToBuffer(value: Buffer): Buffer;
    public static bufferToValue(buffer: Buffer): Buffer;
    constructor(value: Buffer);
}

export class RegLinkValue extends RegistryItemValue<string, RegistryType.RegLink> {
    public static valueToBuffer(value: string): Buffer;
    public static bufferToValue(buffer: Buffer): string;
    constructor(value: Buffer|string);
}

export class RegResourceListValue extends RegistryItemValue<Buffer, RegistryType.RegResourceList> {
    public static valueToBuffer(value: Buffer): Buffer;
    public static bufferToValue(buffer: Buffer): Buffer;
    constructor(value: Buffer);
}

export class RegFullResourceDescriptorValue extends RegistryItemValue<Buffer, RegistryType.RegFullResourceDescriptor> {
    public static valueToBuffer(value: Buffer): Buffer;
    public static bufferToValue(buffer: Buffer): Buffer;
    constructor(value: Buffer);
}

export class RegResourceRequirementsListValue extends RegistryItemValue<Buffer, RegistryType.RegResourceRequirementsList> {
    public static valueToBuffer(value: Buffer): Buffer;
    public static bufferToValue(buffer: Buffer): Buffer;
    constructor(value: Buffer);
}

export class RegDwordBigEndianValue extends RegistryItemValue<number, RegistryType.RegDwordBigEndian> {
    public static valueToBuffer(value: number): Buffer;
    public static bufferToValue(buffer: Buffer): number;
    constructor(value: Buffer|number);
}

//#endregion

export interface RegistryItem {
    exists: boolean
    keys: Array<string>
    values: Record<string, RegistryItemValue>
}

export type RegistryPutItemValues = Record<string, RegistryItemValue>;
export type RegistryPutCollection = Record<string, RegistryPutItemValues>;
export type RegistyDeleteCollection = Record<string, Array<string>>;

export function listSync<T extends string>(keys: Array<T>|T): Record<T, RegistryItem>
export function createKeySync(keys: string | Array<string>): void
export function putValueSync(putCollection: RegistryPutCollection): void
export function deleteKeySync(keys: string | Array<string>): void
export function deleteValueSync(deleteCollection: RegistyDeleteCollection): void

export function list<T extends string>(keys: Array<T>|T): Promise<Record<T, RegistryItem>>
export function createKey(keys: string | Array<string>): Promise<void>
export function putValue(putCollection: RegistryPutCollection): Promise<void>
export function deleteKey(keys: string | Array<string>): Promise<void>
export function deleteValue(deleteCollection: RegistyDeleteCollection): Promise<void>

export { RegistryType } from "./js-binding.d"