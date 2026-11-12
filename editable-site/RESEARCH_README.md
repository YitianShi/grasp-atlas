# Grasp Atlas

2026-11-12 最新状态：默认清单 523 篇（直接相关 519、扩展相关 4）、回收站 187 篇，可管理合计 710 篇。本机默认清单有 365 篇已核验本地全文，回收站中有 147 篇。
本轮按用户明确要求，排除软体夹爪/软手/软体机器人抓取，以及软物体/可变形物体抓取，包括线缆、绳索、软食品、织物和柔性片材。共匹配40篇，新移入28篇、此前已删除12篇。独立删除批次只应用一次，保留其他论文的恢复/删除选择；之后仍可恢复本轮论文。
本轮名单、证据等级及保留的边界案例见 `curation/soft-grasping-exclusions-2026-11-12.json`。本机完整报告为根目录 `SOFT_GRASPING_EXCLUSIONS_REPORT_2026-11-12.txt`，报告和下载内容继续由 Git 忽略。

原159篇名单与批次保持不变：`curation/original-159-review-bin-2026-11-12.json`。此前重建方向恢复及主线审查保留为历史快照。历史 `catalogueId` 不得复用，下一编号仍至少为780。

`rows` 保留574篇目录快照，`reviewBin.rows` 补充136篇，顺序和内容不变；全部710条记录继续对应原下载状态。`reviewBin.catalogueIds` 与新增 `deletionBatches[].catalogueIds` 的并集指定默认删除集合。前端按各自 `batchId` 一次性合并到个人删除记录；不能改动原批次ID来重复应用全部159篇。网页下载使用浏览器当前可见编号；命令行默认跳过并集187篇，显式 `--ids` 可选中已恢复论文。

下文数量为此前历史快照。

2026-11-12 全来源复核：当前 747 篇（608 篇直接相关、139 篇扩展相关），活动全文 516 篇；CoRL 2026 仍为 18 篇。
已逐一核对项目中 10 个会议、3 个期刊的 2020–2026 年来源，补入 50 条确认遗漏，新增 9 篇已核验全文。
最新说明见 FULL_RECHECK_2026-11-12.txt；以下为此前轮次的历史快照。

本轮来源/年份覆盖、候选、标题变体及 50 条确认遗漏在 `curation/full-recheck-2026-11-12.json`。未决候选不视为已确认遗漏。所有新增摘要均为注明原始来源的原创概述。历史永久编号和 PDF 对应关系保留。


2026-11-12 最新清单：697 篇（598 篇直接相关、99 篇扩展相关），本地全文 507 篇；CoRL 2026 为 18 篇。排除全身抓取、衣物/布料/织物抓取及手内操作。

本轮期刊更新新增 19 篇（RA-L 14、T-ASE 3、T-RO 2），复核 4 篇已有记录，补充 14 篇公开全文。窗口为 2026-10-01 至 2026-11-12 的新登记或 10/11 月卷期，不能等同于全部论文的首次在线发布日期；逐篇日期、来源和 119 条候选判定见 `curation/journal-update-2026-11-12.json`。2 篇仅完成标题范围初筛。最新说明见根目录 `JOURNAL_UPDATE_2026-11-12.txt`。

以下范围调整计数为本轮期刊新增前的历史快照。

2026-11-12 范围调整：本轮移除全身抓取 7 篇及衣物/织物抓取 12 篇，继续排除此前的手内操作研究。当前 678 篇（595 篇直接相关、83 篇扩展相关），CoRL 2026 为 18 篇，活动条目的本地全文为 493 篇。范围覆盖足式机器人全身协同抓取、软体机器人全身抓取，以及衣物/布料的抓取点检测、整理、折叠、分拣和穿衣辅助。仅研究人形机器人手臂或灵巧手而不涉及全身协同的研究保留；geometric fabrics 不指织物。详细判定及边界案例在 `curation/whole-body-garment-exclusions.json`。

新增排除记录已加入论文库的 `excluded_records.json`，累计归档 32 条记录。历史 PDF 留在原路径，活动清单和下载任务不再包含这些论文；全部存活条目的 `catalogueId`、PDF 映射和个人删除键保持不变。最新概览见根目录 `WHOLE_BODY_GARMENT_EXCLUSIONS.txt`。

以下为此前版本的历史制作记录，数量以本段最新范围为准。

2026-11-06 范围调整：排除手内操作（in-hand manipulation）研究，包括实际包含手内重定向、物体相对夹爪运动、转笔或关节物体手内操作实验的论文。已从当前清单移除 13 篇，现为 697 篇（608 篇直接相关、89 篇扩展相关），CoRL 2026 为 20 篇，本地全文为 509 篇。判定依据与边界案例保存在 `curation/inhand-exclusions.json`；历史下载状态保存在根目录论文库的 `excluded_records.json`。历史 PDF 保留在原路径，不再显示为活动条目。

