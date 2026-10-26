import { overlap } from './collision.js';

const SPEED = 220, JUMP = 560, GRAVITY = 1500, MAX_FALL = 900, W = 800;

export class Player {
  constructor(x, y) { this.w = 28; this.h = 34; this.reset(x, y); }
  reset(x, y) { Object.assign(this, { x, y, vx: 0, vy: 0, onGround: false, face: 1 }); }

  update(dt, input, platforms) {
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    this.vx = dir * SPEED;
    if (dir) this.face = dir;
    if (input.consumeJump() && this.onGround) { this.vy = -JUMP; this.onGround = false; }
    this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL);

    // Ось X: сначала двигаемся по горизонтали и выталкиваем из платформ
    this.x += this.vx * dt;
    for (const p of platforms) {
      if (!overlap(this, p)) continue;
      this.x = this.vx > 0 ? p.x - this.w : p.x + p.w;
    }
    this.x = Math.max(0, Math.min(W - this.w, this.x));

    // Ось Y: сверху — приземление, снизу — удар головой
    this.y += this.vy * dt;
    this.onGround = false;
    for (const p of platforms) {
      if (!overlap(this, p)) continue;
      if (this.vy > 0) { this.y = p.y - this.h; this.onGround = true; }
      else this.y = p.y + p.h;
      this.vy = 0;
    }
  }
}
