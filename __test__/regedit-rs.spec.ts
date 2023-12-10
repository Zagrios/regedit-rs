import test from 'ava'
import { list, RegistryType, create, put, REG_SZ_Value } from '../index.js'

// test list

test('simple list', async t => {
    t.timeout(5000);
    
    const path = "HKLM\\software\\microsoft\\windows\\CurrentVersion"

    const res = (await list([path]))[path];

    t.true(res.exists);
    t.truthy(res.keys);
    t.true(res.keys.map(v => v.toLocaleLowerCase()).includes("policies"));
    t.truthy(res.values);
    t.truthy(res.values["ProgramFilesDir"]);
    t.true(res.values["ProgramFilesDir"].type === RegistryType.RegSz);
    t.true((res.values["ProgramFilesDir"] as REG_SZ_Value).value === "C:\\Program Files");
});

test('list can be applied to several independant keys at once', async t => {
    t.timeout(5000);

    const res = await list(["hklm", "hkcu"]);

    t.truthy(res["hklm"]);
    t.true(res["hklm"].exists);
    t.truthy(res["hklm"].keys.map(k => k.toLocaleLowerCase()).includes("software"));

    t.truthy(res["hkcu"]);
    t.true(res["hkcu"].exists);
    t.truthy(res["hkcu"].keys.map(k => k.toLocaleLowerCase()).includes("software"));
});

test('list can handle spaces in registry keys', async t => {
    t.timeout(5000);

    const res = await list(["HKCU\\Keyboard Layout"]);

    t.truthy(res["HKCU\\Keyboard Layout"]);
    t.true(res["HKCU\\Keyboard Layout"].exists);
    t.truthy(res["HKCU\\Keyboard Layout"].keys.map(k => k.toLocaleLowerCase()).includes("preload"));
    t.truthy(res["HKCU\\Keyboard Layout"].keys.map(k => k.toLocaleLowerCase()).includes("substitutes"));
    t.truthy(res["HKCU\\Keyboard Layout"].keys.map(k => k.toLocaleLowerCase()).includes("toggle"));
});

test('list will fail for unknown hives', async t => {
    t.timeout(5000);

    const res = await list(["blah\\software"]).catch(() => false);

    t.false(res);
});

test('list lists default values', async t => {
    t.timeout(5000);

    const res = await list(["HKCR\\Directory\\shell\\cmd\\command"]);

    console.log(res["HKCR\\Directory\\shell\\cmd\\command"].values[""].value);

    t.truthy(res["HKCR\\Directory\\shell\\cmd\\command"]);
    t.true(res["HKCR\\Directory\\shell\\cmd\\command"].exists);
    t.truthy(res["HKCR\\Directory\\shell\\cmd\\command"].values);
    t.truthy(res["HKCR\\Directory\\shell\\cmd\\command"].values[""]);
});
