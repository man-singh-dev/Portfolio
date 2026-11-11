"""Create a public copy of the resume with phone number and roll number truly removed.
Usage: python scripts/redact_resume.py <source.pdf> <out.pdf>"""
import sys, fitz
src, out = sys.argv[1], sys.argv[2]
SECRETS = ["+91-9931975824", "9931975824", "24UICS069", "Roll No.:", "Roll No.: 24UICS069"]
doc = fitz.open(src)
for page in doc:
    for s in SECRETS:
        for rect in page.search_for(s):
            page.add_redact_annot(rect, fill=(1, 1, 1))
    # also drop any tel: links
    for link in page.get_links():
        if str(link.get("uri", "")).startswith("tel:"):
            page.delete_link(link)
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)
doc.set_metadata({k: v for k, v in doc.metadata.items() if k in ("title", "author", "format")})
doc.save(out, garbage=4, deflate=True)
check = " ".join(p.get_text() for p in fitz.open(out))
leaks = [s for s in ["9931975824", "24UICS069"] if s in check.replace(" ", "")]
print("LEAKS:", leaks or "none")
