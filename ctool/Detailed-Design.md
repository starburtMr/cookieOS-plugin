# Ctool 详细设计

## DD-PERF-01 边界与复用

本节是2026-10-31加载优化的目标设计，尚未实施；不把FULL阶段历史验收写成性能优化已通过。
保留插件io.cookieos.ctool、100个服务工具及AI/MCP合同、现有算法/精度/校验、偏好键和用户数据。只改前端入口/依赖、启动偏好、构建和相关测试；service与cookieOS源码不在修改范围。基础共享函数仅移动归属并从旧入口re-export，同一操作仍只有一份业务实现。
复用决策和适用版本见[外部依据](doc/research/loading-performance.md)。不用新运行依赖、自研编辑器/计算引擎、Service Worker、另一套MCP、全量路由预热或全页KeepAlive。
运行目标待实施递增为0.3.1；若已有同版产物则选择下一个未占用版本。本轮规划不修改版本或生成候选包。

## DD-PERF-02 测量合同

- t_open由测试执行者在点击宿主打开动作前记录；direct-frame测量另列，不能混成宿主打开耗时。t_input为当前工具真实输入成功，t_result为固定测试操作输出通过断言；主指标T=t_result-t_open，辅助报告输入就绪与计算区间。
- 使用生产构建、固定测试输入、同宿主/浏览器/硬件/viewport/入口/surface/网络CPU条件。view做完整样本组，module/window/drawer做同条件功能与少量性能采样。网络/CPU受限组与正常组分开，不能把本地无压缩fixture当线上性能。
- cold为新HTTP资源缓存环境；warm为同缓存环境的新插件实例；同实例第二次进入工具另列。是否缓存命中由浏览器事件与资源时序佐证，含实例参数的新URL不人为改写。
- 资源采集含请求数、transferSize、encodedBodySize、decodedBodySize、缓存来源、失败重试、发起时间/链及CSS/字体/Worker/WASM。CDP字节只代表浏览器记录，不等于TLS链路完整流量。跨源或API不支持记unknown，不把transferSize=0自动解释为命中。
- 偏好只记键的耗时/状态或聚合计数，不记录值。PerformanceObserver记录>50ms长任务次数/总长/最大值；解析执行归因使用必要的CDP trace，下载时长不能代替CPU时间。
- cold至少5次、warm新实例10次、重工具首用/重复10次；切换30轮、关闭重开10轮。报告所有样本、median/min/max；N<20不输出稳定P95。before/after交错运行，先冻结baseline/budget，再改代码。
- 调试trace只用隔离测试数据，提交脱敏摘要，禁止用户正文、Cookie/令牌、完整偏好及生产HAR。故障注入用route单独运行，不参与缓存组。
- PERF-01产出基线；当前只有已有0.3.0产物静态快照，所有毫秒收益仍待测量。

## DD-PERF-03 依赖拆分与资源调度

允许依赖为轻量入口→路由/显示元数据/偏好；当前页面→所需组件/业务模块；编辑器组件→Monaco与所需语言服务；任务→对应Worker能力。
语言名称与别名从当前版本最小数据获得，不通过编辑器运行时查询。保留完整语言id/aliases、原自定义别名和plaintext回退，测试与真实Monaco注册表对照；升级Monaco必须更新依据。
基础错误/校验/编码/进制函数放无注册副作用的中立模块，领域模块不反引工具注册入口；旧导出重新导出同一对象，不复制算法或降低校验。
保留路由动态import。全局序列化组件要么真正异步，要么其顶层依赖变轻；仅Editor异步无法切断当前旁路。
Vite先对照自动分块，再按证据保留必要manualChunks；moduleInventory扩展chunk.modules/imports/dynamicImports/大小，原许可聚合不丢。不能将CommonJS辅助函数并入重块后再由轻块静态引用，不全局关闭副作用追踪。
不需要编辑器/数学/格式化的轻量工具不加载它们；进入相应工具才并行取必需资源。利用现有Vite动态导入预载，明确默认工具后才预取该工具；不下载全部工具换取好看的切换数据。
CSS/字体也纳入预算；若拆CSS需保留manifest声明的ui/style.css和动态CSS加载，懒CSS不能全部命名style.css而互相覆盖。Worker使用原相对URL与模块格式，不从CDN补运行资源。

