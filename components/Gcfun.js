import fs from "fs";

const _path = process.cwd();
const gachaPath = `${_path}/plugins/gacha-plugin/resources/gacha/gacha.json`;
const gachadefaultPath = `${_path}/plugins/gacha-plugin/resources/gacha/gacha_default.json`;


try {
  if (!fs.existsSync(gachaPath)) {
    fs.writeFileSync(gachaPath, fs.readFileSync(gachadefaultPath, "utf8"));
  }
} catch (e) {
}

let Gcfun = {

  getgacha(game,type){
    let gachaConfig= JSON.parse(fs.readFileSync(gachaPath, "utf8"));
    return gachaConfig.game.type;
  },

  getthechance(chance_default,gachanum,gdwn){

    let tmpChance5 = chance_default;

    //增加双黄概率
    if ( gdwn == 1) {
      tmpChance5 = chance_default * 2;
    }
    //90次都没中五星
    if (gachanum >= 90) {
      tmpChance5 = 10000;
    }
    //74抽后逐渐增加概率
    else if (gachanum >= 74) {
      tmpChance5 = chance_default + (gachanum - 73) * 530;
    }
    //60抽后逐渐增加概率
    else if (gachanum >= 60) {
      tmpChance5 = chance_default + (gachanum - 60) * 40;
    }
    return tmpChance5;
  },

  gettheweaponchance(chance_default,gachanum,gdwn){
    let tmpChance5 = chance_default;
    if ( gdwn == 1) {
      tmpChance5 = chance_default * 3;
    }
    if (gachanum >= 80) {
      tmpChance5 = 10000;
    }
    else if (gachanum >= 62) {
      tmpChance5 = chance_default + (gachanum - 61) * 700;
    }
    else if (gachanum >= 50) {
      tmpChance5 = chance_default + (gachanum - 60) * 40;
    }
    else if (gachanum >= 45) {
      tmpChance5 = chance_default + (gachanum - 45) * 60;
    }
    else if (gachanum >= 10 && gachanum <= 20) {
      tmpChance5 = chance_default + (gachanum - 10) * 30;
    }
    return tmpChance5;
  },

  getthechance4(chance_default,gachanum){
    let tmpChance4 = chance_default;
    if(gachanum>=9){
      tmpChance4 = 10000;
    }else if(gachanum>=5){
      tmpChance4 = chance_default+ Math.pow(gachanum - 4, 2) * 500;
    }
     return tmpChance4;
  }


};

export default Gcfun;
