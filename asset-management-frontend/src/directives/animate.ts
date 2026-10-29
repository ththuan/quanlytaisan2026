import type { App, Directive, DirectiveBinding } from 'vue';
import { effectsLiteNow } from '@/utils/effects';

type StaggerOptions = {
  selector?: string;
  delay?: number;
  step?: number;
  duration?: number;
  distance?: number;
};

type TiltOptions = {
  maxTilt?: number;
  lift?: number;
  scale?: number;
  perspective?: number;
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const skipEffects = () => prefersReducedMotion() || effectsLiteNow();

const staggerRows = new WeakMap<HTMLElement, MutationObserver>();

const optionNumber = (
  binding: DirectiveBinding<StaggerOptions | number | undefined>,
  key: keyof StaggerOptions,
  fallback: number,
) => {
  const value = binding.value;
  if (typeof value === 'number') return value;
  return Number(value?.[key] ?? fallback);
};

export const vStagger: Directive<HTMLElement, StaggerOptions | number | undefined> = {
  mounted(el, binding) {
    if (skipEffects()) return;

    const selector = typeof binding.value === 'object' ? binding.value?.selector : undefined;
    const delay = optionNumber(binding, 'delay', 0);
    const step = optionNumber(binding, 'step', 45);
    const duration = optionNumber(binding, 'duration', 420);
    const distance = optionNumber(binding, 'distance', 14);

    const children = selector ? el.querySelectorAll<HTMLElement>(selector) : el.children;

    Array.from(children).forEach((child, index) => {
      if (!(child instanceof HTMLElement)) return;
      child.animate(
        [
          { opacity: 0, transform: `translateY(${distance}px)` },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        {
          duration,
          delay: delay + index * step,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both',
        },
      );
    });
  },
};

const animateTableRows = (el: HTMLElement) => {
  if (skipEffects()) return;
  const rows = el.querySelectorAll<HTMLElement>('tr.el-table__row');
  rows.forEach((row, index) => {
    if (row.dataset.staggered === 'true') return;
    row.dataset.staggered = 'true';
    row.animate(
      [
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      {
        duration: 320,
        delay: Math.min(index * 28, 280),
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'both',
      },
    );
  });
};

export const vStaggerRows: Directive<HTMLElement> = {
  mounted(el) {
    animateTableRows(el);
    const observer = new MutationObserver(() => {
      requestAnimationFrame(() => animateTableRows(el));
    });
    observer.observe(el, { childList: true, subtree: true });
    staggerRows.set(el, observer);
  },
  unmounted(el) {
    staggerRows.get(el)?.disconnect();
    staggerRows.delete(el);
  },
};

const applyTilt = (el: HTMLElement, binding: DirectiveBinding<TiltOptions | undefined>) => {
  const maxTilt = binding.value?.maxTilt ?? 6;
  const lift = binding.value?.lift ?? 4;
  const scale = binding.value?.scale ?? 1.01;
  const perspective = binding.value?.perspective ?? 900;

  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;

  const update = () => {
    frame = 0;
    if (skipEffects()) return;

    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = (pointerX - rect.left) / rect.width;
    const y = (pointerY - rect.top) / rect.height;
    const rotateX = (0.5 - y) * maxTilt * 2;
    const rotateY = (x - 0.5) * maxTilt * 2;

    el.style.transform =
      `perspective(${perspective}px) ` +
      `rotateX(${rotateX.toFixed(2)}deg) ` +
      `rotateY(${rotateY.toFixed(2)}deg) ` +
      `translateY(-${lift}px) scale(${scale})`;
  };

  const onMove = (event: MouseEvent) => {
    if (skipEffects()) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!frame) frame = requestAnimationFrame(update);
  };

  const onEnter = () => {
    if (skipEffects()) return;
    el.style.willChange = 'transform';
    el.style.transition = 'transform 140ms ease-out';
  };

  const onLeave = () => {
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    el.style.transition = 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)';
    el.style.transform = '';
    el.style.willChange = '';
  };

  el.addEventListener('mouseenter', onEnter);
  el.addEventListener('mousemove', onMove);
  el.addEventListener('mouseleave', onLeave);

  const cleanup = () => {
    if (frame) cancelAnimationFrame(frame);
    el.removeEventListener('mouseenter', onEnter);
    el.removeEventListener('mousemove', onMove);
    el.removeEventListener('mouseleave', onLeave);
    el.style.transform = '';
    el.style.transition = '';
    el.style.willChange = '';
  };

  (el as HTMLElement & { __tiltCleanup?: () => void }).__tiltCleanup = cleanup;
};

export const vTilt: Directive<HTMLElement, TiltOptions | undefined> = {
  mounted(el, binding) {
    applyTilt(el, binding);
  },
  beforeUnmount(el) {
    (el as HTMLElement & { __tiltCleanup?: () => void }).__tiltCleanup?.();
  },
};

type RevealOptions = {
  delay?: number;
  distance?: number;
  duration?: number;
  once?: boolean;
};

const tabsState = new WeakMap<HTMLElement, () => void>();
const tabsCleanup = new WeakMap<HTMLElement, () => void>();

const createTabsHighlight = (root: HTMLElement) => {
  const header = root.querySelector<HTMLElement>('.el-tabs__header');
  if (!header) return null;

  header.classList.add('has-tabs-highlight');
  const line = document.createElement('div');
  line.className = 'tabs-sliding-highlight';
  header.appendChild(line);

  let frame = 0;
  const update = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const active = header.querySelector<HTMLElement>('.el-tabs__item.is-active');
      if (!active || !active.offsetParent) {
        line.style.opacity = '0';
        return;
      }
      const headerRect = header.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      line.style.transform = `translateX(${activeRect.left - headerRect.left}px)`;
      line.style.width = `${activeRect.width}px`;
      line.style.opacity = '1';
    });
  };

  update();

  const observer = new MutationObserver(update);
  observer.observe(header, {
    attributes: true,
    attributeFilter: ['class'],
    childList: true,
    subtree: true,
  });

  const resize = new ResizeObserver(update);
  resize.observe(header);

  const onWindowResize = () => update();
  window.addEventListener('resize', onWindowResize);

  const cleanup = () => {
    observer.disconnect();
    resize.disconnect();
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', onWindowResize);
    line.remove();
    header.classList.remove('has-tabs-highlight');
  };

  tabsCleanup.set(root, cleanup);
  return update;
};

