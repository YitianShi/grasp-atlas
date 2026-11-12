2026-11-12 软体抓取范围更新：默认清单523篇，已删除187篇，可管理合计710篇。
本轮排除软体夹爪/软手/软体机器人及软物体/可变形物体抓取，共40篇，新移入28篇、原已删除12篇。
PDF、永久编号、下载状态保留；新批次仅应用一次，保留其他个人恢复选择。
逐篇名单与原因见 SOFT_GRASPING_EXCLUSIONS_REPORT_2026-11-12.txt；以下原有内容为历史记录。

Grasp Atlas 本机论文下载器
2026-11-12 范围已纠正：仅收录以机器人抓取为主要问题的研究。当前 547 篇、386 篇活动全文。
上轮 50 篇新增已撤下 41 篇；本轮合计撤下 200 篇泛操作/支撑性研究，历史 PDF 保留归档。
当前口径和名单见 FULL_RECHECK_2026-11-12.txt；下文数量是此前历史快照。

2026-11-12 全来源复核：当前 747 篇（608 篇直接相关、139 篇扩展相关），活动全文 516 篇；CoRL 2026 仍为 18 篇。
已逐一核对项目中 10 个会议、3 个期刊的 2020–2026 年来源，补入 50 条确认遗漏，新增 9 篇已核验全文。
最新说明见 FULL_RECHECK_2026-11-12.txt；以下为此前轮次的历史快照。

2026-11-12 最新清单：697 篇（598 篇直接相关、99 篇扩展相关），本地全文 507 篇；CoRL 2026 为 18 篇。排除全身抓取、衣物/布料/织物抓取及手内操作。
本轮期刊新增 19 篇、复核 4 篇，永久编号使用 711–729；下一编号至少为 780。
下文旧版数量为历史快照，以本行及当前 download_index.csv 为准。
2026-11-06 范围调整：移除 13 篇手内操作论文，活动清单 697 条；永久 catalogueId 保持原编号，排除记录不再下载。
========================

修订 2（2026-10-13）：修正一次 HTTP 403 导致整个网站后续链接被跳过的问题。
新增 diagnosis_zh 中文原因、candidate_files 待核验文件位置，以及 failed_downloads.csv。
更新时，把程序文件覆盖到原文件夹，保留 GraspAtlas_Library；再使用 --retry 重试。
如只需生成中文诊断、不发起下载：python3 start_download.py --report-only。

这不是已经装好论文 PDF 的压缩包，而是把论文直接下载到您电脑的工具。
基础清单来自 grasp_atlas_offline.html，快照日期 2026-10-05，共 692 条。
2026-11-06 新增 CoRL 2026 论文 18 篇，当前在后续范围调整前为 710 条；已有编号与下载结果保留。
下载器允许在校验旧记录身份后追加新记录，并自动修复复制后失效的专用 Python 环境。
2026-10-15 更新：下载器已接入本地网站，下载结果实时写入根目录 library.js。
请优先查看根目录 START_HERE.txt；根目录 Start_Grasp_Atlas.cmd 提供网页内下载入口。

快速使用
--------
1. 完整解压本 ZIP 到一个有写入权限的文件夹。不要在压缩包内直接运行。
2. 需要 Python 3.10 或更新版本。
   Windows：双击 Start_Windows.cmd。
   macOS / Linux：在此文件夹打开终端，运行 python3 start_download.py。
3. 首次启动会在当前文件夹创建 .grasp_python，并从 PyPI 安装 pypdf，用于读取和核验 PDF。
   不需要管理员权限。不会上传您的本地文件，不会读取浏览器账号或机构凭据。
4. 下载结果位于网站根目录的 GraspAtlas_Library/papers/年份/会议或期刊/。

首次完整运行可能需要较长时间，取决于网络、论文大小与可用来源。建议预留至少 10 GB 空间。

中断、继续和重试
--------------
按 Ctrl+C 可暂停；再次运行同一命令将继续。已经成功且校验和一致的文件会跳过。
未完成 PDF 保存在 partial/；如果来源服务器支持 Range，则续传，否则从头获取该文件。
首次运行留下的失败记录默认跳过；若要再次尝试失败或待核验条目，运行：

  Windows: py -3 start_download.py --retry
  macOS / Linux: python3 start_download.py --retry

同一输出目录已加进程锁，不要同时启动两个下载进程，也不要删除 download_state.json 或 partial/，否则无法保留续传状态。
更换网络后重试通常比反复请求同一失败链接更有用。

先试几篇
--------
  python3 start_download.py --ids 6,11 --skip-resolve

只恢复和匹配来源，不下载 PDF：
  python3 start_download.py --resolve-only

使用已有来源跳过额外元数据检索：
  python3 start_download.py --skip-resolve

直接使用您自己的 Python 环境（不创建专用环境）：
  python3 -m pip install -r requirements.txt
  python3 download_papers.py

下载策略与核验
------------
- 使用网站里的原始链接，并通过 OpenAlex 和 arXiv 公开元数据补充来源。
- 优先选择匹配的 arXiv PDF，其次尝试出版社、作者或机构的公开版本。
- arXiv 请求为单连接、至少间隔 3.2 秒；遇到限流会留出冷却时间。
- OpenAlex 如要求 API key，可自行设置 OPENALEX_API_KEY 环境变量；不设置时也可运行，
  该服务不可用将跳过，继续利用已知链接和 arXiv。工具不会打印 API key。
- 下载后检查 PDF 标识、结束标记、可解析页数、首页标题和摘要标志。
- 不能确认标题的文件放在 needs_review/，不计为已下载；也可能包括因字体抽取问题
  而未通过自动检查的正确论文，需要人工核对。
- 最终是否有可下载全文由原始来源决定。本工具不能保证全部条目都有公开全文。
- 单篇文件上限 200 MB。只尝试公开链接，不绕过付费墙、登录或访问控制。
- 原论文内容不作修改，版权和许可由原作者及出版社决定。

结果文件
--------
download_index.csv：全部 547 条活动记录的状态、文件路径、实际来源及 SHA-256。
not_downloaded.csv：未下载、失败或待核验条目。
failed_downloads.csv：仅本轮获取失败的条目，不包含尚未尝试和已下载待核验条目。
download_state.json：已解析来源、详细尝试记录与续传状态，请保留。
papers/：通过自动标题检查的正文 PDF。
needs_review/：尚未确认的候选文件，不混入 papers/。

已知版本对应关系
--------------
Scaling Up Multi-Task Robotic Reinforcement Learning 对应 MT-Opt (arXiv:2104.08212)，
作者页面明确注明会议标题：https://jvarley.github.io/ 。
A Benchmarking Study of Vision-based Robotic Grasping Algorithms 的重复提交
arXiv:2503.11163 已撤回，其说明指向 arXiv:2307.11622 的更新版本。

元数据来源文档
------------
https://info.arxiv.org/help/api/user-manual.html
https://docs.openalex.org/

制作日期：2026-10-13。
