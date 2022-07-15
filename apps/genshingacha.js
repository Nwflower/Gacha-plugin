import { getPluginRender } from "../../../lib/render.js";
import { segment } from "oicq";
import lodash from "lodash";
import fs from "fs";
import { Cfg } from "../components/index.js";
import { getagachastar, getTimes, hasGacha } from "../components/GcApi.js";
export const rule = {
  Genshingacha: {
    reg: "^#*(10|[武器池]*([一二三四五六七八九]?[十百]+)|抽|单)[连抽卡奖][123武器池]*$",
    priority: 10,
    describe: "【十连，十连2，十连武器】模拟原神抽卡",
  },
  weaponBing: {
    reg: "^#*定轨$", //匹配的正则
    priority: 99, //优先级，越小优先度越高
    describe: "【定轨】武器池定轨", //描述说明
  },
};

//创建html文件夹
if (!fs.existsSync(`./data/html/genshin/gacha/`)) {
  fs.mkdirSync(`./data/html/genshin/gacha/`);
}

const _path = process.cwd();
const gachaPath = `${_path}/plugins/gacha-plugin/resources/gacha/gacha.json`;
const gachadefaultPath = `${_path}/plugins/gacha-plugin/resources/gacha/gacha_default.json`;
try {
  if (!fs.existsSync(gachaPath)) {
    fs.writeFileSync(gachaPath, fs.readFileSync(gachadefaultPath, "utf8"));
  }
} catch (e) {
}
let gachaChizi= JSON.parse(fs.readFileSync(`${_path}/plugins/gacha-plugin/resources/gacha/gacha.json`, "utf8"));

//五星角色
let role5 = gachaChizi.genshin.role5;
//五星武器
let weapon5 = gachaChizi.genshin.weapon5;
//四星角色
let role4 = gachaChizi.genshin.role4;
//四星武器
let weapon4 = gachaChizi.genshin.weapon4;
//三星武器
let weapon3 = gachaChizi.genshin.weapon3;

//回复统计
let count = {};
let gachaConfig = {};
let element = {};
let genshin = {};

await init();

export async function init(isUpdate) {


  gachaConfig = JSON.parse(fs.readFileSync("./config/genshin/gacha.json", "utf8"));
  element = JSON.parse(fs.readFileSync("./config/genshin/element.json", "utf8"));
  let version = isUpdate ? new Date().getTime() : 0;
  genshin = await import(`../../../config/genshin/roleId.js?version=${version}`);
  count = {};
}

