(function(root){
 'use strict';
 const entries=[
 ['永久删除','Delete permanently'],['永久删除论文','Permanently delete paper'],['取消','Cancel'],['正在永久删除…','Deleting permanently…'],
 ['永久删除论文：','Permanently delete paper: '],
 ['“永久删除”会清除该论文的目录、摘要、链接、本地 PDF、下载记录与历史筛选记录，无法恢复。请通过 Start_Grasp_Atlas.cmd 启动本机网页后使用。','Permanent deletion removes the paper metadata, abstract, links, local PDFs, download records and historical screening entries. It cannot be undone. Open the local app with Start_Grasp_Atlas.cmd to use it.'],
 ['将清除这篇论文的目录、摘要、链接、本地 PDF、下载记录与历史筛选记录。此操作无法撤销，也不能通过“恢复全部”找回。','This removes the paper metadata, abstract, links, local PDFs, download records and historical screening entries. This cannot be undone, including with Restore all.'],
 ['永久删除需要本机文件访问。请通过 Start_Grasp_Atlas.cmd 打开网站，再执行此操作。','Permanent deletion requires local file access. Open the app with Start_Grasp_Atlas.cmd, then try again.'],
 ['论文及相关本地信息已永久删除','The paper and its related local information were permanently deleted'],
 ['下载任务正在运行，请等下载结束后再永久删除。','A download is running. Wait for it to finish before deleting permanently.'],
 ['这篇论文已不在项目中，请刷新页面。','This paper is no longer in the project. Refresh the page.'],
 ['本地文件路径异常，永久删除已停止。','An invalid local file path stopped permanent deletion.'],
 ['本地记录无法读取，永久删除已停止。','A local record could not be read. Permanent deletion stopped.'],
 ['永久删除失败，请关闭占用的文件后重试。','Permanent deletion failed. Close any files that are in use and try again.'],
 ["本轮软体抓取排除匹配 40 篇，其中新移入回收站 28 篇。包括软体夹爪、软手和软体机器人，以及软物体、线缆、软食品与柔性片材抓取；仍可逐篇恢复。", "This soft-grasping exclusion matches 40 papers, including 28 newly moved to the recycle bin. It covers soft grippers, hands and robots, plus grasping of soft objects, cables, soft foods and flexible sheets. Individual restoration remains available."],
 ["保留原先 159 篇的回收站记录，并按软体抓取新规则再移入 28 篇；默认清单为 523 篇，回收站为 187 篇。新规则以独立批次应用，保留其他论文的恢复选择。恢复或删除后，搜索、统计和导出会随之更新。", "preserves the original 159-paper recycle bin and adds 28 papers under the new soft-grasping rule. The default collection has 523 papers and the recycle bin has 187. The new rule is applied as a separate batch, preserving restoration choices for other papers. Search, statistics and exports follow your restore and delete choices."],
 ["排除软体夹爪、软手指、软体手与软体机器人抓取，以及专门针对软物体或可变形物体的抓取研究，包括柔性线缆、绳索、软食品、织物与复合片材。通用顺应控制、数学软约束或通用软指接触假设不单独触发此规则；专门研究可变形夹爪面积接触的论文也排除。", "Exclude grasping with soft grippers, fingers, hands and robots, and research specifically addressing soft or deformable objects, including flexible cables, ropes, soft foods, textiles and composite sheets. General compliance control, mathematical soft constraints or generic soft-finger contact assumptions alone do not trigger this rule. Research specifically addressing deformable-jaw area contacts is also excluded."],
 ['此前移除的 159 篇已放入回收站，可按标题或摘要搜索并逐篇恢复。','The 159 previously removed papers are in the recycle bin. Search their titles or abstracts and restore them individually.'],
 ['将原先移除的 159 篇放入回收站，由你逐篇选择恢复，其中包含此前已恢复的 23 篇。默认清单为 551 篇；恢复或删除后，搜索、统计和导出会随之更新。其他历史排除记录保持原状态。','places the original 159 removed papers in the recycle bin for individual restoration, including 23 restored in the previous revision. The default collection contains 551 papers; search, statistics and exports follow your restore and delete choices. Other historical exclusions retain their previous status.'],
 ['以抓取为主线，包含直接支持抓取的场景重建与形状补全研究。','Grasping research, including scene reconstruction and shape completion that directly support grasping.'],
 ['更新收录范围：以机器人抓取为主线，同时收录直接支持抓取的场景/物体重建、形状补全、深度恢复及 NeRF / 3DGS 方法，本次恢复 27 篇。通用策略、纯位姿估计或纯分割研究仍按原规则筛选。手内操作、全身抓取、衣物/布料抓取等排除规则继续有效。','updates the scope around robot grasping, including scene/object reconstruction, shape completion, depth recovery and NeRF / 3DGS methods that directly support grasping. This revision restores 27 papers. General policies, pose-only estimation and segmentation-only research retain the previous screening rules. Existing exclusions for in-hand manipulation, whole-body grasping and garment/cloth grasping remain in force.'],
 ['论文页面','Paper page'],
 ['逐一复核 2020–2026 年的全部 10 个会议与 3 个期刊，补入 50 条已确认遗漏。继续排除手内操作、全身抓取及衣物/布料抓取；未决候选保留在审查记录中，不计入收录数量。每条记录均保留可追溯的论文或项目来源。','rechecks all 10 conferences and 3 journals for 2020–2026 and adds 50 confirmed omissions. In-hand manipulation, whole-body grasping and garment/cloth grasping remain excluded. Unresolved candidates stay in the review log and are not included in collection counts. Every record retains traceable paper or project sources.'],
 ['未核实公开仓库','Public implementation not verified'],
 ['排除全身抓取与衣物抓取，并继续排除手内操作；同步核对 RA-L、T-ASE、T-RO 在 2026-10-01 至 2026-11-12 的新增期刊登记与 10/11 月卷期。其他来源保留此前快照。每条记录均保留可追溯的论文或项目来源。','excludes whole-body and garment grasping while retaining the in-hand exclusion; it also reviews new RA-L, T-ASE and T-RO journal registrations from 2026-10-01 to 2026-11-12 and October/November issues. Other sources retain their previous snapshots. Every entry retains traceable sources.'],
 ['已核实清单 · 2026-11-12','Verified collection · 2026-11-12'],
 ['离线版 · 数据截至 2026-11-12','Offline edition · Updated 2026-11-12'],
 ['收录主会与期刊论文，排除全身抓取、衣物抓取、手内操作与触觉输入。','Main-conference and journal papers; excluding whole-body grasping, garment grasping, in-hand manipulation and tactile inputs.'],
 ['排除范围','Excluded research'],
 ['排除全身抓取（whole-body grasping），包括足式机器人全身协同抓取与软体机器人全身包覆抓取。','Exclude whole-body grasping, including legged whole-body grasp coordination and whole-body soft robotic grasping.'],
 ['排除衣物与织物抓取（garment/cloth grasping），包括衣物整理、抓取点检测、织物分拣和穿衣辅助。','Exclude garment and cloth grasping, including garment handling, grasp-point detection, textile sorting and dressing assistance.'],
 ['排除全身抓取与衣物抓取，并继续排除手内操作。CoRL 2026 更新保留，其余会议与期刊的基础快照为 2026-10-05；范围调整不代表重新检索全部论文。每条记录均保留可追溯的论文或项目来源。','excludes whole-body and garment grasping, while continuing to exclude in-hand manipulation. The CoRL 2026 update is retained; other conferences and journals use the 2026-10-05 baseline. This scope change is not a new exhaustive literature search. Every entry retains traceable paper or project sources.'],
 ['收录主会与期刊论文，排除手内操作与触觉输入。','Main-conference and journal papers; excluding in-hand manipulation and tactile inputs.'],
 ['排除手内操作、触觉与硬件设计','Exclude in-hand manipulation, tactile input and hardware design'],
 ['排除手内操作（in-hand manipulation），包括手内重定向、物体在手中移动、转笔与关节物体手内操作。','Exclude in-hand manipulation, including in-hand reorientation, relative object motion within the hand, pen spinning and articulated in-hand manipulation.'],
 ['排除手内操作相关研究，并保留 CoRL 2026 更新；其他会议与期刊的基础快照为 2026-10-05，不保证穷尽全部论文。','excludes in-hand manipulation research and retains the CoRL 2026 update; other conferences and journals use the 2026-10-05 baseline snapshot. Coverage is not exhaustive.'],
 ['灵巧手抓取 · 生成与优化','Dexterous grasping · generation and optimization'],
 ['6-DoF 抓取持续学习','Continual learning for 6-DoF grasping'],
 ['杂乱场景抓取规划','Grasp planning in clutter'],
 ['多物体灵巧抓取','Multi-object dexterous grasping'],
 ['动态抓取与轨迹预测','Dynamic grasping and trajectory prediction'],
 ['跨手型抓取生成','Cross-hand grasp generation'],
 ['视觉语言灵巧抓取','Vision-language dexterous grasping'],
 ['主动感知与遮挡抓取','Active perception and occlusion-aware grasping'],
 ['语言引导跨手型抓取','Language-guided cross-hand grasping'],
 ['灵巧抓取数据采集','Dexterous grasp data collection'],
 ['灵巧手抓取与关节物体操作','Dexterous grasping and articulated-object manipulation'],
 ['约束优化抓取','Constraint-guided grasp optimization'],
 ['抓取数据生成','Grasp data generation'],
 ['已核实清单 · 2026-11-06','Verified collection · 2026-11-06'],
 ['离线版 · 数据截至 2026-11-06','Offline edition · Updated 2026-11-06'],
 ['本轮于','This update on'],['更新 CoRL 2026；其他会议与期刊仍为 2026-10-05 的文献快照，不保证穷尽全部论文。','refreshes CoRL 2026; other conferences and journals retain the 2026-10-05 snapshot. Coverage is not exhaustive.'],
 ['最新补充','Latest additions'],
 ['本地全文为作者页面明确关联的早期预印本；题名和作者列表与正式出版版本不同。','The local PDF is an earlier preprint explicitly linked by the author. Its title and author list differ from the published journal version.'],
 ['作者仓库将本条正式论文对应到预印本 End-to-End Dexterous Grasp Learning from Single-View Point Clouds via a Multi-Object Scene Dataset（arXiv:2603.15410）。本地 PDF 使用该作者预印本版本。来源：https://github.com/4taotao8/DGS-Net','The author repository maps this published paper to the preprint End-to-End Dexterous Grasp Learning from Single-View Point Clouds via a Multi-Object Scene Dataset (arXiv:2603.15410). The local PDF is this author preprint. Source: https://github.com/4taotao8/DGS-Net'],
 ['作者公开仓库；2026-10-15 核对','Public author repository; verified 2026-10-15'],
 ['搜索、摘要、统计与回收站可离线使用；已下载的论文可直接打开本地 PDF。','Search, abstracts, statistics and the recycle bin work offline. Downloaded papers open as local PDFs.'],
 ['官方会议摘要','Official conference abstract'],['论文 / 出版页面','Paper / publisher'],['已通过出版元数据按完整标题核实独立论文 DOI。','Individual DOI verified against the full title in publication metadata.'],['会议目录使用 Trajectory Optimization 标题；按作者名单、ICRA 2025 出版元数据及作者主页对应到 Online Trajectory Replanner 版本。','The programme title is Trajectory Optimization; matched to Online Trajectory Replanner using the authors, ICRA 2025 publisher metadata and the author publication page.'],['已定位官方会议日程中的该篇摘要；目前未找到独立出版页或公开全文。','Located this paper in the official conference programme; no individual publisher page or public full text was found.'],
 ['论文全文库','Full-text library'],['下载 / 重试全部','Download / retry all'],['正在下载…','Downloading…'],['刷新全文状态','Refresh library'],['打开本地 PDF','Open local PDF'],['在线论文','Online paper'],['在线 PDF','Online PDF'],['本地 PDF','Local PDF'],['全文下载状态','Download status'],['全文尚未下载','Full text not downloaded'],['暂未取得公开全文','Public full text unavailable'],['候选 PDF 待核验','Candidate PDF awaiting verification'],['本地文件缺失，请重新下载','Local file missing; download again'],['按标题检索','Search by title'],['双击 Start_Grasp_Atlas.cmd 可在网页中下载或重试全部论文。下载后刷新即可打开本地 PDF。','Open Start_Grasp_Atlas.cmd to download or retry all papers from the browser. Refresh after downloading to open local PDFs.'],['下载进行中，全文状态自动更新。','Download in progress. The library updates automatically.'],['点击下载或重试，可继续下载尚未完成的论文。','Download or retry to continue retrieving unfinished papers.'],['全文索引加载失败，请检查 library.js 是否与网站一起保留。','Could not load the library index. Keep library.js with the website.'],['下载器启动失败，请使用 Start_Grasp_Atlas.cmd 重新打开。','Could not start the downloader. Reopen using Start_Grasp_Atlas.cmd.'],
 ['机器人抓取论文浏览器','Robotic Grasping Paper Explorer'],
 ['探索 2020 年以来十大学术会议的非触觉机器人抓取论文，包含作者代码库、仿真引擎、数据集与核对来源；支持搜索、筛选、统计和导出。','Explore non-tactile robotic grasping papers from ten conferences since 2020, with code, simulators, datasets and sources. Search, filter, inspect statistics and export.'],
 ['跳到主要内容','Skip to main content'],['Grasp Atlas，重置筛选回到论文浏览','Grasp Atlas, reset filters and return to papers'],['导出当前清单','Export current list'],['导航和筛选','Navigation and filters'],['页面导航','Page navigation'],['界面语言','Interface language'],
 ['论文浏览','Browse papers'],['统计概览','Statistics'],['筛选说明','Collection scope'],['筛选论文','Filter papers'],['筛选条件','Filters'],['重置所有筛选','Reset all filters'],['重置','Reset'],['相关程度','Relevance'],['全部收录','All papers'],['直接相关','Directly relevant'],['扩展相关','Related work'],['会议年份','Conference year'],['全选','Select all'],['会议','Conference'],['研究方向','Research topics'],['全部方向','All topics'],['已核实清单','Verified collection'],['仅收录主会论文，排除触觉输入。','Main-conference collection; tactile inputs excluded.'],
 ['探索机器人抓取研究','Explore robotic grasping'],['十大学术会议，五年研究。找到下一篇值得阅读的论文。','Ten conferences, five years of research. Find your next paper.'],['清单概览','Collection overview'],['当前论文','Current papers'],['学术会议','Conferences'],['非触觉 · 主会论文','Non-tactile · Main conference'],['搜索标题、代码库、仿真引擎或数据集…','Search titles, repositories, simulators or datasets…'],['试试','Try'],['当前筛选条件','Active filters'],['论文清单','Paper collection'],['排序','Sort'],['年份 · 最新优先','Year · Newest first'],['年份 · 最早优先','Year · Oldest first'],['标题 · A–Z','Title · A–Z'],['会议 · A–Z','Conference · A–Z'],
 ['当前筛选的研究分布','Research distribution for current filters'],['统计与搜索、筛选条件实时联动。点击图表可查看论文。','Statistics follow your search and filters. Click the conference, year or topic charts to view papers.'],['会议分布','Conference distribution'],['年度收录','Papers by year'],['2026 年部分论文仅公布录用，年度数据尚未齐全。','Some 2026 entries are acceptance announcements; annual coverage remains incomplete.'],['前 10 关键词排行','Top 10 keywords'],['出现篇数','Papers containing the keyword'],['当前筛选论文的标题关键词排行','Title keyword ranking for the filtered papers'],['按英文标题统计，合并常见词形并过滤停用词；同一关键词每篇最多计一次。排行随筛选和删除同步更新。','Extracted from English titles, with common word forms merged and stopwords removed. Each keyword counts once per paper. Rankings follow filters and deletions.'],['当前筛选没有可统计的标题关键词。','No title keywords are available for these filters.'],['会议 × 年份','Conference × Year'],['从全局分布进入具体研究','Explore the collection by conference and year'],['热力图显示方式','Heatmap mode'],['论文篇数','Paper count'],['会议内占比','Share within conference'],['年份内占比','Share within year'],['会议与年份的论文分布','Paper distribution by conference and year'],['0 表示本清单无收录，不代表会议没有相关研究。','Zero means no entry in this collection, not that the conference has no relevant papers.'],['可多标签','Multiple labels allowed'],['根据清单中的研究方向字段归类；同一篇论文可计入多个方向，因此方向篇数之和可能超过论文总数。','Topics come from the research-category field. A paper may have multiple topics, so topic counts can exceed the number of papers.'],['少','Low'],['多','High'],['篇数','Paper count'],
 ['看见研究的分布','Explore research trends'],['从会议、年份与研究方向，探索这份抓取论文清单。','Explore grasping papers by conference, year and topic.'],['一份可追溯的文献清单','A traceable paper collection'],['了解收录范围、信息边界与每一条筛选记录。','Review scope, information limits and screening decisions.'],
 ['这份清单如何筛选？','How is this collection curated?'],['这是截至','This is a snapshot as of'],['的已核实文献快照，不是实时数据库，也不保证穷尽全部论文。每条记录均保留可追溯的论文或项目来源。','of verified records. It is not a live database or an exhaustive bibliography. Each entry retains a paper or project source.'],['会议与时间','Conferences and dates'],['；会议年份为 2020 年及以后。年份按会议届次记录，不按论文集出版时间。','; conference years are 2020 onward. Years refer to the conference edition, not the publication date.'],['机器人抓取','Robotic grasping'],['包含抓取检测、位姿生成、灵巧手抓取、任务导向抓取、主动感知、抓取规划、控制策略及数据集等。按标题排除 underwater、surgical、deformable、bimanual、suction、vacuum 六个关键词。扩展相关条目单独标记，主要涵盖抓取迁移、可供性或包含抓取子任务的操作研究。','Includes grasp detection, pose generation, dexterous and task-oriented grasping, active perception, planning, control and datasets. Titles containing underwater, surgical, deformable, bimanual, suction or vacuum are excluded. Related work is labeled separately.'],['排除触觉与硬件设计','Tactile inputs and hardware design excluded'],['排除以触觉、接触或力传感器反馈作为策略输入的研究。几何接触点预测、解析力闭合模型或训练奖励本身，不等同于触觉输入；具体边界见条目说明。排除以夹爪、机械手、执行器、传感器或辅助装置的硬件设计与验证为主要贡献的论文；硬件与算法协同设计的条目也排除。','Excludes policies using tactile, contact or force-sensor feedback. Geometric contact prediction, analytic force closure and training rewards alone do not imply tactile input. Hardware design and validation, including hardware–algorithm co-design, are excluded.'],['主会与录用状态','Conference scope and acceptance status'],['排除 workshop、仅预印本和期刊论文的会议展示。已核实录用、但论文集尚未出版的记录会明确标注；信息不足的候选条目放入待核对列表，不计入收录总数。','Workshops, preprint-only work and journal presentations are outside the main-conference scope. Acceptance announcements are labeled; candidates with insufficient evidence are kept for review and excluded from the collection total.'],
 ['删除的论文','Deleted papers'],['删除记录仅保存在当前浏览器。删除的文章不参与统计和导出，可随时恢复。','Deletion records are saved in this browser only. Deleted papers are excluded from statistics and export and can be restored.'],['查看删除记录','View deletion records'],['恢复全部','Restore all'],['还没有删除文章。','No papers have been deleted.'],['代码、仿真与数据','Code, simulation and data'],['核对日期','Checked on'],['代码链接优先使用作者公开仓库；“Coming Soon”按作者页面记录。“未找到已核实的公开仓库”不代表代码一定未公开。仿真字段保留已确认的引擎或实验平台，未核实项明确标注。','Code links prioritize author repositories. Coming Soon follows the author page; an unverified repository does not mean code is unavailable. Confirmed engines or experimental platforms are listed; unknown fields are labeled.'],['数据字段包含训练和评估数据、物体模型、示范及任务基准。“作者自建 / 作者合成”是描述性标签，并非正式数据集名称。资源名称不等于提供完整下载；公开范围、版本差异及复现限制见每篇的“详情与来源”。','Data fields include training and evaluation data, object models, demonstrations and task benchmarks. Author-built or synthetic data are descriptive labels, not formal dataset names. A listed resource may not be fully downloadable; see each paper’s details for scope and version differences.'],['筛选记录','Screening records'],['保留待核对及排除原因，方便复查收录边界。','Pending and exclusion reasons are retained for reviewing the collection scope.'],['筛选记录类型','Screening record type'],['全部记录','All records'],['待核对','Pending review'],['已排除','Excluded'],['排除','Excluded'],['已核实文献快照','Verified bibliography snapshot'],['设计参考：','Design reference: '],['请启用 JavaScript 以搜索和筛选论文。','Enable JavaScript to search and filter papers.'],
 ['未选择会议','No conference selected'],['未选择年份','No year selected'],['搜索：','Search: '],['移除筛选：','Remove filter: '],['不含触觉输入','Tactile inputs excluded'],['已录用 · 论文集待出版','Accepted · Proceedings pending'],['主会论文','Main-conference paper'],['纳入程度：','Relevance: '],['按会议范围、机器人抓取主题及非触觉输入条件纳入。','Included by conference scope, robotic grasping relevance and non-tactile inputs.'],['发表状态：','Publication status: '],['发表状态','Publication status'],['论文链接：','Paper link: '],['原收录来源','Original inclusion source'],['会议录用来源','Conference source'],['资源核对来源：','Resource verification: '],['资源说明：','Resource notes: '],['详情与来源','Details and sources'],['收起详情','Hide details'],['论文 / 项目','Paper / Project'],['论文（IEEE / DOI）','Paper (IEEE / DOI)'],['论文（IEEE）','Paper (IEEE)'],['论文（arXiv）','Paper (arXiv)'],['论文链接待核实','Paper link unverified'],['尚未核实该文章的独立论文页面','An individual page for this paper has not been verified'],['删除文章：','Delete paper: '],['从当前浏览器清单删除这篇文章','Delete this paper from the current browser collection'],['删除','Delete'],['恢复文章：','Restore paper: '],['恢复','Restore'],['代码库','Code repository'],['仿真引擎','Simulator'],['数据集','Dataset'],['代码','Code'],['仿真','Simulation'],['数据','Data'],['资源说明','Resource notes'],['资源来源','Resource sources'],['资源核对日期','Resource check date'],['纳入说明','Inclusion notes'],['论文或项目','Paper or project'],['论文链接说明','Paper link notes'],['年份','Year'],['标题','Title'],['来源 ','Source '],['显示 ','Showing '],['上一页','Previous page'],['下一页','Next page'],['没有匹配的论文','No matching papers'],['试试减少关键词，或扩大会议与年份范围。','Try fewer keywords or expand the conference and year filters.'],['撤销','Undo'],['查看与恢复','View and restore'],
 ['已删除文章；可在筛选说明中恢复','Paper deleted; restore it in Collection scope'],['已删除文章，但此浏览器无法保存记录，刷新后会恢复','Paper deleted, but this browser could not save the record; it will return after a refresh'],['文章已恢复，但此浏览器无法保存记录','Paper restored, but this browser could not save the record'],['文章已恢复','Paper restored'],['已撤销删除，但此浏览器无法保存记录','Deletion undone, but this browser could not save the record'],['已撤销删除','Deletion undone'],['已恢复全部文章，但此浏览器无法保存记录','All papers restored, but this browser could not save the record'],['已恢复全部文章','All papers restored'],['已导出 ','Exported '],['独立论文 DOI 链接，跳转到该篇论文的出版页面。','Individual article DOI, resolving to this paper’s publisher page.'],['出版元数据来源：','Publisher metadata: '],['主链接为作者公开的 arXiv 论文页；IEEE 单篇页面未核实。','Author-posted paper on arXiv; an individual IEEE page has not been verified.'],['作者公开论文页，题目为 ','Author-posted paper titled '],['尚未核实该标题的独立论文页面；会议目录仅保留为收录来源。','An individual page for this paper has not been verified; the conference directory is listed only as an inclusion source.'],['未核实独立论文链接','Individual paper link unverified'],['未找到已核实的公开仓库','No verified public repository found'],['未核实（已查来源未确认）','Unverified in checked sources'],['未核实公开代码库','Public repository unverified'],['未核实仿真引擎或实验平台','Simulator or experimental platform unverified'],['未核实数据集或任务基准','Dataset or task benchmark unverified'],['未核实仿真引擎','Simulator unverified'],['未核实数据集','Dataset unverified'],
 ['功能性灵巧抓取数据集','Functional dexterous grasp dataset'],['灵巧手 VLA','Dexterous-hand VLA'],['布料抓取','Cloth grasping'],['抓取检测','Grasp detection'],['任务导向抓取','Task-oriented grasping'],['部分点云与任务导向抓取','Partial point clouds and task-oriented grasping'],['可供性灵巧抓取','Affordance-aware dexterous grasping'],['移动抓取与全身控制','Mobile grasping and whole-body control'],['视觉语言与零样本物体操作','Vision-language and zero-shot object manipulation'],['手眼视觉与抓取','Hand-eye vision and grasping'],['少样本灵巧抓取与操作','Few-shot dexterous grasping and manipulation'],['跨手型灵巧抓取策略','Cross-hand dexterous grasp policies'],['通用灵巧抓取策略','General dexterous grasp policies'],['可微仿真与灵巧抓取','Differentiable simulation and dexterous grasping'],['单示范灵巧抓取','Single-demonstration dexterous grasping'],['抓取预训练与泛化','Grasp pretraining and generalization'],['灵巧抓取生成与控制','Dexterous grasp generation and control'],['主动感知与抓取检测','Active perception and grasp detection'],['语言引导灵巧抓取','Language-guided dexterous grasping'],['杂乱场景灵巧抓取','Dexterous grasping in clutter'],['接触图迁移与灵巧抓取','Contact-map transfer and dexterous grasping'],['抓取迁移','Grasp transfer'],['任务导向抓取与运动规划','Task-oriented grasping and motion planning'],['灵巧操作基准','Dexterous manipulation benchmark'],['扩散生成与规划','Diffusion generation and planning'],['人机交接抓取','Human-robot handover grasping'],['视觉抓取策略与数据增强','Visual grasp policies and data augmentation'],['动态目标抓取','Dynamic target grasping'],['灵巧抓取生成与策略','Dexterous grasp generation and policies'],['灵巧抓取生成','Dexterous grasp generation'],['抓取域泛化','Grasp domain generalization'],['物体感知与抓取数据','Object perception and grasp data'],['语言引导抓取检测','Language-guided grasp detection'],['通用灵巧抓取','General dexterous grasping'],['灵巧抓取策略蒸馏','Dexterous grasp policy distillation'],['零样本重建与抓取','Zero-shot reconstruction and grasping'],['多视角 6-DoF 抓取','Multi-view 6-DoF grasping'],['人手语义抓取与机器人迁移','Human semantic grasps and robot transfer'],['功能性灵巧抓取','Functional dexterous grasping'],['语言与接触意图推理','Language and contact-intent reasoning'],['低光照服装抓取','Low-light garment grasping'],['跨具身 6-DoF 抓取','Cross-embodiment 6-DoF grasping'],['视觉抓取策略','Visual grasp policies'],['部件感知灵巧抓取','Part-aware dexterous grasping'],['遮挡与阻碍推理抓取','Grasping with occlusion and obstruction reasoning'],['灵巧抓取策略与课程学习','Dexterous grasp policies and curriculum learning'],['开放词汇功能性抓取','Open-vocabulary functional grasping'],['动态交接抓取数据集','Dynamic handover grasp dataset'],['灵巧抓取视觉语言模型','Dexterous-grasp vision-language model'],['偏好对齐抓取生成','Preference-aligned grasp generation'],['语言与物理属性推理抓取','Grasping with language and physical-property reasoning'],['可供性与机器人操作','Affordances and robotic manipulation'],['可供性分割与抓取基准','Affordance segmentation and grasp benchmark'],['可微多指抓取优化','Differentiable multi-finger grasp optimization'],['类别内抓取迁移','Within-category grasp transfer'],['高效 6-DoF 抓取','Efficient 6-DoF grasping'],['语言引导 6-DoF 抓取','Language-guided 6-DoF grasping'],['跨手型动态灵巧抓取','Cross-hand dynamic dexterous grasping'],['部分点云与形状补全','Partial point clouds and shape completion'],['扩散灵巧抓取生成','Diffusion-based dexterous grasp generation'],['接触拓扑灵巧抓取生成','Contact-topology dexterous grasp generation'],['主动视角与抓取','Active viewpoints and grasping'],['杂乱场景抓取','Grasping in clutter'],['推动辅助抓取','Push-assisted grasping'],['移动操作与门把手抓取','Mobile manipulation and door-handle grasping'],['形状形变与抓取迁移','Shape deformation and grasp transfer'],['透明物体抓取','Transparent-object grasping'],['平面抓取数据标注','Planar grasp annotation'],['多样性与物理可行抓取','Diverse and physically feasible grasping'],['人手可供性与机器人灵巧抓取','Human-hand affordances and robotic dexterous grasping'],['灵巧抓取仿真到现实','Dexterous grasp sim-to-real transfer'],['遮挡抓取与外在灵巧性','Occluded grasping and extrinsic dexterity'],['跨手型隐式抓取表示','Cross-hand implicit grasp representation'],['复杂环境视觉抓取与技能迁移','Visual grasping in complex environments and skill transfer'],['主动感知抓取','Active-perception grasping'],['跨具身抓取生成','Cross-embodiment grasp generation'],['语言与任务导向抓取','Language and task-oriented grasping'],['语言指代抓取','Referring-language grasping'],['杂乱货架搜索与抓取','Cluttered-shelf search and grasping'],['物体中心抓取与放置','Object-centric grasping and placement'],['抓取旋转表示','Grasp rotation representation'],['自适应抓取与物体物性','Adaptive grasping and object physical properties'],['杂乱场景灵巧抓取数据集','Dexterous grasp dataset in clutter'],['视觉手臂与灵巧手抓取','Visual arm-hand dexterous grasping'],['等变流抓取生成','Equivariant-flow grasp generation'],['多指抓取质量评估','Multi-finger grasp-quality evaluation'],['3D 高斯与零样本抓取','3D Gaussians and zero-shot grasping'],['扩散抓取生成','Diffusion grasp generation'],['SE(3) 等变抓取','SE(3)-equivariant grasping'],['抓取仿真与现实差距','Grasp sim-to-real gap'],['多模态推理抓取','Multimodal reasoning for grasping'],['杂乱场景部件抓取','Part grasping in clutter'],['开放世界语言抓取','Open-world language-guided grasping'],['不确定性感知灵巧抓取','Uncertainty-aware dexterous grasping'],['可微力闭合抓取优化','Differentiable force-closure grasp optimization'],['抓取基础模型','Grasp foundation model'],['动态鲁棒灵巧抓取','Dynamic robust dexterous grasping'],['人形机器人灵巧操作','Humanoid dexterous manipulation'],['跨手型扩散抓取','Cross-hand diffusion grasping'],['抓取数据预训练与工具操作','Grasp-data pretraining and tool manipulation'],['人形机器人全身视觉抓取','Humanoid whole-body visual grasping'],['开放词汇任务导向灵巧抓取','Open-vocabulary task-oriented dexterous grasping'],
 ['灵巧手抓取','Dexterous grasping'],['语言与功能抓取','Language and functional grasping'],['数据与基准','Data and benchmarks'],['策略与控制','Policies and control'],['迁移与泛化','Transfer and generalization'],['物体形变抓取规划','Grasp planning for object deformation'],['生成与优化','Generation and optimization'],['视觉与重建','Vision and reconstruction'],['软体抓取策略学习','Soft-grasp policy learning'],['不确定性感知','Uncertainty awareness'],['云机器人实验平台','Cloud robotics testbed'],['视觉伺服抓取控制','Visual-servo grasp control'],['混合现实抓取控制','Mixed-reality grasp control'],['零样本视觉模仿学习','Zero-shot visual imitation learning'],['辅助抓取策略评估','Assistive grasp-policy evaluation'],['6-DoF / 位姿','6-DoF / Pose'],['语言与任务','Language and tasks'],['感知与场景','Perception and scenes'],['位姿','Pose'],
 ['RobMRAG；学习物体接触位姿及操作任务','RobMRAG; learns object contact poses and manipulation tasks'],['包含抓取与操作实验，不是专门的抓取算法','Includes grasping and manipulation experiments; broader than a dedicated grasp algorithm'],['会议录用名单已核实；预印本摘要不含触觉方法','Conference acceptance verified; the preprint abstract does not describe tactile methods'],['涉及关节物体的抓取与操作','Grasping and manipulation of articulated objects'],['SceneDiffuser；包含机器人灵巧抓取任务','SceneDiffuser; includes robotic dexterous grasp tasks'],['包含抓取标注','Includes grasp annotations'],['人手语义抓取生成；补充实验含 Shadow Hand 真实抓取，列为边界相关','Human semantic grasp generation; supplementary real Shadow Hand grasps support its inclusion as related work'],['人类第一视角视频学习；包含机器人任务导向抓取','Learning from human egocentric videos; includes robotic task-oriented grasping'],['不使用触觉传感器输入','No tactile-sensor input'],['会议官方录用名单已核实，见来源链接','Official acceptance verified; see the source'],['距离感知的两阶段 NBV；出版日期 2026-09-10','Distance-aware two-stage NBV; published 2026-09-10'],['主任务为开门；属于抓取相关的移动操作，不是专门的抓取检测','Primarily door opening; grasp-related mobile manipulation'],['GODeform；抓取迁移为下游应用','GODeform; grasp transfer is a downstream application'],['会议年份 2022；PMLR 出版年份 2023','Conference year 2022; PMLR publication year 2023'],['抓取到达与运动规划；会议年份 2022','Grasp reaching and motion planning; conference year 2022'],['会议年份 2024；PMLR 出版年份 2025','Conference year 2024; PMLR publication year 2025'],['电流限矩与夹爪柔顺反馈，无独立触觉传感器；会议年份 2024','Current-based torque limits and gripper compliance feedback without a separate tactile sensor; conference year 2024'],['包含 grasp-and-reach、箱体提举和双手交接','Includes grasp-and-reach, box lifting and two-hand handovers'],['作者项目页标注 CoRL 2026','Author project page states CoRL 2026'],['作者实验室标注 CoRL 2026','Author lab lists CoRL 2026'],['作者项目页确认 CoRL 2026 录用','Author project page confirms CoRL 2026 acceptance'],['以机器人抓取、抓取相关感知、策略或末端夹爪为研究对象；按会议年份收录。','Studies robotic grasping, grasp-related perception, policies or end effectors; recorded by conference year.'],['扩展相关：主要贡献涉及抓取关联的感知、操作、示教或运动规划。','Related work on grasp-linked perception, manipulation, demonstration or motion planning.'],['根据 RSS 官方年度论文集收录；研究机器人抓取或抓取关联任务。','Included from the official RSS proceedings; studies robotic grasping or related tasks.'],['扩展相关：研究视觉遥操作、灵巧操作或包含抓取环节的任务。','Related work on visual teleoperation, dexterous manipulation or tasks involving grasping.'],
 ['作者真实抓取示范数据（含 51 条公开样例）','Author real grasp demonstrations (51 public samples)'],['作者自建布料场景数据（1,080 张 RGB 图像）','Author cloth-scene dataset (1,080 RGB images)'],['GRIM 特征记忆数据','GRIM feature-memory data'],['作者动态抓取评测基准','Author dynamic grasp benchmark'],['作者少视角 RGB-D 场景与单示范','Author sparse-view RGB-D scenes and single demonstration'],['作者 RGB-D 场景扫描与抓取示范','Author RGB-D scene scans and grasp demonstrations'],['LEGO 随机玩具抓取数据','Random LEGO toy grasp data'],['ManiSkill3（八项操作任务）','ManiSkill3 (eight manipulation tasks)'],['作者专家轨迹（仿真 100 条 / 真机 300 条）','Author expert trajectories (100 simulated / 300 real)'],['仿真平台按论文明确给出的 ManiSkill3 记录；底层物理引擎版本未注明。','ManiSkill3 is explicitly named in the paper; the underlying physics-engine version is unspecified.'],['MultiDex（抓取任务，MultiDex_UR）','MultiDex (grasp task, MultiDex_UR)'],['ShapeNet（1,500 个物体，2,500 条抓取示范）','ShapeNet (1,500 objects, 2,500 grasp demonstrations)'],['作者真机专家示范','Author real-robot expert demonstrations'],['Dexonomy（抓取风格先验）','Dexonomy (grasp-style prior)'],['GraspGen-X 合成抓取数据（32 种夹爪）','GraspGen-X synthetic grasps (32 grippers)'],['作者合成示范','Author synthetic demonstrations'],['作者项目页标注 Coming Soon','Author project page states Coming Soon'],['MaskDexGrasp 自建任务抓取数据（65K 实例）','MaskDexGrasp author task-grasp data (65K instances)'],['作者标注 Coming Soon','Authors state Coming Soon'],['AffordDexGrasp 开放集桌面场景','AffordDexGrasp open-set tabletop scenes'],['作者 flexible instruction 标注','Author flexible-instruction annotations'],['仓库仿真分支基于 ManipLLM，README 给出 PartNet-Mobility 数据生成与 SAPIEN 评估入口。','The simulation branch builds on ManipLLM; its README links PartNet-Mobility generation and SAPIEN evaluation.'],['A² simulation 任务基准','A² simulation task benchmark'],['仓库提供数据适配接口；部分完整数据与组件仍需作者或原数据源提供。','The repository provides data adapters; some full datasets and components must come from the authors or original sources.'],['作者仿真与真实移动操作示范数据','Author simulated and real mobile-manipulation demonstrations'],['BlenderProc 用于渲染；抓取实验另需查看论文的机器人设置。','BlenderProc is used for rendering; see the paper’s robot setup for grasp experiments.'],['作者 NeRF-rendered grasp 数据','Author NeRF-rendered grasp data'],['公开项目说明使用 Blender 生成渲染数据；渲染器与物理仿真引擎分开记录。','The project uses Blender for rendered data; rendering and physics simulation are recorded separately.'],['作者 Allegro 物理可行抓取合成数据','Author physically feasible synthetic Allegro grasps'],['ISAGrasp 合成增强数据','ISAGrasp synthetic augmentation data'],['作者程序化物体与初始场景','Author procedural objects and initial scenes'],['作者 primitive / building-block 合成杂乱场景','Author synthetic primitive / building-block clutter scenes'],['作者程序化杂乱场景技能试验数据','Author skill trials in procedural clutter scenes'],['作者合成的多视角抓取训练数据（前视 / 侧视 / 多视角）','Author synthetic grasp training data (front / side / multiple views)'],['作者采集的手部动作捕捉数据（eigengrasp）','Author hand motion-capture data (eigengrasp)'],['CLIPort（可供性匹配评估）','CLIPort (affordance matching evaluation)'],['作者真实场景 LERF 观测','Author real-scene LERF observations'],['作者杂乱货架仿真场景','Author simulated cluttered shelves'],['作者合成 pick-and-place 数据','Author synthetic pick-and-place data'],['作者 README 明确说明完整训练集因版权限制未发布，提供示例仿真场景和训练脚本。','The README states that the full training set is withheld for copyright reasons; sample scenes and training scripts are provided.'],['作者真实机器人抓取试验','Author real-robot grasp trials'],['作者 retargeted grasp motions','Author retargeted grasp motions'],['作者真实多视角场景数据','Author real multi-view scenes'],['GIGA（Pile / Packed 合成抓取数据）','GIGA (synthetic Pile / Packed grasps)'],['作者真实点云场景与单示范','Author real point-cloud scenes and single demonstration'],['作者 pile / packed 场景抓取数据','Author pile / packed scene grasps'],['作者 clutter 教师轨迹','Author teacher trajectories in clutter'],['FFHNet 抓取数据','FFHNet grasp data'],['GraspQP（基于 DexGraspNet 的 5,700 个物体；五种夹爪）','GraspQP (5,700 DexGraspNet-based objects; five grippers)'],['DexGraspNet 物体模型','DexGraspNet object models'],['论文版本使用 Isaac Sim 4.5 / Isaac Lab 2.x；当前仓库升级为 Isaac Sim 5.1 / Isaac Lab 2.3，复现论文应使用 graspqp tag。','The paper uses Isaac Sim 4.5 / Isaac Lab 2.x; the current repository uses Isaac Sim 5.1 / Isaac Lab 2.3. Use the graspqp tag to reproduce the paper.'],['作者双手 humanoid 抓取与操作任务','Author two-hand humanoid grasping and manipulation tasks'],['作者 IK reaching motions','Author IK reaching motions'],['资源字段以列出的作者论文、项目页及当前公开仓库为准；未知项未作推断。','Resources follow the listed author papers, project pages and current repositories; unknown fields are not inferred.'],['作者合成类别级任务抓取场景','Author synthetic category-level task-grasp scenes'],['作者公开手部抓取与杂乱场景数据','Author public hand-grasp and clutter-scene data'],['FFHNet 合成多指抓取数据','FFHNet synthetic multi-finger grasps'],['Blender（渲染）','Blender (rendering)'],['作者合成多视角 RGB 抓取数据','Author synthetic multi-view RGB grasp data'],['ImageNet（随机纹理素材）','ImageNet (random texture assets)'],['作者公开 3.4M 抓取数据','Author public 3.4M grasp dataset'],['作者公开单物体与多物体合成抓取数据','Author public single- and multi-object synthetic grasps'],['ContactDB（物体模型）','ContactDB (object models)'],['作者真实机器人 bin picking 实验（透明、不规则物体）','Author real-robot bin-picking experiments (transparent and irregular objects)'],['作者公开仓库没有 README，仿真与数据仍待核实。','The author repository has no README; simulation and data remain unverified.'],['仓库入口出现重定向，资源详情仍待核实。','The repository link redirects; resource details remain unverified.'],['MuJoCo（DexGraspBench 验证）','MuJoCo (DexGraspBench validation)'],['cuRobo（优化与规划平台）','cuRobo (optimization and planning platform)'],['MetaGraspNet / YCB 物体子集','MetaGraspNet / YCB object subset'],['作者合成 1,600 场景','Author 1,600 synthetic scenes'],['CMapDataset（作者过滤版本）','CMapDataset (author-filtered version)'],['Transfer Cube / Bimanual Insertion（任务基准）','Transfer Cube / Bimanual Insertion (task benchmarks)'],['作者深度噪声数据与抓取实验','Author depth-noise data and grasp experiments'],['作者页面标注 Coming Soon；未核实公开实现','Author page states Coming Soon; a public implementation is unverified'],['作者公开 DextrAH 视觉纹理资产（增强素材）','Author public DextrAH visual textures (augmentation assets)'],['已列数据仅为公开样例或素材，不能视为完整训练数据。','Listed data are public samples or assets, not a complete training dataset.'],['DAGDiff / DG16M 双臂抓取数据','DAGDiff / DG16M dual-arm grasp data'],['作者公开 1,200+ 杂货店抓取尝试','Author public 1,200+ grocery-store grasp attempts'],['作者目标导向推抓协同任务（任务基准）','Author goal-oriented push-grasp synergy tasks (task benchmark)'],['作者合成 2M 抓取轨迹','Author 2M synthetic grasp trajectories'],['作者 XHand / Leap Hand 扩展抓取数据','Author extended XHand / Leap Hand grasp data'],['Isaac Sim（公开合成样例）','Isaac Sim (public synthetic samples)'],['作者公开 sample_seq5 合成序列（样例）','Author public sample_seq5 synthetic sequence (sample)'],['作者仓库标题与会议标题存在版本差异，以会议题名记录。','Repository and conference titles differ; the conference title is retained.'],['random_household_picking_clutter_full_obs_30（任务基准）','random_household_picking_clutter_full_obs_30 (task benchmark)'],['DexGraspNet 子集','DexGraspNet subset'],['VGN pile 物体集','VGN pile object set'],['作者长缆线打结与解缠实验（任务基准）','Author long-cable knotting and untangling experiments (task benchmark)'],['重抓取 / 抓取投掷 / 物体重定向（任务基准）','Regrasp / grasp-and-throw / object reorientation (task benchmarks)'],['作者项目页的 Code 链接指向该平台仓库。','The project’s Code link points to this platform repository.'],['SAPIEN（公开数据生成平台）','SAPIEN (public data-generation platform)'],['CordViP 实机示范：flipcap / flipcup','CordViP real-robot demonstrations: flipcap / flipcup'],['DexWild 人类与机器人示范','DexWild human and robot demonstrations'],['作者工业包裹拾取数据（394K 拾取记录）','Author industrial package-picking data (394K pick records)'],
 ['已出现在官方名单；未获得可检查的摘要/全文，触觉条件待核对','Listed officially; an inspectable abstract or full text is unavailable, and tactile inputs need checking'],['录用已核实；摘要为任务导向抓取生成，机器人手型与触觉条件待全文核对','Acceptance verified; task-oriented grasp generation, with robot hand and tactile inputs pending full-text review'],['使用视觉触觉融合','Uses visual-tactile fusion'],['策略输入包含接触和力信号；按本次无触觉口径排除','Policy inputs include contact and force signals; excluded by the non-tactile scope'],['使用视觉触觉表示','Uses visual-tactile representations'],['使用视觉触觉可供性','Uses visual-tactile affordances'],['触觉抓取策略','Tactile grasp policy'],['意图驱动的人手抓取生成；未核实机器人实验','Intent-driven human-hand grasp generation; robot experiments unverified'],['人体全身抓取动作合成','Human whole-body grasp-motion synthesis'],['实验为 OakInk 与 GRAB 人手数据；未核实机器人实验','Experiments use OakInk and GRAB human-hand data; robot experiments unverified'],['人手交互动作合成','Human-hand interaction synthesis'],['人体全身动作合成','Human whole-body motion synthesis'],['标题与实验明确针对人手','Title and experiments explicitly concern human hands'],['数字人体动作生成；未核实机器人抓取实验','Digital human-motion generation; robot grasp experiments unverified'],['作者项目页明确标注 CoRL 2025 Data Workshop','Author project page explicitly lists the CoRL 2025 Data Workshop'],['CVPR Workshop，不属于主会','CVPR Workshop, outside the main conference'],['正式发表为 RSS 2022','Published at RSS 2022'],['正式发表为 ICRA 2023','Published at ICRA 2023'],['PMLR 出版为 2022，会议实际为 CoRL 2021','PMLR published in 2022; the conference was CoRL 2021'],['触觉、接触力或相关反馈研究，超出非触觉抓取收录范围。','Tactile, contact-force or related feedback; outside the non-tactile grasp scope.'],['主要研究对象与机器人抓取论文收录范围不一致。','The primary research subject falls outside the robotic grasping scope.'],['期刊论文的会议展示，不计入主会论文。','Conference presentation of a journal article; excluded from main-conference papers.'],['尚未核实为该年度 ICRA 主会论文；会议日程中的展示记录不足以确认发表类型。','Not verified as a main-conference ICRA paper for that year; a program presentation alone does not establish publication type.'],['触觉或力反馈研究，超出非触觉抓取范围。','Tactile or force feedback, outside the non-tactile grasp scope.'],['主要研究接物稳定或通用操作，未作为直接机器人抓取论文计入。','Primarily catching stability or general manipulation; not included as direct robotic grasping work.'],['按用户要求排除机器人硬件设计类研究：夹爪、机械手、软体机构、执行器、传感器或辅助装置的设计、协同设计及硬件验证。','Excluded by the requested hardware-design scope: grippers, robot hands, soft mechanisms, actuators, sensors and assistive-device design, co-design or hardware validation.'],['按用户标题关键词排除：','Excluded by requested title keyword: '],
 ['排除：触觉','Excluded: tactile inputs'],['排除：接触/力输入','Excluded: contact/force inputs'],['排除：人手','Excluded: human hands'],['排除：工作坊','Excluded: workshop'],['排除：其他会议','Excluded: other conferences'],['篇论文','papers'],['直接','Directly relevant'],['相关','Related work'],['已公布录用，论文集待出版','Acceptance announced, proceedings pending'],['论文（作者 PDF）','Paper (author PDF)'],['作者实验室提供的该论文 PDF；论文题名与会议记录一致。','PDF provided by the author laboratory; the paper title matches the conference record.'],
 ['灵巧手抓取','Dexterous grasping'],['灵巧','Dexterous'],['抓取','Grasping'],['与',' and ']
 ];
 entries.push(...[
  [
    "探索 2020 年以来十大学术会议与 RA-L、T-ASE、T-RO 三本期刊的非触觉机器人抓取论文，包含代码库、仿真引擎、数据集与来源。",
    "Explore non-tactile robotic grasping papers from ten conferences and RA-L, T-ASE and T-RO since 2020, with repositories, simulators, datasets and sources."
  ],
  [
    "十大学术会议，三本机器人期刊。找到下一篇值得阅读的论文。",
    "Ten conferences and three robotics journals. Find your next paper."
  ],
  [
    "收录主会与期刊论文，排除触觉输入。",
    "Main-conference and journal papers; tactile inputs excluded."
  ],
  [
    "从会议、期刊、年份与研究方向，探索这份抓取论文清单。",
    "Explore grasping papers by conference, journal, year and topic."
  ],
  [
    "会议、期刊与时间",
    "Conferences, journals and dates"
  ],
  [
    "AAAI、ICLR、NeurIPS、CVPR、ICCV、ECCV、ICML、CoRL、ICRA、RSS，以及 RA-L、T-ASE、T-RO；收录年份为 2020 年及以后。会议按届次年份，期刊按正式卷期年份，未分配卷期的 Early Access 按在线发表年份记录。",
    "AAAI, ICLR, NeurIPS, CVPR, ICCV, ECCV, ICML, CoRL, ICRA and RSS, plus RA-L, T-ASE and T-RO, from 2020 onward. Conferences use edition years; journals use volume years, or verified online publication years when a volume is unassigned."
  ],
  [
    "会议收录主会论文，排除 workshop 和仅预印本。RA-L、T-ASE、T-RO 按出版商记录收录；同一 DOI 的期刊论文与会议展示合并，扩展版有不同 DOI 时分别保留。已录用、卷期预分配与卷期待核实条目分别标注。",
    "Conferences include main-conference papers, excluding workshops and preprint-only work. Journal records follow publisher metadata. A journal article and conference presentation sharing a DOI are merged; extensions with distinct DOIs remain separate. Acceptance announcements, advance issue assignments and unverified issue details are labeled."
  ],
  [
    "期刊检索以出版商元数据为基础。已结合作者摘要或项目说明核对的条目，与仅按标题初筛的条目分别标注；范围存疑的候选放入待核对列表，不计入收录总数。",
    "Journal searches start with publisher metadata. Scope checks using author abstracts or project descriptions are distinguished from title-only screening. Candidates with ambiguous scope remain under review and are excluded from the collection total."
  ],
  [
    "0 表示本清单无收录，不代表该会议或期刊没有相关研究。",
    "Zero means no entry in this collection, not that the conference or journal has no relevant papers."
  ],
  [
    "按发表来源、机器人抓取主题及非触觉输入条件纳入。",
    "Included by publication venue, robotic grasping topic and non-tactile inputs."
  ],
  [
    "发表信息依据出版商 DOI 元数据；研究范围依据标题初筛，尚未核对全文。",
    "Publication metadata verified from publisher DOI deposits; scope screened from the title. Full-text scope remains unchecked."
  ],
  [
    "发表信息依据出版商记录；研究范围已结合作者摘要或项目说明核对。",
    "Publication metadata verified from publisher records; scope checked against author abstracts or project descriptions."
  ],
  [
    "尚未确认非触觉输入及以算法为主的贡献；待核对全文，不计入收录总数。",
    "Non-tactile inputs and primarily algorithmic contributions remain unconfirmed. Full-text review is pending; excluded from the collection total."
  ],
  [
    "医疗手术应用，超出本清单的机器人抓取范围。",
    "Medical surgery application, outside this collection’s robotic grasping scope."
  ],
  [
    "当前代码库包含后续年度版本；2022 年论文所用的仿真引擎尚未核实。",
    "The current repository includes later yearly versions. The simulator used in the 2022 paper remains unverified."
  ],
  [
    "Cornell 与 Jacquard 由论文摘要确认；当前仓库还支持 GraspNet-1Billion。",
    "Cornell and Jacquard are confirmed by the paper abstract; the current repository also supports GraspNet-1Billion."
  ],
  [
    "公开仓库提供小型训练示范及模型；完整原始数据范围尚未核实。",
    "The public repository provides a small training demo and models; the full original dataset coverage remains unverified."
  ],
  [
    "作者仓库标注仍在完善，当前公开实现不完整。",
    "The author repository is marked as work in progress; the public implementation is incomplete."
  ],
  [
    "作者提供需申请许可的 AnyGrasp SDK；不等同于完整训练代码。",
    "The author-provided AnyGrasp SDK requires a license application; it is not the complete training code."
  ],
  [
    "作者合成抓取数据（约 300 个物体、150 万个抓取）",
    "Author synthetic grasp data (about 300 objects and 1.5 million grasps)"
  ],
  [
    "作者合成的不同刚度物体抓取数据",
    "Author synthetic grasps for objects with varying stiffness"
  ],
  [
    "GATER 任务抓取数据",
    "GATER task-grasp data"
  ],
  [
    "BIG-Net 作者公开样例数据（1,100 个抓取场景）",
    "BIG-Net author public sample data (1,100 grasp scenes)"
  ],
  [
    "FFD 作者水果检测数据",
    "FFD author fruit-detection data"
  ],
  [
    "作者执行器空间示范（30 条）",
    "Author actuation-space demonstrations (30 samples)"
  ],
  [
    "选择发表类型",
    "Select publication type"
  ],
  [
    "会议 / 期刊 × 年份",
    "Conference / Journal × Year"
  ],
  [
    "会议 / 期刊",
    "Conference / Journal"
  ],
  [
    "会议与期刊分布",
    "Conference and journal distribution"
  ],
  [
    "会议与期刊",
    "Conferences and journals"
  ],
  [
    "非触觉 · 会议与期刊",
    "Non-tactile · Conferences and journals"
  ],
  [
    "仅会议",
    "Conferences only"
  ],
  [
    "仅期刊",
    "Journals only"
  ],
  [
    "期刊",
    "Journal"
  ],
  [
    "全部",
    "All"
  ],
  [
    "发表年份",
    "Publication year"
  ],
  [
    "发表来源 · A–Z",
    "Venue · A–Z"
  ],
  [
    "发表来源",
    "Publication source"
  ],
  [
    "来源内占比",
    "Share within venue"
  ],
  [
    "未选择会议或期刊",
    "No conferences or journals selected"
  ],
  [
    "期刊信息",
    "Journal citation"
  ],
  [
    "会议展示来源",
    "Conference presentation source"
  ],
  [
    "会议展示",
    "Conference presentation"
  ],
  [
    "发表类型",
    "Publication type"
  ],
  [
    "发表状态与去重",
    "Publication status and deduplication"
  ],
  [
    "期刊论文（卷期待核实）",
    "Journal article (issue details unverified)"
  ],
  [
    "期刊论文（卷期预分配）",
    "Journal article (issue assigned in advance)"
  ],
  [
    "期刊论文",
    "Journal article"
  ],
  [
    "会议论文",
    "Conference paper"
  ],
  [
    "卷期预分配",
    "Advance issue assignment"
  ],
  [
    "IEEE 论文页",
    "IEEE paper page"
  ],
  [
    "范围初筛",
    "Preliminary scope"
  ],
  [
    "范围核对",
    "Scope verification"
  ],
  [
    "标题初筛",
    "Title screening"
  ],
  [
    "摘要 / 项目核对",
    "Abstract / project review"
  ],
  [
    "数据集与基准",
    "Datasets and benchmarks"
  ],
  [
    "抓取综述",
    "Grasping survey"
  ],
  [
    "语言与任务导向抓取",
    "Language and task-oriented grasping"
  ],
  [
    "抓取生成与优化",
    "Grasp generation and optimization"
  ],
  [
    "视觉抓取感知",
    "Visual grasp perception"
  ],
  [
    "抓取策略与控制",
    "Grasp policies and control"
  ],
  [
    "抓取规划与优化",
    "Grasp planning and optimization"
  ],
  [
    "抓取方法与评估",
    "Grasp methods and evaluation"
  ]
]);
 entries.push(...[
  [
    "搜索标题、摘要、代码库、仿真引擎或数据集…",
    "Search titles, abstracts, repositories, simulators or datasets…"
  ],
  [
    "在回收站搜索标题、摘要或资源…",
    "Search deleted titles, abstracts or resources…"
  ],
  [
    "回收站搜索不受论文清单筛选影响。",
    "Bin search is independent of the paper-list filters."
  ],
  [
    "恢复回收站中的全部文章，包括搜索未显示的文章",
    "Restore every deleted paper, including those hidden by bin search"
  ],
  [
    "查看删除的文章，并恢复到论文清单。",
    "Review deleted papers and restore them to the collection."
  ],
  [
    "回收站中没有匹配的文章。",
    "No deleted papers match your search."
  ],
  [
    "回收站是空的",
    "The bin is empty"
  ],
  [
    "从论文清单删除的文章会出现在这里。",
    "Papers deleted from the collection appear here."
  ],
  [
    "摘要保留来源语言，并区分作者预印本、出版商及文献索引来源。摘要概述为根据原文撰写的简述，单独标注。搜索涵盖标题、摘要和资源信息；多个关键词须同时匹配。尚未获取的摘要明确标注，不影响按标题和资源搜索。",
    "Abstracts retain their source language and distinguish author preprints, publishers and bibliographic indexes. Original short summaries are labeled separately. Search covers titles, abstracts and resources; every keyword must match. Unavailable abstracts are labeled, and titles and resources remain searchable."
  ],
  [
    "已删除文章；可在回收站中恢复",
    "Paper deleted; restore it from the bin"
  ],
  [
    "搜索回收站",
    "Search the bin"
  ],
  [
    "回收站",
    "Bin"
  ],
  [
    "浏览论文",
    "Browse papers"
  ],
  [
    "摘要与搜索",
    "Abstracts and search"
  ],
  [
    "摘要暂未获取",
    "Abstract unavailable"
  ],
  [
    "作者预印本摘要",
    "Author preprint abstract"
  ],
  [
    "文献索引摘要",
    "Indexed abstract"
  ],
  ["出版商摘要", "Publisher abstract"],
  ["摘要概述", "Abstract summary"],
  ["摘要署名", "Abstract attribution"],
  ["摘要许可", "Abstract license"],
  [
    "摘要来源",
    "Abstract source"
  ],
  [
    "摘要版本",
    "Abstract version"
  ],
  [
    "摘要",
    "Abstract"
  ]
]);
 entries.push(['作者预印本','Author preprint']);
 entries.push(['离线版 · 数据截至 2026-10-05','Offline edition · Snapshot: 2026-10-05'],['搜索、摘要、统计与回收站可离线使用；论文与代码链接需联网打开。','Search, abstracts, statistics and the recycle bin work offline; paper and code links require internet access.']);
 const dictionary=new Map(entries),keys=[...dictionary.keys()].sort((a,b)=>b.length-a.length);
 const escapePattern=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const pattern=new RegExp(keys.map(escapePattern).join('|'),'g');
 function translateText(value,language='en'){
  let s=String(value??'');if(language!=='en')return s;
  s=s.replace(/(\d+) 篇摘要 · (\d+) 篇摘要概述 · (\d+) 篇暂未获取/g,'$1 abstracts · $2 summaries · $3 unavailable').replace(/已获取 (\d+) \/ (\d+) 篇摘要/g,'$1 / $2 abstracts available').replace(/(\d+) 篇直接相关/g,'$1 directly relevant papers').replace(/(\d+) 篇扩展相关/g,'$1 related papers').replace(/(\d+) 篇已核实作者仓库/g,'$1 verified author repositories').replace(/(\d+) 篇已核实仿真平台/g,'$1 verified simulation platforms').replace(/(\d+) 篇已记录数据或任务基准/g,'$1 recorded datasets or task benchmarks').replace(/已删除 (\d+) 篇/g,'$1 papers deleted').replace(/第 (\d+) 名/g,'Rank $1').replace(/第 (\d+) 页/g,'Page $1').replace(/查看 (.+?) 年的 (\d+) 篇论文/g,'View $2 papers from $1').replace(/查看 (.+?) 的 (\d+) 篇论文/g,'View $2 papers for $1');
  return s.replace(pattern,k=>dictionary.get(k)).replace(/(\d+) 篇/g,'$1 papers');
 }
 const storageKey='grasp-atlas.language.v1';
 function create(storage){
  let language='zh';try{if(storage?.getItem(storageKey)==='en')language='en';}catch{}
  const texts=new WeakMap(),attributes=new WeakMap();let observer=null;
  const api={getLanguage:()=>language,text:(v,lang=language)=>translateText(v,lang),setLanguage(lang){if(!['zh','en'].includes(lang))return;language=lang;try{storage?.setItem(storageKey,lang);}catch{}},apply(node){
   const doc=node?.ownerDocument||node;if(!doc?.createTreeWalker)return;
   if(doc.documentElement)doc.documentElement.lang=language==='en'?'en':'zh-CN';
   const walker=doc.createTreeWalker(node,4);let textNode;
   while((textNode=walker.nextNode())){
    if(/^(SCRIPT|STYLE|TEXTAREA)$/.test(textNode.parentElement?.tagName||''))continue;
    let entry=texts.get(textNode);if(!entry||textNode.nodeValue!==entry.rendered)entry={source:textNode.nodeValue};
    entry.rendered=translateText(entry.source,language);if(textNode.nodeValue!==entry.rendered)textNode.nodeValue=entry.rendered;texts.set(textNode,entry);
   }
   const elements=[...(node.nodeType===1?[node]:[]),...Array.from(node.querySelectorAll?.('[title],[placeholder],[aria-label],meta[name="description"]')||[])];
   for(const el of elements){let record=attributes.get(el)||{};for(const name of ['title','placeholder','aria-label',...(el.tagName==='META'?['content']:[])]){const value=el.getAttribute(name);if(value===null)continue;let entry=record[name];if(!entry||value!==entry.rendered)entry={source:value};entry.rendered=translateText(entry.source,language);if(value!==entry.rendered)el.setAttribute(name,entry.rendered);record[name]=entry;}attributes.set(el,record);}
   for(const button of doc.querySelectorAll?.('[data-language]')||[])button.setAttribute('aria-pressed',String(button.dataset.language===language));
  },observe(doc){if(observer||typeof root.MutationObserver!=='function'||!doc?.body)return;observer=new root.MutationObserver(()=>api.apply(doc));observer.observe(doc.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','placeholder','aria-label']});}};
  return api;
 }
 let storage=null;try{storage=root.localStorage;}catch{}
 root.GraspI18n=create(storage);
 if(typeof module!=='undefined'&&module.exports)module.exports={create,translateText,dictionary,storageKey};
})(typeof globalThis!=='undefined'?globalThis:this);
