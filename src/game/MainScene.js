import Phaser from 'phaser';
import { EventBus } from './EventBus';
import {Ysdk} from "../Ysdk.js";
import Database from "../Database.js";

const W = 480, H = 720, PLATE_Y = 660, SPOON_Y = 95;
// [заливка, обводка]. Больше цветов в списке = реже совпадения
const COLORS = [[0xfff1d6, 0xe0c490], [0xcfe8a9, 0x8fb35a], [0xffb8cc, 0xd9708f], [0xbfd0ff, 0x6f8fe0]];
const PLATE_HALF = 150, RISE = 40, K = RISE / (PLATE_HALF * PLATE_HALF);
// высота поверхности тарелки: центр ниже, края приподняты
const surfaceY = (x) => PLATE_Y - 12 - K * (x - W / 2) ** 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const newDef = () => ({ w: rnd(66, 98), h: rnd(40, 54), c: (Math.random() * COLORS.length) | 0 });

export class MainScene extends Phaser.Scene {
  ysdk
  db
  constructor() {
    super('main');
    this.state = 'menu'; // menu | ready | wait | over
    this.dumps = [];
    this.defs = new Map();
    this.drop = null;
    this.cur = newDef();
    this.score = 0;
    this.best = 0;
    this.t = 0;
    this.camY = 0;
    this.still = 0;
    this.wait = 0;
    this.revived = false;
    this.pops = []; // эффекты исчезновения
    this.dead = new Set(); // пары одного цвета, которые надо убрать
    this.ysdk = new Ysdk()
    this.db = new Database();
  }

  create() {
    this.best = this.db.getAll().best
    this.cameras.main.setBackgroundColor('#e6effc');
    this.bg = this.add.graphics().setScrollFactor(0).setDepth(0);
    this.gfx = this.add.graphics().setDepth(1);
    this.ui = this.add.graphics().setScrollFactor(0).setDepth(2);
    const font = { fontFamily: 'Rubik, system-ui, sans-serif', color: '#17398a' };
    this.scoreText = this.add.text(W / 2, H - 92, '0', { ...font, fontSize: '64px', fontStyle: '800' })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(3);
    this.bestText = this.add.text(14, H - 28, '', { ...font, fontSize: '16px' })
      .setScrollFactor(0).setDepth(3);
    this.buildPlate();

    // одноцветные пельмени исчезают при касании
    this.matter.world.on('collisionstart', (e) => {
      if (this.state !== 'ready' && this.state !== 'wait') return;
      for (const p of e.pairs) {
        const a = this.defs.get(p.bodyA), b = this.defs.get(p.bodyB);
        if (a && b && a.c === b.c) { this.dead.add(p.bodyA); this.dead.add(p.bodyB); }
      }
    });

    this.input.on('pointerdown', this.dropIt, this);
    this.input.keyboard?.on('keydown-SPACE', this.dropIt, this);
    EventBus.on('start', this.begin, this);
    EventBus.on('revive', this.revive, this);
    EventBus.on('pause', this.pauseGame, this);
    EventBus.on('resume', this.resumeGame, this);
    this.events.once('shutdown', () => {
      EventBus.off('start', this.begin, this);
      EventBus.off('revive', this.revive, this);
      EventBus.off('pause', this.pause(), this);
      EventBus.off('resume', this.resumeGame, this);
    });
  }

  /** Вогнутая тарелка: цепочка наклонных статичных сегментов вдоль параболы. */
  buildPlate() {
    const step = 15;
    for (let x = W / 2 - PLATE_HALF; x < W / 2 + PLATE_HALF - 0.1; x += step) {
      const x2 = x + step, y1 = surfaceY(x), y2 = surfaceY(x2);
      const a = Math.atan2(y2 - y1, x2 - x), len = Math.hypot(x2 - x, y2 - y1) + 4;
      const mx = (x + x2) / 2, my = (y1 + y2) / 2;
      this.matter.add.rectangle(mx - Math.sin(a) * 8, my + Math.cos(a) * 8, len, 16, { isStatic: true, friction: 1, angle: a });
    }
  }

