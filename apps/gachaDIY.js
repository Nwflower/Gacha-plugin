import { getPluginRender } from "../../../lib/render.js";
import { segment } from "oicq";
import lodash from "lodash";
import fs from "fs";
import { Cfg,Gcfun } from "../components/index.js";
import { getagachastar, getRandomInt, getTimes, hasGacha } from "../components/GcApi.js";
const _pth = process.cwd();
const _gth = _pth+"/plugins/gacha-plugin";

export const rule = {
  gachaDIY: {
    reg: "^#*(10|[武器池]*([一二三四五六七八九]?[十百]+)|抽|单)[连抽卡奖][123武器池]*$",
    priority: 9,
    describe: "自定义抽卡",
  },
};

//初始化数据
let role5 = [],weapon5 = [],role4 = [],weapon4 = [], weapon3 = [], count = {}, element = {}, genshin = {}, files ={};
await init();
export async function init(isUpdate) {
  //创建html文件夹
  if (!fs.existsSync(`./data/html/genshin/gacha/`)) {
    fs.mkdirSync(`./data/html/genshin/gacha/`);
  }
  //角色类型json文件
  element = JSON.parse(fs.readFileSync(_pth+"/plugins/gacha-plugin/resources/gacha/element.json", "utf8"));
  let version = isUpdate ? new Date().getTime() : 0;
  genshin = await import(`../resources/gacha/roleId.js?version=${version}`);
  count = {};
  //根据文件动态加载角色、武器列表
  gachaall(role5,_gth+"/resources/gacha/img/character/5/");
  gachaall(role4,_gth+"/resources/gacha/img/character/4/");
  gachaall(weapon3,_gth+"/resources/gacha/img/weapon/3/");
  gachaall(weapon4,_gth+"/resources/gacha/img/weapon/4/");
  gachaall(weapon5,_gth+"/resources/gacha/img/weapon/5/");
}

function gachaall(arr,dir){
  files = fs.readdirSync(dir, { withFileTypes: false });
  for (let val of files) {
    val=val.replace(".png","");
    arr.push(val);
  }
}
//获取概率
function getchance(key, config){
  return Cfg.get(key, config);
}

//#十连
export async function gachaDIY(e) {
  if (e.img || e.hasReply || !Cfg.get("gacha.DIY", true) || Cfg.get("gacha.type", 1) !== 0) {
    return false;
  }
  let user_id = e.user_id;
  let name = e.sender.card;
  let type = e.msg.includes("武器") ? "weapon" : "role";

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
  //初始化抽卡数据
  if (!gachaData) {
    gachaData = {
      num4: 0, //4星保底数
      num5: 0, //5星保底数
      week: { num: 0, expire: end.weekEnd },
      today: { role: [], expire: end.dayEnd, num: 0, weaponNum: 0 },
      weapon: {
        num4: 0, //4星保底数
        num5: 0, //5星保底数
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
  if (e.msg.includes("武器")) {
    return gachaWeapon(e, gachaData);
  }

  let thegachadata = [];
  let res5global = true, res4global = true;
  let gachatimes = getTimes(e);
  if (dayNum < todayNum + gachatimes && !e.isMaster) {
    e.reply("你今天已经抽了很多次了哦~");
    return true;
  }

  for (let shiliancishu = 0; shiliancishu < gachatimes; shiliancishu++) {
    //每日抽卡数+1
    gachaData.today.num++;
    //数据重置
    let res5 = [], resC4 = [], resW4 = [], resW3 = [];
    //循环十次
    for (let i = 1; i <= 10; i++) {
      let star = getagachastar(gachaData, "character");
      gachaData.num5++;
      gachaData.num4++;
      switch (star) {
        case 5:
          let nowCardNum = gachaData.num5;
          gachaData.num5 = 0;
          let tmp_name = role5[getRandomInt(role5.length)];
          gachaData.today.role.push({ name: tmp_name, num: nowCardNum });
          gachaData.week.num++;
          redispushdata(res5, tmp_name, 5, "character", nowCardNum);
          break;
        case 4:
          gachaData.num4 = 0;
          if (getRandomInt(100) <= 50) {
            redispushdata(resC4, role4[getRandomInt(role4.length)], 4, "character", undefined);
          } else {
            redispushdata(resW4, weapon4[getRandomInt(weapon4.length)], 4, "weapon", undefined);
          }
          break;
        default:
          //随机三星武器
          redispushdata(resW3, weapon3[getRandomInt(weapon3.length)], 3, "weapon", undefined);
          break;
      }
    }

    let list = [...res5, ...resC4, ...resW4, ...resW3];
    let info = `累计「${gachaData.num5}抽」`;
    if (res5.length > 0) {
      let role5 = res5[res5.length - 1];
      info = `${role5.name}「${role5.num}抽」`;
    }
    if (res5.length >= 4) {
      info = "";
    }

    let base64 = await getPluginRender("gacha-plugin")("gacha", "gacha", {
      save_id: user_id,
      name: name,
      info: info,
      list: list,
      fiveNum: res5.length,
    });
    thegachadata.push(base64);
    if (base64) {
      redis.set(key, JSON.stringify(gachaData), {
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



function getEnd() {
  let now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let day = now.getDate();
  let dayEnd = "";
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
async function gachaWeapon(e, gachaData) {
  let user_id = e.user_id;
  //角色，武器抽卡限制是否分开
  let LimitSeparate = e.groupConfig.LimitSeparate || 0;
  //初始化数据
  if (!gachaData.weapon) {
    gachaData.weapon = {
      num4: 0, //4星保底数
      num5: 0, //5星保底数
    };
  }

  let gachatimes = getTimes(e);
  let thegachadata = [];
  let res5global = true, res4global = true;
  for (let shiliancishu = 0; shiliancishu < gachatimes; shiliancishu++) {
    //每日抽卡数+1
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

    let res5 = [],
      resC4 = [],
      resW4 = [],
      resW3 = [];

    //循环十次
    for (let i = 1; i <= 10; i++) {
      let star = getagachastar(gachaData, "weapon");
      gachaData.weapon.num5++;
      gachaData.weapon.num4++;
      switch (star) {
        case 5:
          let nowCardNum = gachaData.weapon.num5;
          gachaData.weapon.num5 = 0;
          let tmp_name = weapon5[getRandomInt(weapon5.length)];
          gachaData.today.role.push({ name: tmp_name, num: nowCardNum });
          gachaData.week.num++;
          redispushdata(res5, tmp_name, 5, "weapon", nowCardNum);
          break;
        case 4:
          gachaData.weapon.num4 = 0;
          //一半概率武器 一半角色
          if (getRandomInt(100) <= 50) {
            redispushdata(resC4, role4[getRandomInt(role4.length)], 4, "character", undefined);
          } else {
            redispushdata(resW4, weapon4[getRandomInt(weapon4.length)], 4, "weapon", undefined);
          }
          break;
        default:
          //随机三星武器
          redispushdata(resW3, weapon3[getRandomInt(weapon3.length)], 3, "weapon", undefined);
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
    //制图
    let base64 = await getPluginRender("gacha-plugin")("gacha", "gacha", {
      save_id: user_id,
      name: e.sender.card,
      info: info,
      list: list,
      isWeapon: true,
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


function trownullelement(name) {
  //去除空图片
  if(name===undefined) {
    name="null";
  }
  return name;
}

//添加角色数据
function redispushdata(object,tmp_name,starnum,typename,nowCardNum) {
  return object.push({
    name: tmp_name,
    star: starnum,
    type: typename,
    num: nowCardNum,
    element: trownullelement(element[tmp_name]),
  });
}

