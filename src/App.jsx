import { useState, useRef, useEffect } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,600&family=Lato:wght@300;400;700&display=swap');`;

const PRESETS = [
  { name: "Midnight Gold",    accent: "#C9973A", card: "rgba(255,255,255,0.07)", bg: "#0F0F1A", text: "#F5EFE6", sub: "#A89880", border: "rgba(201,151,58,0.25)",  dark: true  },
  { name: "Ivory & Burgundy", accent: "#6B1A2A", card: "rgba(107,26,42,0.06)",  bg: "#FAF7F2", text: "#1A0A0E", sub: "#7A5C60", border: "rgba(107,26,42,0.2)",    dark: false },
  { name: "Slate & Olive",    accent: "#8B9E6A", card: "rgba(255,255,255,0.06)", bg: "#111C25", text: "#EDF0E8", sub: "#8A9A8A", border: "rgba(139,158,106,0.25)", dark: true  },
  { name: "Parchment & Navy", accent: "#1B3A5C", card: "rgba(27,58,92,0.07)",   bg: "#F0EAD8", text: "#0D1B2A", sub: "#5A6A7A", border: "rgba(27,58,92,0.2)",     dark: false },
];

const DEFAULT_CONFIG = {
  orgName:      "Abide",
  tagline:      "Abide in me, and I in you.",
  taglineRef:   "John 15:4",
  welcomeTitle: "Welcome",
  welcomeBody:  "We are honored to invite you into this intentional private space for senior executive Christian leaders. In a world that demands constant excellence and often causes you to compartmentalize your belief in God and your faith, Abide is a dedicated harbor for your soul, bridging the gap between professional leadership, spiritual depth, and true rest.",
  welcomeBody2: "Please share a few details as you enter this space.",
  ctaLabel:     "Enter the Space",
  logoUrl:      "",
  bgImageUrl:   "",
  preset:       0,
  zoomMeetingId: "",
};

const INTENTS = [
  "A desire for true rest and spiritual renewal.",
  "A need for clarity and discernment in leadership.",
  "A heart for connection and fellowship with like-minded Christian leaders.",
  "A dedicated time for prayer and reflection.",
];

// ── Small reusable atoms ──────────────────────────────────────────
const Label = ({ children, theme }) => (
  <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'Lato',sans-serif", fontWeight: 700, color: theme.sub, marginBottom: 6 }}>{children}</div>
);

function FormInput({ theme, style, ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <input onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", background: "transparent", border: `1px solid ${focus ? theme.accent : theme.border}`, borderRadius: 6, color: theme.text, fontFamily: "'Lato',sans-serif", fontSize: 14, outline: "none", transition: "border-color .2s", ...style }}
      {...props} />
  );
}

