import assert from "node:assert/strict";
import { TtlLruCache } from "../lib/ttl-lru-cache";

const cache = new TtlLruCache<string>(3);
const now = Date.now();

cache.set("a", "1", now + 60_000);
cache.set("b", "2", now + 60_000);
cache.set("c", "3", now + 60_000);
assert.equal(cache.size, 3);

cache.set("d", "4", now + 60_000);
assert.equal(cache.size, 3);
assert.equal(cache.get("a"), undefined);
assert.equal(cache.get("b"), "2");

cache.set("expired", "x", now - 1);
assert.equal(cache.get("expired"), undefined);

cache.set("b", "2b", now + 60_000);
cache.set("e", "5", now + 60_000);
assert.equal(cache.get("c"), undefined);
assert.equal(cache.get("b"), "2b");
assert.equal(cache.get("d"), "4");
assert.equal(cache.get("e"), "5");

console.log("test-ttl-lru-cache: ok");
