/* Structure-first inspector controls; uses the shared workspace and undo stack. */
const A=PortfolioAnalysis;

$('#field-search').oninput=()=>{const query=$('#field-search').value.toLowerCase();for(const node of $('#fields').querySelectorAll('.field,.branch,.list-card,.setting-group')){node.hidden=!!query&&!node.textContent.toLowerCase().includes(query)&&![...node.querySelectorAll('input,textarea')].some(x=>x.value.toLowerCase().includes(query));}};
function friendlyRef(r){return {...r,label:r.label||C.label(r.path?.at(-1)||r.root)};}
function groupBox(title,description,open=false){const box=h('details',{class:'setting-group',...(open?{open:''}:{})},[h('summary',{text:title}),h('p',{class:'field-help',text:description})]);return box;}
async function renderStructuredValue(parent,r){
 const model=A.findModel(W.analysis,r);if(!model){parent.append(button('Open source file',()=>openFiles(r.file),'add-item'));return;}
 const node=A.nodeFor(model,r),rows=A.children(model,r);
 if(node.type==='ArrayExpression'){
  const values=node.elements.map(x=>x?C.value(x,model.source):null);await renderArray(parent,r,values);return;
 }
 if(rows.length){parent.append(h('p',{class:'notice',text:node.type==='CallExpression'?'These options are passed to a helper. Edit them here without replacing the helper.':'Open a group to change its settings. Inherited settings are shared; local settings stay on this item.'}));
  for(const row of rows)await renderProperty(parent,{...row.ref,label:C.label(row.label)},row.label,row.value);
  if(node.type==='ObjectExpression')parent.append(button('+ Add local setting',()=>addStructuredField(r),'add-item'));
  if(node.type==='CallExpression'){
   const path=A.nodePath(model,node);
   const called={...r,root:'$ast',path:[...path,'callee']},target=A.resolve(W.analysis,called);
   if(target){const tm=A.findModel(W.analysis,target),fn=A.nodeFor(tm,target);let ret;
    if(fn.type==='FunctionDeclaration'||fn.type==='ArrowFunctionExpression'||fn.type==='FunctionExpression')A.visit(fn,(n,p)=>{if(!ret&&n.type==='ReturnStatement'&&n.argument?.type==='ObjectExpression')ret={...target,path:[...target.path,...p,'argument'],label:'Shared helper defaults'};});
    if(ret){parent.append(h('p',{class:'field-help',text:'This helper also supplies defaults. Changes to shared defaults affect every element using it.'}),button('Shared helper defaults ↗',()=>select(ret),'branch'));await renderHelperOverrides(parent,r,node,tm,fn,ret);}
   }
  }
 }else{const target=A.resolve(W.analysis,r);parent.append(h('p',{class:'notice',text:target?'This setting is connected to another definition. Open it to edit all of its fields.':'This is a computed expression. Its source is available; the editor cannot safely turn it into a simple control.'}));if(target)parent.append(button('Open connected settings ↗',()=>select({...target,label:r.label}),'branch'));parent.append(button('Open source file',()=>openFiles(r.file),'text-button'));}
}
async function addStructuredField(r){const x=await ask('Add a local setting',[{key:'key',label:'Setting name'},{key:'type',label:'Value type',choices:['text','number','switch','list','object']}],'Add setting');if(!x)return;if(['__proto__','prototype','constructor'].includes(x.key))throw Error('Choose a different name.');await W.enqueue(async()=>{const source=await W.source(r),node=C.locate(source,r.root,r.path);if(node.type!=='ObjectExpression')throw Error('Select an options group first.');if(node.properties.some(p=>p.type==='Property'&&(p.key.name??p.key.value)===x.key))throw Error('That setting exists already.');const value=({text:'',number:0,switch:true,list:[],object:{}})[x.type];const properties=node.properties.map(p=>source.slice(p.start,p.end));properties.push(JSON.stringify(x.key)+': '+C.serialize(value));await W.storeSource(r,source.slice(0,node.start)+'{\n'+properties.join(',\n')+'\n}'+source.slice(node.end),'Add local setting');});models=await W.models();await select(r);}
async function renderLinkedSettings(parent,m,direct){
 const links=direct.length?direct:A.matches(W.analysis,m),groups=[],seen=new Set();
 for(const match of links){for(const ctx of A.contexts(W.analysis,match.r)){const id=A.key(ctx.ref);if(!seen.has(id)){seen.add(id);groups.push({...ctx,source:match.r.file,score:match.score});}}}
 if(direct.length>1)parent.prepend(h('p',{class:'notice',text:'More than one source contains this value. Check the file and group name before editing; matches are suggestions, not a guaranteed binding.'}));
 if(groups.length){const related=groupBox('Content & custom settings','All discovered options around this content, including custom switches, layouts, lists and nested settings.',true);
  const first=groups.find(g=>g.type==='CallExpression'||g.type==='ObjectExpression')||groups[0];
  const model=A.findModel(W.analysis,first.ref);const rows=model&&first.ref.root!=='JSON'?A.children(model,first.ref):[];
  const quick=rows.filter(x=>!(x.value instanceof C.Raw)&&!(x.value&&typeof x.value==='object')&&!direct.some(d=>A.key(d.r)===A.key(x.ref)));
  for(const row of quick)await renderField(related,{...row.ref,label:C.label(row.label)},row.label,row.value);
  for(const group of groups){const model=A.findModel(W.analysis,group.ref);let label=group.label;
   if(model&&group.ref.root!=='JSON'){const p=group.ref.path;const pi=p.lastIndexOf('properties');if(pi>=0){try{const prop=C.locate(model.source,'$ast',p.slice(0,pi+2));label=C.label(prop.key?.name??prop.key?.value??label);}catch{}}}
   related.append(button((group.type==='ArrayExpression'?'Manage list: ':'Open ')+label+' · '+short(group.source),()=>select({...group.ref,label}),'branch'));
  }
  parent.append(related);
 }
 await renderCollectionSuggestions(parent,m);
 if(!groups.length)parent.append(button('Find more settings in Website structure',showWebsiteStructure,'add-item'));
}
async function showWebsiteStructure(){
 inspectorRefresh=showWebsiteStructure;await flushInputs();busy('Analyzing website structure…','Reading settings, local imports, page structure and repeatable lists.');try{models=await W.models();renderNav();const a=W.analysis,fields=$('#fields');selection=null;lastSelected=null;$('.studio-body').classList.remove('hide-inspector');$('#breadcrumbs').replaceChildren();$('#field-search').value='';
 fields.replaceChildren(h('h2',{text:'Website structure'}),h('p',{class:'hint',text:'Start with a settings group or a list. Every control saves back to its source. Click a visible element to narrow this view.'}));
 const counts=h('div',{class:'analysis-counts'},[h('b',{text:models.reduce((n,m)=>n+m.roots.length,0)+' groups'}),h('b',{text:(a.dependencies.length+a.references.length)+' connections'}),h('b',{text:a.inventory.length+' files'})]);fields.append(counts);
 const search=h('input',{type:'search',placeholder:'Find settings, lists or files…','aria-label':'Search website structure'}),list=h('div');fields.append(search,list);
 let renderVersion=0;const render=async()=>{const version=++renderVersion;list.replaceChildren();const query=search.value.toLowerCase();
  for(const model of models){const roots=model.roots.filter(r=>!query||[r.label,r.name,model.file].join(' ').toLowerCase().includes(query)||model.fields.some(f=>String(f.label).toLowerCase().includes(query)));if(!roots.length)continue;const box=groupBox(short(model.file)+(model.script===undefined?'':' · inline script '+(model.script+1)),/\/(config|settings)\//.test('/'+model.file)?'Website configuration':'Detected data in source',!!query);
   if(query){const matching=model.fields.filter(f=>String(f.label).toLowerCase().includes(query));for(const field of matching){box.append(button('Edit '+C.label(field.label)+' · '+String(field.value).slice(0,32),()=>select({...A.astRef(model.file,field.path,model.script),label:C.label(field.label)}),'branch'));}}
   for(const root of roots){const value=root.value;box.append(button((root.label||C.label(root.name))+(Array.isArray(value)?' · '+value.length+' items':''),()=>select({...root.ref,label:root.label}),'branch'));}
   const edges=[...a.dependencies,...a.references].filter(d=>d.from===model.file||d.to===model.file);if(edges.length){const conn=groupBox('Connections','Local imports and page resources connect these files.');for(const edge of edges)conn.append(h('p',{class:'source-path',text:short(edge.from)+' → '+short(edge.to)}));box.append(conn);}
   list.append(box);
  }
  for(const file of W.sitePaths().filter(p=>/\.html?$/.test(p))){const text=await W.text(file);if(version!==renderVersion)return;const doc=new DOMParser().parseFromString(text,'text/html');const groups=A.staticCollections(doc).filter(g=>!query||[g.label,file,...g.items].join(' ').toLowerCase().includes(query));if(!groups.length)continue;const box=groupBox('Repeated content · '+short(file),'Detected from similar sibling elements. Review the items before adding or removing.');for(const g of groups)box.append(button(C.label(g.label)+' · '+g.items.length+' items',()=>openHTMLCollection(file,g.parent,g.selectors[0]),'branch'));list.append(box);}
  if(!list.childElementCount)list.append(h('p',{class:'notice',text:'No matching groups. Try another name or inspect the files below.'}));
 };search.oninput=()=>safe(render);await render();
 const coverage=groupBox('Analysis coverage & files','All files are retained. Static JavaScript/JSON data and HTML lists are editable. Computed logic, server code and unsupported languages may require source editing.');
 for(const item of a.inventory){const row=h('div',{class:'coverage-row'},[h('span',{text:short(item.file)}),h('small',{text:item.status+' · '+item.detail})]);if(item.status!=='asset')row.append(button('Open source',()=>openFiles(item.file),'text-button'));coverage.append(row);}fields.append(coverage);done();
 }finally{done();}}
async function renderCollectionSuggestions(parent,m){const file=W.root+(preview.entry||W.entry),doc=new DOMParser().parseFromString(await W.text(file),'text/html');let selected;try{selected=doc.querySelector(m.selector);}catch{}if(!selected||selected.tagName!==m.tag)return;
 const groups=A.staticCollections(doc).filter(g=>g.selectors.some(s=>doc.querySelector(s)?.contains(selected)));if(!groups.length)return;
 const box=groupBox('Repeated content','This item belongs to a repeated HTML group. Add, duplicate, reorder or remove items.',true);for(const group of groups)box.append(button('Manage '+C.label(group.label)+' · '+group.items.length+' items',()=>openHTMLCollection(file,group.parent,group.selectors[0]),'branch'));parent.append(box);
}
async function openHTMLCollection(file,parentSelector,exampleSelector){
 inspectorRefresh=()=>openHTMLCollection(file,parentSelector,exampleSelector);lastSelected=null;await flushInputs();const doc=new DOMParser().parseFromString(await W.text(file),'text/html');const groups=A.staticCollections(doc,1),group=groups.find(g=>g.parent===parentSelector&&g.selectors.includes(exampleSelector))||groups.find(g=>g.parent===parentSelector);
 if(!group){toast('This group changed. Select one of its items again.');return;}
 selection=null;const fields=$('#fields');fields.replaceChildren(h('h2',{text:C.label(group.label)}),h('p',{class:'hint',text:'Repeated HTML items. Duplicate an item as a starting point, then change its text, links and images.'}),h('p',{class:'notice',text:'Detected from similar sibling markup. JavaScript-bound actions may need source updates when adding new items.'}));$('#breadcrumbs').replaceChildren();$('#field-search').value='';
 const edit=(action,index)=>safe(async()=>{await W.enqueue(async()=>{const current=new DOMParser().parseFromString(await W.text(file),'text/html');A.mutateCollection(current,group,action,index);W.commit(new Map([[file,'<!doctype html>\n'+current.documentElement.outerHTML]]),'Update repeated HTML content');});models=await W.models();await openHTMLCollection(file,parentSelector,exampleSelector);});
 for(let i=0;i<group.items.length;i++){const card=h('div',{class:'list-card'},[h('b',{text:group.items[i]}),h('div',{class:'list-actions'},[button('Edit item',()=>editHTMLItem(file,group.selectors[i],()=>openHTMLCollection(file,parentSelector,exampleSelector))),button('Duplicate',()=>edit('duplicate',i)),button('↑',()=>edit('up',i)),button('↓',()=>edit('down',i)),button('Remove',async()=>{if(confirm('Remove this item? You can undo it.'))await edit('remove',i);},'danger')])]);fields.append(card);}
 fields.append(button('+ Add item from template',()=>edit('duplicate',group.items.length-1),'add-item'));
}
async function editHTMLItem(file,selector,back){inspectorRefresh=()=>editHTMLItem(file,selector,back);lastSelected=null;selection=null;const doc=new DOMParser().parseFromString(await W.text(file),'text/html'),item=doc.querySelector(selector);if(!item)throw Error('Item no longer exists.');const fields=$('#fields');fields.replaceChildren(h('h2',{text:'Edit list item'}),button('← Back to items',back,'branch'));
 const save=async(path,attr,value)=>W.enqueue(async()=>{const d=new DOMParser().parseFromString(await W.text(file),'text/html');let e=d.querySelector(selector);for(const i of path)e=e?.childNodes[i];if(!e)throw Error('This item changed. Open it again.');if(attr==='text')e.nodeValue=value;else e.setAttribute(attr,value);W.commit(new Map([[file,'<!doctype html>\n'+d.documentElement.outerHTML]]),'Edit list item');});
 let number=0;function traverse(node,path=[]){if(node.nodeType===3&&node.nodeValue.trim()){const label='Text '+(++number),input=h('textarea',{'aria-label':label});input.value=node.nodeValue;input.onchange=()=>safe(()=>save(path,'text',input.value));fields.append(h('label',{class:'field'},[h('span',{class:'field-label',text:label}),input]));}if(node.nodeType!==1||node.matches('script,style,svg'))return;for(const attr of ['src','alt','href','title'])if(node.hasAttribute(attr)){const label=(attr==='src'?'Image / media':attr==='href'?'Link':C.label(attr))+' '+(++number),input=h('input',{'aria-label':label});input.value=node.getAttribute(attr);input.onchange=()=>safe(()=>save(path,attr,input.value));const box=h('label',{class:'field'},[h('span',{class:'field-label',text:label}),input]);if(attr==='src')box.append(button('Choose from asset library',()=>openAssets(async chosen=>{input.value=chosen;await save(path,attr,chosen);}),'text-button'));fields.append(box);}[...node.childNodes].forEach((x,i)=>traverse(x,[...path,i]));}traverse(item);
}
async function renderElementAttributes(parent,m,page){
 const attrs=m.attributes||{},keys=Object.keys(attrs).filter(k=>!['src','href','alt','class','id','style'].includes(k)&&!/^on|^data-studio-/i.test(k)),bools=['hidden','disabled','checked','required','multiple','autoplay','muted','loop','controls','open'];
 for(const k of m.tag==='VIDEO'||m.tag==='AUDIO'?['autoplay','muted','loop','controls']:m.tag==='INPUT'?['disabled','required','checked']:[])if(!keys.includes(k))keys.push(k);
 if(!keys.length)return;const box=groupBox('Element attributes','HTML options and custom data attributes. These apply to the selected element; custom attributes only have an effect if the website uses them.');
 for(const name of keys){const linked=A.matches(W.analysis,{text:attrs[name]||''}).filter(x=>x.label===name||x.label===name.replace(/^data-/,'')).filter(x=>typeof x.v==='string');const input=h('input',{type:bools.includes(name)?'checkbox':'text','aria-label':C.label(name)});if(bools.includes(name))input.checked=Object.hasOwn(attrs,name);else input.value=attrs[name]||'';
 input.onchange=()=>safe(async()=>{const v=bools.includes(name)?input.checked:input.value;if(linked.length===1){await W.set(linked[0].r,v,'Edit '+name);return;}const full=W.root+page;await W.enqueue(async()=>{const d=new DOMParser().parseFromString(await W.text(full),'text/html');let e;try{e=d.querySelector(m.selector);}catch{}if(e&&e.tagName===m.tag&&m.htmlIndex!==null){if(v===false)e.removeAttribute(name);else e.setAttribute(name,v===true?'':v);W.commit(new Map([[full,'<!doctype html>\n'+d.documentElement.outerHTML]]),'Edit '+name);}else return 'fallback';}).then(async result=>{if(result==='fallback')await PortfolioElements.save(W,page,m,'attrs',name,v);});});box.append(h('label',{class:'field'+(bools.includes(name)?' toggle':'')},[h('span',{class:'field-label',text:C.label(name)}),input]));}
 parent.append(box);
}
async function renderHelperOverrides(parent,callRef,call,helperModel,fn,returnRef){
 const returned=A.nodeFor(helperModel,returnRef),spread=returned.properties.findLast(p=>p.type==='SpreadElement'&&p.argument.type==='Identifier');if(!spread)return;
 const index=fn.params.findIndex(p=>(p.type==='AssignmentPattern'?p.left:p).name===spread.argument.name);if(index<0||call.arguments[index]&&call.arguments[index].type!=='ObjectExpression')return;
 const existing=new Set((call.arguments[index]?.properties||[]).filter(p=>p.type==='Property').map(p=>p.key.name??p.key.value));const defaults=A.children(helperModel,returnRef).filter(row=>row.label!=='Inherited settings'&&!existing.has(row.label)&&!(row.value instanceof C.Raw));if(!defaults.length)return;
 const box=groupBox('Use a local override','Change a helper default for this element only. Shared defaults stay unchanged.');
 for(const row of defaults){box.append(button('Customize '+C.label(row.label)+' for this element',()=>safe(async()=>{await W.enqueue(async()=>{const source=await W.source(callRef),node=C.locate(source,callRef.root,callRef.path),args=node.arguments.map(n=>source.slice(n.start,n.end));const option=node.arguments[index],properties=option?.properties.map(p=>source.slice(p.start,p.end))||[];if(option?.properties.some(p=>p.type==='Property'&&(p.key.name??p.key.value)===row.label))throw Error('This override already exists. Reopen the options.');while(args.length<=index)args.push('undefined');properties.push(JSON.stringify(row.label)+': '+C.serialize(row.value));args[index]='{'+properties.join(',')+'}';const next=source.slice(0,node.start)+source.slice(node.callee.start,node.callee.end)+'('+args.join(',')+')'+source.slice(node.end);await W.storeSource(callRef,next,'Add local helper override');});models=await W.models();const model=A.findModel(W.analysis,callRef),node=A.nodeFor(model,callRef);await select({...callRef,root:'$ast',path:[...A.nodePath(model,node),'arguments',index],label:'Local options'});}), 'branch'));}
 parent.append(box);
}
