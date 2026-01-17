const WIDTH = 800;
const HEIGHT = 500;

let saveData = JSON.parse(localStorage.getItem("zukan")) || {
  1:[],2:[],3:[],4:[],5:[],6:[]
};

/* ================= ホーム ================= */
class HomeScene extends Phaser.Scene {
  constructor(){ super("home"); }
  create(){
    this.add.text(260,80,"漢字おにごっこ",{fontSize:"36px",color:"#000"});
    this.makeBtn(300,200,"スタート",()=>this.scene.start("grade"));
    this.makeBtn(300,260,"図鑑",()=>this.scene.start("zukan"));
  }
  makeBtn(x,y,text,cb){
    let r=this.add.rectangle(x+100,y+25,200,50,0xaaaaaa).setInteractive();
    this.add.text(x+40,y+10,text,{fontSize:"24px",color:"#000"});
    r.on("pointerup",cb);
  }
}

/* ================= 学年選択 ================= */
class GradeScene extends Phaser.Scene {
  constructor(){ super("grade"); }
  create(){
    this.add.text(260,40,"学年をえらんでね",{fontSize:"28px",color:"#000"});
    for(let i=1;i<=6;i++){
      this.makeBtn(300,80+i*45,`小学${i}年`,
        ()=>this.scene.start("game",{grade:i, enemyCount:3})
      );
    }
    this.makeBtn(300,HEIGHT-60,"ホームへ",()=>this.scene.start("home"));
  }
  makeBtn(x,y,text,cb){
    let r=this.add.rectangle(x+100,y+20,200,40,0xaaaaaa).setInteractive();
    this.add.text(x+30,y+5,text,{fontSize:"20px",color:"#000"});
    r.on("pointerup",cb);
  }
}

/* ================= 図鑑 ================= */
class ZukanScene extends Phaser.Scene {
  constructor(){ super("zukan"); }
  create(){
    this.add.text(300,20,"かんじずかん",{fontSize:"30px",color:"#000"});
    let y=70;
    for(let g=1;g<=6;g++){
      let line=`${g}年： `;
      saveData[g].forEach(k=>line+=k+" ");
      this.add.text(40,y,line,{fontSize:"18px",color:"#000"});
      y+=35;
    }
    this.makeBtn(300,HEIGHT-60,"ホームへ",()=>this.scene.start("home"));
  }
  makeBtn(x,y,text,cb){
    let r=this.add.rectangle(x+100,y+20,200,40,0xaaaaaa).setInteractive();
    this.add.text(x+40,y+5,text,{fontSize:"20px",color:"#000"});
    r.on("pointerup",cb);
  }
}

/* ================= ゲーム本体 ================= */
class GameScene extends Phaser.Scene {
  constructor(){ super("game"); }
  init(data){
    this.grade=data.grade;
    this.enemyCount=data.enemyCount || 3;
  }

  preload(){
    this.load.json("kanji",`kanji/kanji_${this.grade}.json`);
  }

  create(){
    /* ----- 基本 ----- */
    this.timeLeft = 60;
    this.kanjiList = this.cache.json.get("kanji");

    /* ----- プレイヤー ----- */
    this.player = this.add.rectangle(400,250,40,40,0xff5555);

    /* ----- 敵 ----- */
    this.enemies=[];
    this.enemyTexts=[];
    this.enemyDirs=[];

    for(let i=0;i<this.enemyCount;i++){
      let e=this.add.rectangle(
        Math.random()*600+100,
        Math.random()*300+100,
        60,60,0x5078ff
      );
      let t=this.add.text(e.x,e.y,"",{fontSize:"32px",color:"#fff"}).setOrigin(0.5);

      this.enemies.push(e);
      this.enemyTexts.push(t);
      this.enemyDirs.push({
        x: Phaser.Math.FloatBetween(-1,1),
        y: Phaser.Math.FloatBetween(-1,1)
      });
    }

    this.pickKanji();

    /* ----- 表示 ----- */
    this.timerText=this.add.text(10,10,"のこり60秒",{fontSize:"20px",color:"#000"});
    this.yomiText=this.add.text(200,20,"",{fontSize:"20px",color:"#000"});

    /* ----- タイマー ----- */
    this.time.addEvent({
      delay:1000,
      loop:true,
      callback:()=>{
        this.timeLeft--;
        this.timerText.setText(`のこり${this.timeLeft}秒`);
        if(this.timeLeft<=0){
          localStorage.setItem("zukan",JSON.stringify(saveData));
          this.scene.start("home");
        }
      }
    });

    /* ----- タッチ移動（どこでもOK） ----- */
    this.input.on("pointermove",p=>{
      if(p.isDown){
        this.player.x += (p.x-this.player.x)*0.1;
        this.player.y += (p.y-this.player.y)*0.1;
      }
    });
  }

  pickKanji(){
    let k=Phaser.Utils.Array.GetRandom(this.kanjiList);
    this.currentKanji=k;
    this.enemyTexts.forEach(t=>t.setText(k.kanji));
  }

  update(){
    /* ===== 敵は追ってこない（ランダム移動） ===== */
    this.enemies.forEach((e,i)=>{
      let dir=this.enemyDirs[i];
      e.x+=dir.x*0.5;
      e.y+=dir.y*0.5;

      if(e.x<40||e.x>WIDTH-40) dir.x*=-1;
      if(e.y<80||e.y>HEIGHT-40) dir.y*=-1;

      this.enemyTexts[i].setPosition(e.x,e.y);

      /* ----- 当たり判定 ----- */
      if(Phaser.Geom.Intersects.RectangleToRectangle(
        this.player.getBounds(),e.getBounds()
      )){
        if(!saveData[this.grade].includes(this.currentKanji.kanji)){
          saveData[this.grade].push(this.currentKanji.kanji);
        }

        this.yomiText.setText(
          `訓:${this.currentKanji.kun} / 音:${this.currentKanji.on}`
        );
        this.time.delayedCall(3000,()=>this.yomiText.setText(""));

        this.pickKanji();
        e.x=Math.random()*600+100;
        e.y=Math.random()*300+100;
      }
    });
  }
}

/* ================= 起動 ================= */
const config={
  type:Phaser.AUTO,
  width:WIDTH,
  height:HEIGHT,
  backgroundColor:"#dcefff",
  scene:[HomeScene,GradeScene,GameScene,ZukanScene]
};

new Phaser.Game(config);
