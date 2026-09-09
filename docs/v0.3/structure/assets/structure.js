'use strict';
document.documentElement.classList.add('st-js');
// Native disclosure navigation; no framework, tracking or persisted visitor data.
const menus = [...document.querySelectorAll('.st-header details')];
const header=document.querySelector('.st-header'),menuToggle=document.querySelector('.st-menu-toggle');
const mobileNavigation=matchMedia('(max-width: 900px)');
function closeNavigation(returnFocus=false){
  header.classList.remove('st-nav-open');menuToggle.setAttribute('aria-expanded','false');
  menus.forEach(menu=>{menu.open=false;});
  if(returnFocus)menuToggle.focus();
}
menuToggle.addEventListener('click',()=>{
  const open=menuToggle.getAttribute('aria-expanded')!=='true';
  header.classList.toggle('st-nav-open',open);menuToggle.setAttribute('aria-expanded',String(open));
});
header.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&mobileNavigation.matches){event.stopPropagation();closeNavigation(true);}
});
mobileNavigation.addEventListener('change',()=>closeNavigation());
menus.forEach(menu => {
  menu.addEventListener('toggle', () => {
    if (menu.open) menus.forEach(other => { if (other !== menu) other.open = false; });
  });
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') { menu.open = false; menu.querySelector('summary').focus(); }
  });
});
document.addEventListener('click', event => {
  if (!event.target.closest('.st-header')) closeNavigation();
});
const brief = document.querySelector('#brief-context');
if (brief) brief.addEventListener('change', () => {
  document.querySelectorAll('[data-brief]').forEach(panel => { panel.hidden = panel.dataset.brief !== brief.value; });
});

const motion = matchMedia('(prefers-reduced-motion: reduce)');
const demoMotion = { duration: 850, easing: 'cubic-bezier(.2,.8,.2,1)' };
// Devices carry their position between steps; screen contents enter separately.
// Finite animations never advance the scenario or make a decision for the visitor.
function animateExample(panel, previous = []) {
  if (motion.matches || !panel) return;
  panel.querySelectorAll('.ex-device').forEach((device, i) => {
    const target = getComputedStyle(device).transform;
    device.animate([
      { transform: previous[i] || 'translateY(28px) rotateY(-8deg)', opacity: previous[i] ? 1 : .35 },
      { transform: target, opacity: 1 }
    ], demoMotion);
  });
  panel.querySelectorAll('.ex-copy,.ex-device-body,.co-role-panel').forEach(content => {
    content.animate([{ opacity: .2, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], demoMotion);
  });
  panel.querySelectorAll('.ex-success .st-icon,.ex-biometric .st-icon').forEach(mark => {
    mark.animate([{ transform: 'scale(.65)', opacity: 0 }, { transform: 'scale(1.12)', opacity: 1, offset: .65 }, { transform: 'scale(1)', opacity: 1 }], demoMotion);
  });
}
function stopExampleMotion() {
  document.querySelectorAll('[data-tabs]').forEach(widget => widget.getAnimations({ subtree: true }).forEach(animation => animation.cancel()));
}
motion.addEventListener('change', () => { if (motion.matches) stopExampleMotion(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) stopExampleMotion(); });

// Shared tab behavior: direct steps, arrow keys, and next actions use the same state change.
document.querySelectorAll('[data-tabs]').forEach(widget => {
  const tabs = [...widget.querySelectorAll('[role="tab"]')];
  const panels = [...widget.querySelectorAll('[role="tabpanel"]')];
  let state = { index: 0, outcome: 'waiting' };
  const controls = widget.querySelector('[data-demo-controls]');
  const controlCopy = controls ? JSON.parse(controls.dataset.demoControls) : null;
  const advance = controls?.querySelector('[data-advance]');
  function updateControls() {
    const terminal = state.outcome !== 'waiting';
    if (advance) advance.querySelector('span').textContent = terminal || state.index === tabs.length-1 ? controlCopy.replay : controlCopy.labels[state.index];
    widget.querySelectorAll('[data-decision]').forEach(button => { if(button.tagName==='BUTTON') button.disabled=terminal; });
  }
  function endHint() { widget.dataset.interacted='true';widget.querySelector('.ex-action-hint')?.classList.remove('ex-action-hint'); }
  function showDecision(decision) {
    widget.dataset.decision = decision;
    widget.querySelectorAll('[data-approved][data-declined]').forEach(copy => {
      copy.textContent = copy.dataset[decision] || copy.dataset.waiting;
    });
    widget.querySelectorAll('[data-approved-only]').forEach(content => {
      content.hidden = decision !== 'approved';
    });
    widget.querySelectorAll('[data-result-icon] use').forEach(mark => {
      mark.setAttribute('href', '#st-icon-' + ({approved:'accepted',declined:'close',expired:'pause',waiting:'pause'}[decision]));
    });
  }
  function select(index, focus = false, decision, action = false, replay = false) {
    if (index < 0 || index >= tabs.length) return;
    const current = panels.find(panel => !panel.hidden);
    if (current === panels[index] && !replay) return;
    const previous = [...(current?.querySelectorAll('.ex-device') || [])].map(device => getComputedStyle(device).transform);
    state = IdentiteDemoState.transition(state,index,tabs.length-1,decision,replay);
    showDecision(state.outcome);
    updateControls();
    widget.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    widget.dataset.current = String(index);
    if (index === tabs.length-1) {
      const status = widget.querySelector('[data-demo-status]');
      if (status) status.textContent = panels[index].querySelector('h3')?.textContent || '';
    }
    if (action) {
      const heading=panels[index].querySelector('h3');
      heading.tabIndex=-1;heading.focus({preventScroll:true});
      // Keep a completed action's explanation and replay visible; arrow navigation stays in its tablist.
      const copy=panels[index].querySelector('.ex-copy');
      const rect=copy.getBoundingClientRect(),head=document.querySelector('.st-header');
      const offset=getComputedStyle(head).position==='sticky'?head.getBoundingClientRect().bottom+16:24;
      if(rect.top<offset||Math.min(rect.bottom,rect.top+innerHeight-offset)>innerHeight){
        window.scrollBy({top:rect.top-offset,behavior:motion.matches?'instant':'smooth'});
      }
    } else if (focus) tabs[index].focus({ preventScroll: true });
    animateExample(panels[index], previous);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => { endHint();select(index); });
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); endHint();select(next, true); }
    });
  });
  widget.querySelectorAll('[data-next]').forEach(button => {
    button.addEventListener('click', () => {
      const decision = button.dataset.decision;
      endHint();select(Number(button.dataset.next), true, decision, true, button.dataset.next==='0');
    });
  });
  advance?.addEventListener('click', () => {
    endHint();
    if(state.outcome!=='waiting'||state.index===tabs.length-1) { select(0,true,undefined,true,true);return; }
    const primary=panels[state.index].querySelector('[data-next]:not([data-decision="declined"]):not([data-decision="expired"])');
    if(primary)select(Number(primary.dataset.next),true,primary.dataset.decision,true);
  });
  showDecision(state.outcome);updateControls();
});
if ('IntersectionObserver' in window && !motion.matches) {
  const enter = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    animateExample(entry.target.querySelector('[role="tabpanel"]:not([hidden])'));
    if(!entry.target.dataset.interacted && entry.target.dataset.current==='0') {
      entry.target.querySelector('[role="tabpanel"]:not([hidden]) [data-next]')?.classList.add('ex-action-hint');
    }
    enter.unobserve(entry.target);
  }), { threshold: .25 });
  document.querySelectorAll('[data-tabs]').forEach(widget => enter.observe(widget));
}