`catalogueId` 是不可重排或复用的永久编号，前端论文 ID、全文索引和下载来源均按它匹配。新增论文必须使用新的唯一编号（下一编号至少为 780），不能用数组下标填补已排除条目的编号。其余论文的原编号、PDF 映射与个人删除键均保留。更新后运行 `python editable-site/build_offline.py` 重建离线页，并运行全部前端与下载器测试。

以下为此前 CoRL 导入和制作历史，数量以本段最新范围为准。

2026-11-06 更新：对照 CoRL 2026 官方全部 687 篇录用论文，初筛及补查 32 个候选；新增 18 篇（15 篇直接相关、3 篇扩展相关），核实原有 4 篇，共收录 22 篇 CoRL 2026 论文。当前总数为 710 篇：616 篇直接相关、94 篇扩展相关。其他会议与期刊仍以 2026-10-05 的基础快照为准。本轮不是对全部通用机器人操作论文的全文穷尽审核。

新增条目包含 13 篇版本明确的 arXiv 摘要、3 篇标注来源的原创概述；2 篇仅能核实官方录用标题，明确显示“范围初筛”和“摘要暂未获取”。代码仓库与仿真平台仅填写已核实内容。RoboMAP 使用作者页明确关联的早期预印本，标题和作者列表与当前版本不同，详情保留版本说明。新增记录追加在原 692 条之后，原编号、PDF 映射与删除键保留。下载器支持校验历史记录后追加新条目，并可修复随文件夹复制而失效的 Python 环境。

筛选、排除、待核对记录及完整官方名单位于 `curation/corl-2026-review.json`；最新全文下载结果见根目录 `CORL_2026_UPDATE.txt`。本次沿用原有非触觉、非硬件设计范围与标题关键词排除规则。

验证命令：

```sh
node editable-site/tests/collection.test.cjs
node editable-site/tests/features.test.cjs
node editable-site/tests/app.test.cjs
node editable-site/tests/library.test.cjs
node editable-site/tests/corl-2026.test.cjs
node editable-site/tests/inhand.test.cjs
node editable-site/tests/journal-scope-update.test.cjs
node editable-site/tests/full-recheck.test.cjs
node editable-site/tests/primary-grasp-scope.test.cjs
# Windows，从下载器目录执行：
.grasp_python/Scripts/python.exe -m unittest test_downloads.py
```

以下为此前版本的历史制作记录，数量和检索限制描述保留当时的快照。

中英双语机器人抓取论文浏览器，范围为 2020 年以来 AAAI、ICLR、NeurIPS、CVPR、ICCV、ECCV、ICML、CoRL、ICRA、RSS，以及 RA-L、T-ASE、T-RO。截至 2026-10-05 收录 692 篇：601 篇直接相关、91 篇扩展相关。其中 RA-L 199 篇、T-ASE 49 篇、T-RO 19 篇、ICRA 244 篇、RSS 23 篇。

本次将范围前推到 2020 年，新增 141 篇：2020 年 70 篇、2021 年 71 篇。266 条早期候选中，104 条排除、21 条待核对。新增论文中 100 篇有英文摘要或明确标记的概述，41 篇摘要暂未取得；41 条仅完成标题范围初筛。原有 536 条论文顺序和删除键保留。CoRL 按会议年份计入，2020 年论文集 PMLR 155 和 2021 年论文集 PMLR 164 的后一年出版日期不会改变会议年份。

2026-10-05 再次查漏：71 条尚需处理的候选中，补入 15 篇、排除 54 篇、1 篇待核对，1 条 LaTeX 标题变体已在原清单中。新增 CoRL 1 篇、CVPR 4 篇、ICLR 1 篇、ECCV 3 篇、ICRA 6 篇；5 篇直接相关、10 篇扩展相关。15 篇均有独立论文页面及英文文本，其中 12 篇为作者/出版商摘要、3 篇为标注出处的原创概述。新增资源中 9 篇核实代码、11 篇核实仿真或渲染平台、15 篇记录所用数据或任务基准。原有 677 条记录、顺序和删除键完整保留。

本轮对照官方 CVF/ECVA、PMLR、RSS、NeurIPS、ICLR 名单，并复核 ICRA 2026 正式会议日程；期刊缓存中的 2020–2026 年抓取相关标题没有新的未审查候选。部分 Crossref 查询限流后停止；CoRL 2026 尚未举行、NeurIPS 2026 论文集尚不可得，因此不宣称零遗漏。ICRA 2026 新增条目以官方日程和作者录用信息核对，缺少出版商单篇元数据时使用作者关联预印本页面，并标注发表状态。

