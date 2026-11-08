# -*- coding: utf-8 -*-
"""Stage 2 call-level converter: legacy data-generator calls -> 3 facades.

Usage: python dev/_stage2_convert.py [--apply]
Default is a dry run that reports every call it cannot map automatically.
"""
import pathlib, re, sys, json

APPLY = "--apply" in sys.argv
FACADE = {"continuous": "mlr3HTE_demo_continuous",
          "binary": "mlr3HTE_demo_binary",
          "survival": "mlr3HTE_demo_surv"}

# old name -> (kind, default outcome)
LEGACY = {
    "mlr3HTE_demo_data": ("dgp", "continuous"),
    "mlr3HTE_demo_obs": ("dgp_obs", "continuous"),
    "mlr3HTE_demo_obs_binary": ("dgp_obs", "binary"),
    "mlr3HTE_demo_obs_surv": ("dgp_obs", "survival"),
    "mlr3HTE_scenario": ("scenario", None),
    "mlr3HTE_scenarios": ("catalog_scen", "continuous"),
    "mlr3HTE_bench": ("bundled", None),
    "mlr3HTE_bench_index": ("catalog_bench", "continuous"),
    "mlr3HTE_dag_data": ("dag", "continuous"),
    "mlr3HTE_benchmark_data": ("benchmark", None),
    "mlr3HTE_benchmark_meta": ("catalog_xpkg", "continuous"),
    "mlr3HTE_benchmark_export": ("export", "continuous"),
    ".demo_continuous_rct": ("dgp", "continuous"),
    ".demo_continuous_obs": ("dgp_obs", "continuous"),
    ".demo_binary_obs": ("dgp_obs", "binary"),
    ".demo_binary_rct": ("dgp", "binary"),
    ".demo_surv_obs": ("dgp_obs", "survival"),
    ".demo_surv_rct": ("dgp", "survival"),
    ".demo_scenario": ("scenario", None),
    ".demo_scenarios": ("catalog_scen", "continuous"),
    ".demo_bench": ("bundled", None),
    ".demo_bench_index": ("catalog_bench", "continuous"),
    ".demo_dag_data": ("dag", "continuous"),
    ".demo_benchmark_data": ("benchmark", None),
    ".demo_benchmark_meta": ("catalog_xpkg", "continuous"),
    ".demo_benchmark_export": ("export", "continuous"),
}
NAME_RE = re.compile(r"(?<![\w.])(%s)\s*\(" % "|".join(re.escape(k) for k in LEGACY))

SKIP_FILES = {
    "CHANGELOG.md", "HANDOFF.md", "README.md", "README_EN.md",   # handled separately
    "dev/_stage2_convert.py", "dev/_stage2_internalize.py",
    "dev/_api_overview2.py", "dev/_gen_api_v34.py", "dev/_gen_docs_v34.py",
    "dev/_changelog_v34.md", "dev/_fix_case_015.R", "dev/_fix_example_cases.R",
    "docs/assets/js/_frag_api_index_v34.js", "docs/assets/js/_frag_api_v34.js",
    "docs/assets/js/content-changelog.js",
    "dev/_verify_benchdata.R", "dev/_probe_mp.R", "dev/_probe_pdp.R",
    "dev/_probe_dag_layers.R", "dev/_make_plot_figs.R",
}
SKIP_PREFIX = ("overview_", "mlr3HTE.Rcheck/", "man/", "dev/_audit/", ".git/", "renv/")


def split_args(s):
    """Split a call's argument text on top-level commas."""
    out, depth, quote, esc, cur = [], 0, None, False, []
    for ch in s:
        if quote:
            cur.append(ch)
            if esc: esc = False
            elif ch == "\\": esc = True
            elif ch == quote: quote = None
            continue
        if ch in "\"'`":
            quote = ch; cur.append(ch); continue
        if ch in "([{": depth += 1
        elif ch in ")]}": depth -= 1
        if ch == "," and depth == 0:
            out.append("".join(cur).strip()); cur = []
        else:
            cur.append(ch)
    tail = "".join(cur).strip()
    if tail: out.append(tail)
    return [a for a in out if a]


def parse_args(args):
    pos, kw = [], {}
    for a in split_args(args):
        m = re.match(r"^([A-Za-z_.][A-Za-z0-9_.]*)\s*=\s*(.*)$", a, re.S)
        if m: kw[m.group(1)] = m.group(2).strip()
        else: pos.append(a)
    return pos, kw


def literal_outcome(v):
    if v is None: return None
    m = re.fullmatch(r"['\"](continuous|binary|survival)['\"]", v.strip())
    return m.group(1) if m else None


def fmt(args):
    return ", ".join(args)


