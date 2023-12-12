/* tslint:disable */
/* eslint-disable */

/* auto-generated by NAPI-RS */

export const enum RegistryType {
  RegNone = 'RegNone',
  RegSz = 'RegSz',
  RegExpandSz = 'RegExpandSz',
  RegBinary = 'RegBinary',
  RegDword = 'RegDword',
  RegDwordBigEndian = 'RegDwordBigEndian',
  RegLink = 'RegLink',
  RegMultiSz = 'RegMultiSz',
  RegResourceList = 'RegResourceList',
  RegFullResourceDescriptor = 'RegFullResourceDescriptor',
  RegResourceRequirementsList = 'RegResourceRequirementsList',
  RegQword = 'RegQword'
}
export interface RegistryItemValue {
  rawValue: Buffer
  vtype: RegistryType
}
export interface RegistryItem {
  exists: boolean
  keys: Array<string>
  values: Record<string, RegistryItemValue>
}
export function list(keys: string | Array<string>): Record<string, RegistryItem>
export function createKey(keys: string | Array<string>): void
export function putValue(putCollection: Record<string, Record<string, RegistryItemValue>>): void
export function deleteKey(keys: string | Array<string>): void
export function deleteValue(deleteCollection: Record<string, Array<string>>): void
