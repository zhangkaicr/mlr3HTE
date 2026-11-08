# -*- coding: utf-8 -*-
"""Stage 2: turn legacy data generators in R/ into unexported internals."""
import re, pathlib

root = pathlib.Path(".")

mapping = [
    ("mlr3HTE_demo_obs_binary", ".demo_binary_obs"),
    ("mlr3HTE_demo_obs_surv",   ".demo_surv_obs"),
    ("mlr3HTE_demo_data",       ".demo_continuous_rct"),
    ("mlr3HTE_demo_obs",        ".demo_continuous_obs"),
    ("mlr3HTE_scenarios",       ".demo_scenarios"),
    ("mlr3HTE_scenario",        ".demo_scenario"),
    ("mlr3HTE_bench_index",     ".demo_bench_index"),
    ("mlr3HTE_bench",           ".demo_bench"),
    ("mlr3HTE_dag_data",        ".demo_dag_data"),
    ("mlr3HTE_benchmark_data",  ".demo_benchmark_data"),
    ("mlr3HTE_benchmark_meta",  ".demo_benchmark_meta"),
    ("mlr3HTE_benchmark_export",".demo_benchmark_export"),
]

# definition line -> its name; roxygen block immediately above must go
def_re = re.compile(r"^(%s)\s*<-\s*function" % "|".join(re.escape(k) for k, _ in mapping))

changed = []
for p in sorted((root / "R").glob("*.R")):
    if p.name == "demo.R":
        continue
    text = p.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)

    # 1) remove roxygen blocks attached to legacy definitions
    out, i, dropped = [], 0, 0
    while i < len(lines):
        m = def_re.match(lines[i].rstrip("\r\n"))
        if m:
            # walk back over contiguous #' lines in `out`
            j = len(out) - 1
            while j >= 0 and out[j].lstrip().startswith("#'"):
                j -= 1
            if j < len(out) - 1:
                del out[j + 1:]
                dropped += 1
            out.append(lines[i])
        else:
            out.append(lines[i])
        i += 1
    text = "".join(out)

    # 2) rename every remaining reference (definition + internal calls + docs)
    for old, new in mapping:
        text = re.sub(r"\b%s\b" % re.escape(old), new.replace("\\", "\\\\"), text)

    (p.parent / p.name).write_text(text, encoding="utf-8")
    changed.append((p.as_posix(), dropped))

for f, d in changed:
    if d:
        print(f"{f}: removed {d} roxygen block(s)")
print("R/ files scanned:", len(changed))
