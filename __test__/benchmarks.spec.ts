import test from 'ava';
import { list } from '../index.js';

test("bench list 100 times", async t => {
    t.timeout(100);

    const path = "HKLM\\software\\microsoft\\windows\\CurrentVersion"
    const paths = Array(100).fill(path);

    console.time("list 100 times");
    
    const res = await list(paths);
    t.true(res[path].exists);
    
    console.timeEnd("list 100 times");
});

