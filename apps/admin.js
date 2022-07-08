import lodash from "lodash";
import {createRequire} from "module";
import {Cfg} from "../components/index.js";
import Common from "../components/Common.js";

const require = createRequire(import.meta.url);
let cfgMap = {
	"自定义": "gacha.DIY",
	"卡池模式": "gacha.type",
	"小保底": "gacha.wai",
	"五星角色概率": "gacha.c5",
	"四星角色概率": "gacha.c4",
	"五星武器概率": "gacha.w5",
	"四星武器概率": "gacha.w4",
	"概率复位": "gacha.setchance"
};
let sysCfgReg = `^#抽卡设置\s*(${lodash.keys(cfgMap).join("|")})?\s*(.*)$`;
export const rule = {
	sysCfg: {
		hashMark: true,
		reg: sysCfgReg,
		describe: "【#管理】系统设置"
	}
};


const _path = process.cwd();
//const resPath = `${_path}/plugins/gacha-plugin/resources/`;

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
			default:
				val = !/关闭/.test(val);
				break;
		}
		if (cfgKey) {
			Cfg.set(cfgKey, val);
		}
	}

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
    	...cfg,
  	}, { e, render, scale: 1.4 });
}

const checkAuth = async function(e) {
	return await e.checkAuth({
		auth: "master",
		replyMsg: `您无权操作`
	});
}
const getStatus = function(rote, def = true) {
	if (Cfg.get(rote, def)) {
		return `<div class="cfg-status" >已开启</div>`;
	} else {
		return `<div class="cfg-status status-off">已关闭</div>`;
	}

}
