import test from 'ava'
import { list, RegistryType, create, put, RegSzValue, RegMultiSzValue, RegDwordValue, RegQwordValue, RegDwordBigEndianValue, RegNoneValue, RegLinkValue, RegExpandSzValue, RegBinaryValue, RegResourceListValue, RegFullResourceDescriptorValue, RegResourceRequirementsListValue } from '../index'

// test classes 

test('RegistryItemValue fromValue', async (t) => {
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
    t.is(expandSz.expandedValue, "C:\\Windows\\system32");

    const binary = new RegBinaryValue(Buffer.from("hello"));
    t.deepEqual(binary.value, Buffer.from("hello"));

    const ressourceList = new RegResourceListValue(Buffer.from("hello"));
    t.deepEqual(ressourceList.value, Buffer.from("hello"));

    const fullRessourceDescriptor = new RegFullResourceDescriptorValue(Buffer.from("hello"));
    t.deepEqual(fullRessourceDescriptor.value, Buffer.from("hello"));

    const ressourceRequirementsList = new RegResourceRequirementsListValue(Buffer.from("hello"));
    t.deepEqual(ressourceRequirementsList.value, Buffer.from("hello"));
});

// test list

test('simple list', async t => {
    t.timeout(5000);
    
    const path = "HKLM\\software\\microsoft\\windows\\CurrentVersion";

    const res = (await list([path]));

    const currentVersionKey = res[path];

    t.true(currentVersionKey.exists);
    t.truthy(currentVersionKey.keys);
    t.true(currentVersionKey.keys.map(v => v.toLocaleLowerCase()).includes("policies"));
    t.truthy(currentVersionKey.values);
    t.truthy(currentVersionKey.values["ProgramFilesDir"]);
    t.true(currentVersionKey.values["ProgramFilesDir"].type === RegistryType.RegSz);
    t.true(currentVersionKey.values["ProgramFilesDir"].value === "C:\\Program Files");
    t.true(currentVersionKey.values["ProgramFilesPath"].value === "%ProgramFiles%");
    t.true((currentVersionKey.values["ProgramFilesPath"] as RegExpandSzValue).expandedValue === "C:\\Program Files");
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

    t.truthy(res["HKCR\\Directory\\shell\\cmd\\command"]);
    t.true(res["HKCR\\Directory\\shell\\cmd\\command"].exists);
    t.truthy(res["HKCR\\Directory\\shell\\cmd\\command"].values);
    t.truthy(res["HKCR\\Directory\\shell\\cmd\\command"].values[""]);
});

test('list says if a key does not exist', async t => {
    t.timeout(5000);

    const res = await list(["HKCU\\not_exist"]);

    t.false(res["HKCU\\not_exist"].exists);
});
