/* Local ES-module preview loader. This transforms only the preview, never exports. */
(function(global){
 const C=PortfolioCore;
 function bundle(sources,entries,{root='',rewrite=(v)=>v}={}){
  const needed=new Set();
  function resolve(from,specifier){
   if(typeof specifier!=='string'||!/^\.?\.?\//.test(specifier))throw Error('Preview requires a local module path: '+specifier);
   const clean=specifier.split(/[?#]/)[0];
   return clean.startsWith('/')?C.normalize(root+clean.slice(1)):C.resolve(from,clean);
  }
  function imports(ast,path){const result=[];C.walk(ast,node=>{
   if(node.type==='ImportDeclaration'||((node.type==='ExportNamedDeclaration'||node.type==='ExportAllDeclaration')&&node.source))result.push(resolve(path,node.source.value));
   if(node.type==='ImportExpression'){
    const value=node.source.type==='Literal'?node.source.value:node.source.type==='TemplateLiteral'&&!node.source.expressions.length?node.source.quasis[0].value.cooked:null;
    if(typeof value!=='string')throw Error('Preview cannot resolve a computed import in '+path+'. Use a literal local import path or built output.');
    result.push(resolve(path,value));
   }
  });return result;}
  function visit(path){if(needed.has(path))return;if(!sources.has(path))throw Error('Missing local script: '+path);needed.add(path);imports(C.parse(sources.get(path)),path).forEach(visit);}
  entries.forEach(visit);
  const names=node=>node.type==='Identifier'?[node.name]:node.type==='ObjectPattern'?node.properties.flatMap(p=>names(p.value||p.argument)):node.type==='ArrayPattern'?node.elements.filter(Boolean).flatMap(names):node.type==='AssignmentPattern'?names(node.left):node.type==='RestElement'?names(node.argument):[];
  function compile(path){
   const source=C.rewriteStrings(sources.get(path),v=>rewrite(v,path)),ast=C.parse(source),changes=[],before=[],after=[];
   const expose=(name,expression)=>after.push(`Object.defineProperty(exports,${JSON.stringify(name)},{enumerable:true,get:()=>${expression}});`);
   let serial=0;
   for(const node of ast.body){
    if(node.type==='ImportDeclaration'){
     const dependency=JSON.stringify(resolve(path,node.source.value)),temp='__studioDependency'+serial++;
     before.push(`const ${temp}=await __require(${dependency});`);
     for(const spec of node.specifiers)before.push(`const ${spec.local.name}=${spec.type==='ImportNamespaceSpecifier'?temp:`${temp}[${JSON.stringify(spec.type==='ImportDefaultSpecifier'?'default':spec.imported.name??spec.imported.value)}]`};`);
     changes.push({start:node.start,end:node.end,text:''});
    }else if(node.type==='ExportNamedDeclaration'){
     if(node.declaration){changes.push({start:node.start,end:node.declaration.start,text:''});const d=node.declaration;for(const n of d.type==='VariableDeclaration'?d.declarations.flatMap(x=>names(x.id)):[d.id.name])expose(n,n);}
     else {changes.push({start:node.start,end:node.end,text:''});let temp='';if(node.source){temp='__studioDependency'+serial++;before.push(`const ${temp}=await __require(${JSON.stringify(resolve(path,node.source.value))});`);}for(const s of node.specifiers)expose(s.exported.name??s.exported.value,temp?`${temp}[${JSON.stringify(s.local.name??s.local.value)}]`:s.local.name);}
    }else if(node.type==='ExportDefaultDeclaration'){
     const d=node.declaration;if((d.type==='FunctionDeclaration'||d.type==='ClassDeclaration')&&d.id){changes.push({start:node.start,end:d.start,text:''});expose('default',d.id.name);}else{changes.push({start:node.start,end:d.start,text:'const __studioDefault='});expose('default','__studioDefault');}
    }else if(node.type==='ExportAllDeclaration'){
     const temp='__studioDependency'+serial++;before.push(`const ${temp}=await __require(${JSON.stringify(resolve(path,node.source.value))});`);changes.push({start:node.start,end:node.end,text:''});if(node.exported)expose(node.exported.name??node.exported.value,temp);else after.push(`for(const key of Object.keys(${temp})){if(key!=='default'&&!Object.hasOwn(exports,key))Object.defineProperty(exports,key,{enumerable:true,get:()=>${temp}[key]});}`);
    }
   }
   C.walk(ast,node=>{
    if(node.type==='ImportExpression'){const spec=node.source.type==='Literal'?node.source.value:node.source.quasis[0].value.cooked;changes.push({start:node.start,end:node.end,text:`__require(${JSON.stringify(resolve(path,spec))})`});}
    if(node.type==='MemberExpression'&&!node.computed&&['pathname','search','href','origin'].includes(node.property.name)&&(node.object.type==='Identifier'&&node.object.name==='location'||node.object.type==='MemberExpression'&&node.object.object.name==='window'&&node.object.property.name==='location'))changes.push({start:node.start,end:node.end,text:'__location.'+node.property.name});
   });
   return before.join('\n')+'\n'+C.edits(source,changes)+'\n'+after.join('\n');
  }
  return `(async()=>{const __records=Object.create(null),__factories={${[...needed].map(p=>`${JSON.stringify(p)}:async function(exports,__require,__location){"use strict";\n${compile(p)}\n}`).join(',')}};
function __load(path,chain=[]){const existing=__records[path];if(existing){if(!existing.done&&chain.includes(path))return Promise.reject(new Error('Cyclic module initialization is not supported by this preview: '+path));return existing.promise;}if(!__factories[path])return Promise.reject(new Error('Missing preview module: '+path));const record=__records[path]={exports:Object.create(null),done:false};record.promise=Promise.resolve().then(()=>__factories[path](record.exports,p=>__load(p,[...chain,path]),window.__portfolioPreviewLocation||location)).then(()=>{record.done=true;return record.exports;});return record.promise;}
${entries.map(p=>`await __load(${JSON.stringify(p)});`).join('\n')}
})().catch(error=>{window.dispatchEvent(new ErrorEvent('error',{message:error.message,error}));});`;
 }
 global.PortfolioModules={bundle};if(typeof module!=='undefined')module.exports=global.PortfolioModules;
})(globalThis);
