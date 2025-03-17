import test from 'ava'
import { list, RegistryType, createKey, putValue, RegSzValue, RegMultiSzValue, RegDwordValue, RegQwordValue, RegDwordBigEndianValue, RegNoneValue, RegLinkValue, RegExpandSzValue, RegBinaryValue, RegResourceListValue, RegFullResourceDescriptorValue, RegResourceRequirementsListValue, deleteKey, RegistryPutItemValues, deleteValue } from '../index'

const IS_WINDOWS = process.platform === 'win32';

//#region test classes

test('test RegistryValue classes', async (t) => {

    if(!IS_WINDOWS) {
        return t.pass();
    }

    t.timeout(5000);

    const regSz = new RegSzValue("hello");
    t.is(regSz.value, "hello");

    const multiSz = new RegMultiSzValue(["hello", "world"]);
    t.deepEqual(multiSz.value, ["hello", "world"]);

    const dword = new RegDwordValue(123);
    t.is(dword.value, 123);

    const qword = new RegQwordValue(BigInt(123));
    t.is(qword.value, BigInt(123));

    const dwordBE = new RegDwordBigEndianValue(123);
    t.is(dwordBE.value, 123);

    const regNone = new RegNoneValue(Buffer.from("hello"));
    t.deepEqual(regNone.value, Buffer.from("hello"));

    const link = new RegLinkValue("hello");
    t.is(link.value, "hello");

    const expandSz = new RegExpandSzValue("%SystemRoot%\\system32");
    t.is(expandSz.value, "%SystemRoot%\\system32");

    const binary = new RegBinaryValue(Buffer.from("hello"));
    t.deepEqual(binary.value, Buffer.from("hello"));

    const ressourceList = new RegResourceListValue(Buffer.from("hello"));
    t.deepEqual(ressourceList.value, Buffer.from("hello"));

    const fullRessourceDescriptor = new RegFullResourceDescriptorValue(Buffer.from("hello"));
    t.deepEqual(fullRessourceDescriptor.value, Buffer.from("hello"));

    const ressourceRequirementsList = new RegResourceRequirementsListValue(Buffer.from("hello"));
    t.deepEqual(ressourceRequirementsList.value, Buffer.from("hello"));
});

//#endregion

//#region test list

test('list can list single key', async t => {
    
    t.timeout(5000);
    
    const path = "HKLM\\software\\microsoft\\windows\\CurrentVersion";

    if(!IS_WINDOWS) {
        return await t.throwsAsync(list(path));
    }

    const res = await list(path);

    const currentVersionKey = res[path];

    t.true(currentVersionKey.exists);
    t.truthy(currentVersionKey.keys);
    t.true(currentVersionKey.keys.map(v => v.toLocaleLowerCase()).includes("policies"));
    t.truthy(currentVersionKey.values);
    t.truthy(currentVersionKey.values["ProgramFilesDir"]);
    t.true(currentVersionKey.values["ProgramFilesDir"].type === RegistryType.RegSz);
    t.truthy(currentVersionKey.values["ProgramFilesDir"].value);
});

test('list can list multiple keys', async t => {
    t.timeout(5000);

    if(!IS_WINDOWS) {
        return await t.throwsAsync(list(["HKLM\\software\\microsoft\\windows\\CurrentVersion", "HKLM\\software\\microsoft\\windows\\CurrentVersion\\policies"]));
    }

    const res = await list(["HKLM\\software\\microsoft\\windows\\CurrentVersion", "HKLM\\software\\microsoft\\windows\\CurrentVersion\\policies"]);

    t.true(res["HKLM\\software\\microsoft\\windows\\CurrentVersion"].exists);
    t.true(res["HKLM\\software\\microsoft\\windows\\CurrentVersion\\policies"].exists);
});

test('list can be applied to several independant keys at once', async t => {
    t.timeout(5000);

    if(!IS_WINDOWS) {
        return await t.throwsAsync(list(["hklm", "hkcu"]));
    }

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

    if(!IS_WINDOWS) {
        return await t.throwsAsync(list(["HKCU\\Keyboard Layout"]));
    }

    const res = await list(["HKCU\\Keyboard Layout"]);

    t.truthy(res["HKCU\\Keyboard Layout"]);
    t.true(res["HKCU\\Keyboard Layout"].exists);
    t.truthy(res["HKCU\\Keyboard Layout"].keys.map(k => k.toLocaleLowerCase()).includes("preload"));
    t.truthy(res["HKCU\\Keyboard Layout"].keys.map(k => k.toLocaleLowerCase()).includes("substitutes"));
    t.truthy(res["HKCU\\Keyboard Layout"].keys.map(k => k.toLocaleLowerCase()).includes("toggle"));
});

test('list will fail for unknown hives', async t => {
    t.timeout(5000);

    if(!IS_WINDOWS) {
        return await t.throwsAsync(list(["blah\\software"]));
    }

    const res = await list(["blah\\software"]).catch(() => false);

    t.false(res);
});

