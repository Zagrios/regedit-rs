import regeditRs, { RegSzValue } from "../index";
import regedit from "regedit";
import winreg from "winreg";
import benny from "benny";

const testListKey = "HKLM\\software\\microsoft\\windows\\CurrentVersion";
const testKey = 'HKCU\\software\\Zagrios\\regedit-rs';

async function run(){
    await benny.suite(
        "List keys and values of a registry key",
        benny.add("regedit-rs", async () => {
            await regeditRs.list(testListKey);
        }),
        benny.add("regedit", async () => {
            await regedit.promisified.list([testListKey]);
        }),
        benny.add("winreg", async () => {
            await new Promise((resolve, reject) => {
                const regKey = new winreg({
                    hive: winreg.HKLM,
                    key: "\\software\\microsoft\\windows\\CurrentVersion"
                });
                Promise.all([
                    new Promise((resolve, reject) => {
                        regKey.keys((err, keys) => {
                            if (err) reject(err);
                            else resolve(keys);
                        });
                    }),
                    new Promise((resolve, reject) => {
                        regKey.values((err, values) => {
                            if (err) reject(err);
                            else resolve(values);
                        });
                    })
                ]).then(resolve, reject);
            });
        }),
        benny.cycle(),
        benny.complete()
    );

    await benny.suite(
        "Create a registry key",
        benny.add("regedit-rs", async () => {
            await regeditRs.createKey(testKey);
        }),
        benny.add("regedit", async () => {
            await regedit.promisified.createKey([testKey]);
        }),
        benny.add("winreg", async () => {
            await new Promise<void>((resolve, reject) => {
                const regKey = new winreg({
                    hive: winreg.HKCU,
                    key: "\\software\\Zagrios"
                });
                regKey.create((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }),
        benny.cycle(),
        benny.complete()
    );

    benny.suite(
        "Put a registry value",
        benny.add("regedit-rs", async () => {
            await regeditRs.putValue({
                [testKey]: {
                    "test": new RegSzValue("test")
                }
            });
        }),
        benny.add("regedit", async () => {
            await regedit.promisified.putValue({
                [testKey]: {
                    "test": {
                        value: "test",
                        type: "REG_SZ"
                    }
                }
            });
        }),
        benny.add("winreg", async () => {
            await new Promise<void>((resolve, reject) => {
                const regKey = new winreg({
                    hive: winreg.HKCU,
                    key: "\\software\\Zagrios\\regedit-rs"
                });
                regKey.set("test", winreg.REG_SZ, "test", (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }),
        benny.cycle(),
        benny.complete()
    )


}

run().catch((e) => {
    console.error(e)
});