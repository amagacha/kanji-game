const WIDTH = 800;
const HEIGHT = 500;

let saveData = JSON.parse(localStorage.getItem("zukan")) || {
  1:[],2:[],3:[],4:[],5:[],6:[]
};

// ---------------- HOME ----------------
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

// ---------------- GRADE ----------------
class GradeScene extends Phaser.Scene {
  constructor(){ super("grade"); }
  create(){
    this.add.text(260,40,"学年をえらんでね",{fontSize:"28px",color:"#000"});
    for(let i=1;i<=6;i++){
      this.btn(300,80+i*45,`小学${i}年`,
        ()=>this.scene.start("difficulty",{grade:i}));
    }
  }
  btn(x,y,t,cb){
    let r=this.add.rectangle(x+100,y+20,200,40,0xaaaaaa).setInteractive();
    this.add.text(x+30,y+5,t,{fontSize:"20px",color:"#000"});
    r.on("pointerup",cb);
  }
}

// ---------------- DIFFICULTY ----------------
class DifficultyScene extends Phaser.Scene {
  constructor(){ super("difficulty"); }
  init(d){ this.grade=d.grade; }
  create(){
    this.add.text(260,80,"むずかしさ",{fontSize:"28px",color:"#000"});
    this.btn(300,180,"やさしい",()=>this.scene.start("game",{grade:this.grade,mode:"easy"}));
    this.btn(300,240,"ふつう",()=>this.scene.start("game",{grade:this.grade,mode:"normal"}));
  }
  btn(x,y,t,cb){
    let r=this.add.rectangle(x+100,y+25,200,50,0xaaaaaa).setInteractive();
    this.add.text(x+50,y+10,t,{fontSize:"22px",color:"#000"});
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
    this.mode=d.mode;
  }

  preload(){
    this.load.json("kanji",`kanji_${this.grade}.json`);
  }

  create(){
    this.kanjiList=this.cache.json.get("kanji");
    this.player=this.add.rectangle(400,250,40,40,0xff5555);

    this.enemy=this.add.rectangle(200,200,60,60,0x5078ff);
    this.enemyText=this.add.text(0,0,"",{fontSize:"32px",color:"#fff"}).setOrigin(0.5);

    this.pickKanji();

    this.timeLeft = this.mode==="easy" ? 90 : 60;
    this.enemySpeed = this.mode==="easy" ? 0.25 : 0.45;

    this.timerText=this.add.text(10,10,"",{fontSize:"20px",color:"#000"});
    this.yomiText=this.add.text(200,20,"",{fontSize:"20px",color:"#000"});

    // バーチャルスティック
    this.stickBase=null;
    this.stickKnob=null;

    this.input.on("pointerdown",p=>{
      if(p.x<WIDTH/2){
        this.stickBase=this.add.circle(p.x,p.y,50,0x999999,0.4);
        this.stickKnob=this.add.circle(p.x,p.y,20,0x666666,0.7);
      }
    });

    this.input.on("pointerup",()=>{
      this.stickBase?.destroy();
      this.stickKnob?.destroy();
      this.stickBase=this.stickKnob=null;
    });

    this.input.on("pointermove",p=>{
      if(this.stickBase){
        let dx=p.x-this.stickBase.x;
        let dy=p.y-this.stickBase.y;
        let d=Math.hypot(dx,dy);
        if(d>40){ dx*=40/d; dy*=40/d; }
        this.stickKnob.setPosition(this.stickBase.x+dx,this.stickBase.y+dy);
        this.player.x+=dx*0.05;
        this.player.y+=dy*0.05;
      }
    });
  }

  pickKanji(){
    this.currentKanji=Phaser.Utils.Array.GetRandom(this.kanjiList);
    this.enemyText.setText(this.currentKanji.kanji);
  }

  update(){
    this.timerText.setText(`のこり${this.timeLeft}秒`);
    let dx=this.player.x-this.enemy.x;
    let dy=this.player.y-this.enemy.y;
    let d=Math.hypot(dx,dy)+0.01;
    this.enemy.x+=dx/d*this.enemySpeed;
    this.enemy.y+=dy/d*this.enemySpeed;
    this.enemyText.setPosition(this.enemy.x,this.enemy.y);

    if(Phaser.Geom.Intersects.RectangleToRectangle(
      this.player.getBounds(),this.enemy.getBounds()
    )){
      if(!saveData[this.grade].includes(this.currentKanji.kanji)){
        saveData[this.grade].push(this.currentKanji.kanji);
        localStorage.setItem("zukan",JSON.stringify(saveData));
      }
      this.yomiText.setText(`訓:${this.currentKanji.kun} 音:${this.currentKanji.on}`);
      this.time.delayedCall(3000,()=>this.yomiText.setText(""));
      this.pickKanji();
      this.enemy.x=Phaser.Math.Between(50,750);
      this.enemy.y=Phaser.Math.Between(80,450);
    }
  }
}

// ---------------- START ----------------
new Phaser.Game({
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: "#dcefff",
  scene: [HomeScene,GradeScene,DifficultyScene,GameScene,ZukanScene]
});
