#!/usr/bin/env python3
"""Prebake the chart data for the ai-job-market post.

Fetches sources that can't be fetched client-side (NY Fed is bot-blocked xlsx;
Canaries is a zip; FRED has no CORS) and commits them as small static JSONs:

  blog/posts/assets/cohort-unemployment-data.json   (NY Fed, monthly, % rates)
  blog/posts/assets/cohort-swe-age-data.json        (Canaries/ADP, monthly, index)
  blog/posts/assets/rate-data.json                  (FRED DFII10, monthly avg, %)

Stdlib only (xlsx is a zip of XML — parsed by hand; no openpyxl). Rerun any
time to refresh the snapshots:  python3 docs/prebake-cohort-data.py
"""

import csv
import io
import json
import re
import sys
import urllib.request
import zipfile
from datetime import date, datetime, timedelta
from pathlib import Path
from xml.etree import ElementTree

REPO = Path(__file__).resolve().parent.parent
OUT_DIR = REPO / "blog" / "posts" / "assets"

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")

NYFED_URL = ("https://www.newyorkfed.org/medialibrary/Research/Interactives/"
             "Data/college-labor-market/College-labor-data")
CANARIES_URL = ("https://storage.googleapis.com/aviary-del-public/release_memos/"
                "latest/downloads/canaries_software_developers_results.zip")
FRED_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DFII10"

# NY Fed column header -> JSON series key ("Young workers" = ages 22-27)
NYFED_SERIES = {
    "Recent graduates": "grads",
    "All workers": "all",
    "Young workers": "young",
    "College graduates": "college",
}

# Canaries column header -> JSON series key
CANARIES_SERIES = {
    "Early Career 1 (22-25)": "g2225",
    "Early Career 2 (26-30)": "g2630",
    "Developing (31-34)": "g3134",
    "Mid-Career 1 (35-40)": "g3540",
    "Mid-Career 2 (41-49)": "g4149",
    "Senior (50+)": "g50",
}


def fetch(url, ua=UA):
    # ua=None sends python's default agent — FRED's Akamai stalls on a browser
    # UA that arrives without browser cookies, while NY Fed requires one.
    req = urllib.request.Request(url, headers={"User-Agent": ua} if ua else {})
    with urllib.request.urlopen(req, timeout=90) as res:
        return res.read()


# ---- minimal xlsx reader (values only; enough for the NY Fed workbook) ------

XLSX_NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
           "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}


def xlsx_sheet_rows(data, sheet_name):
    """Yield rows (lists of python values) from one sheet of an xlsx blob."""
    zf = zipfile.ZipFile(io.BytesIO(data))

    # sheet name -> target xml path, via workbook.xml + its rels
    wb = ElementTree.fromstring(zf.read("xl/workbook.xml"))
    rels = ElementTree.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rel_target = {rel.get("Id"): rel.get("Target")
                  for rel in rels.iter("{http://schemas.openxmlformats.org/package/2006/relationships}Relationship")}
    sheet_path = None
    for sheet in wb.iter("{%s}sheet" % XLSX_NS["m"]):
        if sheet.get("name") == sheet_name:
            target = rel_target[sheet.get("{%s}id" % XLSX_NS["r"])]
            sheet_path = target if target.startswith("xl/") else "xl/" + target
    if sheet_path is None:
        names = [s.get("name") for s in wb.iter("{%s}sheet" % XLSX_NS["m"])]
        raise SystemExit(f"sheet {sheet_name!r} not found; workbook has {names}")

    shared = []
    if "xl/sharedStrings.xml" in zf.namelist():
        ss = ElementTree.fromstring(zf.read("xl/sharedStrings.xml"))
        for si in ss.iter("{%s}si" % XLSX_NS["m"]):
            shared.append("".join(t.text or "" for t in si.iter("{%s}t" % XLSX_NS["m"])))

    def cell_col(ref):  # "BC12" -> 0-based column index
        col = 0
        for ch in ref:
            if ch.isalpha():
                col = col * 26 + (ord(ch.upper()) - 64)
            else:
                break
        return col - 1

    sheet = ElementTree.fromstring(zf.read(sheet_path))
    for row in sheet.iter("{%s}row" % XLSX_NS["m"]):
        cells = {}
        for c in row.iter("{%s}c" % XLSX_NS["m"]):
            v = c.find("{%s}v" % XLSX_NS["m"])
            if v is None or v.text is None:
                continue
            if c.get("t") == "s":
                val = shared[int(v.text)]
            elif c.get("t") == "str":
                val = v.text
            else:
                try:
                    val = float(v.text)
                except ValueError:
                    val = v.text
            cells[cell_col(c.get("r"))] = val
        if cells:
            width = max(cells) + 1
            yield [cells.get(i) for i in range(width)]


def xlsx_serial_to_iso(serial):
    """Excel serial day -> ISO date, snapped to the 1st of the month."""
    d = date(1899, 12, 30) + timedelta(days=int(serial))
    return d.replace(day=1).isoformat()


