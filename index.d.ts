/// <reference types="node" />

import { RegistryType } from "./js-binding"

// Types here

export class RegistryItemValue {
    readonly rawValue: Buffer;
    readonly type: RegistryType;
    constructor(rawValue: Buffer, type: RegistryType)
    get value(): any;
}

export class REG_SZ_Value extends RegistryItemValue {
    constructor(value: string);
    readonly type: RegistryType.RegSz;
    get value(): string;
}

export class REG_EXPAND_SZ_Value extends RegistryItemValue {
    constructor(value: string);
    readonly type: RegistryType.RegExpandSz;
    get value(): string;
}

export class REG_DWORD_Value extends RegistryItemValue {
    constructor(value: number);
    readonly type: RegistryType.RegDword;
    get value(): number;
}

export class REG_QWORD_Value extends RegistryItemValue {
    constructor(value: number);
    readonly type: RegistryType.RegQword;
    get value(): number;
}

export class REG_MULTI_SZ_Value extends RegistryItemValue {
    constructor(value: string[]);
    readonly type: RegistryType.RegMultiSz;
    get value(): string[];
}

export class REG_BINARY_Value extends RegistryItemValue {
    constructor(value: Buffer);
    readonly type: RegistryType.RegBinary;
    get value(): Buffer;
}

export class REG_NONE_Value extends RegistryItemValue {
    constructor();
    readonly type: RegistryType.RegNone;
    get value(): Buffer;
}

export class REG_LINK_Value extends RegistryItemValue {
    constructor(value: string);
    readonly type: RegistryType.RegLink;
    get value(): string;
}

export class REG_DWORD_BIG_ENDIAN_Value extends RegistryItemValue {
    constructor(value: number);
    readonly type: RegistryType.RegDwordBigEndian;
    get value(): number;
}

export class REG_RESOURCE_LIST_Value extends RegistryItemValue {
    constructor(value: Buffer);
    readonly type: RegistryType.RegResourceList;
    get value(): Buffer;
}

export class REG_FULL_RESOURCE_DESCRIPTOR_Value extends RegistryItemValue {
    constructor(value: Buffer);
    readonly type: RegistryType.RegFullResourceDescriptor;
    get value(): Buffer;
}

export class REG_RESOURCE_REQUIREMENTS_LIST_Value extends RegistryItemValue {
    constructor(value: Buffer);
    readonly type: RegistryType.RegResourceRequirementsList;
    get value(): Buffer;
}

export interface RegistryItem {
    exists: boolean
    keys: Array<string>
    values: Record<string, RegistryItemValue>
}

export interface RegistryPutItem {
    [name: string]: RegistryItemValue;
}

export type RegistryItemPutCollection = {
    [key: string]: RegistryPutItem;
};

export type RegistryItemCollection<T extends readonly string[], U = { [key in T[number]]: RegistryItem }> = U;

export function listSync(keys: Array<string>): RegistryItemCollection<typeof keys>
export function createSync(keys: string | Array<string>): void
export function putSync(putCollection: RegistryItemPutCollection): void
export function deleteKeySync(keys: string | Array<string>): void

export function list(keys: Array<string>): Promise<RegistryItemCollection<typeof keys>>
export function create(keys: string | Array<string>): Promise<void>
export function put(putCollection: RegistryItemPutCollection): Promise<void>
export function deleteKey(keys: string | Array<string>): Promise<void>

export { RegistryType } from "./js-binding.d"