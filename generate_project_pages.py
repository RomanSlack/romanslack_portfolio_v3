#!/usr/bin/env python3
"""
Generate one standalone, SEO-optimized HTML page per project into projects/.

Reads:
  - projects.json         (canonical project data; edit via add_project.py)
  - project_details.json  (optional rich content keyed by project id: longDescription, features, techStack, tags)

Writes:
  - projects/<slug>.html  (one per project)
  - updates sitemap.xml with every project page

Run after adding/reordering projects:  python3 generate_project_pages.py
"""
import json
import os
import re
import html

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = "https://romanslack.com"

# Every place that points back to Roman. Plastered into each page's structured data.
SAME_AS = [
    "https://github.com/romanslack",
    "https://www.linkedin.com/in/roman-slack-a91a6a266",
    "https://x.com/RomanSlack1",
    "https://www.youtube.com/@roman-slack",
    "https://theorg.com/org/just-tech/org-chart/roman-slack",
    "https://builders.cv/b9db5c41e39d4eb7888d4359cbd61714",
]

MONTHS = {
    "01": "January", "02": "February", "03": "March", "04": "April",
    "05": "May", "06": "June", "07": "July", "08": "August",
    "09": "September", "10": "October", "11": "November", "12": "December",
}

FOOTER = """    <footer>
        <div class="footer-copyright">
            Copyright &copy; <span id="year"></span> Roman Slack
        </div>
        <script>document.getElementById('year').textContent = new Date().getFullYear();</script>
        <div class="footer-links">
            <a href="https://www.linkedin.com/in/roman-slack-a91a6a266" target="_blank" aria-label="LinkedIn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </a>
            <a href="/assets/RomanSlack_Resume_Feb_2026.pdf" target="_blank" aria-label="Resume">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
            </a>
            <a href="https://github.com/romanslack" target="_blank" aria-label="GitHub">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
            <a href="https://x.com/RomanSlack1" target="_blank" aria-label="X (Twitter)">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://www.youtube.com/@roman-slack" target="_blank" aria-label="YouTube">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
            </a>
            <a href="mailto:romanslack1@gmail.com" aria-label="Email">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
            </a>
        </div>
    </footer>"""


def slugify(title):
    s = title.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def pretty_date(d, in_progress):
    m = re.match(r"(\d{2})-(\d{4})", d or "")
    if not m:
        return d or ""
    base = f"{MONTHS.get(m.group(1), m.group(1))} {m.group(2)}"
    return base + (" - Present" if in_progress else "")


def iso_date(d):
    m = re.match(r"(\d{2})-(\d{4})", d or "")
    return f"{m.group(2)}-{m.group(1)}-01" if m else None


def abs_url(link):
    if not link or link == "#":
        return None
    if link.startswith("/"):
        return SITE + link
    return link


def resolved_path(p, slug):
    """Site-relative path to a project's page: its customPage, or the generated slug page."""
    return p.get("customPage") or f"/projects/{slug}.html"


def esc(s):
    return html.escape(s or "", quote=True)


