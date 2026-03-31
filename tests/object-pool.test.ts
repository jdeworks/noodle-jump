import { describe, test, expect } from "vitest";
import { ObjectPool } from "../src/systems/ObjectPool";

describe("ObjectPool", () => {
  test("acquire creates new object when pool is empty", () => {
    let created = 0;
    const pool = new ObjectPool(
      () => ({ id: ++created }),
      () => {},
    );

    const obj = pool.acquire();
    expect(obj.id).toBe(1);
    expect(created).toBe(1);
  });

  test("release and acquire reuses objects", () => {
    let created = 0;
    const pool = new ObjectPool(
      () => ({ id: ++created, value: 0 }),
      (obj) => {
        obj.value = 0;
      },
    );

    const obj1 = pool.acquire();
    obj1.value = 42;
    pool.release(obj1);

    const obj2 = pool.acquire();
    expect(obj2.id).toBe(1); // same object reused
    expect(obj2.value).toBe(0); // reset was called
    expect(created).toBe(1); // no new creation
  });

  test("prewarm fills pool", () => {
    const pool = new ObjectPool(
      () => ({ id: 0 }),
      () => {},
    );
    pool.prewarm(5);
    expect(pool.available).toBe(5);
  });

  test("available returns correct count", () => {
    const pool = new ObjectPool(
      () => ({}),
      () => {},
    );

    expect(pool.available).toBe(0);
    pool.release({});
    expect(pool.available).toBe(1);
    pool.acquire();
    expect(pool.available).toBe(0);
  });

  test("drain empties pool and calls cleanup", () => {
    let cleaned = 0;
    const pool = new ObjectPool(
      () => ({}),
      () => {},
    );
    pool.prewarm(3);
    expect(pool.available).toBe(3);

    pool.drain(() => cleaned++);
    expect(pool.available).toBe(0);
    expect(cleaned).toBe(3);
  });

  test("drain without cleanup just empties", () => {
    const pool = new ObjectPool(
      () => ({}),
      () => {},
    );
    pool.prewarm(3);
    pool.drain();
    expect(pool.available).toBe(0);
  });

  test("multiple acquire/release cycles work correctly", () => {
    let created = 0;
    const pool = new ObjectPool(
      () => ({ id: ++created }),
      () => {},
    );

    const a = pool.acquire();
    const b = pool.acquire();
    expect(created).toBe(2);

    pool.release(a);
    pool.release(b);
    expect(pool.available).toBe(2);

    const c = pool.acquire();
    const d = pool.acquire();
    expect(pool.available).toBe(0);
    expect(created).toBe(2); // no new objects created
    // Reused from pool (LIFO order)
    expect(c.id).toBe(2);
    expect(d.id).toBe(1);
  });
});
