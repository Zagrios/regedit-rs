import test from 'ava'
import { list, listAll, RegistryType, create, createAll, put, putAll } from '../index.js'

// test list

test('test list', async t => {
    t.timeout(5000);
    
    const path = "HKLM\\software\\microsoft\\windows\\CurrentVersion"

    const res = await list(path);

    t.true(res.exists);
    t.truthy(res.keys);

    t.true(res.keys.map(v => v.toLocaleLowerCase()).includes("policies"));

    t.truthy(res.values);

    t.true(res.values.map(v => v.name.toLocaleLowerCase()).includes("programfilesdir"));

    t.true(res.values.find(v => v.name.toLocaleLowerCase() === "programfilesdir")?.vtype === RegistryType.RegSz);

    t.true(res.values.find(v => v.name.toLocaleLowerCase() === "programfilesdir")?.value.toString().replace(/\0/g, '') === "C:\\Program Files");
});

test('test list all', async t => {
    t.timeout(5000);
    const paths = [
        "HKLM\\software\\microsoft\\windows\\CurrentVersion",
        "HKLM\\software\\microsoft\\windows\\CurrentVersion\\policies"
    ];

    const res = await listAll(paths);

    const currentVersion = res.find(v => v.path === paths[0]);
    const policies = res.find(v => v.path === paths[1]);

    t.true(currentVersion?.exists);
    t.truthy(currentVersion?.keys);
    t.true(currentVersion?.keys.map(v => v.toLocaleLowerCase())?.includes("policies"));
    t.true(currentVersion?.values.map(v => v.name.toLocaleLowerCase())?.includes("programfilesdir"));
    t.true(currentVersion?.values.find(v => v.name.toLocaleLowerCase() === "programfilesdir")?.value.toString().replace(/\0/g, '') === "C:\\Program Files");

    t.true(policies?.exists);
    t.truthy(policies?.keys);
    t.true(policies?.keys.map(v => v.toLocaleLowerCase()).includes("system"));

});

test('test list with invalid path', async t => {
    t.timeout(5000);
    
    const path = "HKLM\\invalid\\path\\CurrentVersion";

    const res = await list(path);

    t.false(res.exists);
});

test('test list all with an invalid path', async t => {
    t.timeout(5000);
    const paths = [
        "HKLM\\software\\microsoft\\windows\\CurrentVersion",
        "HKLM\\invalid\\path\\CurrentVersion"
    ];

    const res = await listAll(paths);

    const currentVersion = res.find(v => v.path === paths[0]);
    const invalidPath = res.find(v => v.path === paths[1]);

    t.true(currentVersion?.exists);
    t.truthy(currentVersion?.keys);
    t.true(currentVersion?.keys.map(v => v.toLocaleLowerCase()).includes("policies"));
    t.true(currentVersion?.values.map(v => v.name.toLocaleLowerCase()).includes("programfilesdir"));
    t.true(currentVersion?.values.find(v => v.name.toLocaleLowerCase() === "programfilesdir")?.value.toString("ucs-2").indexOf("C:\\Program Files") === 0);

    t.false(invalidPath?.exists);
});

test('test list with an invalid hive', async t => {
    t.timeout(5000);
    
    const path = "INVALID\\software\\microsoft\\windows\\CurrentVersion";

    const res = await list(path).catch(() => undefined);

    t.falsy(res);
});

test('test list all with an invalid hive', async t => {
    t.timeout(5000);
    const paths = [
        "HKLM\\software\\microsoft\\windows\\CurrentVersion",
        "INVALID\\software\\microsoft\\windows\\CurrentVersion"
    ];

    const res = await listAll(paths);

    const currentVersion = res.find(v => v.path === paths[0]);
    const invalidHive = res.find(v => v.path === paths[1]);

    t.true(currentVersion?.exists);
    t.falsy(invalidHive);
});

test('test list with space in path', async t => {
    t.timeout(5000);
    
    const path = "HKCU\\Keyboard Layout";

    const res = await list(path);

    t.true(res.exists);
    t.truthy(res.keys);
    t.true(res.keys.map(v => v.toLocaleLowerCase()).includes("preload"));
    t.true(res.keys.map(v => v.toLocaleLowerCase()).includes("substitutes"));

});

test('test list default values', async t => {
    t.timeout(5000);

    const path = "HKCR\\Directory\\shell\\cmd\\command";

    const res = await list(path);

    t.true(res.exists);
    t.truthy(res.values);
    t.true(res.values[0].name === "");
});

// test create

test('test create', async t => {
    t.timeout(5000);

    const now = Date.now().toString();
    const path = "HKCU\\Software\\Zagrios\\regedit-rs\\test";
    const fullPath = `${path}\\${now}`;

    const created = await create(fullPath).then(() => true).catch(() => false);

    t.true(created);

    // testing using the module itself is not the best idea...
    const res = await list(fullPath);

    t.true(res.exists);
});

test('test create all', async t => {
    t.timeout(5000);

    const now = Date.now().toString();
    const path = "HKCU\\Software\\Zagrios\\regedit-rs\\test";

    const fullPaths = [
        `${path}\\${now}-a`,
        `${path}\\${now}-b`
    ];

    const created = await createAll(fullPaths).then(() => true).catch(() => false);

    t.true(created);

    // testing using the module itself is not the best idea...
    const res = await listAll(fullPaths);
    res.forEach(v => t.true(v.exists));

});

test('test create with unicode characters', async t => {
    t.timeout(5000);

    const now = Date.now().toString();
    const path = "HKCU\\Software\\Zagrios\\regedit-rs\\test";
    const fullPath = `${path}\\${now}-测试`;

    const created = await create(fullPath).then(() => true).catch(() => false);

    t.true(created);

    // testing using the module itself is not the best idea...
    const res = await list(fullPath);

    t.true(res.exists);
});

// test put

test('test put REG_SZ', async t => {
    t.timeout(5000);

    const now = Date.now().toString();
    const path = "HKCU\\Software\\Zagrios\\regedit-rs\\test";
    const fullPath = `${path}\\${now}`;

    const values = [
        { name: "test-sz", value: Buffer.from("test", "ucs-2"), vtype: RegistryType.RegSz },
        { name: "test", value: Buffer.from([1]), vtype: RegistryType.RegDword }
    ];

    const registeryPut = {
        path: fullPath,
        values: values
    };

    const puted = await put(registeryPut).then(() => true).catch(() => false);
    t.true(puted);

    // testing using the module itself is not the best idea...
    const res = await list(fullPath);
    t.true(res.values.find(v => v.name === "test-sz")?.value.toString("ucs-2") === "test");
});

// test delete
