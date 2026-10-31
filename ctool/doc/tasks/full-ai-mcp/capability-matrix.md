# 完整能力覆盖矩阵

来源：当前 ctool-config 实际导出与现有页面代码；60 类工具、88 个登记入口。原0.2.0的14个AI/MCP工具只涉及11类工具；不得把 88 个路由当作原子业务操作数。
每行负责模块必须从原页面枚举实际 operation/选项，形成可执行用例表；此表覆盖范围，最终注册表和用例表核对 operation 级覆盖。纯展示、复制、选色拖拽等由返回数据与客户端操作承接，不伪造浏览器文件/剪贴板/相机访问。

| 序号 | 工具 | 登记入口 | 必须覆盖的业务操作/选项 | 0.3.0工具名 | 当前基线 | 负责模块 |
|---|---|---|---|---|---|---|
| 01 | `hash` | hash | 摘要五算法、文本/文件、盐值模板、大小写、逐行批量 | `hash_compute` | 部分开放 | [FULL-03](03-encoding-and-checksums.md) |
| 02 | `aes` | encrypt, decrypt | 加解密、现有模式/填充/IV/编码 | `aes_crypt` | 待开放 | [FULL-05](05-crypto-and-keys.md) |
| 03 | `des` | encrypt, decrypt | 加解密、现有模式/填充/IV/编码 | `des_crypt` | 待开放 | [FULL-05](05-crypto-and-keys.md) |
| 04 | `tripleDes` | encrypt, decrypt | 加解密、现有模式/填充/IV/编码 | `triple_des_crypt` | 待开放 | [FULL-05](05-crypto-and-keys.md) |
| 05 | `rc4` | encrypt, decrypt | 加解密、密钥和编码 | `rc4_crypt` | 待开放 | [FULL-05](05-crypto-and-keys.md) |
| 06 | `rabbit` | encrypt, decrypt | 加解密、密钥和编码 | `rabbit_crypt` | 待开放 | [FULL-05](05-crypto-and-keys.md) |
| 07 | `sm2` | encrypt, decrypt, sign, verify | 加解密、签名/验签及原选项 | `sm2_crypt`, `sm2_sign`, `sm2_verify` | 待开放 | [FULL-05](05-crypto-and-keys.md) |
| 08 | `sm4` | encrypt, decrypt | 加解密及现有配置 | `sm4_crypt` | 待开放 | [FULL-05](05-crypto-and-keys.md) |
| 09 | `rsa` | encrypt, decrypt | 加解密、PKCS1/OAEP及原密钥格式 | `rsa_crypt` | 待开放 | [FULL-05](05-crypto-and-keys.md) |
| 10 | `sign` | sign | 签名/验签、RSA密钥生成、PKCS1/PKCS8 | `signature_sign`, `signature_verify`, `key_pair_generate` | 待开放 | [FULL-05](05-crypto-and-keys.md) |
| 11 | `base64` | encoder, decoder | 文本与字节编解码、字符编码、文件 | `base64_transform` | 部分开放 | [FULL-03](03-encoding-and-checksums.md) |
| 12 | `base32` | encoder, decoder | 编解码、字节与字符编码 | `base32_transform` | 待开放 | [FULL-03](03-encoding-and-checksums.md) |
| 13 | `msgpack` | encoder, decoder | 编码/解码、类型/精度/二进制约定 | `msgpack_transform` | 待开放 | [FULL-04](04-json-and-data.md) |
| 14 | `json` | json | 格式化/压缩/修复/转义/Unicode、键排序/命名、Path、Schema、JS转换、实体类型生成 | `json_operate`, `json_query`, `json_schema_validate`, `json_transform`, `json_to_type` | 部分开放 | [FULL-04](04-json-and-data.md) |
| 15 | `url` | encoder, decoder | URI/组件编解码及原异常处理选项 | `url_transform` | 部分开放 | [FULL-03](03-encoding-and-checksums.md) |
| 16 | `qrCode` | generate, parse | 生成/解析、样式/渐变/角点/Logo/尺寸；全部原输入图像类型 | `qrcode_generate`, `qrcode_read` | 待开放 | [FULL-08](08-images.md) |
| 17 | `barcode` | barcode | 全部原码制/文字/颜色/尺寸、图片输出 | `barcode_generate` | 待开放 | [FULL-08](08-images.md) |
| 18 | `pinyin` | pinyin | 拼音及现有声调/输出选项 | `pinyin_convert` | 待开放 | [FULL-06](06-text-and-code.md) |
| 19 | `ip` | ip | 指定IP查询、管理服务器公网出口查询；浏览器出口不冒充服务器出口 | `ip_query` | 待开放 | [FULL-09](09-network-and-execution.md) |
| 20 | `code` | code, run | 所有现有语言格式化/压缩；JDoodle单文件运行与额度 | `code_transform`, `code_run`, `code_credits` | ARM/在线运行有后端但未开放 | [FULL-06](06-text-and-code.md) / [FULL-09](09-network-and-execution.md) |
| 21 | `unicode` | encoder, decoder | Unicode转义与文本互转、原格式选项 | `unicode_transform` | 待开放 | [FULL-03](03-encoding-and-checksums.md) |
| 22 | `radix` | radix | 2至64进制、64字符表、精确整数 | `radix_transform` | 部分开放 | [FULL-07](07-time-and-calculation.md) |
| 23 | `regex` | regex | 匹配/捕获/提取/替换/删除、i/g/m/s | `regex_execute` | 待开放 | [FULL-06](06-text-and-code.md) |
| 24 | `randomString` | randomString | 字符组/字符表、长度/数量、安全无偏随机 | `random_generate` | 待开放 | [FULL-07](07-time-and-calculation.md) |
| 25 | `serialize` | serialize | 现有格式/表格/CSV选项、序列化与反序列化 | `serialize_transform` | 待开放 | [FULL-04](04-json-and-data.md) |
| 26 | `diffs` | diffs | 文本/代码及结构化格式差异、增删改与位置 | `diff_compute` | 待开放 | [FULL-06](06-text-and-code.md) |
| 27 | `crontab` | crontab | 表达式描述/校验、后续时间、时区；不创建系统计划任务 | `cron_inspect` | 部分开放 | [FULL-07](07-time-and-calculation.md) |
| 28 | `websocket` | websocket | 连接/发送/接收/状态/关闭、文本/二进制、会话清理 | `websocket_open`, `websocket_send`, `websocket_receive`, `websocket_status`, `websocket_close` | 待开放 | [FULL-09](09-network-and-execution.md) |
| 29 | `unit` | unit | 现有单位体系、精度/非法单位 | `unit_convert` | 待开放 | [FULL-07](07-time-and-calculation.md) |
| 30 | `time` | timestamp, timezone, calculator | 秒/毫秒/纳秒、时区/格式、差值/加减/分析、法定工作日 | `time_operate` | 部分开放 | [FULL-07](07-time-and-calculation.md) |
| 31 | `uuid` | uuid | UUIDv4/ULID、批量/大小写/连字符/字节表示 | `uuid_operate` | 部分开放 | [FULL-07](07-time-and-calculation.md) |
| 32 | `ascii` | ascii | 字符/编码/控制字符查询 | `ascii_lookup` | 待开放 | [FULL-03](03-encoding-and-checksums.md) |
| 33 | `variableConversion` | variableConversion | 全部现有命名风格互转 | `name_convert` | 待开放 | [FULL-06](06-text-and-code.md) |
| 34 | `jwt` | decoder, encoder | 解析Header/Payload、现有HS算法签名；解析不等于验签 | `jwt_decode`, `jwt_sign` | 待开放 | [FULL-05](05-crypto-and-keys.md) |
| 35 | `hexString` | stringToHex, hexToString | 文本/字节和Hex互转、字符编码 | `hex_transform` | 待开放 | [FULL-03](03-encoding-and-checksums.md) |
| 36 | `text` | text | 大小写、标点、简繁、命名、行号、排序/反转、去重/空白、替换、统计 | `text_operate` | 部分开放 | [FULL-06](06-text-and-code.md) |
| 37 | `html` | html | HTML实体编码/解码 | `html_entities` | 待开放 | [FULL-03](03-encoding-and-checksums.md) |
| 38 | `binary` | binary | 原码/反码/补码、全部原位宽、正负边界 | `binary_convert` | 待开放 | [FULL-07](07-time-and-calculation.md) |
| 39 | `arm` | armToHex, hexToArm | 汇编与Hex双向、五架构、偏移/端序、逐架构结果 | `arm_convert` | ARM/在线运行有后端但未开放 | [FULL-09](09-network-and-execution.md) |
| 40 | `bcrypt` | bcrypt | 生成/比对、2a/2b/2y、轮数 | `bcrypt_hash`, `bcrypt_verify` | 待开放 | [FULL-05](05-crypto-and-keys.md) |
| 41 | `ipcalc` | ipv4, ipv6 | IPv4/IPv6、掩码/CIDR/网段及页面现有输出 | `ip_calculate` | 待开放 | [FULL-07](07-time-and-calculation.md) |
| 42 | `sqlFillParameter` | sqlFillParameter | 现有占位符填参规则、字符串转义/类型；不执行SQL | `sql_fill` | 待开放 | [FULL-06](06-text-and-code.md) |
| 43 | `httpSnippet` | httpSnippet | cURL/HAR转全部现有语言/客户端；只生成代码 | `http_code_convert` | 待开放 | [FULL-06](06-text-and-code.md) |
| 44 | `dataValidation` | bcc, crc, lrc | BCC/LRC/全部现有CRC、端序和结果格式 | `checksum_compute` | 待开放 | [FULL-03](03-encoding-and-checksums.md) |
| 45 | `color` | color | 全部现有颜色模型转换、透明度和名称 | `color_convert` | 待开放 | [FULL-07](07-time-and-calculation.md) |
| 46 | `hmac` | hmac | 现有算法及输入输出编码、秘密配置 keyRef | `hmac_compute` | 待开放 | [FULL-05](05-crypto-and-keys.md) |
| 47 | `gzip` | encoder, decoder | 压缩/解压、文本/字节输入输出 | `gzip_transform` | 待开放 | [FULL-03](03-encoding-and-checksums.md) |
| 48 | `punycode` | encoder, decoder | 域名Punycode编解码 | `punycode_transform` | 待开放 | [FULL-03](03-encoding-and-checksums.md) |
| 49 | `urlParse` | urlParse | 现有结构解析、重复查询参数与fragment；保留原合同 | `url_parse` | 部分开放 | [FULL-03](03-encoding-and-checksums.md) |
| 50 | `asn1` | asn1 | ASN.1节点解析、偏移/长度/类型/OID | `asn1_parse` | 待开放 | [FULL-04](04-json-and-data.md) |
| 51 | `dockerCompose` | dockerCompose | Docker命令文本转Compose；不运行容器 | `docker_compose_convert` | 待开放 | [FULL-06](06-text-and-code.md) |
| 52 | `zhNumber` | zhNumber | 数字/中文大小写/金额互转 | `zh_number_convert` | 待开放 | [FULL-06](06-text-and-code.md) |
| 53 | `base58` | encoder, decoder | 字节编解码、原字符表选项 | `base58_transform` | 待开放 | [FULL-03](03-encoding-and-checksums.md) |
| 54 | `mongoObjectId` | mongoObjectId | 生成/格式校验/时间戳及字段解析；旧机器/进程切片标注为历史解释 | `objectid_operate` | 待开放 | [FULL-07](07-time-and-calculation.md) |
| 55 | `numberCalc` | numberCalc | 计数/和/平均/中位/最小/最大/极差/标准差 | `number_statistics` | 待开放 | [FULL-07](07-time-and-calculation.md) |
| 56 | `chmod` | chmod | 数字/符号/勾选权限表示互转；不改真实文件权限 | `permission_convert` | 待开放 | [FULL-07](07-time-and-calculation.md) |
| 57 | `password` | password | 长度/数量/字符组、排除混淆、各组必含 | `password_generate` | 待开放 | [FULL-05](05-crypto-and-keys.md) |
| 58 | `userAgent` | userAgent | 浏览器/内核/系统/设备解析；不伪造外部AI客户端UA | `ua_parse` | 待开放 | [FULL-06](06-text-and-code.md) |
| 59 | `configConvert` | configConvert | 现有11种格式及转换选项；不可表示类型明确失败 | `config_transform` | 部分开放 | [FULL-04](04-json-and-data.md) |
| 60 | `stacktrace` | stacktrace | 异常语言/消息/调用帧/业务帧和位置 | `stacktrace_parse` | 待开放 | [FULL-06](06-text-and-code.md) |

业务名称、保留的14个名称与共用文件/模型工具去重后实际注册 **100 个工具名称**。通过注册表与tests/fixtures/capability-cases.json核对60类/88入口映射；这不代表所有参数组合都有穷尽测试；后续变更必须同步本矩阵、用例和注册表，不能通过合并名称漏掉操作。

共用工具：`file_begin`, `file_chunk`, `file_commit`, `file_read`, `file_status`, `file_delete`, `input_fetch`, `ai_assist`, `ai_call_status`, `ai_call_cancel`。文件工具由 FULL-02 负责，input_fetch 由 FULL-09 负责，模型工具由 FULL-10 负责；FULL-00 统一命名与合同，FULL-11 核对全部 ai/mcp 标记、同输入结果和清单。

12 类已有模型辅助由 FULL-10 全部覆盖：JSON提取；正则生成/解释；Cron生成；SQL解释；堆栈分析；配置格式识别；HTTP解释；代码解释；文本改写/抽取；差异总结；URL解释；UA解释。正则有两个操作，不能把12类简单说成12个按钮。

保留 `arm_convert`、`code_run`、`code_credits` 原参数/结果合同，改为按实际效果允许 AI/MCP；不因它们先前关闭而从完整范围删除。
