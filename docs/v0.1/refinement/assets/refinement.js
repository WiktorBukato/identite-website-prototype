'use strict';
document.documentElement.classList.add('js');
const experience = document.querySelector('.experience');
const messages = JSON.parse(experience.dataset.copy);
const tabs = [...experience.querySelectorAll('[role=tab]')];
const stages = tabs.map(tab => tab.dataset.stage);
const progression = {login:['qr','demoStart'],qr:['compare','scanAction'],compare:['accepted','acceptAction'],accepted:['login','replay'],declined:['login','replay']};
const panel = experience.querySelector('[role=tabpanel]');
const next = experience.querySelector('[data-next]');
const setStage = (state, focus = false) => {
  if (![...stages, 'accepted', 'declined'].includes(state)) return;
  experience.dataset.state = state;
  const current = stages.includes(state) ? state : 'compare';
  tabs.forEach(tab => {
    tab.setAttribute('aria-selected', String(tab.dataset.stage === current));
    tab.tabIndex = tab.dataset.stage === current ? 0 : -1;
  });
  panel.setAttribute('aria-labelledby', `tab-${current}`);
  panel.querySelector('[data-title]').textContent = messages[`${state}Title`];
  panel.querySelector('[data-body]').textContent = messages[`${state}Body`];
  next.querySelector('[data-next-label]').textContent = messages[progression[state][1]];
  next.querySelector('use').setAttribute('href',`#icon-${state==='accepted'||state==='declined'?'replay':progression[state][0]}`);
  panel.querySelector('use').setAttribute('href',`#icon-${state}`);
  experience.querySelector('[data-scan]').disabled = state !== 'qr';
  experience.querySelectorAll('[data-decision]').forEach(button => { button.disabled = state !== 'compare'; });
  if (focus) {
    if (state === 'compare') experience.querySelector('[data-decision=accepted]').focus();
    else panel.focus({ preventScroll: true });
  }
};
tabs.forEach((tab,index) => {
  tab.addEventListener('click', () => setStage(tab.dataset.stage));
  tab.addEventListener('keydown', event => {
    let target;
    if (event.key === 'ArrowRight') target=(index+1)%tabs.length;
    if (event.key === 'ArrowLeft') target=(index+tabs.length-1)%tabs.length;
    if (event.key === 'Home') target=0;
    if (event.key === 'End') target=tabs.length-1;
    if (target === undefined) return;
    event.preventDefault(); setStage(tabs[target].dataset.stage); tabs[target].focus();
  });
});
next.addEventListener('click', () => {
  const state=experience.dataset.state;
  setStage(progression[state][0], true);
});
experience.querySelector('[data-login]').addEventListener('click',()=>setStage('qr',true));
experience.querySelector('[data-scan]').addEventListener('click',()=>{
  if(experience.dataset.state==='qr') setStage('compare',true);
});
experience.querySelectorAll('[data-decision]').forEach(button => button.addEventListener('click', () => {
  if (experience.dataset.state === 'compare') setStage(button.dataset.decision, true);
}));
const dialog = document.querySelector('dialog');
const opener = document.querySelector('[data-open-app]');
opener.addEventListener('click', () => dialog.showModal());
document.querySelector('[data-close-app]').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => opener.focus({preventScroll:true}));
const galleryTabs=[...dialog.querySelectorAll('[data-gallery]')];
function selectScreenshot(tab){
  galleryTabs.forEach(item=>{
    const selected=item===tab;
    item.setAttribute('aria-selected',String(selected));item.tabIndex=selected?0:-1;
    dialog.querySelector(`#image-${item.dataset.gallery}`).hidden=!selected;
  });
}
galleryTabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>selectScreenshot(tab));
  tab.addEventListener('keydown',event=>{
    const offset=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;
    if(!offset)return;
    event.preventDefault();const target=galleryTabs[(index+offset+galleryTabs.length)%galleryTabs.length];selectScreenshot(target);target.focus();
  });
});
setStage('login');

// Decorative, pointer-driven only. No backend, continuous loop or touch interception.
const hero=document.querySelector('.hero-photo');
const effectMedia=matchMedia('(prefers-reduced-motion: no-preference) and (pointer: fine)');
const particles=new Set();
const trail={interval:55,lifetime:950,limit:36};
let lastEmission=0;
hero.addEventListener('pointermove',event=>{
  if(!effectMedia.matches||event.pointerType==='touch'||event.timeStamp-lastEmission<trail.interval)return;
  lastEmission=event.timeStamp;
  const rect=hero.getBoundingClientRect();
  for(let i=0;i<2&&particles.size<trail.limit;i++){
    const particle=document.createElement('span');
    particle.className='cipher-particle';particle.setAttribute('aria-hidden','true');
    particle.textContent=String(Math.floor(Math.random()*10));
    particle.style.left=`${event.clientX-rect.left}px`;particle.style.top=`${event.clientY-rect.top}px`;
    hero.append(particle);particles.add(particle);
    const animation=particle.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.7)'},{opacity:.55,offset:.15},{opacity:0,transform:`translate(${(Math.random()-.5)*130}px,${-35-Math.random()*90}px) scale(1.2)`}],{duration:trail.lifetime,easing:'ease-out'});
    animation.finished.finally(()=>{particle.remove();particles.delete(particle);});
  }
});
effectMedia.addEventListener('change',()=>{if(!effectMedia.matches){particles.forEach(p=>p.remove());particles.clear();}});
