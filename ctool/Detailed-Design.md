# Ctool 完整 AI/MCP 详细设计

本文件为2026-10-31新范围的待实现合同；不描述已完成能力。现有0.2.0的14个AI/MCP工具保留，目标版本0.3.0。上游业务范围以[覆盖矩阵](doc/tasks/full-ai-mcp/capability-matrix.md)为准，阶段见DEV-PLAN，步骤与验收仅在模块任务中。

## DD-FULL-01 边界与接口兼容

- 运行ID维持io.cookieos.ctool、manifest/metadata schemaVersion=1、SDK1.2.0/hostApi ^1.0.0；运行版本在实际完成后递增，本次规划不改manifest。
- 目前60类/88登记入口不等于原子操作数；FULL-00必须把各页面的算法、按钮操作、选项、输入输出模式枚举成caseId。13个模块、100个去重工具名称候选并不代替operation覆盖。
- 保留原14个名称、参数类型/枚举/错误与结果合同。扩展能力主要用新工具；旧接口调用同一业务函数，不复制旧实现和新实现。已有ARM/JDoodle三个工具保持参数和结果，仅按本轮范围开启ai/mcp并维持真实effect。
- 新Schema统一显式声明Draft7以匹配现有Ajv8实例，嵌套用Draft7语法；宿主严格编译每份输入/输出Schema。不得混用2020-12的元组语法，也不得为通过检查吞掉unknown字段。
- 每个工具定义只存在一次，包含name/title/description/effect/inputSchema/outputSchema/ai/mcp/timeoutSeconds；纯计算定义和业务函数属于ctool-tools，运行时工具定义由service模块导出，主服务统一组合并由assemble生成manifest。UI不手抄算法或第三份合同。
- 新名称最长40 ASCII字节；最终manifest不超过256KiB。当前候选100个工具正好达到宿主MCP默认一页100，不能假定永不分页；跨插件或后续数量变化测试cursor。若Schema预算超限，按已有业务族合并operation枚举，不删操作或扩大宿主预算。

## DD-FULL-02 输入、结果与文件

file_begin中的mime是调用方提示，消费端必须核实实际格式；未知字节默认application/octet-stream，不据扩展名或声明直接内联渲染。

普通输入保留现有text/string/JSON模式；二进制新增互斥输入形态：inlineBase64或fileRef（二选一）。from/to encoding按原工具实际支持枚举定义，不能把任意字符串作为编码。原14接口不接收新字段。

建议新增文件工具合同，由FULL-00冻结字段和Schema：

| 工具 | 输入关键字段 | 输出/行为 | effect |
|---|---|---|---|
| file_begin | size:0..8388608、mime、sha256:64hex | fileRef、chunkBytes=49152、expiresAt；预留配额 | write |
| file_chunk | fileRef、offset:非负整数、data:标准Base64 | nextOffset；同offset同内容可确认重试，冲突拒绝 | write |
| file_commit | fileRef | size/mime/sha256；仅完整且摘要一致可用 | write |
| file_status | fileRef | uploading/ready/expired及nextOffset，绝不列出其他引用 | read |
| file_read | fileRef、offset、length<=49152 | dataBase64、offset、nextOffset、eof、size/sha256 | read |
| file_delete | fileRef | deleted；重复删除同引用保持可解释结果，不误删新对象 | write |
| input_fetch | url:http/https、可选认证secretRef | 已提交fileRef/mime/size/sha256；15秒/8MiB | write |

边界：每块原始字节48KiB，编码后64KiB，加JSON封装仍低于MCP 256KiB。读取大文本按字节分块，调用方先拼字节再解UTF-8，不按块破坏多字节字符。输出小于业务上限的结果按原Schema内联，大结果返回文件引用；必须明确返回的是原始文本还是文件内容，不能用成功字符串代替数据。

文件最多32项/单实例64MiB、上传8MiB/生成结果16MiB、空闲15分钟；8MiB字节编码成Hex需16MiB，Base64约10.67MiB，输入/输出预算必须分别核算；解压/图像等业务各自原有限制不因此抬高。暂存于XHUB_DATA_DIR下专用临时目录，不进入ZIP/普通KV。生成文件前同样预留预算；上传未完成、校验失败、取消、过期均释放。引用带实例隔离的随机能力、不含路径；所有查找用映射表而非把fileRef拼接成路径，拒绝软链接/路径穿越。权限0700/0600。

**身份约束：** 当前工具协议只转发tool/args/callId，未携带最终用户principal。能力引用的不可猜测性不等于多用户ACL；仅按SDK可信自用模式交付，不提供全量list接口，不承诺每用户隔离。若部署目标需要互不信任的用户隔离，FULL-00必须先取得宿主身份合同，不能自行虚构用户ID或静默保存敏感共享文件。