def build_page(p, details, slug):
    title = p["title"]
    desc = (p.get("description") or "").strip()
    cat = p.get("category", "")
    hours = p.get("hours", "")
    date_disp = pretty_date(p.get("date", ""), p.get("inProgress"))
    img = p.get("image") or (p.get("images") or [None])[0]
    img_abs = SITE + "/" + img.lstrip("/") if img else SITE + "/images/roman_new_site_photo.jpg"
    link = abs_url(p.get("link"))
    page_url = f"{SITE}/projects/{slug}.html"

    d = details.get(p["id"], {})
    long_desc = d.get("longDescription") or [desc]
    features = d.get("features") or []
    tech = d.get("techStack") or []
    tags = d.get("tags") or []
    awards = d.get("awards") or []
    extra_links = d.get("links") or []

    meta_desc = (long_desc[0] if long_desc else desc)
    if len(meta_desc) > 158:
        meta_desc = meta_desc[:155].rsplit(" ", 1)[0] + "..."

    kw = ["Roman Slack", title] + tags + [cat, "AI Engineer", "software project", "portfolio"]
    keywords = ", ".join(dict.fromkeys(k for k in kw if k))

    is_repo = bool(link and "github.com" in link)
    schema_type = "SoftwareSourceCode" if is_repo else "CreativeWork"

    # ---- JSON-LD ----
    ld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": schema_type,
                "name": title,
                "headline": title,
                "url": page_url,
                "description": " ".join(long_desc),
                "image": img_abs,
                "keywords": ", ".join(tags) if tags else keywords,
                "author": {
                    "@type": "Person",
                    "@id": f"{SITE}/#person",
                    "name": "Roman Slack",
                    "url": SITE + "/",
                    "sameAs": SAME_AS,
                },
                "creator": {"@id": f"{SITE}/#person"},
                "copyrightHolder": {"@id": f"{SITE}/#person"},
                "isPartOf": {"@type": "CollectionPage", "name": "Projects - Roman Slack", "url": f"{SITE}/projects.html"},
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
                    {"@type": "ListItem", "position": 2, "name": "Projects", "item": f"{SITE}/projects.html"},
                    {"@type": "ListItem", "position": 3, "name": title, "item": page_url},
                ],
            },
        ],
    }
    g0 = ld["@graph"][0]
    if iso_date(p.get("date", "")):
        g0["datePublished"] = iso_date(p.get("date", ""))
    if is_repo:
        g0["codeRepository"] = link
        if tech:
            g0["programmingLanguage"] = tech
    if tech:
        g0.setdefault("keywords", keywords)
    if awards:
        g0["award"] = awards
    ld_json = json.dumps(ld, indent=2)

    # ---- body content ----
    paras = "\n".join(f"            <p>{esc(par)}</p>" for par in long_desc)
    feat_html = ""
    if features:
        items = "\n".join(f"                <li>{esc(f)}</li>" for f in features)
        feat_html = f"""
            <h2>Key Features</h2>
            <ul class="project-feature-list">
{items}
            </ul>"""
    tech_html = ""
    if tech:
        chips = "\n".join(f'                <span class="tech-chip">{esc(t)}</span>' for t in tech)
        tech_html = f"""
            <h2>Tech Stack</h2>
            <div class="tech-chips">
{chips}
            </div>"""
    awards_html = ""
    if awards:
        items = "\n".join(f"                <li>{esc(a)}</li>" for a in awards)
        awards_html = f"""
            <div class="project-awards">
                <h2>Awards &amp; Recognition</h2>
                <ul class="award-list">
{items}
                </ul>
            </div>
"""

    btns = []
    if link:
        label = "View on GitHub" if is_repo else ("Watch" if ("youtube" in link or "youtu.be" in link) else "Visit Project")
        btns.append((link, label))
    for L in extra_links:
        btns.append((L["url"], L["label"]))
    link_html = ""
    if btns:
        buttons = "\n".join(
            f'                <a href="{esc(u)}" target="_blank" rel="noopener" class="project-link-btn">{esc(lab)} &rarr;</a>'
            for u, lab in btns)
        link_html = f"""
            <p class="project-cta">
{buttons}
            </p>"""

    img_html = ""
    if img:
        img_html = f'            <img src="../{esc(img)}" alt="{esc(title)} — a project by Roman Slack" class="project-detail-image">\n'

    meta_bits = [esc(cat).capitalize(), esc(date_disp)]
    if hours not in (None, "", 0, "0"):
        meta_bits.append(f"{esc(str(hours))} hours")
    meta_line = " &middot; ".join(b for b in meta_bits if b) + " &middot; built by Roman Slack"

    page = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{esc(title)} — Roman Slack | AI &amp; Software Project</title>
    <meta name="description" content="{esc(meta_desc)}">
    <meta name="keywords" content="{esc(keywords)}">
    <meta name="author" content="Roman Slack">
    <meta name="creator" content="Roman Slack">
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
    <link rel="canonical" href="{page_url}">
    <link rel="alternate" type="text/markdown" title="llms.txt" href="/llms.txt">

    <!-- Open Graph -->
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Roman Slack">
    <meta property="og:url" content="{page_url}">
    <meta property="og:title" content="{esc(title)} — by Roman Slack">
    <meta property="og:description" content="{esc(meta_desc)}">
    <meta property="og:image" content="{esc(img_abs)}">
    <meta property="article:author" content="Roman Slack">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:title" content="{esc(title)} — by Roman Slack">
    <meta property="twitter:description" content="{esc(meta_desc)}">
    <meta property="twitter:image" content="{esc(img_abs)}">
    <meta property="twitter:creator" content="@RomanSlack1">

    <script type="application/ld+json">
{ld_json}
    </script>

    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="manifest" href="/site.webmanifest">
    <link rel="shortcut icon" href="/favicon.ico">
    <link rel="stylesheet" href="../styles.css">
