(function(global){
 const C=PortfolioCore;
 class Preview {
  constructor(frame,onSelect,onError){this.frame=frame;this.onSelect=onSelect;this.onError=onError;this.urls=[];this.assetCache=new Map();this.hash='#top';this.scroll=0;this.select=true;this.generation=0;this.entry=null;
   window.addEventListener('message',e=>{if(e.source!==frame.contentWindow||!e.data?.studio)return;const m=e.data;if(m.type==='select')onSelect(m);if(m.type==='route'){this.hash=m.hash;this.scroll=m.scroll||0;this.onRoute?.(m.hash);}if(m.type==='error')onError(m.message);if(m.type==='page')this.onPage?.(m.href);});
  }
  async build(w,{intro=false}={}){
   const generation=++this.generation,urls=[],assets=new Map(),root=w.root,entry=this.entry||w.entry;const files=w.sitePaths();
   const objectURL=(data,type)=>{const u=URL.createObjectURL(new Blob([data],{type}));urls.push(u);return u;};
   for(const path of files.filter(p=>!w.files.get(p)?.dir&&!/\.(js|mjs|cjs|json|css|html?|md|txt|map)$/i.test(p))){
    const identity=w.overrides.has(path)?w.overrides.get(path):w.files.get(path);let cached=this.assetCache.get(path);
    if(!cached||cached.identity!==identity){cached={identity,url:'__STUDIO_ASSET_'+this.assetCache.size+'_'+Date.now()+'__',blob:await w.blob(path)};this.assetCache.set(path,cached);}
    assets.set(path,cached.url);
   }
   const asset=(input,from)=>{if(typeof input!=='string'||/^(data:|blob:|https?:|mailto:|tel:|#)/i.test(input))return input;try{const [base,suffix]=input.split(/(?=[?#])/);const rootAsset=assets.get(C.normalize(root+base.replace(/^\.\//,'').replace(/^\//,''))),relativeAsset=assets.get(C.resolve(from,base));const exact=/\.(css|html?)$/.test(from)?relativeAsset||rootAsset:rootAsset||relativeAsset;return exact?exact+(suffix||''):input;}catch{return input;}};
   const sources=new Map();for(const p of files.filter(p=>/\.(js|mjs)$/i.test(p))){sources.set(p,await w.text(p));}
   if(!intro&&sources.has(root+'config/intro.js')){try{const source=sources.get(root+'config/intro.js'),widgets=C.get(source,'introWidgets');if(Array.isArray(widgets))sources.set(root+'config/intro.js',C.patch(source,'introWidgets',[],widgets.map(x=>({...x,enabled:false}))));}catch{}}
   const cssCache=new Map();const css=async(path,seen=new Set())=>{if(seen.has(path))return '';if(cssCache.has(path))return cssCache.get(path);seen.add(path);let s=await w.text(path);s=s.replace(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/g,(_,q,url)=>`url("${asset(url,path)}")`);const imports=[...s.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]\)?\s*;/g)];for(const m of imports)if(!/^https?:/.test(m[1])){const p=C.resolve(path,m[1]);s=s.replace(m[0],await css(p,seen));}cssCache.set(path,s);return s;};
   const compile=(path)=>{let source=sources.get(path);if(source===undefined)throw Error('Missing local script: '+path);source=C.rewriteStrings(source,v=>asset(v,path));const ast=C.parse(source),patches=[],after=[];
    for(const node of ast.body){
     if(node.type==='ImportDeclaration'){
      if(!node.source.value.startsWith('.'))throw Error('Preview needs a local built script for import '+node.source.value);
      const dep=C.resolve(path,node.source.value),parts=node.specifiers.map(s=>s.type==='ImportNamespaceSpecifier'?`const ${s.local.name}=__require(${JSON.stringify(dep)});`:`const ${s.local.name}=__require(${JSON.stringify(dep)})[${JSON.stringify(s.type==='ImportDefaultSpecifier'?'default':s.imported.name)}];`).join('');
      patches.push({start:node.start,end:node.end,text:parts||`__require(${JSON.stringify(dep)});`});
     } else if(node.type==='ExportNamedDeclaration'){
      if(node.declaration){patches.push({start:node.start,end:node.declaration.start,text:''});const d=node.declaration;const names=d.type==='VariableDeclaration'?d.declarations.map(x=>x.id.name):[d.id.name];for(const n of names)after.push(`Object.defineProperty(exports,${JSON.stringify(n)},{get:()=>${n}});`);}
      else if(!node.source){patches.push({start:node.start,end:node.end,text:''});for(const s of node.specifiers)after.push(`Object.defineProperty(exports,${JSON.stringify(s.exported.name)},{get:()=>${s.local.name}});`);}
      else throw Error('Re-export needs a built script: '+path);
     } else if(node.type==='ExportDefaultDeclaration'){patches.push({start:node.start,end:node.declaration.start,text:'const __default='});after.push('exports.default=__default;');}
    }
    return C.edits(source,patches)+'\n'+after.join('\n');
   };
   let doc=new DOMParser().parseFromString(await w.text(root+entry),'text/html');doc.querySelectorAll('base,meta[http-equiv="Content-Security-Policy"]').forEach(e=>e.remove());
   if(doc.querySelector('#site-shell'))doc.querySelector('#intro-root')?.replaceChildren();
   for(const link of [...doc.querySelectorAll('link[rel="stylesheet"]')]){const href=link.getAttribute('href');if(/^https?:/.test(href))continue;try{const style=doc.createElement('style');style.textContent=await css(C.resolve(root+entry,href));link.replaceWith(style);}catch{link.remove();}}
   doc.querySelectorAll('[src],[href],[poster],[srcset], [style]').forEach(e=>{for(const attr of ['src','href','poster'])if(e.hasAttribute(attr)&&e.tagName!=='SCRIPT')e.setAttribute(attr,asset(e.getAttribute(attr),root+entry));if(e.hasAttribute('srcset'))e.setAttribute('srcset',e.getAttribute('srcset').split(',').map(x=>{const [u,...rest]=x.trim().split(/\s+/);return [asset(u,root+entry),...rest].join(' ');}).join(', '));if(e.hasAttribute('style'))e.setAttribute('style',e.getAttribute('style').replace(/url\(['"]?([^)'"\s]+)['"]?\)/g,(_,u)=>`url("${asset(u,root+entry)}")`));});
   const moduleEntries=[];
   for(const script of [...doc.querySelectorAll('script')]){if(script.type==='importmap'){script.remove();continue;}const src=script.getAttribute('src');if(src&&/^https?:/.test(src)){script.remove();continue;}
    if(script.type==='module'){if(src)moduleEntries.push(C.resolve(root+entry,src));else{const p=root+'__inline-'+moduleEntries.length+'.js';sources.set(p,script.textContent);moduleEntries.push(p);}script.remove();}
    else if(src){script.removeAttribute('src');script.removeAttribute('defer');script.removeAttribute('async');const p=C.resolve(root+entry,src);script.textContent=C.rewriteStrings(sources.get(p)||'',v=>asset(v,p));}
   }
   const needed=new Set(),visit=p=>{if(needed.has(p))return;needed.add(p);for(const n of C.parse(sources.get(p)||'').body)if(n.type==='ImportDeclaration')visit(C.resolve(p,n.source.value));};moduleEntries.forEach(visit);
   const runtime=doc.createElement('script');runtime.textContent='(()=>{const __cache={},__factories={'+[...needed].map(p=>`${JSON.stringify(p)}:function(exports,__require){\n${compile(p)}\n}`).join(',')+'};function __require(p){if(__cache[p])return __cache[p];if(!__factories[p])throw Error("Missing module "+p);const e=__cache[p]={};__factories[p](e,__require);return e;}'+moduleEntries.map(p=>`__require(${JSON.stringify(p)});`).join('')+'})();';doc.body.append(runtime);
   const bridge=doc.createElement('script');bridge.textContent=`(${bridgeCode.toString()})(${JSON.stringify({hash:this.hash,scroll:this.scroll,select:this.select,intro,pages:files.filter(p=>/\.html?$/.test(p)).map(p=>p.slice(root.length)),assets:Object.fromEntries([...assets].map(([p,u])=>[u,p.slice(root.length)]))})});`;doc.head.prepend(bridge);
   const csp=doc.createElement('meta');csp.httpEquiv='Content-Security-Policy';csp.content="default-src 'none'; script-src 'unsafe-inline' blob:; style-src 'unsafe-inline' blob: https:; img-src blob: data: https:; media-src blob: data: https:; font-src blob: data: https:; frame-src https://www.youtube-nocookie.com https://www.youtube.com; connect-src 'none'; form-action 'none'; base-uri 'none'";doc.head.prepend(csp);
   if(generation!==this.generation){urls.forEach(URL.revokeObjectURL);return;}
   doc.querySelectorAll('script').forEach(s=>s.textContent=s.textContent.replace(/<\/script/gi,'<\\/script'));
   const html='<!doctype html>\n'+doc.documentElement.outerHTML;
   const payload=[...assets].map(([p,token])=>({token,blob:this.assetCache.get(p).blob}));
   this.frame.onload=()=>{this.frame.onload=null;this.frame.contentWindow.postMessage({boot:true,html,assets:payload},'*');};
   this.frame.srcdoc='<script>addEventListener("message",function boot(e){if(e.source!==parent||!e.data?.boot)return;removeEventListener("message",boot);let html=e.data.html;for(const a of e.data.assets){const u=URL.createObjectURL(a.blob);html=html.split(a.token).join(u);}document.open();document.write(html);document.close();});<\/script>';
   const old=this.urls;this.urls=urls;setTimeout(()=>old.forEach(URL.revokeObjectURL),2000);
  }
  mode(select){this.select=select;this.frame.contentWindow?.postMessage({studio:true,type:'mode',select},'*');}
  route(hash){this.hash=hash;this.scroll=0;this.frame.contentWindow?.postMessage({studio:true,type:'route',hash},'*');}
  dispose(){this.urls.forEach(URL.revokeObjectURL);this.assetCache.clear();}
 }
 function bridgeCode(options){
  let selecting=options.select;const send=(type,extra={})=>parent.postMessage({studio:true,type,...extra},'*');
  window.addEventListener('error',e=>{if(!e.message.includes('ResizeObserver loop'))send('error',{message:e.message});});window.addEventListener('unhandledrejection',e=>send('error',{message:String(e.reason?.message||e.reason)}));
  const shim=()=>{const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k),clear:()=>values.clear()};};
  for(const name of ['localStorage','sessionStorage']){try{Object.defineProperty(window,name,{value:shim()});}catch{}}
  if(!options.intro)try{sessionStorage.setItem('portfolio-intro-seen','true');}catch{}
  if(options.hash)location.hash=options.hash;
  function selector(e){if(e.id)return '#'+CSS.escape(e.id);const parts=[];while(e&&e!==document.body){let part=e.tagName.toLowerCase();const p=e.parentElement;if(!p)break;part+=':nth-child('+(Array.prototype.indexOf.call(p.children,e)+1)+')';parts.unshift(part);if(p.id){parts.unshift('#'+CSS.escape(p.id));break;}e=p;}return parts.join(' > ');}
  function target(e){return e.closest('img,video,h1,h2,h3,h4,p,a,button,label,li,dt,dd,span')||e;}
  let outlined;document.addEventListener('pointerover',e=>{if(outlined)outlined.style.outline='';if(!selecting)return;outlined=target(e.target);if(outlined===document.body)return;outlined.style.outline='2px solid #55e2bd';outlined.style.outlineOffset='3px';},true);
  document.addEventListener('click',e=>{const t=target(e.target);if(selecting){e.preventDefault();e.stopImmediatePropagation();send('select',{selector:selector(t),tag:t.tagName,text:t.textContent.trim().slice(0,2000),src:options.assets[t.getAttribute('src')||t.getAttribute('poster')]||t.getAttribute('src')||t.getAttribute('poster')||'',href:t.getAttribute('href')||'',project:location.hash,style:t.getAttribute('style')||''});}else{const a=e.target.closest('a');if(a&&a.getAttribute('href')&&!a.getAttribute('href').startsWith('#')){e.preventDefault();if(/\.html?(?:[?#]|$)/.test(a.getAttribute('href'))&&!/^[a-z]+:|^\/\//i.test(a.getAttribute('href'))){send('page',{href:a.getAttribute('href')});return;}send('error',{message:'External links are disabled in the preview. They remain unchanged in your exported website.'});}}},true);
  document.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();},true);
  addEventListener('message',e=>{if(e.source!==parent||!e.data?.studio)return;const m=e.data;if(m.type==='mode'){selecting=m.select;if(outlined)outlined.style.outline='';}if(m.type==='route'){location.hash=m.hash;window.scrollTo(0,0);}});
  let timer;const track=()=>{clearTimeout(timer);timer=setTimeout(()=>send('route',{hash:location.hash,scroll:scrollY}),100);};addEventListener('hashchange',track);addEventListener('scroll',track,{passive:true});
  addEventListener('load',()=>{if(!options.intro){document.documentElement.classList.remove('intro-pending','intro-active');document.querySelector('#intro-root')?.replaceChildren();document.querySelectorAll('[inert]').forEach(e=>e.removeAttribute('inert'));}setTimeout(()=>scrollTo(0,options.scroll||0),150);send('ready');send('route',{hash:location.hash,scroll:scrollY});});
 }
 global.PortfolioPreview=Preview;
})(globalThis);
