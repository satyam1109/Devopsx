import xml.etree.ElementTree as E
from pathlib import Path
import json,re,copy,hashlib
NS='{http://www.w3.org/2000/svg}'
manifest=json.loads(Path('public/screens/manifest.json').read_text())
templates={};by_key={}
def num(x):return float(x or 0)
def convert(e):
 tag=e.tag.replace(NS,'');a=e.attrib
 if tag in ['title','desc']:return None
 n={'type':tag,**a}
 if tag=='text':
  n['text']=e.text or '';n['size']=num(a.get('font-size',14));n['weight']=int(a.get('font-weight',400));n['family']='Space Grotesk' if a.get('font-family','').startswith('Space') else ('Roboto Mono' if a.get('font-family')=='monospace' else 'Inter')
 if tag=='svg':
  n['svg']=E.tostring(e,encoding='unicode').replace('ns0:','').replace(':ns0','');n.pop('role',None)
  return n
 if tag=='a':n['children']=[c for c in (convert(x) for x in e) if c]
 return n

def bbox(n):
 t=n['type'];x=num(n.get('x'));y=num(n.get('y'))
 if t in ['rect','svg']:return [x,y,num(n.get('width')),num(n.get('height'))]
 if t=='text':
  z=n['size'];w=len(n['text'])*z*.54
  if n.get('text-anchor')=='end':x-=w
  elif n.get('text-anchor')=='middle':x-=w/2
  return [x,y-z*.98,w,z*1.2]
 if t=='path':
  nums=[float(x) for x in re.findall(r'-?\d+(?:\.\d+)?',n['d'])];xs=nums[::2];ys=nums[1::2];return [min(xs),min(ys),max(xs)-min(xs),max(ys)-min(ys)]
 if t=='a':
  b=[bbox(c) for c in n['children']];x=min(v[0] for v in b);y=min(v[1] for v in b);return [x,y,max(v[0]+v[2] for v in b)-x,max(v[1]+v[3] for v in b)-y]
 return [0,0,0,0]
def shift(n,x,y):
 n=copy.deepcopy(n);t=n['type']
 if t=='a':n['children']=[shift(c,x,y) for c in n['children']]
 elif t=='path':
  pts=[float(v) for v in re.findall(r'-?\d+(?:\.\d+)?',n['d'])];n['d']=f'M{pts[0]-x} {pts[1]-y} L{pts[2]-x} {pts[3]-y}'
 else:n['x']=num(n.get('x'))-x;n['y']=num(n.get('y'))-y
 return n

def register(kind,nodes,w,h,fields=None,key=None):
 identity=key or json.dumps(nodes,sort_keys=True)
 k=kind+identity
 if k in by_key:return by_key[k]
 id=f'{kind}-{len(templates):03d}';by_key[k]=id
 labels=[n.get('text','') for n in nodes if n['type']=='text']
 templates[id]={'id':id,'kind':kind,'name':kind+' / '+(' · '.join(labels)[:65] or id),'nodes':nodes,'w':w,'h':h,'fields':fields or {}}
 return id