const BuilderInput = ({ label, value, onChange, ...rest }) => (
  <div style={{ marginBottom: 13 }}>
    {label && <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7A6A5A", marginBottom: 5, fontFamily: "'Lato',sans-serif" }}>{label}</div>}
    <input value={value} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1px solid #DDD5C8", borderRadius: 6, fontSize: 13, fontFamily: "'Lato',sans-serif", outline: "none", background: "#FDFAF6", color: "#1A0A0E" }}
      {...rest} />
  </div>
);

const BuilderTextarea = ({ label, value, onChange, rows = 3 }) => (
  <div style={{ marginBottom: 13 }}>
    {label && <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7A6A5A", marginBottom: 5, fontFamily: "'Lato',sans-serif" }}>{label}</div>}
    <textarea value={value} rows={rows} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1px solid #DDD5C8", borderRadius: 6, fontSize: 13, fontFamily: "'Lato',sans-serif", outline: "none", background: "#FDFAF6", color: "#1A0A0E", resize: "vertical" }} />
  </div>
);

const Spinner = ({ color = "#fff" }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" style={{ animation: "spin .8s linear infinite" }}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <circle cx="9" cy="9" r="7" fill="none" stroke={color} strokeWidth="2" strokeDasharray="30" strokeDashoffset="10" strokeLinecap="round" />
  </svg>
);

const ZoomIcon = ({ size = 18, color = "#2D8CFF" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="5" fill={color} opacity="0.15" />
    <path d="M4 8.5C4 7.67 4.67 7 5.5 7h9C15.33 7 16 7.67 16 8.5v7c0 .83-.67 1.5-1.5 1.5h-9C4.67 17 4 16.33 4 15.5v-7z" fill={color} />
    <path d="M16 10.5l4-2.5v8l-4-2.5v-3z" fill={color} />
  </svg>
);

// ── Registration Page ─────────────────────────────────────────────
function RegistrationPage({ config, isMobile }) {
  const theme = PRESETS[config.preset];
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", org: "", intents: [], consent: false });
  // status: "idle" | "submitting" | "success" | "error"
  const [status, setStatus]   = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [joinUrl, setJoinUrl]   = useState("");
  const [anim, setAnim]         = useState(false);

  useEffect(() => { setTimeout(() => setAnim(true), 80); }, []);

  const toggleIntent = (item) =>
    setForm(f => ({ ...f, intents: f.intents.includes(item) ? f.intents.filter(i => i !== item) : [...f.intents, item] }));

  const handleSubmit = async () => {
    if (!form.name || !form.email) { setErrorMsg("Please enter your name and email to continue."); return; }
    setErrorMsg("");
    setStatus("submitting");

    const payload = {
      full_name:       form.name,
      email:           form.email,
      phone:           form.phone,
      city_country:    form.city,
      org_title:       form.org,
      intents:         form.intents.join(" | "),
      consent:         form.consent ? "Yes" : "No",
      zoom_meeting_id: config.zoomMeetingId || "",
      submitted_at:    new Date().toISOString(),
    };

    try {
      const res  = await fetch("/api/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      if (data.join_url) setJoinUrl(data.join_url);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Something went wrong. Please try again or contact the Abide team.");
    }
  };

  const sectionHead = (num, title) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22, marginTop: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${theme.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontFamily: "'Lato',sans-serif", color: theme.accent, flexShrink: 0 }}>{num}</div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 500, color: theme.text, letterSpacing: "0.04em" }}>{title}</div>
      <div style={{ flex: 1, height: 1, background: theme.border }} />
    </div>
  );

  const Checkbox = ({ checked, onClick, label }) => (
    <div onClick={onClick} style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", padding: "14px 16px", borderRadius: 8, background: checked ? `${theme.accent}18` : "transparent", border: `1px solid ${checked ? theme.accent : theme.border}`, transition: "all .18s" }}>
      <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${checked ? theme.accent : theme.sub}`, background: checked ? theme.accent : "transparent", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .18s" }}>
        {checked && <svg width="10" height="8" viewBox="0 0 10 8"><path d="M1 4L3.5 6.5L9 1" stroke={theme.dark ? "#0F0F1A" : "#fff"} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </div>
      <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: theme.text, lineHeight: 1.5 }}>{label}</span>
    </div>
  );

  const pad = isMobile ? "0 24px 60px" : "0 40px 80px";

  return (
    <div style={{ minHeight: "100%", background: config.bgImageUrl ? `linear-gradient(rgba(${theme.dark ? "15,15,26" : "245,240,232"},0.88),rgba(${theme.dark ? "15,15,26" : "245,240,232"},0.95)), url(${config.bgImageUrl}) center/cover` : theme.bg, display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "'Lato',sans-serif", overflowY: "auto" }}>
      <style>{FONTS}</style>

      {/* Header */}
      <div style={{ width: "100%", maxWidth: 640, padding: isMobile ? "40px 24px 0" : "64px 40px 0", opacity: anim ? 1 : 0, transform: anim ? "translateY(0)" : "translateY(18px)", transition: "opacity .7s ease, transform .7s ease", boxSizing: "border-box" }}>
        {config.logoUrl
          ? <div style={{ marginBottom: 28, textAlign: "center" }}><img src={config.logoUrl} alt="logo" style={{ maxHeight: 64, maxWidth: 200, objectFit: "contain" }} /></div>
          : <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: isMobile ? 38 : 52, fontWeight: 300, color: theme.text, letterSpacing: "0.08em", textAlign: "center", marginBottom: 6 }}>{config.orgName}</div>}

        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontStyle: "italic", color: theme.sub }}>{config.tagline}</div>
          {config.taglineRef && <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: theme.accent, marginTop: 4 }}>{config.taglineRef}</div>}
        </div>

        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: isMobile ? "28px 24px" : "40px 48px", marginBottom: 32, backdropFilter: "blur(8px)" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: theme.accent, marginBottom: 12 }}>{config.welcomeTitle}</div>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, lineHeight: 1.85, color: theme.text, margin: "0 0 16px" }}>{config.welcomeBody}</p>
          {config.welcomeBody2 && <p style={{ fontSize: 13, lineHeight: 1.7, color: theme.sub, margin: 0 }}>{config.welcomeBody2}</p>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
          <div style={{ flex: 1, height: 1, background: theme.border }} />
          <div style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: theme.sub }}>The Registration Form</div>
          <div style={{ flex: 1, height: 1, background: theme.border }} />
        </div>
      </div>

      {/* Form */}
      {status !== "success" ? (
        <div style={{ width: "100%", maxWidth: 640, padding: pad, opacity: anim ? 1 : 0, transform: anim ? "translateY(0)" : "translateY(24px)", transition: "opacity .9s ease .15s, transform .9s ease .15s", boxSizing: "border-box" }}>

          {sectionHead("1", "Personal Connection")}
          <div style={{ marginBottom: 16 }}><Label theme={theme}>Full Name</Label><FormInput theme={theme} placeholder="Enter your full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div style={{ marginBottom: 16 }}><Label theme={theme}>Email Address</Label><FormInput theme={theme} type="email" placeholder="Enter your email address" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          <div style={{ marginBottom: 36 }}>
            <Label theme={theme}>Phone Number <span style={{ fontWeight: 300, opacity: .6 }}>— Optional</span></Label>
            <FormInput theme={theme} type="tel" placeholder="For a brief text reminder before we begin" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>

          {sectionHead("2", "Your Context")}
          <div style={{ marginBottom: 16 }}>
            <Label theme={theme}>City &amp; Country</Label>
            <FormInput theme={theme} placeholder="e.g. Lagos, Nigeria" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            <div style={{ fontSize: 11, color: theme.sub, marginTop: 5 }}>To help us honor your time zone and global perspective.</div>
          </div>
          <div style={{ marginBottom: 36 }}>
            <Label theme={theme}>Organization &amp; Job Title</Label>
            <FormInput theme={theme} placeholder="e.g. CEO, Meridian Group" value={form.org} onChange={e => setForm(f => ({ ...f, org: e.target.value }))} />
            <div style={{ fontSize: 11, color: theme.sub, marginTop: 5 }}>So we can know the weight of the leadership you carry.</div>
          </div>

          {sectionHead("3", "Your Intent")}
          <div style={{ marginBottom: 36 }}>
            <Label theme={theme}>What are you seeking for your soul in this season? <span style={{ fontWeight: 300 }}>Select all that apply.</span></Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
              {INTENTS.map((item, i) => (
                <Checkbox key={i} checked={form.intents.includes(item)} onClick={() => toggleIntent(item)} label={item} />
              ))}
            </div>
          </div>

          {sectionHead("4", "Consent")}
          <div style={{ marginBottom: 40 }}>
            <Checkbox checked={form.consent} onClick={() => setForm(f => ({ ...f, consent: !f.consent }))} label="I would like to receive future communication and updates from the Abide team." />
          </div>

          {errorMsg && (
            <div style={{ background: `${theme.accent}15`, border: `1px solid ${theme.accent}50`, borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: theme.text }}>
              {errorMsg}
            </div>
          )}

          <button onClick={handleSubmit} disabled={status === "submitting"}
            style={{ width: "100%", padding: "18px 32px", background: theme.accent, border: "none", borderRadius: 8, cursor: status === "submitting" ? "wait" : "pointer", fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 600, letterSpacing: "0.08em", color: theme.dark ? "#0F0F1A" : "#FAF7F2", transition: "opacity .2s, transform .15s", opacity: status === "submitting" ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
            onMouseEnter={e => { if (status !== "submitting") { e.currentTarget.style.opacity = ".85"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}>
            {status === "submitting" ? <><Spinner color={theme.dark ? "#0F0F1A" : "#FAF7F2"} /> Entering…</> : config.ctaLabel}
          </button>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14 }}>
            <ZoomIcon size={15} color={theme.accent} />
            <span style={{ fontSize: 11, color: theme.sub }}>
              {config.zoomMeetingId
                ? "You'll receive your personal Zoom link by email after registering."
                : "Your information is kept private and treated with the utmost care."}
            </span>
          </div>
        </div>
      ) : (
        // ── Success screen ────────────────────────────────────────
        <div style={{ width: "100%", maxWidth: 640, padding: pad, textAlign: "center", animation: "fadeUp .6s ease both", boxSizing: "border-box" }}>
          <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div style={{ width: 56, height: 56, borderRadius: "50%", border: `1.5px solid ${theme.accent}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
            <svg width="24" height="20" viewBox="0 0 24 20"><path d="M2 10L9 17L22 3" stroke={theme.accent} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>

          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 300, color: theme.text, marginBottom: 12, letterSpacing: "0.04em" }}>Welcome in.</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontStyle: "italic", color: theme.sub, lineHeight: 1.8, marginBottom: 8 }}>
            "Come to me, all you who are weary and burdened,<br />and I will give you rest."
          </div>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", color: theme.accent, marginBottom: 32 }}>Matthew 11:28</div>

          {/* Personal Zoom join link (returned by the Zoom API) */}
          {joinUrl ? (
            <a href={joinUrl} target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 10, background: `${theme.accent}18`, border: `1px solid ${theme.accent}50`, borderRadius: 10, padding: "16px 24px", textDecoration: "none", cursor: "pointer", transition: "opacity .2s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = ".8"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <ZoomIcon size={22} color={theme.accent} />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, fontFamily: "'Lato',sans-serif" }}>Join the Zoom Meeting</div>
                <div style={{ fontSize: 11, color: theme.sub, marginTop: 2 }}>Click to open your personal link</div>
              </div>
            </a>
          ) : (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: `${theme.accent}12`, border: `1px solid ${theme.accent}40`, borderRadius: 10, padding: "14px 22px" }}>
              <ZoomIcon size={20} color={theme.accent} />
              <span style={{ fontSize: 13, color: theme.text, fontFamily: "'Lato',sans-serif" }}>Check your email — your Zoom link is on its way.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Builder Panel ─────────────────────────────────────────────────
