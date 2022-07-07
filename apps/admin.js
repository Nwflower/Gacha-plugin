import {segment} from "oicq";
import fs from "fs";
import lodash from "lodash";
import {createRequire} from "module";
import {exec} from "child_process";
import {Cfg} from "../components/index.js";
import Common from "../components/Common.js";

const require = createRequire(import.meta.url);
let cfgMap = {
	"覆盖": "gacha.DIY",
	"五星角色概率": "gacha.chance5",
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
const resPath = `${_path}/plugins/gacha-plugin/resources/`;

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

		if (cfgKey === "gacha.chance5") {
			val = Math.min(10000, Math.max(0, val * 1 || 100));
		}else {
			val = !/关闭/.test(val);
		}
		if (cfgKey) {
			Cfg.set(cfgKey, val);
		}
	}

	let cfg = {
		gachadiy: getStatus("gacha.DIY", true),
		gachachance5: Cfg.get("gacha.chance5", 60),
	}
	
	console.log(cfg)


  	return await Common.render("admin/index", {
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
