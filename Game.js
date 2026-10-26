import { Player } from './Player.js';
import { Input } from './input.js';
import { overlap } from './collision.js';

const W = 800, H = 450, WATER_Y = 420, KEY = 'tanuki-best';

const PLATFORMS = [
  { x: 0,   y: 380, w: 150, h: 20 },   // старт
  { x: 200, y: 335, w: 100, h: 20 },
  { x: 350, y: 290, w: 100, h: 20 },
  { x: 500, y: 245, w: 110, h: 20 },
  { x: 340, y: 190, w: 110, h: 20 },
  { x: 150, y: 140, w: 130, h: 20 },   // финиш
];
const BOTTLES = [[242, 305], [542, 215], [382, 160]]; // x, y бутылок
const TORII = { x: 205, y: 90, w: 44, h: 50 };

export class Game {
  constructor(canvas, ui) {
    this.ctx = canvas.getContext('2d');
    this.ui = ui;
    this.input = new Input(() => this.state === 'running');
    this.state = 'idle';
    this.raf = null;
    this.player = new Player(40, 340);
    this.best = this.loadBest();
    this.tick = (t) => this.frame(t);
    document.addEventListener('visibilitychange', () => document.hidden && this.pause());
    window.addEventListener('blur', () => this.input.clear());
    this.reset();
    this.setMsg('Нажми «Старт»');
  }

  reset() {
    this.player.reset(40, 340);
    this.bottles = BOTTLES.map(([x, y]) => ({ x, y, w: 16, h: 26, taken: false }));
    this.fires = [];
    this.fox = { x: 100, dir: 1 };
    this.fireTimer = 1.5;
    this.score = 0; this.time = 0; this.t = 0;
    this.input.clear();
    this.updateUi();
    this.render();
  }

  start() {
    if (this.state === 'running') return;
    if (this.state !== 'paused') this.reset();
    this.state = 'running';
    this.setMsg('');
    this.last = null;                 // сбрасываем время предыдущего кадра
    if (!this.raf) this.raf = requestAnimationFrame(this.tick); // цикл всегда один
  }

  pause() {
    if (this.state !== 'running') return;
    this.state = 'paused';
    cancelAnimationFrame(this.raf); this.raf = null;
    this.input.clear();
    this.setMsg('Пауза');
    this.render();
  }

  restart() {
    cancelAnimationFrame(this.raf); this.raf = null;
    this.state = 'idle';
    this.start();
  }

  frame(now) {
    this.raf = null;
    if (this.state !== 'running') return;
    const dt = this.last == null ? 0 : Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.update(dt);
    this.render();
    if (this.state === 'running') this.raf = requestAnimationFrame(this.tick);
  }

  update(dt) {
    const p = this.player;
    this.time += dt; this.t += dt;
    p.update(dt, this.input, PLATFORMS);

    // Кицунэ ходит по небу и роняет лисьи огни
    this.fox.x += this.fox.dir * 110 * dt;
    if (this.fox.x < 60 || this.fox.x > 740) this.fox.dir *= -1;
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireTimer = 2.2;
      this.fires.push({ x: this.fox.x, y: 70, r: 9 });
    }
    for (const f of this.fires) f.y += 150 * dt;
    this.fires = this.fires.filter((f) => f.y < H &&
      !PLATFORMS.some((pl) => overlap({ x: f.x - f.r, y: f.y - f.r, w: f.r * 2, h: f.r * 2 }, pl)));

    for (const b of this.bottles) {
      if (!b.taken && overlap(p, b)) { b.taken = true; this.score += 100; }
    }
    const left = this.bottles.filter((b) => !b.taken).length;

