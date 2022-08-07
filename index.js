// 适配V3 Yunzai，将index.js移至app/index.js
import { currentVersion, isV3 } from './components/Changelog.js'
import Data from './components/Data.js'

export * from './apps/index.js'
let index = { gacha: {} }
if (isV3) {
  index = await Data.importModule('/plugins/gacha-plugin/adapter', 'index.js')
}
export const gacha = index.gacha || {}
if (Bot?.logger?.info) {
  Bot.logger.info(`--------->_<---------`)
  Bot.logger.info(`抽卡插件${currentVersion}很高兴为您服务~`)
} else {
  console.log(`抽卡插件${currentVersion}很高兴为您服务~`)
}

setTimeout(async function () {
  let msgStr = await redis.get('gacha:restart-msg')
  let relpyPrivate = async function () {
  }
  if (!isV3) {
    let common = await Data.importModule('/lib', 'common.js')
    if (common && common.default && common.default.relpyPrivate) {
      relpyPrivate = common.default.relpyPrivate
    }
  }
  if (msgStr) {
    let msg = JSON.parse(msgStr)
    await relpyPrivate(msg.qq, msg.msg)
    await redis.del('gacha:restart-msg')
    let msgs = [`当前抽卡版本: ${currentVersion}`, '您可使用 #抽卡版本 命令查看更新信息']
    await relpyPrivate(msg.qq, msgs.join('\n'))
  }
}, 1000)
