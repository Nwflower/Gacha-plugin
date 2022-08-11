import lodash from "lodash";
import {createRequire} from "module";
import {Cfg , Gcfun} from "../components/index.js";
import Common from "../components/Common.js";
import fs from "fs";
import gsCfg from '../model/gsCfg.js'
import { exec } from "child_process";
import {isV3} from "../components/Changelog.js";
import { segment } from "oicq";

const require = createRequire(import.meta.url);

let cfgMap = {
	"自定义": "gacha.DIY",
	"卡池模式": "gacha.type",
	"多连转发": "gacha.mode",
	"小保底概率": "gacha.wai",
	"五星角色概率": "gacha.c5",
	"四星角色概率": "gacha.c4",
	"五星武器概率": "gacha.w5",
	"四星武器概率": "gacha.w4",
	"概率复位": "gacha.setchance",
	"五星角色": "genshin.c5",
	"四星角色": "genshin.c4",
	"五星武器": "genshin.w5",
	"四星武器": "genshin.w4",
	"随机卡池": "gacha.random",
	"卡池同步": "gacha.get",
	"转生间隔": "relife.time",
};

let sysCfgReg = `^#抽卡设置\s*(${lodash.keys(cfgMap).join("|")})?\s*(.*)$`;
let genshin = await import(`../resources/gacha/roleId.js`);
export const rule = {
	sysCfg: {
		hashMark: true,
		reg: sysCfgReg,
		describe: "【#管理】系统设置"
	},
	updateGachaPlugin: {
		hashMark: true,
		reg: "^#抽卡(强制)?更新",
		describe: "【#管理】抽卡插件更新",
	},
};


const _path = process.cwd();
const resPath = `${_path}/plugins/gacha-plugin/resources`;
const gachaPath = `${_path}/plugins/gacha-plugin/resources/gacha/gacha.json`;
const gachadefaultPath = `${_path}/plugins/gacha-plugin/resources/gacha/gacha_default.json`;

try {
  if (!fs.existsSync(gachaPath)) {
    fs.writeFileSync(gachaPath, fs.readFileSync(gachadefaultPath, "utf8"));
  }
} catch (e) {
}

let gachaChizi= JSON.parse(fs.readFileSync(`${resPath}/gacha/gacha.json`, "utf8"));

