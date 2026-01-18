const WIDTH = 800;
const HEIGHT = 500;

let saveData = JSON.parse(localStorage.getItem("zukan")) || {
  1: [], 2: [], 3: [], 4: [], 5: [], 6: []
};

class HomeScene extends Phaser.Scene {
  constructor() { super("home"); }

  create() {
    this.add.text(260, 80, "漢字おにごっこ", { fontSize: "36px", color: "#000" });
    this.makeBtn(300, 200, "スタート", () => this.scene.start("grade"));
    this.makeBtn(300, 260, "図鑑", () => this.scene.start("zukan"));
  }

  makeBtn(x, y, text, cb) {
    const r = this.add.rectangle(x + 100, y + 25, 200, 50, 0xaaaaaa).setInteractive();
    this.add.text(x + 40, y + 10, text, { fontSize: "24px", color: "#000" });
    r.on("pointerup", cb);
  }
}

class GradeScene extends Phaser.Scene {
  constructor() { super("grade"); }

  create() {
    this.add.text(260, 40, "学年をえらんでね", { fontSize: "28px", color: "#000" });
    for (let i = 1; i <= 1; i++) {
      this.makeBtn(300, 100, "小学1年", () => this.scene.start("game", { grade: 1 }));
    }
    this.makeBtn(300, HEIGHT - 70, "ホームへ", () => this.scene.start("home"));
  }

  makeBtn(x, y, text, cb) {
    const r = this.add.rectangle(x + 100, y + 20, 200, 40, 0xaaaaaa).setInteractive();
    this.add.text(x + 40, y + 5, text, { fontSize: "20px", color: "#000" });
    r.on("pointerup", cb);
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super("game");
    this.stickActive = false;
  }

  init(data) {
    this.grade = data.grade;
  }

  preload() {
    this.load.json("kanji", `kanji/kanji_1.json`);
  }

  create() {
    this.timeLeft = 60;
    this.kanjiList = this.cache.json.get("kanji");

    // プレイヤー
    this.player = this.add.circle(400, 250, 20, 0xff5555);

    // 敵（動かない）
    this.enemy = this.add.rectangle(200, 200, 70, 70, 0x5078ff);
    this.enemyText = this.add.text(200, 200, "", {
      fontSize: "32px",
      color: "#fff"
    }).setOrigin(0.5);

    this.pickKanji();

    // UI
    this.timerText = this.add.text(10, 10, "のこり60秒", { fontSize: "20px", color: "#000" });
    this.yomiText = this.add.text(200, 20, "", { fontSize: "20px", color: "#000" });

    // タイマー
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.timeLeft--;
        this.timerText.setText(`のこり${this.timeLeft}秒`);
        if (this.timeLeft <= 0) {
          localStorage.setItem("zukan", JSON.stringify(saveData));
          this.scene.start("home");
        }
      }
    });

    // バーチャルスティック
    this.stickBase = this.add.circle(0, 0, 50, 0x999999, 0.4).setVisible(false);
    this.stickKnob = this.add.circle(0, 0, 25, 0x666666, 0.6).setVisible(false);

    this.input.on("pointerdown", p => {
      this.stickActive = true;
      this.stickX = p.x;
      this.stickY = p.y;
      this.stickBase.setPosition(p.x, p.y).setVisible(true);
      this.stickKnob.setPosition(p.x, p.y).setVisible(true);
    });

    this.input.on("pointerup", () => {
      this.stickActive = false;
      this.stickBase.setVisible(false);
      this.stickKnob.setVisible(false);
    });
  }

  pickKanji() {
    this.currentKanji = Phaser.Utils.Array.GetRandom(this.kanjiList);
    this.enemyText.setText(this.currentKanji.kanji);
  }

  update() {
    if (this.stickActive) {
      const p = this.input.activePointer;
      let dx = p.x - this.stickX;
      let dy = p.y - this.stickY;
      const dist = Math.hypot(dx, dy);
      const max = 50;

      if (dist > max) {
        dx = dx / dist * max;
        dy = dy / dist * max;
      }

      this.stickKnob.setPosition(this.stickX + dx, this.stickY + dy);

      this.player.x += dx * 0.08;
      this.player.y += dy * 0.08;
    }

    // 当たり判定
    if (Phaser.Geom.Intersects.RectangleToRectangle(
      this.player.getBounds(),
      this.enemy.getBounds()
    )) {
      if (!saveData[this.grade].includes(this.currentKanji.kanji)) {
        saveData[this.grade].push(this.currentKanji.kanji);
      }
      this.yomiText.setText(
        `訓:${this.currentKanji.kun} / 音:${this.currentKanji.on}`
      );
      this.time.delayedCall(3000, () => this.yomiText.setText(""));
      this.pickKanji();
      this.enemy.setPosition(
        Phaser.Math.Between(100, 700),
        Phaser.Math.Between(100, 400)
      );
      this.enemyText.setPosition(this.enemy.x, this.enemy.y);
    }

    this.enemyText.setPosition(this.enemy.x, this.enemy.y);
  }
}

class ZukanScene extends Phaser.Scene {
  constructor() { super("zukan"); }

  create() {
    this.add.text(260, 20, "かんじずかん", { fontSize: "30px", color: "#000" });
    let y = 80;
    saveData[1].forEach(k => {
      this.add.text(50, y, k, { fontSize: "22px", color: "#000" });
      y += 30;
    });
    this.makeBtn(300, HEIGHT - 60, "ホームへ", () => this.scene.start("home"));
  }

  makeBtn(x, y, text, cb) {
    const r = this.add.rectangle(x + 100, y + 20, 200, 40, 0xaaaaaa).setInteractive();
    this.add.text(x + 40, y + 5, text, { fontSize: "20px", color: "#000" });
    r.on("pointerup", cb);
  }
}

const config = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: "#dcefff",
  scene: [HomeScene, GradeScene, GameScene, ZukanScene]
};

new Phaser.Game(config);
