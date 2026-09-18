/* English Home enhancement. Existing navigation and content remain the source of truth. */
(() => {
  const home = document.querySelector('.v08-home');
  if (!home) return;
  const header = home.querySelector('.st-header');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  // Position, not direction: stay compact until returning to the top band.
  const compactAfter = 96;
  let frame = 0;
  function updateHeader() {
    frame = 0;
    header.classList.toggle('v08-compact', Math.max(0, scrollY) > compactAfter);
  }
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(updateHeader); }, { passive: true });
  addEventListener('pageshow', updateHeader);
  updateHeader();
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
