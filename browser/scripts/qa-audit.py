#!/usr/bin/env python3
"""QA audit for golden format compliance across all plenary YAML files."""
import yaml, glob, os, sys, re

VALID_ACTION_TYPES = {
    "accepts", "acknowledges", "adoption", "adopts", "agrees", "allocates",
    "appoints", "appreciates", "appreciation", "approves", "asks", "assigns",
    "chairs", "communicating", "confirms", "considers", "consults", "creates",
    "decides", "defines", "delegates", "delivering", "directs", "disbands",
    "drafting", "elects", "empowers", "encourages", "endorses", "estabilishes",
    "establishes", "gathering", "identifies", "instructs", "investigates",
    "nominates", "notes", "notifies", "recognises", "recognizes", "reminds",
    "recommends", "registers", "regrets", "request", "replaces", "requests",
    "resolves", "restates", "scopes", "secures", "sends", "supports", "thanks",
    "welcomes", "withdraws", "unanimous", "majority", "minority"
}

VALID_CONSIDERATION_TYPES = {
    "acknowledging", "following", "basing", "considering", "identifying",
    "according", "noting", "recalling", "recognises", "recognising", "recognizing"
}

issues = []
stats = {
    "files": 0,
    "resolutions": 0,
    "acclamations": 0,
    "with_considerations": 0,
    "with_titles": 0,
    "with_literal_messages": 0,
}

for f in sorted(glob.glob("plenary/*.yaml")):
    stats["files"] += 1
    fname = os.path.basename(f)
    
    with open(f) as fh:
        try:
            data = yaml.safe_load(fh)
        except Exception as e:
            issues.append(f"  {fname}: YAML PARSE ERROR: {e}")
            continue
    
    for i, res in enumerate(data.get("resolutions", [])):
        stats["resolutions"] += 1
        rid = str(res.get("identifier", ""))
        is_acclaim = "-acclaim-" in rid
        if is_acclaim:
            stats["acclamations"] += 1
        
        # Check title
        title = res.get("title", "") or ""
        if not title.strip():
            issues.append(f"  {fname} #{rid}: NO TITLE")
        else:
            stats["with_titles"] += 1
            if title.endswith("..."):
                issues.append(f"  {fname} #{rid}: TITLE IS TRUNCATED ({title[:50]}...)")
            if len(title) < 10:
                issues.append(f"  {fname} #{rid}: TITLE TOO SHORT ({title!r})")
        
        # Check actions
        for j, action in enumerate(res.get("actions", [])):
            atype = action.get("type", "")
            msg = action.get("message", "") or ""
            
            # Invalid action type
            if atype and atype not in VALID_ACTION_TYPES:
                issues.append(f"  {fname} #{rid} action[{j}]: INVALID ACTION TYPE {atype!r}")
            
            # Empty message
            if msg.strip() in ("", "."):
                issues.append(f"  {fname} #{rid} action[{j}]: EMPTY MESSAGE ({msg!r})")
            
            # Inline message (no newlines and long) — heuristic for single-quoted
            if len(msg) > 100 and "\n" not in msg:
                issues.append(f"  {fname} #{rid} action[{j}]: POSSIBLE INLINE MESSAGE (long, no newlines)")
        
        # Check considerations
        for j, cons in enumerate(res.get("considerations", [])):
            ctype = cons.get("type", "")
            if ctype and ctype not in VALID_CONSIDERATION_TYPES:
                issues.append(f"  {fname} #{rid} consideration[{j}]: INVALID CONSIDERATION TYPE {ctype!r}")
        
        if res.get("considerations"):
            stats["with_considerations"] += 1
        
        # Check if first action message is literal (has newlines or is short)
        actions = res.get("actions", [])
        if actions:
            first_msg = actions[0].get("message", "") or ""
            if "\n" in first_msg or len(first_msg) < 100:
                stats["with_literal_messages"] += 1

# Summary
print("=" * 70)
print("GOLDEN FORMAT QA AUDIT")
print("=" * 70)
print()
print("Files scanned:             %d" % stats["files"])
print("Total resolutions:         %d" % stats["resolutions"])
print("Acclamations:              %d" % stats["acclamations"])
print("With titles:               %d (%.0f%%)" % (stats["with_titles"], stats["with_titles"]/stats["resolutions"]*100))
print("With considerations:       %d (%.0f%%)" % (stats["with_considerations"], stats["with_considerations"]/stats["resolutions"]*100))
print("With literal messages:     %d (%.0f%%)" % (stats["with_literal_messages"], stats["with_literal_messages"]/stats["resolutions"]*100))
print()
if issues:
    print("ISSUES FOUND: %d" % len(issues))
    print("-" * 70)
    for issue in issues:
        print(issue)
else:
    print("NO ISSUES FOUND")
print()
