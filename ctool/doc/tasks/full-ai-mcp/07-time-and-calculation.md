# FULL-07：时间、计算与生成

状态：实现与验收记录见文末；实际进度只在 [Progress](../../../Progress.md) 记录。

## 目标与输入

目标：完成本模块在[覆盖矩阵](capability-matrix.md)的全部操作，不以接口数代替功能覆盖。
输入：矩阵FULL-07；现有dayjs/cron-parser/cronstrue/mathjs/bignumber/uuid/ulid/netmask/ip6。
依赖：FULL-01；大输出依赖FULL-02。
设计：[Detailed-Design](../../../Detailed-Design.md)；复用依据：[研究记录](../../research/full-ai-mcp.md)。

## 文件归属与输出

packages/ctool-tools/src/domains/calculation/、generation/；对应UI适配；旧时间/进制等接口保留。
主执行者拥有集成/公共注册表/文档；本轮不授权子智能体。后续多人改动不得回退他人差异，公共合同变更先回FULL-00。

## 实施步骤

1. 完整覆盖日期/时区/差值/加减/纳秒、工作日/时间分析、Cron描述与后续时间；当前时间作为显式基准或返回实际基准，不依赖隐式开发机时区。
2. 2至64进制/自定义字符表、原码反码补码/IP计算、单位/颜色/权限/数字统计，按原边界与精度定义返回。
3. UUID/ULID、ObjectId、随机字符串复用现有库/安全随机函数；ObjectId中间字节不冒充现代机器身份。
4. 统计非有限数字明确失败或按原可说明规则忽略，不输出JSON中的NaN/Infinity；工作日范围来自实际数据包，范围外拒绝。

## 验收与证据

- 夏令时跳变、闰日、非法日期/时区、纳秒精度、大整数、补码最小值、自定义字符表和单位非法输入。
- IPv4/IPv6独立样例、颜色往返容差、权限互转、统计独立样例；UUID/ULID格式/批量上限。
- 旧time_convert/radix_convert/cron_parse/uuid_generate结果合同保持。
- 测试接入现有 `pnpm test`、`pnpm test:contract`、`pnpm test:package`、`pnpm test:e2e` 对应入口，单模块先跑适用子集；命令与完整集成顺序见任务入口。不为无关代码造新检查器。
- 记录样例、命令、退出状态、实际产物与未验证项；失败修复后重跑受影响检查，再做顺序两阶段审查。不以文字勾选替代证据。

## 本轮落点与验收记录

- 实际落点：ctool-tools/src/domains/calculation、unit、workday、binary、objectId。
- 已执行：补码全部位宽边界、负纳秒、时间分支、IPv4/6、UUID/ULID/随机、单位/统计；不承诺所有时区/单位穷举。
- 统一命令和当前产物证据：[验证记录](../../verification/full-ai-mcp/README.md)、[检查收据](../../verification/full-ai-mcp/checks.json)。隔离宿主与真实外部供应商分开记录；限制不以完成标记掩盖。