</head>
<body class="scroll-page">
    <header>
        <a href="../projects.html" class="back-arrow">&larr;</a>
        <h1>{esc(title)}</h1>
        <p class="header-subtitle">A project by <a href="../index.html" class="subtitle-link">Roman Slack</a> &mdash; Lead AI Platform Engineer</p>
    </header>

    <main class="project-detail-main">
        <article class="project-detail">
{img_html}            <p class="project-meta-line">{meta_line}</p>
{awards_html}
{paras}
{feat_html}
{tech_html}
{link_html}
            <p class="project-attribution">Designed and built by <strong>Roman Slack</strong>, Lead AI Platform Engineer. See more of Roman Slack's work on the <a href="../projects.html">projects page</a> or get in touch via the <a href="../contact.html">contact page</a>.</p>
        </article>
    </main>

{FOOTER}
    <script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
"""
    return page


def update_noscript(grid, details, slug_for):
    """Rewrite the <noscript> static fallback in projects.html from projects.json.

    projects.html renders its grid client-side, so non-JS AI crawlers see nothing
    without this block. It mirrors the main grid (projects.json only — NOT
    extra_projects.json), one <article> per project, sorted by id. Regenerated here
    so it can never drift out of sync by hand."""
    path = os.path.join(ROOT, "projects.html")
    with open(path) as f:
        doc = f.read()

    articles = []
    for p in sorted(grid, key=lambda x: x["id"]):
        slug = slug_for[p["id"]]
        url = resolved_path(p, slug)
        title = esc(p["title"])
        # Match the established noscript style: lowercase category, raw MM-YYYY date, raw hours.
        meta_bits = [esc(p.get("category", "")), esc(p.get("date", ""))]
        hours = p.get("hours", "")
        if hours not in (None, "", 0, "0"):
            meta_bits.append(f"{esc(str(hours))} hours")
        meta = " &middot; ".join(b for b in meta_bits if b)
        desc = esc((p.get("description") or "").strip())
        link = p.get("link") or ""
        more = f'<a href="{url}">Read more about {title} by Roman Slack</a>'
        # External (http) or root-relative (/polydb/...) links get a "live / source" CTA.
        # Relative own-page links (projects/<slug>.html on customPage entries) get none.
        if link.startswith(("http", "/")):
            more += f' &middot; <a href="{esc(abs_url(link))}" rel="noopener">live / source</a>'
        articles.append(
            f"""            <article>
                <h2><a href="{url}">{title}</a></h2>
                <p class="meta">{meta}</p>
                <p>{desc}</p>
                <p>{more}</p>
            </article>""")

    block = (
        "        <noscript>\n"
        '        <div class="noscript-projects">\n'
        f'            <p>Roman Slack has built {len(grid)} projects. The interactive grid requires '
        'JavaScript; each project also has its own page linked below (and the full text is in '
        '<a href="/llms-full.txt">llms-full.txt</a>).</p>\n'
        + "\n".join(articles)
        + "\n        </div>\n        </noscript>"
    )
    new_doc = re.sub(r"        <noscript>.*?        </noscript>", lambda _: block, doc, count=1, flags=re.S)
    with open(path, "w") as f:
        f.write(new_doc)


def main():
    grid = json.load(open(os.path.join(ROOT, "projects.json")))
    projects = list(grid)
    # extra_projects.json: projects that get a detail page + hub entry but are NOT in the
    # main projects.html grid (e.g. flagship work like JTAI). Optional.
    extra_path = os.path.join(ROOT, "extra_projects.json")
    if os.path.exists(extra_path):
        projects = projects + json.load(open(extra_path))
    projects = sorted(projects, key=lambda p: p["id"])
    details_path = os.path.join(ROOT, "project_details.json")
    details = {}
    if os.path.exists(details_path):
        details = {int(k): v for k, v in json.load(open(details_path)).items()}

    os.makedirs(os.path.join(ROOT, "projects"), exist_ok=True)

    seen = {}
    slug_for = {}
    for p in projects:
        slug = slugify(p["title"])
        if slug in seen:
            slug = f"{slug}-{p['id']}"
        seen[slug] = True
        slug_for[p["id"]] = slug

    written = []
    for p in projects:
        slug = slug_for[p["id"]]
        # Entries with a hand-built "customPage" own their own HTML — don't clobber it.
        # They still appear in the hub + sitemap (see resolved_url) pointing at that page.
        if not p.get("customPage"):
            page = build_page(p, details, slug)
            with open(os.path.join(ROOT, "projects", f"{slug}.html"), "w") as f:
                f.write(page)
        written.append((p, slug))

    write_index(written, details)
    update_sitemap(written)
    update_noscript(grid, details, slug_for)
    # expose slug map for the noscript regenerator
    json.dump({p["id"]: s for p, s in written}, open(os.path.join(ROOT, ".project_slugs.json"), "w"))
    print(f"Generated {len(written)} project pages + projects/index.html + projects.html noscript")
    return written


def write_index(written, details):
    """A clean hub listing every project page. Reachable at /projects/ by URL; not linked from site nav."""
    rows = []
    for p, slug in written:
        title = esc(p["title"])
        cat = esc(p.get("category", "")).capitalize()
        date_disp = esc(pretty_date(p.get("date", ""), p.get("inProgress")))
        hours = p.get("hours", "")
        meta_bits = [cat, date_disp]
        if hours not in (None, "", 0, "0"):
            meta_bits.append(f"{esc(str(hours))} hours")
        meta = " &middot; ".join(b for b in meta_bits if b)
        img = p.get("image") or (p.get("images") or [None])[0]
        d = details.get(p["id"], {})
        blurb = (d.get("longDescription") or [p.get("description", "")])[0]
        if len(blurb) > 160:
            blurb = blurb[:157].rsplit(" ", 1)[0] + "..."
        thumb = f'<img src="../{esc(img)}" alt="{title}" loading="lazy">' if img else ""
        url = resolved_path(p, slug)
        rows.append(f"""            <li class="pi-item">
                <a class="pi-thumb" href="{url}">{thumb}</a>
                <div class="pi-body">
                    <a class="pi-title" href="{url}">{title}</a>
                    <p class="pi-meta">{meta}</p>
                    <p class="pi-blurb">{esc(blurb)}</p>
                </div>
            </li>""")
    rows_html = "\n".join(rows)
    page = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>All Project Pages — Roman Slack</title>
    <meta name="description" content="Index of every individual project page by Roman Slack, Lead AI Platform Engineer — {len(written)} AI and software projects.">
    <meta name="author" content="Roman Slack">
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
    <link rel="canonical" href="{SITE}/projects/">
    <link rel="alternate" type="text/markdown" title="llms.txt" href="/llms.txt">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="manifest" href="/site.webmanifest">
    <link rel="shortcut icon" href="/favicon.ico">
    <link rel="stylesheet" href="../styles.css">
</head>
<body class="scroll-page">
    <header>
        <a href="../index.html" class="back-arrow">&larr;</a>
        <h1>All Project Pages</h1>
        <p class="header-subtitle">Every individual project page by <a href="../index.html" class="subtitle-link">Roman Slack</a></p>
    </header>

    <main class="project-index-main">
        <ol class="project-index">
{rows_html}
        </ol>
    </main>

{FOOTER}
    <script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
"""
    with open(os.path.join(ROOT, "projects", "index.html"), "w") as f:
        f.write(page)


def update_sitemap(written):
    path = os.path.join(ROOT, "sitemap.xml")
    pages = [
        ("/", "weekly", "1.0"),
        ("/projects.html", "weekly", "0.9"),
        ("/experience.html", "monthly", "0.8"),
        ("/hobbies.html", "monthly", "0.7"),
        ("/contact.html", "yearly", "0.6"),
        ("/projects/", "weekly", "0.6"),
        ("/llms.txt", "weekly", "0.5"),
    ]
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    LASTMOD = "2026-06-04"
    for loc, cf, pr in pages:
        lines += ["  <url>", f"    <loc>{SITE}{loc}</loc>",
                  f"    <lastmod>{LASTMOD}</lastmod>",
                  f"    <changefreq>{cf}</changefreq>",
                  f"    <priority>{pr}</priority>", "  </url>"]
    for p, slug in written:
        lines += ["  <url>", f"    <loc>{SITE}{resolved_path(p, slug)}</loc>",
                  f"    <lastmod>{LASTMOD}</lastmod>",
                  "    <changefreq>monthly</changefreq>",
                  "    <priority>0.7</priority>", "  </url>"]
    lines.append("</urlset>")
    with open(path, "w") as f:
        f.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
