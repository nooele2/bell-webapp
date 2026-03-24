import { useState, useMemo, useEffect, useRef } from "react";
import { Plus, Trash2, X, RefreshCw, ArrowUp, ArrowDown, ArrowUpDown, Filter, ChevronDown, Check, Settings, Pencil } from "lucide-react";
import CodeBadge from "./CodeBadge";
import { C } from "../constants/theme";
import { todayStr, getSchColor } from "../utils/scheduleUtils";
import { createTableRow, updateTableRow, deleteTableRow, getSchoolYears, createSchoolYear, deleteSchoolYear, updateSchoolYear } from "../services/api";

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function formatDateShort(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" });
}

function getCurrentYearLabel(years) {
  const today = todayStr();
  return years.find(y => today >= y.from && today <= y.to)?.label || years[0]?.label || "";
}

export default function TableView({ schedules, tableRows, onReload }) {
  const TODAY      = todayStr();
  const normalCode = schedules.find(s => s.isNormal)?.code || "";

  // ── School years ─────────────────────────────────────────────────────────
  const [schoolYears,   setSchoolYears]   = useState([]);
  const [yearsLoading,  setYearsLoading]  = useState(true);
  const [activeYear,    setActiveYear]    = useState("");

  // ── Manage Years modal ───────────────────────────────────────────────────
  const [showManage,    setShowManage]    = useState(false);
  const [editingYearId, setEditingYearId] = useState(null);
  const [editYearForm,  setEditYearForm]  = useState({ label:"", from:"", to:"" });
  const [yearSaving,    setYearSaving]    = useState(false);
  const [yearError,     setYearError]     = useState("");

  // ── Create New Year modal ────────────────────────────────────────────────
  const [showCreate,    setShowCreate]    = useState(false);
  const [newYear,       setNewYear]       = useState({ label:"", from:"", to:"" });
  const [copyMode,      setCopyMode]      = useState("empty"); // "empty" | "copy"
  const [copyFromLabel, setCopyFromLabel] = useState("");
  const [createSaving,  setCreateSaving]  = useState(false);
  const [createError,   setCreateError]   = useState("");

  // ── Inline add / edit ────────────────────────────────────────────────────
  const [adding,    setAdding]    = useState(false);
  const [newRow,    setNewRow]    = useState({ code: normalCode, from:"", to:"", comment:"" });
  const [saving,    setSaving]    = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm,  setEditForm]  = useState({});

  // ── Sort & filter ────────────────────────────────────────────────────────
  const [filterCode,  setFilterCode]  = useState("");
  const [filterType,  setFilterType]  = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [sortKey,     setSortKey]     = useState("date_asc");

  // ── Auto-fill recurring ──────────────────────────────────────────────────
  const [showRecur,   setShowRecur]   = useState(false);
  const [recur,       setRecur]       = useState({ code:"", dow:"2", from:"", to:"", comment:"" });
  const [recurError,  setRecurError]  = useState("");
  const [recurSaving, setRecurSaving] = useState(false);

  // ── Styles ───────────────────────────────────────────────────────────────
  const inputStyle = { padding:"6px 8px", borderRadius:"6px", border:`1.5px solid ${C.navyLight}40`, fontSize:"12px", background:C.white, boxSizing:"border-box", width:"100%", outline:"none" };
  const modalInput = { padding:"9px 11px", borderRadius:"8px", border:`1.5px solid ${C.navyLight}40`, fontSize:"14px", background:C.white, boxSizing:"border-box", width:"100%", outline:"none" };
  const colStyle   = { fontSize:"11px", fontWeight:700, color:C.textMuted, letterSpacing:"0.07em", textTransform:"uppercase" };
  const grid       = { display:"grid", gridTemplateColumns:"100px 110px 110px 1fr auto", padding:"8px 16px", alignItems:"center", gap:"8px" };

  // ── Load school years ─────────────────────────────────────────────────────
  useEffect(() => { loadYears(); }, []);

  const loadYears = async () => {
    setYearsLoading(true);
    try {
      const years = await getSchoolYears();
      setSchoolYears(years);
      if (!activeYear && years.length > 0) setActiveYear(getCurrentYearLabel(years));
      if (years.length > 0) setCopyFromLabel(years[0]?.label || "");
    } catch(e) { console.error(e); }
    finally { setYearsLoading(false); }
  };

  // ── Data for current year ─────────────────────────────────────────────────
  const yearRange = schoolYears.find(y => y.label === activeYear);
  const yearRows  = useMemo(() => {
    if (!yearRange) return tableRows;
    return tableRows.filter(r => r.from >= yearRange.from && r.from <= yearRange.to);
  }, [tableRows, yearRange, activeYear]);

  const getRowsForYear = (label) => {
    const yr = schoolYears.find(y => y.label === label);
    if (!yr) return [];
    return tableRows.filter(r => r.from >= yr.from && r.from <= yr.to);
  };

  const uniqueCodes  = useMemo(() => [...new Set(yearRows.map(r => r.code))].sort(), [yearRows]);
  const uniqueMonths = useMemo(() => {
    const seen = new Set();
    yearRows.forEach(r => { if (r.from) seen.add(r.from.slice(0,7)); });
    return [...seen].sort();
  }, [yearRows]);

  const visibleRows = useMemo(() => {
    let rows = [...yearRows];
    if (filterCode)              rows = rows.filter(r => r.code === filterCode);
    if (filterType === "single") rows = rows.filter(r => !r.to);
    if (filterType === "range")  rows = rows.filter(r => !!r.to);
    if (filterMonth)             rows = rows.filter(r => r.from.slice(0,7) === filterMonth);
    if      (sortKey === "date_asc")   rows.sort((a,b) =>  a.from.localeCompare(b.from));
    else if (sortKey === "date_desc")  rows.sort((a,b) =>  b.from.localeCompare(a.from));
    else if (sortKey === "added_desc") rows.sort((a,b) => (b.id||0) - (a.id||0));
    else if (sortKey === "added_asc")  rows.sort((a,b) => (a.id||0) - (b.id||0));
    return rows;
  }, [yearRows, filterCode, filterType, filterMonth, sortKey]);

  const activeFilters  = (filterCode ? 1 : 0) + (filterType ? 1 : 0) + (filterMonth ? 1 : 0);
  const currentLabel   = getCurrentYearLabel(schoolYears);
  const isCurrentYear  = activeYear === currentLabel;

  // ── Auto-fill label from dates ────────────────────────────────────────────
  const handleNewYearDateChange = (field, value) => {
    const updated = { ...newYear, [field]: value };
    if (updated.from && updated.to) {
      const fy = updated.from.slice(0,4), ty = updated.to.slice(0,4);
      if (fy !== ty) updated.label = `${fy}/${ty}`;
    }
    setNewYear(updated);
  };

  // ── Create Year ───────────────────────────────────────────────────────────
  const handleCreateYear = async () => {
    setCreateError("");
    if (!newYear.label || !newYear.from || !newYear.to) { setCreateError("All fields are required"); return; }
    if (newYear.from >= newYear.to) { setCreateError("End date must be after start date"); return; }
    if (schoolYears.find(y => y.label === newYear.label)) { setCreateError("Academic year already exists"); return; }
    setCreateSaving(true);
    try {
      await createSchoolYear({ label: newYear.label, from: newYear.from, to: newYear.to });

      // Copy rows if selected
      if (copyMode === "copy" && copyFromLabel) {
        const srcYear = schoolYears.find(y => y.label === copyFromLabel);
        const destFrom = new Date(newYear.from + "T00:00:00");
        const srcFrom  = new Date(srcYear.from  + "T00:00:00");
        const diff = Math.round((destFrom - srcFrom) / 86400000);
        const rows = getRowsForYear(copyFromLabel);
        for (const row of rows) {
          const nf = new Date(row.from + "T00:00:00"); nf.setDate(nf.getDate() + diff);
          const nt = row.to ? new Date(row.to + "T00:00:00") : null; if (nt) nt.setDate(nt.getDate() + diff);
          await createTableRow({ code: row.code, from: nf.toISOString().slice(0,10), to: nt ? nt.toISOString().slice(0,10) : "", comment: row.comment });
        }
        await onReload();
      }

      await loadYears();
      setActiveYear(newYear.label);
      setShowCreate(false);
      setNewYear({ label:"", from:"", to:"" });
      setCopyMode("empty");
    } catch(e) {
      setCreateError(e.message || "Failed to create year");
    } finally {
      setCreateSaving(false);
    }
  };

  // ── Edit Year (inline in Manage modal) ───────────────────────────────────
  const startEditYear = (yr) => {
    setEditingYearId(yr.id);
    setEditYearForm({ label: yr.label, from: yr.from, to: yr.to });
    setYearError("");
  };

  const saveEditYear = async (id) => {
    setYearError("");
    if (!editYearForm.label || !editYearForm.from || !editYearForm.to) { setYearError("All fields required"); return; }
    if (editYearForm.from >= editYearForm.to) { setYearError("End must be after start"); return; }
    setYearSaving(true);
    try {
      await updateSchoolYear(id, { label: editYearForm.label, from: editYearForm.from, to: editYearForm.to });
      await loadYears();
      if (activeYear === schoolYears.find(y => y.id === id)?.label) setActiveYear(editYearForm.label);
      setEditingYearId(null);
    } catch(e) {
      setYearError(e.message || "Failed to save");
    } finally {
      setYearSaving(false);
    }
  };

  const handleDeleteYear = async (yr) => {
    if (!confirm(`Delete "${yr.label}"? This does NOT delete the schedule entries inside it.`)) return;
    try {
      await deleteSchoolYear(yr.id);
      await loadYears();
      if (activeYear === yr.label) setActiveYear(schoolYears.find(y => y.id !== yr.id)?.label || "");
    } catch(e) { alert("Failed: " + e.message); }
  };

  // ── Table CRUD ────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newRow.from) return;
    setSaving(true);
    try { await createTableRow(newRow); await onReload(); setAdding(false); setNewRow({ code:normalCode, from:"", to:"", comment:"" }); }
    catch(e) { alert("Failed: " + e.message); }
    finally { setSaving(false); }
  };

  const startEdit = (row) => { setEditingId(row.id); setEditForm({ code:row.code, from:row.from, to:row.to||"", comment:row.comment||"" }); };

  const saveEdit = async (id) => {
    setSaving(true);
    try { await updateTableRow(id, editForm); await onReload(); setEditingId(null); }
    catch(e) { alert("Failed: " + e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this row?")) return;
    try { await deleteTableRow(id); await onReload(); }
    catch(e) { alert("Failed: " + e.message); }
  };

  // ── Auto-fill recurring ───────────────────────────────────────────────────
  const generateRecurring = async () => {
    setRecurError("");
    if (!recur.code || !recur.from || !recur.to) { setRecurError("Fill in all fields"); return; }
    const dow = parseInt(recur.dow, 10);
    const dates = [];
    const cur = new Date(recur.from + "T00:00:00");
    const end = new Date(recur.to   + "T00:00:00");
    while (cur <= end) { if (cur.getDay() === dow) dates.push(cur.toISOString().slice(0,10)); cur.setDate(cur.getDate()+1); }
    if (dates.length === 0) { setRecurError("No matching dates in range"); return; }
    setRecurSaving(true);
    try { for (const d of dates) await createTableRow({ code:recur.code, from:d, to:"", comment:recur.comment }); await onReload(); setShowRecur(false); }
    catch(e) { alert("Failed: " + e.message); }
    finally { setRecurSaving(false); }
  };

  // ── Sort button ───────────────────────────────────────────────────────────
  const SortBtn = ({ label, asc, desc }) => {
    const isAsc = sortKey === asc, isDesc = sortKey === desc, active = isAsc || isDesc;
    return (
      <button onClick={() => setSortKey(isAsc ? desc : asc)}
        style={{ display:"flex", alignItems:"center", gap:"4px", padding:"6px 11px", borderRadius:"7px", border:`1.5px solid ${active?C.navyLight+"60":C.border}`, background:active?"#eef3fc":C.white, color:active?C.navyLight:C.textMuted, fontSize:"12px", fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
        {isAsc ? <ArrowUp size={12}/> : isDesc ? <ArrowDown size={12}/> : <ArrowUpDown size={12}/>}
        {label}
      </button>
    );
  };

  if (yearsLoading) return <div style={{ padding:"40px", textAlign:"center", color:C.textMuted }}>Loading…</div>;

  // ── Radio option style ────────────────────────────────────────────────────
  const radioBox = (selected) => ({
    display:"flex", alignItems:"center", gap:"10px", padding:"12px 14px", borderRadius:"9px",
    border:`1.5px solid ${selected ? C.navyLight : C.border}`,
    background: selected ? "#eef3fc" : C.white,
    cursor:"pointer", transition:"all 0.15s"
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

      {/* ════════════════════════════════════════
          MANAGE YEARS MODAL
      ════════════════════════════════════════ */}
      {showManage && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,25,50,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
          <div style={{ background:C.white, borderRadius:"16px", width:"520px", maxWidth:"95vw", boxShadow:"0 24px 64px rgba(26,58,107,0.28)", overflow:"hidden", maxHeight:"85vh", display:"flex", flexDirection:"column" }}>
            <div style={{ height:"3px", background:`linear-gradient(90deg,${C.navy},${C.red})`, flexShrink:0 }}/>
            <div style={{ padding:"22px 26px 0", flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"18px" }}>
                <div style={{ fontSize:"18px", fontWeight:800, color:C.navy }}>Manage Academic Years</div>
                <button onClick={() => { setShowManage(false); setEditingYearId(null); setYearError(""); }}
                  style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted, display:"flex", alignItems:"center" }}>
                  <X size={18}/>
                </button>
              </div>
            </div>

            {/* Year list */}
            <div style={{ overflowY:"auto", padding:"0 26px" }}>
              {schoolYears.map((yr) => {
                const isCurrent  = yr.label === currentLabel;
                const isEditing  = editingYearId === yr.id;
                const entryCount = getRowsForYear(yr.label).length;

                if (isEditing) return (
                  <div key={yr.id} style={{ background:"#eef3fc", borderRadius:"10px", padding:"14px", marginBottom:"8px", border:`1.5px solid ${C.navyLight}40` }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px", marginBottom:"10px" }}>
                      <div>
                        <label style={{ fontSize:"10px", fontWeight:700, color:C.textMuted, display:"block", marginBottom:"4px", textTransform:"uppercase" }}>Label</label>
                        <input value={editYearForm.label} onChange={e=>setEditYearForm(p=>({...p,label:e.target.value}))} style={inputStyle} placeholder="2026/2027"/>
                      </div>
                      <div>
                        <label style={{ fontSize:"10px", fontWeight:700, color:C.textMuted, display:"block", marginBottom:"4px", textTransform:"uppercase" }}>Start</label>
                        <input type="date" value={editYearForm.from} onChange={e=>setEditYearForm(p=>({...p,from:e.target.value}))} style={inputStyle}/>
                      </div>
                      <div>
                        <label style={{ fontSize:"10px", fontWeight:700, color:C.textMuted, display:"block", marginBottom:"4px", textTransform:"uppercase" }}>End</label>
                        <input type="date" value={editYearForm.to} onChange={e=>setEditYearForm(p=>({...p,to:e.target.value}))} style={inputStyle}/>
                      </div>
                    </div>
                    {yearError && <div style={{ fontSize:"12px", color:"#dc2626", marginBottom:"8px" }}>{yearError}</div>}
                    <div style={{ display:"flex", gap:"6px" }}>
                      <button onClick={() => saveEditYear(yr.id)} disabled={yearSaving}
                        style={{ display:"flex", alignItems:"center", gap:"5px", background:C.navy, color:C.white, border:"none", borderRadius:"7px", padding:"7px 14px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
                        <Check size={12}/> {yearSaving ? "Saving…" : "Save"}
                      </button>
                      <button onClick={() => { setEditingYearId(null); setYearError(""); }}
                        style={{ background:C.offwhite, border:`1px solid ${C.border}`, borderRadius:"7px", padding:"7px 12px", fontSize:"12px", cursor:"pointer", color:C.textMuted }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                );

                return (
                  <div key={yr.id} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"12px 14px", borderRadius:"10px", border:`1px solid ${C.border}`, marginBottom:"8px", background:C.white }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                        <span style={{ fontSize:"15px", fontWeight:700, color:C.navy }}>{yr.label}</span>
                        {isCurrent && <span style={{ fontSize:"10px", background:"#eef3fc", color:C.navyLight, border:`1px solid ${C.navyLight}40`, padding:"1px 7px", borderRadius:"4px", fontWeight:700 }}>Current</span>}
                      </div>
                      <div style={{ fontSize:"12px", color:C.textMuted, marginTop:"2px" }}>
                        {formatDateShort(yr.from)} – {formatDateShort(yr.to)} · {entryCount} entries
                      </div>
                    </div>
                    <button onClick={() => startEditYear(yr)}
                      style={{ width:"30px", height:"30px", display:"flex", alignItems:"center", justifyContent:"center", background:"#eef3fc", border:`1px solid ${C.navyLight}30`, borderRadius:"7px", cursor:"pointer", color:C.navyLight, flexShrink:0 }}>
                      <Pencil size={13}/>
                    </button>
                    <button onClick={() => handleDeleteYear(yr)}
                      style={{ width:"30px", height:"30px", display:"flex", alignItems:"center", justifyContent:"center", background:"#fdf2f2", border:`1px solid #fca5a5`, borderRadius:"7px", cursor:"pointer", color:"#dc2626", flexShrink:0 }}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Create New Year button at bottom */}
            <div style={{ padding:"16px 26px 22px", flexShrink:0 }}>
              <button onClick={() => { setShowManage(false); setShowCreate(true); }}
                style={{ width:"100%", background:C.navy, color:C.white, border:"none", borderRadius:"9px", padding:"12px", fontWeight:700, fontSize:"14px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
                <Plus size={15}/> Create New Year
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          CREATE NEW YEAR MODAL
      ════════════════════════════════════════ */}
      {showCreate && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,25,50,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
          <div style={{ background:C.white, borderRadius:"16px", width:"420px", maxWidth:"95vw", boxShadow:"0 24px 64px rgba(26,58,107,0.28)", overflow:"hidden" }}>
            <div style={{ height:"3px", background:`linear-gradient(90deg,${C.navy},${C.red})` }}/>
            <div style={{ padding:"24px 28px 22px" }}>
              <div style={{ fontSize:"18px", fontWeight:800, color:C.navy, marginBottom:"20px" }}>Create Academic Year</div>

              <div style={{ display:"flex", flexDirection:"column", gap:"14px", marginBottom:"20px" }}>
                <div>
                  <label style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, display:"block", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Academic Year</label>
                  <input value={newYear.label} onChange={e=>setNewYear(p=>({...p,label:e.target.value}))} placeholder="e.g. 2026/2027" style={modalInput}/>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                  <div>
                    <label style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, display:"block", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Start Date</label>
                    <input type="date" value={newYear.from} onChange={e=>handleNewYearDateChange('from', e.target.value)} style={modalInput}/>
                  </div>
                  <div>
                    <label style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, display:"block", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.05em" }}>End Date</label>
                    <input type="date" value={newYear.to} onChange={e=>handleNewYearDateChange('to', e.target.value)} style={modalInput}/>
                  </div>
                </div>

                {/* Starting data options */}
                <div>
                  <label style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, display:"block", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Starting Data</label>
                  <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                    <div style={radioBox(copyMode === "empty")} onClick={() => setCopyMode("empty")}>
                      <div style={{ width:"16px", height:"16px", borderRadius:"50%", border:`2px solid ${copyMode==="empty"?C.navy:C.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        {copyMode === "empty" && <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:C.navy }}/>}
                      </div>
                      <div>
                        <div style={{ fontSize:"13px", fontWeight:600, color:C.navy }}>Start empty</div>
                        <div style={{ fontSize:"11px", color:C.textMuted }}>New blank schedule — add entries manually</div>
                      </div>
                    </div>

                    <div style={radioBox(copyMode === "copy")} onClick={() => setCopyMode("copy")}>
                      <div style={{ width:"16px", height:"16px", borderRadius:"50%", border:`2px solid ${copyMode==="copy"?C.navy:C.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        {copyMode === "copy" && <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:C.navy }}/>}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:"13px", fontWeight:600, color:C.navy }}>Copy from</div>
                        <div style={{ fontSize:"11px", color:C.textMuted, marginBottom:"6px" }}>Shift all entries from another year</div>
                        {copyMode === "copy" && (
                          <select value={copyFromLabel} onChange={e=>setCopyFromLabel(e.target.value)}
                            style={{ ...modalInput, fontSize:"13px", padding:"6px 10px" }}
                            onClick={e=>e.stopPropagation()}>
                            {schoolYears.map(y => (
                              <option key={y.label} value={y.label}>{y.label} ({getRowsForYear(y.label).length} entries)</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {createError && (
                <div style={{ background:"#fdf2f2", border:`1px solid #f5c6c6`, borderRadius:"8px", padding:"10px 14px", fontSize:"13px", color:"#dc2626", marginBottom:"14px" }}>
                  {createError}
                </div>
              )}

              <div style={{ display:"flex", gap:"10px" }}>
                <button onClick={() => { setShowCreate(false); setCreateError(""); setNewYear({ label:"", from:"", to:"" }); setCopyMode("empty"); }}
                  style={{ flex:1, background:C.offwhite, border:`1px solid ${C.border}`, borderRadius:"9px", padding:"11px", cursor:"pointer", color:C.textMuted, fontWeight:600, fontSize:"14px" }}>
                  Cancel
                </button>
                <button onClick={handleCreateYear} disabled={createSaving}
                  style={{ flex:2, background:C.navy, color:C.white, border:"none", borderRadius:"9px", padding:"11px", fontWeight:700, fontSize:"14px", cursor:"pointer" }}>
                  {createSaving ? "Creating…" : "Create Year"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Auto-fill recurring modal ── */}
      {showRecur && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,25,50,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
          <div style={{ background:C.white, borderRadius:"14px", padding:"28px 32px", width:"400px", boxShadow:"0 20px 60px rgba(26,58,107,0.25)" }}>
            <div style={{ fontSize:"17px", fontWeight:800, color:C.navy, marginBottom:"4px" }}>Auto-Fill Recurring</div>
            <div style={{ fontSize:"13px", color:C.textMuted, marginBottom:"20px" }}>Assign a code to every matching weekday in a date range</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"4px", marginBottom:"10px" }}>
              {schedules.filter(s=>!s.isNormal).map(s=>(
                <span key={s.code} onClick={()=>setRecur(r=>({...r,code:s.code}))}
                  style={{ cursor:"pointer", background:recur.code===s.code?s.color:s.color+"20", border:`1px solid ${s.color}`, color:recur.code===s.code?"white":s.color, borderRadius:"5px", padding:"2px 9px", fontSize:"12px", fontWeight:700, fontFamily:"monospace" }}>
                  {s.code}
                </span>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"12px" }}>
              <div><label style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, display:"block", marginBottom:"4px" }}>CODE</label>
                <input value={recur.code} onChange={e=>{setRecur(r=>({...r,code:e.target.value.toUpperCase()}));setRecurError("");}} style={{...modalInput,fontFamily:"monospace",fontWeight:700}} placeholder="e.g. C+"/></div>
              <div><label style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, display:"block", marginBottom:"4px" }}>DAY OF WEEK</label>
                <select value={recur.dow} onChange={e=>setRecur(r=>({...r,dow:e.target.value}))} style={modalInput}>{DAYS.map((d,i)=><option key={i} value={i}>{d}</option>)}</select></div>
              <div><label style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, display:"block", marginBottom:"4px" }}>FROM</label>
                <input type="date" value={recur.from} onChange={e=>setRecur(r=>({...r,from:e.target.value}))} style={modalInput}/></div>
              <div><label style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, display:"block", marginBottom:"4px" }}>TO</label>
                <input type="date" value={recur.to} onChange={e=>setRecur(r=>({...r,to:e.target.value}))} style={modalInput}/></div>
            </div>
            <div style={{ marginBottom:"12px" }}>
              <label style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, display:"block", marginBottom:"4px" }}>COMMENT (optional)</label>
              <input value={recur.comment} onChange={e=>setRecur(r=>({...r,comment:e.target.value}))} placeholder="e.g. Chapel bell" style={modalInput}/>
            </div>
            {recurError && <div style={{ fontSize:"12px", color:"#dc2626", marginBottom:"10px" }}>{recurError}</div>}
            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={generateRecurring} disabled={recurSaving} style={{ flex:1, background:C.navy, color:C.white, border:"none", borderRadius:"8px", padding:"11px", fontWeight:700, fontSize:"14px", cursor:"pointer" }}>
                {recurSaving ? "Generating…" : "Generate Rows"}
              </button>
              <button onClick={()=>{setShowRecur(false);setRecurError("");}} style={{ background:C.offwhite, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"11px 16px", cursor:"pointer", color:C.textMuted }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Title row ── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>
            <div style={{ fontSize:"20px", fontWeight:800, color:C.navy }}>
              {activeYear} Academic Year Schedule
            </div>
            {isCurrentYear && (
              <span style={{ fontSize:"11px", background:"#eef3fc", color:C.navyLight, border:`1px solid ${C.navyLight}40`, padding:"2px 8px", borderRadius:"4px", fontWeight:700 }}>Current</span>
            )}
          </div>
          {/* Year dropdown + settings gear */}
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginTop:"8px" }}>
            <span style={{ fontSize:"12px", fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.05em" }}>Year:</span>
            <div style={{ position:"relative", display:"inline-flex", alignItems:"center" }}>
              <select value={activeYear}
                onChange={e => { setActiveYear(e.target.value); setFilterCode(""); setFilterType(""); setFilterMonth(""); setSortKey("date_asc"); }}
                style={{ appearance:"none", padding:"5px 28px 5px 10px", borderRadius:"7px", border:`1.5px solid ${C.navyLight}50`, fontSize:"13px", background:"#eef3fc", color:C.navyLight, fontWeight:700, outline:"none", cursor:"pointer" }}>
                {schoolYears.map(y => <option key={y.label} value={y.label}>{y.label}</option>)}
              </select>
              <ChevronDown size={13} color={C.navyLight} style={{ position:"absolute", right:"8px", pointerEvents:"none" }}/>
            </div>
            {/* ⚙️ Manage Years */}
            <button onClick={() => { setEditingYearId(null); setYearError(""); setShowManage(true); }}
              title="Manage Academic Years"
              style={{ width:"28px", height:"28px", display:"flex", alignItems:"center", justifyContent:"center", background:C.offwhite, border:`1px solid ${C.border}`, borderRadius:"7px", cursor:"pointer", color:C.textMuted }}>
              <Settings size={14}/>
            </button>
            <span style={{ fontSize:"12px", color:C.textMuted }}>{yearRows.length} entries</span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", alignItems:"center" }}>
          <button onClick={() => setShowRecur(true)}
            style={{ background:"#f0fbf4", color:C.success, border:"1.5px solid #86efac", borderRadius:"10px", padding:"10px 16px", fontSize:"13px", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:"6px" }}>
            <RefreshCw size={13}/> Auto-Fill Recurring
          </button>
          <button onClick={() => setAdding(true)}
            style={{ background:C.navy, color:C.white, border:"none", borderRadius:"10px", padding:"10px 18px", fontSize:"14px", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:"6px" }}>
            <Plus size={15}/> Add Row
          </button>
        </div>
      </div>

      {/* ── Sort & Filter bar ── */}
      <div style={{ background:C.white, borderRadius:"10px", border:`1px solid ${C.border}`, padding:"12px 16px", display:"flex", gap:"10px", flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"5px", color:activeFilters > 0 ? C.navyLight : C.textMuted }}>
          <Filter size={13}/>
          <span style={{ fontSize:"12px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em" }}>Filter</span>
          {activeFilters > 0 && <span style={{ background:C.navyLight, color:C.white, borderRadius:"10px", fontSize:"10px", padding:"1px 6px", fontWeight:800 }}>{activeFilters}</span>}
        </div>
        <select value={filterCode} onChange={e => setFilterCode(e.target.value)}
          style={{ padding:"6px 10px", borderRadius:"7px", border:`1.5px solid ${filterCode?C.navyLight+"60":C.border}`, fontSize:"12px", background:filterCode?"#eef3fc":C.white, color:filterCode?C.navyLight:C.textMuted, fontWeight:700, outline:"none", cursor:"pointer" }}>
          <option value="">All Codes</option>
          {uniqueCodes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ padding:"6px 10px", borderRadius:"7px", border:`1.5px solid ${filterType?C.navyLight+"60":C.border}`, fontSize:"12px", background:filterType?"#eef3fc":C.white, color:filterType?C.navyLight:C.textMuted, fontWeight:700, outline:"none", cursor:"pointer" }}>
          <option value="">All Types</option>
          <option value="single">Single-day only</option>
          <option value="range">Ranges only</option>
        </select>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          style={{ padding:"6px 10px", borderRadius:"7px", border:`1.5px solid ${filterMonth?C.navyLight+"60":C.border}`, fontSize:"12px", background:filterMonth?"#eef3fc":C.white, color:filterMonth?C.navyLight:C.textMuted, fontWeight:700, outline:"none", cursor:"pointer" }}>
          <option value="">All Months</option>
          {uniqueMonths.map(m => {
            const [yr, mo] = m.split("-");
            const label = new Date(Number(yr), Number(mo)-1, 1).toLocaleString("default", { month:"long", year:"numeric" });
            return <option key={m} value={m}>{label}</option>;
          })}
        </select>
        <div style={{ width:"1px", height:"20px", background:C.border }}/>
        <span style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.05em" }}>Sort</span>
        <SortBtn label="Date"           asc="date_asc"  desc="date_desc"/>
        <SortBtn label="Recently Added" asc="added_asc" desc="added_desc"/>
        {(filterCode || filterType || filterMonth || sortKey !== "date_asc") && (
          <button onClick={() => { setFilterCode(""); setFilterType(""); setFilterMonth(""); setSortKey("date_asc"); }}
            style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", fontSize:"12px", color:C.textMuted, display:"flex", alignItems:"center", gap:"4px", fontWeight:600 }}>
            <X size={12}/> Clear
          </button>
        )}
        <span style={{ marginLeft:(filterCode||filterType||filterMonth||sortKey!=="date_asc")?"0":"auto", fontSize:"12px", color:C.textLight, fontWeight:600 }}>
          {visibleRows.length} of {yearRows.length}
        </span>
      </div>

      {/* ── Table ── */}
      <div style={{ background:C.white, borderRadius:"14px", border:`1px solid ${C.border}`, overflow:"hidden" }}>
        <div style={{ height:"3px", background:`linear-gradient(90deg,${C.navy},${C.red})` }}/>
        <div style={{ ...grid, background:C.offwhite, borderBottom:`2px solid ${C.border}` }}>
          <div style={colStyle}>Code</div>
          <div style={colStyle}>From</div>
          <div style={colStyle}>To</div>
          <div style={colStyle}>Comment</div>
          <div style={{ width:"32px" }}/>
        </div>

        {adding && (
          <div style={{ ...grid, background:"#eef3fc", borderBottom:`1px solid #c5d8f5` }}>
            <select value={newRow.code} onChange={e=>setNewRow(p=>({...p,code:e.target.value}))} style={{...inputStyle,fontFamily:"monospace",fontWeight:700}}>
              {schedules.map(s=><option key={s.id} value={s.code}>{s.code} — {s.name}</option>)}
            </select>
            <input type="date" value={newRow.from} onChange={e=>setNewRow(p=>({...p,from:e.target.value}))} style={inputStyle}/>
            <input type="date" value={newRow.to}   onChange={e=>setNewRow(p=>({...p,to:e.target.value}))}   style={inputStyle}/>
            <input placeholder="Comment" value={newRow.comment} onChange={e=>setNewRow(p=>({...p,comment:e.target.value}))} style={inputStyle}
              onKeyDown={e=>{ if(e.key==="Enter") handleAdd(); if(e.key==="Escape") setAdding(false); }}/>
            <div style={{ display:"flex", gap:"4px", justifyContent:"flex-end" }}>
              <button onClick={handleAdd} disabled={saving}
                style={{ width:"28px", height:"28px", display:"flex", alignItems:"center", justifyContent:"center", background:C.navy, color:C.white, border:"none", borderRadius:"6px", cursor:"pointer", flexShrink:0 }}>
                {saving ? "…" : <Check size={13}/>}
              </button>
              <button onClick={()=>setAdding(false)}
                style={{ width:"28px", height:"28px", display:"flex", alignItems:"center", justifyContent:"center", background:C.offwhite, border:`1px solid ${C.border}`, borderRadius:"6px", cursor:"pointer", flexShrink:0 }}>
                <X size={12}/>
              </button>
            </div>
          </div>
        )}

        {visibleRows.map((row, i) => {
          const isEditing = editingId === row.id;
          const color     = getSchColor(row.code, schedules);
          const isToday   = row.from === TODAY && !row.to;

          if (isEditing) return (
            <div key={row.id} style={{ ...grid, background:"#eef3fc", borderBottom:`1px solid #c5d8f5` }}>
              <select value={editForm.code} onChange={e=>setEditForm(p=>({...p,code:e.target.value}))} style={{...inputStyle,fontFamily:"monospace",fontWeight:700}}>
                {schedules.map(s=><option key={s.id} value={s.code}>{s.code} — {s.name}</option>)}
              </select>
              <input type="date" value={editForm.from} onChange={e=>setEditForm(p=>({...p,from:e.target.value}))} style={inputStyle}/>
              <input type="date" value={editForm.to}   onChange={e=>setEditForm(p=>({...p,to:e.target.value}))}   style={inputStyle}/>
              <input value={editForm.comment} onChange={e=>setEditForm(p=>({...p,comment:e.target.value}))} style={inputStyle}
                onKeyDown={e=>{ if(e.key==="Enter") saveEdit(row.id); if(e.key==="Escape") setEditingId(null); }} placeholder="Comment"/>
              <div style={{ display:"flex", gap:"4px", justifyContent:"flex-end" }}>
                <button onClick={()=>saveEdit(row.id)} disabled={saving}
                  style={{ width:"28px", height:"28px", display:"flex", alignItems:"center", justifyContent:"center", background:C.navy, color:C.white, border:"none", borderRadius:"6px", cursor:"pointer", flexShrink:0 }}>
                  {saving ? "…" : <Check size={13}/>}
                </button>
                <button onClick={()=>setEditingId(null)}
                  style={{ width:"28px", height:"28px", display:"flex", alignItems:"center", justifyContent:"center", background:C.offwhite, border:`1px solid ${C.border}`, borderRadius:"6px", cursor:"pointer", flexShrink:0 }}>
                  <X size={12}/>
                </button>
              </div>
            </div>
          );

          return (
            <div key={row.id} onClick={() => startEdit(row)}
              style={{ ...grid, borderBottom:i<visibleRows.length-1?`1px solid ${C.border}`:"none", background:isToday?"#fff8f0":"transparent", cursor:"pointer", transition:"background 0.1s" }}
              onMouseEnter={e=>e.currentTarget.style.background=isToday?"#ffefe0":C.offwhite}
              onMouseLeave={e=>e.currentTarget.style.background=isToday?"#fff8f0":"transparent"}>
              <div style={{ display:"flex", alignItems:"center", gap:"6px", flexWrap:"wrap" }}>
                <CodeBadge code={row.code} color={color}/>
                {isToday && <span style={{ fontSize:"10px", background:"#fdf2f2", color:"#dc2626", border:`1px solid #f5c6c6`, padding:"1px 5px", borderRadius:"4px", fontWeight:700 }}>Today</span>}
              </div>
              <div style={{ fontSize:"13px", color:C.text, fontFamily:"monospace" }}>{row.from}</div>
              <div style={{ fontSize:"13px", color:row.to?C.text:C.textLight, fontFamily:"monospace" }}>{row.to||"—"}</div>
              <div style={{ fontSize:"13px", color:C.textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.comment}</div>
              <button onClick={e=>{ e.stopPropagation(); handleDelete(row.id); }}
                style={{ width:"28px", height:"28px", display:"flex", alignItems:"center", justifyContent:"center", background:"none", border:`1px solid #fca5a5`, borderRadius:"6px", cursor:"pointer", color:"#dc2626", flexShrink:0 }}>
                <Trash2 size={12}/>
              </button>
            </div>
          );
        })}

        {visibleRows.length === 0 && !adding && (
          <div style={{ padding:"40px", textAlign:"center", color:C.textLight, fontSize:"14px" }}>
            {yearRows.length === 0
              ? `No entries for ${activeYear} yet — click "Add Row" to get started`
              : "No entries match the current filters"}
          </div>
        )}
      </div>
    </div>
  );
}