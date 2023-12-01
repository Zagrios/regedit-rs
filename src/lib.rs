use std::io;

use napi::Error;
use napi::bindgen_prelude::Buffer;
use winreg::HKEY;
use winreg::RegValue;
use winreg::enums::*;
use winreg::RegKey;

#[macro_use]
extern crate napi_derive;

#[napi(string_enum)]
pub enum RegistryType {
    RegNone,
    RegSz,
    RegExpandSz,
    RegBinary,
    RegDword,
    RegDwordBigEndian,
    RegLink,
    RegMultiSz,
    RegResourceList,
    RegFullResourceDescriptor,
    RegResourceRequirementsList,
    RegQword,
}

#[napi(object)]
pub struct RegistryItemValue {
    pub name: String,
    pub value: Buffer,
    pub vtype: RegistryType,
}

#[napi(object)]
pub struct RegistryItem {
    pub exists: bool,
    pub path: String,
    pub keys: Vec<String>,
    pub values: Vec<RegistryItemValue>,
}

#[napi(object)]
pub struct RegisteryItemPutValue {
    pub name: String,
    pub value: Buffer,
    pub vtype: RegistryType,
}

#[napi(object)]
pub struct RegisteryItemPut {
    pub path: String,
    pub values: Vec<RegisteryItemPutValue>,
}

// List functions

#[napi]
pub async fn list(path: String) -> Result<RegistryItem, Error> {
    
    let (hkey, path_wihout_hive) = get_hkey_from_path(&path)?;

    let regkey = RegKey::predef(hkey);

    let result = regkey.open_subkey(path_wihout_hive);

    return match result {
        Ok(key) => {
            let keys = key.enum_keys();

            Ok(RegistryItem {
                exists: true,
                path: path,
                keys: keys.map(|k| k.unwrap()).collect::<Vec<String>>(),
                values: extract_regkey_values(key)
            })
        },
        Err(err) => {
            if err.kind() != io::ErrorKind::NotFound {
                return Err(Error::from_reason(err.to_string()));
            }

            Ok(RegistryItem {
                exists: false,
                path: path,
                keys: vec![],
                values: vec![]
            })
        }
    }
}

#[napi]
pub async fn list_all(paths: Vec<String>) -> Vec<RegistryItem> {
    let mut items: Vec<RegistryItem> = vec![];

    for path in paths {
        match list(path).await {
            Ok(item) => items.push(item),
            Err(_) => continue
        }
    }

    return items;
}

// Create functions

#[napi]
pub async fn create(path: String) -> Result<(), Error> {
    let (hkey, path_wihout_hive) = get_hkey_from_path(&path)?;

    let regkey = RegKey::predef(hkey);

    return match regkey.create_subkey(path_wihout_hive) {
        Ok(_) => Ok(()),
        Err(err) => Err(Error::from_reason(err.to_string()))
    };
}

#[napi]
pub async fn create_all(paths: Vec<String>) -> Result<(), Error> {
    for path in paths {
        create(path).await?;
    }

    return Ok(());
}

// Put functions

#[napi]
pub async fn put(registery_put: RegisteryItemPut) -> Result<(), Error> {

    let (hkey, path_wihout_hive) = get_hkey_from_path(&registery_put.path)?;

    let regkey = RegKey::predef(hkey);
    
    let (key, _) = match regkey.create_subkey(path_wihout_hive) {
        Ok(res) => res,
        Err(err) => return Err(Error::from_reason(err.to_string()))
    };

    for registery_put_value in registery_put.values {
        let result = key.set_raw_value(registery_put_value.name, &RegValue { bytes: registery_put_value.value.to_vec(), vtype: registry_type_to_regtype(registery_put_value.vtype)});

        if result.is_err() {
            return Err(Error::from_reason(result.err().unwrap().to_string()));
        }
    }

    return Ok(());

}

#[napi]
pub async fn put_all(registery_puts: Vec<RegisteryItemPut>) -> Result<(), Error> {
    for registery_put in registery_puts {
        put(registery_put).await?;
    }

    return Ok(());
}

// Delete functions

#[napi]
pub async fn delete_key(path: String) -> Result<(), Error> {
    let (hkey, path_wihout_hive) = get_hkey_from_path(&path)?;

    let regkey = RegKey::predef(hkey);

    return match regkey.delete_subkey_all(path_wihout_hive) {
        Ok(_) => Ok(()),
        Err(err) => Err(Error::from_reason(err.to_string()))
    };
}

