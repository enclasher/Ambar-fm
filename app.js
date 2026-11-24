/* Ambar.fm v1.1: reliable navigation and mobile-friendly local import */
'use strict';
const DB_NAME = 'ambar-fm-db';
const STORE = 'events';
let allEvents = [];
let currentView = 'overview';
let currentPeriod = 'all';
const $ = (id) => document.getElementById(id);
const fmt = (n) => new Intl.NumberFormat().format(n || 0);
const safe = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'id'});};
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
}
async function getAll(){const db=await openDB();return new Promise((resolve,reject)=>{const r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);});}
async function putMany(rows){if(!rows.length)return;const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite'),s=tx.objectStore(STORE);rows.forEach(x=>s.put(x));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
async function clearAll(){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
function normalize(row){
  const track=row.master_metadata_track_name||row.track_name||row.trackName||row.song||'';
  const artist=row.master_metadata_album_artist_name||row.artist_name||row.artistName||row.artist||'';
  const album=row.master_metadata_album_album_name||row.album_name||row.albumName||row.album||'';
  const rawDate=row.ts||row.endTime||row.date||row.timestamp; const date=rawDate?new Date(rawDate):null;
  const ms=Number(row.ms_played??row.msPlayed??row.duration_ms??row.duration??0);
  if(!track||!artist||!date||Number.isNaN(date.getTime()))return null;
  const uri=row.spotify_track_uri||row.track_uri||row.uri||'';
  return {id:[date.toISOString(),uri||track,artist,ms].join('|'),track,artist,album:album||'Unknown album',date:date.toISOString(),ms:Math.max(0,ms),uri};
}
async function importFiles(fileList){
  const status=$('import-status'); const files=[...fileList].filter(f=>f.name.toLowerCase().endsWith('.json'));
  if(!files.length){status.className='status error';status.textContent='Choose one or more Spotify JSON files.';return;}
  status.className='status muted';status.textContent=`Reading ${files.length} file(s)…`;
  try{
    const rows=[];let bad=0;
    for(const file of files){const parsed=JSON.parse(await file.text());const arr=Array.isArray(parsed)?parsed:(parsed&&Array.isArray(parsed.items)?parsed.items:[]);if(!arr.length){bad++;continue;}for(const item of arr){const e=normalize(item);if(e)rows.push(e);}}
    if(!rows.length)throw new Error('No usable listening records found. Please select Spotify Streaming_History_Audio JSON files.');
    const existing=new Set(allEvents.map(e=>e.id));const fresh=rows.filter(e=>!existing.has(e.id));
    await putMany(fresh);allEvents=await getAll();status.className='status success';status.textContent=`Imported ${fmt(fresh.length)} new listening events. ${fmt(rows.length-fresh.length)} duplicates skipped.${bad?` ${bad} file(s) contained no recognised records.`:''}`;
    setView('overview');
  }catch(err){status.className='status error';status.textContent=err.message||'Import failed. Check your selected JSON files.';}
}
function filtered(){
  if(currentPeriod==='all')return allEvents;const now=new Date(),start=new Date(now);
  if(currentPeriod==='year'){start.setMonth(0,1);start.setHours(0,0,0,0);}else if(currentPeriod==='month'){start.setDate(1);start.setHours(0,0,0,0);}else start.setDate(now.getDate()-Number(currentPeriod));
  return allEvents.filter(e=>new Date(e.date)>=start);
}
function groupBy(rows,keyFn){const m=new Map();for(const e of rows){const k=keyFn(e);if(!m.has(k))m.set(k,{name:k,plays:0,ms:0,artist:e.artist,album:e.album});const x=m.get(k);x.plays++;x.ms+=e.ms;}return [...m.values()].sort((a,b)=>b.plays-a.plays);}
function top(rows,keyFn){return groupBy(rows,keyFn);}
function duration(ms){const mins=Math.round(ms/60000),h=Math.floor(mins/60),m=mins%60;return h?`${fmt(h)}h ${m}m`:`${fmt(m)}m`;}
function renderRanks(id,items,subFn){const el=$(id);el.innerHTML=items.length?items.slice(0,5).map((x,i)=>`<div class="rank-item"><span class="rank-num">${String(i+1).padStart(2,'0')}</span><div><div class="rank-name">${safe(x.name)}</div><div class="rank-sub">${safe(subFn(x))}</div></div><span class="rank-count">${fmt(x.plays)} plays</span></div>`).join(''):'<div class="empty-small">Import history to see your rankings.</div>';}
function renderChart(rows){const days=new Map();rows.forEach(e=>{const d=e.date.slice(0,10);days.set(d,(days.get(d)||0)+e.ms);});const entries=[...days.entries()].sort((a,b)=>a[0].localeCompare(b[0])).slice(-14);const max=Math.max(1,...entries.map(x=>x[1]));$('activity-chart').innerHTML=entries.length?entries.map(([d,ms])=>`<div class="bar-wrap"><div class="bar" title="${safe(d)} · ${(ms/3600000).toFixed(1)}h" style="height:${Math.max(2,ms/max*100)}%"></div><span class="bar-label">${new Date(d+'T00:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short'})}</span></div>`).join(''):'<div class="empty-small">Your listening timeline will appear here.</div>';}
function renderOverview(){const rows=filtered(),ms=rows.reduce((s,e)=>s+e.ms,0);$('total-time').textContent=duration(ms);$('total-minutes').textContent=`${fmt(Math.round(ms/60000))} minutes played`;$('total-plays').textContent=fmt(rows.length);$('unique-tracks').textContent=fmt(new Set(rows.map(e=>e.uri||e.track+'|'+e.artist)).size);$('unique-artists').textContent=fmt(new Set(rows.map(e=>e.artist)).size);$('date-range').textContent=rows.length?`${new Date(Math.min(...rows.map(e=>+new Date(e.date)))).toLocaleDateString()} – ${new Date(Math.max(...rows.map(e=>+new Date(e.date)))).toLocaleDateString()}`:'No listening records in this period';renderChart(rows);renderRanks('top-artists',top(rows,e=>e.artist),x=>`${duration(x.ms)} listened`);renderRanks('top-tracks',top(rows,e=>e.track+'|||'+e.artist).map(x=>({...x,name:x.name.split('|||')[0]})),x=>x.artist);renderRanks('top-albums',top(rows,e=>e.album+'|||'+e.artist).map(x=>({...x,name:x.name.split('|||')[0]})),x=>x.artist);}
function renderList(){const rows=filtered(),type=currentView,query=($('list-search').value||'').toLowerCase();let items=[];
  if(type==='history'){items=rows.slice().sort((a,b)=>b.date.localeCompare(a.date)).filter(x=>(x.track+' '+x.artist+' '+x.album).toLowerCase().includes(query)).slice(0,1000);$('list-count').textContent=`${fmt(items.length)} recent records shown`;$('list-content').innerHTML=items.length?`<table class="data-table"><thead><tr><th>TRACK</th><th>ALBUM</th><th>DATE</th><th>DURATION</th></tr></thead><tbody>${items.map(e=>`<tr><td><div class="track-title">${safe(e.track)}</div><div class="track-sub">${safe(e.artist)}</div></td><td>${safe(e.album)}</td><td>${new Date(e.date).toLocaleString()}</td><td>${duration(e.ms)}</td></tr>`).join('')}</tbody></table>`:'<div class="empty-small">No listening history yet. Import your Spotify data to see your plays here.</div>';return;}
  const key=type==='artists'?(e=>e.artist):type==='albums'?(e=>e.album+'|||'+e.artist):(e=>e.track+'|||'+e.artist);items=top(rows,key).map(x=>({...x,name:x.name.split('|||')[0]})).filter(x=>(x.name+' '+x.artist).toLowerCase().includes(query));$('list-count').textContent=`${fmt(items.length)} results`;$('list-content').innerHTML=items.length?`<table class="data-table"><thead><tr><th>#</th><th>${type==='artists'?'ARTIST':type==='albums'?'ALBUM':'TRACK'}</th><th>LISTENING TIME</th><th>PLAYS</th></tr></thead><tbody>${items.map((x,i)=>`<tr><td>${i+1}</td><td><div class="track-title">${safe(x.name)}</div><div class="track-sub">${safe(x.artist||'')}</div></td><td>${duration(x.ms)}</td><td>${fmt(x.plays)}</td></tr>`).join('')}</tbody></table>`:'<div class="empty-small">No music data yet. Import your Spotify history to populate this page.</div>';}
function render(){
  const isList=['tracks','artists','albums','history'].includes(currentView);
  $('empty-state').classList.toggle('hidden',!(currentView==='overview'&&allEvents.length===0));
  $('dashboard').classList.toggle('hidden',!(currentView==='overview'&&allEvents.length>0));
  $('list-view').classList.toggle('hidden',!isList);
  $('import-view').classList.toggle('hidden',currentView!=='import');
  if(currentView==='overview'&&allEvents.length)renderOverview();
  if(isList)renderList();
}
function setView(view){if(!['overview','tracks','artists','albums','history','import'].includes(view))return;currentView=view;document.querySelectorAll('.nav[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));const names={overview:'Overview',tracks:'Top tracks',artists:'Artists',albums:'Albums',history:'Listening history',import:'Import Spotify data'};$('page-title').textContent=names[view];render();window.scrollTo({top:0,behavior:'smooth'});}
// Bind navigation directly as well as delegating clicks. This is reliable
// across desktop sidebar and the compact mobile navigation.
function bindNavigation(){
  document.querySelectorAll('[data-view]').forEach(button=>{
    button.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      setView(button.dataset.view);
    });
  });
  document.querySelectorAll('[data-go]').forEach(button=>{
    button.addEventListener('click',event=>{
      event.preventDefault();
      setView(button.dataset.go);
    });
  });
}
bindNavigation();
$('import-top').addEventListener('click',()=>setView('import'));
$('start-import').addEventListener('click',()=>setView('import'));
$('file-input').addEventListener('change',e=>{if(e.target.files&&e.target.files.length)importFiles(e.target.files);e.target.value='';});
$('dropzone').addEventListener('dragover',e=>{e.preventDefault();$('dropzone').classList.add('drag');});
$('dropzone').addEventListener('dragleave',()=>$('dropzone').classList.remove('drag'));
$('dropzone').addEventListener('drop',e=>{e.preventDefault();$('dropzone').classList.remove('drag');importFiles([...e.dataTransfer.files]);});
$('period-filter').addEventListener('change',e=>{currentPeriod=e.target.value;renderOverview();});$('list-search').addEventListener('input',renderList);
$('clear-data').addEventListener('click',async()=>{if(confirm('Permanently clear all imported listening data from this browser?')){await clearAll();allEvents=[];setView('overview');$('import-status').textContent='All local listening data has been cleared.';}});
(async()=>{try{allEvents=await getAll();}catch(err){console.error(err);const status=$('import-status');if(status)status.textContent='Local storage could not be opened in this browser. Try the latest Chrome version.';}try{render();}catch(err){console.error('Ambar.fm render error:',err);const title=$('page-title');if(title)title.textContent='Ambar.fm needs a refresh';}if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(console.warn);})();