  speed() { return 0.0016 + Math.min(this.score, 30) * 0.00005; }

  begin() {
    this.dumps.forEach((b) => this.matter.world.remove(b));
    this.dumps = []; this.defs.clear(); this.drop = null;
    this.dead.clear(); this.pops = [];
    this.score = 0; this.camY = 0; this.revived = false;
    this.cur = newDef(); this.state = 'ready';
    this.ysdk.start()
   // YG.gameStart();
  }

  resumeGame(){
    this.scene.resume("main")
  }

 pauseGame(){
    this.scene.pause("main")
  }

  revive() {
    // убираем упавшие пельмени и продолжаем с той же башней
    this.dumps = this.dumps.filter((b) => {
      if (b.position.y > PLATE_Y + 50) { this.matter.world.remove(b); this.defs.delete(b); return false; }
      return true;
    });
    this.drop = null; this.revived = true; this.cur = newDef(); this.state = 'ready';
    this.ysdk.start()
   // YG.gameStart();
  }

  dropIt() {
    if (this.state !== 'ready') return;
    const x = W / 2 + Math.sin(this.t * this.speed()) * (W / 2 - 80);
    const d = this.cur;
    const b = this.matter.add.rectangle(x, SPOON_Y - this.camY + 20, d.w, d.h, {
      chamfer: { radius: d.h / 2.2 }, friction: 0.9, frictionStatic: 2, restitution: 0.05, density: 0.002,
    });
    this.defs.set(b, d); this.dumps.push(b);
    this.drop = b; this.state = 'wait'; this.still = 0; this.wait = 0;
  }

  over() {
    this.state = 'over';
    this.ysdk.stop()
  //  YG.gameStop(); YG.submitScore(this.score);
    if (this.score > this.best) {
      this.best = this.score;
      this.db.setBest(this.best);
    }
    this.time.delayedCall(700, () =>
      EventBus.emit('over', { score: this.score, best: this.best, canRevive: !this.revived }));
  }

  update(_time, delta) {
    const dt = Math.min(delta, 50);
    this.t += dt;
    for (const p of this.pops) p.t += dt;
    this.pops = this.pops.filter((p) => p.t < 350);


    if (this.state === 'ready' || this.state === 'wait') {
      if (this.dead.size) {
        let hitDrop = false;
        for (const b of this.dead) {
          const d = this.defs.get(b);
          if (!d) continue;
          this.pops.push({ x: b.position.x, y: b.position.y, t: 0, c: d.c });
          if (b === this.drop) hitDrop = true;
          this.matter.world.remove(b); this.defs.delete(b);
        }
        this.score += this.dead.size; // +2 очка за пару
        this.dumps = this.dumps.filter((b) => !this.dead.has(b));
        this.dead.clear();
        if (hitDrop) { this.drop = null; this.cur = newDef(); this.state = 'ready'; }
      }
      const wind = Math.sin(this.t / 1100) * Math.min(this.score, 30) * 2e-6;
      let top = PLATE_Y;
      for (const b of this.dumps) {
        this.matter.applyForce(b, { x: wind * b.mass, y: 0 });
        if (b.position.y > PLATE_Y + 50) { this.over(); break; }
        if (b !== this.drop || this.state === 'ready') top = Math.min(top, b.bounds.min.y);
      }
      if (this.state === 'wait' && this.drop) {
        this.wait += dt;
        if (this.drop.speed < 0.25 && Math.abs(this.drop.angularSpeed) < 0.01) this.still++; else this.still = 0;
        if (this.still > 40 || this.wait > 4000) {
          if (this.drop.position.y < PLATE_Y) { this.score++; this.cur = newDef(); this.drop = null; this.state = 'ready'; }
          else this.over();
        }
      }
      this.camY += (Math.max(0, 430 - top) - this.camY) * 0.06;
      this.cameras.main.scrollY = -this.camY;
    }
    this.draw();
  }