test('list lists default values', async t => {
    t.timeout(5000);

    if(!IS_WINDOWS) {
        return await t.throwsAsync(list(["HKCR\\Directory\\shell\\cmd\\command"]));
    }

    const res = await list(["HKCR\\Directory\\shell\\cmd\\command"]);

    t.truthy(res["HKCR\\Directory\\shell\\cmd\\command"]);
    t.true(res["HKCR\\Directory\\shell\\cmd\\command"].exists);
    t.truthy(res["HKCR\\Directory\\shell\\cmd\\command"].values);
    t.truthy(res["HKCR\\Directory\\shell\\cmd\\command"].values[""]);
});

test('list says if a key does not exist', async t => {
    t.timeout(5000);

    if(!IS_WINDOWS) {
        return await t.throwsAsync(list(["HKCU\\not_exist"]));
    }

    const res = await list(["HKCU\\not_exist"]);

    t.false(res["HKCU\\not_exist"].exists);
});

//#endregion

//#region test create keys

const now = new Date().toString();
const regeditRsKey = 'HKCU\\software\\Zagrios\\regedit-rs';
const key = `${regeditRsKey}\\test`;

test('createKey throw an error if it dont has permission', async t => {
    t.timeout(5000);

    if(!IS_WINDOWS) {
        return await t.throwsAsync(createKey("HKLM\\SECURITY\\unauthorized"));
    }

    await t.throwsAsync(createKey("HKLM\\SECURITY\\unauthorized"));
});

test(`createKey create ${key}\\${now} key`, async t => {
    t.timeout(5000);

    if(!IS_WINDOWS) {
        return await t.throwsAsync(createKey(`${key}\\${now}`));
    }

    await createKey(`${key}\\${now}`);
    const res = await list([key]);
    t.true(res[key].keys.includes(now));
});

test(`createKey create ${key}\\${now}-测试 key`, async t => {
    t.timeout(5000);

    if(!IS_WINDOWS) {
        return await t.throwsAsync(createKey(`${key}\\${now}-测试`));
    }

    await createKey(`${key}\\${now}-测试`);
    const res = await list([key]);
    t.true(res[key].keys.includes(`${now}-测试`));
});

test(`createKey create multiple keys`, async t => {
    t.timeout(5000);

    if(!IS_WINDOWS) {
        return await t.throwsAsync(createKey([`${key}\\${now}-1`, `${key}\\${now}-2`]));
    }

    await createKey([`${key}\\${now}-1`, `${key}\\${now}-2`]);
    const res = await list([key]);
    t.true(res[key].keys.includes(`${now}-1`));
    t.true(res[key].keys.includes(`${now}-2`));
});

//#endregion

//#region test delete keys

test('deleteKey throw an error if it dont has permission', async t => {
    t.timeout(5000);

    if(!IS_WINDOWS) {
        return await t.throwsAsync(deleteKey("HKLM\\SECURITY"));
    }

    await t.throwsAsync(deleteKey("HKLM\\SECURITY"));
})

test(`deleteKey delete ${key}\\${now} key`, async t => {
    t.timeout(5000);

    if(!IS_WINDOWS) {
        return await t.throwsAsync(deleteKey(`${key}\\${now}`));
    }

    await createKey(`${key}\\${now}`);
    await createKey(`${key}\\${now}-测试`);
    await deleteKey(`${key}\\${now}`);
    
    const res = await list([key]);
    const resSub = await list([`${key}\\${now}`]);

    t.false(res[key].keys.includes(now));
    t.false(resSub[`${key}\\${now}`].exists);
    t.true(res[key].keys.includes(`${now}-测试`));
});

//#endregion

//#region test put values

const regValues: RegistryPutItemValues = {
    '': new RegSzValue("default value"), // default value
    'RegSzValue1': new RegSzValue("string"),
    'RegBinaryValue': new RegBinaryValue(Buffer.from([1, 2, 3])),
    'RegDwordValue': new RegDwordValue(10),
    'RegQwordValue': new RegQwordValue(BigInt(100)),
    'RegExpandSzValue': new RegExpandSzValue("%SystemRoot%\\system32"),
    'RegMultiSzValue': new RegMultiSzValue(["a", "b", "c"]),
    'RegSzValue2': new RegSzValue("值 test for non-English environment"),
}

