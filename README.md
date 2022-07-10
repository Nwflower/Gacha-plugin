#### 介绍
# gacha-plugin

基于喵喵插件为框架进行改编实现的yunzai-bot的拓展抽卡插件，旨在不修改原卡池信息的情况下提供自定义卡池的拓展

#### 更新须知
如果报错请删除配置文件
/components/cfg.json
/resources/gacha.json

#### 已经实现的功能
1. 自定义抽卡人物：如科莱、伽罗、刑天铠甲等
2. 基于命令修改卡池概率
3. 命令修改卡池角色

#### 准备实现的功能
1. 更多的十连：支持二十连、三十连、四十连、百连等

#### 已经鸽了的预计功能
1. 更多的卡池：明日方舟抽卡、王者荣耀抽奖等

#### 使用说明

本插件为[云崽bot](https://gitee.com/Le-niao/Yunzai-Bot)的辅助插件

全员卡池默认`无大保底无定轨`，添加图片添加到`resource/gacha/img/`目录下的weapon和character的对应星级中，重启即可。要求图片分辨率150\*480;

#### 安装教程

```
使用github
git clone https://github.com/Nwflower/gacha-plugin.git ./plugins/gacha-plugin/

使用gitee
git clone https://gitee.com/Nwflower/Gacha-plugin.git ./plugins/gacha-plugin/
```


#### 命令说明
1. 继承了原抽卡命令`#十连`等
2. 打开设置使用`#抽卡设置`设置重要参数等
3. 覆盖开关默认打开


#### 软件架构
/app js功能
/resource 资源文件


#### 其他

- 最后再求个star，你的支持是维护本项目的动力~~
- 图片素材来源于网络，仅供交流学习使用
- 严禁用于任何商业用途和非法行为

#### Gacha-plugin
交流群：240979646
感谢素材提供 我叫阿sir不叫同志(1509293009) ZDPLM(2895699730)

#### 其他插件
[Yunzai-Bot插件索引](https://gitee.com/Hikari666/Yunzai-Bot-plugins-index) 