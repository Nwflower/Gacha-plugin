import lodash from "lodash";
import schedule from "node-schedule";
import {gacha} from './apps/gachaDIY.js'
import __config from './config.js';


export {
  gacha,
};

let rule = {
  gacha: {
    reg: "^#*(10|[武器池]*[十]+|抽|单)[连抽卡奖][123武器池]*$",
    //priority: __config.useAyakaGacha ? 10 : 9999,
    priority: 98,
    describe: "【十连，十连2，十连武器】模拟原神抽卡",
  }
};

lodash.forEach(rule, (r) => {
  r.priority = r.priority || 50;
  r.prehash = true;
  r.hashMark = true;
});

export { rule };

console.log(`抽卡插件${__config.ver}初始化~`);