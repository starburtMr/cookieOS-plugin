# FULL-05：密码学与密钥

状态：未开始；本文件是任务合同，实际进度只在 [Progress](../../../Progress.md) 记录。

## 目标与输入

目标：完成本模块在[覆盖矩阵](capability-matrix.md)的全部操作，不以接口数代替功能覆盖。
输入：矩阵FULL-05；现有CryptoJS/sm-crypto/jsrsasign/bcryptjs/Web Crypto；秘密配置约定。
依赖：FULL-01；导出文件依赖FULL-02。
设计：[Detailed-Design](../../../Detailed-Design.md)；复用依据：[研究记录](../../research/full-ai-mcp.md)。

## 文件归属与输出

packages/ctool-tools/src/domains/crypto/；service/keys.ts；相应UI适配；不建密钥管理平台。
主执行者拥有集成/公共注册表/文档；本轮不授权子智能体。后续多人改动不得回退他人差异，公共合同变更先回FULL-00。

## 实施步骤

1. 补齐对称加解密、SM2、RSA、HMAC、签名验签、bcrypt、JWT和密码生成，全部沿用已安装成熟库/标准API。
2. Node工具只接收keyRef，从XHUB_SECRET_CONFIG新增可选keys映射取值；原jdoodleClientId/Secret不变。UI本地密钥不自动上传、不改变本地计算语义。
3. 密钥对生成返回公开部分与短期私钥文件引用；导出按dangerous声明，不自动回写宿主秘密配置，不在日志/普通KV留下私钥。
4. 固定支持原算法/模式/填充/IV/字节编码；旧弱算法只兼容已有数据，不宣传为推荐密码方案；JWT解析绝不等同验签。
5. bcrypt轮数、RSA位数/生成次数和密码总量受预算限制，超过预算明确失败；不能为开放接口而复制自研密码实现。

## 验收与证据

- 独立已知向量+原密文兼容、错误密钥/IV/填充、签名篡改、bcrypt版本和JWT已知样例。
- 秘密缺失/别名非法时不会回显密钥或错误堆栈；检查日志、工具结果与普通存储。
- 密码/随机工具使用密码学随机源和无偏映射；生成的私钥文件过期后不可读。
- 测试接入现有 `pnpm test`、`pnpm test:contract`、`pnpm test:package`、`pnpm test:e2e` 对应入口，单模块先跑适用子集；命令与完整集成顺序见任务入口。不为无关代码造新检查器。
- 记录样例、命令、退出状态、实际产物与未验证项；失败修复后重跑受影响检查，再做顺序两阶段审查。不以文字勾选替代证据。
