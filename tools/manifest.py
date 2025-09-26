# tools/build_manifest.py
import os, json, re
from functools import cmp_to_key

ROOT = os.getcwd()
AUTHOR_DIRS = [
    "PatternKit_Winifred_Aldrich",
    "PatternKit_Helen Joseph-Armstrong",
    "PatternKit_Guido_Hofenbitzer",
    "PatternKit_Muller_&_Sohn",
    "PatternKit_Injoo_&_Mikyung",
    "PatternKit_Sylvia_Rosen",
    "PatternKit_Michael_Rohr",
    "PatternKit_Lot13_Studio",
    "PatternKit_Fernando_Burgo",
]
MINITOOLS_DIR = "PatternKit_MiniTools"

SEMVER_RE = re.compile(r"^v(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z\.-]+)?$")  # v1.2.3 or v1.2.3-beta.1
EDITION_RE = re.compile(r"^ed(\d+)$", re.IGNORECASE)

def parse_semver(vstr):
    """Return (major, minor, patch, pre) where pre='' for stable."""
    m = SEMVER_RE.match(vstr if vstr.startswith('v') else 'v' + vstr)
    if not m:
        return (0, 0, 0, "")
    major, minor, patch = map(int, m.group(1,2,3))
    pre = m.group(4) or ""
    return (major, minor, patch, pre)

def semver_desc(a, b):
    """Sort for descending order: stable > prerelease at same core."""
    A = parse_semver(a); B = parse_semver(b)
    # compare core numbers
    if A[:3] != B[:3]:
        return -1 if A[:3] > B[:3] else 1
    # stable outranks prerelease
    a_pre, b_pre = A[3], B[3]
    if a_pre == b_pre:
        return 0
    if a_pre == "":
        return -1
    if b_pre == "":
        return 1
    # both prereleases: lexical reverse for descending
    return -1 if a_pre > b_pre else 1

def list_jsx(dirpath):
    return [f for f in os.listdir(dirpath) if f.lower().endswith(".jsx")]

def parse_module_filename(filename):
    """
    Modules: <family>_<author...>_[edN]?_vX.Y.Z[-pre].jsx
    Returns dict with family, edition (or None), version, beta, file.
    """
    name = filename[:-4]  # strip .jsx
    parts = name.split("_")

    # find version token index
    v_idx = next((i for i,p in enumerate(parts) if SEMVER_RE.match(p if p.startswith("v") else "v"+p)), -1)
    if v_idx == -1:
        return None

    # optional edition token is any 'edN' before version
    ed_token = None
    for i in range(v_idx - 1, -1, -1):
        if EDITION_RE.match(parts[i]):
            ed_token = parts[i]
            break

    version_token = parts[v_idx]
    version = version_token[1:] if version_token.startswith("v") else version_token
    is_beta = "-" in version
    family = parts[0]  # first token only

    edition = None
    if ed_token:
        m = EDITION_RE.match(ed_token)
        edition = m.group(1) if m else None  # digits only, e.g., "6"

    return {
        "family": family,
        "edition": edition,  # '6' or None
        "version": version,
        "beta": is_beta,
        "file": filename
    }

def parse_minitool_filename(filename):
    """
    MiniTools: <toolname>_vX.Y.Z[-pre].jsx
    """
    name = filename[:-4]
    parts = name.split("_")
    v_idx = next((i for i,p in enumerate(parts) if SEMVER_RE.match(p if p.startswith("v") else "v"+p)), -1)
    if v_idx == -1:
        return None
    version_token = parts[v_idx]
    version = version_token[1:] if version_token.startswith("v") else version_token
    is_beta = "-" in version
    toolname = "_".join(parts[:v_idx])
    return {
        "family": toolname,
        "edition": None,
        "version": version,
        "beta": is_beta,
        "file": filename
    }

def pick_latest(entries):
    """
    entries: list of dicts with 'version' and 'beta'.
    Returns (stable_entry_or_None, beta_entry_or_None) – latest of each.
    """
    stables = [e for e in entries if not e["beta"]]
    betas = [e for e in entries if e["beta"]]
    stables.sort(key=cmp_to_key(lambda a,b: semver_desc(a["version"], b["version"])))
    betas.sort(key=cmp_to_key(lambda a,b: semver_desc(a["version"], b["version"])))
    return (stables[0] if stables else None, betas[0] if betas else None)

def build_dir(dir_name, is_minitools=False):
    path = os.path.join(ROOT, dir_name)
    if not os.path.exists(path):
        return {}

    files = list_jsx(path)
    parsed = []
    for f in files:
        item = parse_minitool_filename(f) if is_minitools else parse_module_filename(f)
        if item:
            parsed.append(item)

    # group by (family, edition) so different editions are reported separately
    groups = {}
    for it in parsed:
        key = (it["family"], it["edition"])  # edition can be None
        groups.setdefault(key, []).append(it)

    out = {}
    for (family, edition), arr in groups.items():
        stable, beta = pick_latest(arr)
        # Build entry; if an edition exists, nest under 'editions'
        entry_payload = {}
        if stable:
            entry_payload["latest"] = stable["file"]
            entry_payload["stable_version"] = stable["version"]
        if beta:
            entry_payload["beta"] = beta["file"]
            entry_payload["beta_version"] = beta["version"]

        # Description (lightweight)
        entry_payload["description"] = (family.replace("_", " ") + (" script" if not is_minitools else ""))

        # Insert into output, with edition-aware structure
        if edition is None or is_minitools:
            # No edition: put fields at top-level of this family
            if family not in out:
                out[family] = entry_payload
            else:
                # merge: prefer newer stable/beta if present
                out[family].update({k:v for k,v in entry_payload.items() if k not in out[family] or k.endswith("_version")})
        else:
            # Editioned family: create editions sub-object
            if family not in out:
                out[family] = {"editions": {}}
            if "editions" not in out[family]:
                out[family]["editions"] = {}
            out[family]["editions"][edition] = entry_payload

    return out

def main():
    manifest = {}
    for d in AUTHOR_DIRS:
        manifest[d] = build_dir(d, is_minitools=False)
    manifest[MINITOOLS_DIR] = build_dir(MINITOOLS_DIR, is_minitools=True)

    with open(os.path.join(ROOT, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print("✓ manifest.json updated")

if __name__ == "__main__":
    main()
