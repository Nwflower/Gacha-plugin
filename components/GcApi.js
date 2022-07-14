import { Cfg, Gcfun } from "./index.js";
import lodash from "lodash";

//抽取到角色的星级
export function getagachastar(gachaData, type){
  let [x, y] = ["gacha.c5", "gacha.c4"];
  let [dx, dy] = [60, 510];
  if (type === "weapon") {
    [x, y] = ["gacha.w5", "gacha.w4"];
    [dx, dy] = [70, 600];
  }
  let tmpChance5 = type === "character" ? Gcfun.getthechance(getChance(x, dx), gachaData.num5, gachaData.week.num) : Gcfun.gettheweaponchance(getChance(x, dx), gachaData.weapon.num5, gachaData.week.num);
  //抽中五星
  if (getRandomInt(10000) <= tmpChance5) {
    return 5;
  }
  let tmpChance4 = Gcfun.getthechance4(getChance(y, dy), gachaData.weapon.num4);
  //抽中四星
  if (getRandomInt(10000) <= tmpChance4) {
    return 4;
  }
  //随机三星武器
  return 3;
}

export function getTimes(e){
  let each = e.msg.replace(/(0|1|[武器池]*|十|抽|单|连|卡|奖|2|3)/g, "").trim();
  let replaceArr = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "百"];
  for (let i = 0; i <= 9; i++) {
    if (each.indexOf(replaceArr[i]) !== -1) {
      return (i + 1);
    }
  }
  return 1;
}
//检查是否抽取
export function hasGacha(gachaData,e){
  let msg = lodash.truncate(name, { length: 30 });
  if (gachaData.today.role.length > 0) {
    msg += "\n今日五星：";
    if (gachaData.today.role.length >= 4) {
      msg += `${gachaData.today.role.length}个\n`
    } else {
      for (let val of gachaData.today.role) {
        msg += `${val.name}(${val.num})\n`;
      }
    }
    msg = msg.trim("\n");
    if (gachaData.week.num - gachaData.today.role.length >= 1) {
      msg += `\n本周：${gachaData.week.num}个五星`;
    }
  } else {
    if (gachaData.weapon && e.msg.includes("武器")) {
      msg += `今日武器已抽\n累计${gachaData.weapon.num5}抽无五星`;
    } else {
      msg += `今日角色已抽\n累计${gachaData.num5}抽无五星`;
    }
    if (gachaData.week.num >= 2) {
      msg += `\n本周：${gachaData.week.num}个五星`;
    }
  }
  return msg;
}

//返回随机整数
export function getRandomInt(max = 10000) {
  return Math.floor(Math.random() * max);
}

//获取概率
function getChance(key, config){
  return Cfg.get(key, config);
}
