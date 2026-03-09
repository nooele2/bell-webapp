import { useState } from "react";
import { CalendarDays, Calendar, Table2, Settings, User, Bell, LogOut } from "lucide-react";
import { C, LOGO_URL } from "../constants/theme";

const TABS = [
  { id:"today",     label:"Today",         Icon:CalendarDays },
  { id:"calendar",  label:"Calendar",      Icon:Calendar },
  { id:"table",     label:"Year Schedule", Icon:Table2 },
  { id:"schedules", label:"Schedules",     Icon:Settings },
];

/**
 * Single-row sticky header with:
 * - Left: CRICS logo + app name
 * - Centre: Tab navigation
 * - Right: Profile dropdown (Bell Sounds + Logout)
 */
export default function AppHeader({ activeTab, onTabChange, user, onLogout, onBellSounds }) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div style={{ background:C.navy, position:"sticky", top:0, zIndex:40, boxShadow:"0 2px 12px rgba(26,58,107,0.3)" }}>
      <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"0 32px", height:"56px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"16px" }}>

        {/* Logo + name */}
        <div style={{ display:"flex", alignItems:"center", gap:"10px", flexShrink:0 }}>
          <img src={LOGO_URL} alt="CRICS"
            style={{ height:"34px", width:"34px", objectFit:"contain", borderRadius:"6px", background:C.white, padding:"2px" }}
            onError={e => e.target.style.display = "none"}
          />
          <div>
            <div style={{ fontSize:"14px", fontWeight:800, color:C.white, lineHeight:"1.1" }}>Bell Schedule</div>
            <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.5)", letterSpacing:"0.08em", textTransform:"uppercase" }}>CRICS</div>
          </div>
        </div>

        {/* Tab navigation */}
        <div style={{ display:"flex", flex:1, justifyContent:"center" }}>
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => onTabChange(id)}
              style={{ background:"none", border:"none", borderBottom:activeTab===id ? `2px solid ${C.red}` : "2px solid transparent", padding:"0 16px", height:"56px", cursor:"pointer", fontSize:"13px", fontWeight:activeTab===id ? 700 : 400, color:activeTab===id ? C.white : "rgba(255,255,255,0.55)", display:"flex", alignItems:"center", gap:"6px", transition:"all 0.15s" }}>
              <Icon size={15}/>{label}
            </button>
          ))}
        </div>

        {/* Profile button + dropdown */}
        <div style={{ position:"relative", flexShrink:0 }}>
          <button onClick={() => setProfileOpen(p => !p)}
            style={{ width:"34px", height:"34px", borderRadius:"50%", background:profileOpen ? C.white : "rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"background 0.15s" }}>
            <User size={16} color={profileOpen ? C.navy : "rgba(255,255,255,0.85)"}/>
          </button>

          {profileOpen && (
            <div style={{ position:"absolute", right:0, top:"calc(100% + 8px)", width:"210px", background:C.white, border:`1px solid ${C.border}`, borderRadius:"12px", boxShadow:"0 8px 24px rgba(26,58,107,0.15)", zIndex:50, overflow:"hidden" }}>
              {/* User info */}
              <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}`, background:C.offwhite }}>
                <div style={{ fontSize:"11px", color:C.textLight }}>Signed in as</div>
                <div style={{ fontSize:"13px", fontWeight:700, color:C.text, marginTop:"2px" }}>{user?.email}</div>
              </div>

              {/* Bell Sounds */}
              <button
                onClick={() => { setProfileOpen(false); onBellSounds(); }}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:"10px", padding:"12px 16px", background:"none", border:"none", borderBottom:`1px solid ${C.border}`, cursor:"pointer", fontSize:"13px", color:C.text, fontWeight:600, textAlign:"left" }}
                onMouseEnter={e => e.currentTarget.style.background = C.offwhite}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                <Bell size={14}/> Bell Sounds
              </button>

              {/* Logout */}
              <button
                onClick={() => { setProfileOpen(false); onLogout(); }}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:"10px", padding:"12px 16px", background:"none", border:"none", cursor:"pointer", fontSize:"13px", color:C.danger, fontWeight:600, textAlign:"left" }}
                onMouseEnter={e => e.currentTarget.style.background = C.dangerBg}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                <LogOut size={14}/> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
