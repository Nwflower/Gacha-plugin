import { segment } from "oicq";
import { resolve } from "path";
import { Cfg } from "../components/index.js";

let CD = {};

//项目路径
const _path = process.cwd();
const gachaPath = `${_path}/plugins/gacha-plugin`;

export const rule = {
  GenshinRelife: {
    reg: "^#?转生$", //匹配消息正则，命令正则
    priority: 1, //优先级，越小优先度越高
    describe: "转生成某人", //【命令】功能说明
  },
};

export async function GenshinRelife(e) {
  let cdtime = Cfg.get("relife.time", 120)
  if(CD[e.user_id] && !e.isMaster){
    e.reply("每"+cdtime+"分钟只能投胎一次哦！");
    return true;
  }
  CD[e.user_id] = true;
  CD[e.user_id] = setTimeout(() => {
    if (CD[e.user_id]) {
      delete CD[e.user_id];
    }
  }, cdtime);
  var file = gachaPath + '/resources/GenshinRelife/';
  let number = Math.round(Math.random()*53+1);

  //发送消息
  e.reply(segment.image(file+number.toString()+`.png`));

  return true; //返回true 阻挡消息不再往下
}