    if (p.y + p.h > WATER_Y) return this.end(false, 'Тануки упал в пруд!\n');
    if (this.fires.some((f) => overlap(p, { x: f.x - f.r + 2, y: f.y - f.r + 2, w: f.r * 2 - 4, h: f.r * 2 - 4 })))
      return this.end(false, 'Кицунэ подожгла тануки!\n');
    if (overlap(p, TORII)) {
      if (left === 0) return this.end(true, 'Победа! Сакэ собрано!\n');
      this.setMsg('Сначала собери все бутылки!');
    } else if (this.ui.msg.textContent.startsWith('Сначала')) this.setMsg('');
    this.updateUi();
  }

  end(won, text) {
    if (won) this.score += Math.max(0, 60 - Math.floor(this.time)) * 5;
    this.best = Math.max(this.best, this.score);
    this.saveBest();
    this.state = won ? 'won' : 'lost';
    this.input.clear();
    this.updateUi();
    this.setMsg(`${text}Счёт: ${this.score}\nНажми «Заново»`);
    this.render();
  }

  loadBest() { try { return +localStorage.getItem(KEY) || 0; } catch { return 0; } }
  saveBest() { try { localStorage.setItem(KEY, this.best); } catch { /* хранилище недоступно */ } }
  setMsg(t) { this.ui.msg.textContent = t; }
  updateUi() {
    const got = this.bottles.filter((b) => b.taken).length;
    this.ui.bottles.textContent = `${got}/${this.bottles.length}`;
    this.ui.score.textContent = this.score;
    this.ui.best.textContent = this.best;
  }

  // ---------- Отрисовка ----------
  render() {
    const c = this.ctx;
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#3a1f5c'); g.addColorStop(1, '#e07a5f');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = '#fff3d6'; c.beginPath(); c.arc(650, 90, 40, 0, 7); c.fill();       // луна
    c.fillStyle = '#4b2e6b'; c.beginPath(); c.moveTo(380, 420); c.lineTo(600, 230); c.lineTo(820, 420); c.fill(); // гора
    c.fillStyle = '#f4f1ee'; c.beginPath(); c.moveTo(560, 264); c.lineTo(600, 230); c.lineTo(640, 264); c.lineTo(615, 258); c.lineTo(600, 268); c.lineTo(585, 258); c.fill();
    // вода
    c.fillStyle = '#1f4e79'; c.fillRect(0, WATER_Y, W, H - WATER_Y);
    c.strokeStyle = '#6aa9d8'; c.beginPath();
    for (let x = 0; x < W; x += 20) c.arc(x + 10, WATER_Y + 4, 8, Math.PI, 0);
    c.stroke();
    // тории
    const t = TORII; c.fillStyle = '#d62828';
    c.fillRect(t.x, t.y + 14, 6, 36); c.fillRect(t.x + t.w - 6, t.y + 14, 6, 36);
    c.fillRect(t.x - 6, t.y + 6, t.w + 12, 7); c.fillRect(t.x, t.y + 18, t.w, 4);
    // платформы
    for (const p of PLATFORMS) {
      c.fillStyle = '#6b3f21'; c.fillRect(p.x, p.y, p.w, p.h);
      c.fillStyle = '#b3261e'; c.fillRect(p.x, p.y, p.w, 6);
      c.fillStyle = '#4a2a15'; for (let x = p.x + 10; x < p.x + p.w; x += 24) c.fillRect(x, p.y + 8, 2, 10);
    }
    for (const b of this.bottles) if (!b.taken) this.drawBottle(b);
    this.drawFox();
    for (const f of this.fires) this.drawFire(f);
    this.drawTanuki();
  }

  drawBottle(b) {
    const c = this.ctx, bob = Math.sin(this.t * 4 + b.x) * 3, y = b.y + bob;
    c.fillStyle = '#e9d8a6'; c.fillRect(b.x + 5, y, 6, 8);
    c.fillStyle = '#2a9d8f'; c.beginPath(); c.ellipse(b.x + 8, y + 17, 8, 9, 0, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.fillRect(b.x + 4, y + 13, 8, 6);
    c.fillStyle = '#d62828'; c.fillRect(b.x + 7, y + 14, 2, 4);
  }

  drawFire(f) {
    const c = this.ctx;
    c.fillStyle = '#7fd6ff'; c.beginPath(); c.arc(f.x, f.y, f.r, 0, 7); c.fill();
    c.beginPath(); c.moveTo(f.x - f.r, f.y); c.lineTo(f.x, f.y - f.r * 2.2); c.lineTo(f.x + f.r, f.y); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(f.x, f.y + 1, f.r / 2, 0, 7); c.fill();
  }

  drawFox() {
    const c = this.ctx, x = this.fox.x, y = 50, d = this.fox.dir;
    c.fillStyle = '#f77f00';
    c.beginPath(); c.moveTo(x - 14 * d, y + 10); c.quadraticCurveTo(x - 50 * d, y - 10, x - 40 * d, y + 20); c.lineTo(x - 14 * d, y + 20); c.fill(); // хвост
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x - 42 * d, y + 14, 6, 0, 7); c.fill();
    c.fillStyle = '#f77f00'; c.beginPath(); c.ellipse(x, y + 12, 18, 12, 0, 0, 7); c.fill();               // тело
    c.beginPath(); c.arc(x + 12 * d, y, 11, 0, 7); c.fill();                                              // голова
    c.beginPath(); c.moveTo(x + 4 * d, y - 6); c.lineTo(x + 6 * d, y - 22); c.lineTo(x + 13 * d, y - 9); c.fill();
    c.beginPath(); c.moveTo(x + 14 * d, y - 9); c.lineTo(x + 20 * d, y - 22); c.lineTo(x + 21 * d, y - 4); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x + 18 * d, y + 2); c.lineTo(x + 30 * d, y + 6); c.lineTo(x + 18 * d, y + 10); c.fill();
    c.fillStyle = '#222'; c.fillRect(x + 14 * d, y - 4, 4, 2);
    c.fillStyle = '#d62828'; c.fillRect(x - 6, y + 4, 12, 3);                                             // лента
  }

  drawTanuki() {
    const c = this.ctx, p = this.player, f = p.face, cx = p.x + p.w / 2;
    const bob = p.onGround && p.vx ? Math.sin(this.t * 20) * 1.5 : 0;
    c.save(); c.translate(0, bob);
    c.fillStyle = '#5c3a21'; c.beginPath(); c.ellipse(cx - 16 * f, p.y + 24, 10, 7, 0, 0, 7); c.fill(); // хвост
    c.fillStyle = '#3a2412'; c.fillRect(cx - 24 * f - (f < 0 ? 4 : 0), p.y + 22, 4, 4);
    c.fillStyle = '#8b5e3c'; c.beginPath(); c.ellipse(cx, p.y + 22, 14, 13, 0, 0, 7); c.fill();         // тело
    c.fillStyle = '#e8d3a8'; c.beginPath(); c.ellipse(cx, p.y + 25, 8, 8, 0, 0, 7); c.fill();           // живот
    c.fillStyle = '#8b5e3c'; c.beginPath(); c.arc(cx, p.y + 10, 11, 0, 7); c.fill();                     // голова
    c.beginPath(); c.arc(cx - 9, p.y, 4, 0, 7); c.arc(cx + 9, p.y, 4, 0, 7); c.fill();                  // уши
    c.fillStyle = '#2b1a0e'; c.beginPath(); c.ellipse(cx - 5, p.y + 10, 4, 3, -0.4, 0, 7); c.ellipse(cx + 5, p.y + 10, 4, 3, 0.4, 0, 7); c.fill(); // маска
    c.fillStyle = '#fff'; c.fillRect(cx - 5 + f, p.y + 9, 2, 2); c.fillRect(cx + 3 + f, p.y + 9, 2, 2);
    c.fillStyle = '#2b1a0e'; c.fillRect(cx - 2 + f * 2, p.y + 14, 4, 3);                                // нос
    c.fillStyle = '#d4a85a'; c.fillRect(cx - 12, p.y + 20, 24, 3);                                      // пояс (соломенная шляпа-мотив)
    c.restore();
  }
}
