# Ctool 开发者工具箱

cookieOS 扩展 `io.cookieos.ctool`。运行名称、版本、作者、分类和能力以 [manifest.json](manifest.json) 为准，工具定义由现有业务模块生成。基于 Ctool 2.9.1，界面工具、入口和 AI/MCP 数量的实际口径见 [SDK 1.2 盘点](docs/sdk-1.2-inventory.json)。

SDK 1.2.0 展示资料版已作为 GitHub 预发布提供；本轮产物及限制见 [验证记录](doc/verification/sdk-1.2/README.md)。

## 安装

管理服务器需要 **Linux x64 与 Node.js 22.22.2～22.x**；本包不需要安装 npm 依赖。浏览器需支持 ES modules、Web Workers、WebAssembly 和 Web Crypto。

市场测试版见 [GitHub Release](https://github.com/starburtMr/cookieOS-plugin/releases/tag/ctool-v0.2.0)。新版 cookieOS 的市场地址可填写 `https://github.com/starburtMr/cookieOS-plugin`，刷新市场后选择 Ctool 安装；也可按下述步骤上传本地 ZIP。已完成隔离宿主安装、实际 MCP 与模拟模型助手链路验证；真实外部模型和旧宿主尚未验收。

1. 打开 https://cookieos.yxysj66.com/extensions?tab=installed 。
2. 点击「安装扩展」→「本地 ZIP」，上传本轮 `ctool-0.3.0-linux-x64.zip`。
3. 打开 Ctool。可在设置中选择「跟随 cookieOS 默认模型」或指定模型；无模型时先在 cookieOS 配置模型供应商。
4. 内置 AI/MCP 工具还需在扩展设置中打开对应开关。外部 MCP 调用需在「MCP 服务」选择插件工具，配置服务和访问令牌；令牌不属于插件包。

提供 module、view、window、drawer 四种界面。外链使用 `open-url` 权限。开发源码和规划文件不在安装 ZIP 中。

## 功能和配置

- 保留60类工具与88个页面入口；服务端100个工具名称全部声明AI/MCP。页面入口、服务接口与模型辅助属于不同统计口径。工具及选项见 [完整覆盖矩阵](doc/tasks/full-ai-mcp/capability-matrix.md)，实际名称和参数由最终包的 manifest.tools 生成；保留原14个公开合同。
- 新接口覆盖编码/摘要/校验、密码学、JSON与11种结构化格式、文本和代码、时间计算与生成、二维码/条码、联网、WebSocket与宿主模型辅助。复杂对象以JSON文本返回；二进制和较大文本以临时文件引用返回。
- 纯计算复用界面的共享业务代码或相同成熟库；不能将外部AI所在电脑的路径、剪贴板或相机当作服务器资源。
- AI 辅助只在主动点击时发送本操作的文本，结果需点击「使用结果」。修改输入、离开工具或停止生成后，旧结果不再应用。连接中断时保留部分文本，可查询原调用状态；不自动重新生成。
- 主题、语言、缩放、常用工具和模型选择保存到宿主。工具历史默认关闭，启用后仅留在当前页面会话；密码、密钥等工具不记录历史。
- 页面 IP 与 WebSocket 使用浏览器网络；AI/MCP 对应接口使用管理服务器网络，查询出口会标明服务器侧。WebSocket发送使用稳定 `messageId`，同ID同内容不会重发；发送中断可能已经送达，用状态查询确认，不自动重发。接收使用 `cursor`/`nextCursor`，二进制消息通过文件引用下载。
- ARM 转换由插件后端访问 armconverter.com。JDoodle 代码运行在外部服务，可能消耗额度；后端位于 cookieOS 管理服务器。

JDoodle 需要在 cookieOS 扩展设置的**秘密配置**中设置以下 JSON 字段，再重新打开工具。不要将真实值放进普通配置或源码：

```json
{"jdoodleClientId":"填写 Client ID","jdoodleClientSecret":"填写 Client Secret"}
```

没有配置时，普通工具照常使用，在线运行提示配置缺失。原版语言/版本列表作为兼容选项保留，不能视为当前 JDoodle 支持清单；本轮读取语言明细页返回 403，真实可用版本需按账号和官方页面确认。超时或断线后代码可能已经执行，确认外部结果后再手动重试。

## 输入边界

请求上限256 KiB，原14个接口的参数/结果和限制不变。新接口的大文件使用 `file_begin → file_chunk → file_commit`；每块48 KiB原始字节，标准Base64，offset以字节计；先声明size和SHA256，再确认完整性。用 `file_status` 恢复上传；重复相同分块不会重复追加，冲突会失败。

上传/业务输入最多8 MiB，生成文件最多16 MiB，每实例最多32项/64 MiB，空闲15分钟后过期；`file_read` 分块下载，`file_delete` 提前释放。服务重启后引用失效。引用是临时能力凭据，不能当成多用户ACL；宿主工具协议没有最终用户身份。

正则、Schema、QuickJS、密码学和图像运算位于可终止的固定子进程，并发2、排队16；普通计算截止10秒，RSA密钥生成55秒。JS堆预算每进程256 MiB，不等于原生内存/RSS硬限制。QuickJS运行预算8 MiB，WASM上限32 MiB，表达式1.5秒；不能准确表示的大整数请改用字符串。压缩/解压结果上限8 MiB，图像上限400万像素。工作日数据范围2004～2026。

密码学接口的 `keyRef` 引用扩展秘密配置中的 `keys` 对象（PEM、普通字符串或SM密钥Hex，按各工具说明）。原有JDoodle字段保留；请用宿主的增量秘密配置或先合并已有对象，避免清空其他字段。RSA新接口默认OAEP，可显式选PKCS1；旧的弱算法只用于兼容。`key_pair_generate` 返回公钥和短期私钥文件引用，需用 `file_read` 下载并妥善保管。

`ai_assist` 开始生成并返回JSON调用号，用 `ai_call_status` 查询部分/最终结果，`ai_call_cancel` 停止；状态为 completed 才是生成完成，unknown不等于未执行。默认逐次跟随宿主模型，也可传稳定modelRef；可能产生模型费用。13种操作对应原12类辅助（正则包含生成和解释），提示词与界面共用。不会自动应用结果或执行生成的SQL/代码。

## 开发和验证

```sh
npx --yes pnpm@10.34.9 install --frozen-lockfile --ignore-scripts
npx --yes pnpm@10.34.9 verify
```

使用 pnpm 10.34.9（或 `npx --yes pnpm@10.34.9`），Python 3 只用于 cookieOS SDK 检查和打包。无需更改宿主或全局配置。浏览器测试首次运行可用项目的 Playwright 安装 Chromium：`npx --yes pnpm@10.34.9 exec playwright install chromium`。

构建会按锁文件准备原生运行依赖（仅当前Linux x64目标），不修改全局配置。新增依赖需要网络或已有缓存；`service/runtime/package-lock.json` 固定随包依赖。

`pnpm build:extension` 在 `dist/extension/` 组装干净安装目录。使用官方 SDK：

```sh
python3 "$SDK_DIR/dev.py" check ./dist/extension
python3 "$SDK_DIR/dev.py" pack ./dist/extension ../dist/ctool-0.3.0/ctool-0.3.0-linux-x64.zip
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


0.3.0本地交付与验证见[本轮验证记录](doc/verification/full-ai-mcp/README.md)。真实外部模型、JDoodle费用执行及正式市场发布单独验收。原生依赖不是全部MIT，组件声明、二进制清单和公开再分发待办见[原生依赖资料](third-party/native/README.md)。
