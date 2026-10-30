# 加密、生成与开发辅助

输入：[迁移矩阵](../../../docs/migration-matrix.md)、[技术设计 §4、§8](../../../High-Level-Design.md)。负责原 crypto/dev/generate 三类 UI 和业务；C3 拥有通用 Worker/预算边界，B2 拥有历史政策。记录见 [Progress](../../../Progress.md)。

<a id="c2"></a>
## C2：保留原算法与兼容行为

**前置任务：B3、C3。**

**目标：** 迁移加密/签名/校验、随机生成、二维码/条形码、时间/Cron/单位/网络计算等原有能力，不更换结果格式或手写通用算法。

**修改范围：** 原 `tools/encrypt/`、hash/hmac/sign/bcrypt/password、dataValidation、time/crontab/unit、qrCode/barcode/randomString/uuid/binary/ipcalc/numberCalc、sqlFillParameter/stacktrace/chmod/color，相关 helper/worker/测试。

**执行步骤：**
1. CryptoJS 只做有依据的 4.2.0 适配；保留 sm-crypto/jsrsasign/bcryptjs。逐个明确原模式、填充、key/IV/编码与签名输入，不能用 AES-CBC 单一样例代替全部算法。
2. 时间/工作日/Cron 使用原 dayjs、chinese-days、cron-parser、cronstrue；显式时区、秒毫秒、固定当前时间和 DST；大整数使用原精确实现。
3. 二维码、条码、数学、颜色、校验继续使用现成库；保留图像/输出格式/选项。高成本操作接入 C3 的取消及上限，不以 Promise.race 掩盖仍在运行的同步逻辑。
4. 随机数由 Web Crypto/原 uuid 生成，字符映射采用经验证的无偏做法；不创建新 PRNG、不将密码写入历史或普通日志。

**验收：** 每种原有加密模式有固定向量、错误 key/签名失败及旧→新/新→旧兼容；验证 Unicode、数量边界、图像尺寸、无效日期、DST 跳跃/重复、无效 Cron 和工作日数据版本。操作失败不覆盖输入，不宣称传统算法适合所有安全用途。

**证据：** 矩阵所有负责入口的正常/失败样例、标准向量来源、模式兼容与资源测试。CryptoJS 停止维护及相关限制继续保留在依赖记录，不因修复已知公告就承诺无漏洞。


## 本轮实现记录（2026-10-30）

- 任务：C2。
- 实现：修补 CryptoJS/SM2/RSA/UA/CSV/mathjs 等依赖兼容，去掉不需要的 Node crypto 浏览器签名兼容层；随机数映射无取模偏差并限制总输出。
- 验证：libraries.test.ts 覆盖 SM2、AES、RSA、UA、CSV、单位计算与随机边界；仍需真实宿主/浏览器矩阵验收。
- 状态与最终命令结果：[Progress](../../../Progress.md)。真实宿主验收项保持待验收。