`dist/` 是无构建步骤、无外部运行依赖的静态网站。支持标题、摘要与资源名称搜索、会议/期刊/年份筛选、“仅会议 / 仅期刊”快捷按钮、八个研究方向、来源与年份热力图、前 10 标题关键词排行、分页、按当前界面语言导出 CSV。搜索不区分大小写，多个关键词须同时匹配，可跨标题、摘要及资源字段。统计和导出与筛选及个人删除实时联动。关键词排行仍按标题出现篇数计数，合并常见词形、过滤停用词，每篇最多贡献一次。

每篇均有摘要区域和明确状态。612 篇已取得摘要（249 篇 arXiv 作者预印本、333 篇 OpenAlex 文献索引、30 篇 PMLR 出版商摘要），另 11 篇根据已核实的原始摘要撰写简述，单独标为“摘要概述”；69 篇尚未取得，显示“摘要暂未获取”。预印本和索引摘要不宣称与最终出版版本一致。摘要保留来源语言，可展开阅读，主搜索与回收站搜索均包含摘要及概述，CSV 带来源、版本、署名及许可字段。

arXiv 与 OpenAlex 元数据摘要按 CC0 使用；PMLR 摘要按 CC BY 4.0 使用，并显示作者、论文出处、来源链接和许可。概述为根据各篇独立原始来源撰写的简述，不是原摘要的逐字转载。检索期间 OpenAlex 匿名访问达到限额后停止该来源请求，再补查论文原始页面及作者关联预印本。缺失内容不补写为伪造摘要。

每条记录都有代码、仿真、数据三个资源字段及核对来源。188 篇记录已确认作者代码库，113 篇已确认仿真或实验平台，226 篇已记录数据、物体模型、示范或任务基准；其他字段明确标注未核实。资源名称不保证完整下载或复现：AnyGrasp 链接是需申请许可的 SDK；部分作者仓库仍在完善，OCRTOC 当前仓库包含后续年度版本。这些差异在对应论文详情中注明。

期刊检索使用 IEEE 向 Crossref 提交的元数据，按三个期刊的已核实 ISSN 分页检索，并结合可获得的作者摘要、项目页及代码库筛选。原 2022–2026 年扩展审核的 530 条标题候选中，229 条收录、270 条排除、31 条待核对。加上 2020–2021 年期刊后，当前 151 条期刊记录仅完成标题范围初筛，页面显示“范围初筛”，详情明确全文尚未核对；其他条目结合作者摘要或项目说明核对。出版信息核对与研究范围核对分开记录，本清单不保证穷尽或所有条目的全文审阅。

会议按届次年份、期刊按正式卷期年份；未分配卷期时按可核实发表年份记录。卷期预分配、卷期待核实分别标注。一条过时的 Crossref 年份依据 IEEE 和作者发表记录修正为 2022。同一 DOI 的期刊论文与会议展示合并，已有 18 条 ICRA 展示记录归入期刊；不同 DOI 的会议版和扩展版分别保留。被合并条目的历史删除键保留，避免用户以前删除的文章重新出现。

论文标题及主按钮使用独立论文页。所有期刊条目链接到 IEEE 单篇页面，并记录 DOI、期刊名称和可核实卷期页码。当前 ICRA 有 233 条独立论文链接、11 条待核实；未知链接的标题不跳转，按钮明确禁用，会议目录仅作为详情中的来源。

范围排除触觉、接触或力传感器反馈策略，以及以夹爪、机械手、执行器、传感器或辅助装置的设计、协同设计、硬件验证为主要贡献的研究。几何接触预测、解析力闭合或训练奖励不自动等同于触觉输入。标题按大小写不敏感的字面子串排除 underwater、surgical、deformable、bimanual、suction、vacuum。该标题规则不扩展为摘要关键词排除。

审核记录位于 `curation/`：`journal-screening.json` 保存新增期刊候选、来源、收录/排除/待核对原因及合并记录；`hardware-exclusions.json` 和 `keyword-exclusions.json` 保留此前范围调整；`backfill-2020-2021.json` 保存早期论文候选、来源、范围决定及资源；`icra-paper-links.json` 记录当前 ICRA 链接及转入期刊的历史记录；`omissions-review-2026-10-05.json` 保存本轮候选、决策、来源及资源；`abstracts.json` 记录全部 692 篇的摘要状态、来源、匹配依据、版本与许可。存疑候选不计入收录总数。