export async function sysCfg(e, { render }) {
	if (!await checkAuth(e)) {
		return true;
	}

	let cfgReg = new RegExp(sysCfgReg);
	let regRet = cfgReg.exec(e.msg);

	if (!regRet) {
		return true;
	}
	if (regRet[1]) {

		// 设置模式
		let val = regRet[2] || "";
		let arr = [];
		let cfgKey = cfgMap[regRet[1]];
		switch (cfgKey) {
			case "gacha.c5":
			case "gacha.c4":
			case "gacha.w5":
			case "gacha.w4":
				val = Math.min(10000, Math.max(0, val * 1));
				break;
			case "gacha.wai":
				val = Math.min(100, Math.max(0, val * 1));
				break;
			case "gacha.type":
				val = Math.min(1, Math.max(0, val * 1));
				break;
			case "gacha.setchance":
				Cfg.set("gacha.wai", 50);
				Cfg.set("gacha.c5", 60);
				Cfg.set("gacha.c4", 510);
				Cfg.set("gacha.w5", 70);
				Cfg.set("gacha.w4", 600);
				break;
			case "genshin.c5":
				arr = splitchat(val)
				if(!arr){
					e.reply("当前卡池里找不到指定的角色哦！");
					return true;
				}
				let role1=[];
				let role2=[];
				role1.push(arr[0]);
				if(arr.length===1){
					role2.push(arr[0]);
				}else {
					role2.push(arr[1]);
				}
				gachaChizi.genshinUp.up5[0]=getName(role1[0]);
				gachaChizi.genshinUp.up5_2[0]=getName(role2[0]);
				fs.writeFileSync(`${resPath}/gacha/gacha.json`, JSON.stringify(gachaChizi, null, "\t"));
				cfgKey = false;//取消独立验证
				break;
			case "genshin.w5":
				arr = val.split(',');
				if(val.includes("，")) {
					arr = val.split('，');
				}
				if(arr.length===0||arr.length>2){
					e.reply("设置格式有误，再试一试吧！");
					return true;
				}
				gachaChizi.genshinUp.weapon5=arr;
				fs.writeFileSync(`${resPath}/gacha/gacha.json`, JSON.stringify(gachaChizi, null, "\t"));
				cfgKey = false;//取消独立验证
				break;
			case "genshin.w4":
				arr = val.split(',');
				if(val.includes("，")) {
					arr = val.split('，');
				}
				if(arr.length===0){
					e.reply("设置格式有误，再试一试吧！");
					return true;
				}
				gachaChizi.genshinUp.weapon4=arr;
				fs.writeFileSync(`${resPath}/gacha/gacha.json`, JSON.stringify(gachaChizi, null, "\t"));
				cfgKey = false;//取消独立验证
				break;
			case "genshin.c4":
				arr = splitchat(val)
				if(!arr){
					e.reply("当前卡池里找不到某个角色呢！");
					return true;
				}
				gachaChizi.genshinUp.up4=getarrName(arr);
				fs.writeFileSync(`${resPath}/gacha/gacha.json`, JSON.stringify(gachaChizi, null, "\t"));
				cfgKey = false;//取消独立验证
				break;
			case "gacha.random":
				let wea = [],wea4=[],r4 = [];
				gachaChizi.genshinUp.up5[0] = getrandomcharact(5);
				gachaChizi.genshinUp.up5_2[0] = getrandomcharact(5);
				r4.push(getrandomcharact(4));
				r4.push(getrandomcharact(4));
				r4.push(getrandomcharact(4));
				gachaChizi.genshinUp.up4 = r4;
				let we5 = gachaChizi.genshinall.allUP5w;
				let we4 = gachaChizi.genshinall.allUP4w;
				let w1=we5[getRandomInt(we5.length)]
				wea.push(w1);
				we5 = lodash.difference(we5,w1);
				wea.push(we5[getRandomInt(we5.length)]);
				gachaChizi.genshinUp.weapon5 =wea;
				for (let i = 0; i < 5; i++) {
					we4 = lodash.difference(we4,w1);
					wea4.push(we4[getRandomInt(we4.length)]);
				}
				gachaChizi.genshinUp.weapon4 =wea4;
				fs.writeFileSync(`${resPath}/gacha/gacha.json`, JSON.stringify(gachaChizi, null, "\t"));
				cfgKey = false;//取消独立验证
				break;
			case "gacha.get":
				let gachaConfig = JSON.parse(fs.readFileSync(`${_path}/plugins/gacha-plugin/resources/config/gacha.json`,"utf-8"));
				let end = {} ;
				for (let val of gachaConfig) {
					if (new Date().getTime() <= new Date(val.endTime).getTime()) {
						end = val;
						break;
					}
				}
				if (!end) {
					end = gachaConfig.pop();
				}
				gachaChizi.genshinUp = end;
				fs.writeFileSync(`${resPath}/gacha/gacha.json`, JSON.stringify(gachaChizi, null, "\t"));
				cfgKey = false;//取消独立验证
				break;
			case "relife.time":
				val = Math.min(1440, Math.max(1, val * 1));
				break;
			default:
				val = !/关闭/.test(val);
				break;
		}
		if (cfgKey) {
			Cfg.set(cfgKey, val);
		}
	}

	let genshincharact5=gachaChizi.genshinUp.up5+","+gachaChizi.genshinUp.up5_2;
	let genshincharact4=gachaChizi.genshinUp.up4.join();
	let genshinweapon5=gachaChizi.genshinUp.weapon5.join();
	let genshinweapon4=gachaChizi.genshinUp.weapon4.join();

	let cfg = {
		gachadiy: getStatus("gacha.DIY", true),
		gachatype: Cfg.get("gacha.type", 1),
		gachawai: Cfg.get("gacha.wai", 50),
		gachacharact5: Cfg.get("gacha.c5", 60),
		gachacharact4: Cfg.get("gacha.c4", 510),
		gachaweapon5: Cfg.get("gacha.w5", 70),
		gachaweapon4: Cfg.get("gacha.w4", 600),
		relifetime: Cfg.get("relife.time", 120),
		gachamode: getStatus("gacha.mode", true),
	}

	let gachaconfigchance = ((Cfg.get("gacha.wai", 50)===50)&&(Cfg.get("gacha.c5", 60)===60)&&(Cfg.get("gacha.c4", 510)===510)&&(Cfg.get("gacha.w5", 70)===70)&&(Cfg.get("gacha.w4", 600)===600))? "无需复位":"可复位";

	console.log(cfg)
	let base64 = await Common.render("admin/index", {
			gachaconfigchance,
			genshincharact5,
			genshincharact4,
			genshinweapon5,
			genshinweapon4,
			...cfg,
		}, { e, render, scale: 1.4 });
	if(isV3){
		await e.reply(base64);
	}else {
		await e.reply(segment.image(`base64://${base64}`));
	}
	return true;
}

