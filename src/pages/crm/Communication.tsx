import { useState } from "react";
import { MoreVertical, Calendar as CalendarIcon, Video, Phone, Users, ChevronDown, ChevronUp, Plus, ExternalLink, FileText } from "lucide-react";

const COLORS = {
  bg: "#0a0c10",
  surface: "#111318",
  card: "#161b22",
  border: "#21262d",
  accent: "#00d4aa",
  accentDim: "#00d4aa22",
  blue: "#388bfd",
  blueDim: "#388bfd22",
  orange: "#f78166",
  orangeDim: "#f7816622",
  purple: "#bc8cff",
  purpleDim: "#bc8cff22",
  gold: "#e3b341",
  goldDim: "#e3b34122",
  red: "#ff7b72",
  green: "#3fb950",
  greenDim: "#3fb95022",
  textPrimary: "#e6edf3",
  textSecondary: "#8b949e",
  textMuted: "#484f58",
};

const Badge = ({ label, color = COLORS.accent }: { label: string, color?: string }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
    {label}
  </span>
);

const Card = ({ children, style = {} }: any) => (
  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "16px 20px", ...style }}>
    {children}
  </div>
);

const SectionHeader = ({ title, sub }: { title: string, sub: string }) => (
  <div style={{ marginBottom: 20 }}>
    <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.textPrimary }}>{title}</h2>
    {sub && <p style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>{sub}</p>}
  </div>
);

