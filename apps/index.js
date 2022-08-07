import lodash from "lodash";
import {gachaDIY} from './gachaDIY.js';
import {GenshinRelife} from './GenshinRelife.js';
import { Genshingacha,weaponBing } from './genshingacha.js';
import { versionInfo } from './version.js';
import { rule as adminRule, sysCfg,updateGachaPlugin } from "./admin.js";
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

export {
  gachaDIY,
  GenshinRelife,
  Genshingacha,
  versionInfo,
  weaponBing,
  updateGachaPlugin,
  sysCfg,
};

let rule = {
  gachaDIY: {
    reg: "^#*(10|[武器池]*([一二三四五六七八九]?[十百]+)|抽|单)[连抽卡奖][123武器池]*$",
    describe: "自定义抽卡",
  },
  Genshingacha: {
    reg: "^#*(10|[武器池]*([一二三四五六七八九]?[十百]+)|抽|单)[连抽卡奖][123武器池]*$",
    describe: "【十连，十连2，十连武器】模拟原神抽卡",
  },
  weaponBing: {
    reg: "^#*定轨$",
    describe: "【定轨】武器池定轨",
  },
  versionInfo: {
    reg: "^#?抽卡版本$",
    describe: "【#版本】抽卡插件版本介绍",
  },
  GenshinRelife: {
    reg: "^#?转生$",
    describe: "转生成某人",
  },
  ...adminRule
};

lodash.forEach(rule, (r) => {
  r.priority = r.priority || 50;
  r.prehash = true;
  r.hashMark = true;
});

export { rule };