## DD-PERF-04 设置初始化与写入保护

轻壳与设置/确定目标工具的资源并行准备；shell出现不是工具可用。设置时序：

| 设置或能力 | 应用时点 | 未就绪/失败时 |
|---|---|---|
| theme/宿主主题、locale、zoom、layout | 对应内容开放交互前 | 使用明确的本实例降级，不写回；迟到响应受本地修改代次保护 |
| common | 默认入口选择前 | 等待或明确降级后只选一次；直达工具无需等它；不因迟到读取强制跳走 |
| 最近工具 | 沿用现有同实例operate状态 | 不增加跨新实例持久化，分别测实际行为 |
| 剪贴板自动读/复制/过滤 | 使用能力前 | 未确认不自动读写剪贴板；手动动作按用户手势/权限处理，不阻塞纯计算 |
| ai_model | 相应模型动作前 | 选择尚未确认时不启动AI，失败可重读或明确选择；不自动请求模型 |
| 其他偏好 | 对应功能需要前 | 按键加载状态控制，不能要求所有工具等待无关设置 |

每键持有读取状态、读代次、本地修改代次和已确认保存对照。只有本地未修改且仍是当前读代次才应用读取；重试只读失败/未完成键，不能重置其他键保存基线。
早挂载后Pinia已存在，远端水合要显式更新真实store与同步镜像，不能只改memory。水合与用户修改来源分离，保存对照先于控件更新建立，持久化订阅不得将水合当用户修改回写。
null表示未设置，reject/超时表示未知，非法值表示不可采用，三者分开。保持逐键写入、原键名和校验；保存确认前不宣称已保存，失败保留当前选择并允许显式再保存。默认/降级/远端水合不触发写入。
恢复期限在PERF-01冻结，初始建议3秒作为可见失败反馈上限，须与实际桥截止区分；超时不代表底层RPC已取消，迟到结果同样隔离。
多窗口不同键互不覆盖；同键最后成功写入，无CAS/实时通知保证。重新打开重新读，不合并整份设置，不迁移旧数据。
主题订阅事件优先于更早发起的theme.get响应，避免迟到get反转新主题；用户明确主题优先。关闭前未确认的写入不靠beforeunload假装可靠完成。

## DD-PERF-05 编辑器与Worker生命周期

Editor/Diff就绪=运行时成功、编辑器/自有模型创建、初始内容/语言/主题应用完毕并能编辑；create返回真实Promise。若测试涉及诊断/格式化，还须对应语言Worker实际响应。
每次创建有代次与disposed标记；等待后检查拥有权。成功运行时在同实例复用，失败不永久缓存；不调用loader私有reset，不以await一个立即返回函数当ready。
父层持有输入，初始化完成后取最新值；不为每次内容变化创建轮询timer。卸载清理自身事件、observer、completion、editor和自建model，不能清理其他编辑器资源。
Monaco的共享运行时/语言Worker按实际版本生命周期管理，只有本实例所有权清楚才主动终止；两个编辑器和两个窗口验证互不干扰。
task Worker保持每任务终止/取消/超时边界，按kind加载所需模块；先不引入池。按需导入错误纳入加载状态；不可因为重试资源自动重复用户任务，也不默默放宽计算时间上限。
监听、模型、Worker计数区分共享与自有；连续30轮切换及10轮重开后无无界增长证据。iframe整体销毁由浏览器释放资源，不把新上下文计数清零当作单实例清理已验。

## DD-PERF-06 失败恢复与打开形态

