/* Structural analysis. Parses source; never evaluates imported settings. */
(function(global){
 const C=global.PortfolioCore;
 const key=r=>JSON.stringify([r.file,r.script??null,r.root,r.path||[]]);
 const norm=s=>String(s??'').replace(/\s+/g,' ').trim();
 const astRef=(file,path,script)=>({file,root:'$ast',path,...(script===undefined?{}:{script})});
 function visit(n,fn,path=[]){if(!n||typeof n!=='object')return;if(n.type)fn(n,path);for(const[k,v]of Object.entries(n)){if(['start','end'].includes(k))continue;if(Array.isArray(v))v.forEach((x,i)=>visit(x,fn,[...path,k,i]));else if(v&&typeof v==='object')visit(v,fn,[...path,k]);}}
 function isData(n){return n&&['ObjectExpression','ArrayExpression'].includes(n.type);}
 function sourceModel(file,source,script){
  const ast=C.parse(source),roots=[],imports=[],usage=[],fields=C.sourceFields(source),exported=C.exportsOf(source),covered=new Set();
  for(const x of exported){let path;visit(ast,(n,p)=>{if(n.start===x.node.start&&n.end===x.node.end)path=p;});if(!path)continue;roots.push({...x,ref:{file,root:x.name,path:[],...(script===undefined?{}:{script})},label:x.name==='default'?C.label(file.split('/').pop().replace(/\.[^.]+$/,'')):C.label(x.name)});covered.add(x.node.start);}
  visit(ast,(n,p)=>{
   if(n.type==='ImportDeclaration')imports.push({from:n.source.value,bindings:n.specifiers.map(x=>({local:x.local.name,imported:x.type==='ImportDefaultSpecifier'?'default':x.type==='ImportNamespaceSpecifier'?'*':x.imported.name}))});
   if(n.type==='ExportNamedDeclaration'&&n.source)imports.push({from:n.source.value,bindings:n.specifiers.map(x=>({local:x.exported.name,imported:x.local.name}))});
   if(n.type==='MemberExpression'&&!n.computed&&n.property?.name)usage.push(n.property.name);
   if(n.type==='VariableDeclarator'&&n.id.type==='Identifier'&&isData(n.init)&&!covered.has(n.init.start)){roots.push({name:n.id.name,label:C.label(n.id.name),node:n.init,value:C.value(n.init,source),ref:astRef(file,[...p,'init'],script)});covered.add(n.init.start);}
   if(n.type==='AssignmentExpression'&&isData(n.right)&&!covered.has(n.right.start)){roots.push({name:source.slice(n.left.start,n.left.end),label:C.label(source.slice(n.left.start,n.left.end)),node:n.right,value:C.value(n.right,source),ref:astRef(file,[...p,'right'],script)});covereded(n.right.start);}
  });
  function covereded(start){covered.add(start);}
  return {file,script,source,ast,roots,imports,usage:[...new Set(usage)],fields};
 }
 function jsonModel(file,source){const value=JSON.parse(source);return {file,source,roots:[{name:'JSON',label:C.label(file.split('/').pop().replace(/\.json$/i,'')),value,ref:{file,root:'JSON',path:[]}}],imports:[],usage:[],fields:[]};}
 async function analyze(w){
  const inventory=[],models=[],diagnostics=[],references=[],paths=w.sitePaths().sort((a,b)=>Number(!/(^|\/)(config|settings|data)\//i.test(a))-Number(!/(^|\/)(config|settings|data)\//i.test(b))||a.localeCompare(b));w.analysisCache||=new Map();
  for(const file of paths){if(file.endsWith('/'))continue;const identity=w.overrides.has(file)?w.overrides.get(file):w.files.get(file),ext=file.split('.').pop().toLowerCase();let status='asset',detail='Preserved file';
   if(/\.(?:js|mjs|cjs|json|html?|css)$/i.test(file)){
    if(/(?:^|\/)(?:vendor|vendors|\.git|node_modules)\/|\.min\.js$/i.test(file)){status='library';detail='Third-party library; source retained';}
    else {let cached=w.analysisCache.get(file);if(!cached||cached.identity!==identity){const source=await w.text(file);cached={identity,models:[],links:[],status:'source',detail:'Source indexed'};
     try{if(['js','mjs','cjs'].includes(ext)){cached.models=[sourceModel(file,source)];cached.status='analyzed';}
      else if(ext==='json'){cached.models=[jsonModel(file,source)];cached.status='analyzed';}
      else if(/^html?$/.test(ext)&&typeof DOMParser!=='undefined'){const doc=new DOMParser().parseFromString(source,'text/html');for(const element of doc.querySelectorAll('[src],[href],[poster]'))for(const attr of ['src','href','poster']){const raw=element.getAttribute(attr);if(raw&&!/^(?:[a-z]+:|#|\/\/)/i.test(raw))cached.links.push(raw);}[...doc.querySelectorAll('script')].forEach((s,i)=>{if(!s.src&&(!s.type||s.type==='module'||/javascript/.test(s.type))&&s.textContent.trim()){try{cached.models.push(sourceModel(file,s.textContent,i));}catch(e){cached.detail='Some inline scripts require source editing: '+e.message;}}});cached.status='analyzed';}
      else if(ext==='css'){cached.detail='Stylesheet indexed; selected elements expose appearance controls';cached.links=[...source.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g)].map(m=>m[1]);cached.status='analyzed';}
     }catch(e){cached.status='source-only';cached.detail=e.message;}w.analysisCache.set(file,cached);}
     for(const raw of cached.links||[])try{const to=raw.startsWith('/')?C.normalize(w.root+raw.slice(1).split(/[?#]/)[0]):C.resolve(file,raw.split(/[?#]/)[0]);if(paths.includes(to))references.push({from:file,to,type:'resource'});}catch{}models.push(...cached.models);status=cached.status;detail=cached.detail;if(status==='source-only'||detail.startsWith('Some inline'))diagnostics.push({file,message:detail});
    }
   }else if(['ts','tsx','jsx','vue','svelte','yaml','yml','toml','xml','php'].includes(ext)){status='source-only';detail='Requires its language/build tools; available in Source files';diagnostics.push({file,message:detail});}
   inventory.push({file,status,detail});
  }
  const byFile=new Map();for(const m of models){if(!byFile.has(m.file))byFile.set(m.file,[]);byFile.get(m.file).push(m);}
  const dependencies=[];for(const m of models)for(const i of m.imports)try{if(i.from.startsWith('.'))dependencies.push({from:m.file,to:C.resolve(m.file,i.from),bindings:i.bindings});}catch{}
  const result={inventory,models,dependencies,references,diagnostics,byFile};w.analysis=result;return result;
 }
 function findModel(a,r){return a?.models.find(m=>m.file===r.file&&m.script===r.script);}
 function nodeFor(model,r){if(r.root==='JSON')return null;return C.locate(model.source,r.root,r.path||[]);}
 function nodePath(model,node){let found;visit(model.ast,(n,p)=>{if(n.start===node.start&&n.end===node.end)found=p;});return found;}
 function describeNode(model,n,p,label){return {label,ref:astRef(model.file,p,model.script),value:C.value(n,model.source),type:n.type};}
 function children(model,r){const n=nodeFor(model,r);if(!n)return [];const path=nodePath(model,n),rows=[];
  if(n.type==='ObjectExpression')for(let i=0;i<n.properties.length;i++){const p=n.properties[i];if(p.type==='SpreadElement')rows.push(describeNode(model,p.argument,[...path,'properties',i,'argument'],'Inherited settings'));else if(p.type==='Property'&&!p.computed&&!p.method&&p.kind==='init')rows.push(describeNode(model,p.value,[...path,'properties',i,'value'],String(p.key.name??p.key.value)));}
  else if(n.type==='ArrayExpression')n.elements.forEach((x,i)=>{if(x)rows.push(describeNode(model,x.type==='SpreadElement'?x.argument:x,[...path,'elements',i,...(x.type==='SpreadElement'?['argument']:[])],'Item '+(i+1)));});
  else if(n.type==='CallExpression'||n.type==='NewExpression')n.arguments.forEach((x,i)=>rows.push(describeNode(model,x.type==='SpreadElement'?x.argument:x,[...path,'arguments',i,...(x.type==='SpreadElement'?['argument']:[])],isData(x)?'Options':i===0&&x.type==='Literal'?'Text':'Argument '+(i+1))));
  else if(n.type==='ConditionalExpression'){for(const part of ['consequent','alternate'])rows.push(describeNode(model,n[part],[...path,part],part==='consequent'?'When condition is true':'Otherwise'));}
  else if(n.type==='LogicalExpression'){for(const part of ['left','right'])rows.push(describeNode(model,n[part],[...path,part],part==='left'?'Primary value':'Fallback value'));}
  return rows;
 }
 function resolve(a,r,seen=new Set()){
  const m=findModel(a,r);if(!m||r.root==='JSON'||seen.has(key(r)))return null;seen.add(key(r));let n=nodeFor(m,r),props=[];
  while(n?.type==='MemberExpression'&&(!n.computed||n.property.type==='Literal')){props.unshift(n.computed?n.property.value:n.property.name);n=n.object;}
  if(n?.type!=='Identifier')return null;
  let target=m,decl,path;
  const imp=m.imports.flatMap(i=>i.bindings.map(b=>({...b,from:i.from}))).find(b=>b.local===n.name);
  if(imp){let file;try{file=C.resolve(m.file,imp.from);}catch{return null;}target=a.models.find(x=>x.file===file);if(!target)return null;const name=imp.imported==='*'?props.shift():imp.imported;const root=target.roots.find(x=>x.name===name);if(root){decl=root.node;path=nodePath(target,root.node);}else{visit(target.ast,(x,p)=>{if(x.type==='FunctionDeclaration'&&x.id?.name===name){decl=x;path=p;}});}}
  else {visit(m.ast,(x,p)=>{if(x.type==='VariableDeclarator'&&x.id.name===n.name){decl=x.init;path=[...p,'init'];}if(x.type==='FunctionDeclaration'&&x.id?.name===n.name){decl=x;path=p;}});}
  if(!decl)return null;for(const prop of props){if(decl.type==='ObjectExpression'){const i=decl.properties.findIndex(x=>x.type==='Property'&&(x.key.name??x.key.value)===prop);if(i<0)return null;decl=decl.properties[i].value;path=[...path,'properties',i,'value'];}else return null;}
  const result=astRef(target.file,path,target.script);if(decl.type==='Identifier'||decl.type==='MemberExpression')return resolve(a,result,seen)||result;return result;
 }
 function contexts(a,r){const m=findModel(a,r);if(!m)return [];if(r.root==='JSON')return (r.path||[]).map((_,i)=>{const path=r.path.slice(0,i);let value=m.roots[0].value;for(const k of path)value=value?.[k];return {label:C.label(path.at(-1)||'All settings'),ref:{...r,path},type:Array.isArray(value)?'ArrayExpression':'ObjectExpression'};}).reverse();const n=nodeFor(m,r),found=[];visit(m.ast,(x,p)=>{if(x.start<=n.start&&x.end>=n.end&&['ObjectExpression','ArrayExpression','CallExpression'].includes(x.type))found.push({n:x,p});});return found.sort((a,b)=>(a.n.end-a.n.start)-(b.n.end-b.n.start)).map(({n,p})=>({ref:astRef(m.file,p,m.script),label:n.type==='ArrayExpression'?'Manage this list':n.type==='CallExpression'?'Element options':'Related settings',type:n.type}));}
 function matches(a,message){const targets=[message.text,message.href,message.src,...(message.contextValues||[])].map(norm).filter(v=>v.length>1),direct=[message.text,message.href,message.src].map(norm),result=[];
  for(const m of a.models){if(m.file.includes('studio-element-edits')||/package(-lock)?\.json$/.test(m.file))continue;
   const push=(r,value,label)=>{if(typeof value==='string'&&targets.includes(norm(value))&&label!=='code')result.push({r,v:value,label,score:direct.includes(norm(value))?100:60});};
   if(m.file.endsWith('.json')){function scan(v,path=[]){if(typeof v==='string')push({file:m.file,root:'JSON',path},v,path.at(-1)||'Text');else if(v&&typeof v==='object')Object.entries(v).forEach(([k,x])=>scan(x,[...path,Array.isArray(v)?Number(k):k]));}scan(m.roots[0].value);}
   else for(const f of m.fields)push({...astRef(m.file,f.path,m.script)},f.value,f.label);
  }
  return result.sort((a,b)=>b.score-a.score);
 }
 function staticCollections(doc,minimum=2){const groups=[];const shape=e=>e.tagName+'|'+[...e.classList].sort().join('.')+'|'+[...e.children].map(x=>x.tagName).join(',');
  const selector=e=>{if(e.id)return '#'+CSS.escape(e.id);const path=[];while(e&&e!==doc.body){path.unshift(e.tagName.toLowerCase()+':nth-child('+([...e.parentElement.children].indexOf(e)+1)+')');e=e.parentElement;}return 'body > '+path.join(' > ');};
  for(const parent of doc.querySelectorAll('body *')){if(parent.closest('script,style,svg,nav,select')||parent.children.length<minimum)continue;const grouped=new Map();for(const e of parent.children){if(!e.matches('article,li,figure,a,section,div'))continue;const sig=shape(e);if(!grouped.has(sig))grouped.set(sig,[]);grouped.get(sig).push(e);}for(const items of grouped.values())if(items.length>=minimum&&items.every(e=>e.querySelector('img,h1,h2,h3,h4,a')||e.matches('a,li'))){groups.push({parent:selector(parent),selectors:items.map(selector),label:parent.id||parent.getAttribute('aria-label')||[...parent.classList][0]||'Repeated items',items:items.map(e=>(e.querySelector('h1,h2,h3,h4')?.textContent||e.textContent).trim().slice(0,70)||e.querySelector('img')?.alt||'Item')});}}
  return groups;
 }


 function listTemplate(a,r){
  const model=findModel(a,r);if(!model||r.root==='JSON')return null;const node=nodeFor(model,r);if(node.type!=='ArrayExpression')return null;let name;
  visit(model.ast,(n)=>{if(n.type==='VariableDeclarator'&&n.init?.start===node.start&&n.init?.end===node.end)name=n.id.name;if(n.type==='Property'&&n.value?.start===node.start&&n.value?.end===node.end)name=n.key.name??n.key.value;});if(!name)return null;
  const shape=Object.create(null);const matches=n=>n?.type==='Identifier'&&n.name===name||n?.type==='MemberExpression'&&!n.computed&&n.property.name===name;
  for(const source of a.models)if(source.ast)visit(source.ast,n=>{
   if(n.type!=='CallExpression'||n.callee.type!=='MemberExpression'||!['map','forEach','filter'].includes(n.callee.property.name)||!matches(n.callee.object))return;const fn=n.arguments[0],param=fn?.params?.[0];if(param?.type!=='Identifier')return;
   visit(fn.body,member=>{if(member.type!=='MemberExpression')return;const keys=[];let current=member;while(current.type==='MemberExpression'&&!current.computed){keys.unshift(current.property.name);current=current.object;}if(current.type!=='Identifier'||current.name!==param.name||!keys.length||keys.some(k=>['__proto__','constructor','prototype','length','map','filter','forEach','toString','toLowerCase'].includes(k)))return;let target=shape;for(const key of keys.slice(0,-1)){if(!target[key]||typeof target[key]!=='object')target[key]=Object.create(null);target=target[key];}const key=keys.at(-1);if(!(key in target))target[key]=/^(enabled|visible|active|show[A-Z]|is[A-Z])/.test(key)?true:/^(count|order|index|width|height)$/.test(key)?0:'';});
  });return Object.keys(shape).length?shape:null;
 }
 function mutateCollection(doc,group,action,index){const parent=doc.querySelector(group.parent),items=group.selectors.map(s=>doc.querySelector(s));if(!parent||items.some(x=>!x))throw Error('This list changed. Open it again.');const item=items[index];if(action==='duplicate'){const copy=item.cloneNode(true),ids=new Map();for(const el of [copy,...copy.querySelectorAll('[id]')])if(el.id){let id=el.id+'-copy',n=2;while(doc.getElementById(id)||[...ids.values()].includes(id))id=el.id+'-copy-'+n++;ids.set(el.id,id);el.id=id;}for(const el of [copy,...copy.querySelectorAll('*')])for(const attr of ['for','aria-labelledby','aria-describedby','aria-controls','href'])if(el.hasAttribute(attr)){const old=el.getAttribute(attr);el.setAttribute(attr,attr==='href'&&old.startsWith('#')?'#'+(ids.get(old.slice(1))||old.slice(1)):old.split(' ').map(id=>ids.get(id)||id).join(' '));}item.after(copy);}else if(action==='remove'){if(items.length<2)throw Error('Keep one template item to add more later.');item.remove();}else if(action==='up'&&index>0)items[index-1].before(item);else if(action==='down'&&index<items.length-1)items[index+1].after(item);
 }
 global.PortfolioAnalysis={analyze,sourceModel,jsonModel,children,resolve,contexts,matches,key,findModel,nodeFor,nodePath,astRef,visit,staticCollections,mutateCollection,listTemplate};
 if(typeof module!=='undefined')module.exports=global.PortfolioAnalysis;
})(globalThis);
