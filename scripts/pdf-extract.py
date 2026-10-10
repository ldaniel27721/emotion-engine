"""通用 PDF 文本抽取器（pymupdf）。

用法：
    py -3 pdf-extract.py <input.pdf> <output.txt>

沿用 2026-10-09 已验证的 pdfx.py 方案，仅把源/目标改成命令行参数。
注意：pymupdf 的新 API 是 `import pymupdf`，`fitz` 别名已弃用（会打 warning）。
"""
import sys
import pymupdf

if len(sys.argv) < 3:
    print("usage: pdf-extract.py <input.pdf> <output.txt>")
    sys.exit(2)

src, dst = sys.argv[1], sys.argv[2]
sys.stdout.reconfigure(encoding="utf-8")

doc = pymupdf.open(src)
out = []
out.append("源文件 = %s" % src)
out.append("页数   = %d" % doc.page_count)
meta = doc.metadata or {}
for k in ("title", "author", "subject", "creator", "producer", "creationDate"):
    if meta.get(k):
        out.append("  %s: %s" % (k, meta[k]))
out.append("")

total = 0
for i, page in enumerate(doc):
    t = page.get_text().strip()
    total += len(t)
    out.append("========== 第 %d 页 (%d 字) ==========" % (i + 1, len(t)))
    out.append(t)
    out.append("")

payload = "\n".join(out)
with open(dst, "w", encoding="utf-8") as f:
    f.write(payload)

print("OK  页数=%d   正文合计=%d 字   输出=%s (%d 字符)" % (doc.page_count, total, dst, len(payload)))