//#十连
export async function Genshingacha(e) {
  if (e.img || e.hasReply || !Cfg.get("gacha.DIY", true) || Cfg.get("gacha.type", 1) !== 1) {
    return;
  }
  let user_id = e.user_id;
  let name = e.sender.card;
  let type = e.msg.includes("武器") ? "weapon" : "role";

  let upType = 1;
  if (e.msg.indexOf("2") !== -1) {
    upType = 2; //角色up卡池2
  }
  if (e.msg.indexOf("3") !== -1) {
    upType = 3;
  }


  //每日抽卡次数
  let dayNum = e.groupConfig.gachaDayNum || 1;
  //角色，武器抽卡限制是否分开
  let LimitSeparate = e.groupConfig.LimitSeparate || 0;
  let key = `genshin:gacha:${user_id}`;
  let gachaData = await global.redis.get(key);

  //获取结算时间
  let end = getEnd();

  if (!count[end.dayEnd]) {
    count = {};
    count[end.dayEnd] = {};
  }
  if (count[end.dayEnd][user_id]) {
    count[end.dayEnd][user_id]++;
  } else {
    count[end.dayEnd][user_id] = 1;
  }

  if (!e.isMaster && count[end.dayEnd][user_id] && count[end.dayEnd][user_id] > Number(dayNum) * (LimitSeparate + 1) + 2) {
    if (count[end.dayEnd][user_id] <= Number(dayNum) * (LimitSeparate + 1) + 4) {
      e.reply(`每天只能抽${dayNum}次`);
    }
    return true;
  }

  if (!gachaData) {
    gachaData = {
      num4: 0, //4星保底数
      isUp4: 0, //是否4星大保底
      num5: 0, //5星保底数
      isUp5: 0, //是否5星大保底
      week: { num: 0, expire: end.weekEnd },
      today: { role: [], expire: end.dayEnd, num: 0, weaponNum: 0 },
      weapon: {
        num4: 0, //4星保底数
        isUp4: 0, //是否4星大保底
        num5: 0, //5星保底数
        isUp5: 0, //是否5星大保底
        lifeNum: 0, //命定值
        type: 1, //0-取消 1-武器1 2-武器2
      },
    };
  } else {
    gachaData = JSON.parse(gachaData);
    if (new Date().getTime() >= gachaData.today.expire) {
      gachaData.today = { num: 0, weaponNum: 0, role: [], expire: end.dayEnd };
    }
    if (new Date().getTime() >= gachaData.week.expire) {
      gachaData.week = { num: 0, expire: end.weekEnd };
    }
  }
  let todayNum = gachaData.today.num;
  if (type === "weapon" && LimitSeparate) {
    todayNum = gachaData.today.weaponNum;
  }

  //如果次数已经用完,回复消息、返回true不再向下执行
  if (todayNum >= dayNum && !e.isMaster) {
    e.reply(hasGacha(gachaData,e));
    return true;
  }

  let { up4, up5, upW4, upW5, poolName } = getNowPool(upType);
  if (e.msg.includes("武器")) {
    return gachaWeapon(e, gachaData, upW4, upW5);
  }
  //去除当前up的四星
  role4 = lodash.difference(role4, up4);


  let gachatimes = getTimes(e);

  if (dayNum < todayNum + gachatimes && !e.isMaster) {
    e.reply("你今天已经抽了很多次了哦~");
    return true;
  }
  let thegachadata = [];
  let res5global = true, res4global = true;
  for (let shiliancishu = 0; shiliancishu < gachatimes; shiliancishu++) {

    //每日抽卡数+1
    gachaData.today.num++;
    //数据重置
    let res5 = [], resC4 = [], resW4 = [], resW3 = [];

    //是否大保底
    let isBigUP = false;
    //循环十次
    for (let i = 1; i <= 10; i++) {
      let star = getagachastar(gachaData, "character");
      gachaData.num5++;
      gachaData.num4++;
      let thisgacha;
      switch (star) {
        case 5:
          let nowCardNum = gachaData.num5;
          gachaData.num5 = 0;
          thisgacha = getACharacter5(gachaData, Cfg.get("gacha.wai", 50), up5, role5);
          gachaData = thisgacha.returnData;
          gachaData.today.role.push({ name: thisgacha.name, num: nowCardNum });
          gachaData.week.num++;
          isBigUP = thisgacha.BigUP;
          redisPushData(res5, thisgacha.name, 5, "character", nowCardNum);
          break;
        case 4:
          gachaData.num4 = 0;
          thisgacha = geta4(gachaData, up4, role4, weapon4, "character");
          gachaData = thisgacha.returnData;
          if (thisgacha.types === "character") {
            redisPushData(resC4, thisgacha.name, 4, "character", undefined);
          } else {
            redisPushData(resW4, thisgacha.name, 4, "weapon", undefined);
          }
          break;
        default:
          //随机三星武器
          redisPushData(resW3, weapon3[getRandomInt(weapon3.length)], 3, "weapon", undefined);
          break;
      }
    }

    let list = [...res5, ...resC4, ...resW4, ...resW3];

    let info = `累计「${gachaData.num5}抽」`;

    if (res5.length > 0) {
      let role5 = res5[res5.length - 1];
      info = `${role5.name}「${role5.num}抽」`;
      if (isBigUP) {
        info += "大保底";
      }
    } else if (res5.length >= 4) {
      info = "";
    }

    let base64 = await getPluginRender("gacha-plugin")("gacha", "genshin", {
      save_id: user_id,
      name: name,
      info: info,
      list: list,
      poolName: poolName,
      fiveNum: res5.length,
    });
    thegachadata.push(base64);
    if (base64) {
      await redis.set(key, JSON.stringify(gachaData), {
        EX: end.keyEnd,
      });
    }
    if (res5.length > 0) res5global = false;
    if (resC4.length >= 4) res4global = false;
  }

  let msgimage = [];
  let tomsg = [];

  for (let shiliancishu = 0; shiliancishu < gachatimes; shiliancishu++) {
    let image = segment.image(`base64://${thegachadata[shiliancishu]}`);
    msgimage.push(image);
    tomsg.push({
      message: image,
      nickname: Bot.nickname,
      user_id: Bot.uin
    })
  }
  let msg = [...msgimage];
  let msgRes = {};
  if (gachatimes === 1 || !Cfg.get("gacha.mode", true) || !e.isGroup) {
    msgRes = await e.reply(msg);
  } else {
    msgRes = await e.reply(await e.group.makeForwardMsg(tomsg));
  }

  if (msgRes && msgRes.message_id && e.isGroup && e.groupConfig.delMsg && res5global && res4global) {
    setTimeout(() => {
      e.group.recallMsg(msgRes.message_id);
    }, e.groupConfig.delMsg);
  }


  return true;
}