入口、路由、编辑器、执行各自反馈，不用统一全页loading遮住旧可用内容。局部失败有稳定布局、键盘可达的重试；输入仍在原状态所有者，不通过重挂全app清空。
路由在解析组件前失败则保留旧页面与目标重试；加载成功后按最新目标代次接入，旧Promise完成不覆盖新导航。错误边界不能捕获“入口本身未下载/求值”的全部失败。
暂时下载/链接失败要验证恢复网络后的同URL重试；模块求值失败可能被浏览器缓存。只清自有rejected Promise不足以保证恢复，不无限拼时间戳创建模块副本。
永久求值错误/版本过期允许明确“重新打开”恢复，但先提供显式复制草稿；不向普通KV保存敏感内容，不自动刷新。重试加载新增业务请求必须为0，已提交AI、JDoodle、发送/写操作不能重放。
沿manifest验证module/view/window/drawer，当前没有额外overview surface。关闭的含义取决于宿主销毁或隐藏iframe；SDK没有关闭回调时，不能虚构通知或承诺隐藏即终止全部资源。

插件外的最小观察/协商项，不在本轮修改：
1. 只有实际发现缓存不命中且主要受宿主响应头/实例URL影响时，提交响应证据，请宿主评估按版本不可变资源缓存；不要求缓存可能带授权差异的动态内容。
2. 入口资源都无法执行时的可见错误/重新打开由现有宿主承担；确认缺口后提出最小错误反馈，不复制宿主详情页。
3. 若宿主只是隐藏且要求即刻释放，协商明确的关闭/暂停/恢复合同；若需要对外ready，提出带instance、surface、工具标识和阶段的独立合同。当前不调用不存在的API，也不把主题消息或iframe load作为ready。
批量偏好、CAS及通知不是本轮性能修复的必要前提，不能以此阻塞所有插件侧优化。

## DD-PERF-07 预算与完成门槛

PERF-01在改代码前以相同测量条件冻结B值，以下是本轮待验证目标，不是已获得收益；不得根据候选结果反向放宽：

| 门槛 | 验收规则 |
|---|---|
| 轻量依赖结构 | shell/hash/Base64不含无关Monaco、mathjs、Prettier、quicktype、QuickJS；hash必要摘要依赖单独允许；同时检查产物图和实际请求 |
| 轻量初始JS | 相同入口从t_open至结果的去重decoded JS不超过基线B_JS的40%；现有6,405,087仅静态快照，不直接代替B_JS |
| 冷开正确结果时间 | median T_after不超过0.70×B_cold；分别报告输入就绪与执行区间，不能靠减少样例工作量达标 |
| 暖开/重复切换 | median不比基线慢超过max(50ms,10%×B) |
| 首次重工具 | median不比相同直达/切换基线慢超过max(100ms,10%×B)，并解释必要下载链 |
| 稳定性 | 暂时加载失败可恢复，永久错误有输入保护后的明确恢复路径；无新pageerror/缺资源/过期结果覆盖；监听与资源无持续线性累积 |
| 功能/配置 | 既有verify、旧工具合同、语言能力、精度/安全限制与偏好保护回归通过；真实费用请求另授权 |
| 发布对象 | 递增新版本，最终ZIP与报告SHA一致；四种形态、升级/回退/停启/保留数据重装在隔离宿主通过 |

若测量噪声与目标量级相当，先增加样本/隔离干扰并记录，不挑样本、不放宽阈值“过线”。未达标时记录原因和继续优化，不以构建通过替代性能门槛；确有环境或产品取舍变化另形成明确决策。
确定性结构门禁接入build:extension和verify；固定环境的耗时门禁通过新增test:performance单独执行，避免将任意机器速度当产品失败。缺环境的项保持未验。
最终提交只含本轮代码/必要文档/脱敏证据，保留主目录未提交改动，合回复验并清理自有worktree。推送、Release、市场更新和正式服务操作仍分别遵循授权。


本文件定义0.3.0完整工具化合同；实际完成与测试结果见Progress和模块验收记录。原0.2.0的14个公开AI/MCP工具保留。上游业务范围以[覆盖矩阵](doc/tasks/full-ai-mcp/capability-matrix.md)为准，阶段见DEV-PLAN，步骤与验收仅在模块任务中。

## DD-FULL-01 边界与接口兼容

