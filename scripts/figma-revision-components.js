const page=await figma.getNodeByIdAsync('2:2');await figma.setCurrentPageAsync(page);
const created=[],mutated=[],removed=[];
const textNodes=page.findAllWithCriteria({types:['TEXT']});const fonts=new Map();for(const t of textNodes)for(const seg of t.getStyledTextSegments(['fontName']))fonts.set(seg.fontName.family+'/'+seg.fontName.style,{family:seg.fontName.family,style:seg.fontName.style});await Promise.all([...fonts.values()].map(f=>figma.loadFontAsync(f)));
const replace=s=>s.replace(/fieldwork/gi,'Devopsx.si');for(const n of page.findAll(()=>true)){if(n.type==='TEXT'&&/fieldwork/i.test(n.characters)){n.characters=replace(n.characters);if(n.characters==='Devopsx.si')n.fontSize=22;mutated.push(n.id);}if(/fieldwork/i.test(n.name)){n.name=replace(n.name);mutated.push(n.id);}if(n.type==='COMPONENT'&&/fieldwork/i.test(n.description)){n.description=replace(n.description);mutated.push(n.id);}}
function remove(n){removed.push(n.id,...('findAll' in n?n.findAll(()=>true).map(c=>c.id):[]));n.remove();}
const sideIds=['3:82','3:227','3:322','3:437','3:526','3:615','3:709','3:795'];
for(const id of sideIds){const side=await figma.getNodeByIdAsync(id);const origin=side.absoluteBoundingBox;const all=side.findAll(()=>true);const doomed=[];
 for(const n of all){if(n.name==='Link → #team'){doomed.push(n);continue;}const b=n.absoluteBoundingBox;if(!b)continue;const x=b.x-origin.x,y=b.y-origin.y;
  if(n.type==='TEXT'&&['Personal workspace','LEARN & BUILD','WORKSPACE'].includes(n.characters))doomed.push(n);
  else if(y>=790&&y<910&&b.height<150)doomed.push(n);
  else if(n.type==='RECTANGLE'&&Math.abs(x-22)<1&&Math.abs(y-94)<1&&b.width===190)doomed.push(n);
  else if(n.type==='INSTANCE'&&Math.abs(x-35)<1&&Math.abs(y-107)<1)doomed.push(n);
 }
 const doomedIds=new Set(doomed.map(n=>n.id));const highest=[];for(const n of doomed){let p=n.parent,ancestor=false;while(p&&p.id!==side.id){if(doomedIds.has(p.id)){ancestor=true;break;}p=p.parent;}if(!ancestor)highest.push(n);}for(const n of highest)remove(n);
 for(const n of side.findAll(()=>true)){if(n.name.startsWith('Link → #')){if(n.name==='Link → #settings')n.y-=125;else n.y-=80;mutated.push(n.id);}else if(n.name==='Divider'&&Math.abs(n.y-510)<2){n.y-=80;mutated.push(n.id);}}
 mutated.push(side.id);
}
const collections=await figma.variables.getLocalVariableCollectionsAsync();for(const c of collections)if(/fieldwork/i.test(c.name))c.name=replace(c.name);
const vars=await figma.variables.getLocalVariablesAsync();const vm=new Map(vars.map(v=>[v.name,v]));function fill(name){const v=vm.get(name);if(!v)throw Error('Missing token '+name);return [figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',v)];}
const progress=figma.createComponent();created.push(progress.id);progress.name='Progress / Journey bar';progress.description='Journey and category progress. Instance foreground width represents completion. Pair with a right-aligned percentage label.';progress.layoutMode='HORIZONTAL';progress.primaryAxisSizingMode='FIXED';progress.counterAxisSizingMode='FIXED';progress.resize(400,6);progress.cornerRadius=3;progress.clipsContent=true;progress.fills=fill('color/e8eef7');progress.itemSpacing=0;progress.paddingLeft=0;progress.paddingTop=0;progress.paddingRight=0;progress.paddingBottom=0;progress.x=1800;progress.y=850;
const foreground=figma.createRectangle();created.push(foreground.id);foreground.name='Completed portion';foreground.resize(140,6);foreground.cornerRadius=3;foreground.fills=fill('color/accent');progress.appendChild(foreground);foreground.layoutSizingHorizontal='FIXED';foreground.layoutSizingVertical='FIXED';
return {createdNodeIds:created,mutatedNodeIds:mutated,removedNodeIds:removed,progressComponentId:progress.id,sidebarsUpdated:sideIds,remainingTeamLabels:page.findAllWithCriteria({types:['TEXT']}).filter(n=>n.characters==='Team overview').map(n=>n.id),remainingBranding:page.findAllWithCriteria({types:['TEXT']}).filter(n=>/fieldwork/i.test(n.characters)).map(n=>n.id)};
