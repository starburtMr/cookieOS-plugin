# FULL-09：联网、WebSocket与在线运行

状态：未开始；本文件是任务合同，实际进度只在 [Progress](../../../Progress.md) 记录。

## 目标与输入

目标：完成本模块在[覆盖矩阵](capability-matrix.md)的全部操作，不以接口数代替功能覆盖。
输入：既有GeoJS/ARM/JDoodle、ws 8.21.0、SDK实际effect和未知结果约定。
依赖：FULL-01/02；code_transform只依赖FULL-06。
设计：[Detailed-Design](../../../Detailed-Design.md)；复用依据：[研究记录](../../research/full-ai-mcp.md)。

## 文件归属与输出

service/network.ts、service/websocket.ts、input_fetch处理；共享定义；UI保持原网络位置。
主执行者拥有集成/公共注册表/文档；本轮不授权子智能体。后续多人改动不得回退他人差异，公共合同变更先回FULL-00。

## 实施步骤

1. 开放既有ARM/code_run/code_credits，保留原合同与JDoodle秘密配置；声明真实effect：ARM/额度read、在线运行dangerous。
2. IP查询区分指定IP和管理服务器出口；浏览器UI保持浏览器出口。input_fetch补齐现有URL文件输入，http/https、TLS校验、15秒、8MiB，不接收服务器文件路径。
3. ws复用8.21.0：5个明确操作，会话ID/消息序号/接收cursor，发送callback只代表写入成功不代表对端业务处理；不自动重发，错误/断线后标未知影响。
4. 初始最多8连接、空闲5分钟、每消息256KiB、每连接接收队列2MiB、发送bufferedAmount上限1MiB，超限明确关闭并说明丢失；关闭压缩，握手10秒，close后限时terminate。
5. 可信自用可请求明确指定的内网目标，不擅自新增全局网络白名单；拒绝URL内嵌凭据、非支持协议、危险重定向传密钥。认证头用secretRef，不建通用服务器命令工具。
6. JDoodle可达语言以账号与官方为准；程序statusCode、编译错误与HTTP错误分开；5xx/断网/超时/格式坏均不自动重试执行。

## 验收与证据

- 本地隔离回声WebSocket覆盖文本/二进制、重连不重发、队列溢出、关闭/更新清理和取消竞态。
- ARM逐架构失败、JDoodle业务失败/凭据缺失/额度/结果未知；假上游可自动验证，真实服务另记。
- 长接收文件经分块读出；不得因实现新接口改变现有UI网络位置。
- 测试接入现有 `pnpm test`、`pnpm test:contract`、`pnpm test:package`、`pnpm test:e2e` 对应入口，单模块先跑适用子集；命令与完整集成顺序见任务入口。不为无关代码造新检查器。
- 记录样例、命令、退出状态、实际产物与未验证项；失败修复后重跑受影响检查，再做顺序两阶段审查。不以文字勾选替代证据。