- 运行ID维持io.cookieos.ctool、manifest/metadata schemaVersion=1、SDK1.2.0/hostApi ^1.0.0；运行版本为0.3.0；仅在本地交付，不自动发布。
- 目前60类/88登记入口不等于原子操作数；FULL-00必须把各页面的算法、按钮操作、选项、输入输出模式枚举成caseId。13个模块、100个去重工具名称候选并不代替operation覆盖。
- 保留原14个名称、参数类型/枚举/错误与结果合同。扩展能力主要用新工具；旧接口调用同一业务函数，不复制旧实现和新实现。已有ARM/JDoodle三个工具保持参数和结果，仅按本轮范围开启ai/mcp并维持真实effect。
- 新Schema统一显式声明Draft7以匹配现有Ajv8实例，嵌套用Draft7语法；宿主严格编译每份输入/输出Schema。不得混用2020-12的元组语法，也不得为通过检查吞掉unknown字段。
- 每个工具定义只存在一次，包含name/title/description/effect/inputSchema/outputSchema/ai/mcp/timeoutSeconds；纯计算定义和业务函数属于ctool-tools，运行时工具定义由service模块导出，主服务统一组合并由assemble生成manifest。UI不手抄算法或第三份合同。
- 新名称最长40 ASCII字节；最终manifest不超过256KiB。当前候选100个工具正好达到宿主MCP默认一页100，不能假定永不分页；跨插件或后续数量变化测试cursor。若Schema预算超限，按已有业务族合并operation枚举，不删操作或扩大宿主预算。

## DD-FULL-02 输入、结果与文件

file_begin中的mime是调用方提示，消费端必须核实实际格式；未知字节默认application/octet-stream，不据扩展名或声明直接内联渲染。

普通输入保留现有text/string/JSON模式；二进制新增互斥输入形态：text或fileRef（二选一；编码文本由对应工具解释）。from/to encoding按原工具实际支持枚举定义，不能把任意字符串作为编码。原14接口不接收新字段。

建议新增文件工具合同，由FULL-00冻结字段和Schema：

| 工具 | 输入关键字段 | 输出/行为 | effect |
|---|---|---|---|
| file_begin | size:0..8388608、mime、sha256:64hex | fileRef、size、mime、sha256、expiresAt；预留配额 | write |
| file_chunk | fileRef、offset:非负整数、dataBase64:标准Base64 | nextOffset；同offset同内容可确认重试，冲突拒绝 | write |
| file_commit | fileRef | size/mime/sha256；仅完整且摘要一致可用 | write |
| file_status | fileRef | uploading/ready及nextOffset；过期返回resource_expired，绝不列出其他引用 | read |
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

重任务使用现有Worker思路：浏览器Web Worker、Node固定Worker/子进程，两端共用纯操作；不是让Worker执行调用方提供的模块路径。同步死循环靠终止，不能只用Promise.race。Node resourceLimits不限制ArrayBuffer/原生库内存，不能称为RSS硬隔离。图像/解压/表达式均有输入、像素、输出与执行时间预算；Node计算统一使用固定子进程；原生工作也在这些进程中，父进程结束后不得孤儿运行。初始并发2/队列16，超载返回有界错误，调参须有真实测量。

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
- effect是实际副作用说明，不是授权或确认机制。纯签名/加解密按实际read处理，密钥导出dangerous；文件暂存/抓取write；WebSocket发送dangerous；代码运行dangerous；ai_assist触发外部模型生成按write、查询read、取消write声明。完整工具可以被宿主选择，但不得声称宿主仅凭effect就会替所有MCP调用弹确认框。
- 旧弱密码算法只为兼容，已知向量必须通过；不自行“修正”填充/编码导致旧密文不能解。JWT解码不代表验签，SQL/Compose/chmod转换不执行系统操作。

## DD-FULL-06 网络、会话与写结果

管理服务器后端与浏览器有不同网络位置。IP/server-current只指服务器出口；浏览器current保持原义。WebSocket默认只在调用方给出URL后创建，不扫描网络或自动重放。可信自用允许明确的内网目标，不添加未经要求的全局外网限制；http/https/ws/wss/TLS及秘密引用按实际能力验证，禁止URL内嵌凭据、file协议和跨origin重定向泄漏认证。

