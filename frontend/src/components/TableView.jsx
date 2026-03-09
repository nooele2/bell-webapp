import { useState, useMemo } from "react";
import { Plus, Trash2, X, RefreshCw, ArrowUp, ArrowDown, ArrowUpDown, Filter, Copy, ChevronDown } from "lucide-react";
import CodeBadge from "./CodeBadge";
import { C } from "../constants/theme";
import { todayStr, getSchColor } from "../utils/scheduleUtils";
import { createTableRow, updateTableRow, deleteTableRow } from "../services/api";

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const SCHOOL_YEARS = [
  { label:"2025/2026", from:"2025-08-01", to:"2026-07-31" },
  { label:"2024/2025", from:"2024-08-01", to:"2025-07-31" },
  { label:"2023/2024", from:"2023-08-01", to:"2024-07-31" },
  { label:"2022/2023", from:"2022-08-01", to:"2023-07-31" },
  { label:"2021/2022", from:"2021-08-01", to:"2022-07-31" },
  { label:"2020/2021", from:"2020-08-01", to:"2021-07-31" },
];

function getCurrentYearLabel() {
  const today = todayStr();
  return SCHOOL_YEARS.find(y => today >= y.from && today <= y.to)?.label || SCHOOL_YEARS[0].label;
}

export default function TableView({ schedules, tableRows, onReload }) {
  const TODAY      = todayStr();
  const normalCode = schedules.find(s => s.isNormal)?.code || "";

  // ── Academic year selector (always visible, drives the data shown) ────────
  const [activeYear, setActiveYear] = useState(getCurrentYearLabel);

  // ── Inline add / edit ────────────────────────────────────────────────────
  const [adding, setAdding]       = useState(false);
  const [newRow, setNewRow]       = useState({ code: normalCode, from:"", to:"", comment:"" });
  const [saving, setSaving]       = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({});

  // ── Sort & filter ────────────────────────────────────────────────────────
  const [filterCode,  setFilterCode]  = useState("");
  const [filterType,  setFilterType]  = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [sortKey,     setSortKey]     = useState("date_asc");

  // ── Copy Year modal ───────────────────────────────────────────────────────
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyFrom,      setCopyFrom]      = useState(SCHOOL_YEARS[1].label);
  const [copyTo,        setCopyTo]        = useState(SCHOOL_YEARS[0].label);
  const [yearDuping,    setYearDuping]    = useState(false);

  // ── Auto-fill recurring ──────────────────────────────────────────────────
  const [showRecur,    setShowRecur]    = useState(false);
  const [recur,        setRecur]        = useState({ code:"", dow:"2", from:"", to:"", comment:"" });
  const [recurError,   setRecurError]   = useState("");
  const [recurSaving,  setRecurSaving]  = useState(false);

  // ── Styles ───────────────────────────────────────────────────────────────
  const inputStyle = { padding:"7px 9px", borderRadius:"7px", border:`1.5px solid ${C.navyLight}40`, fontSize:"13px", background:C.white, boxSizing:"border-box", width:"100%", outline:"none" };
  const colStyle   = { fontSize:"11px", fontWeight:700, color:C.textMuted, letterSpacing:"0.07em", textTransform:"uppercase" };
  const grid       = { display:"grid", gridTemplateColumns:"110px 120px 120px 1fr 52px", padding:"10px 20px", alignItems:"center", gap:"8px" };

  // ── Data for current year ────────────────────────────────────────────────
  const yearRange   = SCHOOL_YEARS.find(y => y.label === activeYear);
  const yearRows    = useMemo(() => {
    if (!yearRange) return tableRows;
    return tableRows.filter(r => r.from >= yearRange.from && r.from <= yearRange.to);
  }, [tableRows, yearRange, activeYear]);

  const getRowsForYear = (label) => {
    const yr = SCHOOL_YEARS.find(y => y.label === label);
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

  const activeFilters = (filterCode ? 1 : 0) + (filterType ? 1 : 0) + (filterMonth ? 1 : 0);
  const isCurrentYear = activeYear === getCurrentYearLabel();

  // ── CRUD ─────────────────────────────────────────────────────────────────
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

  // ── Auto-fill recurring ──────────────────────────────────────────────────
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

  // ── Copy year ─────────────────────────────────────────────────────────────
  const duplicateYear = async () => {
    if (copyFrom === copyTo) return;
    const src  = SCHOOL_YEARS.find(y => y.label === copyFrom);
    const dest = SCHOOL_YEARS.find(y => y.label === copyTo);
    const rows = getRowsForYear(copyFrom);
    if (rows.length === 0) { alert("No rows found for " + copyFrom); return; }
    const diff = Math.round((new Date(dest.from) - new Date(src.from)) / 86400000);
    setYearDuping(true);
    try {
      for (const row of rows) {
        const nf = new Date(row.from + "T00:00:00"); nf.setDate(nf.getDate() + diff);
        const nt = row.to ? new Date(row.to + "T00:00:00") : null; if (nt) nt.setDate(nt.getDate() + diff);
        await createTableRow({ code:row.code, from:nf.toISOString().slice(0,10), to:nt?nt.toISOString().slice(0,10):"", comment:row.comment });
      }
      await onReload();
      setActiveYear(copyTo);
      setShowCopyModal(false);
    } catch(e) { alert("Failed: " + e.message); }
    finally { setYearDuping(false); }
  };

  // ── Sort button component ─────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

      {/* ── Copy Year modal ── */}
      {showCopyModal && (() => {
        const fromRows = getRowsForYear(copyFrom);
        const toRows   = getRowsForYear(copyTo);
        const canCopy  = copyFrom !== copyTo && fromRows.length > 0;
        const sel      = { padding:"9px 12px", borderRadius:"8px", border:`1.5px solid ${C.navyLight}40`, fontSize:"14px", background:C.white, width:"100%", outline:"none", fontWeight:600 };
        return (
          <div style={{ position:"fixed", inset:0, background:"rgba(15,25,50,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
            <div style={{ background:C.white, borderRadius:"16px", width:"460px", maxWidth:"95vw", boxShadow:"0 24px 64px rgba(26,58,107,0.28)", overflow:"hidden" }}>
              <div style={{ height:"3px", background:`linear-gradient(90deg,${C.navy},${C.red})` }}/>
              <div style={{ padding:"22px 26px 18px" }}>
                <div style={{ fontSize:"17px", fontWeight:800, color:C.navy, marginBottom:"4px" }}>Copy Academic Year</div>
                <div style={{ fontSize:"13px", color:C.textMuted, marginBottom:"22px" }}>
                  Copy all entries from one year to another, shifting dates proportionally.
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:"10px", alignItems:"end", marginBottom:"16px" }}>
                  <div>
                    <label style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, display:"block", marginBottom:"5px", textTransform:"uppercase" }}>Copy From</label>
                    <select value={copyFrom} onChange={e => setCopyFrom(e.target.value)} style={sel}>
                      {SCHOOL_YEARS.map(y => (
                        <option key={y.label} value={y.label}>{y.label}  ({getRowsForYear(y.label).length} rows)</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ paddingBottom:"10px", color:C.textMuted, fontSize:"18px" }}>→</div>
                  <div>
                    <label style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, display:"block", marginBottom:"5px", textTransform:"uppercase" }}>Copy To</label>
                    <select value={copyTo} onChange={e => setCopyTo(e.target.value)} style={sel}>
                      {SCHOOL_YEARS.map(y => (
                        <option key={y.label} value={y.label}>{y.label}  ({getRowsForYear(y.label).length} rows)</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Summary */}
                {copyFrom === copyTo ? (
                  <div style={{ background:"#fdf2f2", border:`1px solid #f5c6c6`, borderRadius:"8px", padding:"10px 14px", fontSize:"13px", color:C.danger, marginBottom:"16px" }}>
                    Source and destination must be different.
                  </div>
                ) : fromRows.length === 0 ? (
                  <div style={{ background:"#fdf2f2", border:`1px solid #f5c6c6`, borderRadius:"8px", padding:"10px 14px", fontSize:"13px", color:C.danger, marginBottom:"16px" }}>
                    No rows in {copyFrom} to copy.
                  </div>
                ) : (
                  <div style={{ background:"#eef3fc", border:`1px solid ${C.navyLight}30`, borderRadius:"8px", padding:"10px 14px", fontSize:"13px", color:C.navy, marginBottom:"16px", lineHeight:1.6 }}>
                    <strong>{fromRows.length} rows</strong> from {copyFrom} will be copied to {copyTo}.
                    {toRows.length > 0 && <span style={{ color:C.textMuted }}> {copyTo} already has {toRows.length} existing rows — new rows will be added alongside them.</span>}
                  </div>
                )}

                <div style={{ display:"flex", gap:"8px" }}>
                  <button onClick={duplicateYear} disabled={!canCopy || yearDuping}
                    style={{ flex:1, background:canCopy ? C.navy : C.offwhite, color:canCopy ? C.white : C.textMuted, border:"none", borderRadius:"8px", padding:"12px", fontWeight:700, fontSize:"14px", cursor:canCopy?"pointer":"not-allowed", transition:"background 0.15s" }}>
                    {yearDuping ? "Copying…" : `Copy ${fromRows.length} rows →`}
                  </button>
                  <button onClick={() => setShowCopyModal(false)}
                    style={{ background:C.offwhite, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"12px 20px", cursor:"pointer", color:C.textMuted, fontWeight:600, fontSize:"13px" }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
                <input value={recur.code} onChange={e=>{setRecur(r=>({...r,code:e.target.value.toUpperCase()}));setRecurError("");}} style={{...inputStyle,fontFamily:"monospace",fontWeight:700}} placeholder="e.g. C+"/></div>
              <div><label style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, display:"block", marginBottom:"4px" }}>DAY OF WEEK</label>
                <select value={recur.dow} onChange={e=>setRecur(r=>({...r,dow:e.target.value}))} style={inputStyle}>{DAYS.map((d,i)=><option key={i} value={i}>{d}</option>)}</select></div>
              <div><label style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, display:"block", marginBottom:"4px" }}>FROM</label>
                <input type="date" value={recur.from} onChange={e=>setRecur(r=>({...r,from:e.target.value}))} style={inputStyle}/></div>
              <div><label style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, display:"block", marginBottom:"4px" }}>TO</label>
                <input type="date" value={recur.to} onChange={e=>setRecur(r=>({...r,to:e.target.value}))} style={inputStyle}/></div>
            </div>
            <div style={{ marginBottom:"12px" }}>
              <label style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, display:"block", marginBottom:"4px" }}>COMMENT (optional)</label>
              <input value={recur.comment} onChange={e=>setRecur(r=>({...r,comment:e.target.value}))} placeholder="e.g. Chapel bell" style={inputStyle}/>
            </div>
            {recurError && <div style={{ fontSize:"12px", color:C.red, marginBottom:"10px" }}>{recurError}</div>}
            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={generateRecurring} disabled={recurSaving} style={{ flex:1, background:C.navy, color:C.white, border:"none", borderRadius:"8px", padding:"11px", fontWeight:700, fontSize:"14px", cursor:"pointer" }}>
                {recurSaving ? "Generating…" : "Generate Rows"}
              </button>
              <button onClick={()=>{setShowRecur(false);setRecurError("");}} style={{ background:C.offwhite, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"11px 16px", cursor:"pointer", color:C.textMuted }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Title row: year title + dropdown + action buttons ── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"12px" }}>
        {/* Left: title + year dropdown */}
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>
            <div style={{ fontSize:"20px", fontWeight:800, color:C.navy }}>
              {activeYear} Academic Year Schedule
            </div>
            {isCurrentYear && (
              <span style={{ fontSize:"11px", background:"#eef3fc", color:C.navyLight, border:`1px solid ${C.navyLight}40`, padding:"2px 8px", borderRadius:"4px", fontWeight:700 }}>
                Current
              </span>
            )}
          </div>
          {/* Year switcher inline below title */}
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginTop:"8px" }}>
            <span style={{ fontSize:"12px", fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.05em" }}>Year:</span>
            <div style={{ position:"relative", display:"inline-flex", alignItems:"center" }}>
              <select value={activeYear} onChange={e => { setActiveYear(e.target.value); setFilterCode(""); setFilterType(""); setFilterMonth(""); setSortKey("date_asc"); }}
                style={{ appearance:"none", padding:"5px 28px 5px 10px", borderRadius:"7px", border:`1.5px solid ${C.navyLight}50`, fontSize:"13px", background:"#eef3fc", color:C.navyLight, fontWeight:700, outline:"none", cursor:"pointer" }}>
                {SCHOOL_YEARS.map(y => (
                  <option key={y.label} value={y.label}>{y.label}  ({getRowsForYear(y.label).length} entries)</option>
                ))}
              </select>
              <ChevronDown size={13} color={C.navyLight} style={{ position:"absolute", right:"8px", pointerEvents:"none" }}/>
            </div>
            <span style={{ fontSize:"12px", color:C.textMuted }}>{yearRows.length} entries total</span>
          </div>
        </div>

        {/* Right: action buttons */}
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", alignItems:"center" }}>
          <button onClick={() => { setCopyFrom(isCurrentYear ? SCHOOL_YEARS[1].label : activeYear); setCopyTo(SCHOOL_YEARS[0].label); setShowCopyModal(true); }}
            style={{ background:"#fdf8ee", color:"#92600a", border:"1.5px solid #fcd34d", borderRadius:"10px", padding:"10px 16px", fontSize:"13px", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:"6px" }}>
            <Copy size={13}/> Copy Year
          </button>
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
        {/* Label */}
        <div style={{ display:"flex", alignItems:"center", gap:"5px", color:activeFilters > 0 ? C.navyLight : C.textMuted }}>
          <Filter size={13}/>
          <span style={{ fontSize:"12px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em" }}>Filter</span>
          {activeFilters > 0 && (
            <span style={{ background:C.navyLight, color:C.white, borderRadius:"10px", fontSize:"10px", padding:"1px 6px", fontWeight:800 }}>{activeFilters}</span>
          )}
        </div>

        {/* Code */}
        <select value={filterCode} onChange={e => setFilterCode(e.target.value)}
          style={{ padding:"6px 10px", borderRadius:"7px", border:`1.5px solid ${filterCode ? C.navyLight+"60" : C.border}`, fontSize:"12px", background:filterCode?"#eef3fc":C.white, color:filterCode?C.navyLight:C.textMuted, fontWeight:700, outline:"none", cursor:"pointer" }}>
          <option value="">All Codes</option>
          {uniqueCodes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Type */}
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ padding:"6px 10px", borderRadius:"7px", border:`1.5px solid ${filterType ? C.navyLight+"60" : C.border}`, fontSize:"12px", background:filterType?"#eef3fc":C.white, color:filterType?C.navyLight:C.textMuted, fontWeight:700, outline:"none", cursor:"pointer" }}>
          <option value="">All Types</option>
          <option value="single">Single-day only</option>
          <option value="range">Ranges only</option>
        </select>

        {/* Month */}
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          style={{ padding:"6px 10px", borderRadius:"7px", border:`1.5px solid ${filterMonth ? C.navyLight+"60" : C.border}`, fontSize:"12px", background:filterMonth?"#eef3fc":C.white, color:filterMonth?C.navyLight:C.textMuted, fontWeight:700, outline:"none", cursor:"pointer" }}>
          <option value="">All Months</option>
          {uniqueMonths.map(m => {
            const [yr, mo] = m.split("-");
            const label = new Date(Number(yr), Number(mo)-1, 1).toLocaleString("default", { month:"long", year:"numeric" });
            return <option key={m} value={m}>{label}</option>;
          })}
        </select>

        <div style={{ width:"1px", height:"20px", background:C.border }}/>

        {/* Sort */}
        <span style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.05em" }}>Sort</span>
        <SortBtn label="Date"           asc="date_asc"  desc="date_desc"/>
        <SortBtn label="Recently Added" asc="added_asc" desc="added_desc"/>

        {/* Clear */}
        {(filterCode || filterType || filterMonth || sortKey !== "date_asc") && (
          <button onClick={() => { setFilterCode(""); setFilterType(""); setFilterMonth(""); setSortKey("date_asc"); }}
            style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", fontSize:"12px", color:C.textMuted, display:"flex", alignItems:"center", gap:"4px", fontWeight:600 }}>
            <X size={12}/> Clear
          </button>
        )}

        {/* Row count */}
        <span style={{ marginLeft:(filterCode||filterType||filterMonth||sortKey!=="date_asc")?"0":"auto", fontSize:"12px", color:C.textLight, fontWeight:600 }}>
          {visibleRows.length} of {yearRows.length}
        </span>
      </div>

      {/* ── Table ── */}
      <div style={{ background:C.white, borderRadius:"14px", border:`1px solid ${C.border}`, overflow:"hidden" }}>
        <div style={{ height:"3px", background:`linear-gradient(90deg,${C.navy},${C.red})` }}/>
        <div style={{ ...grid, background:C.offwhite, borderBottom:`2px solid ${C.border}` }}>
          {["Code","From","To","Comment",""].map(h => <div key={h} style={colStyle}>{h}</div>)}
        </div>

        {/* Inline add */}
        {adding && (
          <div style={{ ...grid, background:"#eef3fc", borderBottom:`1px solid #c5d8f5` }}>
            <select value={newRow.code} onChange={e=>setNewRow(p=>({...p,code:e.target.value}))} style={{...inputStyle,fontFamily:"monospace",fontWeight:700}}>
              {schedules.map(s=><option key={s.id} value={s.code}>{s.code} — {s.name}</option>)}
            </select>
            <input type="date" value={newRow.from} onChange={e=>setNewRow(p=>({...p,from:e.target.value}))} style={inputStyle}/>
            <input type="date" value={newRow.to}   onChange={e=>setNewRow(p=>({...p,to:e.target.value}))}   style={inputStyle}/>
            <input placeholder="Comment" value={newRow.comment} onChange={e=>setNewRow(p=>({...p,comment:e.target.value}))} style={inputStyle}
              onKeyDown={e=>{ if(e.key==="Enter") handleAdd(); if(e.key==="Escape") setAdding(false); }}/>
            <div style={{ display:"flex", gap:"4px" }}>
              <button onClick={handleAdd} disabled={saving} style={{ background:C.navy, color:C.white, border:"none", borderRadius:"6px", padding:"6px 10px", cursor:"pointer", fontSize:"13px", fontWeight:700 }}>{saving?"…":"Save"}</button>
              <button onClick={()=>setAdding(false)} style={{ background:C.offwhite, border:`1px solid ${C.border}`, borderRadius:"6px", padding:"6px 8px", cursor:"pointer", display:"flex", alignItems:"center" }}><X size={12}/></button>
            </div>
          </div>
        )}

        {/* Data rows */}
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
              <div style={{ display:"flex", gap:"4px" }}>
                <button onClick={()=>saveEdit(row.id)} disabled={saving} style={{ background:C.navy, color:C.white, border:"none", borderRadius:"6px", padding:"6px 10px", cursor:"pointer", fontSize:"13px", fontWeight:700 }}>{saving?"…":"Save"}</button>
                <button onClick={()=>setEditingId(null)} style={{ background:C.offwhite, border:`1px solid ${C.border}`, borderRadius:"6px", padding:"6px 8px", cursor:"pointer", display:"flex", alignItems:"center" }}><X size={12}/></button>
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
                {isToday && <span style={{ fontSize:"10px", background:"#fdf2f2", color:C.red, border:`1px solid #f5c6c6`, padding:"1px 5px", borderRadius:"4px", fontWeight:700 }}>Today</span>}
              </div>
              <div style={{ fontSize:"13px", color:C.text, fontFamily:"monospace" }}>{row.from}</div>
              <div style={{ fontSize:"13px", color:row.to?C.text:C.textLight, fontFamily:"monospace" }}>{row.to||"—"}</div>
              <div style={{ fontSize:"13px", color:C.textMuted }}>{row.comment}</div>
              <button onClick={e=>{ e.stopPropagation(); handleDelete(row.id); }}
                style={{ background:"none", border:`1px solid #f5c6c6`, borderRadius:"6px", padding:"5px 8px", cursor:"pointer", color:C.danger, display:"flex", alignItems:"center" }}>
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