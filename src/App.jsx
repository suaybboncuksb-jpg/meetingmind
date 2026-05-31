import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import MeetingList from "./components/MeetingList";
import MeetingDetail from "./components/MeetingDetail";
import EmptyState from "./components/EmptyState";
import Dashboard from "./components/Dashboard";
import { getMeetings, analyzeMeeting, deleteMeeting } from "./api/meetingApi";

export default function App() {
  const [meetings, setMeetings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeNav, setActiveNav] = useState("meetings");
  const [search, setSearch] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => { loadMeetings(); }, []);

  const loadMeetings = async () => {
    try {
      const res = await getMeetings();
      const data = res.data.map(m => ({
        ...m,
        participants: (m.participants || []).map(p => typeof p === "string" ? p : p?.name || "")
      }));
      setMeetings(data);
    } catch (e) {
      console.error("Fehler beim Laden:", e);
    }
  };

  const handleAnalyze = async (id) => {
    setAnalyzing(true);
    try {
      const res = await analyzeMeeting(id);
      setSelected(res.data);
      loadMeetings();
    } catch (e) {
      alert("KI-Analyse fehlgeschlagen");
    }
    setAnalyzing(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Meeting wirklich loeschen?")) return;
    await deleteMeeting(id);
    setSelected(null);
    loadMeetings();
  };

  const renderContent = () => {
    if (activeNav === "dashboard") {
      return <Dashboard meetings={meetings} onSelectMeeting={(m) => { setSelected(m); setActiveNav("meetings"); }} />;
    }
    if (activeNav === "meetings") {
      return (
        <>
          <MeetingList meetings={meetings} selected={selected} onSelect={setSelected}
            onNew={() => alert("New Meeting kommt als naechstes!")}
            search={search} setSearch={setSearch} />
          {selected
            ? <MeetingDetail meeting={selected} onAnalyze={handleAnalyze} analyzing={analyzing}
                onDelete={handleDelete} onEdit={() => {}} />
            : <EmptyState />
          }
        </>
      );
    }
    if (activeNav === "tasks") {
      const allTasks = meetings.flatMap(m => (m.tasks || []).map(t => ({ ...t, meetingTitle: m.title })));
      return (
        <div className="flex-1 overflow-y-auto bg-[#f5f7fa] p-8">
          <h1 className="text-[22px] font-bold text-slate-900 mb-6">Tasks</h1>
          {allTasks.length === 0 ? (
            <div className="bg-white rounded-[14px] border border-slate-100 p-12 text-center">
              <p className="text-slate-400 text-[14px]">Noch keine Tasks vorhanden. Starte eine KI-Analyse um Tasks zu erkennen.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {allTasks.map((task, i) => (
                <div key={i} className="bg-white rounded-[12px] border border-slate-100 p-4 flex items-start gap-3" style={{boxShadow: "0 1px 4px rgba(0,0,0,0.05)"}}>
                  <div className="w-4 h-4 rounded border-2 border-violet-300 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-slate-700">{task.description}</p>
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      <span className="text-[11px] bg-violet-50 text-violet-600 font-medium px-2 py-0.5 rounded-full">{task.meetingTitle}</span>
                      {task.assignedTo && <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{task.assignedTo}</span>}
                      {task.dueDate && task.dueDate !== "null" && <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{task.dueDate}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f5f7fa]">
        <div className="text-center">
          <p className="text-[15px] font-semibold text-slate-600 mb-1">Kommt bald</p>
          <p className="text-[13px] text-slate-400">Dieser Bereich wird noch entwickelt.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar active={activeNav} setActive={(nav) => { setActiveNav(nav); if (nav !== "meetings") setSelected(null); }} />
      {renderContent()}
    </div>
  );
}
