# Ctool 0.3.0 市场发布验证

日期：2026-10-31。范围为已有 0.3.0 最终 ZIP 的公开分发与市场同步，不包含加载性能优化或正式 cookieOS 实例变更。

## 安装包与源码附件

- 插件 ID：`io.cookieos.ctool`，版本 0.3.0，100 个去重 AI/MCP 工具。
- 安装包：`dist/ctool-0.3.0/ctool-0.3.0.zip`，40,929,066 字节；解压后 131,025,770 字节，4167 个文件。
- SHA-256：`2a42f6a4b858c131e9db4fc6aa43e25a3e9e722b13adf1f61e4acd1ae4dcb1ac`。未修改此前验收的 ZIP 或覆盖 0.2.0 发行包；本轮 ZIP 全量 CRC 通过，组装目录逐字节核对一致。
- 独立第三方源码归档 523,048,565 字节，SHA-256 为 `fd0807580504f4629a25ce07d94ac92cb1812d55915fca37d0841ddd1aa18105`。为适应上传链路拆成 12 卷，合并后摘要相同。它用于许可证、查阅和修改重建；市场安装只下载安装 ZIP。
- 原生来源及分卷清单见 [sources.json](sources.json)。666 份上游下载全部可读取；598 个 Rust crate 按 Cargo.lock 校验，四个 npm 原始源码包按 npm integrity 校验。canvas 的 26 个随包二进制与上游 Linux x64 预构建逐字节相同，libstdc++ Build ID 与 Debian 8.3.0-6 包一致，归档包含相应源码与补丁。
- 四个 npm 上游包声明 MIT 但没有独立版权文件；保留实际发布声明、源码、README 和已有权限文本，不伪造版权持有人或年份。本记录不构成法律认证或逐字节重建保证。

源码分卷、汇总与逐卷摘要、原始下载地址及配方一同提供。需要源码时，先使用 `ctool-0.3.0-third-party-sources.parts.sha256` 校验分卷，再执行：

```sh
cat ctool-0.3.0-third-party-sources.tar.gz.part-* > ctool-0.3.0-third-party-sources.tar.gz
sha256sum -c ctool-0.3.0-third-party-sources.tar.gz.sha256
tar -xzf ctool-0.3.0-third-party-sources.tar.gz
```

## 本轮实际检查

- `python3 .local/cookieos-extension-sdk-1.2.0/dev.py check ctool/dist/extension` 通过；权威 SDK 和使用的 SDK 均为 1.2.0，hostApi 为 ^1.0.0。
- 重新运行 `ctool/tests/host_acceptance.py`，传入最终 0.3.0 ZIP、不可变 0.2.0 ZIP、隔离输出及现有宿主二进制；九项实际检查通过，详见 [host-results.json](host-results.json)。覆盖升级保留配置/KV/秘密配置、展示 API 与包内图片、Node/QuickJS/原生 QR、100 工具真实 MCP 与文件往返、宿主模型桥及内置 AI 调度、停启、坏包保护、回退与保留数据重装。
- 该宿主二进制 SHA-256 为 `e8ef56b7769abdcab98a19a4ebdd26b3e0c447e631ddd2132f1038e1cac66db1`。使用独立 PostgreSQL 容器、随机账户、端口和临时目录；脚本已清理自有资源。
- 原完整门禁为 355 单元、229 服务合同、8 包和 26 浏览器测试，来源及限制见 [完整 AI/MCP 记录](../full-ai-mcp/README.md)。本轮未重写工具代码，不把历史门禁记成新执行结果。

## 发布状态

GitHub 预发布 [ctool-v0.3.0](https://github.com/starburtMr/cookieOS-plugin/releases/tag/ctool-v0.3.0) 已于 2026-10-31T07:23:48Z 公开，冻结运行源码提交为 `6ba6c23878a457568c8d0dc76dbd3a29fe2c2859`。使用该实际发布时间及同一 ZIP 运行 SDK `market-item`，导出正式 [item.json](item.json) 和四份内容摘要命名的媒体；全部 22 个资产已通过匿名 HTTPS 全量下载核对，见 [github-release.json](github-release.json)。

清单由 sequence 3 递增到 4，有效期至 2027-01-29T07:29:02Z。新签名和篡改失败验证通过，原公钥保持不变，见 [registry.json](registry.json)。清单和签名在提交 `7465b6a2e69ae2767cb3b81aaef406763f3e25f2` 同次推送到 main；随后从公开固定提交地址重新读取清单、签名和公钥，原始字节一致且验签通过。

## 推送后的真实市场验收

复用宿主现有 `RemoteFixture` 和 `Checks`，在独立实例中以真实公开地址刷新、下载和安装，不使用重定向/响应拦截夹具替代 GitHub。七项实际检查通过，详见 [market-results.json](market-results.json)：

1. 仓库首页地址发现 0.3.0，AI/MCP 工具数量均为100，宿主报告 pinnedInstall 能力。
2. 安装不可变0.2.0并保存测试配置/KV后，通过市场按 id/version/sha256 固定意图下载升级；安装状态 succeeded，安装 digest 与最终 ZIP 相同，配置及暗色主题保留。
3. 市场安装后的 Node 服务执行 Base32 编码，`foo` 得到 `MZXW6===`。
4. 已安装展示 API 指向最终包 digest，三张截图齐全。
5. 公开固定提交清单使用原公钥刷新成功。
6. 错误摘要的安装意图返回409，已安装包不被替换。
7. 自有进程、PostgreSQL容器、端口和临时数据清理完成。

本轮关键执行入口：

```sh
python3 .local/cookieos-extension-sdk-1.2.0/dev.py check ctool/dist/extension
python3 ctool/tests/host_acceptance.py --cookieos-root "$COOKIEOS_ROOT" --server-binary "$HOST_BINARY" --archive dist/ctool-0.3.0/ctool-0.3.0.zip --previous dist/ctool-0.2.0/ctool-0.2.0.zip --output .local/ctool-release030-install-check
python3 .local/cookieos-extension-sdk-1.2.0/dev.py market-item dist/ctool-0.3.0/ctool-0.3.0.zip --download-url https://github.com/starburtMr/cookieOS-plugin/releases/download/ctool-v0.3.0/ctool-0.3.0.zip --asset-base-url https://github.com/starburtMr/cookieOS-plugin/releases/download/ctool-v0.3.0 --published-at 2026-10-31T07:23:48Z --output dist/ctool-0.3.0-publication/item.json --assets-output dist/ctool-0.3.0-publication/market-assets
python3 .local/cookieos-extension-sdk-1.2.0/dev.py market-sign market/registry.json --key .local/market-private.pem --output .local/ctool-release030-registry.sig.new
git push origin main
```

以上 SDK 输出均在首次执行时不存在；已生成路径不可直接重跑覆盖。`COOKIEOS_ROOT` 指本机权威宿主源码根目录，`HOST_BINARY` 对应前述摘要的现有二进制，不重编译或重启正式宿主。真实市场检查由本轮一次性 Python 命令复用同一宿主测试夹具，逐项结果保存在 market-results.json；本轮未新增另一套检查器。

## 限制

运行目标为 Linux x64/glibc、Node ^22.22.2。模型使用本地协议供应商夹具；真实外部模型、ARM/GeoJS 实时服务、JDoodle 付费执行、其他平台与旧宿主未验。本轮未重新做全部详情弹窗/坏图/无截图浏览器场景，不执行正式安装或服务重启。
