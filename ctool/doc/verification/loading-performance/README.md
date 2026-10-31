# Ctool 0.3.1 加载优化与发布验证

范围：插件前端入口、依赖关系、按键偏好、构建与相关测试。ID保持io.cookieos.ctool，保留60类工具/88个登记入口和100个AI/MCP工具；原manifest除版本外与不可变0.3.0逐项一致。数量分别表示页面分类、路由和去重服务名，不表示全部参数组合已穷举。

## 已实现

- 基础函数/错误与注册入口分离，旧路径重新导出同一对象；修复radix、YAML二级旁路。
- 91项Monaco语言元数据独立；编辑器/序列化按需。JSON的28种代码生成语言、302项选项与默认值独立并与真实处理器逐项对照；完整quicktype/Protobuf/PHP执行器仍随包交付，使用时局部加载及重试。
- GBK保留原库编码器及原始数组；构建只裁剪没有消费入口的其他编码表，输入哈希变化即失败，不重写算法，不改依赖安装目录或Node工具。
- 11个按键读取保留，必要设置与资源并行；默认工具明确后预载该工具。失败/未设置/非法值分开，无默认回写、晚到覆盖或整份设置覆盖；不同键双窗口保存与重新打开恢复通过。同键仍为最后写入，没有虚构CAS或实时通知。
- Editor/Diff等待真实初始化、清理自有模型/监听；任务Worker按kind加载并真正终止，保持4秒总截止。局部网络失败重试保留输入，新导航/取消清理过期状态，不重放收费或写操作。

## 同条件性能

采用不可变0.3.0 ZIP与最终0.3.1 ZIP，在真实隔离cookieOS/PostgreSQL中安装；现有宿主前端通过HTTP流式代理访问实际API，没有Playwright route/HAR回放。固定Chromium CPU4x、1074×884、本机HTTP、不压缩；不是公网/手机加载结论。宿主二进制及前端先复制冻结，摘要见[环境与体积](footprint.json)。早期宿主构建漂移、候选包及JSON/代码仅输入可见的探针均不计入本表。

cold用5个新浏览器上下文；warm同上下文重新打开10次；每种工具10个新插件实例，每实例首次进入及离开后重入各一次。哈希终点abc→正确MD5；JSON/代码实际点击格式化并验证输出变化，数学/单位/Base64/文本比较验证真实结果。计时含自动化动作/断言调度开销；没有单独归档T_input或精确拆分脚本编译/求值，不能把长任务或下载时长叫作解析耗时。完整逐次资源、长任务、设置请求和median/min/max见[samples](samples)。小样本不报告稳定P95。

| 场景 | 0.3.0 中位 ms | 0.3.1 中位 ms | 冻结预算 |
|---|---:|---:|---|
| cold-default | 2729.2 | 2152.6 | 未通过 |
| warm-reopen | 2671.3 | 2169.9 | 通过 |
| tool:base64/encoder:first | 1118.3 | 1119.9 | 通过 |
| tool:base64/encoder:repeat | 1109.5 | 1106.3 | 通过 |
| tool:json:first | 1363.4 | 1605.2 | 未通过 |
| tool:json:repeat | 1014.6 | 992.6 | 通过 |
| tool:code:first | 1116.9 | 1446.0 | 未通过 |
| tool:code:repeat | 940.0 | 935.6 | 通过 |
| tool:unit:first | 469.7 | 557.9 | 通过 |
| tool:unit:repeat | 390.3 | 392.9 | 通过 |
| tool:numberCalc:first | 852.0 | 854.0 | 通过 |
| tool:numberCalc:repeat | 837.7 | 840.3 | 通过 |
| tool:diffs:first | 1156.2 | 1605.2 | 未通过 |
| tool:diffs:repeat | 1163.2 | 1142.9 | 通过 |

冷开中位数降低约21.1%，缓存环境重开降低约18.8%；原定冷开30%目标未达到，JSON/代码/文本比较首次进入也没有通过原“max(100ms,10%)”预算。全部阈值保持，`check:performance`对应组真实退出1，结果见[预算判定](performance-results.json)和[原预算](budget.json)。这些是开放性能项，不能声称所有工具切换都更快。重复进入未显著退化；首次需要加载完整Monaco，本轮没有删语言/编辑能力或预热全部工具来换取分数。发布按既有预发布渠道交付，保留这些限制。

