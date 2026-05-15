import { ReviewAction } from './types';

const dayMs = 24 * 60 * 60 * 1000;

export function nowIso() {
  return new Date().toISOString();
}

export function startOfLocalDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addReviewInterval(action: ReviewAction, base = new Date()) {
  const next = new Date(base);

  if (action === 'later') {
    next.setMinutes(next.getMinutes() + 20);
    return next.toISOString();
  }

  if (action === '1d') {
    next.setDate(next.getDate() + 1);
    return next.toISOString();
  }

  if (action === '3d') {
    next.setDate(next.getDate() + 3);
    return next.toISOString();
  }

  if (action === '7d') {
    next.setDate(next.getDate() + 7);
    return next.toISOString();
  }

  next.setMonth(next.getMonth() + 1);
  return next.toISOString();
}

export function isDue(isoDate: string) {
  return new Date(isoDate).getTime() <= Date.now();
}

export function todayRange() {
  const start = startOfLocalDay();
  const end = new Date(start.getTime() + dayMs);
  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

export function localDateKey(isoDate: string) {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