def convert(name, argtext, loc):
    kind, dflt = LEGACY[name]
    pos, kw = parse_args(argtext)
    out = None

    if kind in ("dgp", "dgp_obs"):
        base = FACADE[dflt]
        extra = ["setting = \"obs\""] if kind == "dgp_obs" else []
        out = "%s(%s)" % (base, fmt(extra + split_args(argtext)))

    elif kind in ("catalog_scen", "catalog_bench", "catalog_xpkg"):
        extra = {"catalog_scen": [],
                 "catalog_bench": ["source = \"bundled\""],
                 "catalog_xpkg": ["source = \"benchmark\""]}[kind]
        out = "mlr3HTE_demo_continuous(%s)" % fmt(["catalog = TRUE"] + extra)

    elif kind == "export":
        dest = kw.get("dest") or (pos[0] if pos else None)
        if dest is None:
            return "mlr3HTE_demo_continuous()", None  # signature shown in prose
        out = "mlr3HTE_demo_continuous(export_to = %s)" % dest

    elif kind == "benchmark":
        nm = kw.get("name") or (pos[0] if pos else None)
        args = ["source = \"benchmark\""]
        if nm is not None: args.append("dataset = %s" % nm)
        out = "mlr3HTE_demo_continuous(%s)" % fmt(args)

    elif kind == "scenario":
        oc = kw.get("outcome") or (pos[1] if len(pos) > 1 else None)
        oc = literal_outcome(oc) if oc is not None else "continuous"
        if oc is None: return None, "scenario outcome is a variable: %s" % argtext
        sid = kw.get("id") or (pos[0] if pos else None)
        if sid is None: return "mlr3HTE_demo_continuous()", None  # signature shown in prose
        rest = [a for a in split_args(argtext)
                if a != sid and not re.match(r"^(id|outcome)\s*=", a)
                and not (a.startswith("\"") and literal_outcome(a))]
        out = "%s(%s)" % (FACADE[oc], fmt(["scenario = %s" % sid] + rest))

    elif kind == "bundled":
        oc = kw.get("outcome") or (pos[1] if len(pos) > 1 else None)
        oc = literal_outcome(oc) if oc is not None else "continuous"
        if oc is None: return None, "bundled outcome is a variable: %s" % argtext
        did = kw.get("id") or (pos[0] if pos else None)
        if did is None: return "mlr3HTE_demo_continuous()", None  # signature shown in prose
        out = "%s(%s)" % (FACADE[oc], fmt(["source = \"bundled\"", "dataset = %s" % did]))

    elif kind == "dag":
        oc = kw.get("outcome") or (pos[1] if len(pos) > 1 else None)
        oc = literal_outcome(oc) if oc is not None else "continuous"
        if oc is None: return None, "dag outcome is a variable: %s" % argtext
        ds = kw.get("design") or (pos[0] if pos else None)
        # match.arg() used to pick "rct" when design was omitted; keep it explicit
        out = "%s(design = %s)" % (FACADE[oc], ds if ds is not None else '"rct"')

    return out, None


def find_close(text, start):
    """start = index of '('; return index of matching ')'."""
    depth, quote, esc = 0, None, False
    for i in range(start, len(text)):
        ch = text[i]
        if quote:
            if esc: esc = False
            elif ch == "\\": esc = True
            elif ch == quote: quote = None
            continue
        if ch in "\"'`": quote = ch; continue
        if ch == "(": depth += 1
        elif ch == ")":
            depth -= 1
            if depth == 0: return i
    return None


def convert_text(text, loc_prefix, roxygen_only=False):
    unmatched, count = [], 0
    lines = text.splitlines(keepends=True)
    for li, line in enumerate(lines):
        if roxygen_only and not line.lstrip().startswith("#'"): continue
        buf, cursor = [], 0
        for m in NAME_RE.finditer(line):
            old = m.group(1)
            open_i = line.find("(", m.start())
            close_i = find_close(line, open_i)
            if close_i is None: continue
            argtext = line[open_i + 1:close_i]
            new, err = convert(old, argtext, "%s:%d" % (loc_prefix, li + 1))
            if err:
                unmatched.append("%s:%d  %s  %s(%s)  -> %s" % (loc_prefix, li + 1, line.strip()[:90], old, argtext, err))
                continue
            buf.append(line[cursor:m.start()]); buf.append(new)
            cursor = close_i + 1; count += 1
        if buf:
            buf.append(line[cursor:])
            lines[li] = "".join(buf)
    return "".join(lines), count, unmatched


targets = []
for p in pathlib.Path(".").rglob("*"):
    if not p.is_file(): continue
    s = p.as_posix().lstrip("./")
    if s in SKIP_FILES or any(s.startswith(x) for x in SKIP_PREFIX): continue
    if any(s.startswith(x) or ("/" + x) in s for x in ("mlr3HTE.Rcheck",)): continue
    if p.suffix not in {".R", ".js", ".md"}: continue
    if s.startswith("R/"): pass
    elif not (s.startswith(("tests/", "tutorial/", "dev/", "docs/", "data-raw/")) or "/" not in s): continue
    targets.append(p)

all_unmatched, changed, total = [], [], 0
for p in sorted(targets):
    s = p.as_posix().lstrip("./")
    try: t = p.read_text(encoding="utf-8")
    except Exception: continue
    if not NAME_RE.search(t): continue
    new, n, um = convert_text(t, s, roxygen_only=s.startswith("R/"))
    all_unmatched += um; total += n
    if new != t:
        changed.append((s, n))
        if APPLY: p.write_text(new, encoding="utf-8")

for f, n in changed: print("CONVERT %3d  %s" % (n, f))
print("\nconverted calls:", total, "files:", len(changed), "APPLY:", APPLY)
print("\nUNMATCHED (%d):" % len(all_unmatched))
for u in all_unmatched: print("  " + u)
