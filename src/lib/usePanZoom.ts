import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { easeInOut, reducedMotion } from './motion';

export interface View { x: number; y: number; k: number }

/**
 * Масштабирование и перемещение SVG-схемы: колесо мыши, перетаскивание, щипок двумя пальцами, кнопки.
 * Возвращает трансформацию для внутренней группы и масштаб «единица схемы → пиксель экрана».
 */
export function usePanZoom(svgRef: RefObject<SVGSVGElement>, width: number, height: number, minK = 1, maxK = 5) {
  const [view, setViewRaw] = useState<View>({ x: 0, y: 0, k: 1 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const anim = useRef<number | null>(null);
  /** Любое ручное действие прерывает плавный перелёт камеры. */
  const setView: typeof setViewRaw = useCallback((v) => {
    if (anim.current) { cancelAnimationFrame(anim.current); anim.current = null; }
    setViewRaw(v);
  }, []);
  const [pxPerUnit, setPxPerUnit] = useState(1);
  const [box, setBox] = useState({ w: width, h: height });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const last = useRef<{ x: number; y: number; dist?: number } | null>(null);
  const moved = useRef(false);

  const clamp = useCallback((v: View): View => {
    const k = Math.min(maxK, Math.max(minK, v.k));
    const minX = width - width * k;
    const minY = height - height * k;
    return { k, x: Math.min(0, Math.max(minX, v.x)), y: Math.min(0, Math.max(minY, v.y)) };
  }, [width, height, minK, maxK]);

  // Пересчёт единиц схемы в экранные пиксели (для подписей постоянного размера).
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) { setPxPerUnit(Math.min(r.width / width, r.height / height)); setBox({ w: r.width, h: r.height }); }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [svgRef, width, height]);

  /** Экранная точка → координаты viewBox. */
  const toSvg = useCallback((clientX: number, clientY: number) => {
    const el = svgRef.current!;
    const r = el.getBoundingClientRect();
    const s = Math.min(r.width / width, r.height / height);
    const ox = (r.width - width * s) / 2;
    const oy = (r.height - height * s) / 2;
    return { x: (clientX - r.left - ox) / s, y: (clientY - r.top - oy) / s };
  }, [svgRef, width, height]);

  const zoomAt = useCallback((factor: number, cx = width / 2, cy = height / 2) => {
    setView((v) => {
      const k = Math.min(maxK, Math.max(minK, v.k * factor));
      const f = k / v.k;
      return clamp({ k, x: cx - (cx - v.x) * f, y: cy - (cy - v.y) * f });
    });
  }, [setView, clamp, width, height, minK, maxK]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = toSvg(e.clientX, e.clientY);
      zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, p.x, p.y);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [svgRef, toSvg, zoomAt]);

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    const pts = [...pointers.current.values()];
    if (pts.length === 1) last.current = toSvg(e.clientX, e.clientY);
    if (pts.length === 2) {
      const [a, b] = pts as [{ x: number; y: number }, { x: number; y: number }];
      last.current = { ...toSvg((a.x + b.x) / 2, (a.y + b.y) / 2), dist: Math.hypot(a.x - b.x, a.y - b.y) };
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !last.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 1) {
      const p = toSvg(e.clientX, e.clientY);
      const dx = p.x - last.current.x;
      const dy = p.y - last.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) {
        if (!moved.current) (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
        moved.current = true;
      }
      if (moved.current) setView((v) => clamp({ ...v, x: v.x + dx, y: v.y + dy }));
      last.current = p;
    } else if (pts.length === 2) {
      const [a, b] = pts as [{ x: number; y: number }, { x: number; y: number }];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = toSvg((a.x + b.x) / 2, (a.y + b.y) / 2);
      if (last.current.dist) zoomAt(dist / last.current.dist, mid.x, mid.y);
      moved.current = true;
      last.current = { ...mid, dist };
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) last.current = null;
  };

  /** Плавно перевести камеру к точке схемы (масштаб не уменьшается ниже заданного). */
  const focus = useCallback((cx: number, cy: number, k?: number, ms = 900, exact = false, offsetY = 0) => {
    const from = viewRef.current;
    const kk = exact && k ? k : Math.max(from.k, k ?? from.k);
    const to = clamp({ k: kk, x: width / 2 - cx * kk, y: height / 2 - offsetY - cy * kk });
    if (anim.current) cancelAnimationFrame(anim.current);
    if (reducedMotion() || ms <= 0) { anim.current = null; setViewRaw(to); return; }
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      const e = easeInOut(t);
      setViewRaw({ k: from.k + (to.k - from.k) * e, x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e });
      anim.current = t < 1 ? requestAnimationFrame(step) : null;
    };
    anim.current = requestAnimationFrame(step);
  }, [clamp, width, height]);
  useEffect(() => () => { if (anim.current) cancelAnimationFrame(anim.current); }, []);

  return {
    view,
    pxPerUnit,
    /** Видимая область в единицах viewBox (с учётом полей при вписывании). */
    visibleBox: { x0: width / 2 - box.w / 2 / pxPerUnit, x1: width / 2 + box.w / 2 / pxPerUnit, y0: height / 2 - box.h / 2 / pxPerUnit, y1: height / 2 + box.h / 2 / pxPerUnit },
    transform: `translate(${view.x} ${view.y}) scale(${view.k})`,
    zoomIn: () => zoomAt(1.4),
    zoomOut: () => zoomAt(1 / 1.4),
    reset: () => focus(width / 2, height / 2, 1, 600, true),
    focus,
    /** true, если последний жест был перетаскиванием, а не нажатием. */
    wasDrag: () => moved.current,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onPointerLeave: onPointerUp },
  };
}
