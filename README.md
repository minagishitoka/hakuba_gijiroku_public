# hakuba_gijiroku_public
白馬村議会議事録をホームページに公開するものです。


白馬村議会の本会議録（2010年1月〜2026年3月）を、論点・一般質問者ブロック・発言の単位で検索し、原文と原PDFページまでたどるサイト。GitHub Pages で公開している。

- サイト本体：`hakuba/search_app/index.html`（研究用リポジトリ `minagishitoka/-gikai-research-projects` のブランチ `claude/hakuba-council-search-tool-4w0wnn` と同じファイル）
- データ：`hakuba/search_app/data/`（gzip を base64 にしたテキスト。研究用リポジトリの `hakuba/scripts/ぬ_build_search_data.py` で作成）
- 公開：`main` に push すると `.github/workflows/pages.yml` が `scripts/build_site.py` で `_site/` を組み立てて公開し、`scripts/verify_site.mjs` で公開URLを実際に開いて確かめる

データの注意：分類（v2.3.1）と JEV ラベルは AI による一次判定で、重要度や確度ではない。観測窓の外（委員会、議会だより、平成23年第3回定例会、画像のみの臨時会2件）は含まない。
