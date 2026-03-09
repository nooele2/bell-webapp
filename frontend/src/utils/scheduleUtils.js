// ─── Date helpers ─────────────────────────────────────────────────────────────

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function todayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export function getThisWeekDays() {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      date: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
      short: ['Mon','Tue','Wed','Thu','Fri'][i],
      shortDate: d.getDate().toString(),
      label: d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' }),
    };
  });
}

// ─── Schedule helpers ─────────────────────────────────────────────────────────

/** Get the color for a schedule code */
export function getSchColor(code, schedules) {
  return schedules.find(s => s.code === code)?.color || '#6b6560';
}

/** Get all table rows that apply to a given date (single or range) */
export function getRowsForDate(dateStr, rows) {
  return rows.filter(r =>
    r.to ? dateStr >= r.from && dateStr <= r.to : r.from === dateStr
  );
}

/**
 * Build merged bell times for a set of schedule codes on a given day.
 *
 * @param {string[]}  codes           - Schedule codes active on this day (e.g. ['L', 'c+'])
 * @param {object[]}  schedules       - Full schedules array from the API
 * @param {object}    normalSchedule  - The schedule with isNormal=true (from DB, not hardcoded)
 *
 * Logic:
 *  - If any code is a replacement (isAddon=false, isNormal=false) → use its times instead of Normal
 *  - Add-on codes (isAddon=true) layer on top, muting or inserting individual times
 *  - If no replacement → fall back to normalSchedule.times from DB
 */
export function buildBellTimes(codes, schedules, normalSchedule) {
  const replacement = codes.find(c => {
    const s = schedules.find(x => x.code === c);
    return s && !s.isAddon && !s.isNormal;
  });

  const baseTimes = replacement
    ? (schedules.find(s => s.code === replacement)?.times || []).map(t => ({ ...t, mod: replacement }))
    : (normalSchedule?.times || []).map(t => ({ ...t, mod: null }));

  let times = [...baseTimes];

  // Apply add-on schedules on top
  codes
    .filter(c => schedules.find(x => x.code === c)?.isAddon)
    .forEach(code => {
      const sch = schedules.find(s => s.code === code);
      if (!sch) return;
      sch.times.forEach(mt => {
        const existing = times.find(t => t.time === mt.time);
        if (existing) {
          existing.muted = mt.muted;
          existing.mod   = code;
        } else {
          times.push({ ...mt, mod: code });
        }
      });
      times.sort((a, b) => a.time.localeCompare(b.time));
    });

  return times;
}

/** Convert HH:MM to total minutes */
export function toMins(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}