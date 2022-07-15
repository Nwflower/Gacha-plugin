
import lodash from "lodash";
import {gachaDIY} from './apps/gachaDIY.js';
import { Genshingacha,weaponBing } from './apps/genshingacha.js';
import { versionInfo } from './apps/version.js';
import { currentVersion } from "./components/Changelog.js";
import { rule as adminRule, sysCfg,updateGachaPlugin } from "./apps/admin.js";
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
  ...adminRule
};

lodash.forEach(rule, (r) => {
  r.priority = r.priority || 50;
  r.prehash = true;
  r.hashMark = true;
});

export { rule };



console.log(`抽卡插件${currentVersion}载入完毕,感谢您的使用`);