WebSocket由ws8.21.0执行，关闭perMessageDeflate，maxPayload=256KiB，握手10秒；接收队列最多64条/2MiB，发送bufferedAmount最多1MiB，最多8会话、空闲5分钟。receive按递增sequence/cursor读取，cursor确认并释放旧消息；同cursor可重复读取尚保留消息，返回nextCursor/earliestCursor/gap/丢失与关闭状态，不让外部AI永远阻塞在接收。二进制消息使用文件输出。主动close后最多250ms再terminate；溢出明确关闭并保留可读队列与dropped状态。

send要求调用方提供稳定messageId；每会话最多128条发送ID与内容摘要记录；达到上限时明确拒绝新增消息号，重复同ID同内容返回已知状态，冲突拒绝。callback成功只说明交给socket，不代表对端业务成功；断线后websocket_status可查询messageId的pending/sent/unknown状态，服务重启后不自动发送“未找到”的消息。

ARM保留逐架构成功/失败；JDoodle保留既有语言/versionIndex/script/stdin，秘密仍只在后端。HTTP成功、平台接收成功、编译/运行成功和用户程序业务正确分开。执行/发送可能已发生时的超时、断线、上游5xx或结果结构损坏都不自动重试。JDoodle未提供已核定幂等查询合同，不编造补偿或“查询后续跑”。真实JDoodle执行需已有费用测试授权；模拟与真实记录分开。

## DD-FULL-07 模型辅助

现有12类提示词复用为ai_assist(feature,text,modelRef及公开预算参数)。正则生成与解释两个operation；其他按原界面，不额外发明新的AI业务。默认模式由宿主逐次解析，指定模式用稳定ref。

operation冻结候选为json_extract、regex_generate、regex_explain、cron_generate、sql_explain、stacktrace_analyze、config_detect、http_explain、code_explain、text_process、diff_summarize、url_explain、ua_explain，共13项；每项payload有独立严格Schema，不用自由JSON承接全部操作。

Node使用SDK client/http.mjs、models.mjs、vendor；UI保持window.xhub.models。ai_assist创建/启动一次并尽快返回JSON文本中的callId，ai_call_status与ai_call_cancel复用SDK原句柄，不增加第二套SSE或供应商API。标准工具外层callId与模型callId（位于结果JSON内）分开；宿主真实ownership/过期行为以FULL-00验证为准。

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

## 本轮落点与冻结合同补充

- 固定执行入口为service/worker.ts，调度在service/runtime.ts；网络会话在service/connections.ts，模型在service/models.ts；没有为候选文件名强建目录。纯模块位于ctool-tools/src/domains，DOM只在src/adapters/tableDom与Node入口装配。
- 文件/密钥/网络/模型定义位于service/*Definitions与对应运行模块，旧14纯工具定义保留原公开包入口；allTools是打包manifest、AI与MCP的唯一注册来源。最终运行manifest以紧凑JSON输出并断言<=256KiB，避免排版使100工具清单无法安装。
- HTTP/WS认证仅从秘密配置requestHeaders[secretRef]读取，拒绝URL内嵌凭据、跳转及无效头；不提供任意HTTP写操作。
- key_pair_generate为dangerous，返回publicKey与privateKey文件元数据；私钥只通过file_read取得。新摘要接口返回Hex文本，RSA签名用signatureEncoding；未实现的output参数不进入其Schema。AES/DES/3DES/RC4/Rabbit均支持Base64文本密文或临时字节文件，浏览器密钥保持本地。
- Schema按13个feature分别收窄：diff_summarize必须modified，可选language；其余feature拒绝无用modified/language。模型并发上限包括正在创建调用的请求，防止并发穿透。
- 静态预算不代替原生RSS隔离。原生组件的发布来源/许可记录见third-party/native；公开再分发前仍需归档精确对应源码及解决上游未附独立MIT声明的记录，不能宣称公开发布条件已齐。