首屏静态请求均为17项：实际传输从6,705,168降至1,407,854字节，decoded JS从6,451,046降至1,152,884字节（约82.1%减少）。这是实际浏览器资源统计，不是安装ZIP大小；单次TLS总流量未测。SDK仍调用11次get，当前宿主桥实际HTTP读取为1次，不把已有宿主合并行为宣传为插件新增批量接口。长任务总时长中位数从892ms降至280ms，计数均为2；这不是精确解析/执行归因。少量Worker Resource Timing出现负时长的浏览器原始值，不参与下载耗时结论。

缓存响应为private,max-age=3600，SDK桥v1.js为no-store，未观察到保留上下文后重开可降低静态传输量。宿主可进一步评估实例URL与版本资源缓存；本轮没有改宿主响应头或加Service Worker。入口本身无法下载/求值时插件Vue边界不能运行；永久求值失败可能仍需显式重新打开。宿主若仅隐藏iframe而要求暂停，需要明确关闭/恢复合同；没有调用不存在的ready或关闭API。

## 最终依赖与功能

静态闭包见[chunks.json](chunks.json)，由Rollup模块清单生成，未进入插件包。轻壳988,147字节；hash闭包1,142,517，Base64闭包991,366；无Monaco、mathjs、Prettier、quicktype、QuickJS或全量工具注册。哈希必要摘要依赖保留。JSON初始闭包4,828,076字节，包含所需完整编辑器；quicktype已移到转实体类区域。数学、格式化、QuickJS、各语言Worker随相应工具/任务加载，使用Vite原预载机制。

`verify`完整通过：365单元、229服务合同、14包/预算负向测试、40浏览器；类型/lint（0错误195告警，预算300未抬高）/0新增重复，见[checks.json](checks.json)。88路由挂载、真实JSON Worker、91语言全量对照、28生成语言与302选项、GBK/UTF-8、两窗口逐键保存、偏好失败恢复、局部资源失败、快速导航、十轮模型释放，以及原AI未知结果不重放均覆盖。主执行者顺序审查，不具备独立性。

## 包、安装与发布

最终ZIP：仓库外层dist/ctool-0.3.1-release/ctool-0.3.1.zip；40,731,428字节、4195文件，解压130,424,652字节。SHA256：`b3be4cc91da085bc5c8b94f280b67cbcde8ec730abb5ff2aaa62c3c32d5ff464`。SDK1.2.0 check/pack及完整CRC通过；运行入口/Worker/WASM/依赖/图标/3截图/README/许可证齐全，无开发规则、凭据、运行数据或构建缓存。详见[包记录](package.json)。

Linux x64/glibc、Node ^22.22.2；28条原生库存与0.3.0完全相同，锁文件未修改。精确对应源码继续引用[0.3.0不可变源码分卷与摘要](../release-0.3.0/sources.json)，不重复上传523MB归档；许可文字保持第三方条款，不把主MIT覆盖所有依赖。

最终包从不可变0.3.0和0.2.0升级、回退及保留数据重装通过，分别见[0.3.0升级](host-from-0.3.0.json)与[0.2.0升级](host-from-0.2.0.json)。配置/KV/秘密配置保留、坏包不替换旧版、停启、真实Node/原生QR/QuickJS、100工具MCP/文件往返、宿主本地协议模型与内置AI均通过；[实际浏览器](host-browser.json)覆盖view/window/drawer/module、模型操作和三种视口，无pageerror。自有测试资源清理通过。公开Release、SDK item/媒体、签名市场、公网市场安装与合回清理在后续发布收据中单独记录；当前尚不把候选验收叫作公开发布。

关键命令（均由rtk proxy执行；输出首次执行时不存在）：

```sh
npx --yes pnpm@10.34.9 run verify
python3 "$SDK_DIR/dev.py" check ctool/dist/extension
python3 "$SDK_DIR/dev.py" pack ctool/dist/extension dist/ctool-0.3.1-release/ctool-0.3.1.zip
# 在ctool目录，对opens/base64/encoder/json/code/unit/numberCalc/diffs分别运行before/after
python3 tests/performance_host.py --cookieos-root "$COOKIEOS_ROOT" --server-binary "$FROZEN_HOST" --frontend-root "$FROZEN_UI" --archive "$ZIP" --group "$GROUP" --output "$NEW_OUTPUT"
node scripts/check-performance.mjs "$BEFORE_JSON" "$AFTER_JSON" doc/verification/loading-performance/budget.json
python3 tests/host_acceptance.py --cookieos-root "$COOKIEOS_ROOT" --server-binary "$FROZEN_HOST" --frontend-root "$FROZEN_UI" --archive "$ZIP" --previous "$OLD_ZIP" --output "$NEW_REPORT" --browser
```

