# Codex 配置隔离记录

日期：2026-06-12

## 不能再改的全局配置

全局 Codex 配置路径：

```text
C:\Users\Administrator\.codex\config.toml
```

这份配置会被 VS Code Codex 插件读取。不要把桌面 Codex++ 的模型桥、DeepSeek、MiniMax、阿里千问配置写进这里，也不要在这里启用 Windows 沙盒。

明确禁止：

```toml
[windows]
sandbox = "elevated"
```

如果需要写，也只能保持为注释，或完全不要写：

```toml
# [windows]
# sandbox = "workspace-write"
```

全局配置里不应出现这些生效项：

```toml
model_provider = "codexpp_bridge"
[model_providers.codexpp_bridge]
```

全局配置备份：

```text
E:\git\codex+\codex-config.backup-2026-06-12.toml
```

## 桌面 Codex++ 专用空间

桌面 Codex++ 使用自己的数据目录：

```text
C:\Users\Administrator\AppData\Roaming\codex-plusplus
```

桌面 Codex++ 的 Codex 配置只写这里：

```text
C:\Users\Administrator\AppData\Roaming\codex-plusplus\desktop-codex-home\config.toml
```

DeepSeek / MiniMax / 阿里千问模型桥只允许进入这个桌面专用 `CODEX_HOME`，不能影响 VS Code Codex 插件。

## 后台服务

后台修复服务名称：

```text
codex-plusplus-watcher
```

服务程序：

```text
C:\Users\Administrator\AppData\Roaming\codex-plusplus\service-host\codex-plusplus-watcher-service.exe
```

服务日志：

```text
C:\Users\Administrator\AppData\Roaming\codex-plusplus\log\watcher-service.log
```

服务进程会显式设置这些环境变量，保证会话空间隔离：

```text
CODEX_PLUSPLUS_HOME=C:\Users\Administrator\AppData\Roaming\codex-plusplus
CODEX_HOME=C:\Users\Administrator\AppData\Roaming\codex-plusplus\desktop-codex-home
CODEXPP_DESKTOP_CODEX_HOME=C:\Users\Administrator\AppData\Roaming\codex-plusplus\desktop-codex-home
```

## 插件总开关

配置文件：

```text
C:\Users\Administrator\AppData\Roaming\codex-plusplus\config.json
```

当设置页里的“插件总开关”关闭时，会写入：

```json
{
  "codexPlusPlus": {
    "enabled": false
  }
}
```

关闭后，桌面 Codex++ 只保留设置页和开关监听能力；模型桥、插件功能、MCP 同步、后台自动修复都会暂停。
