# 1.1.2
* 全员卡池新增愚人众各执行官（5星、角色）
* 说明：如想自定义卡池角色，可自行在`gacha-plugin\resources\gacha\img\character\5`下添加图片,(加入全员卡池)

# 1.1.1
* 修复十连没有保底紫或者十连全是紫的问题
* 修复无配置文件时，会报错的问题

# 1.1.0

* 将 `二十连、三十连...九十连、百连` 等命令推广到武器池和全员卡池
    * 在菜单中添加`多连转发`以设置百连是否需要通过转发聊天记录的形式呈现
    * 为显示直观，私聊情况下禁用多连转发
* 增加 `#抽卡更新` 功能
    * 功能copy于miao-plugin
    * 感谢 @喵喵 @碎月 @清秋 的代码
    * 若更新成功会重启Yunzai，需要Yunzai以 npm run start 模式启动
    * 增加`#抽卡版本`命令查询版本信息


# 1.0.5

* 修复了一些问题
    * 修复了定时撤回报错
    * 修复了频发性的无法加载四星角色图片的问题

# 1.0.4

* 新增了百连、三十连等命令
* 新增 `卡池自定义` 功能
    * 修正卡池无法自定义的问题，目前修改角色需要输入全名
    * 新增 `概率调整` 功能

# 更早

* 新增 `#抽卡设置` 命令和 `自定义抽卡管理面板` 界面
    * 可通过 `#抽卡设置覆盖关闭` 命令关闭设置的抽卡覆盖功能
    * * 调整覆盖命令为 `#抽卡设置自定义关闭`
* 将JS插件转化为plugin插件包