test('putValue can create values', async t => {
    t.timeout(5000);

    const vKey = `${key}\\${now}-values`;

    if(!IS_WINDOWS) {
        return await t.throwsAsync(createKey(vKey));
    }

    await t.notThrowsAsync(createKey(vKey));
    await t.notThrowsAsync(putValue({[vKey]: regValues}));

    const res = await list([vKey]);

    t.is(res[vKey].values[''].type, RegistryType.RegSz);
    t.is(res[vKey].values[''].value, "default value");
    
    t.is(res[vKey].values['RegSzValue1'].type, RegistryType.RegSz);
    t.is(res[vKey].values['RegSzValue1'].value, "string");

    t.is(res[vKey].values['RegBinaryValue'].type, RegistryType.RegBinary);
    t.deepEqual(res[vKey].values['RegBinaryValue'].value, Buffer.from([1, 2, 3]));

    t.is(res[vKey].values['RegDwordValue'].type, RegistryType.RegDword);
    t.is(res[vKey].values['RegDwordValue'].value, 10);

    t.is(res[vKey].values['RegQwordValue'].type, RegistryType.RegQword);
    t.is(res[vKey].values['RegQwordValue'].value, BigInt(100));

    t.is(res[vKey].values['RegExpandSzValue'].type, RegistryType.RegExpandSz);
    t.is(res[vKey].values['RegExpandSzValue'].value, "%SystemRoot%\\system32");

    t.is(res[vKey].values['RegMultiSzValue'].type, RegistryType.RegMultiSz);
    t.deepEqual(res[vKey].values['RegMultiSzValue'].value, ["a", "b", "c"]);

    t.is(res[vKey].values['RegSzValue2'].type, RegistryType.RegSz);
    t.is(res[vKey].values['RegSzValue2'].value, "值 test for non-English environment");
});

test('putValue can update values', async t => {
    t.timeout(5000);

    const vKey = `${key}\\${now}-values-update`;

    if(!IS_WINDOWS) {
        return await t.throwsAsync(createKey(vKey));
    }

    await t.notThrowsAsync(createKey(vKey));
    await t.notThrowsAsync(putValue({[vKey]: regValues}));

    const res = await list([vKey]);

    t.is(res[vKey].values['RegSzValue1'].type, RegistryType.RegSz);
    t.is(res[vKey].values['RegSzValue1'].value, "string");

    await t.notThrowsAsync(putValue({[vKey]: { 'RegSzValue1': new RegSzValue("new string") }}));

    const res2 = await list([vKey]);

    t.is(res2[vKey].values['RegSzValue1'].type, RegistryType.RegSz);
    t.is(res2[vKey].values['RegSzValue1'].value, "new string");
});

test('putValue can change value type', async t => {
    t.timeout(5000);

    const vKey = `${key}\\${now}-values-type-change`;

    if(!IS_WINDOWS) {
        return await t.throwsAsync(createKey(vKey));
    }

    await t.notThrowsAsync(createKey(vKey));
    await t.notThrowsAsync(putValue({[vKey]: regValues}));

    const res = await list([vKey]);

    t.is(res[vKey].values['RegSzValue1'].type, RegistryType.RegSz);
    t.is(res[vKey].values['RegSzValue1'].value, "string");

    await t.notThrowsAsync(putValue({[vKey]: { 'RegSzValue1': new RegDwordValue(10) }}));

    const res2 = await list([vKey]);

    t.is(res2[vKey].values['RegSzValue1'].type, RegistryType.RegDword);
    t.is(res2[vKey].values['RegSzValue1'].value, 10);
});

//#endregion

//#region test delete values

test('deleteValue can delete values', async t => {
    t.timeout(5000);

    const vKey = `${key}\\${now}-values-delete`;

    if(!IS_WINDOWS) {
        return await t.throwsAsync(createKey(vKey));
    }

    await t.notThrowsAsync(createKey(vKey));
    await t.notThrowsAsync(putValue({[vKey]: regValues}));

    const res = await list([vKey]);

    t.is(res[vKey].values['RegSzValue1'].type, RegistryType.RegSz);
    t.is(res[vKey].values['RegSzValue1'].value, "string");

    await t.notThrowsAsync(deleteValue({[vKey]: ["RegSzValue1"]}));

    const res2 = await list([vKey]);

    t.falsy(res2[vKey].values['RegSzValue1']);
});

test('deleteValue can delete multiple values', async t => {
    t.timeout(5000);

    const vKey = `${key}\\${now}-values-delete-multiple`;

    if(!IS_WINDOWS) {
        return await t.throwsAsync(createKey(vKey));
    }

    await t.notThrowsAsync(createKey(vKey));
    await t.notThrowsAsync(putValue({[vKey]: regValues}));

    const res = await list([vKey]);

    t.is(res[vKey].values['RegSzValue1'].type, RegistryType.RegSz);
    t.is(res[vKey].values['RegSzValue1'].value, "string");

    await t.notThrowsAsync(deleteValue({[vKey]: ["RegSzValue1", "RegBinaryValue"]}));

    const res2 = await list([vKey]);

    t.falsy(res2[vKey].values['RegSzValue1']);
    t.falsy(res2[vKey].values['RegBinaryValue']);
});

test('deleteValue can delete default value', async t => {
    t.timeout(5000);
    
    const vKey = `${key}\\${now}-values-delete-default`;

    if(!IS_WINDOWS) {
        return await t.throwsAsync(createKey(vKey));
    }

    await t.notThrowsAsync(createKey(vKey));
    await t.notThrowsAsync(putValue({[vKey]: regValues}));

    const res = await list([vKey]);

    t.is(res[vKey].values[''].type, RegistryType.RegSz);
    t.is(res[vKey].values[''].value, "default value");

    await t.notThrowsAsync(deleteValue({[vKey]: [""]}));

    const res2 = await list([vKey]);

    t.falsy(res2[vKey].values['']);
});

//#endregion