function getNowPool(upType) {
  let end, up4, up5, upW4, upW5, poolName, raw_up5;
  gachaChizi = JSON.parse(fs.readFileSync(`${_path}/plugins/gacha-plugin/resources/gacha/gacha.json`, "utf8"));
  //数据过时，刷新

  if(upType === 3 ){
    end = lodash.sample(gachaConfig);
    upType = lodash.random(1, 2);
  }else {
    end = gachaChizi.genshinUp;
  }

  up4 = end.up4;
  if (upType === 1) {
    up5 = end.up5;
  } else {
    up5 = end.up5_2;
  }
  upW4 = end.weapon4;
  upW5 = end.weapon5;

  poolName = genshin.abbr[up5[0]] ? genshin.abbr[up5[0]] : up5[0];
  poolName = `角色池:${poolName}`;
  raw_up5 = [...end.up5, ...end.up5_2];
  return { up4, up5, upW4, upW5, poolName, raw_up5 }
}

//返回随机整数
function getRandomInt(max = 10000) {
  return Math.floor(Math.random() * max);
}

function getEnd() {
  let now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let day = now.getDate();
  let dayEnd ;
  //每日数据-凌晨4点更新
  if (now.getHours() < 4) {
    dayEnd = new Date(year, month, day, "03", "59", "59").getTime();
  } else {
    dayEnd = new Date(year, month, day, "23", "59", "59").getTime() + 3600 * 4 * 1000;
  }
  //每周结束时间
  let weekEnd = dayEnd + 86400 * (7 - now.getDay()) * 1000;
  //redis过期时间
  let keyEnd = Math.ceil((dayEnd + 86400 * 5 * 1000 - now.getTime()) / 1000);

  return { dayEnd, weekEnd, keyEnd };
}

