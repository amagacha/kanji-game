const WIDTH = 800;
const HEIGHT = 500;

/* ================= セーブ ================= */
let saveData = JSON.parse(localStorage.getItem("zukan")) || {
  1:[],2:[],3:[],4:[],5:[],6:[]
};

/* ================= 難易度 ================= */
const DIFFICULTY = {
  easy:   { label:"やさしい", enemies:1, speed:0.3, time:90 },
  normal: { label:"ふつう", enemies:3, speed:0.5, time:60 },
  hard:   { label:"むずかしい", enemies:5, speed:0.8, time:45 }
};

/* ================= ホーム ================= */
class HomeScene extends Phaser.Scene {
  constructor(){ super("home"); }
  create(){
    this.add.text(260,80,"漢字おにごっこ",{fontSize:"36px",color:"#000"});
    this.btn(300,200,"スタート",()=>this.scene.start("grade"));
    this.btn(300,260,"図鑑",()=>this.scene.start("zukan"));
  }
  btn(x,y,t,cb){
    let r=this.add.rectangle(x+100,y+25,200,50,0xaaaaaa).setInteractive();
    this.add.text(x+40,y+10,t,{fontSize:"24px",color:"#000"});
    r.on("pointerup",cb);
  }
}

/* ================= 学年 ================= */
class GradeScene extends Phaser.Scene {
  constructor(){ super("grade"); }
  create(){
    this.add.text(260,40,"学年をえらんでね",{fontSize:"28px",color:"#000"});
    for(let i=1;i<=6;i++){
      this.btn(300,80+i*45,`小学${i}年`,
        ()=>this.scene.start("difficulty",{grade:i})
      );
    }
    this.btn(300,HEIGHT-60,"ホームへ",()=>this.scene.start("home"));
  }
  btn(x,y,t,cb){
    let r=this.add.rectangle(x+100,y+20,200,40,0xaaaaaa).setInteractive();
    this.add.text(x+30,y+5,t,{fontSize:"20px",color:"#000"});
    r.on("pointerup",cb);
  }
}

/* ================= 難易度 ================= */
class DifficultyScene extends Phaser.Scene {
  constructor(){ super("difficulty"); }
  init(d){ this.grade=d.grade; }
  create(){
    this.add.text(260,60,"むずかしさ",{fontSize:"28px",color:"#000"});
    let y=160;
    Object.keys(DIFFICULTY).forEach(k=>{
      let d=DIFFICULTY[k];
      this.btn(300,y,d.label,()=>{
        this.scene.start("game",{grade:this.grade, diff:k});
      });
      y+=70;
    });
    this.btn(300,HEIGHT-60,"もどる",()=>this.scene.start("grade"));
  }
  btn(x,y,t,cb){
    let r=this.add.rectangle(x+100,y+25,200,50,0xaaaaaa).setInteractive();
    this.add.text(x+60,y+10,t,{fontSize:"22px",color:"#000"});
    r.on("pointerup",cb);
  }
}

/* ================= 図鑑 ================= */
class ZukanScene extends Phaser.Scene {
  constructor(){ super("zukan"); }
  create(){
    this.add.text(300,20,"かんじずかん",{fontSize:"30px",color:"#000"});
    let y=80;
    for(let g=1;g<=6;g++){
      let x=40;
      this.add.text(20,y,`${g}年`,{fontSize:"18px",color:"#000"});
      saveData[g].forEach(k=>{
        let t=this.add.text(x,y,k,{fontSize:"22px",color:"#000"})
          .setInteractive();
        t.on("pointerup",()=>{
          t.setText(t.text.includes("（")?k:`${k}（タップ）`);
        });
        x+=30;
      });
      y+=50;
    }
    this.btn(300,HEIGHT-60,"ホームへ",()=>this.scene.start("home"));
  }
  btn(x,y,t,cb){
    let r=this.add.rectangle(x+100,y+20,200,40,0xaaaaaa).setInteractive();
    this.add.text(x+40,y+5,t,{fontSize:"20px",color:"#000"});
    r.on("pointerup",cb);
  }
}