# ---- NY Fed: unemployment rates by group ------------------------------------

def bake_nyfed():
    rows = list(xlsx_sheet_rows(fetch(NYFED_URL), "unemployed"))
    header_i, header = next((i, r) for i, r in enumerate(rows)
                            if r and any(str(c).strip() == "Recent graduates" for c in r if c))
    col_of = {}
    for want in NYFED_SERIES:
        for j, c in enumerate(header):
            if c is not None and str(c).strip() == want:
                col_of[want] = j
    missing = set(NYFED_SERIES) - set(col_of)
    if missing:
        raise SystemExit(f"NY Fed columns missing: {missing}; header was {header}")
    date_col = 0

    dates, series = [], {k: [] for k in NYFED_SERIES.values()}
    for r in rows[header_i + 1:]:
        if not r or not isinstance(r[date_col], (int, float)):
            continue
        vals = {}
        ok = True
        for name, key in NYFED_SERIES.items():
            v = r[col_of[name]] if col_of[name] < len(r) else None
            if not isinstance(v, (int, float)):
                ok = False
                break
            vals[key] = round(float(v), 2)
        if not ok:
            continue
        dates.append(xlsx_serial_to_iso(r[date_col]))
        for key, v in vals.items():
            series[key].append(v)

    out = {
        "source": "Federal Reserve Bank of New York, The Labor Market for Recent College Graduates",
        "url": "https://www.newyorkfed.org/research/college-labor-market",
        "unit": "unemployment rate, percent",
        "fetched": date.today().isoformat(),
        "dates": dates,
        "series": series,
    }
    path = OUT_DIR / "cohort-unemployment-data.json"
    path.write_text(json.dumps(out, separators=(",", ":")) + "\n")
    print(f"{path.name}: {len(dates)} months, {dates[0]} → {dates[-1]}, "
          f"latest grads={series['grads'][-1]} all={series['all'][-1]}")


# ---- Canaries: software developer employment index by age -------------------

def bake_canaries():
    zf = zipfile.ZipFile(io.BytesIO(fetch(CANARIES_URL)))
    with zf.open("canaries_software_developers.csv") as f:
        rows = list(csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig")))
    missing = set(CANARIES_SERIES) - set(rows[0])
    if missing:
        raise SystemExit(f"Canaries columns missing: {missing}; got {list(rows[0])}")

    rows.sort(key=lambda r: r["observation_date"])
    dates = [r["observation_date"] for r in rows]
    series = {key: [round(float(r[name]), 2) for r in rows]
              for name, key in CANARIES_SERIES.items()}

    out = {
        "source": "Stanford Digital Economy Lab, Canaries in the Coal Mine (ADP payroll data)",
        "url": "https://digitaleconomy.stanford.edu/project/indicators/canaries-dashboard/",
        "unit": "employment index, 100 = Nov 2022",
        "normDate": "2022-11-01",
        "vintage": rows[-1].get("vintage", ""),
        "fetched": date.today().isoformat(),
        "dates": dates,
        "series": series,
    }
    path = OUT_DIR / "cohort-swe-age-data.json"
    path.write_text(json.dumps(out, separators=(",", ":")) + "\n")
    print(f"{path.name}: {len(dates)} months, {dates[0]} → {dates[-1]}, "
          f"latest 22-25={series['g2225'][-1]} 50+={series['g50'][-1]}, vintage={out['vintage']}")


# ---- FRED: 10-year TIPS real yield (DFII10) ---------------------------------

def bake_fred():
    text = fetch(FRED_URL, ua=None).decode("utf-8-sig")
    rows = list(csv.reader(io.StringIO(text)))
    val_i = rows[0].index("DFII10")  # date column header varies; id column doesn't
    by_month = {}
    for r in rows[1:]:
        if not r or val_i >= len(r) or r[val_i] in ("", "."):
            continue
        by_month.setdefault(r[0][:7] + "-01", []).append(float(r[val_i]))
    dates = sorted(by_month)
    series = [round(sum(by_month[d]) / len(by_month[d]), 2) for d in dates]

    out = {
        "source": "Federal Reserve Bank of St. Louis (FRED), 10-year TIPS constant-maturity real yield (DFII10), monthly average of daily values",
        "url": "https://fred.stlouisfed.org/series/DFII10",
        "unit": "percent",
        "fetched": date.today().isoformat(),
        "dates": dates,
        "series": {"dfii10": series},
    }
    path = OUT_DIR / "rate-data.json"
    path.write_text(json.dumps(out, separators=(",", ":")) + "\n")
    print(f"{path.name}: {len(dates)} months, {dates[0]} → {dates[-1]}, "
          f"latest={series[-1]}, Dec 2021={series[dates.index('2021-12-01')]}")


if __name__ == "__main__":
    bake_nyfed()
    bake_canaries()
    bake_fred()
