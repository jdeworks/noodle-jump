/** Generic object pool — pure logic, no PixiJS. */

export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void) {
    this.factory = factory;
    this.reset = reset;
  }

  /** Get an object from the pool or create a new one. */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  /** Return an object to the pool for reuse. */
  release(obj: T): void {
    this.reset(obj);
    this.pool.push(obj);
  }

  /** Pre-fill the pool with objects. */
  prewarm(count: number): void {
    for (let i = 0; i < count; i++) {
      this.pool.push(this.factory());
    }
  }

  /** Current number of available objects in the pool. */
  get available(): number {
    return this.pool.length;
  }

  /** Drain the pool, optionally calling a cleanup function on each object. */
  drain(cleanup?: (obj: T) => void): void {
    if (cleanup) {
      for (const obj of this.pool) {
        cleanup(obj);
      }
    }
    this.pool = [];
  }
}
