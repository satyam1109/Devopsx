const page=await figma.getNodeByIdAsync('2:2');await figma.setCurrentPageAsync(page);
const built={};
for(const def of templateBatch){
 const c=registerNode(figma.createComponent());c.name=def.name;c.description='Source-matched Fieldwork '+def.kind+'. Retainzy blue palette. Editable text and vectors.';c.resize(def.w,def.h);c.fills=[];c.clipsContent=false;c.x=80+(def.index%5)*480;c.y=80+Math.floor(def.index/5)*1120;page.appendChild(c);
 const properties={};
 if(def.kind==='Button'||def.kind==='Badge'){
  styleBox(c,def.nodes[0]);c.layoutMode='HORIZONTAL';c.primaryAxisSizingMode='FIXED';c.counterAxisSizingMode='FIXED';c.primaryAxisAlignItems=def.kind==='Button'?'CENTER':'MIN';c.counterAxisAlignItems='CENTER';for(const k of ['paddingLeft','paddingRight'])c.setBoundVariable(k,numberToken(def.kind==='Badge'?11:16,'space'));for(const k of ['paddingTop','paddingBottom','itemSpacing'])c.setBoundVariable(k,numberToken(0,'space'));
  const t=await makeText({...def.nodes[1],slot:'label'},c);t.layoutPositioning='AUTO';t.layoutSizingHorizontal='HUG';t.layoutSizingVertical='HUG';const property=c.addComponentProperty('Label','TEXT',def.fields.label);t.componentPropertyReferences={characters:property};properties.label=property;
 } else {
  await renderNodes(def.nodes,c);
  for(const [slot,value] of Object.entries(def.fields)){
   const t=c.findAllWithCriteria({types:['TEXT']}).find(t=>t.name===slot);if(t){const key=c.addComponentProperty(slot,'TEXT',value);t.componentPropertyReferences={characters:key};properties[slot]=key}
  }
 }
 const info={id:c.id,properties,name:c.name};componentMap[def.id]=c;componentLedger[def.id]=info;built[def.id]=info;
}
return {createdNodeIds:created,mutatedNodeIds:mutated,components:built,componentCount:Object.keys(built).length,variableCount:variableByName.size,textStyleCount:styleMap.size};
