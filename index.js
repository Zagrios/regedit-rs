const path = require('path');
const { RegistryType, list: _list, create: _create, put: _put, deleteKey: _deleteKey } = require('./js-binding');

module.exports.RegistryType = RegistryType;

//#region Classes

function szBufferToString(buffer) {
    const string = buffer.toString('ucs-2');
    if(string[string.length - 1] !== '\0'){
        return string;
    }

    return string.substring(0, string.length - 1);
}

class RegistryItemValue {

    static valueToBuffer(value) {
        return Buffer.from(value);
    }

    static bufferToValue(buffer) {
        return buffer;
    }

    constructor(buffer, type) {
        this.rawValue = Buffer.isBuffer(buffer) ? buffer : this.constructor.valueToBuffer(buffer);
        this.type = type;
    }

    get value(){
        return this.constructor.bufferToValue(this.rawValue);
    }
}
class RegSzValue extends RegistryItemValue {

    static valueToBuffer(value) {
        return Buffer.from(value, 'ucs-2');
    }

    static bufferToValue(buffer) {
        return szBufferToString(buffer);
    }

    constructor(buffer) { 
        super(buffer, RegistryType.RegSz);
    }
}

class RegExpandSzValue extends RegistryItemValue {

    static valueToBuffer(value) {
        return Buffer.from(value, 'ucs-2');
    }

    static bufferToValue(buffer) {
        return szBufferToString(buffer);
    }

    constructor(buffer) { 
        super(buffer, RegistryType.RegExpandSz);
    }

    get expandedValue() {
        return this.value.replace(/%([^%]+)%/g, (_,n) => process.env[n]);
    }
}

class RegDwordValue extends RegistryItemValue {

    static valueToBuffer(value) {
        const buffer = Buffer.alloc(4);
        buffer.writeInt32LE(value, 0);
        return buffer;
    }

    static bufferToValue(buffer) {
        return buffer.readInt32LE(0);
    }

    constructor(buffer) {
        super(buffer, RegistryType.RegDword);
    }
}

class RegQwordValue extends RegistryItemValue {

    static valueToBuffer(value) {
        const buffer = Buffer.alloc(8);
        buffer.writeBigInt64LE(value, 0);
        return buffer;
    }

    static bufferToValue(buffer) {
        return buffer.readBigInt64LE(0);
    }

    constructor(buffer) { 
        super(buffer, RegistryType.RegQword);
    }
}

class RegMultiSzValue extends RegistryItemValue {

    static valueToBuffer(value) {
        return Buffer.from(value.join('\0'), 'ucs-2');
    }

    static bufferToValue(buffer) {
        return szBufferToString(buffer).split('\0');
    }

    constructor(buffer) {
        super(buffer, RegistryType.RegMultiSz);
    }
}

class RegBinaryValue extends RegistryItemValue {

    static valueToBuffer(value) {
        return Buffer.from(value);
    }

    static bufferToValue(buffer) {
        return buffer;
    }

    constructor(buffer) {
        super(buffer, RegistryType.RegBinary);
    }
}

class RegNoneValue extends RegistryItemValue {

    static valueToBuffer(value) {
        return Buffer.from(value);
    }

    static bufferToValue(buffer) {
        return buffer;
    }

    constructor(buffer) {
        super(buffer, RegistryType.RegNone);
    }
}

class RegLinkValue extends RegistryItemValue {

    static valueToBuffer(value) {
        return Buffer.from(value, 'ucs-2');
    }

    static bufferToValue(buffer) {
        return szBufferToString(buffer);
    }

    constructor(buffer) { 
        super(buffer, RegistryType.RegLink);
    }
}

class RegResourceListValue extends RegistryItemValue {

    static valueToBuffer(value) {
        return Buffer.from(value);
    }

    static bufferToValue(buffer) {
        return buffer;
    }

    constructor(buffer) { 
        super(buffer, RegistryType.RegResourceList);
    }
}

class RegFullResourceDescriptorValue extends RegistryItemValue {

    static valueToBuffer(value) {
        return Buffer.from(value);
    }

    static bufferToValue(buffer) {
        return buffer;
    }

    constructor(buffer) {
        super(buffer, RegistryType.RegFullResourceDescriptor);
    }
}

