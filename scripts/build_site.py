"""hakuba/search_app/index.html を GitHub Pages 用の _site/ に組み立てる。

index.html はそのまま使う（Artifact 用に書かれているため、<!doctype> と <head> を
持たない）。ここでは前後に文書の骨組みだけを足し、data/ をそのまま写す。
"""
import base64
import gzip
import json
import pathlib
import shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "hakuba" / "search_app"
OUT = ROOT / "_site"

HEAD = """<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="icon" href="data:,">
<style>
:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
img{max-width:100%}
[hidden]{display:none!important}
</style>
</head>
<body>
"""
TAIL = "\n</body>\n</html>\n"


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    page = (SRC / "index.html").read_text(encoding="utf-8")
    (OUT / "index.html").write_text(HEAD + page + TAIL, encoding="utf-8")
    shutil.copytree(SRC / "data", OUT / "data")

    # ページが読むデータファイルがすべてそろっているか確かめる
    meta_path = OUT / "data" / "meta.json.gz.b64.txt"
    meta = json.loads(gzip.decompress(base64.b64decode(meta_path.read_text())))
    need = [f"sp_{y}.json.gz.b64.txt" for y in meta["years"]]
    missing = [n for n in need if not (OUT / "data" / n).exists()]
    if missing:
        raise SystemExit("データファイルが足りない: " + ", ".join(missing))
    for ref in ["data/meta.json.gz.b64.txt", "data/sp_${years[i]}.json.gz.b64.txt"]:
        if ref not in page:
            raise SystemExit("index.html の読み込み先が想定と違う: " + ref)
    print(f"_site を作成: index.html + data/ {len(need) + 1} ファイル")


if __name__ == "__main__":
    main()
