import { useState, useEffect } from "react";
import { Bell, Clock, Pencil, VolumeX, Timer } from "lucide-react";
import DayEditPanel from "./DayEditPanel";
import CodeBadge from "./CodeBadge";
import { C } from "../constants/theme";
import { todayStr, todayLabel, getThisWeekDays, getRowsForDate, getSchColor, buildBellTimes, toMins } from "../utils/scheduleUtils";

export default function TodayView({ schedules, tableRows, onReload, onGoCreate }) {
  const [editingDate, setEditingDate] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const TODAY = todayStr();
  const weekDays = getThisWeekDays();
  const normalSchedule = schedules.find(s => s.isNormal);
  const todayCodes = [...new Set(getRowsForDate(TODAY, tableRows).map(r => r.code))];
  const bellTimes  = buildBellTimes(todayCodes, schedules, normalSchedule);

  const currentMins = now.getHours() * 60 + now.getMinutes();
  const currentSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const clockStr    = now.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false });

  const nextBell = bellTimes.find(b => !b.muted && toMins(b.time) > currentMins);

  // Countdown to next bell (seconds)
  const countdownSecs = nextBell
    ? toMins(nextBell.time) * 60 - currentSecs
    : null;
  const fmtCountdown = (s) => {
    if (s <= 0) return "Now!";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m >= 60) return `${Math.floor(m/60)}h ${m%60}m`;
    if (m > 0)   return `${m}m ${String(sec).padStart(2,"0")}s`;
    return `${sec}s`;
  };

  const urgentCountdown = countdownSecs !== null && countdownSecs <= 120;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>

      {editingDate && (
        <DayEditPanel
          dateStr={editingDate.dateStr} label={editingDate.label}
          existingRows={getRowsForDate(editingDate.dateStr, tableRows)}
          schedules={schedules}
          onClose={() => setEditingDate(null)} onSaved={onReload}
          onGoCreate={() => { setEditingDate(null); onGoCreate(); }}
        />
      )}

      {/* ── Hero card ── */}
      <div style={{ background:`linear-gradient(135deg,${C.navy} 0%,${C.navyLight} 100%)`, borderRadius:"16px", padding:"28px 32px", color:C.white, boxShadow:"0 4px 20px rgba(26,58,107,0.25)" }}>
        <div style={{ height:"3px", background:C.red, borderRadius:"2px", marginBottom:"20px", width:"60px" }}/>

        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"16px", flexWrap:"wrap" }}>
          <div>
            <div style={{ fontSize:"12px", opacity:0.65, marginBottom:"4px", letterSpacing:"0.1em", textTransform:"uppercase" }}>Today</div>
            <div style={{ fontSize:"26px", fontWeight:800 }}>{todayLabel()}</div>
          </div>
          <button onClick={() => setEditingDate({ dateStr:TODAY, label:todayLabel() })}
            style={{ background:C.red, border:"none", color:C.white, borderRadius:"10px", padding:"8px 16px", cursor:"pointer", fontWeight:700, fontSize:"13px", flexShrink:0, display:"flex", alignItems:"center", gap:"6px" }}>
            <Pencil size={13}/> Edit Today
          </button>
        </div>

        {/* Clock + badges */}
        <div style={{ display:"flex", gap:"12px", flexWrap:"wrap", marginTop:"16px", alignItems:"center" }}>
          <span style={{ fontSize:"20px", fontWeight:700, fontFamily:"monospace" }}>{clockStr}</span>
          <span style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:"8px", padding:"5px 12px", fontSize:"13px", fontWeight:600, display:"flex", alignItems:"center", gap:"5px" }}>
            <Bell size={13}/> Normal
          </span>
          {todayCodes.map(c => (
            <span key={c} style={{ background:"rgba(192,57,43,0.25)", border:"1px solid rgba(192,57,43,0.5)", borderRadius:"8px", padding:"5px 12px", fontSize:"13px", fontWeight:600, fontFamily:"monospace" }}>{c}</span>
          ))}
        </div>

        {/* Next bell + countdown */}
        {nextBell && (
          <div style={{ marginTop:"12px", display:"flex", gap:"10px", flexWrap:"wrap" }}>
            {/* Next bell */}
            <div style={{ flex:1, minWidth:"180px", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"10px", padding:"8px 14px", display:"flex", alignItems:"center", gap:"12px" }}>
              <Clock size={16} style={{ opacity:0.8, flexShrink:0 }}/>
              <div>
                <div style={{ fontSize:"10px", opacity:0.7 }}>Next bell</div>
                <div style={{ fontSize:"15px", fontWeight:700 }}>{nextBell.time} — {nextBell.label}</div>
              </div>
            </div>
            {/* Countdown */}
            <div style={{ background: urgentCountdown ? "rgba(192,57,43,0.35)" : "rgba(255,255,255,0.1)", border: urgentCountdown ? "1px solid rgba(192,57,43,0.6)" : "1px solid rgba(255,255,255,0.15)", borderRadius:"10px", padding:"8px 16px", display:"flex", alignItems:"center", gap:"10px", minWidth:"120px" }}>
              <Timer size={16} style={{ opacity:0.8, flexShrink:0 }}/>
              <div>
                <div style={{ fontSize:"10px", opacity:0.7 }}>Rings in</div>
                <div style={{ fontSize:"20px", fontWeight:800, fontFamily:"monospace", letterSpacing:"-0.02em", color: urgentCountdown ? "#ffb3b3" : C.white }}>
                  {fmtCountdown(countdownSecs)}
                </div>
              </div>
            </div>
          </div>
        )}

        {!nextBell && bellTimes.length > 0 && (
          <div style={{ marginTop:"14px", opacity:0.6, fontSize:"14px" }}>School day complete 🎉</div>
        )}
      </div>

      {/* ── This week ── */}
      <div style={{ background:C.white, borderRadius:"14px", padding:"20px 24px", border:`1px solid ${C.border}` }}>
        <div style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"14px" }}>
          This Week — click any day to edit
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"8px" }}>
          {weekDays.map(d => {
            const codes   = [...new Set(getRowsForDate(d.date, tableRows).map(r => r.code))];
            const isToday = d.date === TODAY;
            return (
              <div key={d.date}
                onClick={() => setEditingDate({ dateStr:d.date, label:d.label })}
                style={{ textAlign:"center", padding:"12px 6px", borderRadius:"10px", background:isToday?C.navy:C.offwhite, border:`1px solid ${isToday?C.red:C.border}`, cursor:"pointer", transition:"all 0.15s" }}
                onMouseEnter={e => { if(!isToday){ e.currentTarget.style.background="#eef3fc"; e.currentTarget.style.borderColor=C.navyLight; } }}
                onMouseLeave={e => { e.currentTarget.style.background=isToday?C.navy:C.offwhite; e.currentTarget.style.borderColor=isToday?C.red:C.border; }}>
                <div style={{ fontSize:"11px", fontWeight:700, color:isToday?"rgba(255,255,255,0.7)":C.textMuted, marginBottom:"2px" }}>{d.short}</div>
                <div style={{ fontSize:"14px", fontWeight:700, color:isToday?"white":C.text, marginBottom:"8px" }}>{d.shortDate}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:"3px", alignItems:"center" }}>
                  {codes.length === 0
                    ? <span style={{ fontSize:"10px", color:isToday?"rgba(255,255,255,0.5)":C.textLight }}>—</span>
                    : codes.slice(0,2).map(c => <CodeBadge key={c} code={c} color={isToday?"white":getSchColor(c,schedules)} small/>)
                  }
                  {codes.length > 2 && <span style={{ fontSize:"10px", color:isToday?"rgba(255,255,255,0.5)":C.textLight }}>+{codes.length-2}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bell times ── */}
      <div style={{ background:C.white, borderRadius:"14px", border:`1px solid ${C.border}`, overflow:"hidden" }}>
        <div style={{ padding:"16px 24px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, letterSpacing:"0.08em", textTransform:"uppercase", display:"flex", alignItems:"center", gap:"6px" }}>
            <Bell size={13}/> Today's Bell Times
          </div>
          <span style={{ fontSize:"12px", color:C.textLight }}>{bellTimes.filter(b=>!b.muted).length} active bells</span>
        </div>
        <div style={{ maxHeight:"360px", overflowY:"auto" }}>
          {bellTimes.length === 0 && (
            <div style={{ padding:"32px", textAlign:"center", color:C.textLight }}>
              No bell times — check Normal Schedule in the Schedules tab
            </div>
          )}
          {bellTimes.map((bell, i) => {
            const isPast = toMins(bell.time) < currentMins;
            const isNext = nextBell && bell.time === nextBell.time && !bell.muted;
            const color  = bell.mod ? getSchColor(bell.mod, schedules) : C.text;
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:"16px", padding:"10px 24px", borderBottom:i<bellTimes.length-1?"1px solid #f0ece5":"none", background:isNext?"#f0f5ff":bell.muted?"#fafaf8":"transparent", opacity:isPast?0.35:1, transition:"opacity 0.3s" }}>
                <div style={{ width:"48px", fontSize:"14px", fontWeight:700, fontFamily:"monospace", color:isNext?C.navyLight:bell.muted?C.textLight:C.text }}>{bell.time}</div>
                <div style={{ flex:1, fontSize:"14px", color:bell.muted?C.textLight:C.text, textDecoration:bell.muted?"line-through":"none" }}>{bell.label}</div>
                {bell.mod && <CodeBadge code={bell.mod} color={color} small/>}
                {bell.muted && <span style={{ fontSize:"11px", color:C.textLight, background:C.offwhite, padding:"2px 6px", borderRadius:"4px", display:"flex", alignItems:"center", gap:"3px" }}><VolumeX size={10}/> muted</span>}
                {isNext && (
                  <span style={{ fontSize:"11px", color:C.navyLight, fontWeight:700, background:"#dce8ff", padding:"2px 8px", borderRadius:"6px", display:"flex", alignItems:"center", gap:"4px" }}>
                    <Timer size={10}/> {fmtCountdown(countdownSecs)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}