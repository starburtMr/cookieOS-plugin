# Ctool 迁移与验收矩阵

基线为用户附件的 `packages/ctool-config/src/config.ts`。以下 60 行包含 88 个登记入口；子页面、算法选项和按钮仍需按原源码核对，不能用登记数替代全部业务行为。实现状态统一见 [Progress](../Progress.md)。

每行必须验证所有登记入口：可进入、可正确处理、错误有反馈、相关数据和资源边界符合 [技术设计](../High-Level-Design.md)。本表是验收范围；本地已完成登记入口冒烟与适用测试，逐项证据和真实验收状态见 Progress，未穷举每个算法/模式组合。

| 工具键 | 分类 | 登记入口 | 原源码目录（相对 ctool） | 复用入口/库 | 最低验收 | 任务归属 |
|---|---|---|---|---|---|---|
| `hash` | 加密与安全 | `hash` | `packages/ctool-core/src/tools/hash/` | CryptoJS 4.2.0 / sm-crypto | 已知向量/验证失败；密钥不留历史；长度、模式与资源上限 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `aes` | 加密与安全 | `encrypt`, `decrypt` | `packages/ctool-core/src/tools/encrypt/aes/` | 复用共享 CryptoJS；4.2.0 | 已知向量/验证失败；密钥不留历史；长度、模式与资源上限 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `des` | 加密与安全 | `encrypt`, `decrypt` | `packages/ctool-core/src/tools/encrypt/des/` | 复用共享 CryptoJS；4.2.0 | 已知向量/验证失败；密钥不留历史；长度、模式与资源上限 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `tripleDes` | 加密与安全 | `encrypt`, `decrypt` | `packages/ctool-core/src/tools/encrypt/tripleDes/` | 复用共享 CryptoJS；4.2.0 | 已知向量/验证失败；密钥不留历史；长度、模式与资源上限 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `rc4` | 加密与安全 | `encrypt`, `decrypt` | `packages/ctool-core/src/tools/encrypt/rc4/` | 复用共享 CryptoJS；4.2.0 | 已知向量/验证失败；密钥不留历史；长度、模式与资源上限 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `rabbit` | 加密与安全 | `encrypt`, `decrypt` | `packages/ctool-core/src/tools/encrypt/rabbit/` | 复用共享 CryptoJS；4.2.0 | 已知向量/验证失败；密钥不留历史；长度、模式与资源上限 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `sm2` | 加密与安全 | `encrypt`, `decrypt`, `sign`, `verify` | `packages/ctool-core/src/tools/encrypt/sm2/` | sm-crypto | 已知向量/验证失败；密钥不留历史；长度、模式与资源上限 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `sm4` | 加密与安全 | `encrypt`, `decrypt` | `packages/ctool-core/src/tools/encrypt/sm4/` | sm-crypto | 已知向量/验证失败；密钥不留历史；长度、模式与资源上限 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `rsa` | 加密与安全 | `encrypt`, `decrypt` | `packages/ctool-core/src/tools/encrypt/rsa/` | jsrsasign | 已知向量/验证失败；密钥不留历史；长度、模式与资源上限 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `sign` | 加密与安全 | `sign` | `packages/ctool-core/src/tools/sign/` | jsrsasign | 已知向量/验证失败；密钥不留历史；长度、模式与资源上限 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `base64` | 编码与解码 | `encoder`, `decoder` | `packages/ctool-core/src/tools/base64/` | 复用现有文本编码组件 / js-base64 | 中文与 emoji 往返、非法字节/坏编码、空值、输出上限 | [B3](../doc/tasks/cookieos-migration/02-service-contract.md#b3)，共用合同 [C4](../doc/tasks/cookieos-migration/06-shared-tools.md#c4) |
| `base32` | 编码与解码 | `encoder`, `decoder` | `packages/ctool-core/src/tools/base32/` | 原页面及 util / 既有公共组件；不重写算法 | 中文与 emoji 往返、非法字节/坏编码、空值、输出上限 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `msgpack` | 数据处理 | `encoder`, `decoder` | `packages/ctool-core/src/tools/msgpack/` | @msgpack/msgpack | 正常转换、非法结构、空/null、精度与超限；原子功能逐项核对 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `json` | 数据处理 | `json` | `packages/ctool-core/src/tools/json/` | Ajv / jsonrepair / JSONPath 11.2.2 / JMESPath；表达式改 QuickJS；HTML 路径按技术设计 | 正常转换、非法结构、空/null、精度与超限；原子功能逐项核对 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1)；执行/Schema边界 [C3](../doc/tasks/cookieos-migration/05-execution-safety.md#c3) |
| `url` | 编码与解码 | `encoder`, `decoder` | `packages/ctool-core/src/tools/url/` | decode-uri-component / strict-uri-encode | 中文与 emoji 往返、非法字节/坏编码、空值、输出上限 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `qrCode` | 生成与计算 | `generate`, `parse` | `packages/ctool-core/src/tools/qrCode/` | qr-code-styling / jsQR（Worker） | 输出格式/数量/边界、无效范围、精度、内存/图像上限 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `barcode` | 生成与计算 | `barcode` | `packages/ctool-core/src/tools/barcode/` | jsbarcode | 输出格式/数量/边界、无效范围、精度、内存/图像上限 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `pinyin` | 文本与代码 | `pinyin` | `packages/ctool-core/src/tools/pinyin/` | pinyin-pro | 中文/多行/换行、空值、无匹配、恶意或超长输入、取消 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `ip` | 网络 | `ip` | `packages/ctool-core/src/tools/ip/` | GeoJS，浏览器保留原网络位置 | 正常解析/连接、错误目标、外部失败、超时、未知结果和生命周期 | [E1](../doc/tasks/cookieos-migration/08-network.md#e1) |
| `code` | 文本与代码 | `code`, `run` | `packages/ctool-core/src/tools/code/` | 原 formatter / Prettier / sql-formatter / terser；在线运行走 JDoodle | 中文/多行/换行、空值、无匹配、恶意或超长输入、取消 | code: [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1)；run: [E3](../doc/tasks/cookieos-migration/08-network.md#e3) |
| `unicode` | 编码与解码 | `encoder`, `decoder` | `packages/ctool-core/src/tools/unicode/` | 原页面及 util / 既有公共组件；不重写算法 | 中文与 emoji 往返、非法字节/坏编码、空值、输出上限 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `radix` | 数据处理 | `radix` | `packages/ctool-core/src/tools/radix/` | 原页面及 util / 既有公共组件；不重写算法 | 正常转换、非法结构、空/null、精度与超限；原子功能逐项核对 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `regex` | 文本与代码 | `regex` | `packages/ctool-core/src/tools/regex/` | 原页面及 util / 既有公共组件；不重写算法 | 中文/多行/换行、空值、无匹配、恶意或超长输入、取消 | [C3](../doc/tasks/cookieos-migration/05-execution-safety.md#c3) |
| `randomString` | 生成与计算 | `randomString` | `packages/ctool-core/src/tools/randomString/` | 原组件 + Web Crypto；无偏字符映射与总量限制 | 输出格式/数量/边界、无效范围、精度、内存/图像上限 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `serialize` | 数据处理 | `serialize` | `packages/ctool-core/src/tools/serialize/` | 沿用 helper/serialize 与已有解析库；HTML 表格使用 DOMPurify | 正常转换、非法结构、空/null、精度与超限；原子功能逐项核对 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `diffs` | 文本与代码 | `diffs` | `packages/ctool-core/src/tools/diffs/` | js-yaml | 中文/多行/换行、空值、无匹配、恶意或超长输入、取消 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `crontab` | 开发辅助 | `crontab` | `packages/ctool-core/src/tools/crontab/` | cron-parser / cronstrue/i18n / dayjs | 已知样例、边界/无效输入、时区/精度、上限及可取消 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `websocket` | 网络 | `websocket` | `packages/ctool-core/src/tools/websocket/` | 浏览器原生 WebSocket；不自动重放 | 正常解析/连接、错误目标、外部失败、超时、未知结果和生命周期 | [E1](../doc/tasks/cookieos-migration/08-network.md#e1) |
| `unit` | 开发辅助 | `unit` | `packages/ctool-core/src/tools/unit/` | mathjs | 已知样例、边界/无效输入、时区/精度、上限及可取消 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `time` | 开发辅助 | `timestamp`, `timezone`, `calculator` | `packages/ctool-core/src/tools/time/` | dayjs / chinese-days / 原时间与工作日测试 | 已知样例、边界/无效输入、时区/精度、上限及可取消 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `uuid` | 生成与计算 | `uuid` | `packages/ctool-core/src/tools/uuid/` | ulid / uuid | 输出格式/数量/边界、无效范围、精度、内存/图像上限 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `ascii` | 数据处理 | `ascii` | `packages/ctool-core/src/tools/ascii/` | 原页面及 util / 既有公共组件；不重写算法 | 正常转换、非法结构、空/null、精度与超限；原子功能逐项核对 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `variableConversion` | 文本与代码 | `variableConversion` | `packages/ctool-core/src/tools/variableConversion/` | 原页面及 util / 既有公共组件；不重写算法 | 中文/多行/换行、空值、无匹配、恶意或超长输入、取消 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `jwt` | 编码与解码 | `decoder`, `encoder` | `packages/ctool-core/src/tools/jwt/` | jwt-decode | 中文与 emoji 往返、非法字节/坏编码、空值、输出上限 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `hexString` | 编码与解码 | `stringToHex`, `hexToString` | `packages/ctool-core/src/tools/hexString/` | 原页面及 util / 既有公共组件；不重写算法 | 中文与 emoji 往返、非法字节/坏编码、空值、输出上限 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `text` | 文本与代码 | `text` | `packages/ctool-core/src/tools/text/` | buffer / chinese-simple2traditional | 中文/多行/换行、空值、无匹配、恶意或超长输入、取消 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `html` | 编码与解码 | `html` | `packages/ctool-core/src/tools/html/` | js-htmlencode | 中文与 emoji 往返、非法字节/坏编码、空值、输出上限 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `binary` | 生成与计算 | `binary` | `packages/ctool-core/src/tools/binary/` | 原页面及 util / 既有公共组件；不重写算法 | 输出格式/数量/边界、无效范围、精度、内存/图像上限 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `arm` | 数据处理 | `armToHex`, `hexToArm` | `packages/ctool-core/src/tools/arm/` | 复用原格式与端序处理；固定 ARM API 服务适配 | 正常转换、非法结构、空/null、精度与超限；原子功能逐项核对 | [E2](../doc/tasks/cookieos-migration/08-network.md#e2) |
| `bcrypt` | 加密与安全 | `bcrypt` | `packages/ctool-core/src/tools/bcrypt/` | bcryptjs | 已知向量/验证失败；密钥不留历史；长度、模式与资源上限 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `ipcalc` | 生成与计算 | `ipv4`, `ipv6` | `packages/ctool-core/src/tools/ipcalc/` | ip6 / netmask | 输出格式/数量/边界、无效范围、精度、内存/图像上限 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `sqlFillParameter` | 开发辅助 | `sqlFillParameter` | `packages/ctool-core/src/tools/sqlFillParameter/` | 原页面及 util / 既有公共组件；不重写算法 | 已知样例、边界/无效输入、时区/精度、上限及可取消 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `httpSnippet` | 网络 | `httpSnippet` | `packages/ctool-core/src/tools/httpSnippet/` | @readme/httpsnippet / @readme/httpsnippet/targets / yargs-parser | 正常解析/连接、错误目标、外部失败、超时、未知结果和生命周期 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `dataValidation` | 开发辅助 | `bcc`, `crc`, `lrc` | `packages/ctool-core/src/tools/dataValidation/` | crc | 已知样例、边界/无效输入、时区/精度、上限及可取消 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `color` | 开发辅助 | `color` | `packages/ctool-core/src/tools/color/` | a-color-picker / colord 与既有插件 | 已知样例、边界/无效输入、时区/精度、上限及可取消 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `hmac` | 加密与安全 | `hmac` | `packages/ctool-core/src/tools/hmac/` | CryptoJS 4.2.0 / sm-crypto | 已知向量/验证失败；密钥不留历史；长度、模式与资源上限 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `gzip` | 编码与解码 | `encoder`, `decoder` | `packages/ctool-core/src/tools/gzip/` | pako | 中文与 emoji 往返、非法字节/坏编码、空值、输出上限 | [C3](../doc/tasks/cookieos-migration/05-execution-safety.md#c3) |
| `punycode` | 编码与解码 | `encoder`, `decoder` | `packages/ctool-core/src/tools/punycode/` | punycode/ | 中文与 emoji 往返、非法字节/坏编码、空值、输出上限 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `urlParse` | 网络 | `urlParse` | `packages/ctool-core/src/tools/urlParse/` | 原页面及 util / 既有公共组件；不重写算法 | 正常解析/连接、错误目标、外部失败、超时、未知结果和生命周期 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `asn1` | 编码与解码 | `asn1` | `packages/ctool-core/src/tools/asn1/` | 原页面及 util / 既有公共组件；不重写算法 | 中文与 emoji 往返、非法字节/坏编码、空值、输出上限 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `dockerCompose` | 网络 | `dockerCompose` | `packages/ctool-core/src/tools/dockerCompose/` | composerize-ts | 正常解析/连接、错误目标、外部失败、超时、未知结果和生命周期 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `zhNumber` | 文本与代码 | `zhNumber` | `packages/ctool-core/src/tools/zhNumber/` | nzh | 中文/多行/换行、空值、无匹配、恶意或超长输入、取消 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `base58` | 编码与解码 | `encoder`, `decoder` | `packages/ctool-core/src/tools/base58/` | bs58 | 中文与 emoji 往返、非法字节/坏编码、空值、输出上限 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `mongoObjectId` | 数据处理 | `mongoObjectId` | `packages/ctool-core/src/tools/mongoObjectId/` | dayjs | 正常转换、非法结构、空/null、精度与超限；原子功能逐项核对 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `numberCalc` | 生成与计算 | `numberCalc` | `packages/ctool-core/src/tools/numberCalc/` | 原页面及 util / 既有公共组件；不重写算法 | 输出格式/数量/边界、无效范围、精度、内存/图像上限 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `chmod` | 开发辅助 | `chmod` | `packages/ctool-core/src/tools/chmod/` | 原页面及 util / 既有公共组件；不重写算法 | 已知样例、边界/无效输入、时区/精度、上限及可取消 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `password` | 加密与安全 | `password` | `packages/ctool-core/src/tools/password/` | 原组件 + Web Crypto；无偏字符映射与不落历史 | 已知向量/验证失败；密钥不留历史；长度、模式与资源上限 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |
| `userAgent` | 网络 | `userAgent` | `packages/ctool-core/src/tools/userAgent/` | 候选 ua-parser-js 1.0.41 MIT；基础字段快照回归 | 正常解析/连接、错误目标、外部失败、超时、未知结果和生命周期 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `configConvert` | 数据处理 | `configConvert` | `packages/ctool-core/src/tools/configConvert/` | 复用既有 Serialize/格式转换库及 AI 业务处理 | 正常转换、非法结构、空/null、精度与超限；原子功能逐项核对 | [C1](../doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) |
| `stacktrace` | 开发辅助 | `stacktrace` | `packages/ctool-core/src/tools/stacktrace/` | 原页面及 util / 既有公共组件；不重写算法 | 已知样例、边界/无效输入、时区/精度、上限及可取消 | [C2](../doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) |

## 必须附加的样例

- 编码：`你好 🧪`、无效 UTF-8、Base64 长度/填充错误、URL `%` 残缺。
- JSON/序列化：`null`、空数组、超出 2^53 的整数、重复键策略、`__proto__`/constructor 原型相关键；不能静默丢值或污染其他对象。
- 表达式/表格：死循环、访问宿主桥、HTML 事件/SVG/外链资源均不能影响宿主页面。
- 加密：每个原有模式、填充、密钥类型、编码与签名验证都有固定样例；不能只测 AES-CBC 便替代整个分类。
- 时间/Cron：明确时区、DST 跳跃/重叠、秒/毫秒、无效日期、固定当前时间；工作日历使用原数据版本。
- 网络：ARM64 已测样例 `mov x0, #1` → `200080D2`；其他架构逐个核对；WebSocket 测断开后不重发；JDoodle 区分请求成功与用户程序输出。
- 所有 AI 入口：生成内容可校验、不会自动执行、迟到结果不覆盖新草稿。

## 12 项原 AI 辅助

`json`、`regex`、`crontab`、`sqlFillParameter`、`stacktrace`、`configConvert`、`httpSnippet`、`code`、`text`、`diffs`、`urlParse`、`userAgent`。每项各核对原有意图、输入、输出和采用动作；共享宿主模型适配不等于一次通用聊天能替代 12 项验收。

首批 14 个结构化 AI/MCP 操作见 [技术设计](../High-Level-Design.md)，与上述“插件调用模型”的 12 项辅助分开统计。

任务归属区分主业务与共同边界；所有模型辅助由 [D2](../doc/tasks/cookieos-migration/07-host-models.md#d2) 统一迁移，14 项结构化公开操作由 [C4](../doc/tasks/cookieos-migration/06-shared-tools.md#c4) 统一维护。模块步骤以 [任务入口](../doc/tasks/cookieos-migration/README.md) 为准。
