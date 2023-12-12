# regedit-rs

<a href="https://github.com/Zagrios/regedit-rs/actions"><img alt="GitHub CI Status" src="https://github.com/Zagrios/regedit-rs/workflows/CI/badge.svg"></a>
<a href="https://www.npmjs.com/package/regedit-rs"><img src="https://img.shields.io/npm/v/regedit-rs.svg?sanitize=true" alt="regedit-rs npm version"></a>
[![Rust 1.70+](https://img.shields.io/badge/rust-1.70+-orange.svg)](https://www.rust-lang.org)

A high-performance Windows registry toolkit inspired by [node-regedit](https://github.com/ironSource/node-regedit), powered by Rust with [napi-rs](https://github.com/napi-rs/napi-rs) It enables easy manipulation of the Windows registry with optimized performance.

## Install

```
npm install regedit-rs
```

## Example
```typescript
import { list, createKey, putValue, deleteKey, deleteValue, RegSzValue, RegDwordValue, RegExpandSzValue } from "regedit-rs";

async function main(){
    const keys = ["HKCU\\Software\\regedit-rs", "HKCU\\Software\\regedit-rs\\test"];
    const result = await list(keys);

    if(!result[keys[0]].exists){
        return;
    }

    const nameValue = result[keys[1]].values["name"].value;
    const newPath = new RegExpandSzValue(`%APPDATA%\\${nameValue}`);

    if(newPath.expandedValue !== "C:\\Users\\username\\AppData\\Roaming\\test name"){
        return;
    }

    await createKey("HKCU\\Software\\regedit-rs\\test");
    await putValue({
        "HKCU\\Software\\regedit-rs\\test": {
            "name": new RegSzValue("test name"),
            "number": new RegDwordValue(123),
            "path": newPath
        }
    });

    await deleteKey("HKCU\\Software\\regedit-rs\\old_test");

    await deleteValue({
        "HKCU\\Software\\regedit-rs\\test": ["name", "number", "path"]
    });
}

main();
```

# API
Every function are binded to Rust and support batching to improve performance.

## Reading keys and values
List registry key(s) and value(s)
```typescript
const res = await list(["HKCU\\SOFTWARE", "HKLM\\SOFTWARE", "HKCU\\DONT_EXIST"]);
```
Result will be an object with the following structure:
```javascript
{
    "HKCU\\SOFTWARE": {
        "exists": true,
        keys: ["HKCU\\SOFTWARE\\Microsoft", "HKCU\\SOFTWARE\\regedit-rs", ...],
        values: {
            szValue: [RegSzValue] // RegSzValue is a class with a value property
            dwordValue: [RegDwordValue] // RegDwordValue is a class with a value property
            expandSzValue: [RegExpandSzValue] // RegExpandSzValue is a class with a value and expandedValue property
        }
    },
    "HKLM\\SOFTWARE": {
        "exists": true,
        keys: ["HKLM\\SOFTWARE\\Microsoft", "HKLM\\SOFTWARE\\regedit-rs", ...],
        values: {
            szValue: [RegSzValue]
            dwordValue: [RegDwordValue]
            qwordValue: [RegQwordValue]
            expandSzValue: [RegExpandSzValue]
        }
    },
    "HKCU\\DONT_EXIST": {
        "exists": false,
        keys: [],
        values: {}
    }
}
```

## Creating keys
Create registry key(s) if not exists
```typescript
await createKey("HKCU\\SOFTWARE\\regedit-rs\\test");
await createKey(["HKCU\\SOFTWARE\\regedit-rs\\test", "HKCU\\SOFTWARE\\regedit-rs\\test2"]);
```

## Putting values
Put or update registry value(s)
```typescript
await putValue({
    "HKCU\\SOFTWARE\\regedit-rs\\test": {
        "name": new RegSzValue("test name"),
        "number": new RegDwordValue(123),
        "path": new RegExpandSzValue("%APPDATA%\\test name")
    }
});
```

## Deleting keys
Delete registry key(s) and all subkeys
```typescript
await deleteKey("HKCU\\SOFTWARE\\regedit-rs\\test");
await deleteKey(["HKCU\\SOFTWARE\\regedit-rs\\test", "HKCU\\SOFTWARE\\regedit-rs\\test2"]);
```

## Deleting values
Delete registry value(s)
```typescript
await deleteValue({
    "HKCU\\SOFTWARE\\regedit-rs\\test": ["name", "number", "path"]
});
```

## More
See all types, functions, and classes at [index.d.ts](./index.d.ts)

# Sample Benchmark

```shell
npm run bench
```

```shell
Running "List keys and values of a registry key" suite...
Progress: 100%

  regedit-rs:
    3 162 ops/s, ±1.01%   | fastest

  regedit:
    18 ops/s, ±0.37%      | slowest, 99.43% slower

  winreg:
    33 ops/s, ±0.60%      | 98.96% slower

Finished 3 cases!
  Fastest: regedit-rs
  Slowest: regedit
Running "Create a registry key" suite...
Progress: 100%

  regedit-rs:
    116 548 ops/s, ±0.74%   | fastest

  regedit:
    22 ops/s, ±0.64%        | slowest, 99.98% slower

  winreg:
    43 ops/s, ±1.00%        | 99.96% slower

Finished 3 cases!
  Fastest: regedit-rs
  Slowest: regedit
Running "Put a registry value" suite...
Progress: 100%

  regedit-rs:
    59 015 ops/s, ±0.77%   | fastest

  regedit:
    22 ops/s, ±0.92%       | slowest, 99.96% slower

  winreg:
    43 ops/s, ±0.85%       | 99.93% slower

Finished 3 cases!
  Fastest: regedit-rs
  Slowest: regedit
```

# Test or Contributing

- Clone this repo
- Install latest stable Rust
- Install Node.js 10+
- Install dependencies with `npm install`
- Build bindings with `npm run build`
- Run `npm test`

## Release package

We use GitHub actions to automatically publish npm packages.

```bash
# 1.0.0 => 1.0.1
npm version patch

# or 1.0.0 => 1.1.0
npm version minor
```

