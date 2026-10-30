# Ctool 开发者工具箱

cookieOS 扩展 `io.cookieos.ctool`，插件版本 **0.1.0**。基于 Ctool 2.9.1，保留 60 项工具、88 个功能入口，12 类 AI 辅助使用 cookieOS 已配置的模型。

## 安装

管理服务器需要 **Node.js 22 或更新版本**；本包不需要安装 npm 依赖。浏览器需支持 ES modules、Web Workers、WebAssembly 和 Web Crypto。

市场测试版见 [GitHub Release](https://github.com/starburtMr/cookieOS-plugin/releases/tag/ctool-v0.1.0)。新版 cookieOS 的市场地址可填写 `https://github.com/starburtMr/cookieOS-plugin`，刷新市场后选择 Ctool 安装；也可按下述步骤上传本地 ZIP。真实宿主安装和 AI/MCP 验收尚未完成。

1. 打开 https://cookieos.yxysj66.com/extensions?tab=installed 。
2. 点击「安装扩展」→「本地 ZIP」，上传 `ctool-v0.1.0.zip`。
3. 打开 Ctool。可在设置中选择「跟随 cookieOS 默认模型」或指定模型；无模型时先在 cookieOS 配置模型供应商。
4. 内置 AI/MCP 工具还需在扩展设置中打开对应开关。外部 MCP 调用需在「MCP 服务」选择插件工具，配置服务和访问令牌；令牌不属于插件包。

提供 module、view、window、drawer 四种界面。外链使用 `open-url` 权限。开发源码和规划文件不在安装 ZIP 中。

## 功能和配置

- 常规运算在浏览器执行；首批 14 个结构化操作也可供内置 AI 与 MCP 调用：JSON 格式化/校验、Base64 编解码、URL 编解码、摘要、时间转换、进制转换、Cron、文本处理、配置转换、URL 解析、UUID。
- AI 辅助只在主动点击时发送本操作的文本，结果需点击「使用结果」。修改输入、离开工具或停止生成后，旧结果不再应用。连接中断时保留部分文本，可查询原调用状态；不自动重新生成。
- 主题、语言、缩放、常用工具和模型选择保存到宿主。工具历史默认关闭，启用后仅留在当前页面会话；密码、密钥等工具不记录历史。
- IP 查询通过浏览器访问 GeoJS，因此「当前 IP」指浏览器出口。WebSocket 也从浏览器连接；HTTPS 页面可能禁止 `ws://`。自动重连不重发消息。
- ARM 转换由插件后端访问 armconverter.com。JDoodle 代码运行在外部服务，可能消耗额度；后端位于 cookieOS 管理服务器。

JDoodle 需要在 cookieOS 扩展设置的**秘密配置**中设置以下 JSON 字段，再重新打开工具。不要将真实值放进普通配置或源码：

```json
{"jdoodleClientId":"填写 Client ID","jdoodleClientSecret":"填写 Client Secret"}
```

没有配置时，普通工具照常使用，在线运行提示配置缺失。原版语言/版本列表作为兼容选项保留，不能视为当前 JDoodle 支持清单；本轮读取语言明细页返回 403，真实可用版本需按账号和官方页面确认。超时或断线后代码可能已经执行，确认外部结果后再手动重试。

## 输入边界

结构化工具：请求 256 KiB，文字字段通常不超过 200 Ki 字符，输出 1 MiB；进制转换最多 8192 位。Base64 工具只接收 UTF-8 文本，界面仍支持二进制文件。

文件/下载/压缩结果上限 8 MiB；二维码解析上限 400 万像素。JSON 表达式在 QuickJS 中运行，VM 分配预算 8 MiB、WASM 内存最大 32 MiB，Worker 总截止 4 秒。正则、Schema、解压、二维码使用可终止 Worker；超限会显示错误。此限制不等于浏览器整个进程的内存上限。

## 开发和验证

```sh
npx --yes pnpm@10.34.9 install --frozen-lockfile --ignore-scripts
npx --yes pnpm@10.34.9 verify
```

使用 pnpm 10.34.9（或 `npx --yes pnpm@10.34.9`），Python 3 只用于 cookieOS SDK 检查和打包。无需更改宿主或全局配置。浏览器测试首次运行可用项目的 Playwright 安装 Chromium：`npx --yes pnpm@10.34.9 exec playwright install chromium`。

`pnpm build:extension` 在 `dist/extension/` 组装干净安装目录。使用官方 SDK：

```sh
python3 ../cookieos-extension-sdk/dev.py check ./dist/extension
python3 ../cookieos-extension-sdk/dev.py pack ./dist/extension ../dist/ctool-v0.1.0.zip
```

ZIP 必须放在安装目录之外，已有 ZIP 应保留并使用新版本文件名。SDK 来自 https://cookieos.yxysj66.com/api/v1/extensions/sdk ，本轮合同快照为 1.1.0。`dev.py check` 只做文件预检，完整安装规则仍以 cookieOS 为准。

`pnpm test:e2e` 使用本地模拟 xhub 和临时浏览器上下文，服务只提供构建产物。模拟测试不能代表真实模型、MCP、宿主 CSP、停用和升级验收。实际记录见 [Progress](Progress.md)，手动步骤见 [验收任务](doc/tasks/cookieos-migration/10-acceptance.md)。

## 更新与回退

首次安装前保留当前 cookieOS 配置。后续修复使用递增的插件版本和新 ZIP；回退需保留旧 ZIP 与配置备份。插件停用不会撤销已经发送的外部代码执行或模型请求。真实更新/回退尚未在独立宿主验收。

## 来源与许可

原项目：https://github.com/nidhogg1024/Ctool 。保留上游及 baiy 的 MIT 声明，见 [LICENSE](LICENSE)。本目录中的 cookieOS 适配按 MIT 提供；第三方依赖依其自身许可。

安装包 `licenses/index.json` 来自构建实际引用模块，包含依赖版本和许可文本。`@ltd/j-toml` 使用 LGPL-3.0，包内 `licenses/source/j-toml/` 保留其原始发布文件和含源代码的 source maps。要替换该库，可在源码工作区更换对应依赖、执行上述构建命令并重新打包；本插件不限制为调试修改版而进行的逆向分析。未修改该库。
