import { useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import DayEditPanel from "./DayEditPanel";
import CodeBadge from "./CodeBadge";
import { C, MONTHS } from "../constants/theme";
import { todayStr, getRowsForDate, getSchColor } from "../utils/scheduleUtils";

export default function CalendarView({ schedules, tableRows, onReload, onGoCreate }) {
  const [month, setMonth]         = useState(new Date());
  const [editingDate, setEditingDate] = useState(null);

  const year = month.getFullYear();
  const mon  = month.getMonth();
  const firstDay    = new Date(year, mon, 1).getDay();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const days = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const TODAY = todayStr();
  const isCurrentMonth = mon === new Date().getMonth() && year === new Date().getFullYear();

  return (
    <div>
      {editingDate && (
        <DayEditPanel
          dateStr={editingDate.dateStr}
          label={editingDate.label}
          existingRows={getRowsForDate(editingDate.dateStr, tableRows)}
          schedules={schedules}
          onClose={() => setEditingDate(null)}
          onSaved={onReload}
          onGoCreate={() => { setEditingDate(null); onGoCreate(); }}
        />
      )}

      <div style={{ background:C.white, borderRadius:"14px", border:`1px solid ${C.border}`, overflow:"hidden" }}>
        <div style={{ height:"3px", background:`linear-gradient(90deg,${C.navy},${C.red})` }}/>

        {/* Month nav */}
        <div style={{ padding:"18px 24px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <button onClick={() => setMonth(new Date(year, mon - 1, 1))}
            style={{ background:C.offwhite, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"8px 14px", cursor:"pointer", color:C.text, display:"flex", alignItems:"center" }}>
            <ChevronLeft size={16}/>
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
            <div style={{ fontSize:"18px", fontWeight:800, color:C.navy }}>{MONTHS[mon]} {year}</div>
            {!isCurrentMonth && (
              <button onClick={() => setMonth(new Date())}
                style={{ background:C.red, color:C.white, border:"none", borderRadius:"20px", padding:"5px 14px", cursor:"pointer", fontSize:"12px", fontWeight:700, display:"flex", alignItems:"center", gap:"5px" }}>
                Today <ArrowRight size={12}/>
              </button>
            )}
          </div>
          <button onClick={() => setMonth(new Date(year, mon + 1, 1))}
            style={{ background:C.offwhite, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"8px 14px", cursor:"pointer", color:C.text, display:"flex", alignItems:"center" }}>
            <ChevronRight size={16}/>
          </button>
        </div>

        {/* Day-of-week headers */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", textAlign:"center", padding:"10px 16px 0" }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <div key={d} style={{ fontSize:"11px", fontWeight:700, color:C.textLight, padding:"6px 0", letterSpacing:"0.06em" }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"4px", padding:"4px 16px 16px" }}>
          {days.map((day, i) => {
            if (!day) return <div key={i}/>;
            const dow       = new Date(year, mon, day).getDay();
            const isWeekend = dow === 0 || dow === 6;
            const dateStr   = `${year}-${String(mon+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const isToday   = dateStr === TODAY;
            const codes     = [...new Set(getRowsForDate(dateStr, tableRows).map(r => r.code))];
            const mainColor = codes.length > 0 ? getSchColor(codes[0], schedules) : null;

            return (
              <div key={i}
                onClick={() => !isWeekend && setEditingDate({
                  dateStr,
                  label: new Date(year, mon, day).toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" }),
                })}
                style={{
                  minHeight:"78px", borderRadius:"10px", padding:"8px",
                  background: isToday ? C.navy : isWeekend ? C.offwhite : mainColor ? mainColor+"15" : C.white,
                  border: isToday ? `2px solid ${C.red}` : isWeekend ? `1px solid ${C.border}` : `1px solid ${mainColor ? mainColor+"35" : C.border}`,
                  cursor: isWeekend ? "default" : "pointer",
                  transition: "box-shadow 0.15s",
                }}
                onMouseEnter={e => !isWeekend && (e.currentTarget.style.boxShadow = "0 2px 10px rgba(26,58,107,0.12)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
              >
                <div style={{ fontSize:"13px", fontWeight:800, color:isToday?C.white:isWeekend?C.textLight:C.text, marginBottom:"4px" }}>{day}</div>
                {!isWeekend && codes.length > 0 && (
                  <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
                    {codes.slice(0,2).map(c => <CodeBadge key={c} code={c} color={isToday?"white":getSchColor(c,schedules)} small/>)}
                    {codes.length > 2 && <span style={{ fontSize:"10px", color:isToday?"rgba(255,255,255,0.6)":C.textMuted }}>+{codes.length-2}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ padding:"12px 20px", borderTop:`1px solid ${C.border}`, display:"flex", gap:"16px", flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", color:C.textMuted }}>
            <div style={{ width:"12px", height:"12px", background:C.navy, borderRadius:"3px", border:`2px solid ${C.red}` }}/> Today
          </div>
          <div style={{ fontSize:"12px", color:C.textMuted }}>Click any weekday to edit</div>
        </div>
      </div>
    </div>
  );
}