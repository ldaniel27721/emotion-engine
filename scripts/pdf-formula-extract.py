"""PDF 公式抢救：① 按坐标重建文本  ② 渲染成 PNG 供直接查看。

`get_text()` 按阅读顺序吐字符，数学公式的字形位置信息丢失 → 碎片化。
本脚本改用 get_text('dict') 取得每个 span 的 bbox，按 (y, x) 排序重建视觉行；
同时把每页渲染成 PNG，公式实在重建不出来时可以直接看图。

用法：
    py -3 pdf-formula-extract.py <input.pdf> <outdir>
"""
import os
import sys
import pymupdf

if len(sys.argv) < 3:
    print("usage: pdf-formula-extract.py <input.pdf> <outdir>")
    sys.exit(2)

src, outdir = sys.argv[1], sys.argv[2]
sys.stdout.reconfigure(encoding="utf-8")
os.makedirs(outdir, exist_ok=True)

doc = pymupdf.open(src)
report = []

for i, page in enumerate(doc):
    pno = i + 1

    # ---- ① 坐标重建：取所有 span，按 y 分行、按 x 排序 ----
    d = page.get_text("dict")
    spans = []
    for blk in d.get("blocks", []):
        for line in blk.get("lines", []):
            for sp in line.get("spans", []):
                t = sp.get("text", "")
                if t.strip():
                    spans.append((sp["bbox"], t, round(sp.get("size", 0), 1)))

    spans.sort(key=lambda s: (round(s[0][1] / 3.5), s[0][0]))   # 同一个 3.5pt 带内算同一行
    lines, cur_y, buf = [], None, []
    for bbox, t, size in spans:
        y = round(bbox[1] / 3.5)
        if cur_y is None or y == cur_y:
            buf.append((bbox[0], t, size))
        else:
            buf.sort(key=lambda x: x[0])
            lines.append("  ".join(x[1] for x in buf))
            buf = [(bbox[0], t, size)]
        cur_y = y
    if buf:
        buf.sort(key=lambda x: x[0])
        lines.append("  ".join(x[1] for x in buf))

    text = "\n".join(lines)
    txt_path = os.path.join(outdir, "page-%02d.txt" % pno)
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(text)

    # ---- ② 渲染 PNG ----
    pix = page.get_pixmap(dpi=150)
    png_path = os.path.join(outdir, "page-%02d.png" % pno)
    pix.save(png_path)

    # 粗略判断这页有没有公式：算符/上下标字符密度
    mathy = sum(text.count(c) for c in "∑∫√±≈≤≥×÷∂∞αβγλμωθΔΣΠ")
    report.append((pno, len(text), len(lines), mathy, os.path.getsize(png_path)))

print("输出目录: %s" % outdir)
print("")
print("页  正文字符  重建行数  数学符号数  PNG 字节")
for pno, n, nl, m, sz in report:
    flag = "   ← 疑似公式页" if m >= 3 else ""
    print("%2d %9d %9d %10d %10d%s" % (pno, n, nl, m, sz, flag))
