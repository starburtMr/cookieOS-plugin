# cookieOS Plugins

cookieOS 插件的公开开发与分发仓库。每个插件直接放在根目录的独立文件夹中，独立版本、独立打包、独立发布；接入方法和经过验证的开发经验统一维护。

## 插件

| 插件 | 源码 | 版本 | 状态 |
|---|---|---|---|
| Ctool 开发者工具箱 | [ctool](ctool/README.md) | 0.1.0 | 市场测试版本；按 SDK 1.1.0 接入，待独立宿主验收 |

市场提供 Ctool 0.1.0 测试版本，安装包通过 [GitHub Release](https://github.com/starburtMr/cookieOS-plugin/releases/tag/ctool-v0.1.0) 分发。真实宿主安装、模型及 MCP 验收仍待完成。

新增插件后，在此登记名称、目录、用途、最新版本和验证过的 cookieOS 版本。可安装版本以签名市场清单为准。

## 目录

```text
cookieOS-plugin/
├── README.md
├── docs/                   # 共享开发规范和经验
├── market/                 # 市场清单、签名、公钥
└── <plugin-name>/          # 每个业务文件夹对应一个插件
    ├── README.md
    ├── manifest.json
    └── ...                 # 按插件运行形态组织
```

`docs`、`market` 和点号开头的配置目录是保留目录。开发工具配置与私密文件留在本地，不参与源码和安装包分发。

## 开发与分发

- [开发约定](docs/development.md)：插件边界、SDK 使用、验证与独立发布。
- [开发经验](docs/experience.md)：适用条件、已验证结论和失效条件。
- [市场维护](docs/market.md)：接入地址、签名、更新和恢复规则。

插件使用 cookieOS 提供的扩展 SDK；本仓库不复制宿主源码或维护另一套插件协议。安装包通过本仓库的 GitHub Releases 分发，不提交到源码目录。

## 市场入口

- 清单：<https://raw.githubusercontent.com/starburtMr/cookieOS-plugin/main/market/registry.json>
- 签名：<https://raw.githubusercontent.com/starburtMr/cookieOS-plugin/main/market/registry.json.sig>
- 公钥：[market/public-key.txt](market/public-key.txt)

新版 cookieOS 在扩展设置填写仓库地址 `https://github.com/starburtMr/cookieOS-plugin` 或上述清单地址，再点击「刷新市场」，应显示 Ctool。旧版固定公钥模式还需填写公钥文本；公开文件及离线验签不代表真实宿主安装验收。

## 使用与贡献

新增插件应包含用途、配置、权限、数据位置、验证环境和更新记录。不要提交真实凭据或用户运行数据。

本仓库尚未指定统一开源许可证。公开可见不等于授予再分发或商业使用许可；插件采用许可证时在各自目录明确标注，第三方依赖及素材保留各自许可声明。
