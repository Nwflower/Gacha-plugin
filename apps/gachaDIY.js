import { getPluginRender,render } from "../../../lib/render.js";
import { segment } from "oicq";
import lodash from "lodash";
import fs from "fs";
import __config from '../config.js';

//五星基础概率(0-10000)
const chance5 = 60;
//四星基础概率
const chance4 = 510;

//五星武器基础概率
const chanceW5 = 70;
//四星武器基础概率
const chanceW4 = 600;

const _pth = process.cwd();
const _gth = _pth+"/plugins/gacha-plugin";

export const rule = {
  gacha: {
    reg: "^#*(10|[武器池]*[十]+|抽|单)[连抽卡奖][123武器池]*$",
    priority: 98,
    describe: "自定义抽卡",
  },
};

//创建html文件夹
if (!fs.existsSync(`./data/html/genshin/gachaDIY/`)) {
  fs.mkdirSync(`./data/html/genshin/gachaDIY/`);
}

//五星角色
let role5 = [];
//五星武器
let weapon5 = [];
//四星角色
let role4 = [];
//四星武器
let weapon4 = [];
//三星武器
let weapon3 = [];
//回复统计
let count = {};
let element = {};
let genshin = {};
let files ={};

await init();

export async function init(isUpdate) {
  //角色类型json文件
  element = JSON.parse(fs.readFileSync(_pth+"/plugins/gacha-plugin/resources/js/element.json", "utf8"));

  let version = isUpdate ? new Date().getTime() : 0;
  genshin = await import(`../resources/js/roleId.js?version=${version}`);
  count = {};

  //根据文件动态加载角色、武器列表
  gachaall(role5,_gth+"/resources/img/character/5/");
  gachaall(role4,_gth+"/resources/img/character/4/");
  gachaall(weapon3,_gth+"/resources/img/weapon/3/");
  gachaall(weapon4,_gth+"/resources/img/weapon/4/");
  gachaall(weapon5,_gth+"/resources/img/weapon/5/");
}

function gachaall(arr,dir){
  files = fs.readdirSync(dir, { withFileTypes: false });
  for (let val of files) {
    val=val.replace(".png","");
    arr.push(val);
  }
}

