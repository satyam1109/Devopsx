from pathlib import Path
from html import escape
import json, textwrap

OUT=Path('public/screens'); OUT.mkdir(parents=True,exist_ok=True)
BLUE='#2563eb'; INK='#10213e'; MUTED='#64748b'; LINE='#e3eaf4'; SOFT='#eff6ff'; BG='#f8fafc'; TEAL='#0f766e'
s=[]; manifest=[]
def raw(x):s.append(x)
def rect(x,y,w,h,fill='white',stroke='none',r=12):raw(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}"/>')
def text(x,y,t,size=14,color=INK,weight=400,font='Inter, Arial, sans-serif',anchor='start'):
 raw(f'<text x="{x}" y="{y}" font-family="{font}" font-size="{size}" font-weight="{weight}" fill="{color}" text-anchor="{anchor}">{escape(str(t))}</text>')
def heading(x,y,t,size=28,color=INK):text(x,y,t,size,color,700,'Space Grotesk, Inter, Arial, sans-serif')
def lines(x,y,t,width=70,size=14,color=MUTED,gap=23):
 for i,l in enumerate(textwrap.wrap(t,width=width)):text(x,y+i*gap,l,size,color)
def line(x,y,x2,y2,color=LINE):raw(f'<path d="M{x} {y} L{x2} {y2}" stroke="{color}"/>')
def link(target):raw(f'<a href="{target if target.startswith("https://") else "#"+target}" aria-label="{escape(target)}">')
def endlink():raw('</a>')
def btn(x,y,w,label,target='dashboard',kind='primary'):
 link(target);rect(x,y,w,44,BLUE if kind=='primary' else 'white',LINE if kind!='primary' else 'none',8);text(x+w/2,y+27,label,13,'white' if kind=='primary' else INK,600,anchor='middle');endlink()
def pill(x,y,label,fill=SOFT,color=BLUE,w=None):
 w=w or len(label)*6.4+22;rect(x,y,w,25,fill,r=6);text(x+11,y+17,label,10,color,600)
def ico(x,y,name,color=MUTED,size=20):
 icons={'grid':'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>','path':'<path d="M5 3v18M5 7h10a4 4 0 0 1 0 8H5m10 0 4 6"/>','book':'<path d="M12 5v16M3 4c5-1 7 0 9 2 3-2 6-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z"/>','cards':'<rect x="7" y="6" width="14" height="16" rx="2"/><path d="M17 2H4a2 2 0 0 0-2 2v13m10-5h5m-5 4h4"/>','check':'<path d="m5 12 4 4L19 6"/>','lock':'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>','arrow':'<path d="M4 12h16m-6-6 6 6-6 6"/>','spark':'<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>','code':'<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/>','search':'<circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/>','users':'<circle cx="9" cy="7" r="4"/><path d="M2 21v-3a6 6 0 0 1 12 0v3m2-17a4 4 0 0 1 0 8m2 3a5 5 0 0 1 4 6"/>','chart':'<path d="M4 3v17h17M9 15v-4m5 4V7m5 8V4"/>','clock':'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>','settings':'<path d="M3 7h18M3 17h18M8 3v8m8 2v8"/>','flag':'<path d="M5 22V3c6-3 8 3 14 0v11c-6 3-8-3-14 0"/>','bell':'<path d="M6 9a6 6 0 0 1 12 0c0 6 3 6 3 8H3c0-2 3-2 3-8m4 12h4"/>','sun':'<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>'}
 raw(f'<svg x="{x}" y="{y}" width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">{icons.get(name,icons["spark"])}</svg>')
def brand(x=30,y=30):
 rect(x,y,31,31,BLUE,r=8);ico(x+5,y+5,'path','white',21);heading(x+42,y+23,'fieldwork',24)
