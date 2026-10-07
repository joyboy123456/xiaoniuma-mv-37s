> **2026-10-07 更新：成片已完成。** 见 `制作与验收说明.md`；以下为早期断点记录，仅供参考。

# 《小牛马》37s MV — 进度档案

> 最后更新：2025-10-01（会话中断点）
> 本文件是**唯一权威的进度记录**，任何新设备 clone 后先读本文件再继续。

---

## 1. 总体目标回顾

- 交付物：`claude_mv_16x9_37s.mp4` + 完整工程 + `contact_sheet.jpg` + `制作与验收说明.md`
- 硬约束：1920×1080 / 30fps / 1110 帧 / 37.012s / H.264+AAC / 19 句歌词逐句可见 / 音频 `-c:a copy`
- 工作流：先视觉设定 + 镜头表，再渲染质检，再全片渲染，再独立封装音频

---

## 2. 已完成 ✅

### 2.1 环境门禁（本会话新完成）
- [x] `gh` CLI 登录（账号 `joyboy123456`）
- [x] Git 仓库初始化 + 推送至 https://github.com/joyboy123456/xiaoniuma-mv-37s
- [x] `.gitignore` 正确排除 `node_modules/`、`out/`、whisper 模型、渲染产物
- [x] 验证冷启动：`git clone && cd starter && npm ci` ≈ 3s，可完整重建环境

### 2.2 创作包分析（上轮完成）
- [x] 精读 `CLAUDE.md`（== `PROMPT.md`，byte-identical）
- [x] 核对 `manifest.json` 与 assets/lyrics sha256 一致
- [x] ffprobe 确认：AAC 44.1kHz 单声道 37.012s，~48kbps
- [x] 拆解 starter 底座：渲染管线、纯函数时间轴、boil/lettering/wash 系统、转场机制
- [x] 列出 6 大陷阱：Chrome 缺失、30fps vs 24fps、duration 11s→37s、字幕优先级、水彩性能、音频重编码

### 2.3 音频分析管线（上轮工作产物，脚本已入库）
- [x] `work/audio/analyze.py` / `beat.py` / `pitch.py` — 频谱/节拍/基频分析
- [x] 4 张频谱图 + 波形图 + `pitch.txt` 已入库，供复核
- [x] `work/asr/fw.py` / `fw2.py` — faster-whisper 转写脚本
- [x] `fw_plain.json` / `fw_prompt.json` — 两版转写结果已入库
- [x] `fw_small.log` — 模型运行日志已入库

---

## 3. 未完成 / 断点 ❌（下次开工从这里接）

### 3.1 阻塞项：Chrome 二进制丢失
- **状态**：上次下载的 Chrome for Testing 在 `/tmp` 被 macOS 清理
- **影响**：无法运行 `render.mjs`，一帧都渲不出来
- **下一步**：重新下载 chrome-mac-arm64 到项目内持久位置（如 `starter/.chrome/`），并写入 `.gitignore`

### 3.2 句级时间轴（核心，未完成）
- **状态**：有 faster-whisper 初版转写，但**未做人工交叉确认**
- **风险**：48kbps 单声道导致辅音糊，不可全信 ASR
- **下一步**：
  1. 重下 Chrome 后，先用任意可视化渲染确认管线通
  2. 用 `work/asr/fw_plain.json` 的时间戳圈出 19 句候选区间
  3. 在可听设备上逐句听审，修正起止点（重点：8 个"什么…"的节奏加速）
  4. 落盘为 `work/timeline.md` 或 `src/scenes/xiaoniuma.js` 的注释常量

### 3.3 渲染工程配置
- **状态**：`starter/src/config.js` 仍为 demo 默认值
- **下一步**：
  - `duration: 11` → `37.012`
  - `bpm: 120` → 实测 BPM（用 `work/audio/beat.py` 结果复核）
  - `offset: 0` → 首句起音偏移

### 3.4 视觉设定 + 镜头表
- **状态**：未开始
- **下一步**：
  - 确定贯穿全片的原创视觉语言（纸张/复印/丝网/手绘/剪贴任选）
  - 主角设计（不必用 Clawd）
  - 37 秒镜头表（开场 2s 钩子 + 八连"什么…"加速段 + 结尾"意志力/拼到底"）
  - 先用 `--sheet` / `--strip` 渲开头 2s 和一段八连，质检过关再全片

### 3.5 全片制作
- 1110 帧 `--frames` 并行渲染（可断点续跑）
- 独立 ffmpeg：`-map 0:v -map 1:a -c:v libx264 -c:a copy` 封装
- 产出 `contact_sheet.jpg` + `制作与验收说明.md`

---

## 4. 冷启动恢复指南（新设备标准流程）

```bash
# 1. 克隆
git clone https://github.com/joyboy123456/xiaoniuma-mv-37s.git
cd xiaoniuma-mv-37s

# 2. 装依赖（≈3s）
cd starter
npm ci

# 3. 下载 Chrome for Testing（macOS arm64 示例）
cd ..
mkdir -p starter/.chrome
curl -L 'https://storage.googleapis.com/chrome-for-testing-public/148.0.7778.97/mac-arm64/chrome-mac-arm64.zip' -o /tmp/chrome.zip
unzip /tmp/chrome.zip -d starter/.chrome/
# 然后 export CHROME_PATH 或修改 render.mjs 的 chrome 查找路径

# 4. 验证渲染管线通
cd starter
node render.mjs --sheet=0.5,1,1.5 --out=out/check/smoke
# 应生成接触表

# 5. 打开此文件，从「3. 未完成」继续
open ../PROGRESS.md
```

---

## 5. 已知遗留问题

| 问题 | 影响 | 建议 |
|---|---|---|
| Chrome 需重下 | 阻塞渲染 | 见 §4.3 |
| whisper small (464MB) 未入库 | 重跑 ASR 需重下模型 | 若只做微调可用现有 `fw_plain.json`，不必重跑 |
| `work/audio/*.npy` 未入库 | 频谱分析中间数据丢失 | 可重跑 `analyze.py` 重建；若急需可本地保留不入 git |
| 48kbps 单声道 | 听审定界难 | 建议用耳机+ASR 时间戳+交叉确认 |

---

## 6. 提交历史

- `5627b03` feat: initial blind MV creation package（当前 HEAD）