//#十连
export async function gacha(e) {
  if (e.img || e.hasReply) {
    return;
  }
  let user_id = e.user_id;
  let name = e.sender.card;
  let group_id = e.group_id;
  let type = e.msg.includes("武器") ? "weapon" : "role";

  let upType = 1;
  if (e.msg.indexOf("2") != -1) {
    upType = 2; //角色up卡池2
  }
  if (e.msg.indexOf("3") != -1) {
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
  if (type == "weapon" && LimitSeparate) {
    todayNum = gachaData.today.weaponNum;
  }

  if (todayNum >= dayNum && !e.isMaster) {
    let msg = lodash.truncate(name, { length: 8 });

    if (gachaData.today.role.length > 0) {
      msg += "\n今日五星：";
      if(gachaData.today.role.length>=4){
        msg += `${gachaData.today.role.length}个\n`
      }else{
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

    //回复消息
    e.reply(msg);
    //返回true不再向下执行
    return true;
  }


  if (e.msg.includes("武器")) {
    return gachaWeapon(e, gachaData, upW4, upW5);
  }


  //每日抽卡数+1
  gachaData.today.num++;

  //数据重置
  let res5 = [],
    resC4 = [],
    resW4 = [],
    resW3 = [];


  //循环十次
  for (let i = 1; i <= 10; i++) {
    let tmpChance5 = chance5;

    //增加双黄概率
    if (gachaData.week.num == 1) {
      tmpChance5 = chance5 * 2;
    }

    //90次都没中五星
    if (gachaData.num5 >= 90) {
      tmpChance5 = 10000;
    }
    //74抽后逐渐增加概率
    else if (gachaData.num5 >= 74) {
      tmpChance5 = 590 + (gachaData.num5 - 74) * 530;
    }
    //60抽后逐渐增加概率
    else if (gachaData.num5 >= 60) {
      tmpChance5 = chance5 + (gachaData.num5 - 50) * 40;
    }

    //抽中五星
    if (getRandomInt(10000) <= tmpChance5) {
      //当前抽卡数
      let nowCardNum = gachaData.num5 + 1;

      //五星抽卡数清零
      gachaData.num5 = 0;
      //没有四星，四星保底数+1
      gachaData.num4++;

      let tmp_name = "";
      //去除UP验证
      tmp_name = role5[getRandomInt(role5.length)];

      gachaData.today.role.push({ name: tmp_name, num: nowCardNum });
      gachaData.week.num++;


      res5.push({
        name: tmp_name,
        star: 5,
        type: "character",
        num: nowCardNum,
        element: trownullelement(element[tmp_name]),
      });
      continue;
    }

    //没有五星，保底数+1
    gachaData.num5++;

    let tmpChance4 = chance4;

    //9次都没中四星 概率100%
    if (gachaData.num4 >= 9) {
      tmpChance4 = chance4 + 10000;
    }
    //6次后逐渐增加概率
    else if (gachaData.num4 >= 5) {
      tmpChance4 = tmpChance4 + Math.pow(gachaData.num4 - 4, 2) * 500;
    }

    //抽中四星
    if (getRandomInt(10000) <= tmpChance4) {
      //保底四星数清零
      gachaData.num4 = 0;

        //一半概率武器 一半4星
        if (getRandomInt(100) <= 50) {
          let tmp_name = role4[getRandomInt(role4.length)];
          resC4.push({
            name: tmp_name,
            star: 4,
            type: "character",
            element: trownullelement(element[tmp_name]),
          });
        } else {
          let tmp_name = weapon4[getRandomInt(weapon4.length)];
          resW4.push({
            name: tmp_name,
            star: 4,
            type: "weapon",
            element: trownullelement(element[tmp_name]),
          });
        }
      continue;
    }

    //没有四星，保底数+1
    gachaData.num4++;

    //随机三星武器
    let tmp_name = weapon3[getRandomInt(weapon3.length)];
    resW3.push({
      name: tmp_name,
      star: 3,
      type: "weapon",
      element: trownullelement(element[tmp_name]),
    });
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

  let base64 = await getPluginRender("gacha-plugin")("pages", "gacha", {
    save_id: user_id,
    name: name,
    info: info,
    list: list,
    fiveNum:res5.length,
  });

  if (base64) {
    redis.set(key, JSON.stringify(gachaData), {
      EX: end.keyEnd,
    });

    let msg = segment.image(`base64://${base64}`);
    let msgRes = await e.reply(msg);

    if (msgRes && msgRes.message_id && e.isGroup && e.groupConfig.delMsg && res5.length <= 0 && resC4.length <= 2) {
      setTimeout(() => {
        e.group.recallMsg(msgRes.message_id);
      }, e.groupConfig.delMsg);
    }
  }

  return true;
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
async function gachaWeapon(e, gachaData, upW4, upW5) {
  let user_id = e.user_id;
  //角色，武器抽卡限制是否分开
  let LimitSeparate = e.groupConfig.LimitSeparate || 0;

  if (!gachaData.weapon) {
    gachaData.weapon = {
      num4: 0, //4星保底数
      num5: 0, //5星保底数
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
    } else if (gachaData.weapon.type == 1) {
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
    let tmpChance5 = chanceW5;

    //增加双黄概率
    if (gachaData.week.num == 1) {
      tmpChance5 = chanceW5 * 3;
    }

    //80次都没中五星
    if (gachaData.weapon.num5 >= 80) {
      tmpChance5 = 10000;
    }
    //62抽后逐渐增加概率
    else if (gachaData.weapon.num5 >= 62) {
      tmpChance5 = chanceW5 + (gachaData.weapon.num5 - 61) * 700;
    }
    //50抽后逐渐增加概率
    else if (gachaData.weapon.num5 >= 45) {
      tmpChance5 = chanceW5 + (gachaData.weapon.num5 - 45) * 60;
    } else if (gachaData.weapon.num5 >= 10 && gachaData.weapon.num5 <= 20) {
      tmpChance5 = chanceW5 + (gachaData.weapon.num5 - 10) * 30;
    }

    //抽中五星
    if (getRandomInt(10000) <= tmpChance5) {
      //当前抽卡数
      let nowCardNum = gachaData.weapon.num5 + 1;

      //五星抽卡数清零
      gachaData.weapon.num5 = 0;
      //没有四星，四星保底数+1
      gachaData.weapon.num4++;


      let tmp_name = "";
      //去除UP验证
      tmp_name = weapon5[getRandomInt(weapon5.length)];


      gachaData.today.role.push({ name: tmp_name, num: nowCardNum });
      gachaData.week.num++;

      res5.push({
        name: tmp_name,
        star: 5,
        type: "weapon",
        num: nowCardNum,
        element: trownullelement(element[tmp_name]),
      });
      continue;
    }

    //没有五星，保底数+1
    gachaData.weapon.num5++;

    let tmpChance4 = chance4;

    //9次都没中四星 概率100%
    if (gachaData.weapon.num4 >= 9) {
      tmpChance4 = chanceW4 + 10000;
    }
    //6次后逐渐增加概率
    else if (gachaData.weapon.num4 >= 5) {
      tmpChance4 = tmpChance4 + Math.pow(gachaData.weapon.num4 - 4, 2) * 500;
    }

    //抽中四星
    if (getRandomInt(10000) <= tmpChance4) {
      //保底四星数清零
      gachaData.weapon.num4 = 0;

      //一半概率武器 一半角色
      if (getRandomInt(100) <= 50) {
          let tmp_name = role4[getRandomInt(role4.length)];
          resC4.push({
            name: tmp_name,
            star: 4,
            type: "character",
            element: trownullelement(element[tmp_name]),
          });
        } else {
          let tmp_name = weapon4[getRandomInt(weapon4.length)];
          resW4.push({
            name: tmp_name,
            star: 4,
            type: "weapon",
            element: trownullelement(element[tmp_name]),
          });
      }
      continue;
    }

    //没有四星，保底数+1
    gachaData.weapon.num4++;

    //随机三星武器
    let tmp_name = weapon3[getRandomInt(weapon3.length)];
    resW3.push({
      name: tmp_name,
      star: 3,
      type: "weapon",
      element: trownullelement(element[tmp_name]),
    });
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

  let base64 = await getPluginRender("gacha-plugin")("pages", "gacha", {
    save_id: user_id,
    name: e.sender.card,
    info: info,
    list: list,
    isWeapon: true,
    bingWeapon: bingWeapon,
    lifeNum: gachaData.weapon.lifeNum,
    fiveNum:res5.length,
  });

  if (base64) {
    let msg = segment.image(`base64://${base64}`);
    let msgRes = await e.reply(msg);

    if (msgRes && msgRes.message_id && e.isGroup && e.groupConfig.delMsg && res5.length <= 0 && resC4.length <= 2) {
      setTimeout(() => {
        e.group.recallMsg(msgRes.message_id);
      }, e.groupConfig.delMsg);
    }
  }

  return true;
}


function trownullelement(name)
{
  //去除空图片
  if(name==undefined)
  {
    name="null";
  }
  return name;
}