const lightbox = document.querySelector('.st-lightbox');
if (lightbox) {
  let opener;
  const image = lightbox.querySelector('img');
  document.querySelectorAll('[data-zoom]').forEach(button => {
    button.addEventListener('click', () => {
      opener = button;
      const original = button.querySelector('img');
      image.src = original.currentSrc || original.src;
      image.alt = original.alt;
      lightbox.showModal();
    });
  });
  lightbox.querySelector('[data-close]').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
  lightbox.addEventListener('close', () => opener?.focus({ preventScroll: true }));
}

// Below-fold reveals are finite and never hide initial content or hash destinations.
if (!motion.matches && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('[data-surface]').forEach(surface => {
    let frame;
    surface.addEventListener('pointermove', event => {
      if (motion.matches || frame) return;
      frame = requestAnimationFrame(() => {
        const bounds = surface.getBoundingClientRect();
        surface.style.setProperty('--st-light-x', ((event.clientX - bounds.left) / bounds.width * 100) + '%');
        surface.style.setProperty('--st-light-y', ((event.clientY - bounds.top) / bounds.height * 100) + '%');
        frame = undefined;
      });
    });
  });
}
if ('IntersectionObserver' in window && !motion.matches) {
  const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.remove('st-pending'); reveal.unobserve(entry.target); }
  }), { rootMargin: '0px 0px 60px 0px', threshold: 0.05 });
  document.querySelectorAll('.st-section,.st-related').forEach(section => {
    if (section.getBoundingClientRect().top > innerHeight && !location.hash) {
      section.classList.add('st-reveal', 'st-pending'); reveal.observe(section);
    }
  });
  const showAll = () => document.querySelectorAll('.st-pending').forEach(el => el.classList.remove('st-pending'));
  motion.addEventListener('change', showAll);
  window.addEventListener('hashchange', showAll);
  window.addEventListener('beforeprint', showAll);
}