def process(nodes):
 out=[];i=0
 while i<len(nodes):
  n=nodes[i];b=bbox(n)
  if n['type']=='svg':
   local=shift(n,b[0],b[1]);local['svg']=re.sub(r' x="[^"]*"','',local['svg'],count=1);local['svg']=re.sub(r' y="[^"]*"','',local['svg'],count=1);template=register('Icon',[local],b[2],b[3],key=local['svg']);out.append({'type':'instance','template':template,'x':b[0],'y':b[1],'w':b[2],'h':b[3],'fields':{}});i+=1;continue
  if n['type']=='a':
   c=n['children']
   if len(c)==2 and c[0]['type']=='rect' and c[1]['type']=='text' and num(c[0].get('height'))>=34:
    r,t=c;rb=bbox(r);style={k:r.get(k) for k in ['fill','stroke','rx']};style.update({k:t.get(k) for k in ['size','weight','family','fill']})
    # unique colors are preserved, with label and width supplied by instances
    style={'background':r.get('fill'),'stroke':r.get('stroke'),'radius':r.get('rx'),'textColor':t.get('fill'),'size':t['size'],'weight':t['weight'],'family':t['family']}
    template=register('Button',[shift(r,rb[0],rb[1]),shift(t,rb[0],rb[1])],rb[2],rb[3],{'label':t['text']},json.dumps(style,sort_keys=True))
    out.append({'type':'instance','template':template,'x':rb[0],'y':rb[1],'w':rb[2],'h':rb[3],'fields':{'label':t['text']},'href':n['href']});i+=1;continue
   n=copy.deepcopy(n);n['children']=process(c);out.append(n);i+=1;continue
  if n['type']=='rect' and num(n.get('height'))==25 and i+1<len(nodes) and nodes[i+1]['type']=='text':
   t=nodes[i+1];key=json.dumps({'fill':n.get('fill'),'stroke':n.get('stroke'),'color':t.get('fill'),'size':t['size'],'family':t['family']},sort_keys=True)
   template=register('Badge',[shift(n,b[0],b[1]),shift(t,b[0],b[1])],b[2],b[3],{'label':t['text']},key)
   out.append({'type':'instance','template':template,'x':b[0],'y':b[1],'w':b[2],'h':b[3],'fields':{'label':t['text']}});i+=2;continue
  if n['type']=='rect' and num(n.get('height'))==102 and i+3<len(nodes) and all(v['type']=='text' for v in nodes[i+1:i+4]):
   ts=nodes[i+1:i+4];base=[shift(v,b[0],b[1]) for v in [n]+ts];fields={f'text{j}':v['text'] for j,v in enumerate(ts)}
   for j,v in enumerate(base[1:]):v['slot']=f'text{j}'
   template=register('Metric card',base,b[2],b[3],fields,key='standard')
   out.append({'type':'instance','template':template,'x':b[0],'y':b[1],'w':b[2],'h':b[3],'fields':fields});i+=4;continue
  out.append(n);i+=1
 return out
screens=[]
for screen in manifest:
 r=E.parse('public/screens/'+screen['id']+'.svg').getroot();nodes=[n for n in (convert(e) for e in r) if n]
 shell=any(n['type']=='rect' and num(n.get('width'))==234 and num(n.get('height'))==1000 for n in nodes)
 bg=nodes.pop(0).get('fill','#f8fafc');data={**screen,'bg':bg,'shell':shell}
 if shell:
  sidebar=[];header=[];body=[]
  for n in nodes:
   x,y,w,h=bbox(n)
   if x+w<=234.1:sidebar.append(n)
   elif y+h<=77:header.append(shift(n,234,0))
   else:body.append(shift(n,234,76))
  sidebar=process(sidebar);header=process(header)
  sidekey=json.dumps(sidebar,sort_keys=True)
  sideid=register('Sidebar',sidebar,234,1000,key=sidekey)
  # Reuse header with breadcrumb slot.
  for n in header:
   if n['type']=='text' and num(n.get('x'))==134:n['slot']='breadcrumb'
  value=next((n['text'] for n in header if n.get('slot')=='breadcrumb'),'Your workspace')
  hid=register('Topbar',header,1206,76,{'breadcrumb':value},key='standard')
  data['sidebar']=sideid;data['topbar']=hid;data['breadcrumb']=value;data['body']=process(body)
 else:data['body']=process(nodes)
 screens.append(data)
# Components depend on simpler buttons/badges; insertion order matches preprocessing.
Path('design/figma-native/templates.json').write_text(json.dumps(list(templates.values()),ensure_ascii=False))
Path('design/figma-native/screens.json').write_text(json.dumps(screens,ensure_ascii=False))
Path('design/figma-native/discovery.json').write_text(json.dumps({'codeConnect':'No matching Code Connect files found.','existingScreens':'New file: page 0:1 was empty.','libraries':'SDS discovered and searched; generic components and blue tokens differ from source-mandated Retainzy palette and Space Grotesk typography.','decision':'Build minimal local components from the supplied screen source and verified Retainzy tokens.','scope':'38 screen states, source-matched fonts, local repeated atoms and shell, clickable primary flow. No backend or complete production design-system expansion.','images':'No external bitmap images in source. Icons are inline SVG and imported as vectors.'},indent=2))
print('Prepared',len(screens),'native screens and',len(templates),'reusable templates')