#[napi]
pub async fn delete_all_keys(paths: Vec<String>) -> Result<(), Error> {

    for path in paths {
        delete_key(path).await?;
    }

    return Ok(());
}

fn get_hkey_from_path(path: &str) -> Result<(HKEY, String), Error> {
    let splited: Vec<&str> = path.split("\\").collect();
    let str_hive = splited.get(0).unwrap();

    let hive: HKEY = match string_to_hkey(str_hive) {
        Ok(hive) => hive,
        Err(err) => return Err(Error::from_reason(err))
    };

    let path_wihout_hive: String = splited[1..].join("\\");

    return Ok((hive, path_wihout_hive));
}

fn string_to_hkey(hive: &str) -> Result<HKEY, String> {
    return match hive {
        "HKEY_LOCAL_MACHINE" | "HKLM" => Ok(HKEY_LOCAL_MACHINE),
        "HKEY_CURRENT_USER" | "HKCU" => Ok(HKEY_CURRENT_USER),
        "HKEY_CLASSES_ROOT" | "HKCR" => Ok(HKEY_CLASSES_ROOT),
        "HKEY_USERS" | "HKU" => Ok(HKEY_USERS),
        "HKEY_CURRENT_CONFIG" | "HKCC" => Ok(HKEY_CURRENT_CONFIG),
        _ => Err(format!("Invalid hive: {}", hive))
    }
}

fn extract_regkey_values(reg_key: RegKey) -> Vec<RegistryItemValue> {
    let mut res_values: Vec<RegistryItemValue> = vec![];
    let values = reg_key.enum_values();

    for value in values {

        if value.is_err() {
            continue;
        }

        let value = value.unwrap();
        let name = value.0;
        let data = value.1;

        let value = RegistryItemValue { 
            name: name,
            value: data.bytes.into(),
            vtype: regtype_to_registry_type(data.vtype)
        };

        res_values.push(value);

    }

    return res_values;

}

fn regtype_to_registry_type(reg_type: RegType) -> RegistryType {
    return match reg_type {
        RegType::REG_NONE => RegistryType::RegNone,
        RegType::REG_SZ => RegistryType::RegSz,
        RegType::REG_EXPAND_SZ => RegistryType::RegExpandSz,
        RegType::REG_BINARY => RegistryType::RegBinary,
        RegType::REG_DWORD => RegistryType::RegDword,
        RegType::REG_DWORD_BIG_ENDIAN => RegistryType::RegDwordBigEndian,
        RegType::REG_LINK => RegistryType::RegLink,
        RegType::REG_MULTI_SZ => RegistryType::RegMultiSz,
        RegType::REG_RESOURCE_LIST => RegistryType::RegResourceList,
        RegType::REG_FULL_RESOURCE_DESCRIPTOR => RegistryType::RegFullResourceDescriptor,
        RegType::REG_RESOURCE_REQUIREMENTS_LIST => RegistryType::RegResourceRequirementsList,
        RegType::REG_QWORD => RegistryType::RegQword,
    }
}

fn registry_type_to_regtype(reg_type: RegistryType) -> RegType {
    return match reg_type {
        RegistryType::RegNone => RegType::REG_NONE,
        RegistryType::RegSz => RegType::REG_SZ,
        RegistryType::RegExpandSz => RegType::REG_EXPAND_SZ,
        RegistryType::RegBinary => RegType::REG_BINARY,
        RegistryType::RegDword => RegType::REG_DWORD,
        RegistryType::RegDwordBigEndian => RegType::REG_DWORD_BIG_ENDIAN,
        RegistryType::RegLink => RegType::REG_LINK,
        RegistryType::RegMultiSz => RegType::REG_MULTI_SZ,
        RegistryType::RegResourceList => RegType::REG_RESOURCE_LIST,
        RegistryType::RegFullResourceDescriptor => RegType::REG_FULL_RESOURCE_DESCRIPTOR,
        RegistryType::RegResourceRequirementsList => RegType::REG_RESOURCE_REQUIREMENTS_LIST,
        RegistryType::RegQword => RegType::REG_QWORD,
    }
}
