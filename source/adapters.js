/* Small integrations for the supplied portfolio's generated HTML. */
(function(global){
 const C=PortfolioCore;
 async function syncIntro(w){
  const path=w.root+w.entry,original=await w.text(path),config=w.root+'config/intro.js';
  if(!original.includes('<!-- INTRO GUARD START -->')||!w.files.has(config))return;
  const changed=[...w.overrides.keys(),...w.deleted];
  if(!changed.some(p=>p===config||p===w.root+'config/image-manifest.js'||p.startsWith(w.root+'assets/')))return;
  const intro=C.get(await w.text(config),'introWidgets').find(x=>x.enabled);
  if(intro instanceof C.Raw)throw Error('Opening intro uses a computed configuration. Update its generated HTML using the original sync-intro script.');
  const columns=Math.max(1,Math.min(8,Math.floor(Number(intro?.collageColumns)||3))),rows=Math.max(1,Math.min(8,Math.floor(Number(intro?.collageMinRows)||3)));
  const sources=(intro?.backgroundAssets||[]).filter(s=>typeof s==='string'&&s.trim());
  const filled=sources.length?Array.from({length:Math.max(columns*rows,Math.ceil(sources.length/columns)*columns)},(_,i)=>sources[i%sources.length]):[];
  const escape=s=>String(s??'').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  const style=s=>escape(Object.entries(s||{}).map(([k,v])=>k.replace(/[A-Z]/g,x=>'-'+x.toLowerCase())+':'+v).join(';'));
  let manifest={};try{manifest=C.get(await w.text(w.root+'config/image-manifest.js'),'imageManifest');}catch{}
  const dependencies=new Set(filled.flatMap(source=>{const item=manifest[source.replace(/^\.\//,'')];return [source,item?.poster,...(item?.versions||[]).map(v=>v.src)].filter(Boolean).map(p=>w.root+p.replace(/^\.\//,''));}));
  let introManifestChanged=false;
  if(changed.includes(w.root+'config/image-manifest.js')){try{const before=C.get(await w.files.get(w.root+'config/image-manifest.js').async('string'),'imageManifest');introManifestChanged=filled.some(s=>JSON.stringify(before[s])!==JSON.stringify(manifest[s]));}catch{introManifestChanged=true;}}
  if(!changed.includes(config)&&!introManifestChanged&&!changed.some(p=>dependencies.has(p)))return;
  const images=await Promise.all(filled.map(async source=>{const item=manifest[source.replace(/^\.\//,'')],file=item?.versions?.[0]?.src||item?.poster||source;if(/^https?:|^data:/.test(file))return `<img class="intro-collage-image" alt="" src="${escape(file)}">`;const blob=await w.blob(w.root+file.replace(/^\.\//,''));if(!blob)return '';const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));return `<img class="intro-collage-image" alt="" src="data:${PortfolioMime(file)};base64,${btoa(binary)}">`;}));
  let html=original.replace(/(<!-- INTRO GUARD START -->)([\s\S]*?)(<!-- INTRO GUARD END -->)/,(_,a,css,z)=>a+css.replace(/grid-template-columns:repeat\([^;]+;/,`grid-template-columns:repeat(${columns},minmax(0,1fr));`).replace(/display:grid;gap:[^}]+/,'display:grid;gap:'+escape(intro?.titleGap||'1.5rem'))+z);
  html=html.replace(/<html\b[^>]*>/,tag=>{const doc=new DOMParser().parseFromString(tag+'<body></body>','text/html');doc.documentElement.classList.toggle('intro-pending',!!intro);return doc.documentElement.outerHTML.split('>')[0]+'>';});
  const markup=intro?`<div class="intro-splash" role="presentation"><div class="intro-collage" aria-hidden="true" style="grid-template-rows:repeat(${Math.ceil(filled.length/columns)||1},minmax(0,1fr))">${images.join('')}</div><div class="intro-noise" aria-hidden="true"></div><div class="intro-copy"><p class="intro-kicker">${escape(intro.kicker)}</p><h1 class="intro-title" style="${style(intro.style?.title)}">${escape(intro.title)}</h1><p class="intro-subtitle" style="${style(intro.style?.subtitle)}">${escape(intro.subtitle)}</p></div></div>`:'';
  html=html.replace(/<div id="intro-root">[\s\S]*?<\/div>\s*(?=<div id="site-shell">)/,`<div id="intro-root">${markup}</div>\n    `);
  if(html!==original)w.commit(new Map([[path,html]]),'Synchronize opening intro');
 }
 global.PortfolioAdapters={syncIntro};
})(globalThis);
