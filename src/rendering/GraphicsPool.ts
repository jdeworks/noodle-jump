/** PixiJS Graphics object pool — reuse Graphics to reduce GC pressure. */

import { Graphics } from "pixi.js";
import { ObjectPool } from "../systems/ObjectPool";

export class GraphicsPool {
  private pool: ObjectPool<Graphics>;

  constructor() {
    this.pool = new ObjectPool(
      () => new Graphics(),
      (gfx) => {
        gfx.clear();
        gfx.alpha = 1;
        gfx.scale.set(1);
        gfx.rotation = 0;
        gfx.visible = true;
        gfx.tint = 0xffffff;
        gfx.parent?.removeChild(gfx);
      },
    );
  }

  /** Get a clean Graphics object. */
  acquire(): Graphics {
    return this.pool.acquire();
  }

  /** Return a Graphics object to the pool. */
  release(gfx: Graphics): void {
    this.pool.release(gfx);
  }

  /** Pre-fill the pool. */
  prewarm(count: number): void {
    this.pool.prewarm(count);
  }

  /** Current available count. */
  get available(): number {
    return this.pool.available;
  }

  /** Destroy all pooled objects. */
  destroy(): void {
    this.pool.drain((gfx) => {
      gfx.parent?.removeChild(gfx);
      gfx.destroy();
    });
  }
}
