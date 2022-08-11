import plugin from '../../../lib/plugins/plugin.js'
import * as Gacha from '../apps/index.js'
import { render } from './render.js'
import { checkAuth, getMysApi } from './mys.js'

export class gacha extends plugin {
  constructor () {
    let rule = {
      reg: '.+',
      fnc: 'dispatch'
    }
    super({
      name: 'gacha-plugin',
      desc: '抽卡插件',
      event: 'message',
      priority: 50,
      rule: [rule]
    })
    Object.defineProperty(rule, 'log', {
      get: () => !!this.isDispatch
    })
  }

  accept () {
    this.e.original_msg = this.e.original_msg || this.e.msg
  }

  async dispatch (e) {
    let msg = e.original_msg || ''
    if (!msg) {
      return false
    }
    e.checkAuth = async function (cfg) {
      return await checkAuth(e, cfg)
    }
    e.getMysApi = async function (cfg) {
      return await getMysApi(e, cfg)
    }
    msg = msg.replace('#', '').trim()
    msg = '#' + msg
    for (let fn in Gacha.rule) {
      let cfg = Gacha.rule[fn]
      if (Gacha[fn] && new RegExp(cfg.reg).test(msg)) {
        let ret = await Gacha[fn](e, {
          render
        })
        if (ret === true) {
          this.isDispatch = true
          return true
        }
      }
    }

    return false
  }
}