class RegResourceRequirementsListValue extends RegistryItemValue {

    static valueToBuffer(value) {
        return Buffer.from(value);
    }

    static bufferToValue(buffer) {
        return buffer;
    }

    constructor(buffer) {
        super(buffer, RegistryType.RegResourceRequirementsList);
    }
}
class RegDwordBigEndianValue extends RegistryItemValue {

    static valueToBuffer(value) {
        const buffer = Buffer.alloc(4);
        buffer.writeInt32BE(value, 0);
        return buffer;
    }

    static bufferToValue(buffer) {
        return buffer.readInt32BE(0);
    }

    constructor(buffer) {
        super(buffer, RegistryType.RegDwordBigEndian);
    }
}

class RegistryItemValueMapper {

    static registryTypeToClass = {
        [RegistryType.RegSz]: RegSzValue,
        [RegistryType.RegExpandSz]: RegExpandSzValue,
        [RegistryType.RegDword]: RegDwordValue,
        [RegistryType.RegQword]: RegQwordValue,
        [RegistryType.RegMultiSz]: RegMultiSzValue,
        [RegistryType.RegBinary]: RegBinaryValue,
        [RegistryType.RegNone]: RegNoneValue,
        [RegistryType.RegLink]: RegLinkValue,
        [RegistryType.RegResourceList]: RegResourceListValue,
        [RegistryType.RegFullResourceDescriptor]: RegFullResourceDescriptorValue,
        [RegistryType.RegResourceRequirementsList]: RegResourceRequirementsListValue,
        [RegistryType.RegDwordBigEndian]: RegDwordBigEndianValue
    };

    static from(value, type) {
        const registryValueClass = RegistryItemValueMapper.registryTypeToClass[type];
        if(!registryValueClass){
            throw new Error(`Unknown registry type ${type}`);
        }

        return new registryValueClass(value);
    }
}

module.exports.RegistryItemValue = RegistryItemValue;
module.exports.RegistryItemValueMapper = RegistryItemValueMapper;
module.exports.RegSzValue = RegSzValue;
module.exports.RegExpandSzValue = RegExpandSzValue;
module.exports.RegDwordValue = RegDwordValue;
module.exports.RegQwordValue = RegQwordValue;
module.exports.RegMultiSzValue = RegMultiSzValue;
module.exports.RegBinaryValue = RegBinaryValue;
module.exports.RegNoneValue = RegNoneValue;
module.exports.RegLinkValue = RegLinkValue;
module.exports.RegResourceListValue = RegResourceListValue;
module.exports.RegFullResourceDescriptorValue = RegFullResourceDescriptorValue;
module.exports.RegResourceRequirementsListValue = RegResourceRequirementsListValue;
module.exports.RegDwordBigEndianValue = RegDwordBigEndianValue;

//#endregion

//#region Functions

module.exports.listSync = function(keys){
    const res = _list(keys);

    for(const key in res){
        const registryItem = res[key];
        if(!registryItem.exists){
            continue;
        }

        for(const value in registryItem.values){
            const registryValue = registryItem.values[value];
            registryItem.values[value] = RegistryItemValueMapper.from(registryValue.rawValue, registryValue.vtype);
        }
    }

    return res;
}

module.exports.createSync = function(keys){

}

module.exports.putSync = function(putCollection){

}

module.exports.deleteKeySync = function(keys){

}


module.exports.list = async function(keys){
    return new Promise((resolve, reject) => {
        try {
            const res = module.exports.listSync(keys);
            resolve(res);
        }
        catch (err) {
            reject(err);
        }
    });
}

module.exports.create = async function(keys){
    return new Promise((resolve, reject) => {
        try {
            const res = _create(keys);
            resolve(res);
        }
        catch (err) {
            reject(err);
        }
    });
}

module.exports.put = async function(putCollection){
    return new Promise((resolve, reject) => {
        try {
            const res = _put(putCollection);
            resolve(res);
        }
        catch (err) {
            reject(err);
        }
    });
}

module.exports.deleteKey = async function(keys){
    return new Promise((resolve, reject) => {
        try {
            const res = _deleteKey(keys);
            resolve(res);
        }
        catch (err) {
            reject(err);
        }
    });
}

//#endregion