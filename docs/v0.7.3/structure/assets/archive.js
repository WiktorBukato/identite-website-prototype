/* Archive-only enhancement. Native links/details work without JavaScript. */
'use strict';
(()=>{
 const gallery=document.querySelector('[data-video-gallery]');
 if(gallery){
  const cards=[...gallery.querySelectorAll('[data-video-card]')];
  let current=0;
  const select=(index,announce=false)=>{
   current=(index+cards.length)%cards.length;
   const card=cards[current],image=card.querySelector('img'),poster=gallery.querySelector('[data-selected-poster]');
   for(const attr of ['src','srcset','sizes','alt','width','height']){
    if(image.hasAttribute(attr))poster.setAttribute(attr,image.getAttribute(attr));else poster.removeAttribute(attr);
   }
   gallery.querySelector('[data-selected-title]').textContent=card.querySelector('h3').textContent;
   gallery.querySelector('[data-selected-duration]').textContent=card.querySelector('.av-duration').textContent;
   const source=card.querySelector('[data-video-link]'),link=gallery.querySelector('[data-selected-link]');
   link.hidden=!source;gallery.querySelector('[data-selected-unavailable]').hidden=!!source;
   if(source)link.href=source.href;else link.removeAttribute('href');
   cards.forEach((c,i)=>c.querySelector('[data-select-video]').setAttribute('aria-pressed',String(i===current)));
   if(announce)gallery.querySelector('[data-selected-status]').textContent=card.querySelector('h3').textContent;
   // Only a non-sensitive catalog key is retained in the URL. No provider IDs or storage.
   const url=new URL(location.href);url.searchParams.set('video',card.id);history.replaceState(null,'',url);
  };
  cards.forEach((card,i)=>card.querySelector('[data-select-video]').addEventListener('click',()=>select(i,true)));
  gallery.querySelector('[data-video-previous]').addEventListener('click',()=>select(current-1,true));
  gallery.querySelector('[data-video-next]').addEventListener('click',()=>select(current+1,true));
  const requested=new URLSearchParams(location.search).get('video');
  const fromHash=document.getElementById(decodeURIComponent(location.hash.slice(1)))?.closest('[data-video-card]');
  select(Math.max(0,cards.findIndex(c=>c.id===requested||c===fromHash)));
  document.querySelectorAll('[data-locale]').forEach(a=>a.addEventListener('click',()=>{
   const url=new URL(a.href);url.searchParams.set('video',cards[current].id);a.href=url;
  },true));
 }
 document.querySelectorAll('[data-sharing]').forEach(widget=>{
  const button=widget.querySelector('[data-copy-link]'),status=widget.querySelector('[data-copy-status]');
  const fallback=widget.querySelector('[data-copy-fallback]'),input=widget.querySelector('[data-copy-value]');
  let timer;
  button.addEventListener('click',async()=>{
   clearTimeout(timer);status.textContent='';fallback.hidden=true;
   const url=new URL(location.href);
   // Share the archive and selected item, never unrelated context query values.
   const selected=url.searchParams.get('video');url.search='';
   if(selected&&/^video-\d{2}$/.test(selected))url.searchParams.set('video',selected);
   try{
    if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(url.href);status.textContent=widget.dataset.success;
    timer=setTimeout(()=>{status.textContent='';},4000);
   }catch{
    input.value=url.href;fallback.hidden=false;input.focus();input.select();
   }
  });
 });
 // Old incoming anchors may point into a collapsed historical description.
 const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));
 if(target)for(let parent=target.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
})();