function Communication() {
  const [tab, setTab] = useState("meetings");
  const [showPast, setShowPast] = useState(false);
  const tabs = [["calls", "📞 Call Logs"], ["email", "📧 Email Tracking"], ["whatsapp", "💬 WhatsApp"], ["meetings", "📅 Meetings"]];

  const callLogs = [
    { date: "May 29", time: "11:30 AM", contact: "Ahmad Al-Rashid", company: "Future Wave", duration: "18 min", outcome: "Positive", by: "Swathi" },
    { date: "May 29", time: "10:15 AM", contact: "Klaus Weber", company: "OrganicLife GmbH", duration: "12 min", outcome: "Follow-Up", by: "Priya" },
    { date: "May 28", time: "03:00 PM", contact: "Marc Dupont", company: "NaturalBest Co.", duration: "8 min", outcome: "Not Available", by: "Rajesh" },
    { date: "May 28", time: "11:00 AM", contact: "James Carter", company: "Sea Horse Pvt", duration: "22 min", outcome: "Quotation Requested", by: "Rajesh" },
  ];

  const emails = [
    { date: "May 29", subject: "Turmeric Powder — Price Revision Q2", to: "ahmad@futurewave.ae", status: "Opened", by: "Swathi" },
    { date: "May 28", subject: "Product Catalog — Organic Spices 2026", to: "k.weber@organiclife.de", status: "Delivered", by: "Priya" },
    { date: "May 27", subject: "PI-2026-421 — Payment Confirmation", to: "liwei@eastwest.sg", status: "Replied", by: "Swathi" },
  ];

  const upcomingMeetings = [
    { id: 1, day: "02", month: "Jun", time: "2:00 PM", title: "Q3 Pricing Discussion", with: "Ahmad Al-Rashid (Future Wave)", type: "Video Call", by: "Swathi", link: "#" },
    { id: 2, day: "05", month: "Jun", time: "11:00 AM", title: "New Product Samples", with: "Klaus Weber (OrganicLife)", type: "In-Person", by: "Priya", link: null },
  ];

  const pastMeetings = [
    { id: 3, day: "28", month: "May", time: "10:00 AM", title: "Initial Consultation", with: "James Carter (Sea Horse Pvt)", type: "Phone", by: "Rajesh" }
  ];

  // Helper for type color
  const getTypeColor = (type: string) => {
    if (type === "Video Call") return COLORS.blue;
    if (type === "In-Person") return COLORS.purple;
    if (type === "Phone") return COLORS.green;
    return COLORS.accent;
  };

  // Helper for mini calendar (static for Jun 2026 for demo purposes)
  const calendarDays = Array.from({ length: 30 }, (_, i) => i + 1);
  const meetingDays = [2, 5];

  return (
    <div style={{ animation: "slideIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <SectionHeader title="Communication Management" sub="All channels: calls, email, WhatsApp, meetings in one place" />
        {tab === "meetings" && (
          <button style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.accent, color: COLORS.bg, border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "opacity 0.2s" }} onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"} onMouseOut={(e) => e.currentTarget.style.opacity = "1"}>
            <Plus size={16} /> Schedule Meeting
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: COLORS.surface, padding: 4, borderRadius: 10, width: "fit-content" }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background: tab === id ? COLORS.card : "transparent",
            color: tab === id ? COLORS.textPrimary : COLORS.textSecondary,
            border: tab === id ? `1px solid ${COLORS.border}` : "1px solid transparent", 
            borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
          }}>{label}</button>
        ))}
      </div>

      {tab === "calls" && (
        <Card style={{ padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                {["Date", "Time", "Contact", "Company", "Duration", "Outcome", "By"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: COLORS.textMuted, fontWeight: 600, letterSpacing: "0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {callLogs.map((c, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}22` }}>
                  <td style={{ padding: "10px 16px", fontSize: 12, color: COLORS.textSecondary }}>{c.date}</td>
                  <td style={{ padding: "10px 16px", fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}>{c.time}</td>
                  <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 500 }}>{c.contact}</td>
                  <td style={{ padding: "10px 16px", fontSize: 12, color: COLORS.textSecondary }}>{c.company}</td>
                  <td style={{ padding: "10px 16px", fontSize: 12, fontFamily: "JetBrains Mono, monospace", color: COLORS.blue }}>{c.duration}</td>
                  <td style={{ padding: "10px 16px" }}><Badge label={c.outcome} color={c.outcome === "Positive" ? COLORS.green : c.outcome === "Replied" ? COLORS.accent : COLORS.gold} /></td>
                  <td style={{ padding: "10px 16px", fontSize: 12 }}>{c.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "email" && (
        <Card style={{ padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                {["Date", "Subject", "To", "Status", "By"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: COLORS.textMuted, fontWeight: 600, letterSpacing: "0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {emails.map((e, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}22` }}>
                  <td style={{ padding: "10px 16px", fontSize: 12, color: COLORS.textSecondary }}>{e.date}</td>
                  <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 500 }}>{e.subject}</td>
                  <td style={{ padding: "10px 16px", fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: COLORS.textSecondary }}>{e.to}</td>
                  <td style={{ padding: "10px 16px" }}><Badge label={e.status} color={e.status === "Replied" ? COLORS.green : e.status === "Opened" ? COLORS.blue : COLORS.gold} /></td>
                  <td style={{ padding: "10px 16px", fontSize: 12 }}>{e.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "whatsapp" && (
        <Card>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
            <div style={{ fontWeight: 600, fontSize: 16, color: COLORS.textPrimary, marginBottom: 8 }}>WhatsApp Business Integration</div>
            <div style={{ fontSize: 13, marginBottom: 24, maxWidth: 400, margin: "0 auto" }}>Connect your WhatsApp Business API to sync conversations, send templates, and track delivery directly from your CRM.</div>
            <button style={{ background: COLORS.accent, color: COLORS.bg, border: `1px solid ${COLORS.accent}`, borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Connect WhatsApp API</button>
          </div>
        </Card>
      )}

      {tab === "meetings" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, animation: "fadeIn 0.3s ease" }}>
          
          {/* LEFT: Meeting Lists */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 16 }}>Upcoming Meetings</div>
            
            {upcomingMeetings.length === 0 ? (
              <Card style={{ textAlign: "center", padding: "40px 20px" }}>
                <CalendarIcon size={48} color={COLORS.textMuted} style={{ margin: "0 auto", marginBottom: 16 }} />
                <div style={{ color: COLORS.textPrimary, fontWeight: 600, marginBottom: 8 }}>No meetings scheduled</div>
                <div style={{ color: COLORS.textSecondary, fontSize: 13 }}>Click "Schedule Meeting" to get started.</div>
              </Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {upcomingMeetings.map((m) => (
                  <div key={m.id} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16, display: "flex", gap: 16, alignItems: "center", transition: "border 0.2s, background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.border = `1px solid ${COLORS.textMuted}`} onMouseOut={(e) => e.currentTarget.style.border = `1px solid ${COLORS.border}`}>
                    
                    {/* Date Block */}
                    <div style={{ minWidth: 70, textAlign: "center", borderRight: `1px solid ${COLORS.border}`, paddingRight: 16 }}>
                      <div style={{ fontSize: 12, color: COLORS.textSecondary, textTransform: "uppercase", fontWeight: 700 }}>{m.month}</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary, lineHeight: 1.1 }}>{m.day}</div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4, whiteSpace: "nowrap" }}>{m.time}</div>
                    </div>
                    
                    {/* Meeting Details */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.textPrimary }}>{m.title}</div>
                        <Badge label={m.type} color={getTypeColor(m.type)} />
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.textSecondary, display: "flex", alignItems: "center", gap: 6 }}>
                        <Users size={14} /> {m.with}
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6 }}>Host: {m.by}</div>
                    </div>
                    
                    {/* Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {m.type === "Video Call" && (
                        <button style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.blue, color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          <ExternalLink size={14} /> Join
                        </button>
                      )}
                      <button style={{ background: "transparent", border: "none", color: COLORS.textSecondary, cursor: "pointer", padding: 4, borderRadius: 4 }} onMouseOver={(e) => e.currentTarget.style.background = COLORS.card} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Past Meetings */}
            <div style={{ marginTop: 32 }}>
              <button 
                onClick={() => setShowPast(!showPast)} 
                style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", color: COLORS.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 16 }}
              >
                {showPast ? <ChevronUp size={16} /> : <ChevronDown size={16} />} 
                Past Meetings ({pastMeetings.length})
              </button>
              
              {showPast && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, opacity: 0.8 }}>
                  {pastMeetings.map((m) => (
                    <div key={m.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16, display: "flex", gap: 16, alignItems: "center" }}>
                      <div style={{ minWidth: 70, textAlign: "center", borderRight: `1px solid ${COLORS.border}`, paddingRight: 16 }}>
                        <div style={{ fontSize: 12, color: COLORS.textMuted, textTransform: "uppercase", fontWeight: 700 }}>{m.month}</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.textMuted, lineHeight: 1.1 }}>{m.day}</div>
                        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4, whiteSpace: "nowrap" }}>{m.time}</div>
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.textSecondary, textDecoration: "line-through" }}>{m.title}</div>
                          <Badge label={m.type} color={getTypeColor(m.type)} />
                        </div>
                        <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{m.with}</div>
                      </div>
                      
                      <div>
                        <button style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary, borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          <FileText size={14} /> View Notes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Calendar Widget */}
          <div>
            <Card style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>June 2026</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button style={{ background: COLORS.surface, border: "none", color: COLORS.textSecondary, padding: 4, borderRadius: 4, cursor: "pointer" }}>&lt;</button>
                  <button style={{ background: COLORS.surface, border: "none", color: COLORS.textSecondary, padding: 4, borderRadius: 4, cursor: "pointer" }}>&gt;</button>
                </div>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, textAlign: "center", marginBottom: 8 }}>
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
                  <div key={day} style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600 }}>{day}</div>
                ))}
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {/* Empty spaces for start of month - June 1 2026 is a Monday */}
                <div /> 
                {calendarDays.map(day => {
                  const hasMeeting = meetingDays.includes(day);
                  const isToday = day === 2; // Mock today
                  return (
                    <div key={day} style={{ 
                      aspectRatio: "1/1", 
                      display: "flex", 
                      flexDirection: "column",
                      alignItems: "center", 
                      justifyContent: "center", 
                      borderRadius: "50%",
                      fontSize: 12,
                      background: isToday ? COLORS.blueDim : "transparent",
                      color: isToday ? COLORS.blue : (hasMeeting ? COLORS.textPrimary : COLORS.textSecondary),
                      fontWeight: isToday || hasMeeting ? 600 : 400,
                      cursor: "pointer",
                      position: "relative"
                    }} onMouseOver={(e) => { if(!isToday) e.currentTarget.style.background = COLORS.surface }} onMouseOut={(e) => { if(!isToday) e.currentTarget.style.background = "transparent" }}>
                      {day}
                      {hasMeeting && <div style={{ width: 4, height: 4, borderRadius: "50%", background: COLORS.accent, position: "absolute", bottom: 2 }} />}
                    </div>
                  );
                })}
              </div>
              
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 8 }}>Upcoming</div>
                <div style={{ fontSize: 12, color: COLORS.textPrimary, display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.blue }} /> Q3 Pricing
                </div>
                <div style={{ fontSize: 12, color: COLORS.textPrimary, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.purple }} /> Product Samples
                </div>
              </div>
            </Card>
          </div>
          
        </div>
      )}
    </div>
  );
}

export default Communication;
