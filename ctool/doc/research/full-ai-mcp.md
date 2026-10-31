# 完整工具化：复用、联网核实与最小探针

日期2026-10-31；本轮只规划。机器可读[证据快照](full-ai-mcp-evidence.json)保存官方响应摘要、HTTP状态与运行探针结果；响应摘要证明抓取内容，不证明软件无漏洞或生产兼容。当前源码3cef7b1，Node22.22.2、Linux x64/glibc2.42，SDK1.2.0/hostApi ^1.0.0。

检索：Firecrawl英文搜索发现候选，随后只使用官方仓库/官网/包元数据核实；Context7成功解析ws、qr-code-styling、sharp并读取具体能力。没有采用中文站、聚合教程或未经核实的生成代码。没有安装新生产依赖或改变锁文件。

## 决策与承担范围

| 能力 | 已有/候选 | 本轮决定与实际边界 |
|---|---|---|
| 编码/序列化/计算 | 已有js-base64、bs58、pako、MessagePack、CSV、JSON/YAML/TOML、dayjs、cron、mathjs、uuid/ulid等 | 直接复用当前锁定版本及项目已有纯函数，不重写算法；UI隐式全局/DOM依赖抽离后再给Node用 |
| 密码学 | 已有CryptoJS4.2.0、sm-crypto、jsrsasign、bcryptjs、标准Web Crypto | 保留兼容选项与已知向量；不发明新密码协议或为接口开放顺手升级全套库 |
| 固定/用户Schema | 已有Ajv8.20.0与宿主jsonschema | Schema显式方言、服务参数/结果校验；用户Schema有独立执行预算，不新增第二个插件校验器 |
| JSON JS/Path | 现有QuickJS0.32.0、JSONPath11.2.2安全模式/JMESPath | 复用算法和现有限制，Node侧补固定执行适配；不直接eval、不把Worker说成恶意代码沙箱 |
| HTML表格/Node DOM | 已有DOMPurify3.4.17；候选jsdom30.1.3 MIT | 官方支持Node+jsdom，不自行正则消毒。jsdom当前engine为^22.22.2或^24.15.0或>=26；若采用，本插件服务目标明确限定^22.22.2，不能继续写任意>=22 |
| 图像编解码/栅格化 | Sharp0.35.4已在锁和已安装依赖树，Apache-2.0 | 在本机跑通SVG小图→PNG/JPEG/WebP→RGBA；不等于已进入发布包。生产闭包需含native binding/libvips，目标CPU/libc单独验证，全部传递许可随包 |
| QR样式生成 | 实际baiy/styled-qr-code1.0.2，锁定commit ad58da595ea2c1301ff4ff607dfae4f33d2b791a | 直接Node导入实测self is not defined。不能因为现代上游文档有Node示例就认定该fork可直接服务端运行 |
| QR Node候选 | 官方qr-code-styling1.9.2 MIT；jsdom30.1.3/canvas3.2.3 MIT | FULL-00先验证fork隔离DOM复用，否则比较上游升级；官方getRawData用于Node，Logo内嵌路径需要正确DOM/canvas。不能以普通qrcode替掉样式和Logo，不选canvas master提及的v4预发布 |
| 二维码识别 | 已有jsQR1.4.0 Apache-2.0 | 直接接收RGBA/宽高；Node纯色输入探针通过。图片解码用成熟库，不把浏览器OffscreenCanvas直接搬到Node |
| 条形码 | 已有JsBarcode3.11.6 MIT | Node普通对象编码探针通过，SVG用成熟DOM适配；完整码制/文字/字体/PNG结果仍需验证，不写条码编码器 |
| WebSocket | 已有ws8.21.0 MIT | 现有直接依赖提升为真正服务运行依赖即可，不重新造协议。使用maxPayload、bufferedAmount、关闭压缩和有界close/terminate；会话/队列/消息ID是本插件必须补的业务状态 |
| 模型 | SDK client/http.mjs/models.mjs/vendor | 原生复用宿主模型状态/取消/流解析，不引入供应商SDK或自建SSE客户端；把12类既有提示词抽成纯构造函数 |
| 文件/取消/资源 | Node标准库fs/crypto/AbortController/Worker或固定Node子进程 | SDK没有通用大文件MCP载荷或最终用户principal，插件需要最小分块/有界暂存与callId取消适配；不建数据库、通用任务平台或新上传服务 |
| 结构差异/文本diff | recursive-diff1.0.9；依赖树已有jsdiff4.0.2 BSD-3-Clause | Node diffLines探针通过增删识别，优先沿用并显式声明实际生产依赖；不假设新版本API。必须验证位置与换行语义，不自行写diff算法 |

## 本地探针：实际做了什么

在当前已安装Node22.22.2中，通过原包路径引用真实Sharp0.35.4，把64×64受控SVG分别转PNG、JPEG、WebP，再解为4通道RGBA；三个结果都是64×64×4。JsBarcode向普通对象输出encodings成功；jsdiff4.0.2的diffLines识别增删成功；jsQR接受Node Uint8ClampedArray并正确返回空白图无QR。当前QR fork导入失败self is not defined。

