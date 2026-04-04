import { useState, useEffect } from "react";
import { Users, Clock, Archive, Plus, Trash2, X, Check, RotateCcw, Shield, User, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { C } from "../constants/theme";
import {
  getUsers, createUser, updateUser, deleteUser,
  getAuditLog,
  getSnapshots, createSnapshot, restoreSnapshot, deleteSnapshot, getSnapshot
} from "../services/api";

const TABS = ["users", "audit", "snapshots"];

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("default", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function actionColor(action) {
  switch(action) {
    case 'create':  return { bg: "#f0fdf4", color: "#15803d", border: "#86efac" };
    case 'update':  return { bg: "#eff6ff", color: "#1d4ed8", border: "#93c5fd" };
    case 'delete':  return { bg: "#fef2f2", color: "#dc2626", border: "#fca5a5" };
    case 'restore': return { bg: "#fdf4ff", color: "#7e22ce", border: "#d8b4fe" };
    default:        return { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" };
  }
}

export default function AdminPanel({ currentUser }) {
  const [tab, setTab]         = useState("users");

  // Users
  const [users, setUsers]         = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showAddUser, setShowAddUser]   = useState(false);
  const [editingUser, setEditingUser]   = useState(null);
  const [userForm, setUserForm]         = useState({ name:"", email:"", password:"", role:"user" });
  const [userError, setUserError]       = useState("");
  const [userSaving, setUserSaving]     = useState(false);

  // Audit log
  const [logs, setLogs]           = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState(null);

  // Snapshots
  const [snapshots, setSnapshots]         = useState([]);
  const [snapsLoading, setSnapsLoading]   = useState(true);
  const [showCreateSnap, setShowCreateSnap] = useState(false);
  const [snapLabel, setSnapLabel]           = useState("");
  const [snapSaving, setSnapSaving]         = useState(false);
  const [snapError, setSnapError]           = useState("");
  const [previewSnap, setPreviewSnap]       = useState(null);
  const [previewData, setPreviewData]       = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const inputStyle = { padding:"9px 11px", borderRadius:"8px", border:`1.5px solid ${C.navyLight}40`, fontSize:"14px", background:C.white, boxSizing:"border-box", width:"100%", outline:"none" };

  useEffect(() => { loadUsers(); loadLogs(); loadSnapshots(); }, []);

  const loadUsers     = async () => { setUsersLoading(true); try { setUsers(await getUsers()); } catch(e){} finally { setUsersLoading(false); } };
  const loadLogs      = async () => { setLogsLoading(true);  try { setLogs(await getAuditLog(200)); } catch(e){} finally { setLogsLoading(false); } };
  const loadSnapshots = async () => { setSnapsLoading(true); try { setSnapshots(await getSnapshots()); } catch(e){} finally { setSnapsLoading(false); } };

  // ── Users ────────────────────────────────────────────────────────────────
  const handleSaveUser = async () => {
    setUserError("");
    if (!userForm.name || !userForm.email) { setUserError("Name and email are required"); return; }
    if (!editingUser && !userForm.password) { setUserError("Password is required for new users"); return; }
    setUserSaving(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, userForm);
      } else {
        await createUser(userForm);
      }
      await loadUsers();
      setShowAddUser(false);
      setEditingUser(null);
      setUserForm({ name:"", email:"", password:"", role:"user" });
    } catch(e) {
      setUserError(e.message);
    } finally {
      setUserSaving(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.email === currentUser?.email) { alert("You cannot delete your own account"); return; }
    if (!confirm(`Delete user "${user.name}"?`)) return;
    try { await deleteUser(user.id); await loadUsers(); }
    catch(e) { alert("Failed: " + e.message); }
  };

  const startEditUser = (user) => {
    setEditingUser(user);
    setUserForm({ name: user.name, email: user.email, password: "", role: user.role });
    setUserError("");
    setShowAddUser(true);
  };

  // ── Snapshots ─────────────────────────────────────────────────────────────
  const handleCreateSnapshot = async () => {
    setSnapError("");
    if (!snapLabel.trim()) { setSnapError("Label is required"); return; }
    setSnapSaving(true);
    try {
      await createSnapshot({ label: snapLabel });
      await loadSnapshots();
      setShowCreateSnap(false);
      setSnapLabel("");
    } catch(e) {
      setSnapError(e.message);
    } finally {
      setSnapSaving(false);
    }
  };

  const handleRestoreSnapshot = async (snap) => {
    if (!confirm(`Restore snapshot "${snap.label}"? This will overwrite current schedules and table rows.`)) return;
    try {
      await restoreSnapshot(snap.id);
      alert("✅ Snapshot restored successfully!");
    } catch(e) {
      alert("Failed: " + e.message);
    }
  };

  const handleDeleteSnapshot = async (snap) => {
    if (!confirm(`Delete snapshot "${snap.label}"?`)) return;
    try { await deleteSnapshot(snap.id); await loadSnapshots(); }
    catch(e) { alert("Failed: " + e.message); }
  };

  const handlePreviewSnapshot = async (snap) => {
    setPreviewSnap(snap);
    setPreviewLoading(true);
    try {
      const data = await getSnapshot(snap.id);
      setPreviewData(data);
    } catch(e) {
      alert("Failed to load snapshot");
    } finally {
      setPreviewLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>

      {/* Preview Snapshot Modal */}
      {previewSnap && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,25,50,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
          <div style={{ background:C.white, borderRadius:"16px", width:"600px", maxWidth:"95vw", maxHeight:"80vh", boxShadow:"0 24px 64px rgba(26,58,107,0.28)", overflow:"hidden", display:"flex", flexDirection:"column" }}>
            <div style={{ height:"3px", background:`linear-gradient(90deg,${C.navy},${C.red})`, flexShrink:0 }}/>
            <div style={{ padding:"20px 24px", borderBottom:`1px solid ${C.border}`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:"17px", fontWeight:800, color:C.navy }}>{previewSnap.label}</div>
                <div style={{ fontSize:"12px", color:C.textMuted, marginTop:"2px" }}>
                  By {previewSnap.createdByName} · {formatDate(previewSnap.createdAt)}
                </div>
              </div>
              <button onClick={() => { setPreviewSnap(null); setPreviewData(null); }}
                style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted }}>
                <X size={18}/>
              </button>
            </div>
            <div style={{ overflowY:"auto", padding:"20px 24px", flex:1 }}>
              {previewLoading ? (
                <div style={{ textAlign:"center", color:C.textMuted, padding:"40px" }}>Loading…</div>
              ) : previewData ? (
                <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
                  <div>
                    <div style={{ fontSize:"13px", fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"8px" }}>
                      Schedules ({previewData.schedules?.length || 0})
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                      {previewData.schedules?.map(s => (
                        <span key={s.id} style={{ background: s.color + '20', border:`1px solid ${s.color}`, color: s.color, borderRadius:"6px", padding:"3px 10px", fontSize:"12px", fontWeight:700, fontFamily:"monospace" }}>
                          {s.code}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:"13px", fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"8px" }}>
                      Table Rows ({previewData.tableRows?.length || 0})
                    </div>
                    <div style={{ background:C.offwhite, borderRadius:"8px", padding:"12px", fontSize:"12px", color:C.textMuted, maxHeight:"200px", overflowY:"auto", fontFamily:"monospace" }}>
                      {previewData.tableRows?.slice(0, 20).map(r => (
                        <div key={r.id}>{r.from} {r.to ? `→ ${r.to}` : ''} · {r.code} {r.comment ? `— ${r.comment}` : ''}</div>
                      ))}
                      {previewData.tableRows?.length > 20 && <div style={{ marginTop:"4px", color:C.textLight }}>...and {previewData.tableRows.length - 20} more</div>}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            <div style={{ padding:"16px 24px", borderTop:`1px solid ${C.border}`, flexShrink:0, display:"flex", gap:"8px" }}>
              <button onClick={() => handleRestoreSnapshot(previewSnap)}
                style={{ flex:1, background:C.navy, color:C.white, border:"none", borderRadius:"8px", padding:"11px", fontWeight:700, fontSize:"14px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
                <RotateCcw size={14}/> Restore This Snapshot
              </button>
              <button onClick={() => { setPreviewSnap(null); setPreviewData(null); }}
                style={{ background:C.offwhite, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"11px 20px", cursor:"pointer", color:C.textMuted, fontWeight:600 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
        <div style={{ width:"40px", height:"40px", background:`linear-gradient(135deg,${C.navy},${C.navyLight})`, borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Shield size={20} color="white"/>
        </div>
        <div>
          <div style={{ fontSize:"22px", fontWeight:800, color:C.navy }}>Admin Panel</div>
          <div style={{ fontSize:"13px", color:C.textMuted }}>Manage users, view activity, and control versions</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"4px", background:C.offwhite, padding:"4px", borderRadius:"10px", width:"fit-content" }}>
        {[
          { key:"users",     label:"Users",       icon:<Users size={14}/> },
          { key:"audit",     label:"Audit Log",   icon:<Clock size={14}/> },
          { key:"snapshots", label:"Snapshots",   icon:<Archive size={14}/> },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display:"flex", alignItems:"center", gap:"6px", padding:"8px 16px", borderRadius:"7px", border:"none", cursor:"pointer", fontSize:"13px", fontWeight:700, transition:"all 0.15s",
              background: tab === t.key ? C.white : "transparent",
              color:      tab === t.key ? C.navy  : C.textMuted,
              boxShadow:  tab === t.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ── */}
      {tab === "users" && (
        <div style={{ background:C.white, borderRadius:"14px", border:`1px solid ${C.border}`, overflow:"hidden" }}>
          <div style={{ height:"3px", background:`linear-gradient(90deg,${C.navy},${C.red})` }}/>
          <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ fontSize:"15px", fontWeight:700, color:C.navy }}>Users ({users.length})</div>
            <button onClick={() => { setShowAddUser(true); setEditingUser(null); setUserForm({ name:"", email:"", password:"", role:"user" }); setUserError(""); }}
              style={{ background:C.navy, color:C.white, border:"none", borderRadius:"8px", padding:"8px 14px", fontSize:"13px", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:"6px" }}>
              <Plus size={13}/> Add User
            </button>
          </div>

          {/* Add/Edit User form */}
          {showAddUser && (
            <div style={{ padding:"16px 20px", background:"#eef3fc", borderBottom:`1px solid #c5d8f5` }}>
              <div style={{ fontSize:"14px", fontWeight:700, color:C.navy, marginBottom:"12px" }}>
                {editingUser ? "Edit User" : "New User"}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"10px" }}>
                <div>
                  <label style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, display:"block", marginBottom:"4px", textTransform:"uppercase" }}>Name</label>
                  <input value={userForm.name} onChange={e=>setUserForm(p=>({...p,name:e.target.value}))} style={inputStyle} placeholder="Full name"/>
                </div>
                <div>
                  <label style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, display:"block", marginBottom:"4px", textTransform:"uppercase" }}>Email</label>
                  <input value={userForm.email} onChange={e=>setUserForm(p=>({...p,email:e.target.value}))} style={inputStyle} placeholder="email@school.com" disabled={!!editingUser}/>
                </div>
                <div>
                  <label style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, display:"block", marginBottom:"4px", textTransform:"uppercase" }}>
                    Password {editingUser && <span style={{ fontWeight:400 }}>(leave blank to keep)</span>}
                  </label>
                  <input type="password" value={userForm.password} onChange={e=>setUserForm(p=>({...p,password:e.target.value}))} style={inputStyle} placeholder="••••••••"/>
                </div>
                <div>
                  <label style={{ fontSize:"11px", fontWeight:700, color:C.textMuted, display:"block", marginBottom:"4px", textTransform:"uppercase" }}>Role</label>
                  <select value={userForm.role} onChange={e=>setUserForm(p=>({...p,role:e.target.value}))} style={inputStyle}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              {userError && <div style={{ fontSize:"12px", color:"#dc2626", marginBottom:"8px" }}>{userError}</div>}
              <div style={{ display:"flex", gap:"8px" }}>
                <button onClick={handleSaveUser} disabled={userSaving}
                  style={{ background:C.navy, color:C.white, border:"none", borderRadius:"7px", padding:"8px 16px", fontSize:"13px", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:"5px" }}>
                  <Check size={13}/> {userSaving ? "Saving…" : "Save"}
                </button>
                <button onClick={() => { setShowAddUser(false); setEditingUser(null); setUserError(""); }}
                  style={{ background:C.offwhite, border:`1px solid ${C.border}`, borderRadius:"7px", padding:"8px 12px", cursor:"pointer", color:C.textMuted, fontSize:"13px" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {usersLoading ? (
            <div style={{ padding:"40px", textAlign:"center", color:C.textMuted }}>Loading…</div>
          ) : (
            users.map((user, i) => (
              <div key={user.id} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"14px 20px", borderBottom: i < users.length-1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ width:"36px", height:"36px", borderRadius:"50%", background: user.role === 'admin' ? `linear-gradient(135deg,${C.navy},${C.navyLight})` : "#e5e7eb", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {user.role === 'admin' ? <Shield size={16} color="white"/> : <User size={16} color="#6b7280"/>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <span style={{ fontSize:"14px", fontWeight:700, color:C.navy }}>{user.name}</span>
                    <span style={{ fontSize:"11px", background: user.role === 'admin' ? "#eef3fc" : "#f3f4f6", color: user.role === 'admin' ? C.navyLight : "#6b7280", border:`1px solid ${user.role === 'admin' ? C.navyLight+'40' : '#e5e7eb'}`, padding:"1px 7px", borderRadius:"4px", fontWeight:700 }}>
                      {user.role}
                    </span>
                    {user.email === currentUser?.email && (
                      <span style={{ fontSize:"11px", background:"#fef3c7", color:"#92400e", border:"1px solid #fcd34d", padding:"1px 7px", borderRadius:"4px", fontWeight:700 }}>You</span>
                    )}
                  </div>
                  <div style={{ fontSize:"12px", color:C.textMuted, marginTop:"2px" }}>{user.email} · Joined {formatDate(user.createdAt)}</div>
                </div>
                <div style={{ display:"flex", gap:"6px" }}>
                  <button onClick={() => startEditUser(user)}
                    style={{ padding:"6px 12px", background:"#eef3fc", border:`1px solid ${C.navyLight}30`, borderRadius:"7px", cursor:"pointer", fontSize:"12px", fontWeight:600, color:C.navyLight }}>
                    Edit
                  </button>
                  {user.email !== currentUser?.email && (
                    <button onClick={() => handleDeleteUser(user)}
                      style={{ width:"30px", height:"30px", display:"flex", alignItems:"center", justifyContent:"center", background:"#fdf2f2", border:"1px solid #fca5a5", borderRadius:"7px", cursor:"pointer", color:"#dc2626" }}>
                      <Trash2 size={13}/>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── AUDIT LOG TAB ── */}
      {tab === "audit" && (
        <div style={{ background:C.white, borderRadius:"14px", border:`1px solid ${C.border}`, overflow:"hidden" }}>
          <div style={{ height:"3px", background:`linear-gradient(90deg,${C.navy},${C.red})` }}/>
          <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ fontSize:"15px", fontWeight:700, color:C.navy }}>Activity Log ({logs.length})</div>
            <button onClick={loadLogs} style={{ background:C.offwhite, border:`1px solid ${C.border}`, borderRadius:"7px", padding:"7px 12px", cursor:"pointer", fontSize:"12px", fontWeight:600, color:C.textMuted }}>
              Refresh
            </button>
          </div>

          {logsLoading ? (
            <div style={{ padding:"40px", textAlign:"center", color:C.textMuted }}>Loading…</div>
          ) : logs.length === 0 ? (
            <div style={{ padding:"40px", textAlign:"center", color:C.textMuted }}>No activity yet</div>
          ) : (
            <div style={{ maxHeight:"600px", overflowY:"auto" }}>
              {logs.map((log, i) => {
                const ac = actionColor(log.action);
                const isExpanded = expandedLog === log.id;
                return (
                  <div key={log.id} style={{ borderBottom: i < logs.length-1 ? `1px solid ${C.border}` : "none" }}>
                    <div onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px 20px", cursor:"pointer", transition:"background 0.1s" }}
                      onMouseEnter={e=>e.currentTarget.style.background=C.offwhite}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{ fontSize:"11px", fontWeight:700, padding:"2px 8px", borderRadius:"5px", background:ac.bg, color:ac.color, border:`1px solid ${ac.border}`, flexShrink:0, textTransform:"uppercase" }}>
                        {log.action}
                      </span>
                      <div style={{ flex:1 }}>
                        <span style={{ fontSize:"13px", fontWeight:600, color:C.navy }}>{log.userName}</span>
                        <span style={{ fontSize:"13px", color:C.textMuted }}> {log.action}d a </span>
                        <span style={{ fontSize:"13px", fontWeight:600, color:C.navy }}>{log.entityType.replace('_', ' ')}</span>
                        {log.details?.code && <span style={{ fontSize:"13px", color:C.textMuted }}> ({log.details.code})</span>}
                        {log.details?.label && <span style={{ fontSize:"13px", color:C.textMuted }}> "{log.details.label}"</span>}
                      </div>
                      <div style={{ fontSize:"12px", color:C.textLight, flexShrink:0 }}>{formatDate(log.createdAt)}</div>
                      {isExpanded ? <ChevronUp size={14} color={C.textMuted}/> : <ChevronDown size={14} color={C.textMuted}/>}
                    </div>
                    {isExpanded && log.details && (
                      <div style={{ padding:"8px 20px 12px 52px" }}>
                        <pre style={{ fontSize:"11px", color:C.textMuted, background:C.offwhite, borderRadius:"6px", padding:"8px 12px", margin:0, overflow:"auto" }}>
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SNAPSHOTS TAB ── */}
      {tab === "snapshots" && (
        <div style={{ background:C.white, borderRadius:"14px", border:`1px solid ${C.border}`, overflow:"hidden" }}>
          <div style={{ height:"3px", background:`linear-gradient(90deg,${C.navy},${C.red})` }}/>
          <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:"15px", fontWeight:700, color:C.navy }}>Snapshots ({snapshots.length})</div>
              <div style={{ fontSize:"12px", color:C.textMuted, marginTop:"2px" }}>Save the current state and restore it later</div>
            </div>
            <button onClick={() => { setShowCreateSnap(true); setSnapLabel(""); setSnapError(""); }}
              style={{ background:C.navy, color:C.white, border:"none", borderRadius:"8px", padding:"8px 14px", fontSize:"13px", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:"6px" }}>
              <Plus size={13}/> Save Snapshot
            </button>
          </div>

          {/* Create snapshot form */}
          {showCreateSnap && (
            <div style={{ padding:"16px 20px", background:"#eef3fc", borderBottom:`1px solid #c5d8f5` }}>
              <div style={{ fontSize:"14px", fontWeight:700, color:C.navy, marginBottom:"10px" }}>Save Current State</div>
              <input value={snapLabel} onChange={e=>setSnapLabel(e.target.value)} placeholder="e.g. Before summer break changes" style={{...inputStyle, marginBottom:"10px"}}
                onKeyDown={e=>{ if(e.key==="Enter") handleCreateSnapshot(); if(e.key==="Escape") setShowCreateSnap(false); }}/>
              {snapError && <div style={{ fontSize:"12px", color:"#dc2626", marginBottom:"8px" }}>{snapError}</div>}
              <div style={{ display:"flex", gap:"8px" }}>
                <button onClick={handleCreateSnapshot} disabled={snapSaving}
                  style={{ background:C.navy, color:C.white, border:"none", borderRadius:"7px", padding:"8px 16px", fontSize:"13px", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:"5px" }}>
                  <Archive size={13}/> {snapSaving ? "Saving…" : "Save Snapshot"}
                </button>
                <button onClick={() => setShowCreateSnap(false)}
                  style={{ background:C.offwhite, border:`1px solid ${C.border}`, borderRadius:"7px", padding:"8px 12px", cursor:"pointer", color:C.textMuted, fontSize:"13px" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {snapsLoading ? (
            <div style={{ padding:"40px", textAlign:"center", color:C.textMuted }}>Loading…</div>
          ) : snapshots.length === 0 ? (
            <div style={{ padding:"40px", textAlign:"center", color:C.textMuted }}>No snapshots yet — save one to get started</div>
          ) : (
            snapshots.map((snap, i) => (
              <div key={snap.id} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"14px 20px", borderBottom: i < snapshots.length-1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ width:"36px", height:"36px", borderRadius:"9px", background:"#f3e8ff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Archive size={16} color="#7e22ce"/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"14px", fontWeight:700, color:C.navy }}>{snap.label}</div>
                  <div style={{ fontSize:"12px", color:C.textMuted, marginTop:"2px" }}>
                    By {snap.createdByName} · {formatDate(snap.createdAt)}
                  </div>
                </div>
                <div style={{ display:"flex", gap:"6px" }}>
                  <button onClick={() => handlePreviewSnapshot(snap)}
                    style={{ display:"flex", alignItems:"center", gap:"5px", padding:"6px 12px", background:"#f3e8ff", border:"1px solid #d8b4fe", borderRadius:"7px", cursor:"pointer", fontSize:"12px", fontWeight:600, color:"#7e22ce" }}>
                    <Eye size={12}/> Preview
                  </button>
                  <button onClick={() => handleRestoreSnapshot(snap)}
                    style={{ display:"flex", alignItems:"center", gap:"5px", padding:"6px 12px", background:"#eef3fc", border:`1px solid ${C.navyLight}30`, borderRadius:"7px", cursor:"pointer", fontSize:"12px", fontWeight:600, color:C.navyLight }}>
                    <RotateCcw size={12}/> Restore
                  </button>
                  <button onClick={() => handleDeleteSnapshot(snap)}
                    style={{ width:"30px", height:"30px", display:"flex", alignItems:"center", justifyContent:"center", background:"#fdf2f2", border:"1px solid #fca5a5", borderRadius:"7px", cursor:"pointer", color:"#dc2626" }}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}