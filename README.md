# Grasp Atlas

可离线使用的中英双语机器人抓取论文浏览器，支持全文搜索、会议/期刊/年份筛选、研究方向统计、个人删除与恢复、CSV 导出，以及本机 PDF 下载和校验。

当前文献快照为 **2026-11-12**。首次打开时，**523 篇在论文清单中，187 篇在回收站中**，共可管理 710 篇。覆盖 2020–2026 年的 AAAI、ICLR、NeurIPS、CVPR、ICCV、ECCV、ICML、CoRL、ICRA、RSS，以及 RA-L、T-ASE、T-RO；当前数量会随你的删除和恢复选择变化。

以抓取为主要研究问题，同时收录直接支持抓取的场景/物体重建、形状补全、深度恢复及 NeRF / 3DGS 方法。此前从原清单撤下的 159 篇现在全部进入回收站，供你自行复查恢复，其中包含上一轮已恢复的 23 篇。名单与默认状态见 [回收站记录](editable-site/curation/original-159-review-bin-2026-11-12.json)；此前 [27 篇重建方向恢复记录](editable-site/curation/reconstruction-grasp-restoration-2026-11-12.json) 保留为历史快照。其余历史排除记录保持原状态。

本轮另排除软体夹爪、软手及软体机器人抓取，以及软物体/可变形物体抓取，包括线缆、绳索、软食品和柔性片材。共匹配 40 篇，其中 28 篇新移入回收站、12 篇原已在回收站；逐篇原因与保留的边界案例见 [软体抓取排除记录](editable-site/curation/soft-grasping-exclusions-2026-11-12.json)。通用顺应控制、数学软约束及一般软指接触假设不因关键词而删除。

## 使用

直接打开根目录的 `index.html`，即可离线浏览论文元数据、搜索、筛选并使用在线论文链接。在左侧“回收站”中搜索论文，点击“恢复”即可加入清单；也可“恢复全部”。个人选择保存在当前浏览器中，刷新后保留。原 159 篇和本轮软体抓取删除分别只应用一次；更新时只额外删除本轮匹配论文，保留其他恢复/删除选择。本轮论文之后也可恢复。

回收站每篇论文旁另有“永久删除”。确认后会从项目目录、摘要、链接、筛选记录、下载状态及索引中移除该论文，同时清理对应 PDF、候选文件、下载残片、全文缓存和本地备份中的记录，再重建离线页面。“恢复全部”不能找回永久删除的论文。该操作通过本机服务执行：先双击 `Start_Grasp_Atlas.cmd`；如果旧服务仍在运行，先关闭其启动窗口后再打开。直接双击离线 HTML 时会显示启动提示。下载任务运行期间不允许永久删除；其他论文仍在使用的共用 PDF 会保留。

需要网页内下载按钮时，安装 Python 3.10 或更新版本，在项目根目录运行：

```sh
python atlas_server.py
```

浏览器会打开 `http://127.0.0.1:8765/`。Windows 也可双击 `Start_Grasp_Atlas.cmd`。点击网页中的“下载 / 重试全部”开始下载当前浏览器清单中的论文；仍留在回收站的论文会跳过，恢复后的论文会随清单一起下载。

直接启动下载器：

```sh
python Grasp_Atlas_Downloader/Grasp_Atlas_Downloader/start_download.py --retry
```

Windows 可双击 `Download_All_Papers.cmd`。启动器会创建专用 Python 环境，并安装 PDF 校验依赖。下载支持断点续传、已下载文件跳过和 PDF 标题校验；无法取得或仍需核验的全文会单独标记。

命令行默认跳过这 187 篇；网页中的恢复选择只保存在该浏览器，使用网页下载按钮会自动携带这些选择。命令行也可通过 `--ids 339,557` 显式下载指定的原始编号。

仓库不包含论文 PDF。首次使用时，本地全文数量为 0；下载器会生成 `GraspAtlas_Library/` 和 `library.js`。生成后刷新页面，即可打开已核验的本地 PDF。

## 目录

```text
.
├── index.html                     # 生成的单文件离线入口，保留在仓库中
├── atlas_server.py                # 本机网页服务和下载接口
├── paper_purge.py                 # 永久删除、历史记录清理和失败回滚
├── editable-site/
│   ├── dist/                      # 可编辑的 HTML、CSS、JavaScript 和论文数据
│   ├── curation/                  # 版本化筛选数据、来源依据及回归测试输入
│   ├── tests/                     # 前端、论文范围及数据一致性测试
│   └── build_offline.py           # 重建根目录离线页面
├── Grasp_Atlas_Downloader/
│   └── Grasp_Atlas_Downloader/
│       ├── catalogue.json         # 下载器论文目录，与前端数据保持一致
│       ├── paper_overrides.json   # 已核对的标题/版本对应关系
│       ├── resolved_sources.json  # 已整理的公开来源链接
│       └── start_download.py      # 下载器启动入口
├── scripts/check.py               # 重建并运行所有测试
└── START_HERE.txt                  # 本地使用说明
```

`editable-site/dist/` 是本项目的可编辑源码，不能作为普通构建缓存忽略。`catalogueId` 是永久编号，不能重排或复用；修改论文目录时须同步 `catalogue.json` 和 `editable-site/dist/data.js`。

## 修改与检查

修改 `editable-site/dist/` 后重建离线入口：

```sh
python editable-site/build_offline.py
```

开发检查需要 Python、Node.js，以及下载器的 PDF 依赖。可在自己的虚拟环境中安装后运行：

```sh
python -m pip install -r Grasp_Atlas_Downloader/Grasp_Atlas_Downloader/requirements.txt
python scripts/check.py
```

检查包含前端行为、文献范围、历史编号、来源一致性和下载器单元测试。不需要先下载论文；存在本地下载状态时，也会检查相应的身份映射。

## Git 忽略范围

`.gitignore` 排除整个本地下载库、PDF、断点、下载日志/报告、生成的 `library.js`、Python 环境和缓存，以及根目录更新、排除、查漏报告和 `TEST_RESULTS.txt`。这些文件仍保留在本机。

网页源码、离线入口、论文目录、已核对的来源链接及 `editable-site/curation/` 筛选数据保留在版本管理中；筛选数据也是回归测试输入，不属于本机运行报告。

论文、代码、数据及摘要的来源和许可信息保留在对应条目中；预印本与正式发表版本可能存在差异。
