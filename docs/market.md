# 市场维护

## 接入

本仓库提供 cookieOS 已有市场协议的数据源，不另建市场网站或安装服务。当前清单提供 Ctool 0.2.0 预发布版本，包含 SDK 1.2.0 展示资料。

新版 cookieOS 在扩展设置中填写仓库首页 `https://github.com/starburtMr/cookieOS-plugin` 或下面的市场地址即可，无需手填公钥；点击「刷新市场」后查看 Ctool。

旧版固定公钥模式填写：

- 市场地址：`https://raw.githubusercontent.com/starburtMr/cookieOS-plugin/main/market/registry.json`
- 市场公钥：`market/public-key.txt` 的完整 Base64 文本。

固定公钥模式下，宿主在清单地址后追加 `.sig` 获取签名；新版来源信任模式不要求签名，本仓库继续签名以兼容旧版。公钥是 Ed25519 的 32 字节原始公钥经 Base64 编码，签名也是 Base64 文本。公钥首次配置应由维护者通过可信渠道确认；从同一仓库读取公钥与签名只能证明一致性，不能独立证明发布者身份。

## 清单

`market/registry.json` 沿用 `schemaVersion: 1`，包含 `sequence`、RFC 3339 格式的 `issuedAt`、`expiresAt` 和 `items`。每次修改或续期必须增加 `sequence` 并重新签名，不能在同一序号下更改内容，也不能回退序号。

每个市场项目至少包含 `id`、语义版本 `version`、实际安装包 `downloadUrl` 和 64 位十六进制 `sha256`；插件 ID 在清单内唯一。名称、简介、分类等展示字段以目标宿主的实际消费合同为准，不自行扩展协议后声称兼容。初始清单的有效期为签发后 90 天，具体时间以 JSON 为准；到期前必须续期。

同一清单只登记每个插件当前推荐版本，历史版本在对应 GitHub Release 保留。移除条目只会下架市场推荐，不会远程卸载已安装插件。

## 密钥与签名

签名私钥只保存在维护者本地 `.local/market-private.pem`，目录权限 700、文件权限 600，已由 Git 忽略。私钥不进入源码、安装包或公开日志，也不默认配置到 GitHub Actions。维护者须自行完成安全备份；遗失后不能继续使用原公钥发布。

从目标 cookieOS 获取 SDK 后设置 `COOKIEOS_SDK_DIR`。修改清单并增加序号后，复用 SDK 签名；SDK 拒绝覆盖已有输出，因此先生成新文件，验证后再替换旧签名：

```sh
python3 "$COOKIEOS_SDK_DIR/dev.py" market-sign market/registry.json \
  --key .local/market-private.pem --output .local/registry.json.sig.new
```

离线验证新签名后，再将它替换到 `market/registry.json.sig`。清单和签名必须在同一次提交中发布。原始字节参与签名，格式化、换行修改后都要重新签名；`.gitattributes` 固定这些文本使用 LF。

## 更新与恢复

1. 先发布独立插件 Release，实际下载安装包并校验摘要。
2. 修改市场项目、增加序号、更新签发时间和有效期。
3. 使用原私钥签名并离线验签，检查签名或清单被篡改时会失败。
4. 同次提交清单和签名，发布后从公开地址重新下载并验签。
5. 在隔离 cookieOS 实例刷新市场，验证推荐版本能够安装。

主分支原始文件地址会随提交变化，两次请求跨越更新时可能遇到清单和签名不匹配，宿主会拒绝刷新并保留已验证缓存。需要固定快照时，将地址里的 `main` 替换为已发布提交 SHA；更新时再切换到新的 SHA，保证清单与签名来自同一提交。

推荐版本出错时，以更高市场序号发布修正后的条目；不得回滚市场序号，也不要覆盖已有 Release 安装包。代码回退不撤销外部业务操作，数据恢复以插件自己的规则为准。

密钥泄露时停止使用旧私钥，生成替代密钥并通过可信渠道通知使用者更换公钥。更换公钥不是普通清单更新，不能假定客户端自动信任。

本仓库不自动修改真实 cookieOS 实例配置，也不执行插件安装。Ctool 当前发布继续标记为 GitHub 预发布。0.2.0 已完成隔离宿主市场/安装/MCP及生命周期验证，外部真实模型、旧宿主和原0.1.0发行包升级限制见插件验证记录。

SDK 1.2.0 版本的展示条目必须从最终 ZIP 使用 `dev.py market-item` 生成。GitHub Release 的媒体资产没有子目录，`--asset-base-url` 使用该版本的 `/releases/download/<tag>`，再上传 SDK 导出的内容摘要文件名。先公开 ZIP/媒体，读取 GitHub 实际 publishedAt，再在新目录生成正式 item.json；不得复用临时隔离 URL 或把计划时间当发布时间。验证全部公开文件后才合入市场清单。
