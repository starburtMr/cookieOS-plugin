# Ctool 0.3.0 完整AI/MCP验证

日期：2026-10-31。运行ID仍为io.cookieos.ctool。只做本地开发、候选打包与隔离测试，没有推送、正式安装、重启正式服务或市场发布。

## 范围与结果

保留60类工具、88个登记页面入口；统一服务注册表实际导出100个工具，全部ai/mcp=true。旧17定义冻结于tests/fixtures/legacy-tools.json；14旧公开合同保持，ARM/JDoodle旧3合同保持并开启AI/MCP。数量分别表示页面分类、路由和去重服务名称，不代表全部参数组合已穷尽验证。143个可执行能力用例及60类/88入口映射实际保存在tests/fixtures/capability-cases.json。

完整门禁命令：`npx --yes pnpm@10.34.9 run verify`。Vue/共享包/严格服务类型通过；lint 0错误、195存量及迁移告警，预算300未抬高；25文件/355单元测试、229服务合同测试、8包测试、26浏览器测试通过，0新增重复。固定JSON夹具和原有排除的ASN1 vendor迁移路径不参与相似性评分，基线未改。详见checks.json。

服务验证包括8MiB上传→全部摘要/HMAC→16MiB Hex下载、摘要核对、配额/过期/重启；正则真实SIGKILL取消、队列超载与10秒截止；QuickJS内存/死循环/无宿主对象、大整数；SM2/RSA/传统加密往返和篡改签名；13模型操作、取消、并发及丢响应不重放；WebSocket文本/二进制文件、cursor重读、防重发、溢出与失效。

页面测试通过88入口挂载、12类AI辅助、接收结果/旧输入保护、断线未知、表格不可信HTML、WebSocket离页关闭、RSA浏览器/Node交叉、SM2、Bcrypt以及桌面/手机/短屏设置。模型桥模拟与真实隔离宿主验证分开记录。

## 最终产物

ZIP：仓库外层`dist/ctool-0.3.0/ctool-0.3.0.zip`，40929066字节；解压131025770字节、4167文件；manifest紧凑JSON为129057字节，低于宿主256KiB预算。完整CRC、路径/链接/文件集检查通过，未包含开发框架、凭据、运行数据或构建缓存。SDK1.2.0 check/pack通过，宿主实际安装结果见host-results.json。

SHA256：`2a42f6a4b858c131e9db4fc6aa43e25a3e9e722b13adf1f61e4acd1ae4dcb1ac`。

运行条件：Linux x64/glibc、Node ^22.22.2；原生运行依赖在开发机准备，宿主不运行安装钩子。sharp0.35.5/libvips1.3.4/librsvg2.63.2；运行闭包npm audit为0已知漏洞。不是漏洞不存在的保证。安装包licenses/native中的二进制摘要与实际文件测试一致，组件版本在组装时生成。

安装：到cookieOS“扩展→已安装”，点击“安装扩展→本地ZIP”，上传上述包。启用AI/MCP工具开关；外部AI还需在“MCP服务”选择本插件/工具并配置服务令牌。模型辅助复用宿主模型设置。无需把宿主或MCP令牌写进插件。

## 隔离验收复跑

`tests/host_acceptance.py --help`提供完整参数；传入cookieOS源码根目录、匹配二进制、最终ZIP、不可变0.2.0 ZIP和尚不存在的output，附加`--browser`。脚本复用宿主RemoteFixture/Checks，不重写安装器或MCP。数据库/端口/随机账户/秘密配置完全独立，退出清理自有资源。

浏览器使用已有cookieOS静态构建，Playwright route.fetch转发真实隔离API；不是模拟插件、模型桥或工具响应。模型供应商是本地确定性协议夹具，不是付费外部模型。既有前端构建index SHA256为`0d768b836bd631d3a145fc823bbdfa38e7c8c18a5402d234669f1ca7da157e23`，不重建/修改宿主。

## 修复与审查

验收发现manifest排版超限、JSON转换CJS动态导入、Properties原型键与第三方BigInt序列化缓存、最小负数补码、纳秒精度、SQL字符串转义、旧RSA加解密API缺失等问题并回归。提交前审查再发现异步Schema误判与Sharp高危依赖；前者留下红灯再修复，后者依据GHSA-wq5f-xc86-pv6w升级到首个修复版并复验。

当前主执行者顺序进行两阶段审查，无独立审查者；最终结论见review.md。不能把检查通过称为零bug。

## 明确未验证与限制

- 未调用真实外部模型、ARM/GeoJS实时供应商或JDoodle付费执行；只验证适配、协议与错误语义。
- 未验证其他OS/CPU/libc、旧宿主、24小时长期运行、所有语言/单位/样式参数组合；工作日数据2004—2026，超过范围明确失败。部分圆点+Logo QR不可识别时明确失败。
- 最终版本未重做正式市场卡片、详情弹窗预览/坏图/无截图全套宿主测试；已有0.2.0历史记录保留，当前只验真实安装资料API/图像与四种插件界面，不把旧证据冒充当前验收。
- 原生RSS不是硬上限。8MiB文件测试50ms采样进程树峰值约510MiB，见resource-results.json；不是所有图片负载上界。
- 主许可证MIT，第三方保持各自条款。公开再分发前须解决部分上游缺独立MIT声明及精确原生对应源码归档，见third-party/native/README.md；本轮不宣称公开发布条件已齐。
- 未生成0.3.0 item.json/市场媒体导出，未设置虚构URL或publishedAt，也未修改正式清单/sequence/签名。本地产物不是已发布。