## 未验证与限制

真实付费模型/JDoodle及ARM/GeoJS长期可用性、其他OS/CPU/libc、旧宿主、Firefox/WebKit、手机实测性能、24小时资源趋势和所有语言/参数组合未验。完整性能组为view；其他surface只做实际功能回归，没有给它们独立毫秒结论；重工具直达冷开也未单独量化。市场详情的坏图/无截图等宿主UI矩阵沿用历史记录，本轮不冒充重新完成。正式cookieOS安装/更新和服务重启不在本轮操作范围。

主目录复验：build:extension、14项包/预算检查及SDK check通过；运行文件、声明的README、媒体和依赖与已验收ZIP逐字节一致。仅未声明的ui/README.md镜像因保留主目录较新的0.3.0发布文档而不同，详见[合回复验](merge-verification.json)，未修改已冻结ZIP。

## 公开发布记录

[GitHub预发布ctool-v0.3.1](https://github.com/starburtMr/cookieOS-plugin/releases/tag/ctool-v0.3.1)已于2026-10-31T09:49:21Z公开，标签指向1633827的完整提交（实际SHA见[公网资产收据](github-release.json)）。ZIP、摘要、源码复用说明、SDK从最终ZIP生成的item.json和4份内容摘要PNG，全部8资产经匿名HTTPS全量下载核对。未重新构建/改动已验收ZIP，没有覆盖旧版或其他候选。正式条目见[item.json](item.json)。

清单由sequence 4递增为5，有效期至2027-01-29T09:53:09Z，原Ed25519公钥不变。SDK market-sign签原始字节，新签名、篡改清单和篡改签名的反例验证均通过，见[签名收据](registry.json)。清单/签名在同一提交推送；公网清单和隔离市场安装的后续结果另行追加。

发布命令（SDK输出初始不存在，gh不使用clobber）：

```sh
git push origin refs/tags/ctool-v0.3.1
gh release create ctool-v0.3.1 <ZIP> <SHA256> <SOURCE_REUSE_NOTICE> --repo starburtMr/cookieOS-plugin --verify-tag --prerelease --title 'Ctool 0.3.1 — 完整工具与加载优化' --notes-file <NOTES>
python3 "$SDK_DIR/dev.py" market-item "$ZIP" --download-url https://github.com/starburtMr/cookieOS-plugin/releases/download/ctool-v0.3.1/ctool-0.3.1.zip --asset-base-url https://github.com/starburtMr/cookieOS-plugin/releases/download/ctool-v0.3.1 --published-at 2026-10-31T09:49:21Z --output dist/ctool-0.3.1-publication/item.json --assets-output dist/ctool-0.3.1-publication/market-assets
gh release upload ctool-v0.3.1 <ITEM_JSON> <FOUR_EXPORTED_MEDIA> --repo starburtMr/cookieOS-plugin
python3 "$SDK_DIR/dev.py" market-sign market/registry.json --key .local/market-private.pem --output .local/ctool-release031-registry.sig.new
```

以上占位参数引用本节真实产物，并非SDK参数或虚构发布地址；实际文件路径、时间、版本和摘要均在本轮JSON收据。

## 公网市场及最终清理

清单与签名已在473fc6f81588ea3320ec4d8192db63b927f9f058同次推送；公开固定提交和main的清单/签名/公钥原始字节一致、原公钥验签通过，远程运行清单版本0.3.1，见[公网清单收据](public-registry.json)。

使用`.local/ctool-release031-market-check.py 473fc6f`一次性命令复用宿主RemoteFixture/Checks，在全新隔离实例真实刷新GitHub仓库来源并下载，七项通过，见[市场验收](market-results.json)：发现0.3.1及固定意图能力；从不可变0.3.0市场升级到最终ZIP，保留配置/秘密配置/暗色主题/KV及100工具；Node执行真实Base32；已安装展示digest及3截图正确；固定公钥刷新成功；错误摘要409且不替换旧包；自有进程/端口/PG容器卷/临时数据清理通过。没有拦截GitHub响应或编造安装成功。

实现合回后主目录构建、14项包/预算与SDK预检通过，最终ZIP未重新打包。保留main原0.3.0发布记录，工作区正常三方合并，未reset/stash或覆盖并行内容。本轮worktree及codex/ctool-loading-performance分支已删除，[清理收据](merge-cleanup.json)记录具体提交和结果。后续仅文档收据推送不改变安装包、市场sequence 5或签名；正式cookieOS未安装/重启。
