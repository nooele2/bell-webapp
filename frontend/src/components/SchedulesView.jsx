import { useState } from "react";
import { Plus, Pencil, Trash2, RefreshCw, Layers, Volume2, VolumeX, Lock } from "lucide-react";
import ScheduleEditor from "./ScheduleEditor";
import CodeBadge from "./CodeBadge";
import { C, SCHEDULE_COLORS } from "../constants/theme";
import { createSchedule, updateSchedule, deleteSchedule } from "../services/api";

const BLANK_SCHEDULE = { id:null, code:"", name:"", color:SCHEDULE_COLORS[0], isAddon:false, times:[] };

export default function SchedulesView({ schedules, onReload }) {
  const [editing, setEditing]   = useState(null);
  const [creating, setCreating] = useState(false);

  // Separate Normal from the rest — Normal is always shown first and can't be deleted
  const normalSchedule  = schedules.find(s => s.isNormal);
  const otherSchedules  = schedules.filter(s => !s.isNormal);

  const handleSave = async (updated) => {
    if (updated.id) await updateSchedule(updated.id, updated);
    else            await createSchedule(updated);
    await onReload();
    setEditing(null);
    setCreating(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this schedule? Existing table rows using it will remain but won't match any code.")) return;
    await deleteSchedule(id);
    await onReload();
  };

  const BellTimePreview = ({ times, scheduleId }) => {
    const [expanded, setExpanded] = useState(false);
    if (!times || times.length === 0) return (
      <div style={{ fontSize:"12px", color:C.textLight, fontStyle:"italic", display:"flex", alignItems:"center", gap:"4px" }}>
        <VolumeX size={11}/> No bell times — date marker only
      </div>
    );
    const visible = expanded ? times : times.slice(0, 4);
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:"3px" }}>
        {visible.map((bt, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", fontSize:"12px", color:bt.muted?C.textLight:C.text }}>
            <span style={{ fontFamily:"monospace", fontWeight:700, width:"38px", flexShrink:0 }}>{bt.time}</span>
            <span style={{ textDecoration:bt.muted?"line-through":"none", flex:1 }}>{bt.label}</span>
            {bt.muted && <VolumeX size={9} color={C.textLight}/>}
          </div>
        ))}
        {times.length > 4 && (
          <button onClick={() => setExpanded(e => !e)}
            style={{ background:"none", border:"none", padding:"4px 0 0", cursor:"pointer", fontSize:"12px", color:C.navyLight, fontWeight:600, display:"flex", alignItems:"center", gap:"4px", textAlign:"left" }}>
            <Volume2 size={11}/>
            {expanded ? "Show less" : `+${times.length - 4} more bells`}
          </button>
        )}
      </div>
    );
  };

  const ScheduleCard = ({ s, isNormal }) => (
    <div
      style={{ background:C.white, borderRadius:"14px", border:`1.5px solid ${isNormal ? s.color+"60" : C.border}`, overflow:"hidden", transition:"box-shadow 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(26,58,107,0.1)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      <div style={{ height:"4px", background:s.color }}/>
      <div style={{ padding:"16px 18px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"10px", marginBottom:"12px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <CodeBadge code={s.code} color={s.color}/>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                <div style={{ fontSize:"14px", fontWeight:700, color:C.text }}>{s.name}</div>
                {isNormal && (
                  <span style={{ fontSize:"10px", background:"#eef3fc", color:C.navyLight, border:`1px solid #c5d8f5`, padding:"1px 7px", borderRadius:"10px", fontWeight:700 }}>
                    Base Schedule
                  </span>
                )}
              </div>
              <div style={{ fontSize:"11px", color:isNormal?C.navyLight:s.isAddon?C.success:C.navyLight, fontWeight:600, marginTop:"1px", display:"flex", alignItems:"center", gap:"3px" }}>
                {isNormal
                  ? <><RefreshCw size={10}/> Default — rings every weekday</>
                  : s.isAddon
                    ? <><Layers size={10}/> Adds to Normal</>
                    : <><RefreshCw size={10}/> Replaces Normal</>
                }
              </div>
            </div>
          </div>

          <div style={{ display:"flex", gap:"6px" }}>
            <button onClick={() => setEditing(s)}
              style={{ background:C.offwhite, border:`1px solid ${C.border}`, borderRadius:"7px", padding:"6px 10px", cursor:"pointer", fontSize:"13px", color:C.text, display:"flex", alignItems:"center", gap:"4px" }}>
              <Pencil size={12}/> Edit
            </button>
            {isNormal ? (
              <div title="Normal schedule cannot be deleted"
                style={{ background:C.offwhite, border:`1px solid ${C.border}`, borderRadius:"7px", padding:"6px 10px", display:"flex", alignItems:"center", opacity:0.4 }}>
                <Lock size={12} color={C.textMuted}/>
              </div>
            ) : (
              <button onClick={() => handleDelete(s.id)}
                style={{ background:C.dangerBg, border:`1px solid ${C.dangerBorder}`, borderRadius:"7px", padding:"6px 10px", cursor:"pointer", color:C.danger, display:"flex", alignItems:"center" }}>
                <Trash2 size={12}/>
              </button>
            )}
          </div>
        </div>

        <BellTimePreview times={s.times}/>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

      {(editing || creating) && (
        <ScheduleEditor
          schedule={editing || BLANK_SCHEDULE}
          normalSchedule={normalSchedule}
          onSave={handleSave}
          onCancel={() => { setEditing(null); setCreating(false); }}
        />
      )}

      {/* Page header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:"20px", fontWeight:800, color:C.navy }}>Schedules</div>
          <div style={{ fontSize:"13px", color:C.textMuted, marginTop:"2px" }}>
            Manage schedule codes and bell times — including the Normal base schedule
          </div>
        </div>
        <button onClick={() => setCreating(true)}
          style={{ background:C.navy, color:C.white, border:"none", borderRadius:"10px", padding:"10px 18px", fontSize:"14px", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:"6px" }}>
          <Plus size={15}/> New Schedule
        </button>
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
        <div style={{ fontSize:"13px", color:C.text, background:"#eef3fc", border:"1px solid #c5d8f5", borderRadius:"8px", padding:"6px 12px", display:"flex", alignItems:"center", gap:"6px" }}>
          <RefreshCw size={12} color={C.navyLight}/> Replaces Normal
        </div>
        <div style={{ fontSize:"13px", color:C.text, background:"#f0fbf4", border:"1px solid #a8e6be", borderRadius:"8px", padding:"6px 12px", display:"flex", alignItems:"center", gap:"6px" }}>
          <Layers size={12} color={C.success}/> Adds on top of Normal
        </div>
      </div>

      {/* Normal schedule — always first */}
      {normalSchedule && (
        <>
          <div style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, letterSpacing:"0.08em", textTransform:"uppercase" }}>
            Base Schedule
          </div>
          <ScheduleCard s={normalSchedule} isNormal={true}/>
          <div style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, letterSpacing:"0.08em", textTransform:"uppercase", marginTop:"4px" }}>
            Special Schedules
          </div>
        </>
      )}

      {/* All other schedules */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))", gap:"12px" }}>
        {otherSchedules.map(s => <ScheduleCard key={s.id} s={s} isNormal={false}/>)}
        {otherSchedules.length === 0 && (
          <div style={{ gridColumn:"1/-1", padding:"32px", textAlign:"center", color:C.textLight, fontSize:"14px", background:C.white, borderRadius:"14px", border:`1px solid ${C.border}` }}>
            No special schedules yet — click "New Schedule" to add one
          </div>
        )}
      </div>
    </div>
  );
}