def begin(id,title,w=1440,h=1000,desc=''):
 s.clear();raw(f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="group" aria-labelledby="title desc"><title id="title">{escape(title)}</title><desc id="desc">{escape(desc or title)}</desc>');rect(0,0,w,h,BG,r=0)
 manifest.append({'id':id,'title':title,'width':w,'height':h})
def save(id):
 raw('</svg>');v=''.join(s);(OUT/f'{id}.svg').write_text(v);Path(f'design/figma-import/{id}.svg').write_text(v)
def shell(active='dashboard',label='Your workspace'):
 rect(0,0,234,1000,'white',r=0);line(234,0,234,1000);brand();rect(22,94,190,46,BG,LINE,9);ico(35,107,'code',BLUE);text(66,122,'Personal workspace',11,INK,600)
 text(30,180,'LEARN & BUILD',9,MUTED,600)
 for i,(id,l,ic) in enumerate([('dashboard','Overview','grid'),('journey','Learning journey','path'),('library','Resource library','book'),('card-concept','Flashcard practice','cards'),('checkpoint','Checkpoints','flag'),('labs','Hands-on labs','code')]):
  y=196+i*48;link(id)
  if active==id:rect(18,y,198,42,SOFT,r=8)
  ico(32,y+11,ic,BLUE if active==id else MUTED,19);text(65,y+26,l,12,BLUE if active==id else MUTED,600 if active==id else 400)
  if id=='labs':pill(170,y+12,'Soon',w=36)
  endlink()
 line(28,510,206,510);text(30,542,'WORKSPACE',9,MUTED,600)
 for i,(id,l,ic) in enumerate([('progress','My progress','chart'),('team','Team overview','users'),('settings','Preferences','settings')]):
  y=558+i*45;link(id)
  if active==id:rect(18,y,198,40,SOFT,r=8)
  ico(32,y+9,ic,BLUE if id==active else MUTED,18);text(65,y+24,l,12,BLUE if active==id else MUTED);endlink()
 rect(20,793,194,112,SOFT,r=10);ico(35,808,'spark',BLUE,18);text(35,849,'Small sessions. Real growth.',11,INK,600);text(35,870,'Build a habit in 10 minutes a day.',9,MUTED)
 line(20,926,214,926);rect(28,946,32,32,'#dbeafe',r=16);text(44,966,'AJ',10,BLUE,600,anchor='middle');text(71,958,'Alex Jordan',11,INK,600);text(71,975,'DevOps engineer',9,MUTED)
 rect(235,0,1205,76,'white',r=0);line(235,76,1440,76);text(270,44,'Workspace',12,MUTED);text(349,44,'/',12,'#cbd5e1');text(368,44,label,12,INK,500)
 link('library');rect(974,20,283,36,BG,LINE,7);ico(987,29,'search',MUTED,17);text(1013,43,'Search concepts, decks, resources',10,MUTED);endlink();ico(1283,28,'bell',MUTED,19);rect(1329,21,33,33,'#dbeafe',r=17);text(1345,42,'AJ',10,BLUE,600,anchor='middle');pill(1375,26,'Free',w=47)
 text(270,968,'FIELDWORK / DEVOPS TO FDE',9,MUTED,500);text(1398,968,'Design concept · illustrative learner data',9,MUTED,anchor='end')
def pagehead(title,sub,eyebrow='YOUR LEARNING WORKSPACE'):
 text(270,118,eyebrow,10,BLUE,600);heading(270,158,title,31);text(270,187,sub,13,MUTED)
def section(x,y,title,action=None,target='journey'):
 heading(x,y,title,18)
 if action:link(target);text(x+530,y,action+' →',11,BLUE,600);endlink()
def stat(x,y,w,value,label,detail):
 rect(x,y,w,102,'white',LINE);text(x+20,y+26,label,11,MUTED);heading(x+20,y+60,value,28);text(x+20,y+83,detail,10,MUTED)
def bar(x,y,w,ratio,color=BLUE):rect(x,y,w,5,'#e8eef7',r=3);rect(x,y,w*ratio,5,color,r=3)

# 01 Landing
begin('welcome','Welcome / Public landing',1440,1100)
rect(0,0,1440,1100,'white',r=0);brand(80,28)
for x,l,t in [(550,'The journey','journey'),(690,'Resource library','library'),(855,'How flashcards work','card-concept')]:link(t);text(x,50,l,12,MUTED,500);endlink()
btn(1120,24,100,'Log in','onboarding','outline');btn(1232,24,128,'Start free →','onboarding')
rect(80,126,345,29,SOFT,LINE,6);text(94,145,'BUILT FOR DEVOPS, SRE & CLOUD ENGINEERS',10,BLUE,600)
heading(80,227,'You know infrastructure.',49);heading(80,287,'Now make AI',49);heading(80,347,'your next strength.',49,BLUE)
lines(80,397,'Go from operating cloud systems to understanding, building and deploying AI. One clear explanation. One practical card. One step forward.',59,16,gap=27)
btn(80,508,196,'Start learning for free →','onboarding');btn(291,508,181,'Try a sample card','card-concept','outline')
text(80,583,'Free learning, always. No credit card. About 10 minutes a day.',11,MUTED)
# Hero illustration: infrastructure to AI stack
rect(830,155,475,405,SOFT,LINE,24)
for x,y,lab,sub,ic in [(868,193,'Infrastructure you know','Linux · Kubernetes · Terraform','code'),(902,307,'AI concepts that click','LLMs · Retrieval · Safe agents','spark'),(936,421,'Real-world delivery','Discover · Build · Deploy','flag')]:
 rect(x,y,322,91,'white',LINE,12);rect(x+16,y+20,45,45,SOFT,r=10);ico(x+27,y+31,ic,BLUE,23);heading(x+77,y+36,lab,16);text(x+77,y+61,sub,11,MUTED)
pill(1110,136,'YOUR NEXT CHAPTER',w=173);rect(1220,511,91,61,BLUE,r=12);text(1265,535,'7 phases',14,'white',600,anchor='middle');text(1265,555,'one clear path',9,'#dbeafe',anchor='middle')
line(80,638,1360,638)
for x,n,l in [(105,'01','Learn in familiar language'),(555,'02','Recall with practical flashcards'),(1015,'03','Apply it to real work')]:
 text(x,690,n,12,BLUE,600);heading(x,724,l,19)
lines(105,754,'Understand tokens, RAG and agents through concepts you already use in DevOps.',43,12)
lines(555,754,'Scenario cards build judgment. Daily spaced reviews help the ideas stay with you.',44,12)
lines(1015,754,'Build-it guides turn each phase into something you can explain and demonstrate.',41,12)
rect(80,855,1280,159,BG,LINE,15);heading(108,897,'Two goals. A shared foundation.',25);text(108,927,'Choose your direction. Switch whenever your goals change.',13,MUTED)
btn(725,884,262,'Learn AI · 6 phases →','onboarding','outline');btn(1003,884,307,'Become an FDE · 7 phases →','onboarding')
text(80,1060,'FIELDWORK',10,INK,600);text(1360,1060,'Learning is free. Paid labs are planned for a later release.',11,MUTED,anchor='end');save('welcome')

# Onboarding
begin('onboarding','Choose your learning goal');brand(60,35);pill(1200,42,'GET STARTED',w=142)
text(720,149,'A FAMILIAR START. A NEW DIRECTION.',11,BLUE,600,anchor='middle');heading(720,200,'Where do you want to go?',38);# correct centered title separately
# replace last heading with centered
s.pop();text(720,200,'Where do you want to go?',38,INK,700,'Space Grotesk, Inter, Arial, sans-serif','middle')
text(720,236,'Your cloud experience is the foundation. We’ll help you build from there.',14,MUTED,anchor='middle')
for x,title,tag,copy,items in [(290,'Learn AI','6 PHASES','Understand and apply AI in your engineering work.',['LLMs, prompting and Python','RAG, agents and MCP','Production, evals and guardrails']),(735,'Become an FDE','7 PHASES','Take AI from a customer problem to a working solution.',['Everything in Learn AI','Discovery and enterprise integrations','Scoping, demos and handover'])]:
 rect(x,284,415,297,'white',BLUE if x==735 else LINE,16);pill(x+25,309,tag);heading(x+25,369,title,27);lines(x+25,401,copy,47,13)
 for i,a in enumerate(items):ico(x+25,452+i*31,'check',BLUE,16);text(x+51,465+i*31,a,12,INK)
 if x==735:pill(x+280,309,'SELECTED',w=108)
btn(520,619,400,'Continue with GitHub','placement');btn(520,675,400,'Continue with Google','placement','outline');link('dashboard');text(720,756,'Continue with organization SSO →',12,BLUE,600,anchor='middle');endlink();link('card-concept');text(720,800,'Just exploring? Preview the first deck as a guest.',12,MUTED,anchor='middle');endlink();text(720,862,'After sign-in: optional 10–15 minute placement, or start with the fundamentals.',11,MUTED,anchor='middle');text(720,929,'Prototype: sign-in choices open an illustrative learner workspace.',10,MUTED,anchor='middle');save('onboarding')

# Dashboard
begin('dashboard','Learner overview');shell();pagehead('A little learning. A lasting advantage.','Welcome back, Alex. Your next step from DevOps to AI starts here.')
rect(270,218,746,244,SOFT,'#cfe0fc',15);pill(294,241,'TODAY’S SESSION',w=148);heading(294,304,'Keep the concepts close.',29);lines(294,337,'12 due reviews, then 5 new cards. A small session that builds on what you already know.',59,13)
btn(294,393,224,"Start today’s session →",'card-concept');text(539,420,'~10 min  ·  reviews come first',11,MUTED)
# miniature graph
for x,y,lab in [(854,267,'LEARN'),(904,327,'RECALL'),(854,387,'APPLY')]:rect(x,y,77,34,'white','#cfe0fc',8);text(x+38,y+21,lab,8,BLUE,600,anchor='middle')
line(894,302,943,325,'#93b7f6');line(943,362,894,385,'#93b7f6')
rect(1036,218,362,244,'white',LINE,15);ico(1060,242,'spark',BLUE);heading(1091,258,'Your learning rhythm',16);heading(1060,312,'7 day streak',29);text(1060,341,'A little consistency goes a long way.',12,MUTED)
for i,d in enumerate(['M','T','W','T','F','S','S']):rect(1060+i*45,364,32,34,BLUE if i<5 else SOFT,r=8);text(1076+i*45,386,d,10,'white' if i<5 else BLUE,600,anchor='middle')
text(1060,432,'1 streak freeze available this week',10,MUTED)
for i,(v,l,d) in enumerate([('32','Cards learned','A foundation you can recall'),('2 / 7','Phases complete','FDE track selected'),('86%','Recent recall','Based on your last 7 sessions'),('15','New cards / day','Your daily learning limit')]):stat(270+i*287,482,267,v,l,d)
section(270,630,'Continue your journey','View all phases','journey');rect(270,652,746,254,'white',LINE,14);rect(293,676,48,48,SOFT,r=10);ico(305,688,'code',BLUE,24);pill(357,673,'PHASE 3 · CURRENT',w=169);heading(357,728,'Python + APIs',22);text(294,766,'Connect your infrastructure skills to your first AI service.',13,MUTED);text(294,801,'Calling an LLM  ·  Deck 2 of 4  ·  20 cards',11,MUTED);bar(294,822,690,.42);text(294,860,'42% of this phase complete',11,MUTED);btn(812,849,180,'Continue deck →','deck')
section(1036,630,'Made for your next step');rect(1036,652,362,254,'white',LINE,14);pill(1059,674,'RESOURCE SPOTLIGHT',w=173);heading(1059,733,'An API is still an API.',21);lines(1059,766,'Use the request, response and retry patterns you know to understand LLM APIs.',38,12);link('resource');text(1059,868,'Read the 6-minute explainer →',12,BLUE,600);endlink();save('dashboard')

phases=[('AI fundamentals','LLMs · Tokens · Context · The FDE role','COMPLETE','60–80 cards'),('AI-assisted DevOps','Prompting · Evidence · Reviewing output','TESTED OUT','50–60 cards'),('Python + APIs','Python · LLM calls · Structured output','CURRENT','80–100 cards'),('RAG & grounding','Chunking · Retrieval · Citations · Evals','LOCKED','60–80 cards'),('Agents + MCP','Tools · Agent loops · MCP · Memory','LOCKED','100–120 cards'),('Production AI','Deployment · Observability · Guardrails','LOCKED','80–100 cards'),('Field deployment','Discovery · Integrations · Handover','LOCKED · v1.1','50–70 cards')]
begin('journey','Seven-phase learning journey');shell('journey','Learning journey');pagehead('Your experience is the starting point.','A practical path from infrastructure expertise to confident AI delivery.')
pill(270,216,'BECOME AN FDE · 7 PHASES',w=241);btn(1210,210,188,'Switch to Learn AI','journey-ai','outline')
for i,(t,d,st,c) in enumerate(phases):
 y=269+i*83;rect(270,y,1128,71,'white','#bfd4fb' if i==2 else LINE,10);rect(288,y+17,36,36,BLUE if i==2 else SOFT,r=18)
 if i<2:ico(298,y+27,'check',BLUE,16)
 elif i>2:ico(298,y+27,'lock',MUTED,16)
 else:text(306,y+40,'03',11,'white',600,anchor='middle')
 heading(341,y+29,t,17);text(341,y+51,d,11,MUTED);text(930,y+40,c,11,MUTED);pill(1060,y+23,st,SOFT if i<=2 else BG,BLUE if i<=2 else MUTED,w=161)
 if i==2:btn(1240,y+14,137,'Continue →','deck')
rect(270,874,1128,52,SOFT,r=9);ico(287,889,'flag',BLUE,20);text(318,905,'Each phase ends with a checkpoint. Score 80% to unlock the next. Tested-out cards stay in your reviews.',12,INK);save('journey')
# AI track variant
v=(OUT/'journey.svg').read_text().replace('BECOME AN FDE · 7 PHASES','LEARN AI · 6 PHASES').replace('Switch to Learn AI','Switch to FDE').replace('#journey-ai','#journey').replace('LOCKED · v1.1','FDE TRACK ONLY');(OUT/'journey-ai.svg').write_text(v);Path('design/figma-import/journey-ai.svg').write_text(v);manifest.append({'id':'journey-ai','title':'Learn AI track','width':1440,'height':1000})

# Library
resources=[('GUIDE · 6 MIN','LLM APIs, in language you know','Request, response, tokens and retries. Start with familiar HTTP patterns.','Python + APIs','resource'),('EXPLAINER · 8 MIN','RAG is a runbook lookup, upgraded','How an AI service finds useful evidence before generating an answer.','RAG & grounding','resource'),('REFERENCE · 5 MIN','A practical guide to token budgets','Think of the context window as a finite working buffer.','AI fundamentals','resource'),('BUILD-IT GUIDE · 25 MIN','Your first read-only incident helper','Scope a safe assistant that finds runbooks and summarizes evidence.','Agents + MCP','labs'),('CHECKLIST · 7 MIN','Before your AI service ships','Evals, access boundaries, observability, budgets and rollback.','Production AI','resource'),('PLAYBOOK · 10 MIN','From customer request to useful pilot','Ask better discovery questions and agree on a measurable outcome.','Field deployment','resource')]
begin('library','Resource library');shell('library','Resource library');pagehead('The context behind every concept.','Plain-language explainers, practical guides and trusted references, all connected to your journey.')
rect(270,218,1128,54,'white',LINE,9);ico(288,234,'search',MUTED,20);text(319,250,'Search the library…',13,MUTED);pill(1240,232,'CURATED',w=136)
for x,w,l in [(270,82,'All'),(364,155,'AI fundamentals'),(531,145,'Python + APIs'),(688,116,'RAG'),(816,150,'Agents + MCP'),(978,123,'Production'),(1113,132,'Saved')]:
 link('library-saved' if l=='Saved' else 'library');rect(x,289,w,34,BLUE if l=='All' else 'white',LINE,7);text(x+w/2,311,l,11,'white' if l=='All' else MUTED,500,anchor='middle');endlink()
text(270,359,'START WITH WHAT YOU KNOW',10,BLUE,600);text(1398,359,'6 featured resources · sample editorial content',10,MUTED,anchor='end')
for i,(tag,t,d,p,targ) in enumerate(resources):
 x=270+(i%3)*383;y=382+(i//3)*257;rect(x,y,362,236,'white',LINE,12);pill(x+20,y+20,tag);link('library-saved');ico(x+319,y+20,'book',MUTED,18);endlink();
 for j,l in enumerate(textwrap.wrap(t,29)):heading(x+20,y+82+j*25,l,19)
 lines(x+20,y+144,d,45,11,gap=19);line(x+20,y+190,x+342,y+190);text(x+20,y+216,p,10,MUTED);link(targ);text(x+342,y+216,'Read →',11,BLUE,600,anchor='end');endlink()
save('library')
v=(OUT/'library.svg').read_text().replace('The context behind every concept.','Your saved resources.').replace('6 featured resources · sample editorial content','Saved collection · example state');(OUT/'library-saved.svg').write_text(v);Path('design/figma-import/library-saved.svg').write_text(v);manifest.append({'id':'library-saved','title':'Saved resources / example state','width':1440,'height':1000})

# Resource article
begin('resource','Resource explainer / LLM APIs');shell('library','Library / Python + APIs');pagehead('An API is still an API.','A practical introduction to LLM calls for people who already work with services.','GUIDE · 6 MIN READ · PYTHON + APIS')
rect(270,223,762,688,'white',LINE,14);pill(297,247,'START WITH WHAT YOU KNOW',w=235);heading(297,310,'You already understand the pattern.',24)
lines(297,347,'An LLM API accepts a request and returns a response, just like the services you operate today. The difference is that you send instructions and context, then receive generated output.',84,13,gap=23)
rect(297,425,707,108,SOFT,r=9);text(316,453,'THE DEVOPS CONNECTION',10,BLUE,600);lines(316,483,'Think of a prompt as request input. The context window is a finite buffer. Tokens are the units used to measure input, output and often cost.',80,13,INK,gap=23)
heading(297,578,'A small, familiar request',20);rect(297,600,707,139,'#0f172a',r=9)
for i,l in enumerate(['POST /v1/responses','Authorization: Bearer <your-server-side-token>','','{ "model": "<model>", "input": "Summarize this runbook" }']):text(315,627+i*26,l,11,'#dbeafe',font='monospace')
lines(297,773,'Keep credentials on the server. Add a timeout, a retry limit and a budget. Validate the returned structure before using it downstream.',84,13,gap=23)
link('https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/POST');text(297,867,'Reference: MDN · HTTP POST ↗',11,BLUE,500);endlink()
rect(1054,223,344,271,'white',LINE,14);heading(1076,259,'Make it stick.',23);lines(1076,294,'You have the explanation. Practise recalling the key decisions.',35,13);text(1076,362,'Related deck',10,MUTED);heading(1076,390,'Calling an LLM',18);btn(1076,423,299,'Practise this concept →','card-concept')
rect(1054,515,344,203,SOFT,r=12);ico(1076,538,'code',BLUE);heading(1076,590,'Try it in your own workflow',17);lines(1076,625,'Sketch the request, timeout, failure path and log fields for a read-only runbook assistant.',36,12);text(1076,695,'Build-it guide · self-reported task',10,BLUE,500);save('resource')

# Deck
begin('deck','Deck detail / Calling an LLM');shell('journey','Phase 3 / Calling an LLM');pagehead('Calling an LLM','You already call APIs. Now learn what changes when the response is generated.','PHASE 3 · PYTHON + APIS')
rect(270,219,731,228,SOFT,'#cfe0fc',14);pill(295,242,'DECK 2 OF 4',w=125);heading(295,310,'From a request to a reliable response.',25);text(295,347,'20 cards · 5 card formats · about 10 minutes',13,MUTED);btn(295,378,206,'Continue studying →','card-concept');text(526,405,'8 / 20 cards learned',11,MUTED)
rect(1022,219,376,228,'white',LINE,14);heading(1046,259,'After this deck, you can…',18)
for i,l in enumerate(['Explain tokens and context limits','Validate structured model output','Set timeouts, retries and budgets','Keep credentials out of the client']):ico(1046,287+i*33,'check',BLUE,17);text(1073,300+i*33,l,12,INK)
section(270,493,'A little of every kind of thinking');
for i,(a,b,ic,targ) in enumerate([('Concept','Recall the idea in your own words.','spark','card-concept'),('Scenario','Choose what you would do at work.','flag','card-scenario'),('Spot the flaw','Find the unsafe assumption in a snippet.','code','card-flaw'),('Ordering','Put a reliable workflow in order.','path','card-ordering'),('Choose the approach','Pick a design and explain the tradeoff.','cards','card-choice')]):
 y=518+i*69;rect(270,y,1128,58,'white',LINE,9);ico(289,y+19,ic,BLUE,20);heading(328,y+25,a,15);text(536,y+34,b,12,MUTED);link(targ);text(1376,y+34,'Preview →',11,BLUE,600,anchor='end');endlink()
save('deck')

# Review screens
cards=[('concept','CONCEPT','Why is a context window like a finite buffer?','Recall the idea before revealing the answer.',['Both have a limited capacity. A context window holds the input','and generated output the model can work with in one request.','If you exceed the limit, input must be reduced or rejected.']),('scenario','SCENARIO','The model API times out during incident triage.','What should your read-only assistant do next?',['Use a deadline and bounded retries. Tell the user what evidence','is missing, and return a safe partial result or escalate.','Do not invent the logs you could not retrieve.']),('flaw','SPOT THE FLAW','Is this really a read-only production boundary?','Identify the problem in this configuration.',['No. A prompt expresses intent; it does not enforce permissions.','Use read-only credentials, an allowed tool list and server-side','argument validation. Enforce the boundary below the model.']),('ordering','ORDERING','Put a reliable LLM request in order.','Move each step into the sequence you would ship.',['1. Validate input and authorization','2. Set timeout, retry and token budgets','3. Call the model and validate the output','4. Return the result and record safe telemetry']),('choice','CHOOSE THE APPROACH','What is the safest first incident assistant?','Select the approach you would propose for a pilot.',['A scoped read-only assistant with authorized evidence, bounded','tool access and a clear escalation path. This limits the blast','radius while giving the pilot a measurable purpose.'])]
def review(kind,answer=False,dark=False):
 idx=[x[0] for x in cards].index(kind);_,tag,q,hint,ans=cards[idx];id=f'card-{kind}'+('-answer' if answer else '')+('-dark' if dark else '')
 begin(id,f'Flashcard / {tag.title()}'+(' / Answer' if answer else ''),1440,1000)
 if dark:rect(0,0,1440,1000,'#0b1220',r=0)
 bg='#111d31' if dark else 'white';ink='#e2e8f0' if dark else INK;muted='#94a3b8' if dark else MUTED;edge='#26344c' if dark else LINE
 rect(0,0,1440,77,bg,r=0);brand();
 if dark:s[-1]=s[-1].replace(INK,'#e2e8f0')
 link('deck');text(270,46,'←  Calling an LLM',12,muted);endlink();text(720,46,'TODAY’S SESSION',10,BLUE,600,anchor='middle');link('deck');text(1360,46,'Save & exit  ×',12,muted,anchor='end');endlink()
 text(320,127,f'Card {idx+1} of 5',12,muted);text(1120,127,'Demo session · due reviews first',11,muted,anchor='end');bar(320,143,800,(idx+1)/5)
 rect(320,179,800,570,bg,edge,17);pill(348,203,tag,w=190);text(1090,220,'PYTHON + APIS',10,muted,600,anchor='end')
 for j,l in enumerate(textwrap.wrap(q,43)):heading(364,302+j*37,l,29,ink)
 if answer:
  pill(364,394,'THE ANSWER','#ecfdf5',TEAL,w=130)
  for j,l in enumerate(ans):text(364,450+j*27,l,15,ink)
  rect(348,584,744,75,SOFT if not dark else '#172d51',r=9);text(366,611,'WHY IT MATTERS IN DEVOPS',9,BLUE,600);text(366,639,'Reliable systems make limits, permissions and failure behavior explicit.',12,BLUE)
  link('resource');text(364,708,'Source context & deeper explanation →',11,BLUE,600);endlink()
 else:
  text(364,394,hint,13,muted)
  if kind=='flaw':
   rect(364,430,712,128,'#0f172a',r=10)
   for j,l in enumerate(['credentials: cluster-admin','system_prompt: "Read-only operations only"','tools: [kubectl]']):text(383,463+j*29,l,14,'#dbeafe',font='monospace')
  elif kind=='ordering':
   for j,l in enumerate(['Return result and record telemetry','Call model and validate output','Validate input and authorization','Set timeout, retry and token budgets']):
    rect(364,422+j*55,712,44,BG,LINE,7);text(380,449+j*55,'::',16,MUTED);text(412,449+j*55,l,12,INK);link('order-up-'+str(j));text(1020,449+j*55,'↑',17,BLUE,anchor='end');endlink();link('order-down-'+str(j));text(1060,449+j*55,'↓',17,BLUE,anchor='end');endlink()
  elif kind=='choice':
   for j,l in enumerate(['Give an agent cluster-admin access and monitor it','Use a scoped read-only workflow with explicit limits','Replace the incident process with autonomous agents']):
    link('card-choice-answer' if j==1 else 'card-choice-wrong');rect(364,433+j*65,712,52,BG,LINE,8);rect(380,449+j*65,20,20,'white',LINE,r=10);text(414,465+j*65,l,12,INK);endlink()
  else:
   rect(364,443,712,135,BG if not dark else '#17243a',edge,10);ico(389,465,'spark',BLUE,23);text(427,484,'Think it through before you turn the card.',14,ink,600);lines(427,518,'A short pause to recall is where the learning happens.',63,12,muted)
  if kind not in ('choice','ordering'):btn(364,659,712,'Reveal answer   ·   Space',f'card-{kind}-answer')
  elif kind=='ordering':btn(364,668,712,'Check sequence →','card-ordering-answer')
 if answer:
  nex='card-'+cards[idx+1][0] if idx<4 else 'session-complete'
  if kind in ('ordering','choice'):
   text(720,790,'Correct · automatically graded as Good',13,BLUE,600,anchor='middle')
   btn(320,814,800,'Continue to next card →',nex)
  else:
   text(720,788,'How well did you recall it?',12,muted,anchor='middle')
   for j,(l,c) in enumerate([('Again','#b91c1c'),('Hard','#c2410c'),('Good',BLUE),('Easy',TEAL)]):
    link(nex);rect(320+j*205,812,185,62,bg,edge,9);text(412+j*205,840,l,14,c,600,anchor='middle');text(412+j*205,860,f'{j+1} · '+('Review sooner' if j<2 else 'Schedule next review'),9,muted,anchor='middle');endlink()
  text(720,908,'Illustrative ratings. Production scheduling uses FSRS; intervals depend on your review history.',10,muted,anchor='middle')
 else:
  text(720,793,'Try to recall first. You can always revisit the explanation.',12,muted,anchor='middle');link('report');text(320,868,'Report a problem',11,muted);endlink();link('resource');text(1120,868,'Read the explainer ↗',11,BLUE,600,anchor='end');endlink()
 text(720,949,'Free learning · One concept at a time · Your progress is private',10,muted,anchor='middle');save(id)
for kind,*_ in cards:review(kind);review(kind,True)
review('concept',True,True)
# wrong choice response
v=(OUT/'card-choice-answer.svg').read_text().replace('THE ANSWER','TRY AGAIN').replace('Correct · automatically graded as Good','Incorrect · automatically graded as Again');(OUT/'card-choice-wrong.svg').write_text(v);Path('design/figma-import/card-choice-wrong.svg').write_text(v);manifest.append({'id':'card-choice-wrong','title':'Choice / incorrect feedback','width':1440,'height':1000})

begin('session-complete','Daily session complete');brand();pill(1220,35,'SESSION COMPLETE',w=179);rect(645,145,150,150,SOFT,r=75);ico(690,189,'check',BLUE,60);text(720,349,'A little more that stays.',37,INK,700,'Space Grotesk, Inter, Arial, sans-serif','middle');text(720,388,'You’ve completed your five-card sample session. Keep the habit going tomorrow.',14,MUTED,anchor='middle')
for i,(v,l,d) in enumerate([('5','Cards practised','Five ways to think'),('7','Day streak','Your week is taking shape'),('~10 min','Daily habit','A small, useful investment')]):stat(308+i*283,449,259,v,l,d)
rect(308,583,825,129,SOFT,r=14);heading(336,620,'Next up: put it into practice.',22);text(336,649,'Continue the written build-it guide, or revisit an explanation while it’s fresh.',12,MUTED);link('resource');text(336,681,'Open your build-it guide →',12,BLUE,600);endlink();btn(491,757,220,'Back to my overview','dashboard');btn(727,757,220,'Explore the library','library','outline');save('session-complete')

# Checkpoint
begin('checkpoint','Phase checkpoint / Progress');shell('checkpoint','Checkpoints');pagehead('Understanding you can put to work.','A checkpoint checks your judgment across the phase, with clear guidance on what to revisit.')
rect(270,223,695,352,'white',LINE,15);pill(295,246,'PHASE 3 CHECKPOINT',w=197);heading(295,318,'Python + APIs',30);lines(295,354,'12 mixed scenario cards. Score at least 80% to unlock RAG & grounding.',66,14);text(295,438,'YOUR LATEST ATTEMPT',10,MUTED,600);heading(295,483,'83%',44,BLUE);pill(408,454,'PASSED','#ecfdf5',TEAL,w=88);text(408,495,'10 of 12 questions correct',12,MUTED);btn(295,514,205,'Continue to next phase →','journey')
rect(988,223,410,352,SOFT,r=14);ico(1014,249,'flag',BLUE,27);heading(1014,313,'A useful next step',24);lines(1014,348,'Build a small script that calls a model API with validated input, a timeout and a token budget.',44,13);btn(1014,430,358,'Open written build-it guide','resource','outline');text(1014,510,'Completion is self-reported in phase 1.',11,MUTED);text(1014,534,'Verified labs are planned for phase 2.',11,MUTED)
section(270,628,'Know where to focus');
for i,(l,d,c) in enumerate([('Structured outputs','Strong · 4 / 4 questions',BLUE),('Token and context limits','Strong · 3 / 3 questions',BLUE),('Retries and failure paths','Revisit · 3 / 5 questions','#c2410c')]):
 y=652+i*72;rect(270,y,1128,60,'white',LINE,9);heading(290,y+35,l,16);text(915,y+35,d,12,c);link('deck');text(1375,y+35,'Revisit deck →',11,BLUE,600,anchor='end');endlink()
text(270,907,'If you score below 80%, revisit the suggested decks and retry after 24 hours.',12,MUTED);save('checkpoint')

# Labs
begin('labs','Hands-on labs / Coming soon');shell('labs','Hands-on labs');pagehead('Learn it here. Build it next.','Written build-it guides are available now. Sandboxed, auto-graded labs are planned for phase 2.')
rect(270,224,1128,197,SOFT,'#cfe0fc',14);pill(296,249,'PHASE 2 · COMING SOON',w=216);heading(296,314,'Real environments. Measurable progress.',30);text(296,354,'Join a lab waitlist to hear when hands-on environments become available.',13,MUTED);text(296,387,'Learning, reviews and progress tracking remain free.',12,BLUE,600)
for i,(t,sub,tag) in enumerate([('Read-only incident assistant','Connect runbooks to a safe, bounded tool workflow.','AGENTS + MCP'),('Permission-aware RAG','Retrieve the right evidence for the right user.','RAG & GROUNDING'),('Production AI service','Ship with evals, monitoring, budgets and rollback.','PRODUCTION AI')]):
 x=270+i*383;rect(x,449,362,347,'white',LINE,14);ico(x+24,476,'code',BLUE,27);pill(x+24,527,tag,w=230)
 for j,l in enumerate(textwrap.wrap(t,25)):heading(x+24,591+j*28,l,23)
 lines(x+24,663,sub,37,12);btn(x+24,723,314,'Join lab waitlist','waitlist','outline')
text(270,854,'No checkout in this release. Lab pricing and token allowances are still to be decided.',12,MUTED);save('labs')

# Progress
begin('progress','Learner progress');shell('progress','My progress');pagehead('Your knowledge, taking shape.','A clear view of your learning habit, recall and the concepts that need another pass.')
for i,(v,l,d) in enumerate([('32','Cards learned','Across your active decks'),('7 days','Current streak','One freeze available'),('86%','Recent recall','Last 7 sessions'),('83%','Last checkpoint','Python + APIs')]):stat(270+i*287,222,267,v,l,d)
rect(270,352,739,304,'white',LINE,14);heading(294,391,'A week of showing up',21);text(983,390,'CARDS REVIEWED',9,MUTED,600,anchor='end')
for i,(d,n) in enumerate([('Mon',18),('Tue',24),('Wed',15),('Thu',30),('Fri',22),('Sat',17),('Sun',26)]):
 x=311+i*95;rect(x,596-n*5,44,n*5,BLUE if i==6 else '#bfdbfe',r=5);text(x+22,624,d,10,MUTED,anchor='middle');text(x+22,582-n*5,n,11,BLUE,600,anchor='middle')
rect(1030,352,368,304,SOFT,r=14);heading(1055,393,'Where to focus next',21);lines(1055,432,'You’re building a strong foundation. Revisit failure paths before taking on more autonomy.',38,13);btn(1055,560,318,'Review weak concepts →','card-scenario')
section(270,708,'Your phase milestones');
for i,(t,st) in enumerate([('AI fundamentals','Complete · checkpoint 91%'),('AI-assisted DevOps','Tested out · placement'),('Python + APIs','Current · 42% of cards learned')]):
 y=733+i*61;rect(270,y,1128,51,'white',LINE,9);ico(288,y+16,'check' if i<2 else 'clock',BLUE,19);text(326,y+32,t,14,INK,600);text(1374,y+32,st,11,MUTED,anchor='end')
save('progress')

# Teams
begin('team','Team overview / v1.1');shell('team','Team overview');pagehead('Help your team move forward.','Progress that helps a manager support learning, with individual answers kept private.','TEAM WORKSPACE · PLANNED FOR v1.1')
pill(1210,114,'FUTURE RELEASE',w=188)
for i,(v,l,d) in enumerate([('6','Team members','Illustrative engineering team'),('74%','Weekly participation','Completed a session this week'),('3.2','Average phase','Across the FDE track'),('2','Need support','Suggested decks to revisit')]):stat(270+i*287,224,267,v,l,d)
rect(270,355,1128,501,'white',LINE,14);heading(294,395,'Cloud platform team',21);btn(1210,370,161,'Export progress CSV','export','outline');
for x,l in [(296,'MEMBER'),(627,'CURRENT PHASE'),(908,'STREAK'),(1051,'CHECKPOINT'),(1200,'FOCUS AREA')]:text(x,450,l,9,MUTED,600)
for i,(n,r,p,st,sc,f) in enumerate([('Alex Jordan','DevOps engineer','3 · Python + APIs','7 days','83%','Retry boundaries'),('Priya Shah','Platform engineer','5 · Agents + MCP','12 days','91%','Tool safety'),('Marcus Chen','Cloud engineer','4 · RAG','5 days','86%','Grounding'),('Sarah Wilson','SRE','6 · Production','18 days','94%','Handover'),('Jamal Okafor','DevOps engineer','2 · AI-assisted DevOps','2 days','75%','Evidence'),('Elena Rossi','Solutions engineer','7 · Field deployment','9 days','89%','Discovery')]):
 y=473+i*59;line(293,y-7,1375,y-7);rect(295,y+1,32,32,SOFT,r=16);text(311,y+22,''.join(x[0] for x in n.split()),9,BLUE,600,anchor='middle');text(341,y+13,n,12,INK,600);text(341,y+29,r,9,MUTED);text(627,y+20,p,11,INK);text(908,y+20,st,11,MUTED);text(1051,y+20,sc,12,BLUE,600);text(1200,y+20,f,11,MUTED)
text(270,896,'Managers see phase, streak, checkpoint scores and weak decks. They do not see individual card answers.',12,MUTED);save('team')

# Settings
begin('settings','Learning preferences');shell('settings','Preferences');pagehead('Make room for a learning habit.','A pace that fits your day, with control over reminders and appearance.')
for y,t,sub,val,target in [(225,'New cards per day','Due reviews come first. The default is 15 new cards a day.','15 new cards','settings-limit'),(360,'Daily reminder','An email nudge at a time you choose.','19:30 · Asia/Kolkata','settings-saved'),(495,'Track','Your existing progress carries over when you switch.','Become an FDE','journey-ai'),(630,'Appearance','Readable explanations and code in light and dark.','Preview dark mode','card-concept-answer-dark')]:
 rect(270,y,1128,111,'white',LINE,12);heading(294,y+37,t,18);text(294,y+70,sub,12,MUTED);btn(1080,y+32,292,val,target,'outline')
rect(270,769,1128,125,SOFT,r=12);heading(294,806,'Your learning data belongs to you.',19);text(294,838,'You control your reminders and optional public profile. Team managers see progress summaries only.',12,MUTED);text(294,868,'Account export and deletion will be available from account settings in the production application.',11,MUTED);save('settings')

# Simple success overlays as designed screens
for id,title,body,cta,target in [('waitlist','You’re on the interest list.','Example state: you’ll hear when sandboxed labs are ready. Your learning stays free.','Back to hands-on labs','labs'),('report','Help make this card clearer.','Example report: “The explanation needs a more concrete DevOps example.” Reports go to the author review queue.','Submit example report','report-sent'),('report-sent','Thanks for improving the next review.','Example confirmation: your report is queued for an author. Card updates preserve review history unless an explicit reset is needed.','Return to practice','card-concept'),('settings-saved','A little nudge, at the right time.','Example preference saved: daily email at 19:30, Asia/Kolkata. No email is sent by this prototype.','Back to preferences','settings'),('settings-limit','Set a pace you can keep.','Example setting: 15 new cards per day. Due reviews are always included first.','Keep 15 cards per day','settings')]:
 begin(id,title);shell();rect(235,76,1205,924,'#dce7f8',r=0);rect(465,275,650,407,'white',LINE,18);ico(502,312,'spark',BLUE,32);heading(502,394,title,25);lines(502,439,body,73,14,gap=26);btn(502,581,576,cta,target);save(id)

# Mobile review layouts
for answer in [False,True]:
 id='mobile-answer' if answer else 'mobile-review';begin(id,'Mobile / daily review'+(' answer' if answer else ''),390,844);rect(0,0,390,844,BG,r=0);text(23,28,'9:41',12,INK,600);text(363,28,'•••  ▰',12,INK,600,anchor='end');link('dashboard');text(22,76,'←',22,INK);endlink();text(195,75,'Calling an LLM',13,INK,600,anchor='middle');link('deck');text(366,75,'×',24,MUTED,anchor='end');endlink();line(0,99,390,99);text(20,132,'Card 1 of 5',11,MUTED);text(370,132,'Today’s session',11,MUTED,anchor='end');bar(20,147,350,.2)
 rect(16,174,358,429,'white',LINE,14);pill(34,192,'CONCEPT',w=106);heading(34,271,'Why is a context window',23);heading(34,303,'like a finite buffer?',23)
 if answer:
  pill(34,337,'THE ANSWER','#ecfdf5',TEAL,w=131);lines(34,390,'Both have limited capacity. The context window holds the input and generated output the model can use in one request.',36,14,INK,gap=24);link('resource');text(34,557,'Read the DevOps connection →',12,BLUE,600);endlink();text(195,642,'How well did you recall it?',12,MUTED,anchor='middle')
  for i,(l,c) in enumerate([('Again','#b91c1c'),('Hard','#c2410c'),('Good',BLUE),('Easy',TEAL)]):
   link('session-complete');rect(16+i*94,668,82,61,'white',LINE,9);text(57+i*94,696,l,12,c,600,anchor='middle');text(57+i*94,715,str(i+1),10,MUTED,anchor='middle');endlink()
 else:
  lines(34,347,'Pause for a moment. Recall the idea before revealing the answer.',37,13,gap=23);rect(34,420,322,89,SOFT,r=9);ico(49,440,'spark',BLUE,20);lines(84,449,'Think of the buffers and request limits you already work with.',32,11,gap=20);btn(34,535,322,'Reveal answer','mobile-answer');text(195,648,'One idea. One useful moment.',12,MUTED,anchor='middle')
 link('report');text(20,779,'Report a problem',10,MUTED);endlink();text(370,779,'Free learning',10,BLUE,anchor='end');rect(135,824,120,5,INK,r=3);save(id)

# Design system board
begin('design-system','Design system / Retainzy blue',1440,1000);brand(50,35);text(1390,57,'DESIGN FOUNDATIONS / 01',10,BLUE,600,anchor='end');heading(50,145,'Familiar blue. Clear thinking.',42);text(50,183,'Retainzy’s verified palette and type, adapted to a focused engineering learning workspace.',15,MUTED)
for i,(label,c) in enumerate([('Action / #2563EB',BLUE),('Ink / #10213E',INK),('Soft / #EFF6FF',SOFT),('Canvas / #F8FAFC',BG),('Line / #E3EAF4',LINE),('Success / #0F766E',TEAL)]):
 x=50+i*230;rect(x,233,207,97,c,LINE,r=11);text(x,357,label,12,INK,600)
heading(50,427,'Type that makes room for ideas.',30);heading(50,480,'Space Grotesk · Heading / 32 / 700',32);text(50,525,'Inter · Body / 14 / 400 · Short sentences. Familiar concepts.',16,MUTED);text(50,565,'LABEL / 10 / 600 / UPPERCASE',10,BLUE,600)
btn(50,615,214,'Primary action →');btn(282,615,214,'Secondary action','dashboard','outline');pill(521,624,'PHASE 3 · CURRENT',w=186);pill(728,624,'PASSED','#ecfdf5',TEAL,w=95)
rect(50,716,640,189,'white',LINE,14);heading(73,754,'Layout & interaction',20)
for i,l in enumerate(['Desktop 1440 px · sidebar 234 px · content padding 36 px','Mobile 390 px · 16 px margins · 44 px minimum actions','Spacing 4 / 8 / 12 / 16 / 24 / 32 · radii 8 / 12 / 16','Keyboard: Space to reveal · 1–4 to rate · visible focus']):text(73,790+i*26,l,12,MUTED)
rect(716,716,674,189,SOFT,r=14);heading(740,754,'Write for the engineer you’re helping.',20);lines(740,795,'Connect a new idea to an existing mental model. Explain why a decision matters in production. Keep source context close, and turn the next step into a useful action.',75,14,gap=25);save('design-system')

begin('placement','Optional placement test');brand(60,35);pill(1190,42,'OPTIONAL · 10–15 MIN',w=205)
text(720,164,'START WHERE YOU ARE',11,BLUE,600,anchor='middle');text(720,216,'Your experience should count.',37,INK,700,'Space Grotesk, Inter, Arial, sans-serif','middle');text(720,257,'Try a short placement test, or begin with the fundamentals.',14,MUTED,anchor='middle')
rect(370,313,700,328,'white',LINE,16);heading(403,359,'A practical starting point',23)
for i,l in enumerate(['A few questions from each learning phase','Passed phases are marked “tested out” and unlocked','Those cards still return as low-priority reviews','You can skip this and learn everything in order']):ico(404,394+i*45,'check',BLUE,18);text(436,408+i*45,l,14,INK)
btn(403,583,633,'Preview a placement question →','card-scenario');btn(520,690,400,'Start with the fundamentals','dashboard','outline');text(720,795,'Preview: placement scoring is not implemented in this design prototype.',11,MUTED,anchor='middle');save('placement')

begin('admin','Admin / Content operations');shell('dashboard','Admin / Content operations');pagehead('Keep the learning useful.','Publish reviewed content, follow imports and close the loop on card feedback.','ADMIN WORKSPACE · MVP')
for i,(v,l,d) in enumerate([('24','Published decks','Sample editorial workspace'),('3','Open card reports','Ready for author review'),('1','Pending import','Versioned and idempotent'),('2','Stale card warnings','Last reviewed over 90 days')]):stat(270+i*287,223,267,v,l,d)
rect(270,354,1128,248,'white',LINE,14);heading(294,394,'Card feedback queue',21)
for i,(a,b,c) in enumerate([('p3-retries-004','Needs a clearer timeout example','Open'),('p5-tool-calling-007','Source reference needs review','Open'),('p1-context-003','Clarify the buffer analogy','Fixed')]):
 y=427+i*51;line(294,y-4,1374,y-4);text(294,y+23,a,12,INK,600);text(574,y+23,b,12,MUTED);pill(1248,y+6,c,'#ecfdf5' if c=='Fixed' else SOFT,TEAL if c=='Fixed' else BLUE,w=95)
rect(270,626,1128,234,'white',LINE,14);heading(294,666,'Content import history',21);pill(1248,645,'SUCCESS','#ecfdf5',TEAL,w=122);text(294,710,'Git merge → validated import → published decks',14,INK,600);text(294,748,'Calling an LLM · 2 cards updated · version 3 · review history retained',12,MUTED);text(294,789,'Retired card IDs are preserved. Source content is authored and reviewed through Git.',12,MUTED);text(294,830,'This is a read-only design preview of administrative operations.',11,BLUE);save('admin')

v=(OUT/'card-ordering-answer.svg').read_text().replace('THE ANSWER','CORRECT SEQUENCE').replace('Correct · automatically graded as Good','Incorrect · automatically graded as Again')
(OUT/'card-ordering-wrong.svg').write_text(v);Path('design/figma-import/card-ordering-wrong.svg').write_text(v);manifest.append({'id':'card-ordering-wrong','title':'Ordering / incorrect feedback','width':1440,'height':1000})

Path('public/screens/manifest.json').write_text(json.dumps(manifest,indent=2))
print(f'Exported {len(manifest)} editable SVG screens.')
