# 许可与声明 · Licences and notice

[中文](#中文) · [English](#english)

## 中文

### 非官方同人项目

这是粉丝自发的学习作品，与华纳兄弟（Warner Bros.）、J.K. 罗琳、Wizarding World 以及《哈利·波特》系列的任何权利人都没有关系，
也没有得到他们的授权或认可。"Harry Potter""Hogwarts"、霍格沃茨城堡和场地的电影造型、学院徽章以及相关名称，版权和商标都归各自的权利人所有。

本项目只用于学习和交流，不得用于任何商业用途。权利人如果认为有不妥，请开一个 issue 联系，我们会尽快处理。

### 我们自己的部分

- **代码**（`src/`、`tools/`、`dist/` 和根目录的配置文件）按 [MIT 许可](LICENSE) 开源。
- **文档和图片**（`docs/` 里的开发笔记、分镜和渲染图）按 [知识共享 署名-非商业性使用 4.0 国际许可（CC BY-NC 4.0）](https://creativecommons.org/licenses/by-nc/4.0/deed.zh-hans) 发布。
- 这两种许可只覆盖我们自己写的代码和文字、我们渲染的画面，**不覆盖**上面说的城堡造型、名称和徽章。拿去用时，那一部分仍然受权利人的版权和商标约束。

署名请写：霍格沃茨城堡复刻（非官方同人），dasungta 出品，Opus 5.5（Claude Code）制作。

### 参考照片

仓库里不带参考照片。`ref/*/SOURCES.json` 列出了每一张的标题、作者、许可（CC BY、CC BY-SA 或公有领域）和维基共享资源页面。
用 `python -I tools/commons_fetch.py ref/<文件夹> --restore` 下载以后，使用时请按每张照片自己的许可署名。

### 第三方

- [three.js](https://threejs.org/)（MIT），运行时从 jsDelivr 加载。
- 字体 IM Fell English SC 和思源宋体 Noto Serif SC（都是 SIL Open Font License 1.1），运行时从 Google Fonts 加载。
- 项目里没有用到任何电影画面、电影音乐或官方美术素材。

## English

### Unofficial fan project

This is a fan-made study project. It is not affiliated with, authorised or endorsed by Warner Bros., J.K. Rowling, Wizarding World
or any other rights holder of the Harry Potter series. "Harry Potter", "Hogwarts", the film design of the castle and its grounds,
the house crests and related names are copyrights and trademarks of their respective owners.

The project is for learning and discussion only and must not be used commercially. If you are a rights holder and object to
anything here, please open an issue and we will deal with it promptly.

### Our own work

- **Code** (`src/`, `tools/`, `dist/` and the configuration files in the root) is released under the [MIT licence](LICENSE).
- **Documents and images** (the development notes, storyboards and renders in `docs/`) are released under
  [Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/).
- These licences cover only the code and text we wrote and the pictures we rendered. They **do not** cover the castle design,
  names and crests mentioned above, which remain subject to their owners' copyrights and trademarks.

Credit: Hogwarts Castle replica (unofficial fan project), produced by dasungta, built by Opus 5.5 (Claude Code).

### Reference photos

The reference photos are not in the repository. `ref/*/SOURCES.json` lists each one with its title, author, licence
(CC BY, CC BY-SA or public domain) and Wikimedia Commons page. After downloading them with
`python -I tools/commons_fetch.py ref/<folder> --restore`, credit each photo as its own licence requires.

### Third parties

- [three.js](https://threejs.org/) (MIT), loaded from jsDelivr at run time.
- The fonts IM Fell English SC and Noto Serif SC (both SIL Open Font License 1.1), loaded from Google Fonts at run time.
- No film footage, film music or official artwork is used anywhere in the project.
