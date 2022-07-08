//引入插件
import lodash from "lodash";
import schedule from "node-schedule";
import {gachaDIY} from './apps/gachaDIY.js';
import { Genshingacha,weaponBing } from './apps/genshingacha.js';
import { currentVersion } from "./components/Changelog.js";
import { rule as adminRule, sysCfg, } from "./apps/admin.js";

export {
  gachaDIY,
  Genshingacha,
  weaponBing,
  sysCfg,
};

let rule = {
  gachaDIY: {
    reg: "^#*(10|[武器池]*[十]+|抽|单)[连抽卡奖][123武器池]*$",
    describe: "自定义抽卡",
  },
  Genshingacha: {
    reg: "^#*(10|[武器池]*[十]+|抽|单)[连抽卡奖][123武器池]*$",
    describe: "【十连，十连2，十连武器】模拟原神抽卡",
  },
  weaponBing: {
    reg: "^#*定轨$",
    describe: "【定轨】武器池定轨",
  },
  ...adminRule
};

lodash.forEach(rule, (r) => {
  r.priority = r.priority || 50;
  r.prehash = true;
  r.hashMark = true;
});

export { rule };

console.log(`抽卡插件${currentVersion}初始化~`);