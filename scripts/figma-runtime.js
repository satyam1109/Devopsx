const created=[];const mutated=[];
const fontNames=[{family:'Inter',style:'Regular'},{family:'Inter',style:'Medium'},{family:'Inter',style:'Semi Bold'},{family:'Inter',style:'Bold'},{family:'Space Grotesk',style:'Bold'},{family:'Roboto Mono',style:'Regular'}];
await Promise.all(fontNames.map(f=>figma.loadFontAsync(f)));
const vars=await figma.variables.getLocalVariablesAsync();const variableByName=new Map(vars.map(v=>[v.name,v]));
const collections=await figma.variables.getLocalVariableCollectionsAsync();let tokenCollection=collections.find(c=>c.name==='Fieldwork / Retainzy foundations');
if(!tokenCollection){tokenCollection=figma.variables.createVariableCollection('Fieldwork / Retainzy foundations');tokenCollection.renameMode(tokenCollection.defaultModeId,'Value');}
const styles=await figma.getLocalTextStylesAsync();const styleMap=new Map(styles.map(s=>[s.name,s]));
function rgb(hex){hex=hex==='#fff'||hex==='white'?'#ffffff':hex;return {r:parseInt(hex.slice(1,3),16)/255,g:parseInt(hex.slice(3,5),16)/255,b:parseInt(hex.slice(5,7),16)/255}}
function colorValue(c){return c==='white'||c==='#fff'?'#ffffff':c||'#10213e'}
function token(c){c=colorValue(c);const semantic={'#2563eb':'accent','#10213e':'ink','#64748b':'muted','#eff6ff':'soft','#f8fafc':'canvas','#e3eaf4':'border','#ffffff':'panel','#0f766e':'success'};const name='color/'+(semantic[c]||c.slice(1));let v=variableByName.get(name);if(!v){v=figma.variables.createVariable(name,tokenCollection,'COLOR');v.scopes=['FRAME_FILL','SHAPE_FILL','TEXT_FILL','STROKE_COLOR'];v.setValueForMode(tokenCollection.defaultModeId,rgb(c));v.setVariableCodeSyntax('WEB','var(--'+name.replaceAll('/','-')+')');variableByName.set(name,v)}return v;}
function numberToken(value,role){const name=role+'/'+value;let v=variableByName.get(name);if(!v){v=figma.variables.createVariable(name,tokenCollection,'FLOAT');v.scopes=role==='radius'?['CORNER_RADIUS']:role==='stroke'?['STROKE_FLOAT']:['GAP'];v.setValueForMode(tokenCollection.defaultModeId,Number(value));v.setVariableCodeSyntax('WEB',String(value)+'px');variableByName.set(name,v)}return v;}
function paint(c){if(c==='none')return [];return [figma.variables.setBoundVariableForPaint({type:'SOLID',color:rgb(colorValue(c))},'color',token(c))]}
function registerNode(n){created.push(n.id);if(n.type==='INSTANCE')created.push(...n.findAll(()=>true).map(x=>x.id));return n}
function add(parent,n,x,y){parent.appendChild(n);if(parent.layoutMode&&parent.layoutMode!=='NONE')n.layoutPositioning='ABSOLUTE';n.x=x||0;n.y=y||0;return n;}
function box(parent,name,x,y,w,h,fill='none'){const n=registerNode(figma.createFrame());n.name=name;n.resize(Math.max(w,1),Math.max(h,1));n.clipsContent=false;n.fills=paint(fill);add(parent,n,x,y);return n;}
async function makeText(d,parent,offsetX=0,offsetY=0){const n=registerNode(figma.createText());const family=d.family||'Inter';const style=family==='Space Grotesk'?'Bold':family==='Roboto Mono'?'Regular':d.weight>=700?'Bold':d.weight>=600?'Semi Bold':d.weight>=500?'Medium':'Regular';const f={family,style};const name=family+'/'+style+'/'+d.size;let ts=styleMap.get(name);if(!ts){ts=figma.createTextStyle();ts.name=name;ts.fontName=f;ts.fontSize=d.size;ts.lineHeight={unit:'PIXELS',value:d.size*1.2};ts.letterSpacing={unit:'PIXELS',value:0};styleMap.set(name,ts)}await n.setTextStyleIdAsync(ts.id);n.characters=d.text;n.name=d.slot||d.text.slice(0,70);n.textAutoResize='WIDTH_AND_HEIGHT';n.fills=paint(d.fill);let x=Number(d.x||0)-offsetX;if(d['text-anchor']==='middle')x-=n.width/2;else if(d['text-anchor']==='end')x-=n.width;add(parent,n,x,Number(d.y||0)-offsetY-d.size*.98);return n;}
function styleBox(n,d){n.fills=paint(d.fill||'none');n.strokes=paint(d.stroke||'none');n.strokeWeight=1;n.setBoundVariable('strokeWeight',numberToken(1,'stroke'));n.strokeAlign='INSIDE';const r=Number(d.rx||0);n.cornerRadius=r;for(const field of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'])n.setBoundVariable(field,numberToken(r,'radius'));}
const componentMap={};
for(const [key,value] of Object.entries(componentLedger)){componentMap[key]=await figma.getNodeByIdAsync(value.id);}
const links=[];
async function makeNode(d,parent,ox=0,oy=0){
 if(d.type==='text')return makeText(d,parent,ox,oy);
 if(d.type==='rect'){const n=registerNode(figma.createRectangle());n.name=Number(d.height)>65?'Surface':'Shape';n.resize(Math.max(Number(d.width),.1),Math.max(Number(d.height),.1));styleBox(n,d);return add(parent,n,Number(d.x)-ox,Number(d.y)-oy)}
 if(d.type==='instance'){const main=componentMap[d.template];if(!main)throw Error('Missing component '+d.template);const n=registerNode(main.createInstance());n.name=main.name;parent.appendChild(n);if(parent.layoutMode&&parent.layoutMode!=='NONE')n.layoutPositioning='ABSOLUTE';n.resize(d.w,d.h);n.x=d.x-ox;n.y=d.y-oy;const info=componentLedger[d.template];if(info&&info.properties){const props={};for(const [slot,val] of Object.entries(d.fields||{})){if(info.properties[slot])props[info.properties[slot]]=val}if(Object.keys(props).length)n.setProperties(props)}if(d.href){n.name=(d.fields?.label||main.name)+' → '+d.href;links.push({id:n.id,href:d.href})}return n;}
 if(d.type==='svg'){let svg=d.svg;const n=figma.createNodeFromSvg(svg);created.push(n.id,...n.findAll(()=>true).map(x=>x.id));n.name='Icon vector';n.resize(Number(d.width),Number(d.height));return add(parent,n,Number(d.x||0)-ox,Number(d.y||0)-oy)}
 if(d.type==='path'){const nums=d.d.match(/-?\d+(?:\.\d+)?/g).map(Number);const x=Math.min(nums[0],nums[2]),y=Math.min(nums[1],nums[3]),w=Math.max(Math.abs(nums[0]-nums[2]),1),h=Math.max(Math.abs(nums[1]-nums[3]),1);const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}" fill="none"><path d="${d.d}" stroke="${d.stroke}"/></svg>`;const n=figma.createNodeFromSvg(svg);created.push(n.id,...n.findAll(()=>true).map(x=>x.id));n.name='Divider';return add(parent,n,x-ox,y-oy)}
 if(d.type==='a'){const bounds=descriptorBounds(d);const n=box(parent,'Link → '+d.href,bounds.x-ox,bounds.y-oy,bounds.w,bounds.h);for(const child of d.children)await makeNode(child,n,bounds.x,bounds.y);links.push({id:n.id,href:d.href});return n;}
 throw Error('Unsupported descriptor '+d.type);
}
function descriptorBounds(d){if(d.type==='text'){let w=d.text.length*d.size*.65,x=Number(d.x||0);if(d['text-anchor']==='middle')x-=w/2;else if(d['text-anchor']==='end')x-=w;return {x,y:Number(d.y)-d.size,w,h:d.size*1.4}}if(d.type==='rect'||d.type==='svg')return {x:Number(d.x||0),y:Number(d.y||0),w:Number(d.width),h:Number(d.height)};if(d.type==='instance')return {x:d.x,y:d.y,w:d.w,h:d.h};if(d.type==='path'){const v=d.d.match(/-?\d+(?:\.\d+)?/g).map(Number);return {x:Math.min(v[0],v[2]),y:Math.min(v[1],v[3]),w:Math.max(1,Math.abs(v[0]-v[2])),h:Math.max(1,Math.abs(v[1]-v[3]))}}const bounds=d.children.map(descriptorBounds);const x=Math.min(...bounds.map(x=>x.x)),y=Math.min(...bounds.map(x=>x.y));return {x,y,w:Math.max(...bounds.map(x=>x.x+x.w))-x,h:Math.max(...bounds.map(x=>x.y+x.h))-y};}
async function renderNodes(nodes,parent){
 const surfaces=[];
 for(const d of nodes){const b=descriptorBounds(d);let owner=null;
  for(const c of surfaces){if(b.x>=c.x-.1&&b.y>=c.y-.1&&b.x+b.w<=c.x+c.w+.5&&b.y+b.h<=c.y+c.h+.5){if(!owner||c.w*c.h<owner.w*owner.h)owner=c}}
  const p=owner?owner.node:parent,ox=owner?owner.x:0,oy=owner?owner.y:0;
  if(d.type==='rect'&&Number(d.width)>=60&&Number(d.height)>=28){const node=box(p,'Content panel',Number(d.x)-ox,Number(d.y)-oy,Number(d.width),Number(d.height));styleBox(node,d);surfaces.push({node,x:Number(d.x),y:Number(d.y),w:Number(d.width),h:Number(d.height)})}
  else await makeNode(d,p,ox,oy);
 }
}
