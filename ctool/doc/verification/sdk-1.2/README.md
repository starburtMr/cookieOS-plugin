# SDK 1.2.0 展示适配验证

日期：2026-10-31。版本：0.2.0。本轮只做本地适配、隔离验收与产物准备；没有推送、正式市场发布、修改正式数据库或重启正式服务。

## 权威输入与盘点

- 从官方 SDK 公网入口 HTTPS 下载，HTTP 200、ZIP CRC/路径/链接检查通过；sdkVersion=1.2.0、hostApi=^1.0.0。下载 SHA256：`9a8effc105cbc44f42f84a997a2a8c78f35128a63dccf4c5b316511b3906e868`。已完整读取 SDK README、metadata schema、开发 Skill、dev.py 帮助及宿主 DD-PMD。
- 运行 ID 未变，Node >=22，四种 UI 形态及原权限、桥能力、工具名称/参数/结果保持；唯一工具声明修正是 ARM outputSchema 显式标注 Draft7。原有 KV 键、普通/秘密配置和会话历史不变，无数据迁移。
- 实际枚举结果：60 个 UI 工具、88 个 feature 入口、12 类 UI 模型辅助；服务 17 个工具，其中 AI/MCP 各 14 个；ARM/JDoodle 三个操作不开放给 AI/MCP。统计来源及清单见 [盘点 JSON](../../../docs/sdk-1.2-inventory.json)。

## 字段、图片与许可证

运行身份只在 manifest 维护，metadata 通过原 SDK schema 严格检查，没有复制名称/版本/作者/分类或新增认证/统计字段。图标复用原 Ctool `packages/ctool-site/public/icon/icon_512.png`（512×512），来源许可沿用 Ctool MIT。三张截图为插件真实页面处理虚构示例输入，不含真实凭据和个人数据；截图时只用本地预览桥，未伪造模型结果，实际安装界面另有下述验证。截图为1074×500 PNG，字节/尺寸由真实安装器校验。安装包介绍为 UTF-8 Markdown、更新为纯文本；真实链接均为项目 GitHub HTTPS 页面，主许可证 MIT，208 份实际依赖许可及 LGPL 源码/source maps 随包保留。

## 命令与实际结果

| 检查 | 结果 |
|---|---|
| `pnpm build:extension` | UI 类型检查、Vite、Node bundle、干净目录组装通过；保留原依赖注释/crypto externalize/混合导入告警 |
| `pnpm check:service` | 退出0 |
| 四个变更源码/测试文件 ESLint | 修正测试 const 声明后退出0 |
| `pnpm test:contract` | 22/22，含无效参数、业务失败、超时/未知结果、不自动重放 |
| `pnpm test:package` | 7/7，含身份单一来源、旧合同、方言回归、展示 schema、无 node_modules 独立服务 |
| `pnpm test:e2e` | 22/22（1.3分钟）；88 路由、12 类模型辅助的模拟桥回归、Worker、二维码及加解密往返 |
| `pnpm check:duplicates` | 新增重复0，未重建基线 |
| SDK 1.2 `check` / `pack` | 退出0；最终 ZIP 完整性与允许文件集检查通过 |
| SDK 1.2 `market-item` | 从最终ZIP生成条目和4份摘要命名媒体；输出事先不存在 |
| 真实隔离宿主 API 与浏览器 | 安装、运行与生命周期结果见下面证据；非生产 |

完整 SDK 命令在本轮使用下载目录执行，输入为 `ctool/dist/extension`；输出为仓库外层 `dist/ctool-0.2.0/ctool-0.2.0.zip`。market-item 的 URL 与 published-at 来自实际启动的临时 HTTPS 服务，使用独立测试 CA，不更改系统证书或关闭公网 TLS 校验。第一次临时证书链不符合严格客户端要求，修正 CA/叶证书及 keyUsage 后复验通过；没有当成产品故障或忽略 TLS 错误。

## 隔离宿主验收

复用 cookieOS 的 RemoteFixture 和 Checks：独立 PostgreSQL 容器/卷、临时配置、主密钥及随机测试账号；实际候选后端摘要见 [产物记录](artifact.json)。独立 UI 开发端口代理到该候选；文件监视器配额不足时沿宿主测试设施改用本次进程的 polling，未改系统设置。

- [安装与生命周期](host-results.json)：最终 ZIP 实际安装；普通配置及 KV 保留；图标/三截图/Markdown/许可证可读；实际 JSON/Base64 调用；MCP initialize/list/call 及令牌清理；停用仍可读取资料、重新启用；非法 metadata 在替换前被拒绝且当前工具仍可用；回退及保留数据卸载/重装通过。
- [市场下载与导出](market-results.json)：真实 HTTPS 清单刷新及精确版本安装通过，最终 ZIP 和每个媒体下载后重新计算摘要；要求投影 AI=14/MCP=14 与实际 manifest 一致。媒体浏览器传输用显式测试 CA 验证后转发；未绕过证书错误。
- [浏览器](browser-results.json)：实际卡片名称、作者、分类和版本；桌面1074×884、手机390×844、短屏390×442资料弹窗边界与可达按钮、三张图、Markdown、更新和链接；预览 Enter/Tab/Escape；实际已安装介绍；实际 iframe JSON 和分类切换通过。坏图/缺少可选字段是受控响应/网络故障注入，只用于展示降级，不冒充正常服务器数据。
- [AI](ai-results.json)：真实宿主助手经本地模拟 SSE 供应商调用 Ctool json_format 成功。外部真实模型推理、真实费用或 JDoodle 凭据调用未执行。

### 升级和兼容限制

原公开0.1.0 ZIP在当前宿主因 ARM 元组 Schema 未声明 Draft7 被拒绝安装，此为本轮真实发现。为验证历史数据行为，只对原ZIP的 ARM outputSchema 增加 `$schema` 标注，制作未发布的0.1.0兼容测试包；由此包升级至最终ZIP、回退和重装通过。**这不是未经修改的原发行包升级成功**。缺少独立旧宿主二进制，新包对旧宿主的实际安装未验证；manifest仍为v1不代表已证明所有旧版本兼容。

额外观察：390×442 的插件内 JSON 工具页「格式化」按钮可能被相邻 AI 按钮遮挡，扩大至桌面视口后实际操作通过；本轮没有改工具布局。资料弹窗在短屏的按钮与滚动通过，不能把这项结果扩大到全部工具窄屏布局。

## 产物与发布状态

ZIP SHA256：`c654d7af057a177d078042539a2fd03e8625fe645641dea5db7caa02be16140f`；8111069字节，489条目。摘要与尺寸、SDK/候选身份见 [artifact.json](artifact.json)。最终包只含运行入口、展示资料及许可，没有开发框架、凭据、运行数据或构建缓存。

`dist/ctool-0.2.0/` 交付 ZIP、摘要、`item.json`、`market-assets/` 和验证收据。**item.json 仅用于本轮隔离验收**，临时服务清理后不能访问，不是正式发布条目。正式地址、媒体上传及实际发布时间未获本轮发布授权，正式 item.json、市场 sequence/签名更新保留待办；没有虚构未来 GitHub 下载地址或发布时间，未改公开 registry。

当前主执行者顺序审查；不具备独立审查者。收尾必须核对模块文件、主目录未提交经验文档、合回后检查和本轮 worktree 清理，实际结果写 Progress。

主目录复验与隔离清理已完成，见 [merge-cleanup.json](merge-cleanup.json)。正式市场导出及旧宿主/原发行包升级等限制仍然保留。
