from pathlib import Path
import json,sys
mode=sys.argv[1];start=int(sys.argv[2]);end=int(sys.argv[3]);ledger=Path('design/figma-native/ledger.json');state=json.loads(ledger.read_text()) if ledger.exists() else {'components':{},'screens':{},'links':[]}
source=Path('scripts/figma-runtime.js').read_text()
if mode=='components':
 batch=json.loads(Path('design/figma-native/templates.json').read_text())[start:end]
 for i,d in enumerate(batch):d['index']=start+i
 head='const componentLedger='+json.dumps(state['components'])+';\nconst templateBatch='+json.dumps(batch)+';\n'
 tail=Path('scripts/figma-build-components.js').read_text()
else:
 batch=json.loads(Path('design/figma-native/screens.json').read_text())[start:end]
 for i,d in enumerate(batch):d['index']=start+i
 head='const componentLedger='+json.dumps(state['components'])+';\nconst screenBatch='+json.dumps(batch)+';\n'
 tail=Path('scripts/figma-build-screens.js').read_text()
Path('design/figma-native/next-call.js').write_text(head+source+tail)
print(len(head+source+tail),'characters')
