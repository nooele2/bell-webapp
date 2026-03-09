import { useState } from "react";
import { X, Layers, RefreshCw, Sparkles, CheckCircle, Trash2, AlertCircle } from "lucide-react";
import CodeBadge from "./CodeBadge";
import ScheduleEditor from "./ScheduleEditor";
import { C } from "../constants/theme";
import { getSchColor } from "../utils/scheduleUtils";
import { replaceDateRows, deleteTableRow, createSchedule } from "../services/api";

export default function DayEditPanel({ dateStr, label, existingRows, schedules, onClose, onSaved, onGoCreate }) {
  const [rows, setRows]         = useState(existingRows.filter(r => !r.to));
  const [saving, setSaving]     = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);

  const rangeRows     = existingRows.filter(r => r.to);
  const normalSch     = schedules.find(s => s.isNormal);

  // Which replacement is active across both range + single-day rows?
  const allCodes    = [...new Set([...rangeRows, ...rows].map(r => r.code))];
  const replacement = allCodes.find(c => { const s = schedules.find(x => x.code===c); return s && !s.isAddon && !s.isNormal; });
  const replaceSch  = replacement ? schedules.find(s => s.code===replacement) : null;

  const addCode = (code) => {
    if (!code) return;
    if (rows.find(r => r.code===code)) return;
    setRows(r => [...r, { id:"new-"+Date.now(), code, from:dateStr, to:"", comment:"" }]);
  };

  const deleteRange = async (rowId) => {
    setSaving(true);
    try { await deleteTableRow(rowId); onSaved(); onClose(); }
    catch (e) { alert("Failed: "+e.message); }
    finally { setSaving(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await replaceDateRows(dateStr, rows.map(r => ({ code:r.code, comment:r.comment||"" })));
      onSaved(); onClose();
    } catch (e) { alert("Failed: "+e.message); }
    finally { setSaving(false); }
  };

  // Handle new schedule created inline
  const handleCreateNew = async (form) => {
    await createSchedule(form);
    await onSaved();          // reload schedules
    setCreatingNew(false);
  };

  const available = schedules.filter(s => !s.isNormal && !rows.find(r => r.code===s.code));

  // If inline ScheduleEditor is open, show it on top
  if (creatingNew) {
    return (
      <ScheduleEditor
        schedule={{ code:"", name:"", color:C.navy, isAddon:true, bellSlot:0, times:[] }}
        normalSchedule={normalSch}
        onSave={handleCreateNew}
        onCancel={() => setCreatingNew(false)}
      />
    );
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,25,50,0.55)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:100 }}>
      <div style={{ background:C.white, borderRadius:"20px 20px 0 0", width:"100%", maxWidth:"600px", maxHeight:"88vh", overflowY:"auto", boxShadow:"0 -12px 48px rgba(26,58,107,0.2)", padding:"0 0 40px" }}>
        <div style={{ height:"4px", background:`linear-gradient(90deg,${C.navy},${C.red})`, borderRadius:"20px 20px 0 0" }}/>

        <div style={{ padding:"24px 28px 0" }}>
          <div style={{ width:"36px", height:"4px", background:C.border, borderRadius:"4px", margin:"0 auto 22px" }}/>

          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"4px" }}>
            <div style={{ fontSize:"19px", fontWeight:800, color:C.navy }}>Edit Schedule</div>
            <button onClick={onClose} style={{ background:C.offwhite, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"6px 12px", cursor:"pointer", fontSize:"13px", color:C.textMuted, display:"flex", alignItems:"center", gap:"4px" }}>
              <X size={13}/> Close
            </button>
          </div>
          <div style={{ fontSize:"13px", color:C.textMuted, marginBottom:"18px" }}>{label}</div>

          {/* Override banner */}
          {replaceSch && (
            <div style={{ background:"#fff8e1", border:"1.5px solid #fcd34d", borderRadius:"10px", padding:"11px 16px", marginBottom:"16px", fontSize:"13px", color:"#7a5800", display:"flex", alignItems:"center", gap:"10px" }}>
              <AlertCircle size={15} style={{ flexShrink:0 }}/>
              <span><strong>{replaceSch.code} ({replaceSch.name})</strong> is active — Normal bells are replaced this day</span>
            </div>
          )}

          {/* Range rows */}
          {rangeRows.length > 0 && (
            <>
              <div style={{ fontSize:"11px", fontWeight:700, color:C.textLight, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:"8px" }}>
                From Date Range
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"6px", marginBottom:"16px" }}>
                {rangeRows.map(row => {
                  const color = getSchColor(row.code, schedules);
                  const sch   = schedules.find(s => s.code===row.code);
                  const isOverridden = replaceSch && row.code === normalSch?.code;
                  return (
                    <div key={row.id} style={{ display:"flex", alignItems:"center", gap:"12px", background:color+"12", border:`1.5px solid ${color}30`, borderRadius:"10px", padding:"10px 14px", opacity: isOverridden ? 0.5 : 1 }}>
                      <CodeBadge code={row.code} color={color}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:"13px", fontWeight:600, color:C.text, display:"flex", alignItems:"center", gap:"6px" }}>
                          {sch?.name || row.code}
                          {isOverridden && <span style={{ fontSize:"11px", background:"#fef9c3", color:"#7a5800", border:"1px solid #fcd34d", borderRadius:"4px", padding:"1px 6px" }}>overridden by {replaceSch.code}</span>}
                        </div>
                        <div style={{ fontSize:"11px", color:C.textLight }}>{row.from} → {row.to}</div>
                      </div>
                      <div style={{ fontSize:"11px", color:C.textMuted, marginRight:"4px" }}>
                        {sch?.isAddon ? <span style={{ display:"flex", alignItems:"center", gap:"3px" }}><Layers size={10}/> addon</span> : sch?.isNormal ? "base" : <span style={{ display:"flex", alignItems:"center", gap:"3px" }}><RefreshCw size={10}/> replaces</span>}
                      </div>
                      <button onClick={() => deleteRange(row.id)}
                        style={{ background:"#fff0f0", border:`1px solid #fca5a5`, borderRadius:"7px", padding:"6px 9px", cursor:"pointer", color:C.danger, display:"flex", alignItems:"center" }}>
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Active single-day rows */}
          <div style={{ fontSize:"11px", fontWeight:700, color:C.text, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:"10px" }}>
            Active This Day
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"14px" }}>
            {rows.length === 0 && (
              <div style={{ textAlign:"center", padding:"16px", background:C.offwhite, borderRadius:"10px", color:C.textLight, fontSize:"13px" }}>
                No special schedules — Normal will ring
              </div>
            )}
            {rows.map(row => {
              const color = getSchColor(row.code, schedules);
              const sch   = schedules.find(s => s.code===row.code);
              return (
                <div key={row.id} style={{ display:"flex", alignItems:"center", gap:"12px", background:color+"12", border:`1.5px solid ${color}40`, borderRadius:"10px", padding:"12px 16px" }}>
                  <CodeBadge code={row.code} color={color}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"14px", fontWeight:700, color:C.text }}>{sch?.name || row.code}</div>
                    <div style={{ fontSize:"12px", color:C.textMuted, display:"flex", alignItems:"center", gap:"4px" }}>
                      {sch?.isAddon ? <><Layers size={11} color={C.success}/> Adds to Normal</> : <><RefreshCw size={11} color={C.red}/> Replaces Normal</>}
                    </div>
                  </div>
                  <button onClick={() => setRows(r => r.filter(x => x.id!==row.id))}
                    style={{ background:"#fff0f0", border:`1px solid #fca5a5`, borderRadius:"7px", padding:"6px 9px", cursor:"pointer", color:C.danger, display:"flex", alignItems:"center" }}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add schedule — one-tap chips */}
          {available.length > 0 && (
            <div style={{ marginBottom:"20px" }}>
              <div style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:"8px" }}>
                Add a Schedule
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                {available.map(s => (
                  <button key={s.code} onClick={() => addCode(s.code)}
                    style={{ background:s.color+"18", border:`1.5px solid ${s.color}60`, borderRadius:"8px", padding:"7px 13px", cursor:"pointer", display:"flex", alignItems:"center", gap:"6px", transition:"all 0.1s" }}
                    onMouseEnter={e => { e.currentTarget.style.background=s.color+"35"; e.currentTarget.style.borderColor=s.color; }}
                    onMouseLeave={e => { e.currentTarget.style.background=s.color+"18"; e.currentTarget.style.borderColor=s.color+"60"; }}>
                    <span style={{ fontFamily:"monospace", fontWeight:800, fontSize:"13px", color:s.color }}>{s.code}</span>
                    <span style={{ fontSize:"12px", color:C.textMuted }}>{s.name}</span>
                    <span style={{ fontSize:"10px", color:s.isAddon?C.success:C.red, background:s.isAddon?"#f0fdf4":"#fff0f0", border:`1px solid ${s.isAddon?"#86efac":"#fca5a5"}`, borderRadius:"4px", padding:"1px 5px" }}>
                      {s.isAddon ? "addon" : "replaces"}
                    </span>
                  </button>
                ))}
                <button onClick={() => setCreatingNew(true)}
                  style={{ background:"#f0fbf4", color:C.success, border:"1.5px dashed #86efac", borderRadius:"8px", padding:"7px 13px", cursor:"pointer", fontWeight:700, fontSize:"12px", display:"flex", alignItems:"center", gap:"5px" }}>
                  <Sparkles size={12}/> Create New
                </button>
              </div>
            </div>
          )}

          {/* Save */}
          <button onClick={handleSave} disabled={saving}
            style={{ width:"100%", background:`linear-gradient(135deg,${C.navy},${C.navyLight})`, color:C.white, border:"none", borderRadius:"12px", padding:"15px", fontSize:"16px", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", opacity:saving?0.7:1 }}>
            <CheckCircle size={18}/> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}