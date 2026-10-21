const page=await figma.getNodeByIdAsync('0:1');await figma.setCurrentPageAsync(page);
const screenInfo={};
for(const def of screenBatch){
 const root=registerNode(figma.createAutoLayout(def.shell?'HORIZONTAL':'VERTICAL'));root.name=def.id+' / '+def.title;root.resize(def.width,def.height);root.layoutSizingHorizontal='FIXED';root.layoutSizingVertical='FIXED';root.primaryAxisSizingMode='FIXED';root.counterAxisSizingMode='FIXED';root.clipsContent=true;root.fills=paint(def.bg);root.itemSpacing=0;root.paddingTop=0;root.paddingBottom=0;root.paddingLeft=0;root.paddingRight=0;page.appendChild(root);root.x=160+(def.index%4)*1640;root.y=350+Math.floor(def.index/4)*1280;
 if(def.shell){
  const side=await makeNode({type:'instance',template:def.sidebar,x:0,y:0,w:234,h:1000},root);side.layoutPositioning='AUTO';side.layoutSizingHorizontal='FIXED';side.layoutSizingVertical='FIXED';
  const body=registerNode(figma.createAutoLayout('VERTICAL'));body.name='Workspace body';body.resize(1206,1000);body.fills=[];body.primaryAxisSizingMode='FIXED';body.counterAxisSizingMode='FIXED';root.appendChild(body);body.layoutSizingHorizontal='FIXED';body.layoutSizingVertical='FIXED';body.itemSpacing=0;
  const top=await makeNode({type:'instance',template:def.topbar,x:0,y:0,w:1206,h:76,fields:{breadcrumb:def.breadcrumb}},body);top.layoutPositioning='AUTO';top.layoutSizingHorizontal='FIXED';top.layoutSizingVertical='FIXED';
  const content=registerNode(figma.createFrame());content.name='Learning content';content.resize(1206,924);content.fills=[];content.clipsContent=false;body.appendChild(content);content.layoutSizingHorizontal='FIXED';content.layoutSizingVertical='FIXED';
  await renderNodes(def.body,content);
 }else{
  const content=registerNode(figma.createFrame());content.name='Screen content';content.resize(def.width,def.height);content.fills=[];content.clipsContent=false;root.appendChild(content);content.layoutSizingHorizontal='FIXED';content.layoutSizingVertical='FIXED';await renderNodes(def.body,content);
 }
 const descendants=root.findAll(()=>true);const types={};for(const n of descendants)types[n.type]=(types[n.type]||0)+1;
 const images=descendants.filter(n=>'fills' in n&&Array.isArray(n.fills)&&n.fills.some(f=>f.type==='IMAGE')).map(n=>({id:n.id,name:n.name,type:n.type,w:n.width,h:n.height}));
 const fontFamilies=[...new Set(root.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(x=>x.fontName.family)))];if(fontFamilies.some(f=>!['Inter','Space Grotesk','Roboto Mono'].includes(f)))throw Error('Unexpected font family');if(images.length)throw Error('Unexpected raster layer');
 screenInfo[def.id]={id:root.id,name:root.name,width:root.width,height:root.height,descendants:descendants.length,nodeTypes:types,fontFamilies,images};
}
return {createdNodeIds:created,mutatedNodeIds:mutated,screens:screenInfo,links,variableCount:variableByName.size,textStyleCount:styleMap.size};
