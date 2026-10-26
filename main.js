import { Game } from './Game.js';

const $ = (id) => document.getElementById(id);
const game = new Game($('game'), { bottles: $('bottles'), score: $('score'), best: $('best'), msg: $('msg') });

const press = (id, fn) => $(id).addEventListener('click', (e) => { fn(); e.currentTarget.blur(); });
press('btnStart', () => game.start());
press('btnPause', () => game.pause());
press('btnRestart', () => game.restart());
document.querySelectorAll('.touch button').forEach((b) => game.input.bindTouch(b));
