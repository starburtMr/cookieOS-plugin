# Ctool 开发者工具箱

cookieOS 扩展 `io.cookieos.ctool`。运行名称、版本、作者、分类和能力以 [manifest.json](manifest.json) 为准，工具定义由现有业务模块生成。基于 Ctool 2.9.1，界面工具、入口和 AI/MCP 数量的实际口径见 [SDK 1.2 盘点](docs/sdk-1.2-inventory.json)。

SDK 1.2.0 展示资料版已作为 GitHub 预发布提供；本轮产物及限制见 [验证记录](doc/verification/sdk-1.2/README.md)。

## 安装

管理服务器需要 **Node.js 22 或更新版本**；本包不需要安装 npm 依赖。浏览器需支持 ES modules、Web Workers、WebAssembly 和 Web Crypto。

市场测试版见 [GitHub Release](https://github.com/starburtMr/cookieOS-plugin/releases/tag/ctool-v0.2.0)。新版 cookieOS 的市场地址可填写 `https://github.com/starburtMr/cookieOS-plugin`，刷新市场后选择 Ctool 安装；也可按下述步骤上传本地 ZIP。已完成隔离宿主安装、实际 MCP 与模拟模型助手链路验证；真实外部模型和旧宿主尚未验收。

1. 打开 https://cookieos.yxysj66.com/extensions?tab=installed 。
2. 点击「安装扩展」→「本地 ZIP」，上传本轮 `ctool-0.2.0.zip`。
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
python3 "$SDK_DIR/dev.py" check ./dist/extension
python3 "$SDK_DIR/dev.py" pack ./dist/extension ../dist/ctool-0.2.0/ctool-0.2.0.zip
```

ZIP 必须放在安装目录之外，已有 ZIP 应保留并使用新版本文件名。SDK 来自 https://cookieos.yxysj66.com/api/v1/extensions/sdk ，本轮合同快照为 1.2.0。`dev.py check` 只做文件预检，完整安装规则仍以 cookieOS 为准。

`pnpm test:e2e` 使用本地模拟 xhub 和临时浏览器上下文，服务只提供构建产物。模拟测试不能代表真实模型、MCP、宿主 CSP、停用和升级验收。实际记录见 [Progress](Progress.md)，手动步骤见 [验收任务](doc/tasks/cookieos-migration/10-acceptance.md)。

## 更新与回退

首次安装前保留当前 cookieOS 配置。后续修复使用递增的插件版本和新 ZIP；回退需保留旧 ZIP 与配置备份。插件停用不会撤销已经发送的外部代码执行或模型请求。真实更新/回退尚未在独立宿主验收。

## 来源与许可

原项目：https://github.com/nidhogg1024/Ctool 。保留上游及 baiy 的 MIT 声明，见 [LICENSE](LICENSE)。本目录中的 cookieOS 适配按 MIT 提供；第三方依赖依其自身许可。

安装包 `licenses/index.json` 来自构建实际引用模块，包含依赖版本和许可文本。`@ltd/j-toml` 使用 LGPL-3.0，包内 `licenses/source/j-toml/` 保留其原始发布文件和含源代码的 source maps。要替换该库，可在源码工作区更换对应依赖、执行上述构建命令并重新打包；本插件不限制为调试修改版而进行的逆向分析。未修改该库。


## 展示资料与市场导出

`manifest.json` 是运行身份和版本来源；界面构建读取其版本，组装时由现有 `allTools` 生成工具清单。`metadata.json` 仅维护展示资料，`assets/` 保存品牌图标和实际页面截图，`presentation/README.md` 是安装包内的用户介绍。原开发 README 不直接复制进包。

设置 `SDK_DIR` 指向确认 `sdkVersion=1.2.0` 的下载包，先运行 `pnpm build:extension`，再按上面的命令检查/打包；产物父目录先创建，ZIP 输出必须不存在。正式发布获得地址和实际发布时间后，再从最终 ZIP 导出：

```sh
python3 "$SDK_DIR/dev.py" market-item "$ZIP" \
  --download-url "$DOWNLOAD_URL" --asset-base-url "$ASSET_BASE_URL" \
  --published-at "$PUBLISHED_AT" --output "$ITEM_OUTPUT" \
  --assets-output "$ASSETS_OUTPUT"
```

上述变量必须填写真实值，两个导出输出必须尚不存在；任何 ZIP 字节变化都需重新导出。早期 `dist/ctool-0.2.0/item.json` 是临时隔离验收产物，不可用于发布。GitHub 发布使用同一最终 ZIP 和真实 publishedAt，在 `dist/ctool-0.2.0-github/` 重新生成正式条目和媒体，并验证公开下载后更新市场清单。

`arm_convert` 的 Draft 7 元组结果现已显式声明方言，返回数据格式不变。旧 0.1.0 包在当前严格宿主会因缺少该声明拒绝安装；完整原包升级未验证，合同等价旧版测试包的升级、回退和保留数据重装通过。详细边界见本轮验证记录。
