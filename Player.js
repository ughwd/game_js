import { overlap } from './collision.js';

const SPEED = 230, JUMP = 560, GRAVITY = 1500, MAX_FALL = 900, W = 800;
// Ускорение/торможение (px/с²): на земле резкое, в воздухе мягкое — так прыжок идёт по дуге
const ACCEL_GROUND = 2200, FRICTION_GROUND = 2600;
const ACCEL_AIR = 900, FRICTION_AIR = 120;

const approach = (v, target, step) =>
  v < target ? Math.min(v + step, target) : Math.max(v - step, target);

export class Player {
  constructor(x, y) { this.w = 28; this.h = 34; this.reset(x, y); }
  reset(x, y) { Object.assign(this, { x, y, vx: 0, vy: 0, onGround: false, face: 1 }); }

  update(dt, input, platforms) {
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (dir) {
      this.face = dir;
      this.vx = approach(this.vx, dir * SPEED, (this.onGround ? ACCEL_GROUND : ACCEL_AIR) * dt);
    } else {
      // отпустил клавишу — в воздухе импульс почти сохраняется, на земле быстро гасится
      this.vx = approach(this.vx, 0, (this.onGround ? FRICTION_GROUND : FRICTION_AIR) * dt);
    }

    if (input.consumeJump() && this.onGround) { this.vy = -JUMP; this.onGround = false; }
    this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL);

    // Ось X
    this.x += this.vx * dt;
    for (const p of platforms) {
      if (!overlap(this, p)) continue;
      this.x = this.vx > 0 ? p.x - this.w : p.x + p.w;
      this.vx = 0; // упёрся в стену — импульс пропадает
    }
    if (this.x < 0) { this.x = 0; this.vx = 0; }
    if (this.x > W - this.w) { this.x = W - this.w; this.vx = 0; }

    // Ось Y
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
