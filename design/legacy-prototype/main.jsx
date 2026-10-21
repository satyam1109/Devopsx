import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const titles = {welcome:'Welcome',onboarding:'Choose your goal',dashboard:'Learning overview',journey:'Seven-phase journey',library:'Resource library',resource:'Resource explainer',deck:'Deck detail','card-concept':'Concept card','card-concept-answer':'Answer & recall','card-scenario':'Scenario card','card-flaw':'Spot the flaw','card-ordering':'Ordering card','card-choice':'Choose an approach','session-complete':'Session complete',checkpoint:'Phase checkpoint',labs:'Future labs',progress:'My progress',team:'Future team overview',settings:'Preferences','mobile-review':'Mobile review','mobile-answer':'Mobile answer','design-system':'Design system'};
function App(){
 const [screen,setScreen]=useState(location.hash.slice(1)||(window.innerWidth<700?'mobile-review':'welcome'));
 const [svg,setSvg]=useState(''); const [all,setAll]=useState([]); const [isLoading,setLoading]=useState(true); const [error,setError]=useState('');
 const container=useRef(null);
 const initialOrder=['Return result and record telemetry','Call model and validate output','Validate input and authorization','Set timeout, retry and token budgets'];
 const [order,setOrder]=useState(initialOrder);
 const correctOrder=[initialOrder[2],initialOrder[3],initialOrder[1],initialOrder[0]];
 const visibleSvg=screen==='card-ordering'?svg.replace(/Return result and record telemetry|Call model and validate output|Validate input and authorization|Set timeout, retry and token budgets/g,(label)=>order[initialOrder.indexOf(label)]):svg;
 const handleAction=(e)=>{const a=e.target.closest('a');if(!a)return;const href=a.getAttribute('href')||'';
 if(href.startsWith('#order-')){e.preventDefault();const [,direction,rawIndex]=href.slice(1).split('-');const index=Number(rawIndex),next=index+(direction==='up'?-1:1);if(next>=0&&next<4)setOrder(previous=>{const copy=[...previous];[copy[index],copy[next]]=[copy[next],copy[index]];return copy});}
 if(href==='#card-ordering-answer'&&screen==='card-ordering'){e.preventDefault();go(order.every((x,i)=>x===correctOrder[i])?'card-ordering-answer':'card-ordering-wrong');}
 if(href==='#export'){e.preventDefault();const csv='Name,Current phase,Streak,Checkpoint,Focus\nAlex Jordan,Python + APIs,7,83%,Retry boundaries\nPriya Shah,Agents + MCP,12,91%,Tool safety\nMarcus Chen,RAG,5,86%,Grounding\nSarah Wilson,Production,18,94%,Handover\nJamal Okafor,AI-assisted DevOps,2,75%,Evidence\nElena Rossi,Field deployment,9,89%,Discovery\n';const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const download=document.createElement('a');download.href=url;download.download='fieldwork-sample-team-progress.csv';download.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 };

 useEffect(()=>{fetch('/screens/manifest.json').then(x=>x.json()).then(setAll);const change=()=>setScreen(location.hash.slice(1)||'welcome');window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change)},[]);
 useEffect(()=>{let active=true;setLoading(true);setError('');fetch(`/screens/${encodeURIComponent(screen)}.svg`).then(r=>{if(!r.ok)throw Error('Screen unavailable');return r.text()}).then(t=>{if(active){if(!t.startsWith('<svg'))throw Error('Screen unavailable');setSvg(t);setLoading(false);window.scrollTo(0,0)}}).catch(()=>{if(active){setError('This screen is unavailable. Choose another screen above.');setLoading(false)}});return()=>{active=false}},[screen]);
 const go=(id)=>{location.hash=id};
 useEffect(()=>{const keyboard=(e)=>{if(e.target.tagName==='SELECT'||e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  if(e.code==='Space'&&screen.startsWith('card-')&&!screen.includes('answer')&&!['card-choice','card-ordering'].includes(screen)){e.preventDefault();go(screen+'-answer')}
  if(/^[1-4]$/.test(e.key)&&screen.startsWith('card-')&&screen.includes('answer')&&!screen.includes('ordering')&&!screen.includes('choice')){e.preventDefault();const order=['concept','scenario','flaw','ordering','choice'];let i=order.findIndex(x=>screen.includes(x));go(i<4?`card-${order[i+1]}`:'session-complete')}
 };window.addEventListener('keydown',keyboard);return()=>window.removeEventListener('keydown',keyboard)},[screen]);
 useEffect(()=>{if(!container.current)return;container.current.querySelectorAll('a').forEach(a=>{const t=[...a.querySelectorAll('text')].map(x=>x.textContent.trim()).join(' ')||a.textContent.trim();if(t)a.setAttribute('aria-label',t);a.setAttribute('tabindex','0')})},[visibleSvg]);
 const mobile=screen.startsWith('mobile-');
 return <div className="min-h-screen bg-slate-100 text-slate-900">
  <header className="review-toolbar flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-5 py-3">
   <a href="#welcome" className="font-semibold tracking-tight text-blue-600">FIELDWORK <span className="ml-2 font-normal text-slate-400">/</span></a>
   <span className="text-xs text-slate-500">Client design review</span>
   <span className="ml-auto rounded bg-blue-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-blue-700">Interactive concept</span>
   <label className="sr-only" htmlFor="screen">Select a design screen</label>
   <select id="screen" aria-label="Select a design screen" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs" value={screen} onChange={e=>go(e.target.value)}>
    {all.map(x=><option value={x.id} key={x.id}>{titles[x.id]||x.title}</option>)}
   </select>
   <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs hover:bg-blue-50" onClick={()=>go(mobile?'card-concept':'mobile-review')}>{mobile?'Desktop':'Mobile'}</button>
   <a className="rounded-lg bg-blue-600 px-3 py-2 text-xs text-white" href="/fieldwork-figma-import.zip" download>Download design files</a>
  </header>
  <div className="border-b border-blue-100 bg-blue-50 px-5 py-2 text-center text-[11px] text-blue-800">Design prototype · Sample content and progress · Sign-in, reminders, ratings and waitlists are demonstrations. No data is submitted.</div>
  <main className={'canvas-wrap mx-auto '+(mobile?'mobile-canvas':'desktop-canvas')} aria-label={titles[screen]||screen}>
   {isLoading&&<p className="p-8 text-center text-sm text-slate-500">Loading screen…</p>}
   {error?<p role="alert" className="p-8 text-center">{error} <a href="#welcome">Return to welcome</a></p>:<div key={screen} className={'screen '+(mobile?'mobile-screen':'')} ref={container} onClick={handleAction} dangerouslySetInnerHTML={{__html:visibleSvg}}/>}
  </main>
  <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-slate-500"><span>Fieldwork · DevOps → AI → Forward Deployed Engineering</span><div className="flex gap-5"><a href="#design-system" className="hover:text-blue-600">Design foundations</a><a href="#welcome" className="hover:text-blue-600">Restart walkthrough</a></div></footer>
 </div>
}
createRoot(document.getElementById('root')).render(<App/>);
