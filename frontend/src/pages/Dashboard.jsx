import { useState, useEffect } from "react";
import AppHeader     from "../components/AppHeader";
import DailyPanel    from "../components/DailyPanel";
import CalendarView  from "../components/CalendarView";
import TableView     from "../components/TableView";
import SchedulesView from "../components/SchedulesView";
import RingtoneSetup from "./RingtoneSetup";
import { C } from "../constants/theme";
import { getSchedules, getTableRows } from "../services/api";

/**
 * Dashboard
 * The only job of this file is:
 *  1. Load data from the API
 *  2. Pass it down to the right view based on the active tab
 *  3. Handle top-level navigation (tabs + RingtoneSetup page)
 *
 * All UI logic lives in the individual view components.
 */
export default function Dashboard({ user, onLogout }) {
  const [tab, setTab]             = useState("today");
  const [schedules, setSchedules] = useState([]);
  const [tableRows, setTableRows] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showRingtone, setShowRingtone] = useState(false);

  const loadData = async () => {
    try {
      const [s, r] = await Promise.all([getSchedules(), getTableRows()]);
      setSchedules(s);
      setTableRows(r);
    } catch (e) {
      console.error("Failed to load data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:C.offwhite, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ color:C.textMuted, fontSize:"16px" }}>Loading...</div>
      </div>
    );
  }

  const viewProps = { schedules, tableRows, onReload: loadData };

  return (
    <div style={{ minHeight:"100vh", background:C.offwhite, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <AppHeader
        activeTab={showRingtone ? null : tab}
        onTabChange={(t) => { setShowRingtone(false); setTab(t); }}
        user={user}
        onLogout={onLogout}
        onBellSounds={() => setShowRingtone(true)}
      />
      <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"28px 32px" }}>
        {showRingtone ? (
          <RingtoneSetup onBack={() => setShowRingtone(false)}/>
        ) : (
          <>
            {tab === "today"     && <DailyPanel    {...viewProps} onGoCreate={() => setTab("schedules")}/>}
            {tab === "calendar"  && <CalendarView  {...viewProps} onGoCreate={() => setTab("schedules")}/>}
            {tab === "table"     && <TableView     {...viewProps}/>}
            {tab === "schedules" && <SchedulesView schedules={schedules} onReload={loadData}/>}
          </>
        )}
      </div>
    </div>
  );
}