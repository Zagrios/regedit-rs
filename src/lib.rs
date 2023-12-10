use std::collections::HashMap;

use napi::Either;
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
    pub raw_value: Buffer,
    pub vtype: RegistryType,
}

#[napi(object)]
pub struct RegistryItem {
    pub exists: bool,
    pub keys: Vec<String>,
    pub values: HashMap<String, RegistryItemValue>,
}

// List functions
fn native_list(key: &str) -> Result<RegistryItem, Error> {

    let (hkey, path_wihout_hive) = get_hkey_from_path(&key)?;
    let regkey = RegKey::predef(hkey);
    let result = regkey.open_subkey(path_wihout_hive);

    return match result {
        Ok(key) => {
            let keys = key.enum_keys();

            Ok(RegistryItem {
                exists: true,
                keys: keys.filter_map(|k| k.ok()).collect::<Vec<String>>(),
                values: extract_regkey_values(key)
            })
        },
        _ => Ok(RegistryItem { exists: false, keys: vec![], values: HashMap::new() })
    }
}

#[napi]
pub fn list(keys: Vec<String>) -> Result<HashMap<String, RegistryItem>, Error> {
    let mut result: HashMap<String, RegistryItem> = HashMap::new();

    for path in keys {
        let res = native_list(&path)?;
        result.insert(path, res);
    }

    return Ok(result);
}

// Create functions
fn native_create(key: String) -> Result<(), Error> {
    let (hkey, path_wihout_hive) = get_hkey_from_path(&key)?;
    let regkey = RegKey::predef(hkey);

    return match regkey.create_subkey(path_wihout_hive) {
        Ok(_) => Ok(()),
        Err(err) => Err(Error::from_reason(err.to_string()))
    };
}

#[napi]
pub fn create(keys: Either<String, Vec<String>>) -> Result<(), Error> {

    let paths: Vec<String> = match keys {
        Either::A(path) => vec![path],
        Either::B(paths) => paths
    };

    for path in paths {
        native_create(path)?;
    }

    return Ok(());
}

// Put functions
fn native_put(key: &str, items: HashMap<String, RegistryItemValue>) -> Result<(), Error> {

    let (hkey, path_wihout_hive) = get_hkey_from_path(key)?;
    let regkey = RegKey::predef(hkey);
    
    let (key, _) = match regkey.create_subkey(path_wihout_hive) {
        Ok(res) => res,
        Err(err) => return Err(Error::from_reason(err.to_string()))
    };

    for (name, item) in items {
        let result = key.set_raw_value(name, &RegValue { bytes: item.raw_value.to_vec(), vtype: registry_type_to_regtype(item.vtype)});

        if result.is_err() {
            return Err(Error::from_reason(result.err().unwrap().to_string()));
        }
    }

    return Ok(());

}

#[napi]
pub fn put(put_collection: HashMap<String, HashMap<String, RegistryItemValue>>) -> Result<(), Error> {

    for (key, items) in put_collection {
        native_put(&key, items)?;
    }

    return Ok(());
}

// Delete functions
fn native_delete_key(key: String) -> Result<(), Error> {

    let (hkey, path_wihout_hive) = get_hkey_from_path(&key)?;
    let regkey = RegKey::predef(hkey);

    return match regkey.delete_subkey_all(path_wihout_hive) {
        Ok(_) => Ok(()),
        Err(err) => Err(Error::from_reason(err.to_string()))
    };
}

#[napi]
pub fn delete_key(keys: Either<String, Vec<String>>) -> Result<(), Error> {

    let paths: Vec<String> = match keys {
        Either::A(path) => vec![path],
        Either::B(paths) => paths
    };

    for path in paths {
        native_delete_key(path)?;
    }

    return Ok(());
}

fn get_hkey_from_path(path: &str) -> Result<(HKEY, String), Error> {
    let splited: Vec<&str> = path.split("\\").collect();
    
    let str_hive = match splited.get(0) {
        Some(str_hive) => str_hive,
        None => return Err(Error::from_reason(format!("Unable to get hive from path: {}", path)))
    };

    let hive: HKEY = match string_to_hkey(str_hive) {
        Ok(hive) => hive,
        Err(err) => return Err(Error::from_reason(err))
    };

    let path_wihout_hive: String = splited[1..].join("\\");

    return Ok((hive, path_wihout_hive));
}

fn string_to_hkey(hive: &str) -> Result<HKEY, String> {

    return match hive.to_uppercase().as_str() {
        "HKEY_LOCAL_MACHINE" | "HKLM" => Ok(HKEY_LOCAL_MACHINE),
        "HKEY_CURRENT_USER" | "HKCU" => Ok(HKEY_CURRENT_USER),
        "HKEY_CLASSES_ROOT" | "HKCR" => Ok(HKEY_CLASSES_ROOT),
        "HKEY_USERS" | "HKU" => Ok(HKEY_USERS),
        "HKEY_CURRENT_CONFIG" | "HKCC" => Ok(HKEY_CURRENT_CONFIG),
        _ => Err(format!("Invalid hive: {}", hive))
    }
}

fn extract_regkey_values(reg_key: RegKey) -> HashMap<String, RegistryItemValue> {
    let mut res_values: HashMap<String, RegistryItemValue> = HashMap::new();
    let values = reg_key.enum_values();

    for value_result in values {
        match value_result {
            Ok(value) => {
                let (name, data) = value;

                let value = RegistryItemValue { 
                    raw_value: data.bytes.into(),
                    vtype: regtype_to_registry_type(data.vtype)
                };

                res_values.insert(name, value);
            },
            Err(_) => continue
        };
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