export const vTabsHighlight: Directive<HTMLElement> = {
  mounted(el) {
    const update = createTabsHighlight(el);
    if (update) tabsState.set(el, update);
  },
  updated(el) {
    tabsState.get(el)?.();
  },
  beforeUnmount(el) {
    tabsState.delete(el);
    tabsCleanup.get(el)?.();
    tabsCleanup.delete(el);
  },
};

const revealObservers = new WeakMap<HTMLElement, IntersectionObserver>();

export const vReveal: Directive<HTMLElement, RevealOptions | number | undefined> = {
  mounted(el, binding) {
    if (skipEffects()) return;

    const options = typeof binding.value === 'number' ? { delay: binding.value } : binding.value;
    const delay = options?.delay ?? 0;
    const distance = options?.distance ?? 18;
    const duration = options?.duration ?? 520;
    const once = options?.once ?? true;

    el.style.opacity = '0';
    el.style.transform = `translateY(${distance}px)`;
    el.style.transition =
      `opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, ` +
      `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`;
    el.style.willChange = 'opacity, transform';

    const reveal = () => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      window.setTimeout(() => {
        el.style.willChange = '';
      }, duration + delay);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal();
          if (once) observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );

    observer.observe(el);
    revealObservers.set(el, observer);
  },
  beforeUnmount(el) {
    revealObservers.get(el)?.disconnect();
    revealObservers.delete(el);
  },
};

const rippleCleanup = new WeakMap<HTMLElement, () => void>();

export const vRipple: Directive<HTMLElement, string | undefined> = {
  mounted(el, binding) {
    el.style.position = el.style.position || 'relative';
    el.style.overflow = 'hidden';

    const onPointerDown = (event: PointerEvent) => {
      if (skipEffects()) return;
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const ripple = document.createElement('span');
      ripple.style.position = 'absolute';
      ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.borderRadius = '50%';
      ripple.style.background = binding.value ?? 'currentColor';
      ripple.style.opacity = '0.28';
      ripple.style.pointerEvents = 'none';
      ripple.style.transform = 'scale(0)';
      el.appendChild(ripple);

      const animation = ripple.animate(
        [
          { transform: 'scale(0)', opacity: 0.28 },
          { transform: 'scale(1)', opacity: 0 },
        ],
        { duration: 600, easing: 'ease-out' },
      );
      animation.onfinish = () => ripple.remove();
    };

    el.addEventListener('pointerdown', onPointerDown);
    rippleCleanup.set(el, () => el.removeEventListener('pointerdown', onPointerDown));
  },
  beforeUnmount(el) {
    rippleCleanup.get(el)?.();
    rippleCleanup.delete(el);
  },
};

export const installAnimateDirectives = (app: App) => {
  app.directive('stagger', vStagger);
  app.directive('stagger-rows', vStaggerRows);
  app.directive('tilt', vTilt);
  app.directive('ripple', vRipple);
  app.directive('reveal', vReveal);
  app.directive('tabs-highlight', vTabsHighlight);
};