//#十连武器
async function gachaWeapon(e, gachaData, upW4, upW5) {
  let user_id = e.user_id;
  //角色，武器抽卡限制是否分开
  let LimitSeparate = e.groupConfig.LimitSeparate || 0;

  if (!gachaData.weapon) {
    gachaData.weapon = {
      num4: 0, //4星保底数
      isUp4: 0, //是否4星大保底
      num5: 0, //5星保底数
      isUp5: 0, //是否5星大保底
      lifeNum: 0, //命定值
      type: 1, //0-取消 1-武器1 2-武器2
      bingWeapon: upW5[0],
    };
  } else {
    if (gachaData.weapon.bingWeapon) {
      if (!upW5.includes(gachaData.weapon.bingWeapon)) {
        gachaData.weapon.bingWeapon = upW5[0];
        gachaData.weapon.type = 1;
        gachaData.weapon.lifeNum = 0;
      }
    } else if (gachaData.weapon.type === 1) {
      gachaData.weapon.bingWeapon = upW5[0];
      gachaData.weapon.lifeNum = 0;
    }
  }

  let bingWeapon;
  if (gachaData.weapon.type > 0) {
    if (upW5[gachaData.weapon.type - 1]) {
      bingWeapon = upW5[gachaData.weapon.type - 1];
    }
  }

  //去除当前up的四星
  weapon4 = lodash.difference(weapon4, upW4);
  weapon5 = lodash.difference(weapon5, upW5);



  let gachatimes = getTimes(e);

  let thegachadata = [];
  let res5global = true, res4global = true;

  for (let shiliancishu = 0; shiliancishu < gachatimes; shiliancishu++) {
    let res5 = [], resC4 = [], resW4 = [], resW3 = [];
    let isBigUP = false; //是否大保底
    let isBing = false; //是否定轨获取
    if (LimitSeparate) {
      if (!gachaData.today.weaponNum) {
        gachaData.today.weaponNum = 0;
      }
      gachaData.today.weaponNum++;
    } else {
      if (!gachaData.today.Num) {
        gachaData.today.num = 0;
      }
      gachaData.today.num++;
    }
    //循环十次
    for (let i = 1; i <= 10; i++) {
      let star = getagachastar(gachaData, "weapon");
      gachaData.weapon.num5++;
      gachaData.weapon.num4++;
      let thisgacha;
      switch (star) {
        case 5:
          let nowCardNum = gachaData.weapon.num5;
          gachaData.weapon.num5 = 0;

          let tmpUp = 75;
          if (gachaData.weapon.isUp5 === 1) {
            tmpUp = 100;
          }
          let tmp_name = "";
          if (gachaData.weapon.lifeNum >= 2) {
            tmp_name = bingWeapon;
            gachaData.weapon.lifeNum = 0;
            isBing = true;
            isBigUP = false;
          }
          //当祈愿获取到5星武器时，有75%的概率为本期UP武器
          else if (getRandomInt(100) <= tmpUp) {
            isBigUP = gachaData.weapon.isUp5 === 1;
            //大保底清零
            gachaData.weapon.isUp5 = 0;
            //up 5星
            tmp_name = upW5[getRandomInt(upW5.length)];
            if (tmp_name === bingWeapon) {
              gachaData.weapon.lifeNum = 0;
            }
            isBing = false;
          } else {
            //大保底
            gachaData.weapon.isUp5 = 1;
            tmp_name = weapon5[getRandomInt(weapon5.length)];
            isBigUP = false;
            isBing = false;
          }
          if (gachaData.weapon.type > 0 && tmp_name !== bingWeapon) {
            gachaData.weapon.lifeNum++;
          }
          gachaData.today.role.push({ name: tmp_name, num: nowCardNum });
          gachaData.week.num++;
          redisPushData(res5, tmp_name, 5, "weapon", nowCardNum);
          break;
        case 4:
          gachaData.weapon.num4 = 0;
          thisgacha = geta4(gachaData, upW4, role4, weapon4, "weapon");
          gachaData = thisgacha.returnData;
          if (thisgacha.types === "character") {
            redisPushData(resC4, thisgacha.name, 4, "character", undefined);
          } else {
            redisPushData(resW4, thisgacha.name, 4, "weapon", undefined);
          }
          break;
        default:
          //随机三星武器
          redisPushData(resW3, weapon3[getRandomInt(weapon3.length)], 3, "weapon", undefined);
          break;
      }
    }
    let key = `genshin:gacha:${user_id}`;
    await global.redis.set(key, JSON.stringify(gachaData), {
      EX: getEnd().keyEnd,
    });
    let list = [...res5, ...resC4, ...resW4, ...resW3];
    let info = `累计「${gachaData.weapon.num5}抽」`;

    if (res5.length > 0) {
      let role5 = res5[res5.length - 1];
      info = `${role5.name}「${role5.num}抽」`;
    }
    if (isBing) {
      info += "定轨";
    }
    if (isBigUP) {
      info += "大保底";
    }
    let base64 = await getPluginRender("gacha-plugin")("gacha", "genshin", {
      save_id: user_id,
      name: e.sender.card,
      info: info,
      list: list,
      isWeapon: true,
      bingWeapon: bingWeapon,
      lifeNum: gachaData.weapon.lifeNum,
      fiveNum: res5.length,
    });
    thegachadata.push(base64);
    if (res5.length > 0) res5global = false;
    if (resC4.length >= 4) res4global = false;
  }

  let msgimage = [];
  let tomsg = [];
  for (let shiliancishu = 0; shiliancishu < gachatimes; shiliancishu++) {
    let image = segment.image(`base64://${thegachadata[shiliancishu]}`);
    msgimage.push(image);
    tomsg.push({
      message: image,
      nickname: Bot.nickname,
      user_id: Bot.uin
    })
  }
  let msg = [...msgimage];
  let msgRes = {};
  if (gachatimes === 1 || !Cfg.get("gacha.mode", true) || !e.isGroup) {
    msgRes = await e.reply(msg);
  } else {
    msgRes = await e.reply(await e.group.makeForwardMsg(tomsg));
  }
  if (msgRes && msgRes.message_id && e.isGroup && e.groupConfig.delMsg && res5global && res4global) {
    setTimeout(() => {
      e.group.recallMsg(msgRes.message_id);
    }, e.groupConfig.delMsg);
  }
  return true;
}