/* ================= ゲーム ================= */
class GameScene extends Phaser.Scene {
  constructor(){ super("game"); }
  init(d){
    this.grade=d.grade;
    this.diffKey=d.diff;
    this.diff=DIFFICULTY[d.diff];
  }
  preload(){
    this.load.json("kanji",`kanji_${this.grade}.json`);
  }
  create(){
    this.timeLeft=this.diff.time;
    this.kanjiList=this.cache.json.get("kanji");
    this.getList=[];
    this.combo=0;

    this.player=this.add.rectangle(400,250,40,40,0xff5555);

    this.enemies=[];
    for(let i=0;i<this.diff.enemies;i++){
      let k=Phaser.Utils.Array.GetRandom(this.kanjiList);
      let e=this.add.rectangle(
        Math.random()*600+100,
        Math.random()*300+100,
        60,60,0x5078ff
      );
      let t=this.add.text(e.x,e.y,k.kanji,{fontSize:"32px",color:"#fff"}).setOrigin(0.5);
      this.enemies.push({
        rect:e,text:t,kanji:k,
        dir:{x:Phaser.Math.FloatBetween(-1,1),y:Phaser.Math.FloatBetween(-1,1)},
        alive:true
      });
    }

    this.timerText=this.add.text(10,10,"",{fontSize:"20px",color:"#000"});
    this.comboText=this.add.text(300,20,"",{fontSize:"22px",color:"#000"});
    this.yomiText=this.add.text(200,50,"",{fontSize:"20px",color:"#000"});

    this.time.addEvent({
      delay:1000,loop:true,
      callback:()=>{
        this.timeLeft--;
        this.timerText.setText(`のこり${this.timeLeft}秒`);
        if(this.timeLeft<=0){
          this.scene.start("result",{
            grade:this.grade,
            list:this.getList
          });
        }
      }
    });

    this.input.on("pointermove",p=>{
      if(p.isDown){
        this.player.x+=(p.x-this.player.x)*0.1;
        this.player.y+=(p.y-this.player.y)*0.1;
      }
    });
  }

  update(){
    this.enemies.forEach(e=>{
      if(!e.alive) return;
      e.rect.x+=e.dir.x*this.diff.speed;
      e.rect.y+=e.dir.y*this.diff.speed;
      if(e.rect.x<40||e.rect.x>WIDTH-40) e.dir.x*=-1;
      if(e.rect.y<80||e.rect.y>HEIGHT-40) e.dir.y*=-1;
      e.text.setPosition(e.rect.x,e.rect.y);

      if(Phaser.Geom.Intersects.RectangleToRectangle(
        this.player.getBounds(),e.rect.getBounds()
      )){
        e.alive=false;
        this.tweens.add({
          targets:[e.rect,e.text],
          alpha:0,scale:0.2,duration:400
        });

        this.combo++;
        this.comboText.setText(
          this.combo>=3?`${this.combo}れんぞく！`:""
        );

        this.yomiText.setText(
          `訓:${e.kanji.kun} / 音:${e.kanji.on}`
        );
        this.time.delayedCall(3000,()=>this.yomiText.setText(""));

        if(!saveData[this.grade].includes(e.kanji.kanji)){
          saveData[this.grade].push(e.kanji.kanji);
        }
        this.getList.push(e.kanji);
        localStorage.setItem("zukan",JSON.stringify(saveData));
      }
    });
  }
}

/* ================= リザルト ================= */
class ResultScene extends Phaser.Scene {
  constructor(){ super("result"); }
  init(d){ this.grade=d.grade; this.list=d.list; }
  create(){
    this.add.text(260,40,"けっか",{fontSize:"30px",color:"#000"});
    let y=100;
    this.list.forEach(k=>{
      this.add.text(200,y,`${k.kanji}  ${k.kun}/${k.on}`,
        {fontSize:"22px",color:"#000"});
      y+=30;
    });
    this.btn(300,HEIGHT-80,"ホームへ",()=>this.scene.start("home"));
  }
  btn(x,y,t,cb){
    let r=this.add.rectangle(x+100,y+25,200,50,0xaaaaaa).setInteractive();
    this.add.text(x+40,y+10,t,{fontSize:"22px",color:"#000"});
    r.on("pointerup",cb);
  }
}

/* ================= 起動 ================= */
new Phaser.Game({
  type:Phaser.AUTO,
  width:WIDTH,
  height:HEIGHT,
  backgroundColor:"#dcefff",
  scene:[
    HomeScene,GradeScene,DifficultyScene,
    GameScene,ResultScene,ZukanScene
  ]
});