每篇删除按钮在当前浏览器保存稳定删除键，刷新后保留，支持跨标签同步和即时撤销。独立回收站位于 `#bin`，兼容旧删除记录，显示删除文章的标题、发表来源与摘要，支持逐篇恢复及恢复全部。回收站有独立搜索，不受论文清单筛选影响；“恢复全部”恢复全部删除文章，包括回收站搜索隐藏的文章。统计、关键词排行、WebMCP 和 CSV 都排除已删除记录。范围排除的论文不会通过恢复操作加入。保存受阻时界面提示。删除记录和语言偏好均仅保存在当前浏览器，论文标题与摘要保留原文。

`data.js` 保存文献资源，`core.js` 提供筛选与统计，`collection.js` 管理删除，`i18n.js` 管理双语，`app.js` 管理界面。支持 `document.modelContext` 时提供 `filter_grasp_papers` 和 `read_grasp_statistics`；普通浏览器可直接使用完整功能。

验证涵盖 2020/2021 年筛选、七年图表、早期文章删除与恢复、期刊/会议快捷筛选、DOI 去重、旧删除记录迁移、回收站导航和刷新、逐篇/全部恢复、摘要单词检索及跨字段搜索、统计联动、独立论文链接、关键词排除、双语字段、来源署名和 CSV。当前环境没有受支持的可视浏览器预览，未进行可视检查。

```sh
node tests/collection.test.cjs
node tests/app.test.cjs
node tests/features.test.cjs
```

本轮补入论文：

| 来源 | 论文 |
| --- | --- |
| CoRL 2025 | SPIN: distilling Skill-RRT for long-horizon prehensile and non-prehensile manipulation |
| CVPR 2025 | GarmentPile: Point-Level Visual Affordance Guided Retrieval and Adaptation for Cluttered Garments Manipulation |
| CVPR 2026 | GeoDexGrasp: Geometry-aware Generation for Data-efficient and Physics-plausible Dexterous Grasping |
| CVPR 2026 | Breaking the 3D Dataset Bottleneck: Fast Scalable Generation of Aligned 3D Assets from Scratch for Category 6D Pose Estimation and Robotic Grasping |
| CVPR 2026 | ActiveGrasp: Information-Guided Active Grasping with Calibrated Energy-based Model |
| ICLR 2023 | DualAfford: Learning Collaborative Visual Affordance for Dual-gripper Manipulation |
| ECCV 2022 | Domain Randomization-Enhanced Depth Simulation and Restoration for Perceiving and Grasping Specular and Transparent Objects |
| ECCV 2022 | Sim-to-Real 6D Object Pose Estimation via Iterative Self-Training for Robotic Bin Picking |
| ECCV 2022 | Self-Supervised Interactive Object Segmentation through a Singulation-and-Grasping Approach |
| ICRA 2025 | RTAGrasp: Learning Task-Oriented Grasping from Human Videos via Retrieval, Transfer, and Alignment |
| ICRA 2025 | A Parameter-Efficient Tuning Framework for Language-Guided Object Grounding and Robot Grasping |
| ICRA 2022 | Learning to Pick by Digging: Data-Driven Dig-Grasping for Bin Picking from Clutter |
| ICRA 2026 | Diffusion Knows Transparency: Repurposing Video Diffusion for Transparent Object Depth and Normal Estimation |
| ICRA 2026 | GarmentPile++: Affordance-Driven Cluttered Garments Retrieval with Vision-Language Reasoning |
| ICRA 2026 | AdaptPNP: Integrating Prehensile and Non-Prehensile Skills for Adaptive Robotic Manipulation |


2026-10-15 本地全文库更新：根目录 `library.js` 将下载状态接入两个网页入口。标题优先打开通过 PDF 标题和完整性核验的本地文件，同时保留在线论文和在线 PDF。`Start_Grasp_Atlas.cmd` 提供仅绑定本机的下载界面；`Download_All_Papers.cmd` 可直接下载和重试。新增标题一致性、路径、断点续传与 403 隔离测试；两个 file:// 入口和本机 HTTP 入口均通过 Edge 实际浏览器检查。

原有 11 条缺失链接中，10 条补为论文 DOI，1 条找到官方会议摘要但尚无公开全文（State-Space Time Surfaces...）。其中 Trajectory Optimization... 与 Online Trajectory Replanner... 对应同一 DOI，保留历史条目顺序。修复证据在 `curation/fulltext-link-repairs.json`；实际全文覆盖和失败原因见根目录 `GraspAtlas_Library/download_index.csv` 与 `not_downloaded.csv`，不能将候选链接数视为下载数。重建离线入口：`python editable-site/build_offline.py`。