这些是无凭据、无业务服务变更的小型可行性检查。没有测试完整样式Logo、字体、恶意大图、全部码制、独立Linux部署包、aarch64/libc、真实模型或JDoodle。探针不替代FULL-00/FULL-08/FULL-12。

Node配置导出的dist/esm直接读取在本轮出现lodash CommonJS命名导出错误，盘点改用项目已有ctool-config公开导出成功得60/88；不修改构建产物绕过。它也说明不能简单把UI模块深层路径当Node公开API。

## 宿主与项目硬约束

- 本地权威SDK源码sdk.json为1.2.0；源码SDK目录未附manifest.schema.json，完整已下载SDK中有该文件，已通过dev.py --help确认实际命令。实现不能猜一个替代Schema。
- 宿主MCP配置max_request_body_bytes=262144；插件当前main.ts同样限制262144。大文件不能直接塞base64参数；48KiB原始块编码后64KiB留有封装余量。
- 宿主package.rs限制manifest256KiB、下载256MiB、解压总量1GiB；service.rs读取工具JSON结果1MiB；工具名称<=40、timeoutSeconds 1..300；MCP工具目录每页100。
- 当前服务取消路由仅accepted=false；完整长任务必须新增实际取消与终止，不能把断开HTTP当所有外部动作已撤销。
- 协议只传tool/args/callId。没有最终用户身份就不能给临时文件/会话宣称逐用户ACL；可信自用按不可猜测能力引用，互不信任多用户要求需另行宿主合同。
- current server.requestTimeout是读请求截止，不是handler全程截止；重计算/外部请求必须有独立预算。
- Node官方说明Worker resourceLimits仅影响JS引擎，不包含ArrayBuffer/原生内存；仍可能全局OOM。像素、输入、输出、并发预算与可终止进程必须实际验证。

## 官方来源与适用限制

1. [ws README](https://github.com/websockets/ws/blob/master/README.md)与[8.21.0客户端API](https://github.com/websockets/ws/blob/8.21.0/doc/ws.md)：采用关闭压缩、消息上限与连接清理。Context7默认文档含较新选项；只能使用当前8.21.0源码确有的字段。
2. [当前QR fork固定来源](https://github.com/baiy/styled-qr-code/tree/ad58da595ea2c1301ff4ff607dfae4f33d2b791a)与[官方Node用法](https://github.com/kozakdenys/qr-code-styling#nodejs)：两者不是同一版本；库的Node示例不代替fork兼容证明。
3. [Sharp部署](https://sharp.pixelplumbing.com/install/)与[输入约束](https://sharp.pixelplumbing.com/api-constructor/)：预构建依赖选择OS/CPU/libc，limitInputPixels不是整个进程的内存硬上限。版本0.35.4以本机包元数据和探针为准。
4. [DOMPurify服务端用法](https://github.com/cure53/DOMPurify#running-dompurify-on-the-server)：需要受支持DOM实现；不选择不受支持的轻量DOM来假装同等消毒保证。
5. [JsBarcode](https://github.com/lindell/JsBarcode)与[jsQR](https://github.com/cozmo/jsQR)：前者提供成熟编码/渲染入口，后者消费RGBA；图片解码是独立职责。
6. [Node22 Worker](https://nodejs.org/docs/latest-v22.x/api/worker_threads.html)：中断与资源限制的真实边界，不能用JS堆限制代替原生内存控制。
7. [node-canvas](https://github.com/Automattic/node-canvas)：主分支README已讨论v4预发布；本轮候选固定注册表当前稳定3.2.3，实际预构建可用平台由FULL-00验证。
8. [jsdom当前元数据](https://registry.npmjs.org/jsdom/30.1.3)、[QR候选元数据](https://registry.npmjs.org/qr-code-styling/1.9.2)、[canvas候选元数据](https://registry.npmjs.org/canvas/3.2.3)：版本/engine/许可已核实，不代表已安装验证这些候选。

9. [jsdiff官方文档](https://github.com/kpdecker/jsdiff)：当前已安装4.0.2只核实基础diffLines行为，不把最新文档的资源控制选项当作该版本能力；执行截止由外部Worker承担。

## 进入实现前仍需通过的Gate

G0：完整操作清单与14旧合同冻结；G1：文件/Schema/取消真实MCP竖向路径；G2：完整QR样式/Logo和native依赖离线可运行；G3：SDK模型生命周期与缺默认错误；G4：全量业务/隔离宿主/更新回退。候选或Gate失败只阻塞依赖它的任务，不自动删功能，不把失败转成兼容承诺。

不能保证零bug。用独立向量、真实链路、边界与失败注入、原接口回归和最终ZIP验收降低实际风险；没有执行的检查明确保持待验。