//定轨
export async function weaponBing(e) {
  let user_id = e.user_id;
  let upW5 = [];
  for (let val of gachaConfig) {
    if (new Date().getTime() <= new Date(val.endTime).getTime()) {
      upW5 = val.weapon5;
      break;
    }
  }
  if (upW5.length <= 0) {
    upW5 = gachaConfig[gachaConfig.length - 1].weapon5;
  }
  let key = `genshin:gacha:${user_id}`;
  let gachaData = await global.redis.get(key);
  gachaData = JSON.parse(gachaData);
  if (!gachaData) {
    gachaData = {
      num4: 0, //4星保底数
      isUp4: 0, //是否4星大保底
      num5: 0, //5星保底数
      isUp5: 0, //是否5星大保底
      week: { num: 0, expire: getEnd().weekEnd },
      today: { role: [], expire: getEnd().dayEnd, num: 0 },
      weapon: {
        num4: 0, //4星保底数
        isUp4: 0, //是否4星大保底
        num5: 0, //5星保底数
        isUp5: 0, //是否5星大保底
        lifeNum: 0, //命定值
        type: 0, //0-取消 1-武器1 2-武器2
        bingWeapon: upW5[0],
      },
    };
  } else if (!gachaData.weapon) {
    gachaData.weapon = {
      num4: 0, //4星保底数
      isUp4: 0, //是否4星大保底
      num5: 0, //5星保底数
      isUp5: 0, //是否5星大保底
      lifeNum: 0, //命定值
      type: 1, //0-取消 1-武器1 2-武器2
      bingWeapon: upW5[0],
    };
  }
  let msg = [];

  if (gachaData.weapon.type >= 2) {
    gachaData.weapon.type = 0;
    gachaData.weapon.bingWeapon = "";
    msg = "定轨已取消";
  } else {
    gachaData.weapon.type++;
    gachaData.weapon.bingWeapon = upW5[gachaData.weapon.type - 1];
    for(let i in upW5){
      if(gachaData.weapon.type - 1 === i){
        msg.push(`[√] ${upW5[i]}`);
      }
      else{
        msg.push(`[  ] ${upW5[i]}`);
      }
    }
    msg = " 定轨成功\n" + msg.join("\n");
  }
  gachaData.weapon.lifeNum = 0;
  await global.redis.set(key, JSON.stringify(gachaData), {
    EX: getEnd().keyEnd,
  });
  let sendMsg = [];
  if (e.isGroup) {
    let name = lodash.truncate(e.sender.card, { length: 8 });
    sendMsg.push(segment.at(e.user_id, name));
  }
  sendMsg.push(msg);
  e.reply(sendMsg);
  return true;
}


//添加角色数据
function redisPushData(object,tmp_name,starName,typename,nowCardNum) {
  return object.push({
    name: tmp_name,
    star: starName,
    type: typename,
    num: nowCardNum,
    element: throwNullElement(element[tmp_name]),
  });
}


function throwNullElement(name) {
  //去除空图片
  if(name===undefined) {
    name="null";
  }
  return name;
}

function getACharacter5(gachaData,wai,up5,role5){
  if (gachaData.isUp5 === 1) {
    wai = 100;
  }
  let tmp_name ;
  let isBigUP = false;
  //当祈愿获取到5星角色时，有50%的概率为本期UP角色
  if (getRandomInt(100) <= wai) {
    if (gachaData.isUp5 === 1) {
      isBigUP = true;
    }
    //大保底清零
    gachaData.isUp5 = 0;
    //up 5星
    tmp_name = up5[getRandomInt(up5.length)];
  } else {
    //大保底
    gachaData.isUp5 = 1;
    tmp_name = role5[getRandomInt(role5.length)];
  }
  return {name:tmp_name,BigUP:isBigUP,returnData:gachaData};
}

function geta4(gachaData,up4,role4,weapon4,typeconfig){
  let tmpname,type=typeconfig;
  let tmpUp = 100;
  if (type==="character"&&gachaData.isUp4 === 1) {
    gachaData.isUp4 = 0;
  } else if (type==="weapon"&&gachaData.weapon.isUp4 === 1) {
    gachaData.weapon.isUp4 = 0;
  }else {
    tmpUp = type==="weapon" ? 75:50;
  }
  if (getRandomInt(100) <= tmpUp) {
    //up 4星
    tmpname = up4[getRandomInt(up4.length)];
  } else {
    gachaData.isUp4 = 1;
    //一半概率武器 一半4星
    if (getRandomInt(100) <= 50) {
      tmpname=role4[getRandomInt(role4.length)];
      type= "character";
    } else {
      tmpname=weapon4[getRandomInt(weapon4.length)];
      type= "weapon";
    }
  }
  return {name : tmpname,types : type,returnData : gachaData};
}
