/* English Home enhancement. Existing navigation and content remain the source of truth. */
(() => {
  const home = document.querySelector('.v08-home');
  if (!home) return;
  const header = home.querySelector('.st-header');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const settings = { start: 140, directionDistance: 18 };
  let previous = scrollY, accumulated = 0, frame = 0;
  function updateHeader() {
    frame = 0;
    const position = Math.max(0, scrollY), delta = position - previous;
    if (Math.sign(delta) !== Math.sign(accumulated)) accumulated = 0;
    accumulated += delta;
    previous = position;
    const interacting = header.matches(':focus-within') || header.querySelector('details[open]') || header.classList.contains('st-nav-open');
    if (position < settings.start || interacting) header.classList.remove('v08-compact');
    else if (Math.abs(accumulated) >= settings.directionDistance) {
      header.classList.toggle('v08-compact', accumulated > 0);
      accumulated = 0;
    }
  }
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(updateHeader); }, { passive: true });
  header.addEventListener('focusin', () => header.classList.remove('v08-compact'));
  header.addEventListener('click', () => {
    if (header.querySelector('details[open]') || header.classList.contains('st-nav-open')) header.classList.remove('v08-compact');
  });
  // Finite, once-only entrance animations; content never depends on JS to be visible.
  const cards = home.querySelectorAll('.rv-task-picker article,.rv-product-card,.rv-platforms article,.rv-checks>div,.rv-nodes>li');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      if (!motion.matches) entry.target.animate([
        { opacity: .4, transform: 'translateY(22px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)' });
    });
  }, { threshold: .15 });
  cards.forEach(card => observer.observe(card));
  motion.addEventListener('change', () => {
    if (motion.matches) home.getAnimations({ subtree: true }).forEach(animation => animation.finish());
  });
})();
