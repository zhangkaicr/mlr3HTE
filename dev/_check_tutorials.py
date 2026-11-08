# -*- coding: utf-8 -*-
"""Run every tutorial/code/*.R script in a fresh Rscript process.

Purpose: the website claims these scripts can be copied and run as-is. After the
v0.49 data-facade convergence, every old generator call was rewritten, so all 18
scripts need a real execution check rather than a grep.

Usage: python dev/_check_tutorials.py [--only <substring>]
Output: per-script OK/FAIL plus a summary; non-zero exit code on any failure.
"""
import os
import pathlib
import subprocess
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
CODE_DIR = ROOT / "tutorial" / "code"

# Windows 上的 shell 常带非法的 LC_ALL=C.UTF-8，R 会退回 "C"（MBCS=FALSE），
# 于是 UTF-8 中文源码里的字符串与注释出现 unexpected invalid token。
# 显式给子进程一个 R 认得的 UTF-8 locale，脚本内容与 R 代码本身都不用改。
R_ENV = os.environ.copy()
R_ENV["LC_ALL"] = "en_US.UTF-8"
R_ENV["LANG"] = "en_US.UTF-8"

only = None
if "--only" in sys.argv:
    only = sys.argv[sys.argv.index("--only") + 1]

scripts = sorted(CODE_DIR.glob("*.R"))
if only:
    scripts = [s for s in scripts if only in s.name]

results = []
for s in scripts:
    t0 = time.time()
    try:
        proc = subprocess.run(
            ["Rscript", str(s)],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=900,
            env=R_ENV,
        )
        ok = proc.returncode == 0
        detail = "" if ok else (proc.stderr or proc.stdout or "").strip().splitlines()[-6:]
        detail = "\n      ".join(detail) if detail else ""
    except subprocess.TimeoutExpired:
        ok, detail = False, "TIMEOUT after 900s"
    dt = time.time() - t0
    results.append((s.name, ok, detail, dt))
    print("%-4s %5.1fs  %s" % ("OK" if ok else "FAIL", dt, s.name), flush=True)
    if not ok:
        print("      " + detail, flush=True)

failed = [r for r in results if not r[1]]
print("\nscripts: %d   passed: %d   failed: %d" %
      (len(results), len(results) - len(failed), len(failed)))
print("FAILED: " + (", ".join(r[0] for r in failed) if failed else "NONE"))
sys.exit(1 if failed else 0)