  draw() {
    const g = this.bg;
    g.clear().fillStyle(0xd3e2f7);
    for (let x = 0; x < W; x += 60) g.fillRect(x, 0, 30, H);
    for (let y = -((this.camY * 0.5) % 60); y < H; y += 60) g.fillRect(0, y, W, 30);

    const w = this.gfx;
    w.clear();
    // ножка и вогнутая тарелка
    w.fillStyle(0xffffff).fillRoundedRect(W / 2 - 45, PLATE_Y + 2, 90, 12, 5);
    w.lineStyle(4, 0x1f4fb0).strokeRoundedRect(W / 2 - 45, PLATE_Y + 2, 90, 12, 5);
    const pts = [];
    for (let x = W / 2 - PLATE_HALF; x <= W / 2 + PLATE_HALF + 0.1; x += 10) pts.push({ x, y: surfaceY(x) });
    const poly = pts.concat(pts.slice().reverse().map((p) => ({ x: p.x, y: p.y + 16 })));
    w.fillStyle(0xffffff).fillPoints(poly, true);
    w.lineStyle(4, 0x1f4fb0).strokePoints(poly, true);
    w.fillStyle(0x1f4fb0);
    for (let x = W / 2 - PLATE_HALF + 14; x < W / 2 + PLATE_HALF - 10; x += 24) w.fillCircle(x, surfaceY(x) + 8, 3);
    for (const b of this.dumps) {
      const scared = Math.abs(b.angularSpeed) > 0.015 || Math.abs(b.angle) > 0.5;
      this.dumpling(w, b.position.x, b.position.y, b.angle, this.defs.get(b), scared);
    }

    for (const p of this.pops) {
      const k = p.t / 350, [fill, line] = COLORS[p.c];
      w.lineStyle(5 * (1 - k) + 1, line, 1 - k).strokeCircle(p.x, p.y, 20 + 50 * k);
      w.fillStyle(fill, 1 - k);
      for (let i = 0; i < 6; i++) w.fillCircle(p.x + Math.cos(i * Math.PI / 3) * 45 * k, p.y + Math.sin(i * Math.PI / 3) * 45 * k, 6 * (1 - k) + 1);
    }

    const u = this.ui;
    u.clear();
    if (this.state === 'ready') {
      const x = W / 2 + Math.sin(this.t * this.speed()) * (W / 2 - 80);
      u.lineStyle(8, 0x9aa7bd).lineBetween(x, 0, x, SPOON_Y + 10);
      u.fillStyle(0xb8c4d8).fillEllipse(x, SPOON_Y + 30, this.cur.w + 24, this.cur.h + 20);
      this.dumpling(u, x, SPOON_Y + 14, 0, this.cur, false);
    }
    this.scoreText.setText(String(this.score));
    this.bestText.setText('Рекорд: ' + this.best);
  }

  dumpling(g, x, y, a, d, scared) {
    const rx = d.w / 2, ry = d.h / 2;
    g.save(); g.translateCanvas(x, y); g.rotateCanvas(a);
    g.fillStyle(COLORS[d.c][0]).fillEllipse(0, 0, d.w, d.h);
    g.lineStyle(3, COLORS[d.c][1]).strokeEllipse(0, 0, d.w, d.h);
    g.lineStyle(2, COLORS[d.c][1]);
    for (let i = 0; i <= 10; i++) {
      const q = Math.PI + (i * Math.PI) / 10;
      const px = Math.cos(q) * rx * 0.92, py = Math.sin(q) * ry * 0.92;
      g.lineBetween(px, py, px * 0.86, py * 0.7);
    }
    const ey = ry * 0.15, er = scared ? 4.5 : 3.2;
    g.fillStyle(0x2b2b2b).fillCircle(-rx * 0.22, ey, er).fillCircle(rx * 0.22, ey, er);
    if (scared) g.fillEllipse(0, ey + ry * 0.38, 8, 10);
    else g.lineStyle(2.5, 0x2b2b2b).beginPath().arc(0, ey + ry * 0.1, rx * 0.14, 0.2, Math.PI - 0.2, false).strokePath();
    g.restore();
  }
}
