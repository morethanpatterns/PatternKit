# tools/build_manifest.py
import os, json, re
from functools import cmp_to_key

ROOT = os.getcwd()
AUTHOR_DIRS = [
    "PatternKit_Winifred_Aldrich",
    "PatternKit_Helen_Joseph_Armstrong",
    "PatternKit_Guido_Hofenbitzer",
    "PatternKit_Muller_Sohn",
    "PatternKit_Injoo_Mikyung",
    "PatternKit_Sylvia_Rosen",
    "PatternKit_Michael_Rohr",
    "PatternKit_Lot13_Studio",
    "PatternKit_Fernando_Burgo",
]
MINITOOLS_DIR = "PatternKit_MiniTools"

SEMVER_RE = re.compile(r"^v(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z\.-]+)?$")
EDITION_RE = re.compile(r"^ed(\d+)$", re.IGNORECASE)


def parse_semver(vstr):
    """Return (major, minor, patch, pre) where pre='' for stable."""
    m = SEMVER_RE.match(vstr if vstr.startswith('v') else 'v' + vstr)
    if not m:
        return (0, 0, 0, "")
    major, minor, patch = map(int, m.group(1, 2, 3))
    pre = m.group(4) or ""
    return (major, minor, patch, pre)


def semver_desc(a, b):
    """Sort for descending order: stable > prerelease at same core."""
    A = parse_semver(a)
    B = parse_semver(b)
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
    return -1 if a_pre > b_pre else 1


def list_jsx(dirpath):
    return [f for f in os.listdir(dirpath) if f.lower().endswith(".jsx")]


def parse_module_filename(filename):
    """
    Modules: <family...>_<author...>_[edN]?_vX.Y.Z[-pre].jsx
    Example: standard_trouser_block_guido_ed6_v1.0.0-beta.jsx
    """
    name = filename[:-4]  # strip .jsx
    parts = name.split("_")

    # find version token index
    v_idx = next((i for i, p in enumerate(parts)
                  if SEMVER_RE.match(p if p.startswith("v") else "v" + p)), -1)
    if v_idx == -1:
        return None

    # optional edition token like ed6
    ed_idx = None
    for i in range(v_idx - 1, -1, -1):
        if EDITION_RE.match(parts[i]):
            ed_idx = i
            break

    # known author/system tokens (lowercase)
    KNOWN_AUTHOR_TOKENS = {
        "winifred", "aldrich",
        "helen", "joseph", "armstrong",
        "guido", "hofenbitzer",
        "muller", "müller", "sohn",
        "injoo", "mikyung",
        "sylvia", "rosen",
        "michael", "rohr",
        "lot13", "studio",
        "fernando", "burgo",
    }

    # locate first author token before version
    author_idx = -1
    upper_bound = ed_idx if ed_idx is not None else v_idx
    for i in range(0, upper_bound):
        if parts[i].lower() in KNOWN_AUTHOR_TOKENS:
            author_idx = i
            break

    # family tokens = everything before the author
    cutoff = author_idx if author_idx != -1 else (ed_idx if ed_idx is not None else v_idx)
    family_tokens = parts[:cutoff] or [parts[0]]
    family = "_".join(family_tokens)

    version_token = parts[v_idx]
    version = version_token[1:] if version_token.startswith("v") else version_token
    is_beta = "-" in version

    edition = None
    if ed_idx is not None:
        m = EDITION_RE.match(parts[ed_idx])
        if m:
            edition = m.group(1)  # e.g., "6"

    return {
        "family": family,
        "edition": edition,
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
    v_idx = next((i for i, p in enumerate(parts)
                  if SEMVER_RE.match(p if p.startswith("v") else "v" + p)), -1)
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
    stables = [e for e in entries if not e["beta"]]
    betas = [e for e in entries if e["beta"]]
    stables.sort(key=cmp_to_key(lambda a, b: semver_desc(a["version"], b["version"])))
    betas.sort(key=cmp_to_key(lambda a, b: semver_desc(a["version"], b["version"])))
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

    groups = {}
    for it in parsed:
        key = (it["family"], it["edition"])
        groups.setdefault(key, []).append(it)

    out = {}
    for (family, edition), arr in groups.items():
        stable, beta = pick_latest(arr)
        entry_payload = {}
        if stable:
            entry_payload["latest"] = stable["file"]
            entry_payload["stable_version"] = stable["version"]
        if beta:
            entry_payload["beta"] = beta["file"]
            entry_payload["beta_version"] = beta["version"]

        entry_payload["description"] = family.replace("_", " ") + (
            " script" if not is_minitools else ""
        )

        if edition is None or is_minitools:
            out[family] = entry_payload
        else:
            if family not in out:
                out[family] = {"editions": {}}
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
