(function(global){
 const C=PortfolioCore;
 class Workspace {
  constructor(){this.zip=null;this.files=new Map();this.overrides=new Map();this.deleted=new Set();this.history=[];this.future=[];this.root='';this.name='portfolio';this.original=null;this.listeners=[];this.cache=new Map();}
  async import(file){
   const zip=await JSZip.loadAsync(file);
   for(const e of Object.values(zip.files)){const original=e.unsafeOriginalName||e.name;if(original.includes('\\')||original.split('/').includes('..')||original.startsWith('/'))throw Error('The ZIP contains unsafe paths. Please choose a normal website ZIP.');}
   const html=Object.keys(zip.files).filter(n=>/(^|\/)index\.html?$/i.test(n)&&!n.includes('/.git/'));
   if(!html.length)throw Error('No index.html found. Import the complete static website ZIP.');
   html.sort((a,b)=>a.split('/').length-b.split('/').length);
   this.zip=zip;this.root=html[0].slice(0,html[0].lastIndexOf('/')+1);this.entry=html[0].slice(this.root.length);this.name=file.name?.replace(/\.zip$/i,'')||'portfolio';this.original=file;
   this.files=new Map(Object.entries(zip.files));this.overrides.clear();this.deleted.clear();this.cache.clear();this.history=[];this.future=[];
   return this;
  }
  paths(){return [...new Set([...this.files.keys(),...this.overrides.keys()])].filter(p=>!this.deleted.has(p)).sort();}
  sitePaths(){return this.paths().filter(p=>p.startsWith(this.root)&&!p.slice(this.root.length).split('/').some(x=>['.git','node_modules'].includes(x)));}
  async text(path){if(this.deleted.has(path))return '';if(this.overrides.has(path)){const d=this.overrides.get(path);return typeof d==='string'?d:await new Blob([d]).text();}if(this.cache.has(path))return this.cache.get(path);const f=this.files.get(path);if(!f)return '';const s=await f.async('string');this.cache.set(path,s);return s;}
  async blob(path){if(this.deleted.has(path))return null;if(this.overrides.has(path))return new Blob([this.overrides.get(path)],{type:mime(path)});const f=this.files.get(path);return f?new Blob([await f.async('uint8array')],{type:mime(path)}):null;}
  async models(){const result=[];for(const path of this.sitePaths().filter(p=>p.startsWith(this.root+'config/')&&/\.(js|json)$/i.test(p))){try{const source=await this.text(path);const roots=path.endsWith('.json')?[{name:'JSON',value:JSON.parse(source)}]:C.exportsOf(source);result.push({file:path,roots});}catch(e){result.push({file:path,roots:[],error:e.message});}}return result;}
  async get(ref){const s=await this.text(ref.file);if(ref.root==='JSON'){let v=JSON.parse(s);for(const k of ref.path||[])v=v[k];return v;}return C.get(s,ref.root,ref.path);}
  async set(ref,value,label='Edit field'){const s=await this.text(ref.file);let next;if(ref.root==='JSON'){let data=JSON.parse(s),v=data,p=ref.path||[];if(!p.length)data=value;else{for(const k of p.slice(0,-1))v=v[k];v[p.at(-1)]=value;}next=JSON.stringify(data,null,2);}else next=C.patch(s,ref.root,ref.path,value);if(next!==s)this.commit(new Map([[ref.file,next]]),label);}
  commit(changes,label='Edit'){changes=new Map([...changes].filter(([p,v])=>v===null?!this.deleted.has(p):this.deleted.has(p)||v!==(this.overrides.has(p)?this.overrides.get(p):this.cache.get(p))));if(!changes.size)return;const before=new Map();for(const [p,data]of changes){before.set(p,{exists:this.overrides.has(p),data:this.overrides.get(p),deleted:this.deleted.has(p)});if(data===null){this.deleted.add(p);this.overrides.delete(p);}else{this.deleted.delete(p);this.overrides.set(p,data);}}
   this.history.push({before,changes,label});if(this.history.length>60)this.history.shift();this.future=[];this.notify();
  }
  undo(){const h=this.history.pop();if(!h)return;for(const [p,s]of h.before){s.exists?this.overrides.set(p,s.data):this.overrides.delete(p);s.deleted?this.deleted.add(p):this.deleted.delete(p);}this.future.push(h);this.notify();}
  redo(){const h=this.future.pop();if(!h)return;for(const[p,v]of h.changes){if(v===null){this.deleted.add(p);this.overrides.delete(p);}else{this.deleted.delete(p);this.overrides.set(p,v);}}this.history.push(h);this.notify();}
  notify(){this.listeners.forEach(fn=>fn());}
  async export(progress){const result=new JSZip();for(const p of this.paths()){const orig=this.files.get(p);if(this.overrides.has(p))result.file(p,this.overrides.get(p));else if(orig)result.files[p]=orig;}return result.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6},streamFiles:true},progress);}
  async rename(oldPath,newPath){if(this.paths().includes(newPath))throw Error('A file already exists at that location.');const data=await this.blob(oldPath);if(!data)throw Error('File not found');const changes=new Map([[oldPath,null],[newPath,await data.arrayBuffer()]]),from=oldPath.slice(this.root.length),to=newPath.slice(this.root.length);
   for(const p of this.sitePaths().filter(p=>/\.(js|json|html|css)$/i.test(p))){const s=await this.text(p);let next=s;
    const relative=target=>{const a=p.slice(0,p.lastIndexOf('/')).split('/'),b=target.split('/');while(a.length&&b.length&&a[0]===b[0]){a.shift();b.shift();}return '../'.repeat(a.length)+b.join('/');};
    const rewrite=v=>{if(v===from)return to;if(v==='./'+from)return './'+to;if(/^(https?:|data:|blob:|#)/.test(v))return v;try{const match=v.match(/^([^?#]*)(.*)$/);if(C.resolve(p,match[1])===oldPath){let result=relative(newPath);if(v.startsWith('./')&&!result.startsWith('.'))result='./'+result;return result+match[2];}}catch{}return v;};
    if(p.endsWith('.js')){try{next=C.rewriteStrings(s,rewrite);}catch{continue;}}
    else if(p.endsWith('.json')){next=s.replace(/"(?:[^"\\]|\\.)*"/g,literal=>{try{const v=JSON.parse(literal),n=rewrite(v);return v===n?literal:JSON.stringify(n);}catch{return literal;}});}
    else if(p.endsWith('.css')){next=s.replace(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/g,(full,q,url)=>{const n=rewrite(url);return n===url?full:`url(${q}${n}${q})`;});}
    else{next=s.replace(/\b(src|href|poster|srcset)=(['"])(.*?)\2/gi,(full,attr,q,v)=>{const n=attr.toLowerCase()==='srcset'?v.split(',').map(item=>{const[u,...size]=item.trim().split(/\s+/);return [rewrite(u),...size].join(' ');}).join(', '):rewrite(v);return n===v?full:`${attr}=${q}${n}${q}`;}).split(from).join(to);}
    if(next!==s)changes.set(p,next);
   }
   this.commit(changes,'Move asset and update references');
  }
 }
 function mime(p){return ({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',svg:'image/svg+xml',mp4:'video/mp4',webm:'video/webm',ogg:'audio/ogg',mp3:'audio/mpeg',pdf:'application/pdf',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',css:'text/css',js:'text/javascript',json:'application/json',html:'text/html'})[p.split('.').at(-1).toLowerCase()]||'application/octet-stream';}
 function db(){return new Promise((resolve,reject)=>{const r=indexedDB.open('portfolio-studio-local',1);r.onupgradeneeded=()=>r.result.createObjectStore('drafts');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 const drafts={async read(){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction('drafts'),r=t.objectStore('drafts').get('current');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);t.oncomplete=()=>d.close();});},async save(w){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction('drafts','readwrite');t.objectStore('drafts').put({original:w.original,name:w.name,overrides:[...w.overrides],deleted:[...w.deleted],time:Date.now()},'current');t.oncomplete=()=>{d.close();resolve();};t.onerror=()=>reject(t.error);});},async remove(){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction('drafts','readwrite');t.objectStore('drafts').delete('current');t.oncomplete=()=>{d.close();resolve();};t.onerror=()=>reject(t.error);});}};
 global.PortfolioWorkspace=Workspace;global.PortfolioMime=mime;global.PortfolioDrafts=drafts;
})(globalThis);