function BuilderPanel({ config, setConfig }) {
  const [tab, setTab] = useState("content");
  const [zoomStatus, setZoomStatus] = useState(null); // null | true | false
  const logoRef = useRef();
  const bgRef   = useRef();
  const set     = (k, v) => setConfig(c => ({ ...c, [k]: v }));
  const handleFile = (e, key) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => set(key, ev.target.result); r.readAsDataURL(f); };

  // Check whether the backend has Zoom credentials configured
  useEffect(() => {
    fetch("/api/zoom-status")
      .then(r => r.json())
      .then(d => setZoomStatus(d.configured))
      .catch(() => setZoomStatus(false));
  }, []);

  const tabs = [
    { id: "content",     label: "Content" },
    { id: "colors",      label: "Colors"  },
    { id: "media",       label: "Media"   },
    { id: "integration", label: "⚡ Zoom" },
  ];

  const ST = (t) => <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#9A8C7E", marginBottom: 10, marginTop: 18, fontFamily: "'Lato',sans-serif" }}>{t}</div>;

  return (
    <div style={{ width: 330, minWidth: 310, background: "#FDFAF6", borderRight: "1.5px solid #E8E0D5", display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", fontFamily: "'Lato',sans-serif" }}>
      <style>{FONTS}</style>
      <div style={{ padding: "20px 22px 0", borderBottom: "1px solid #E8E0D5" }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 600, color: "#1A0A0E", marginBottom: 4 }}>Abide Builder</div>
        <div style={{ fontSize: 11, color: "#9A8C7E", marginBottom: 14 }}>Customize your registration form</div>
        <div style={{ display: "flex" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "8px 4px", fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", border: "none", background: "none", cursor: "pointer", color: tab === t.id ? "#C9973A" : "#9A8C7E", borderBottom: tab === t.id ? "2px solid #C9973A" : "2px solid transparent", fontWeight: tab === t.id ? 700 : 400, transition: "all .18s" }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 22px 24px" }}>

        {/* ── Content tab ── */}
        {tab === "content" && (<>
          {ST("Organization")}
          <BuilderInput label="Name"               value={config.orgName}      onChange={v => set("orgName", v)} />
          <BuilderInput label="Tagline / Scripture" value={config.tagline}     onChange={v => set("tagline", v)} />
          <BuilderInput label="Reference"           value={config.taglineRef}  onChange={v => set("taglineRef", v)} placeholder="e.g. John 15:4" />
          {ST("Welcome Section")}
          <BuilderInput label="Welcome Title"       value={config.welcomeTitle} onChange={v => set("welcomeTitle", v)} />
          <BuilderTextarea label="Welcome Body"     value={config.welcomeBody}  onChange={v => set("welcomeBody", v)} rows={5} />
          <BuilderTextarea label="Sub-text"         value={config.welcomeBody2} onChange={v => set("welcomeBody2", v)} rows={2} />
          {ST("Button")}
          <BuilderInput label="CTA Label"           value={config.ctaLabel}    onChange={v => set("ctaLabel", v)} />
        </>)}

        {/* ── Colors tab ── */}
        {tab === "colors" && (<>
          {ST("Color Themes")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {PRESETS.map((p, i) => (
              <div key={i} onClick={() => set("preset", i)} style={{ padding: "12px 14px", borderRadius: 8, cursor: "pointer", background: p.dark ? "#1A1A2E" : "#fff", border: `2px solid ${config.preset === i ? p.accent : "#E0D8CE"}`, transition: "border-color .18s" }}>
                <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 3, background: p.bg, border: "1px solid #ccc" }} />
                  <div style={{ width: 16, height: 16, borderRadius: 3, background: p.accent }} />
                  <div style={{ width: 16, height: 16, borderRadius: 3, background: p.text }} />
                </div>
                <div style={{ fontSize: 11, color: p.dark ? "#C9B89A" : "#4A3A2A", fontWeight: config.preset === i ? 700 : 400 }}>{p.name}</div>
              </div>
            ))}
          </div>
        </>)}

        {/* ── Media tab ── */}
        {tab === "media" && (<>
          {ST("Organization Logo")}
          <div onClick={() => logoRef.current.click()} style={{ border: "2px dashed #D4C9B8", borderRadius: 10, padding: "20px 16px", textAlign: "center", cursor: "pointer", background: "#FAF7F2", marginBottom: 10 }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#C9973A"} onMouseLeave={e => e.currentTarget.style.borderColor = "#D4C9B8"}>
            {config.logoUrl ? <img src={config.logoUrl} alt="logo" style={{ maxHeight: 56, maxWidth: "100%", objectFit: "contain" }} /> : <div style={{ color: "#9A8C7E", fontSize: 13 }}>+ Upload Logo<br /><span style={{ fontSize: 11 }}>PNG · JPG · SVG</span></div>}
          </div>
          <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e, "logoUrl")} />
          {config.logoUrl && <button onClick={() => set("logoUrl", "")} style={{ background: "none", border: "1px solid #DDD5C8", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer", color: "#6B1A2A", marginBottom: 14 }}>Remove Logo</button>}

          {ST("Background Image")}
          <div onClick={() => bgRef.current.click()} style={{ border: "2px dashed #D4C9B8", borderRadius: 10, overflow: "hidden", cursor: "pointer", marginBottom: 10, minHeight: 80, background: config.bgImageUrl ? `url(${config.bgImageUrl}) center/cover` : "#FAF7F2", display: "flex", alignItems: "center", justifyContent: "center" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#C9973A"} onMouseLeave={e => e.currentTarget.style.borderColor = "#D4C9B8"}>
            {config.bgImageUrl
              ? <div style={{ width: "100%", height: 80, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontSize: 12 }}>Click to change</span></div>
              : <div style={{ color: "#9A8C7E", fontSize: 13, textAlign: "center", padding: 16 }}>+ Upload Background<br /><span style={{ fontSize: 11 }}>Landscape images work best</span></div>}
          </div>
          <input ref={bgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e, "bgImageUrl")} />
          {config.bgImageUrl && <button onClick={() => set("bgImageUrl", "")} style={{ background: "none", border: "1px solid #DDD5C8", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer", color: "#6B1A2A" }}>Remove Background</button>}
        </>)}

        {/* ── Integration tab ── */}
        {tab === "integration" && (<>
          {/* Live connection badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: zoomStatus ? "#EAF5EA" : zoomStatus === false ? "#FFF8F0" : "#F5F0E8", border: `1px solid ${zoomStatus ? "#7BC47B" : zoomStatus === false ? "#F0C080" : "#D4C9B8"}`, marginTop: 16, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: zoomStatus ? "#4CAF50" : zoomStatus === false ? "#F0A030" : "#B0A090", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: zoomStatus ? "#2A6A2A" : zoomStatus === false ? "#7A4A10" : "#6A5A4A" }}>
              {zoomStatus === null   && "Checking Zoom connection…"}
              {zoomStatus === true   && "Zoom integration active — direct registration enabled"}
              {zoomStatus === false  && "Zoom not configured — see setup steps below"}
            </span>
          </div>

          {ST("Zoom Meeting ID")}
          <BuilderInput
            label="Paste your Zoom Meeting ID here"
            value={config.zoomMeetingId}
            onChange={v => set("zoomMeetingId", v)}
            placeholder="e.g. 123 456 7890"
          />
          <div style={{ fontSize: 11, color: "#9A8C7E", marginTop: -8, marginBottom: 14 }}>
            Copy this from your Zoom meeting → Registration tab.
          </div>

          {ST("Server Setup (one-time)")}
          <div style={{ background: "#F5F0E8", borderRadius: 10, padding: 16, fontSize: 12, color: "#4A3A2A", lineHeight: 1.85 }}>

            <div style={{ fontWeight: 700, color: "#C9973A", marginBottom: 6 }}>1 — Create a Server-to-Server OAuth App in Zoom</div>
            <ol style={{ margin: "0 0 14px 16px", padding: 0 }}>
              <li>Go to <strong>marketplace.zoom.us</strong> → Develop → Build App</li>
              <li>Choose <strong>Server-to-Server OAuth</strong></li>
              <li>Under <em>Scopes</em>, add <code style={{ background: "#EDE5D8", padding: "1px 5px", borderRadius: 3, fontSize: 11 }}>meeting:write:registrant</code></li>
              <li>Note your <strong>Account ID</strong>, <strong>Client ID</strong>, and <strong>Client Secret</strong></li>
            </ol>

            <div style={{ fontWeight: 700, color: "#C9973A", marginBottom: 6 }}>2 — Add credentials to <code style={{ background: "#EDE5D8", padding: "1px 5px", borderRadius: 3, fontSize: 11 }}>.env</code></div>
            <div style={{ background: "#1A1A2E", borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "#C9973A", fontFamily: "monospace", lineHeight: 1.8, marginBottom: 14 }}>
              ZOOM_ACCOUNT_ID=<span style={{ color: "#8890AA" }}>your_account_id</span><br />
              ZOOM_CLIENT_ID=<span style={{ color: "#8890AA" }}>your_client_id</span><br />
              ZOOM_CLIENT_SECRET=<span style={{ color: "#8890AA" }}>your_client_secret</span>
            </div>

            <div style={{ fontWeight: 700, color: "#C9973A", marginBottom: 6 }}>3 — Enable Registration on your Zoom meeting</div>
            <ol style={{ margin: "0 0 14px 16px", padding: 0 }}>
              <li>Edit the meeting in Zoom</li>
              <li>Under the <em>Registration</em> tab → set to <strong>Required</strong></li>
              <li>Paste the Meeting ID in the field above</li>
            </ol>

            <div style={{ background: "#FFF8F0", border: "1px solid #F0C080", borderRadius: 8, padding: "10px 12px", fontSize: 11, color: "#7A4A10" }}>
              💡 The Zoom API returns a <strong>personal join link</strong> per registrant — it's shown directly on the thank-you screen so attendees can join immediately.
            </div>
          </div>

          {ST("Data Sent to Zoom")}
          <div style={{ background: "#1A1A2E", borderRadius: 8, padding: 14, fontSize: 11, color: "#C9973A", fontFamily: "monospace", lineHeight: 1.7, overflowX: "auto" }}>
            <span style={{ color: "#8890AA" }}>{`{`}</span><br />
            {[["first_name", "string"], ["last_name", "string"], ["email", "string"], ["phone", "string (optional)"], ["city", "string"], ["org", "string"], ["custom_questions", "[{ what are you seeking? }]"]].map(([k, v]) => (
              <span key={k}>{"  "}<span style={{ color: "#7BC47B" }}>"{k}"</span><span style={{ color: "#8890AA" }}>: </span><span style={{ color: "#E8C97A" }}>"{v}"</span>,<br /></span>
            ))}
            <span style={{ color: "#8890AA" }}>{`}`}</span>
          </div>
        </>)}
      </div>

      <div style={{ padding: "13px 22px", borderTop: "1px solid #E8E0D5", fontSize: 11, color: "#B0A090", textAlign: "center" }}>
        Changes reflect live in the preview →
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────
export default function App() {
  const [config, setConfig]       = useState(DEFAULT_CONFIG);
  const [mobileTab, setMobileTab] = useState("preview");
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  if (isMobile) {
    return (
      <div style={{ fontFamily: "'Lato',sans-serif", background: "#FAF7F2", minHeight: "100vh" }}>
        <style>{FONTS}</style>
        <div style={{ background: "#1A0A0E", padding: "12px 20px", display: "flex" }}>
          {["preview", "builder"].map(v => (
            <button key={v} onClick={() => setMobileTab(v)} style={{ flex: 1, padding: 8, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", border: "none", background: "none", cursor: "pointer", color: mobileTab === v ? "#C9973A" : "#7A6A5A", borderBottom: mobileTab === v ? "2px solid #C9973A" : "2px solid transparent" }}>{v}</button>
          ))}
        </div>
        <div style={{ display: mobileTab === "builder" ? "block" : "none" }}><BuilderPanel config={config} setConfig={setConfig} /></div>
        <div style={{ display: mobileTab === "preview" ? "block" : "none" }}><RegistrationPage config={config} isMobile={true} /></div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <style>{FONTS}</style>
      <BuilderPanel config={config} setConfig={setConfig} />
      <div style={{ flex: 1, overflowY: "auto", background: PRESETS[config.preset].bg }}>
        <RegistrationPage config={config} isMobile={false} />
      </div>
    </div>
  );
}
