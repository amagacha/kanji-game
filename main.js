const WIDTH = 800;
const HEIGHT = 500;

let moveX = 0;
let moveY = 0;
let dash = false;

let saveData = JSON.parse(localStorage.getItem("zukan")) || {
  1:[],2:[],3:[],4:[],5:[],6:[]
};

/* ---------- ホーム ---------- */
class HomeScene extends Phaser.Scene {
  constructor(){ super("home"); }
  create(){
    this.add.text(260,100,"漢字おにごっこ",{fontSize:"36px",color:"#000"});
    this.makeBtn(300,220,"スタート",()=>this.scene.start("grade"));
    this.makeBtn(300,280,"図鑑",()=>this.scene.start("zukan"));
  }
  makeBtn(x,y,text,cb){
    let r=this.add.rectangle(x+100,y+25,200,50,0xaaaaaa).setInteractive();
    this.add.text(x+40,y+10,text,{fontSize:"24px",color:"#000"});
    r.on("pointerup",cb);
  }
}

/* ---------- 学年 ---------- */
class GradeScene extends Phaser.Scene {
  constructor(){ super("grade"); }
  create(){
    this.add.text(260,40,"学年をえらんでね",{fontSize:"28px",color:"#000"});
    for(let i=1;i<=6;i++){
      this.makeBtn(300,80+i*45,`小学${i}年`,()=>this.scene.start("game",{grade:i}));
    }
    this.makeBtn(300,HEIGHT-60,"ホームへ",()=>this.scene.start("home"));
  }
  makeBtn(x,y,text,cb){
    let r=this.add.rectangle(x+100,y+20,200,40,0xaaaaaa).setInteractive();
    this.add.text(x+30,y+5,text,{fontSize:"20px",color:"#000"});
    r.on("pointerup",cb);
  }
}

/* ---------- 図鑑 ---------- */
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

/* ---------- ゲーム ---------- */
class GameScene extends Phaser.Scene {
  constructor(){ super("game"); }
  init(data){ this.grade=data.grade; }

  preload(){
    this.load.json("kanji",`kanji_${this.grade}.json`);
  }

  create(){
    this.timeLeft = 60;
    this.enemySpeed = 0.6;

    this.kanjiList = this.cache.json.get("kanji");

    this.player = this.add.rectangle(400,250,40,40,0xff5555);

    this.enemies = [
      this.add.rectangle(100,100,50,50,0x5078ff),
      this.add.rectangle(700,400,50,50,0x5078ff)
    ];

    this.enemyText = this.add.text(0,0,"",{fontSize:"32px",color:"#fff"}).setOrigin(0.5);

    this.pickKanji();

    this.timerText = this.add.text(10,10,"のこり60秒",{fontSize:"20px",color:"#000"});
    this.yomiText = this.add.text(200,20,"",{fontSize:"20px",color:"#000"});

    this.time.addEvent({
      delay:1000, loop:true,
      callback:()=>{
        this.timeLeft--;
        this.enemySpeed += 0.01; // 時間で速く
        this.timerText.setText(`のこり${this.timeLeft}秒`);
        if(this.timeLeft<=0){
          localStorage.setItem("zukan",JSON.stringify(saveData));
          this.scene.start("home");
        }
      }
    });
  }

  pickKanji(){
    let k = Phaser.Utils.Array.GetRandom(this.kanjiList);
    this.currentKanji = k;
    this.enemyText.setText(k.kanji);
  }

  update(){
    let speed = dash ? 5 : 3;
    this.player.x += moveX * speed;
    this.player.y += moveY * speed;

    this.player.x = Phaser.Math.Clamp(this.player.x,20,WIDTH-20);
    this.player.y = Phaser.Math.Clamp(this.player.y,20,HEIGHT-20);

    this.enemies.forEach(e=>{
      let dx=this.player.x-e.x;
      let dy=this.player.y-e.y;
      let d=Math.hypot(dx,dy)+0.01;
      e.x+=dx/d*this.enemySpeed;
      e.y+=dy/d*this.enemySpeed;

      if(Phaser.Geom.Intersects.RectangleToRectangle(
        this.player.getBounds(), e.getBounds())){

        if(!saveData[this.grade].includes(this.currentKanji.kanji)){
          saveData[this.grade].push(this.currentKanji.kanji);
        }
        this.yomiText.setText(`訓:${this.currentKanji.kun} / 音:${this.currentKanji.on}`);
        this.time.delayedCall(2500,()=>this.yomiText.setText(""));
        this.pickKanji();
        e.x=Math.random()*700+50;
        e.y=Math.random()*350+80;
      }
    });

    this.enemyText.setPosition(this.enemies[0].x,this.enemies[0].y);
  }
}

/* ---------- Phaser設定 ---------- */
const config={
  type:Phaser.AUTO,
  width:WIDTH,
  height:HEIGHT,
  backgroundColor:"#dcefff",
  scene:[HomeScene,GradeScene,GameScene,ZukanScene]
};

new Phaser.Game(config);

/* ---------- バーチャルスティック ---------- */
const stick=document.getElementById("stick");
const inner=document.getElementById("stickInner");
let active=false;

stick.addEventListener("touchstart",e=>{active=true});
stick.addEventListener("touchend",e=>{
  active=false; moveX=0; moveY=0;
  inner.style.left="40px"; inner.style.top="40px";
});
stick.addEventListener("touchmove",e=>{
  if(!active)return;
  let r=stick.getBoundingClientRect();
  let x=e.touches[0].clientX-(r.left+60);
  let y=e.touches[0].clientY-(r.top+60);
  let d=Math.hypot(x,y);
  if(d>40){x*=40/d;y*=40/d;}
  inner.style.left=(40+x)+"px";
  inner.style.top=(40+y)+"px";
  moveX=x/40;
  moveY=y/40;
});

document.getElementById("dashBtn").ontouchstart=()=>dash=true;
document.getElementById("dashBtn").ontouchend=()=>dash=false;
