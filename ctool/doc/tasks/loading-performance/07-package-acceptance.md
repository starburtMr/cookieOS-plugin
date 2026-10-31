# PERF-07：最终包、隔离宿主与合回

目标：递增版本的最终ZIP完成真实隔离验收，交付可回退产物及证据，并安全合回、清理自有worktree。

依赖：PERF-06。契约：[DD-PERF-07](../../../Detailed-Design.md#dd-perf-07-预算与完成门槛)。范围仍仅插件；不能修改宿主或操作正式服务。

## 文件归属与复用

manifest.json、metadata.json实际releaseNotes、现有assemble/打包入口、doc/verification/loading-performance、Progress与本轮模块结果。
版本身份继续只维护在manifest，保留SDK1.2展示合同。0.3.0旧包作为回退对象；拟用0.3.1，执行时检查是否已被其他发布占用。

## 实施步骤

1. 完成所有模块及主执行者顺序审查后递增版本，执行现有verify，检查新性能门禁确实在入口内。任何版本/内容改动后重新构建与摘要，不覆盖已有同名包。
2. 读取实际SDK的sdk.json及dev.py --help；当前为1.2.0/hostApi ^1.0.0。按现有build:extension输出dist/extension执行check/pack，ZIP位于插件目录外的新版本产物目录，输出已存在则停止检查。
3. 对最终ZIP审计入口、Worker/WASM/语言资源、所有运行依赖、媒体与许可证；排除性能原始trace、缓存、测试报告、用户数据及凭据。保留旧包、SHA和构建来源。
4. 在授权的隔离cookieOS实例安装这个最终ZIP，测四种surface及默认/直达路径。用同样脚本重跑性能组和关键工具，区分宿主打开耗时和iframe内部耗时。
5. 分别从源码候选0.3.0与当前市场0.2.0的测试配置/数据升级到候选，验证停用/启用、回退、保留数据重装；坏包安装失败不破坏旧版。AI/MCP代表性回归保留100工具发现/合同检查，模型使用本地协议夹具标注清楚，不自动发生真实付费请求。
6. 汇总首屏最终依赖、被移出能力、必要重型工具依赖、before/after多次样本、失败恢复、资源计数、用户数据保留、宿主协作事项和剩余风险。未测旧宿主/浏览器明确列出。
7. 只提交自有代码/测试/文档；保留主目录原dirty/index，合回后复验入口及产物一致性，再清理自有worktree与分支。冲突先比对，不reset/stash或覆盖他人改动。
8. 本模块不自动推送/创建Release/更新签名市场。用户另行授权发布时，先处理现有原生许可/对应源码材料，沿docs/market.md和SDK从最终ZIP生成item/媒体及签名，不能只推源码称为更新市场。

## 实际命令骨架

在ctool工作目录先完成现有build:extension/verify；SDK_DIR必须指向已经核实的完整SDK，命令变量是待执行环境配置，不是SDK新增接口：

~~~sh
rtk proxy python3 -c 'from pathlib import Path; Path("../dist/ctool-0.3.1").mkdir(parents=True, exist_ok=False)'
rtk proxy python3 "$SDK_DIR/dev.py" check dist/extension
rtk proxy python3 "$SDK_DIR/dev.py" pack dist/extension ../dist/ctool-0.3.1/ctool-0.3.1.zip
rtk sha256sum ../dist/ctool-0.3.1/ctool-0.3.1.zip
~~~

pack前用标准路径检查确认版本目录/ZIP输出不被覆盖。若版本已变化，命令中的版本同步替换。没有获准的不可变地址和实际发布时间，不生成虚构market-item。

## 必要验收与阻塞

- ZIP通过SDK预检且隔离宿主实际安装/业务/更新回退通过，摘要与本次验收对象一致；不得将源码构建视为最终ZIP已运行。
- 真实缓存策略、入口无法求值时的宿主重开提示、宿主仅隐藏iframe且SDK无关闭通知分别记录。未证实需要的宿主修改不纳入实现。
- 缺隔离实例可交源码与候选ZIP，但本模块真实验收保持未完成，不能以本地fixture替代。
- 交付核对7个模块文件存在/非空、文档链接、任务编号/依赖与结果；开发经验只写实际证据和失效条件，未实现建议继续标待验。

## 验证记录

规划交付尚未构建0.3.1或安装任何新包；本轮不会推送/发布。实施后在此记录命令、SHA、宿主版本、报告路径、合回与清理结果。
