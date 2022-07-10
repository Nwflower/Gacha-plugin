import lodash from "lodash";
import {createRequire} from "module";
import {Cfg , Gcfun} from "../components/index.js";
import Common from "../components/Common.js";
import fs from "fs";
import { roleIdToName } from "../../../lib/app/mysInfo.js";

const require = createRequire(import.meta.url);

let cfgMap = {
	"自定义": "gacha.DIY",
	"卡池模式": "gacha.type",
	"小保底": "gacha.wai",
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
};

let sysCfgReg = `^#抽卡设置\s*(${lodash.keys(cfgMap).join("|")})?\s*(.*)$`;

let genshin = await import(`../../../config/genshin/roleId.js`);

export const rule = {
	sysCfg: {
		hashMark: true,
		reg: sysCfgReg,
		describe: "【#管理】系统设置"
	}
};


const _path = process.cwd();
const resPath = `${_path}/plugins/gacha-plugin/resources`;
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
				role1.unshift(arr[0]);
				if(arr.length==1){
					role2.push(arr[0]);
				}else {
					role2.push(arr[1]);
				}
				gachaChizi.genshinUp.up5[0]=role1;
				gachaChizi.genshinUp.up5_2[0]=role2;
				fs.writeFileSync(`${resPath}/gacha/gacha.json`, JSON.stringify(gachaChizi, null, "\t"));
				cfgKey = false;//取消独立验证
				break;
			case "genshin.w5":
				arr = val.split(',');;
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
				arr = val.split(',');;
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
				let gachaConfig = JSON.parse(fs.readFileSync("./config/genshin/gacha.json", "utf8"));
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
	}

	let gachaconfigchance = ((Cfg.get("gacha.wai", 50)===50)&&(Cfg.get("gacha.c5", 60)===60)&&(Cfg.get("gacha.c4", 510)===510)&&(Cfg.get("gacha.w5", 70)===70)&&(Cfg.get("gacha.w4", 600)===600))? "无需复位":"可复位";

	console.log(cfg)
	return await Common.render("admin/index", {
		gachaconfigchance,
		genshincharact5,
		genshincharact4,
		genshinweapon5,
		genshinweapon4,
		...cfg,
  	}, { e, render, scale: 1.4 });
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
	return roleIdToName(roleIdToName(genshinname),true);
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
	return genshin.roleId5.includes(Number(roleIdToName(Name))) ? 5 : 4
}

const getrandomcharact = function(star){
	let arr = lodash.sample(genshin.roleId);
	while(getchastar(arr[0])!=star || arr.length===0||arr[0]==="主角")
	{
		arr = lodash.sample(genshin.roleId);
	}
	return arr[0];
}

const splitchat = function(msg){
	let arr = msg.split(',');;
	if(msg.includes("，")) {
		arr = msg.split('，');
	}
	if(!examcharact(arr)){
		return flase;
	}
	return arr;
}

