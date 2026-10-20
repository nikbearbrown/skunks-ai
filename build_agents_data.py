#!/usr/bin/env python3
"""Slim the bearbrown.co agent catalog into static JSON for this site.
Usage: python3 build_agents_data.py /path/to/bearbrown_co
Writes data/agents/catalog.json (index) and data/agents/<slug>.json (detail)."""
import json,os,sys,shutil
src=sys.argv[1]; out=os.path.join(os.path.dirname(os.path.abspath(__file__)),"data","agents")
shutil.rmtree(out,ignore_errors=True); os.makedirs(out)
cat=json.load(open(f"{src}/data/agents/catalog.json")); det=json.load(open(f"{src}/data/agents/details.json"))
idx=[]
for e in cat:
    d=det.get(e["slug"]);
    if not d: continue
    ports=[i["id"] for i in d["implementations"] if i["status"]!="planned"]
    idx.append({"s":e["slug"],"t":e["title"],"d":e["description"][:160],"n":e["nodeCount"],"c":e["category"],"i":e["integrations"][:6],"p":ports})
    json.dump({"purpose":d["purpose"],"overview":d["overview"],"status":d["specification_status"],"entry":d["entry_nodes"],"terminal":d["terminal_nodes"],"unresolved":d["unresolved"],
      "impl":[{"id":i["id"],"label":i["label"],"status":i["status"],"path":i["path"]} for i in d["implementations"]],"mermaid":d["mermaid"]},
      open(f"{out}/{e['slug']}.json","w"),separators=(",",":"))
json.dump(idx,open(f"{out}/catalog.json","w"),separators=(",",":"))
print(len(idx),"agents")