const checkAuth = async function(e) {
	return await e.checkAuth({
		auth: "master",
		replyMsg: `您无权操作`
	});
}

const getshortName = function (genshinname){
	let name = getName(genshinname);
	return genshin.abbr[name] ? genshin.abbr[name] : name
}

const getName = function(genshinname) {
	return gsCfg.roleIdToName(gsCfg.roleNameToID(genshinname),true);
}

const getarrName =  function(alotofname) {
	let arr = [];
	for(let name of alotofname){
		arr.push(getName(name));
	}
	return arr;
}

const getStatus = function(rote, def = true) {
	if (Cfg.get(rote, def)) {
		return `<div class="cfg-status" >已开启</div>`;
	} else {
		return `<div class="cfg-status status-off">已关闭</div>`;
	}
}

//验证角色
const examcharact = function(arr){
	for(let val of arr)
	{
		if(!getName(val)) {
			return false;
		}
	}
	return true;
}

//返回随机整数
const getRandomInt = function(max = 10000) {
	return Math.floor(Math.random() * max);
}

const getchastar = function(Name){
	return genshin.roleId5.includes(Number(gsCfg.roleNameToID(Name))) ? 5 : 4
}

const getrandomcharact = function(star){
	let arr = lodash.sample(genshin.roleId);
	while(getchastar(arr[0])!==star || arr.length===0||arr[0]==="主角")
	{
		arr = lodash.sample(genshin.roleId);
	}
	return arr[0];
}

const splitchat = function(msg){
	let arr = msg.split(',');
	if(msg.includes("，")) {
		arr = msg.split('，');
	}
	if(!examcharact(arr)){
		return flase;
	}
	return arr;
}

let timer;
export async function updateGachaPlugin(e) {
	if (!await checkAuth(e)) {
		return true;
	}
	let isForce = e.msg.includes("强制");
	let command = "git  pull";
	if (isForce) {
		command = "git  checkout . && git  pull";
		e.reply("正在执行强制更新操作，请稍等");
	} else {
		e.reply("正在执行更新操作，请稍等");
	}
	exec(command, { cwd: `${_path}/plugins/gacha-plugin/` }, function (error, stdout, stderr) {
		if (/(Already up[ -]to[ -]date|已经是最新的)/.test(stdout)) {
			e.reply("目前已经是最新版的抽卡插件了~");
			return true;
		}
		if (error) {
			e.reply("抽卡插件更新失败！\nError code: " + error.code + "\n" + error.stack + "\n 请稍后重试。");
			return true;
		}
		e.reply("抽卡插件更新成功，正在尝试重新启动Yunzai以应用更新...");
		timer && clearTimeout(timer);
		redis.set("gacha:restart-msg", JSON.stringify({
			msg: "重启成功，新版抽卡插件已经生效",
			qq: e.user_id
		}), { EX: 30 });
		timer = setTimeout(function () {
			let command = `npm run start`;
			if (process.argv[1].includes("pm2")) {
				command = `npm run restart`;
			}
			exec(command, function (error, stdout, stderr) {
				if (error) {
					e.reply("自动重启失败，请手动重启以应用新版抽卡插件。\nError code: " + error.code + "\n" + error.stack + "\n");
					Bot.logger.error('重启失败\n${error.stack}');
					return true;
				} else if (stdout) {
					Bot.logger.mark("重启成功，运行已转为后台，查看日志请用命令：npm run log");
					Bot.logger.mark("停止后台运行命令：npm stop");
					process.exit();
				}
			})
		}, 1000);

	});
	return true;
}