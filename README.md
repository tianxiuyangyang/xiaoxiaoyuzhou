# 小小宇宙 · LITTLE UNIVERSE

一个浅色系的高级感单页：主界面只有「小小宇宙」四个字，轻触后暖光炸开，四个字的笔画散成光尘，九张照片从纸面里依次浮出来。

> 世界很大，幸好我们拥有彼此的小宇宙。

## 打开方式

直接双击 `index.html` 即可（无需服务器、无需构建、无外部依赖）。
若想用本地服务器：在本目录执行 `python -m http.server 8000`，然后访问 `http://localhost:8000/`。

## 交互

| 操作 | 效果 |
| --- | --- |
| 点击 / 轻触屏幕（或按 Enter、空格） | 暖白爆闪 + 光尘四散，四字化光，九张照片按 0.085 秒间隔依次浮出 |
| 鼠标移动 | 主界面微视差；照片墙上相框按所在列向不同方向轻微 3D 倾斜，纸面有反光 |
| 点击照片 | 打开大图（Esc 或点背景关闭） |
| 「重新收起」 | 光尘归拢，照片退回纸面，回到「小小宇宙」 |
| 右上角「音效」 | 开关合成音效（Web Audio 实时合成，无音频文件） |

## 照片列表

| 文件 | 内容 | 原始尺寸 |
| --- | --- | --- |
| `photo-1.jpg` ~ `photo-4.jpg` | 四张合照 | 1920×1080（横） |
| `photo-5.jpg` ~ `photo-9.jpg` | 五张游戏截图 | 1920×950（横） |

> `photo-1~4` 原始素材是**竖着存但画面横躺**的手机自拍（没有 EXIF 方向标记，像素本身就是躺的），
> 已实际把像素**逆时针旋转 90°** 修正为正常横构图，不是靠 CSS 转的。

## 文件结构

```
index.html           页面结构
css/style.css        全部样式（浅色配色、相纸相框、自适应网格）
js/app.js            粒子系统、开启/收起编排、音效、大图查看
assets/photo-1..9.jpg
```

## 换成自己的照片

1. 把图片放进 `assets/`，**横版**最佳（2:1 左右，宽度 1200px 以上；其它比例会被 `object-fit:cover` 居中裁切）。
2. 改 `index.html` 里每个 `<figure class="frame-wrap">` 的 `data-src`、`<img src>`、`data-cap`，以及 `<figcaption>` 里的编号。
3. 增删照片：复制或删除整个 `<figure>` 块。JS 会自动适配数量，只需保证 `--i` 从 0 开始连续编号（它决定入场顺序和倾斜方向）。

## 可以调的地方

- 主标题：`index.html` 中的 `<h1 class="title">`，每个字一个 `<span class="ch" style="--i:n">`。
- 那句配文：`<h2 class="verse">` 与 `<p class="verse-en">`。
- 主题色：`css/style.css` 顶部的 `:root` 变量（`--paper`、`--ink`、`--bronze`）。
- **照片大小**：`.frames` 的 `width`，其中 `calc((100dvh - 450px) * 2)` 让网格高度自动贴合屏幕高度。
- **列数**：`.frames` 的 `grid-template-columns`（默认 3 列，≤1000px 宽时自动变 2 列）。

## 部署到 GitHub Pages

本目录已带一个 `deploy.ps1`，用法见文件顶部注释：

```powershell
powershell -ExecutionPolicy Bypass -File deploy.ps1 -Token "ghp_你的token"
```

> 注意：从别处拷进来的图片可能带**只读属性**，会导致脚本或图片工具写不进去。
> 如果有问题，先执行：`Get-ChildItem assets -File | ForEach-Object { $_.IsReadOnly = $false }`
