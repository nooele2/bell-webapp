import { useState, useEffect } from "react";
import { X, AlertTriangle, RefreshCw, Layers, Plus, Trash2, Bell } from "lucide-react";
import { C, SCHEDULE_COLORS } from "../constants/theme";
import { getRingtoneMappings } from "../services/api";

export default function ScheduleEditor({ schedule, normalSchedule, onSave, onCancel }) {
  // For new schedules, pre-fill with Normal times so user just edits what's different
  const initialTimes = schedule.id
    ? schedule.times.map(t => ({ ...t }))                          // editing existing — keep as-is
    : (normalSchedule?.times || []).map(t => ({ ...t }));          // new — start from Normal

  const [form, setForm] = useState({ ...schedule, times: initialTimes });
  const [showWarn, setShowWarn] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [ringtoneMappings, setRingtoneMappings] = useState({});

  useEffect(() => {
    getRingtoneMappings().then(setRingtoneMappings).catch(() => {});
  }, []);

  const slotOptions = Object.entries(ringtoneMappings)
    .filter(([, f]) => f)
    .sort(([a], [b]) => Number(a) - Number(b));

  const addTime    = () => setForm(f => ({ ...f, times: [...f.times, { time:"", label:"", muted:false }] }));
  const removeTime = idx => setForm(f => ({ ...f, times: f.times.filter((_, i) => i !== idx) }));
  const updateTime = (idx, field, val) =>
    setForm(f => ({ ...f, times: f.times.map((t, i) => i === idx ? { ...t, [field]: val } : t) }));


  const handleSave = async () => {
    if (!form.code?.trim() || !form.name?.trim()) { alert("Code and Name are required"); return; }
    setSaving(true);
    try { await onSave(form); }
    catch (e) { alert("Failed: " + e.message); }
    finally { setSaving(false); }
  };


  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,25,50,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:"20px" }}>
      <div style={{ background:C.white, borderRadius:"16px", width:"100%", maxWidth:"560px", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 25px 60px rgba(26,58,107,0.25)" }}>
        <div style={{ height:"4px", background:`linear-gradient(90deg,${C.navy},${C.red})`, borderRadius:"16px 16px 0 0" }}/>

        {showWarn ? (
          <div style={{ padding:"32px" }}>
            <AlertTriangle size={32} color={C.red} style={{ marginBottom:"12px" }}/>
            <div style={{ fontSize:"18px", fontWeight:800, color:C.navy, marginBottom:"8px" }}>Are you sure?</div>
            <div style={{ fontSize:"14px", color:C.textMuted, marginBottom:"24px", lineHeight:1.6 }}>
              Editing <strong>{form.code} — {form.name}</strong> will affect <strong>all dates</strong> using this code.
            </div>
            <div style={{ display:"flex", gap:"10px" }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex:1, background:C.navy, color:C.white, border:"none", borderRadius:"10px", padding:"12px", fontSize:"15px", fontWeight:700, cursor:"pointer" }}>
                {saving ? "Saving…" : "Yes, save changes"}
              </button>
              <button onClick={() => setShowWarn(false)}
                style={{ flex:1, background:C.offwhite, color:C.text, border:`1px solid ${C.border}`, borderRadius:"10px", padding:"12px", fontSize:"15px", fontWeight:600, cursor:"pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding:"22px 26px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:"18px", fontWeight:800, color:C.navy }}>{schedule.id ? "Edit Schedule" : "New Schedule"}</div>
              <button onClick={onCancel}
                style={{ background:C.offwhite, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"6px 12px", cursor:"pointer", fontSize:"13px", color:C.textMuted, display:"flex", alignItems:"center", gap:"4px" }}>
                <X size={13}/> Cancel
              </button>
            </div>

            <div style={{ padding:"22px 26px", display:"flex", flexDirection:"column", gap:"18px" }}>

              {/* Code + Name */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:"12px" }}>
                <div>
                  <label style={{ fontSize:"11px", fontWeight:700, color:C.text, display:"block", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Code *</label>
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code:e.target.value }))}
                    placeholder="e.g. L, c+"
                    style={{ width:"100%", padding:"10px", borderRadius:"8px", border:`1.5px solid ${C.border}`, fontSize:"15px", fontFamily:"monospace", fontWeight:700, boxSizing:"border-box" }}/>
                </div>
                <div>
                  <label style={{ fontSize:"11px", fontWeight:700, color:C.text, display:"block", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name:e.target.value }))}
                    placeholder="e.g. Late Start"
                    style={{ width:"100%", padding:"10px", borderRadius:"8px", border:`1.5px solid ${C.border}`, fontSize:"14px", boxSizing:"border-box" }}/>
                </div>
              </div>

              {/* Color */}
              <div>
                <label style={{ fontSize:"11px", fontWeight:700, color:C.text, display:"block", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Color</label>
                <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                  {SCHEDULE_COLORS.map(col => (
                    <div key={col} onClick={() => setForm(f => ({ ...f, color:col }))}
                      style={{ width:"28px", height:"28px", borderRadius:"50%", background:col, cursor:"pointer",
                        border: form.color===col ? `3px solid ${C.text}` : "3px solid transparent",
                        transform: form.color===col ? "scale(1.2)" : "scale(1)", transition:"transform 0.15s" }}/>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div>
                <label style={{ fontSize:"11px", fontWeight:700, color:C.text, display:"block", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Type</label>
                <div style={{ display:"flex", gap:"8px" }}>
                  <button onClick={() => setForm(f => ({ ...f, isAddon:false }))}
                    style={{ flex:1, padding:"10px", borderRadius:"8px", border:`1.5px solid ${!form.isAddon?C.navy:C.border}`, background:!form.isAddon?"#eef3fc":C.white, color:!form.isAddon?C.navy:C.textMuted, fontWeight:700, cursor:"pointer", fontSize:"13px", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
                    <RefreshCw size={13}/> Replaces Normal
                  </button>
                  <button onClick={() => setForm(f => ({ ...f, isAddon:true }))}
                    style={{ flex:1, padding:"10px", borderRadius:"8px", border:`1.5px solid ${form.isAddon?C.navy:C.border}`, background:form.isAddon?"#eef3fc":C.white, color:form.isAddon?C.navy:C.textMuted, fontWeight:700, cursor:"pointer", fontSize:"13px", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
                    <Layers size={13}/> Adds to Normal
                  </button>
                </div>
                {/* Explanation */}
                <div style={{ marginTop:"8px", fontSize:"12px", color:C.textMuted, background:C.offwhite, borderRadius:"8px", padding:"9px 12px", lineHeight:1.6 }}>
                  {!form.isAddon
                    ? <><strong>Replaces Normal:</strong> On days with this code, Normal bells are ignored. Define the full schedule below.</>
                    : <><strong>Adds to Normal:</strong> Normal bells still ring. Use this to add extra bells or mute specific Normal bells.</>
                  }
                </div>
              </div>

              {/* Bell Sound Slot */}
              <div>
                <label style={{ fontSize:"11px", fontWeight:700, color:C.text, display:"block", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Bell Sound Slot</label>
                <select
                  value={form.bellSlot ?? 0}
                  onChange={e => setForm(f => ({ ...f, bellSlot: Number(e.target.value) }))}
                  style={{ width:"100%", padding:"10px 12px", borderRadius:"8px", border:`1.5px solid ${C.border}`, fontSize:"14px", background:C.white, color:C.text }}>
                  <option value={0}>Slot 0 — {ringtoneMappings["0"] || "default"} (default)</option>
                  {slotOptions.filter(([s]) => s !== "0").map(([slot, filename]) => (
                    <option key={slot} value={Number(slot)}>Slot {slot} — {filename}</option>
                  ))}
                  {slotOptions.length === 0 && <option disabled>No slots configured — set up in Bell Sounds</option>}
                </select>
              </div>

              {/* Bell Times */}
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px" }}>
                  <label style={{ fontSize:"11px", fontWeight:700, color:C.text, textTransform:"uppercase", letterSpacing:"0.05em" }}>Bell Times</label>
                  <button onClick={addTime}
                    style={{ background:"#f0fbf4", color:C.success, border:"1px solid #86efac", borderRadius:"6px", padding:"5px 10px", fontSize:"12px", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:"4px" }}>
                    <Plus size={11}/> Add
                  </button>
                </div>


                {form.times.length === 0 && (
                  <div style={{ textAlign:"center", padding:"14px", background:C.offwhite, borderRadius:"10px", color:C.textLight, fontSize:"13px" }}>
                    No bell times — date marker only (like Z, X)
                  </div>
                )}

                <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                  {form.times.map((bt, i) => (
                    <div key={i} style={{ display:"grid", gridTemplateColumns:"95px 1fr auto auto", gap:"6px", alignItems:"center", background: bt.muted?"#fff8f8":C.offwhite, borderRadius:"8px", padding:"8px 10px", border: bt.muted?"1px solid #fca5a5":"1px solid transparent" }}>
                      <input type="time" value={bt.time} onChange={e => updateTime(i,"time",e.target.value)}
                        style={{ padding:"6px", borderRadius:"6px", border:`1px solid ${C.border}`, fontSize:"13px", fontFamily:"monospace" }}/>
                      <input value={bt.label} onChange={e => updateTime(i,"label",e.target.value)}
                        placeholder="e.g. 1st period"
                        style={{ padding:"6px 8px", borderRadius:"6px", border:`1px solid ${C.border}`, fontSize:"13px", textDecoration: bt.muted?"line-through":"none", color: bt.muted?C.textMuted:C.text }}/>
                      <label style={{ display:"flex", alignItems:"center", gap:"4px", fontSize:"12px", color: bt.muted?C.danger:C.textMuted, cursor:"pointer", whiteSpace:"nowrap", fontWeight: bt.muted?700:400 }}>
                        <input type="checkbox" checked={bt.muted} onChange={e => updateTime(i,"muted",e.target.checked)}/> Mute
                      </label>
                      <button onClick={() => removeTime(i)}
                        style={{ background:"none", border:`1px solid ${C.dangerBorder}`, borderRadius:"6px", padding:"4px 8px", cursor:"pointer", color:C.danger, display:"flex", alignItems:"center" }}>
                        <Trash2 size={12}/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => schedule.id ? setShowWarn(true) : handleSave()} disabled={saving}
                style={{ background:`linear-gradient(135deg,${C.navy},${C.navyLight})`, color:C.white, border:"none", borderRadius:"10px", padding:"13px", fontSize:"15px", fontWeight:700, cursor:"pointer", opacity:saving?0.7:1 }}>
                {saving ? "Saving…" : "Save Schedule"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}