传输不是自建上传HTTP服务：所有调用仍走宿主现有工具/MCP通道。任意浏览器本机路径、file://或服务器路径不作为文件输入。URL读取仅对应原UI已有下载输入，网络位置明确为服务器。

## DD-FULL-03 运行与取消

沿用SDK随机端口、XHUB_*、READY、/healthz和令牌校验。工具HTTP200只有ok=true且结果Schema通过才是成功；callId必须匹配。

当前取消接口始终accepted=false，扩展长任务前必须补齐：在接收合法callId时登记AbortController，SDK取消和连接中断触发同一取消信号；完成/失败时移除；取消与完成竞态只落一次终态。server.requestTimeout限制读请求，不当作业务计算截止；每个业务有独立总截止，包含排队。宿主timeoutSeconds实际允许1..300秒，模型SDK单次最多120秒。

重任务使用现有Worker思路：浏览器Web Worker、Node固定Worker/子进程，两端共用纯操作；不是让Worker执行调用方提供的模块路径。同步死循环靠终止，不能只用Promise.race。Node resourceLimits不限制ArrayBuffer/原生库内存，不能称为RSS硬隔离。图像/解压/表达式均有输入、像素、输出与执行时间预算；原生工作必要时固定Node子进程，父进程结束后不得孤儿运行。初始并发2/队列16，超载返回有界错误，调参须有真实测量。

临时文件、socket与模型句柄均与服务实例/版本绑定；服务停用/更新后原句柄明确expired/unknown，不迁移活动连接，不自动继续执行。现有ctool.pref.*配置键和JDoodle秘密字段不变；临时资源不作为用户永久数据迁移。

## DD-FULL-04 模块落点与复用

```text
packages/ctool-core/src/tools/*  → 纯业务函数/共享提示词 + 浏览器适配
packages/ctool-tools/src/index.ts → 保留旧公开导出
packages/ctool-tools/src/domains/{encoding,checksums,data,crypto,text,code,calculation,generation}
packages/ctool-tools/src/contracts/ → 无DOM/Node的参数/结果与定义
packages/ctool-tools/src/prompts/   → 现有12类提示词构造函数
service/main.ts → 统一注册/协议与调度
service/{runtime,files,keys,images,network,websocket,ai}.ts → 实际需要的运行时边界
service/workers/* → 固定可信执行入口
```

这是有双端消费者后的职责抽取，不给每项函数加接口/工厂/服务层。Node模块不得反向导入Vue、Pinia、$t/$error、组件实例或浏览器window。旧UI业务代码的隐式全局先改成显式错误/参数，翻译在UI边界。JSdom仅存在隔离Node适配，不放进纯包或浏览器bundle。原UI的网络位置和本地密钥语义保留。

研究优先保留：现有codec、Ajv、jsonrepair、JSONPath/JMESPath、QuickJS、quicktype、formatter、CryptoJS/sm-crypto/jsrsasign/bcrypt、dayjs/cron/mathjs、uuid/ulid、JsBarcode/jsQR、ws。详见[复用与外部依据](doc/research/full-ai-mcp.md)，不用重新实现codec、密码、diff、二维码、SSE或MCP协议。

## DD-FULL-05 密钥与结果

- Node密码工具只接收keyRef，从XHUB_SECRET_CONFIG的可选keys映射读取；保留jdoodleClientId/jdoodleClientSecret根字段。别名只做对象自有键查询，不解释路径，不返回完整秘密配置。
- 浏览器已有直接输入密钥继续本地计算，不因共享算法自动上传；外部调用的明文/解密结果本来就可能进入调用方上下文，不能宣传为不上传。
- 密钥对生成保留原功能，公开部分可返回，私钥以临时文件引用交付，不在普通日志/KV或常规摘要中展示。秘密配置的导入/更新仍由宿主既有入口完成，不建新密钥库或自动写回宿主配置。
- effect是实际副作用说明，不是授权或确认机制。纯签名/加解密按实际read处理，密钥导出dangerous；文件暂存/抓取write；WebSocket发送write；代码运行dangerous；ai_assist触发外部模型生成按write、查询read、取消write声明。完整工具可以被宿主选择，但不得声称宿主仅凭effect就会替所有MCP调用弹确认框。
- 旧弱密码算法只为兼容，已知向量必须通过；不自行“修正”填充/编码导致旧密文不能解。JWT解码不代表验签，SQL/Compose/chmod转换不执行系统操作。

## DD-FULL-06 网络、会话与写结果

管理服务器后端与浏览器有不同网络位置。IP/server-current只指服务器出口；浏览器current保持原义。WebSocket默认只在调用方给出URL后创建，不扫描网络或自动重放。可信自用允许明确的内网目标，不添加未经要求的全局外网限制；http/https/ws/wss/TLS及秘密引用按实际能力验证，禁止URL内嵌凭据、file协议和跨origin重定向泄漏认证。

