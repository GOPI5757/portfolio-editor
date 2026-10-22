/* Editor preference only: never copied into imported/exported websites. */
(()=>{
 const key='portfolio-studio-theme';let theme='light';
 try{if(localStorage.getItem(key)==='dark')theme='dark';}catch{}
 const apply=next=>{theme=next==='dark'?'dark':'light';document.documentElement.dataset.editorTheme=theme;document.querySelectorAll('[data-theme-toggle]').forEach(button=>{button.setAttribute('aria-checked',String(theme==='dark'));button.title=theme==='dark'?'Switch editor to light theme':'Switch editor to dark theme';});};
 apply(theme);
 document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-theme-toggle]').forEach(button=>button.addEventListener('click',()=>{apply(theme==='dark'?'light':'dark');try{localStorage.setItem(key,theme);}catch{}}));apply(theme);
  const header=document.querySelector('.topbar');if(header)new ResizeObserver(()=>{if(header.offsetHeight)document.documentElement.style.setProperty('--editor-header-height',header.offsetHeight+'px');}).observe(header);
 });
 addEventListener('storage',event=>{if(event.key===key)apply(event.newValue);});
})();
