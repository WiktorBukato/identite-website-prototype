'use strict';
document.documentElement.classList.add('st-js');
// Native disclosure navigation; no framework, tracking or persisted visitor data.
const menus = [...document.querySelectorAll('.st-header details')];
menus.forEach(menu => {
  menu.addEventListener('toggle', () => {
    if (menu.open) menus.forEach(other => { if (other !== menu) other.open = false; });
  });
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') { menu.open = false; menu.querySelector('summary').focus(); }
  });
});
document.addEventListener('click', event => {
  if (!event.target.closest('.st-header details')) menus.forEach(menu => { menu.open = false; });
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
  function showDecision(decision) {
    widget.dataset.decision = decision;
    widget.querySelectorAll('[data-approved][data-declined]').forEach(copy => {
      copy.textContent = copy.dataset[decision];
    });
    widget.querySelectorAll('[data-approved-only]').forEach(content => {
      content.hidden = decision === 'declined';
    });
    widget.querySelectorAll('[data-result-icon] use').forEach(mark => {
      mark.setAttribute('href', decision === 'declined' ? '#st-icon-close' : '#st-icon-accepted');
    });
  }
  function select(index, focus = false) {
    if (index < 0 || index >= tabs.length) return;
    const current = panels.find(panel => !panel.hidden);
    if (current === panels[index]) return;
    const previous = [...(current?.querySelectorAll('.ex-device') || [])].map(device => getComputedStyle(device).transform);
    widget.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    widget.dataset.current = String(index);
    if (index === 0) { showDecision('approved'); widget.removeAttribute('data-decision'); }
    animateExample(panels[index], previous);
    if (focus) tabs[index].focus({ preventScroll: true });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); select(next, true); }
    });
  });
  widget.querySelectorAll('[data-next]').forEach(button => {
    button.addEventListener('click', () => {
      const decision = button.dataset.decision;
      if (decision) showDecision(decision);
      select(Number(button.dataset.next), true);
    });
  });
});
if ('IntersectionObserver' in window && !motion.matches) {
  const enter = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    animateExample(entry.target.querySelector('[role="tabpanel"]:not([hidden])'));
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
