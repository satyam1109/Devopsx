import sharp from '/Users/satyamsingh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.cjs';
import fs from 'node:fs/promises';
const manifest=JSON.parse(await fs.readFile('public/screens/manifest.json','utf8'));
await fs.mkdir('design/previews',{recursive:true});
for(const screen of manifest){await sharp(`public/screens/${screen.id}.svg`).png().toFile(`design/previews/${screen.id}.png`)}
const screens=['welcome','dashboard','journey','library','resource','deck','card-concept','card-concept-answer','checkpoint','labs','team','mobile-review'];
const tiles=[];
for(let i=0;i<screens.length;i++){const id=screens[i];let png=await sharp(`design/previews/${id}.png`).resize(480,367,{fit:'contain',background:'#e8eef7'}).toBuffer();tiles.push({input:png,left:(i%3)*500+10,top:Math.floor(i/3)*390+10})}
await sharp({create:{width:1500,height:1560,channels:4,background:'#e8eef7'}}).composite(tiles).png().toFile('design/client-overview.png');
console.log('Rendered all screens and client overview.');
