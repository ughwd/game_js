const KEYS = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump', Space: 'jump' };

export class Input {
  constructor(isActive) {
    this.held = new Set();
    this.jumpQueued = false;
    window.addEventListener('keydown', (e) => {
      const a = KEYS[e.code];
      if (!a || !isActive()) return;
      e.preventDefault(); // не прокручиваем страницу
      if (a === 'jump') { if (!e.repeat) this.jumpQueued = true; } else this.held.add(a);
    });
    window.addEventListener('keyup', (e) => {
      const a = KEYS[e.code];
      if (a && a !== 'jump') this.held.delete(a);
    });
  }
  get left() { return this.held.has('left'); }
  get right() { return this.held.has('right'); }
  consumeJump() { const j = this.jumpQueued; this.jumpQueued = false; return j; }
  clear() { this.held.clear(); this.jumpQueued = false; }
  // Экранные кнопки с поддержкой удержания
  bindTouch(btn) {
    const act = btn.dataset.act;
    const down = (e) => { e.preventDefault(); act === 'jump' ? (this.jumpQueued = true) : this.held.add(act); };
    const up = (e) => { e.preventDefault(); if (act !== 'jump') this.held.delete(act); };
    btn.addEventListener('pointerdown', down);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => btn.addEventListener(t, up));
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  }
}