WebSocket由ws8.21.0执行，关闭perMessageDeflate，maxPayload=256KiB，握手10秒；接收队列2MiB，发送bufferedAmount最多1MiB，最多8会话、空闲5分钟。receive按递增message sequence/cursor读取，返回是否丢失/关闭，不让外部AI永远阻塞在接收。二进制消息使用文件输出。close后有界等待再terminate。

send要求调用方提供稳定messageId；实例内缓存已发送ID与内容摘要，重复同ID同内容返回已知状态，冲突拒绝。callback成功只说明交给socket，不代表对端业务成功；断线后查询原ID可返回unknown，服务重启后不自动发送“未找到”的消息。

ARM保留逐架构成功/失败；JDoodle保留既有语言/versionIndex/script/stdin，秘密仍只在后端。HTTP成功、平台接收成功、编译/运行成功和用户程序业务正确分开。执行/发送可能已发生时的超时、断线、上游5xx或结果结构损坏都不自动重试。JDoodle未提供已核定幂等查询合同，不编造补偿或“查询后续跑”。真实JDoodle执行需已有费用测试授权；模拟与真实记录分开。

## DD-FULL-07 模型辅助

现有12类提示词复用为ai_assist(operation,业务输入,modelSelection)。正则生成与解释两个operation；其他按原界面，不额外发明新的AI业务。默认模式由宿主逐次解析，指定模式用稳定ref。

operation冻结候选为json_extract、regex_generate、regex_explain、cron_generate、sql_explain、stacktrace_analyze、config_detect、http_explain、code_explain、text_transform、diff_summarize、url_explain、ua_explain，共13项；每项payload有独立严格Schema，不用自由JSON承接全部操作。

Node使用SDK client/http.mjs、models.mjs、vendor；UI保持window.xhub.models。ai_assist创建/启动一次并尽快返回modelCallId，ai_call_status与ai_call_cancel复用SDK原句柄，不增加第二套SSE或供应商API。标准工具外层callId与模型modelCallId分开；宿主真实ownership/过期行为以FULL-00验证为准。

状态必须保留排队/运行/部分文本/截断/完成/失败/取消/超时/未知。缺默认模型时准确提示选择模型，不能隐藏成统一“生成失败”；指定模型失效不自动切换。流断开只查询原模型调用，不能因查询失败再请求一次。普通计算不调用模型；模型辅助可能产生费用。UI显式采用结果逻辑与旧输入保护保留。

## DD-FULL-08 依赖与可部署性

Sharp0.35.4已经存在于锁文件/开发依赖树，Node22.22.2已测小图SVG→PNG/JPEG/WebP→RGBA；它不是自动随现有服务部署的依赖。当前QR实际为baiy/styled-qr-code1.0.2 fork，直接Node require报self is not defined，上游1.9.2文档不能证明fork支持Node。

FULL-00必须确定渲染路径：优先原fork在固定隔离DOM的受控复用；不行时比较官方1.9.2+jsdom30.1.3/canvas3.2.3，并对全部样式、Logo与fork历史扫码修复做回归。不能以未通过原样式为代价改用普通qrcode并宣称完整。NodeCanvas的master文档已涉及v4预发布，本轮不采用未验证预发布，3.2.3实际预构建目标需单独核实。

jsdom30.1.3实际Node范围包含^22.22.2，若采用它，服务声明^22.22.2，不继续声称任意Node22可用；这不修改宿主全局运行时。任何候选版本更新重跑兼容/许可/漏洞检查。FULL-00未通过前不改依赖锁和manifest最低版本。

native生产依赖不适合当前noExternal全部合并的方式。FULL-12精确external保留native包，准备service/node_modules内只含生产闭包的可部署文件，保留平台绑定与动态加载文件/字体/WASM；当前assemble禁止node_modules的审计需精确调整该允许集，不能整仓复制。不能把开发机Linux x64验证冒充aarch64或其他libc兼容；没有产物与运行证据的架构不发布兼容结论。不得依赖宿主npm install或安装钩子。

## DD-FULL-09 验收与回退

以capability-cases.json的caseId为最小证据单元：每个业务操作/实际选项至少有正常样例，适用边界/非法输入、UI↔Node↔MCP一致性与独立已知向量。不是对每个无风险展示按钮造测试，也不是由一份共享错误实现自证三端一致。

顺序：模块单测→HTTP合同→干净包→既有浏览器回归→隔离宿主安装→内置AI调度/真实MCP→实际模型/外部服务（有授权时）→更新/回退/停用。旧14合同、17后端工具语义、配置键和用户数据必须保留。新版本沿0.2.0更新，不重写原0.1.0不兼容事实。

最终ZIP只打包一次作为验收对象，任何字节变化都重做受影响验收与摘要/市场条目。缺环境可交候选并标未验，不能关闭完整验收。只在本版本有发布授权后上传GitHub或更新签名市场，不能将历史发布授权扩为未来所有版本。
