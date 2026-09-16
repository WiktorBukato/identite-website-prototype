/* Same-tab, one-use locale handoff. No analytics or server; no form text in URLs. */
'use strict';
(()=>{
 const ttl=5*60*1000;
 const base=new URL('../../',document.currentScript.src).pathname;
 const logicalPage=document.body.dataset.logicalPage||document.body.dataset.page;
 const key='identite.locale:'+base+':'+logicalPage;
 const fieldList=()=>[...document.querySelectorAll('input,textarea,select')].filter(e=>!e.readOnly&&!e.disabled);
 const snapshot=()=>{
  const sections=[...document.querySelectorAll('main [data-locale-anchor],main section[id],main [data-tabs][id]')].filter(e=>e.getBoundingClientRect().height>0&&!e.closest('[hidden]'));
  const anchor=sections.filter(e=>e.getBoundingClientRect().top<=innerHeight*.35).pop()||document.querySelector('main');
  return {time:Date.now(),page:logicalPage,anchor:anchor?.id,offset:anchor?anchor.getBoundingClientRect().top/innerHeight:0,
   demos:[...document.querySelectorAll('[data-tabs]')].map(e=>({id:e.id,index:Number(e.dataset.current||0),outcome:e.dataset.decision||'waiting'})),
   details:[...document.querySelectorAll('main details')].map(e=>e.open),
   assessmentVisible:document.querySelector('[data-assessment-result]')?.hidden===false,
   inlineRequestVisible:document.querySelector('[data-inline-request]')?.hidden===false,
   pendingBrief:document.querySelector('[data-brief-choice]')?.hidden===false,
   requestPreviewVisible:document.querySelector('[data-request-preview]')?.hidden===false,
   fields:fieldList().map(e=>({id:e.id,name:e.name,type:e.type,value:e.type==='radio'||e.type==='checkbox'?undefined:e.value,checked:e.checked})),
   expectation:document.querySelector('[data-expectation-reset]')?.hidden===false};
 };
 document.querySelectorAll('[data-locale]').forEach(a=>{
  if(a.dataset.locale===document.documentElement.lang){a.setAttribute('aria-current','true');document.querySelector('[data-current-language]').textContent=a.querySelector('[data-language-name]').textContent;document.querySelector('.st-languages summary img').src=a.querySelector('img').src;}
  a.addEventListener('click',event=>{
   if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
   const url=new URL(a.href);const allow=['intent','product','solution','interaction','source_page'];
   const query=new URLSearchParams(location.search);allow.forEach(k=>{const v=query.get(k);if(v&&/^[a-z0-9-]+$/.test(v))url.searchParams.set(k,v)});
   url.searchParams.set('locale',a.dataset.locale);url.hash=location.hash;a.href=url.href;
   try{const state=snapshot();state.target=url.href;sessionStorage.setItem(key,JSON.stringify(state));}catch{/* Navigation remains usable if session storage is unavailable. */}
  });
 });
 let saved;
 try{saved=JSON.parse(sessionStorage.getItem(key)||'null');sessionStorage.removeItem(key);}catch{return;}
 if(!saved||saved.target!==location.href||saved.page!==logicalPage||Date.now()-saved.time<0||Date.now()-saved.time>ttl)return;
 [...document.querySelectorAll('main details')].forEach((e,i)=>e.open=!!saved.details[i]);
 if(saved.inlineRequestVisible){const inline=document.querySelector('[data-inline-request]');if(inline)inline.hidden=false;}
 saved.demos.forEach(s=>document.getElementById(s.id)?.dispatchEvent(new CustomEvent('locale:restore',{detail:s})));
 const fields=fieldList();saved.fields.forEach((s,i)=>{const e=fields[i];if(!e||e.id!==s.id||e.name!==s.name)return;if(e.type==='radio'||e.type==='checkbox')e.checked=s.checked;else if(e.tagName==='SELECT'){if([...e.options].some(o=>o.value===s.value))e.value=s.value;}else e.value=s.value;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});
 if(saved.assessmentVisible)document.querySelector('[data-assessment]')?.requestSubmit();
 if(saved.pendingBrief)document.querySelector('[data-assessment-use]')?.click();
 else if(saved.requestPreviewVisible)document.querySelector('[data-contact]')?.requestSubmit();
 if(saved.expectation)document.querySelector('[data-expectation-decline]')?.click();
 const restore=()=>{const anchor=document.getElementById(saved.anchor);if(anchor)window.scrollBy({top:anchor.getBoundingClientRect().top-saved.offset*innerHeight,behavior:'instant'});};
 requestAnimationFrame(()=>requestAnimationFrame(restore));window.addEventListener('load',restore,{once:true});
})();
