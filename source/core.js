/* Configuration editing is syntax-tree based. Imported configuration is never evaluated here. */
(function(global){
  const parser = global.acorn || (typeof require==='function' ? require('./vendor/acorn.js') : null);
  const textEncoder = new TextEncoder();
  class Raw { constructor(source){this.source=source;} }
  function parse(source){return parser.parse(source,{ecmaVersion:'latest',sourceType:'module',allowHashBang:true});}
  function walk(node,fn){if(!node||typeof node!=='object')return; if(node.type)fn(node);for(const k of Object.keys(node)){if(k==='start'||k==='end')continue;const v=node[k];if(Array.isArray(v))v.forEach(x=>walk(x,fn));else if(v&&typeof v==='object')walk(v,fn);}}
  function value(node,source){
    if(!node)return null;
    if(node.type==='Literal'&&!node.regex&&typeof node.value!=='bigint')return node.value;
    if(node.type==='UnaryExpression'&&['-','+'].includes(node.operator)&&node.argument.type==='Literal'&&typeof node.argument.value==='number')return node.operator==='-'?-node.argument.value:node.argument.value;
    if(node.type==='TemplateLiteral'&&!node.expressions.length)return node.quasis[0].value.cooked;
    if(node.type==='ArrayExpression'&&node.elements.every(x=>x&&x.type!=='SpreadElement'))return node.elements.map(x=>value(x,source));
    if(node.type==='ObjectExpression'&&node.properties.every(p=>p.type==='Property'&&!p.computed&&p.kind==='init'&&!p.method)){
      const result=Object.create(null);for(const p of node.properties)result[p.key.name??p.key.value]=value(p.value,source);return result;
    }
    return new Raw(source.slice(node.start,node.end));
  }
  function serialize(v,indent=0){
    if(v instanceof Raw)return v.source;
    if(v===null||typeof v!=='object')return JSON.stringify(v);
    const pad='  '.repeat(indent),next='  '.repeat(indent+1);
    if(Array.isArray(v))return v.length?'[\n'+v.map(x=>next+serialize(x,indent+1)).join(',\n')+'\n'+pad+']':'[]';
    const entries=Object.entries(v);return entries.length?'{\n'+entries.map(([k,x])=>next+JSON.stringify(k)+': '+serialize(x,indent+1)).join(',\n')+'\n'+pad+'}':'{}';
  }
  function clone(v){if(v instanceof Raw)return new Raw(v.source);if(Array.isArray(v))return v.map(clone);if(v&&typeof v==='object'){const o=Object.create(null);for(const [k,x]of Object.entries(v))o[k]=clone(x);return o;}return v;}
  function exportsOf(source){const ast=parse(source),roots=[];for(const item of ast.body){
    if(item.type==='ExportNamedDeclaration'&&item.declaration?.type==='VariableDeclaration')for(const d of item.declaration.declarations)if(d.id.type==='Identifier'&&d.init)roots.push({name:d.id.name,node:d.init,value:value(d.init,source)});
    if(item.type==='ExportDefaultDeclaration')roots.push({name:'default',node:item.declaration,value:value(item.declaration,source)});
  }return roots;}
  function child(node,key){if(node.type==='ArrayExpression')return node.elements[Number(key)];if(node.type==='ObjectExpression')return node.properties.find(p=>p.type==='Property'&&(p.key.name??p.key.value)===key)?.value;return null;}
  function locate(source,root,path=[]){let n=exportsOf(source).find(x=>x.name===root)?.node;if(!n)throw Error('This configuration section is no longer present.');for(const k of path){n=child(n,k);if(!n)throw Error('This field changed. Reopen the section.');}return n;}
  function patch(source,root,path,newValue){const n=locate(source,root,path);let s=serialize(newValue);if(source.includes('\r\n'))s=s.replace(/\n/g,'\r\n');return source.slice(0,n.start)+s+source.slice(n.end);}
  function get(source,root,path=[]){return value(locate(source,root,path),source);}
  function normalize(p){const a=[];for(const part of p.replace(/\\/g,'/').split('/')){if(!part||part==='.')continue;if(part==='..'){if(!a.length)throw Error('Path leaves the website folder');a.pop();}else a.push(part);}return a.join('/');}
  function resolve(from,to){return normalize((to.startsWith('/')?'':from.slice(0,from.lastIndexOf('/')+1))+to.replace(/^\//,''));}
  function edits(source,changes){return changes.sort((a,b)=>b.start-a.start).reduce((s,e)=>s.slice(0,e.start)+e.text+s.slice(e.end),source);}
  function literals(source){const result=[];walk(parse(source),n=>{if(n.type==='Literal'&&typeof n.value==='string')result.push(n);});return result;}
  function rewriteStrings(source,fn){return edits(source,literals(source).flatMap(n=>{const next=fn(n.value);return next===n.value?[]:[{start:n.start,end:n.end,text:JSON.stringify(next)}];}));}
  function label(s){return String(s).replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/[-_]/g,' ').replace(/^./,x=>x.toUpperCase());}
  function slug(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'item';}
  const api={Raw,parse,walk,value,serialize,clone,exportsOf,locate,patch,get,normalize,resolve,edits,literals,rewriteStrings,label,slug,textEncoder};
  global.PortfolioCore=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
