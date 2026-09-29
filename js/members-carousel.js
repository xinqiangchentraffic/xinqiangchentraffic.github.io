(() => {
  const carousel = document.querySelector('.members-carousel');
  if (!carousel) return;

  const track = carousel.querySelector('.photo-track');
  const slides = Array.from(track.children);
  const total = slides.length;
  if (total < 2) return;

  const dotsContainer = carousel.querySelector('.photo-dots');
  const counter = carousel.querySelector('.photo-count');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let timer;
  let moving = false;
  let settleTimer;
  let lastWheel = 0;
  let pointerStart;

  slides.forEach((slide, i) => {
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', '幻灯片');
    slide.setAttribute('aria-label', `${i + 1} / ${total}`);
    slide.querySelector('img').draggable = false;
  });

  // Copies at both ends allow the last and first photos to join smoothly.
  [slides[total - 1], slides[0]].forEach((slide, i) => {
    const copy = slide.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    if (i === 0) track.prepend(copy);
    else track.append(copy);
  });

  const dots = slides.map((_, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'photo-dot';
    button.setAttribute('aria-label', `查看第 ${i + 1} 张合照`);
    button.setAttribute('aria-controls', 'team-photo-track');
    button.addEventListener('click', () => show(i));
    dotsContainer.append(button);
    return button;
  });

  function schedule() {
    window.clearTimeout(timer);
    if (!document.hidden) {
      timer = window.setTimeout(() => show(index + 1), 5000);
    }
  }

  function settle() {
    window.clearTimeout(settleTimer);
    index = (index + total) % total;
    track.style.transition = 'none';
    track.style.transform = `translateX(-${(index + 1) * 100}%)`;
    moving = false;
  }

  function show(next, animate = true) {
    if (moving) return;
    index = next;
    const active = (index + total) % total;
    const duration = animate && !reducedMotion.matches ? 550 : 0;
    track.style.transition = duration ? `transform ${duration}ms ease` : 'none';
    track.style.transform = `translateX(-${(index + 1) * 100}%)`;
    slides.forEach((slide, i) => slide.setAttribute('aria-hidden', String(i !== active)));
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === active)));
    counter.textContent = `${active + 1} / ${total}`;
    moving = duration > 0;
    if (moving) settleTimer = window.setTimeout(settle, duration + 80);
    else settle();
    schedule();
  }

  track.addEventListener('transitionend', event => {
    if (event.target === track && event.propertyName === 'transform') settle();
  });
  carousel.querySelector('.photo-prev').addEventListener('click', () => show(index - 1));
  carousel.querySelector('.photo-next').addEventListener('click', () => show(index + 1));
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      settle();
    }
    schedule();
  });
  carousel.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    show(index + (event.key === 'ArrowRight' ? 1 : -1));
  });
  carousel.addEventListener('wheel', event => {
    if (event.ctrlKey) return;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!delta) return;
    event.preventDefault();
    const now = performance.now();
    if (now - lastWheel < 700 || Math.abs(delta) < 5) return;
    lastWheel = now;
    show(index + Math.sign(delta));
  }, { passive: false });
  carousel.addEventListener('pointerdown', event => {
    if (event.target.closest('button') || event.button !== 0) return;
    pointerStart = { x: event.clientX, y: event.clientY };
    carousel.setPointerCapture(event.pointerId);
  });
  carousel.addEventListener('pointerup', event => {
    if (!pointerStart) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
  });
  carousel.addEventListener('pointercancel', () => { pointerStart = null; });

  carousel.querySelector('.photo-controls').hidden = false;
  show(0, false);
})();
