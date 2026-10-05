# 小小宇宙 · LITTLE UNIVERSE

一个浅色系的高级感单页：主界面只有「小小宇宙」四个字，轻触后暖光炸开，四个字的笔画散成光尘，四张照片从纸面里浮出来。

> 世界很大，幸好我们拥有彼此的小宇宙。

## 打开方式

直接双击 `index.html` 即可（无需服务器、无需构建、无外部依赖）。
若想用本地服务器：在本目录执行 `python -m http.server 8000`，然后访问 `http://localhost:8000/`。

## 交互

| 操作 | 效果 |
| --- | --- |
| 点击 / 轻触屏幕（或按 Enter、空格） | 暖白爆闪 + 光尘四散，四字化光，四张照片依次浮出 |
| 鼠标移动 | 主界面微视差；照片墙里相框跟着光标轻微 3D 倾斜，纸面有反光 |
| 点击照片 | 打开大图（Esc 或点背景关闭） |
| 「重新收起」 | 光尘归拢，照片退回纸面，回到「小小宇宙」 |
| 右上角「音效」 | 开关合成音效（Web Audio 实时合成，无音频文件） |

## 文件结构

```
index.html          页面结构
css/style.css       全部样式（浅色配色、相纸相框、动效）
js/app.js           粒子系统、开启/收起编排、音效、大图查看
assets/photo-1.jpg  第一张   （1080×1920 竖版）
assets/photo-2.jpg  第二张
assets/photo-3.jpg  第三张
assets/photo-4.jpg  第四张
```

## 换成自己的照片

1. 把图片放进 `assets/`，**竖版**最佳（9:16，宽度 1000px 以上）。
2. 改 `index.html` 里四个 `<figure class="frame-wrap">` 的 `data-src`、`<img src>`、`data-cap`，以及 `<figcaption>` 里的编号。
3. 想加减照片：复制或删除整个 `<figure>` 块即可，JS 会自动适配数量（编号 `--i` 记得按顺序改，它决定入场的时间差和倾斜方向）。

## 可以调的地方

- 主标题：`index.html` 中的 `<h1 class="title">`，每个字一个 `<span class="ch" style="--i:n">`。
- 那句配文：`<h2 class="verse">` 与 `<p class="verse-en">`。
- 主题色：`css/style.css` 顶部的 `:root` 变量（`--paper`、`--ink`、`--bronze`）。
- **照片尺寸**：`:root` 里的 `--h`（照片高度，整个照片墙布局由它驱动），改成更大或更小即可整体缩放。
- 已适配手机（自动变成 2×2 网格、配文自动换行）与"减少动态效果"系统偏好。

## 部署到 GitHub Pages

本目录已带一个 `deploy.ps1`，用法见文件顶部注释：

```powershell
powershell -ExecutionPolicy Bypass -File deploy.ps1 -Token "ghp_你的token"
```
