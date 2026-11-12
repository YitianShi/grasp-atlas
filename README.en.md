# Grasp Atlas

[简体中文](README.md) | **English**

An offline, bilingual browser for robotics grasping papers, with full-text search, conference/journal/year filters, research-topic statistics, personal deletion and restoration, CSV export, and local PDF downloading and verification.

The current literature snapshot is dated **November 12, 2026**. On first use, **523 papers appear in the collection and 187 in the recycle bin**, for 710 manageable entries. Coverage spans 2020–2026 across AAAI, ICLR, NeurIPS, CVPR, ICCV, ECCV, ICML, CoRL, ICRA and RSS, plus RA-L, T-ASE and T-RO. Counts change with your deletion and restoration choices.

The collection focuses on grasping as the primary research problem. It also includes scene/object reconstruction, shape completion, depth recovery, NeRF and 3D Gaussian Splatting methods that directly support grasping. All 159 papers previously removed from the original collection are available in the recycle bin for individual review and restoration, including 23 restored in the preceding revision. See the [recycle-bin records](editable-site/curation/original-159-review-bin-2026-11-12.json) for the list and default state. The earlier [27-paper reconstruction restoration](editable-site/curation/reconstruction-grasp-restoration-2026-11-12.json) remains a historical snapshot. Other historical exclusions retain their previous state.

The latest scope update excludes grasping with soft grippers, soft hands and soft robots, as well as grasping soft or deformable objects, including cables, ropes, soft foods and flexible sheets. It matches 40 papers: 28 newly moved to the recycle bin and 12 already there. See the [soft-grasping exclusion records](editable-site/curation/soft-grasping-exclusions-2026-11-12.json) for individual reasons and retained boundary cases. General compliance control, mathematical soft constraints and generic soft-finger contact assumptions do not trigger exclusion merely because of their terminology.

## Usage

Open the root `index.html` directly to browse metadata, search, filter and follow online paper links offline. In the sidebar's recycle bin, search for a paper and select **Restore** to return it to the collection, or choose **Restore all**. Personal choices are saved in the current browser and survive refreshes. The original 159-paper batch and the soft-grasping batch are each applied only once. An update applies only the new batch while preserving other restoration and deletion choices. Papers in the new batch can also be restored later.

Each paper in the recycle bin also has a **Delete permanently** button. After confirmation, the app removes its catalogue entry, abstract, links, screening records, download state and indexes. It also clears its PDFs, candidate files, partial downloads, full-text caches and records in local backups, then rebuilds the offline page. **Restore all** cannot recover permanently deleted papers. This operation requires the local server: double-click `Start_Grasp_Atlas.cmd`. If an older server is still running, close its launcher window before starting it again. Opening the HTML directly displays startup guidance. Permanent deletion is blocked while a download is running; a shared PDF still used by another paper is retained.

To use the download button in the browser, install Python 3.10 or later and run this command from the project root:

```sh
python atlas_server.py
```

The browser opens `http://127.0.0.1:8765/`. On Windows, you can also double-click `Start_Grasp_Atlas.cmd`. Select **Download / retry all** to download papers in the current browser collection. Papers still in the recycle bin are skipped; restored papers are included.

To start the downloader directly:

```sh
python Grasp_Atlas_Downloader/Grasp_Atlas_Downloader/start_download.py --retry
```

On Windows, you can double-click `Download_All_Papers.cmd`. The launcher creates a dedicated Python environment and installs the PDF verification dependency. Downloads resume after interruption, skip verified files and check PDF titles. Unavailable or unverified full texts are marked separately.

The command-line downloader skips the 187 default recycle-bin entries. Browser restoration choices are stored only in that browser; the browser's download button includes those choices automatically. You can also explicitly select permanent catalogue IDs from the command line with `--ids 339,557`.

Paper PDFs are not included in the repository. A fresh checkout initially has no local full texts. The downloader generates `GraspAtlas_Library/` and `library.js`; refresh the page afterward to open verified local PDFs.

## Project structure

```text
.
├── index.html                     # Generated single-file offline entry, tracked in Git
├── atlas_server.py                # Local web server and download API
├── paper_purge.py                 # Permanent deletion, history cleanup and rollback
├── editable-site/
│   ├── dist/                      # Editable HTML, CSS, JavaScript and paper data
│   ├── curation/                  # Versioned screening data, evidence and test inputs
│   ├── tests/                     # Frontend, literature-scope and consistency checks
│   └── build_offline.py           # Rebuilds the root offline page
├── Grasp_Atlas_Downloader/
│   └── Grasp_Atlas_Downloader/
│       ├── catalogue.json         # Downloader catalogue, synchronized with frontend data
│       ├── paper_overrides.json   # Verified title and version mappings
│       ├── resolved_sources.json  # Collected public source links
│       └── start_download.py      # Downloader entry point
├── scripts/check.py               # Rebuilds the page and runs all checks
└── START_HERE.txt                  # Local usage guide
```

`editable-site/dist/` contains editable source files and must not be ignored as a build cache. A `catalogueId` is a permanent identifier: never renumber or reuse it. Catalogue changes must be synchronized between `catalogue.json` and `editable-site/dist/data.js`.

## Development and checks

After editing `editable-site/dist/`, rebuild the offline entry:

```sh
python editable-site/build_offline.py
```

Development checks require Python, Node.js and the downloader's PDF dependency. Install the dependency in your own virtual environment, then run:

```sh
python -m pip install -r Grasp_Atlas_Downloader/Grasp_Atlas_Downloader/requirements.txt
python scripts/check.py
```

Checks cover frontend behavior, literature scope, historical identifiers, source consistency and downloader unit tests. Downloaded papers are not required. When local download state is present, the corresponding identity mappings are checked too.

## Git ignore rules

`.gitignore` excludes the entire local download library, PDFs, partial downloads, download logs and reports, generated `library.js`, Python environments and caches, root-level update/exclusion/omission reports, and `TEST_RESULTS.txt`. These files remain on your machine.

Web source files, the offline entry, the paper catalogue, verified source links and screening data in `editable-site/curation/` remain under version control. Screening data also serves as regression-test input and is separate from local runtime reports.

Source and license information for papers, code, datasets and abstracts is retained in the corresponding entries. Preprints may differ from formally published versions.
