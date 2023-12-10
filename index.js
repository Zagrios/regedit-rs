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
    constructor(rawValue, type) {
        this.rawValue = rawValue;
        this.type = type;
    }

    get value() {
        switch (this.type) {
            case RegistryType.RegSz || RegistryType.RegExpandSz || RegistryType.RegLink:
                return szBufferToString(this.rawValue);
            case RegistryType.RegMultiSz:
                return szBufferToString(this.rawValue).split('\0');
            case RegistryType.RegDword:
                return this.rawValue.readInt32LE(0);
            case RegistryType.RegQword:
                return this.rawValue.readInt64LE(0);
            case RegistryType.RegBinary || RegistryType.RegNone || RegistryType.RegResourceList || RegistryType.RegFullResourceDescriptor || RegistryType.RegResourceRequirementsList:
                return this.rawValue;
            case RegistryType.RegDwordBigEndian:
                return this.rawValue.readInt32BE(0);
            default:
                return this.rawValue;
        }
    }
}

module.exports.RegistryItemValue = RegistryItemValue;

module.exports.REG_SZ_Value = class REG_SZ_Value extends RegistryItemValue {
    constructor(value) { 
        const rawValue = Buffer.from(value, 'ucs-2');
        super(rawValue, RegistryType.REG_SZ);
    }
}

module.exports.REG_EXPAND_SZ_Value = class REG_EXPAND_SZ_Value extends RegistryItemValue {
    constructor(value) { 
        const rawValue = Buffer.from(value, 'ucs-2');
        super(rawValue, RegistryType.REG_EXPAND_SZ);
    }
}

module.exports.REG_DWORD_Value = class REG_DWORD_Value extends RegistryItemValue {
    constructor(value) {
        const rawValue = Buffer.alloc(4);
        rawValue.writeInt32LE(value, 0);

        super(rawValue, RegistryType.REG_DWORD);
    }
}

module.exports.REG_QWORD_Value = class REG_QWORD_Value extends RegistryItemValue {
    constructor(value) { 
        const rawValue = Buffer.alloc(8);
        rawValue.writeInt64LE(value, 0);

        super(rawValue, RegistryType.REG_QWORD);
    }
}

module.exports.REG_MULTI_SZ_Value = class REG_MULTI_SZ_Value extends RegistryItemValue {
    constructor(value) { 
        const rawValue = Buffer.from(value.join('\0'), 'ucs-2');
        super(rawValue, RegistryType.REG_MULTI_SZ);
    }
}

module.exports.REG_BINARY_Value = class REG_BINARY_Value extends RegistryItemValue {
    constructor(value) {
        super(value, RegistryType.REG_BINARY);
    }
}

module.exports.REG_NONE_Value = class REG_NONE_Value extends RegistryItemValue {
    constructor() {
        const rawValue = Buffer.alloc(0);
        super(rawValue, RegistryType.REG_NONE);
    }
}

module.exports.REG_LINK_Value = class REG_LINK_Value extends RegistryItemValue {
    constructor(value) { 
        const rawValue = Buffer.from(value, 'ucs-2');
        super(rawValue, RegistryType.REG_LINK);
    }
}

module.exports.REG_RESOURCE_LIST_Value = class REG_RESOURCE_LIST_Value extends RegistryItemValue {
    constructor(value) { 
        super(value, RegistryType.REG_RESOURCE_LIST);
    }
}

module.exports.REG_FULL_RESOURCE_DESCRIPTOR_Value = class REG_FULL_RESOURCE_DESCRIPTOR_Value extends RegistryItemValue {
    constructor(value) {
        super(value, RegistryType.REG_FULL_RESOURCE_DESCRIPTOR);
    }
}

module.exports.REG_RESOURCE_REQUIREMENTS_LIST_Value = class REG_RESOURCE_REQUIREMENTS_LIST_Value extends RegistryItemValue {
    constructor(value) {
        super(value, RegistryType.REG_RESOURCE_REQUIREMENTS_LIST);
    }
}

module.exports.REG_DWORD_BIG_ENDIAN_Value = class REG_DWORD_BIG_ENDIAN_Value extends RegistryItemValue {
    constructor(value) {
        const rawValue = Buffer.alloc(8);
        rawValue.writeInt64LE(value, 0);

        super(rawValue, RegistryType.REG_QWORD_LITTLE_ENDIAN);
    }
}

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
            registryItem.values[value] = new RegistryItemValue(registryValue.rawValue, registryValue.vtype);
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