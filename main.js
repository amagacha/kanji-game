const WIDTH = 800;
const HEIGHT = 500;

let saveData = JSON.parse(localStorage.getItem("zukan")) || {
  1:[],2:[],3:[],4:[],5:[],6:[]
};

// ---------------- HOME ----------------
class HomeScene extends Phaser.Scene {
  constructor(){ super("home"); }
  create(){
    this.add.text(280,80,"漢字おにごっこ",{fontSize:"36px",color:"#000"});
    this.btn(300,200,"スタート",()=>this.scene.start("grade"));
    this.btn(300,260,"図鑑",()=>this.scene.start("zukan"));
  }
  btn(x,y,t,cb){
    let r=this.add.rectangle(x+100,y+25,200,50,0xaaaaaa).setInteractive();
    this.add.text(x+40,y+10,t,{fontSize:"24px",color:"#000"});
    r.on("pointerup",cb);
  }
}

// ---------------- GRADE ----------------
class GradeScene extends Phaser.Scene {
  constructor(){ super("grade"); }
  create(){
    this.add.text(260,40,"学年をえらんでね",{fontSize:"28px",color:"#000"});
    for(let i=1;i<=6;i++){
      this.btn(300,80+i*45,`小学${i}年`,
        ()=>this.scene.start("enemy",{grade:i}));
    }
    this.btn(300,HEIGHT-60,"ホームへ",()=>this.scene.start("home"));
  }
  btn(x,y,t,cb){
    let r=this.add.rectangle(x+100,y+20,200,40,0xaaaaaa).setInteractive();
    this.add.text(x+30,y+5,t,{fontSize:"20px",color:"#000"});
    r.on("pointerup",cb);
  }
}

// ---------------- ENEMY COUNT ----------------
class EnemySelectScene extends Phaser.Scene {
  constructor(){ super("enemy"); }
  init(d){ this.grade=d.grade; }
  create(){
    this.add.text(220,50,"敵の数をえらんでね",{fontSize:"28px",color:"#000"});
    for(let i=1;i<=5;i++){
      this.btn(300,100+i*45,`${i}体`,
        ()=>this.scene.start("game",{grade:this.grade,count:i}));
    }
    this.btn(300,HEIGHT-60,"戻る",()=>this.scene.start("grade"));
  }
  btn(x,y,t,cb){
    let r=this.add.rectangle(x+100,y+20,200,40,0xaaaaaa).setInteractive();
    this.add.text(x+60,y+5,t,{fontSize:"20px",color:"#000"});
    r.on("pointerup",cb);
  }
}

// ---------------- ZUKAN ----------------
class ZukanScene extends Phaser.Scene {
  constructor(){ super("zukan"); }
  create(){
    this.add.text(280,20,"かんじずかん",{fontSize:"30px",color:"#000"});
    let y=70;
    for(let g=1;g<=6;g++){
      let line=`${g}年： `;
      saveData[g].forEach(k=>line+=k+" ");
      this.add.text(40,y,line,{fontSize:"18px",color:"#000"});
      y+=35;
    }
    this.btn(300,HEIGHT-60,"ホームへ",()=>this.scene.start("home"));
  }
  btn(x,y,t,cb){
    let r=this.add.rectangle(x+100,y+20,200,40,0xaaaaaa).setInteractive();
    this.add.text(x+40,y+5,t,{fontSize:"20px",color:"#000"});
    r.on("pointerup",cb);
  }
}

// ---------------- GAME ----------------
class GameScene extends Phaser.Scene {
  constructor(){ super("game"); }
  init(d){
    this.grade=d.grade;
    this.enemyCount=d.count;
  }

  preload(){
    this.load.json("kanji",`kanji/kanji_${this.grade}.json`);
    this.load.audio("pon","assets/pon.mp3");
  }

  create(){
    this.timeLeft=60;
    this.kanjiList=this.cache.json.get("kanji");

    this.player=this.add.rectangle(400,250,40,40,0xff5555);

    this.enemies=[];
    this.enemyTexts=[];

    for(let i=0;i<this.enemyCount;i++){
      let e=this.add.rectangle(
        Phaser.Math.Between(50,750),
        Phaser.Math.Between(80,450),
        60,60,0x5078ff
      );
      let t=this.add.text(0,0,"",{fontSize:"32px",color:"#fff"}).setOrigin(0.5);
      this.enemies.push(e);
      this.enemyTexts.push(t);
    }

    this.pickKanji();

    this.timerText=this.add.text(10,10,"のこり60秒",{fontSize:"20px",color:"#000"});
    this.yomiText=this.add.text(200,20,"",{fontSize:"20px",color:"#000"});

    this.pon=this.sound.add("pon");

    // ダッシュ
    this.dash=false;
    let dashBtn=this.add.rectangle(720,420,120,40,0xaaaaaa).setInteractive();
    this.add.text(690,410,"ダッシュ",{fontSize:"16px",color:"#000"});
    dashBtn.on("pointerdown",()=>this.dash=true);
    dashBtn.on("pointerup",()=>this.dash=false);

    // タイマー
    this.time.addEvent({
      delay:1000, loop:true,
      callback:()=>{
        this.timeLeft--;
        this.timerText.setText(`のこり${this.timeLeft}秒`);
        if(this.timeLeft<=0){
          localStorage.setItem("zukan",JSON.stringify(saveData));
          this.scene.start("home");
        }
      }
    });

    // 指追従移動（スマホ）
    this.input.on("pointermove",p=>{
      if(p.isDown){
        let sp=this.dash?0.12:0.06;
        this.player.x+=(p.x-this.player.x)*sp;
        this.player.y+=(p.y-this.player.y)*sp;
      }
    });
  }

  pickKanji(){
    this.currentKanji=Phaser.Utils.Array.GetRandom(this.kanjiList);
    this.enemyTexts.forEach(t=>t.setText(this.currentKanji.kanji));
  }

  update(){
    let speedBase=0.4+(60-this.timeLeft)*0.01;

    this.enemies.forEach((e,i)=>{
      let dx=this.player.x-e.x;
      let dy=this.player.y-e.y;
      let d=Math.hypot(dx,dy)+0.01;
      e.x+=dx/d*speedBase;
      e.y+=dy/d*speedBase;
      this.enemyTexts[i].setPosition(e.x,e.y);

      if(Phaser.Geom.Intersects.RectangleToRectangle(
        this.player.getBounds(), e.getBounds()
      )){
        this.catchEnemy(e,i);
      }
    });
  }

  catchEnemy(e,i){
    this.pon.play();

    if(!saveData[this.grade].includes(this.currentKanji.kanji)){
      saveData[this.grade].push(this.currentKanji.kanji);
    }

    this.yomiText.setText(
      `訓:${this.currentKanji.kun} / 音:${this.currentKanji.on}`
    );
    this.time.delayedCall(3000,()=>this.yomiText.setText(""));

    this.tweens.add({
      targets:[e,this.enemyTexts[i]],
      alpha:0, scale:0.2, duration:300,
      onComplete:()=>{
        e.setAlpha(1).setScale(1);
        this.enemyTexts[i].setAlpha(1).setScale(1);
        e.x=Phaser.Math.Between(50,750);
        e.y=Phaser.Math.Between(80,450);
      }
    });

    this.pickKanji();
  }
}

// ---------------- CONFIG ----------------
new Phaser.Game({
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: "#dcefff",
  scene: [
    HomeScene,
    GradeScene,
    EnemySelectScene,
    GameScene,
    ZukanScene
  ]
});
