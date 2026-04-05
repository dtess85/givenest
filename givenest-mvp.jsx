import { useState, useEffect } from "react";

const T = {
  black:   "#0C0D0D",
  clay:    "#FFFFFF",
  coral:   "#E36858",
  sand:    "#D1B5A3",
  sage:    "#B1ADA1",
  offwhite:"#F4F3EE",
  muted:   "#6B6860",
  border:  "#E3DED6",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #FFFFFF; color: ${T.black}; font-family: 'DM Sans', sans-serif; font-weight: 400; -webkit-font-smoothing: antialiased; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  .fade-up   { animation: fadeUp 0.7s ease forwards; }
  .fade-up-2 { animation: fadeUp 0.7s 0.1s ease forwards; opacity: 0; }
  .fade-up-3 { animation: fadeUp 0.7s 0.2s ease forwards; opacity: 0; }
  input, button, select { font-family: 'DM Sans', sans-serif; }
  .serif { font-family: 'Lora', serif; }
  .btn-primary { background: ${T.coral}; color: white; border: none; padding: 11px 22px; font-size: 14px; font-weight: 500; cursor: pointer; border-radius: 6px; transition: background 0.2s; }
  .btn-primary:hover { background: #d4574a; }
  .btn-secondary { background: transparent; color: ${T.black}; border: 1px solid ${T.border}; padding: 11px 22px; font-size: 14px; font-weight: 400; cursor: pointer; border-radius: 6px; transition: all 0.2s; }
  .btn-secondary:hover { border-color: ${T.coral}; color: ${T.coral}; }
  .btn-ghost { background: transparent; color: ${T.muted}; border: none; font-size: 13px; font-weight: 400; cursor: pointer; transition: color 0.2s; padding: 4px 0; }
  .btn-ghost:hover { color: ${T.black}; }
  .input-field { width: 100%; background: white; border: 1px solid ${T.border}; color: ${T.black}; padding: 11px 14px; font-size: 14px; border-radius: 6px; outline: none; transition: border-color 0.2s; }
  .input-field:focus { border-color: ${T.coral}; }
  .input-field::placeholder { color: #c0bdb6; }
  .input-dark { width: 100%; background: #1a1b1b; border: 1px solid #252626; color: ${T.offwhite}; padding: 11px 14px; font-size: 14px; font-weight: 300; border-radius: 6px; outline: none; transition: border-color 0.2s; }
  .input-dark:focus { border-color: ${T.coral}; }
  .input-dark::placeholder { color: #333; }
  .card { background: white; border: 1px solid ${T.border}; border-radius: 10px; padding: 24px; }
  .pill { display: inline-block; background: rgba(227,104,88,0.08); color: ${T.coral}; font-size: 11px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; }
  .pill-dark { display: inline-block; background: rgba(255,255,240,0.07); color: ${T.sage}; font-size: 11px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; }
  .divider { height: 1px; background: ${T.border}; }
  .divider-dark { height: 1px; background: #1e1f1f; }
  .feed-dot { width: 7px; height: 7px; background: ${T.coral}; border-radius: 50%; animation: pulse 2s infinite; flex-shrink: 0; }
  .nav-item { font-size: 14px; font-weight: 400; color: ${T.muted}; background: none; border: none; cursor: pointer; padding: 4px 0; transition: color 0.15s; }
  .nav-item:hover { color: ${T.black}; }
  .nav-item.active { color: ${T.black}; font-weight: 500; }
  .giving-bar { height: 3px; background: ${T.border}; border-radius: 2px; overflow: hidden; }
  .giving-bar-fill { height: 100%; background: ${T.coral}; border-radius: 2px; transition: width 1.2s ease; }
  .charity-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid ${T.border}; border-radius: 6px; cursor: pointer; transition: all 0.15s; background: white; }
  .charity-row:hover { border-color: ${T.coral}; }
  .charity-row.selected { border-color: ${T.coral}; background: #fff8f7; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: ${T.sand}; border-radius: 2px; }
`;

const fmt = (n) => "$" + Math.round(n).toLocaleString();
const calc = (price) => ({ commission: price * 0.025, givingPool: price * 0.025 * 0.30 });

const CHARITIES = [
  { id:1, name:"St. Mary's Food Bank",              category:"Food Security",   city:"Phoenix, AZ",  total:48200, closings:14 },
  { id:2, name:"Arizona Humane Society",             category:"Animal Welfare",  city:"Phoenix, AZ",  total:31500, closings:9  },
  { id:3, name:"Boys & Girls Club of Metro Phoenix", category:"Youth",           city:"Phoenix, AZ",  total:22800, closings:7  },
  { id:4, name:"Habitat for Humanity AZ",            category:"Housing",         city:"Statewide",    total:61400, closings:19 },
  { id:5, name:"Phoenix Children's Hospital",        category:"Health",          city:"Phoenix, AZ",  total:19200, closings:5  },
  { id:6, name:"Southwest Human Development",        category:"Early Childhood", city:"Phoenix, AZ",  total:12600, closings:4  },
];

const FEED = [
  { city:"Scottsdale, AZ",      price:875000,  charity:"Phoenix Children's Hospital", ago:"2m ago"  },
  { city:"Paradise Valley, AZ", price:1240000, charity:"Habitat for Humanity AZ",     ago:"14m ago" },
  { city:"Tempe, AZ",           price:520000,  charity:"St. Mary's Food Bank",         ago:"31m ago" },
  { city:"Chandler, AZ",        price:645000,  charity:"Arizona Humane Society",       ago:"1h ago"  },
  { city:"Gilbert, AZ",         price:590000,  charity:"Boys & Girls Club",            ago:"2h ago"  },
];

const AGENTS = [
  { name:"Sarah Chen",    markets:"Scottsdale · Paradise Valley", closings:18, initials:"SC" },
  { name:"Marcus Webb",   markets:"Phoenix · Tempe · Chandler",   closings:24, initials:"MW" },
  { name:"Alicia Romero", markets:"Gilbert · Mesa · Queen Creek",  closings:15, initials:"AR" },
];

function Wordmark({ size = 18 }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"baseline", gap:1 }}>
      <span style={{ fontFamily:"'Lora',serif", fontWeight:600, fontSize:size, color:T.black }}>give</span>
      <span style={{ fontFamily:"'Lora',serif", fontWeight:600, fontSize:size, color:T.coral, fontStyle:"italic" }}>nest</span>
    </span>
  );
}

function Nav({ tab, setTab }) {
  return (
    <nav style={{ background:'#FFFFFF', borderBottom:`1px solid ${T.border}`, position:"sticky", top:0, zIndex:100 }}>
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 32px", display:"flex", alignItems:"center", justifyContent:"space-between", height:56 }}>
        <button onClick={() => setTab("home")} style={{ background:"none", border:"none", cursor:"pointer" }}>
          <Wordmark size={18} />
        </button>
        <div style={{ display:"flex", gap:28, alignItems:"center" }}>
          {[["home","Home"],["buy","Buy"],["sell","Sell"],["charities","Charities"],["partners","Agents"]].map(([id,label]) => (
            <button key={id} className={`nav-item ${tab===id?"active":""}`} onClick={() => setTab(id)}>{label}</button>
          ))}
          <button className="btn-primary" style={{ padding:"9px 18px", fontSize:13 }} onClick={() => setTab("buy")}>Get started</button>
        </div>
      </div>
    </nav>
  );
}

function Home({ setTab }) {
  const [bar, setBar] = useState(0);
  const [search, setSearch] = useState("");
  useEffect(() => { setTimeout(() => setBar(68), 600); }, []);

  return (
    <div>
      {/* Hero */}
      <div style={{ background:"#FFFFFF", padding:"88px 32px 80px" }}>
        <div style={{ maxWidth:960, margin:"0 auto", textAlign:"center" }}>
          <div className="pill" style={{ marginBottom:20 }}>Arizona's giving brokerage</div>
          <h1 className="serif" style={{ fontSize:"clamp(40px,5.5vw,72px)", fontWeight:600, lineHeight:1.1, marginBottom:20, letterSpacing:"-0.03em", color:T.black }}>
            Every home funds a cause <em style={{ color:T.coral }}>you choose.</em>
          </h1>
          <p style={{ fontSize:17, fontWeight:300, color:T.muted, maxWidth:500, lineHeight:1.8, marginBottom:40, margin:"0 auto 40px" }}>
            Buy or sell with Givenest and we donate to a charity of your choice at closing — at no extra cost.
          </p>
          {/* Search bar */}
          <div style={{ display:"flex", gap:0, maxWidth:600, margin:"0 auto", boxShadow:"0 2px 20px rgba(0,0,0,0.1)", borderRadius:8, overflow:"hidden", border:`1px solid ${T.border}` }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key==="Enter" && setTab("buy")}
              placeholder="Search by city, zip, or address..."
              style={{ flex:1, border:"none", outline:"none", padding:"18px 22px", fontSize:15, fontWeight:300, color:T.black, background:"white", fontFamily:"'DM Sans', sans-serif" }}
            />
            <button
              onClick={() => setTab("buy")}
              style={{ background:T.coral, color:"white", border:"none", padding:"18px 30px", fontSize:15, fontWeight:500, cursor:"pointer", fontFamily:"'DM Sans', sans-serif", whiteSpace:"nowrap" }}
            >Search homes</button>
          </div>
          <div style={{ marginTop:18, display:"flex", gap:28, flexWrap:"wrap", justifyContent:"center" }}>
            <button className="btn-ghost" onClick={() => setTab("sell")} style={{ fontSize:13 }}>Get a selling estimate →</button>
            <button className="btn-ghost" onClick={() => setTab("charities")} style={{ fontSize:13 }}>Browse charities →</button>
          </div>
        </div>
      </div>

      {/* Math strip — coral */}
      <div style={{ background:T.coral, padding:"18px 32px" }}>
        <div style={{ maxWidth:960, margin:"0 auto", textAlign:"center" }}>
          <span style={{ fontSize:15, fontWeight:600, color:"white", letterSpacing:"-0.01em" }}>
            $550K home → $4,125 to charity → $0 extra cost to you → every home does good
          </span>
        </div>
      </div>

      {/* How it works — pitch deck style */}
      <div style={{ background:"#F4F3EE", padding:"80px 32px" }}>
        <div style={{ maxWidth:960, margin:"0 auto" }}>
          <h2 className="serif" style={{ fontSize:"clamp(32px,4vw,52px)", fontWeight:600, letterSpacing:"-0.02em", color:T.black, marginBottom:8, lineHeight:1.15 }}>How it works</h2>
          <p style={{ fontSize:15, color:T.muted, fontWeight:300, marginBottom:52 }}>Three steps. Zero extra cost.</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {[
              { icon:"01", title:"Find your home", desc:"Search Arizona listings. Every property shows the exact dollar amount Givenest will donate to charity at closing." },
              { icon:"02", title:"Choose a charity", desc:"Pick any 501(c)(3) in the country. Your choice is saved to your transaction." },
              { icon:"03", title:"Get a Givenest agent", desc:"Get matched with a licensed Givenest agent. They handle your transaction and 30% of their commission goes to your chosen charity at closing." },
            ].map((step, i) => (
              <div key={i} style={{ background:"white", borderRadius:8, padding:"40px 32px 36px", border:`1px solid ${T.border}` }}>
                <div style={{ width:80, height:80, borderRadius:"50%", background:"#ECEAE3", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, marginBottom:28, fontFamily:"'Lora',serif", fontStyle:"italic", fontWeight:400, color:"rgba(12,13,13,0.35)" }}>{step.icon}</div>
                <div style={{ fontSize:16, fontWeight:700, color:T.black, marginBottom:10, lineHeight:1.3, fontFamily:"'DM Sans', sans-serif" }}>{step.title}</div>
                <div style={{ fontSize:14, fontWeight:300, color:T.muted, lineHeight:1.75 }}>{step.desc}</div>
              </div>
            ))}
          </div>
          {/* Coral strip — "Free for every client. Always." */}
          <div style={{ marginTop:20, background:T.coral, borderRadius:8, padding:"20px 32px", textAlign:"center" }}>
            <span style={{ fontSize:16, fontWeight:700, color:"white", letterSpacing:"-0.01em" }}>Free for every client. Always.</span>
          </div>
        </div>
      </div>

      {/* Feed + Stats — white */}
      <div style={{ padding:"72px 32px", background:"#FFFFFF" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:64 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <div className="feed-dot" />
              <span className="pill">Recent closings</span>
            </div>
            <h2 className="serif" style={{ fontSize:"clamp(20px,2.5vw,30px)", fontWeight:500, letterSpacing:"-0.02em", marginBottom:6 }}>Giving in real time.</h2>
            <p style={{ fontSize:14, color:T.muted, fontWeight:300, lineHeight:1.7, marginBottom:24 }}>Every row is a real home — and a real donation made at closing.</p>
            <div>
              {FEED.map((item,i) => {
                const { givingPool } = calc(item.price);
                return (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:`1px solid ${T.border}` }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:500, marginBottom:2 }}>{item.city}</div>
                      <div style={{ fontSize:12, color:T.muted, fontWeight:300 }}>{item.charity}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontWeight:600, fontSize:15, color:T.coral }}>{fmt(givingPool)}</div>
                      <div style={{ fontSize:11, color:T.sage, marginTop:1 }}>{item.ago}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <div className="pill" style={{ marginBottom:6 }}>Platform to date</div>
            <h2 className="serif" style={{ fontSize:"clamp(20px,2.5vw,30px)", fontWeight:500, letterSpacing:"-0.02em", marginBottom:24 }}>Early days.<br />Real impact.</h2>
            <div>
              {[["$284,190","Donated to charity"],["82","Homes closed"],["41","Charities supported"],["100%","Donated directly at closing, always"]].map(([val,label]) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"13px 0", borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ fontSize:14, color:T.muted, fontWeight:300 }}>{label}</span>
                  <span style={{ fontWeight:600, fontSize:17, color:val==="100%"?T.coral:T.black }}>{val}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop:20, padding:"16px 18px", background:"#F4F3EE", border:`1px solid ${T.border}`, borderRadius:8 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:13, color:T.muted }}>2025 giving goal</span>
                <span style={{ fontSize:13, fontWeight:600, color:T.coral }}>68%</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:12, color:T.muted, fontWeight:300 }}>$284,190 raised</span>
                <span style={{ fontSize:12, color:T.muted, fontWeight:300 }}>$420,000 goal</span>
              </div>
              <div className="giving-bar"><div className="giving-bar-fill" style={{ width:`${bar}%` }} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured charities */}
      <div style={{ background:"#F4F3EE", borderTop:`1px solid ${T.border}`, padding:"64px 32px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:32 }}>
            <div>
              <div className="pill" style={{ marginBottom:8 }}>Featured charities</div>
              <h2 className="serif" style={{ fontSize:"clamp(20px,2.5vw,30px)", fontWeight:500, letterSpacing:"-0.02em" }}>Causes already receiving<br />Givenest donations.</h2>
            </div>
            <button className="btn-ghost" onClick={() => setTab("charities")}>View all →</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
            {CHARITIES.slice(0,3).map(c => (
              <div key={c.id} className="card" style={{ padding:"20px" }}>
                <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:T.coral, fontWeight:500, marginBottom:6 }}>{c.category}</div>
                <div style={{ fontWeight:500, fontSize:14, marginBottom:3 }}>{c.name}</div>
                <div style={{ fontSize:12, color:T.muted, marginBottom:14 }}>{c.city}</div>
                <div className="divider" style={{ marginBottom:12 }} />
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                  <span style={{ fontSize:12, color:T.muted, fontWeight:300 }}>{c.closings} closings</span>
                  <span style={{ fontWeight:600, fontSize:16, color:T.coral }}>{fmt(c.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA — black */}
      <div style={{ background:"#FFFFFF", padding:"72px 32px" }}>
        <div style={{ maxWidth:500, margin:"0 auto", textAlign:"center" }}>
          <h2 className="serif" style={{ fontSize:"clamp(26px,3.5vw,44px)", color:T.black, fontWeight:500, lineHeight:1.2, marginBottom:14, letterSpacing:"-0.02em" }}>
            Your next home could<br />fund a <em style={{ color:T.coral }}>cause.</em>
          </h2>
          <p style={{ color:T.muted, fontWeight:300, fontSize:14, lineHeight:1.8, marginBottom:28 }}>
            Search homes, estimate your giving, or join as a partner agent.
          </p>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <button className="btn-primary" onClick={() => setTab("buy")}>Browse homes</button>
            <button style={{ background:"transparent", color:T.black, border:`1px solid ${T.border}`, padding:"11px 22px", fontSize:14, fontWeight:400, cursor:"pointer", borderRadius:6, transition:"all 0.2s", fontFamily:"'DM Sans',sans-serif" }} onClick={() => setTab("partners")}>Join as agent</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Buy() {
  const [search, setSearch] = useState("");
  const [home, setHome] = useState(null);
  const [cSearch, setCSearch] = useState("");
  const [charity, setCharity] = useState(null);
  const [matched, setMatched] = useState(false);

  const homes = [
    { id:1, address:"4821 N Scottsdale Rd", city:"Scottsdale, AZ 85251", price:875000,  beds:4, baths:3, sqft:2840, type:"Single Family" },
    { id:2, address:"12 W Camelback Rd",    city:"Phoenix, AZ 85013",    price:620000,  beds:3, baths:2, sqft:1920, type:"Condo" },
    { id:3, address:"9301 E Shea Blvd",     city:"Scottsdale, AZ 85260", price:1190000, beds:5, baths:4, sqft:3850, type:"Single Family" },
    { id:4, address:"702 S Mill Ave",       city:"Tempe, AZ 85281",      price:485000,  beds:2, baths:2, sqft:1340, type:"Townhome" },
    { id:5, address:"3340 S Higley Rd",     city:"Gilbert, AZ 85297",    price:695000,  beds:4, baths:3, sqft:2620, type:"Single Family" },
    { id:6, address:"1420 E Chandler Blvd", city:"Chandler, AZ 85225",   price:540000,  beds:3, baths:2, sqft:1780, type:"Single Family" },
  ];

  const filtered = homes.filter(h => h.address.toLowerCase().includes(search.toLowerCase()) || h.city.toLowerCase().includes(search.toLowerCase()));
  const filteredC = CHARITIES.filter(c => c.name.toLowerCase().includes(cSearch.toLowerCase()) || c.category.toLowerCase().includes(cSearch.toLowerCase()));

  if (home) {
    const { commission, givingPool } = calc(home.price);
    return (
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"40px 32px" }}>
        <button onClick={() => { setHome(null); setCharity(null); setMatched(false); }} className="btn-ghost" style={{ marginBottom:24 }}>← Back to search</button>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:44, alignItems:"flex-start" }}>
          <div>
            <div style={{ background:"#F5F4F2", borderRadius:10, height:240, display:"flex", alignItems:"flex-end", padding:24, marginBottom:24 }}>
              <div>
                <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em", color:T.muted, marginBottom:4 }}>{home.type}</div>
                <h1 className="serif" style={{ fontSize:26, fontWeight:500, letterSpacing:"-0.02em", marginBottom:3 }}>{home.address}</h1>
                <div style={{ fontSize:13, color:T.muted }}>{home.city}</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:28, marginBottom:24 }}>
              {[["Price",fmt(home.price)],["Beds",home.beds],["Baths",home.baths],["Sqft",home.sqft.toLocaleString()]].map(([k,v]) => (
                <div key={k}>
                  <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", color:T.muted, fontWeight:500, marginBottom:3 }}>{k}</div>
                  <div style={{ fontWeight:600, fontSize:16 }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="divider" style={{ marginBottom:24 }} />
            <h3 className="serif" style={{ fontSize:17, fontWeight:500, marginBottom:14, letterSpacing:"-0.01em" }}>Givenest agents</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {AGENTS.map((a,i) => (
                <div key={i} className="card" style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px" }}>
                  <div style={{ width:38, height:38, borderRadius:"50%", background:"#F0EFED", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:500, color:T.muted, flexShrink:0 }}>{a.initials}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:500, fontSize:13 }}>{a.name}</div>
                    <div style={{ fontSize:12, color:T.muted, marginTop:1 }}>{a.markets}</div>
                  </div>
                  <div style={{ textAlign:"right", marginRight:10 }}>
                    <div style={{ fontWeight:600, fontSize:15, color:T.coral }}>{a.closings}</div>
                    <div style={{ fontSize:10, color:T.sage }}>closings</div>
                  </div>
                  <button className="btn-secondary" style={{ padding:"7px 14px", fontSize:12 }}>Request</button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position:"sticky", top:68 }}>
            <div style={{ background:"#FFFFFF", borderRadius:10, padding:26, borderTop:`3px solid ${T.coral}`, border:`1px solid ${T.border}` }}>
              <div className="pill" style={{ marginBottom:14 }}>Giving panel</div>
              <h3 className="serif" style={{ fontSize:20, color:T.black, fontWeight:500, letterSpacing:"-0.02em", marginBottom:20, lineHeight:1.2 }}>Your closing.<br />Their cause.</h3>
              <div style={{ marginBottom:18 }}>
                {[["List price",fmt(home.price),false],["Commission (2.5%)",fmt(commission),false],["Givenest donates",fmt(givingPool),true]].map(([l,v,hi]) => (
                  <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:`1px solid ${T.border}` }}>
                    <span style={{ fontSize:13, color:hi?T.black:T.muted, fontWeight:hi?500:300 }}>{l}</span>
                    <span style={{ fontWeight:hi?600:400, fontSize:hi?17:14, color:hi?T.coral:T.muted }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:"rgba(227,104,88,0.08)", border:"1px solid rgba(227,104,88,0.2)", borderRadius:6, padding:"10px 12px", marginBottom:16 }}>
                <div style={{ fontSize:11, color:T.coral, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>100% to charity</div>
                <div style={{ fontSize:12, color:T.muted, fontWeight:300, lineHeight:1.6 }}>Givenest donates this amount directly to your chosen charity at closing. Nothing extra from you.</div>
              </div>
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:12, color:T.muted, marginBottom:7 }}>Choose your charity</div>
                <input className="input-field" placeholder="Search 1.8M+ nonprofits..." value={cSearch} onChange={e => setCSearch(e.target.value)} />
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:4, maxHeight:170, overflowY:"auto", marginBottom:14 }}>
                {filteredC.map(c => (
                  <div key={c.id} onClick={() => setCharity(c)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 10px", borderRadius:5, cursor:"pointer", background:charity?.id===c.id?"rgba(227,104,88,0.08)":"white", border:`1px solid ${charity?.id===c.id?T.coral:T.border}`, transition:"all 0.15s" }}>
                    <div>
                      <div style={{ fontSize:12, color:T.black }}>{c.name}</div>
                      <div style={{ fontSize:10, color:T.muted }}>{c.category}</div>
                    </div>
                    {charity?.id===c.id && <span style={{ color:T.coral, fontSize:13 }}></span>}
                  </div>
                ))}
              </div>
              {charity && !matched && (
                <div style={{ marginBottom:10, background:"white", border:`1px solid ${T.border}`, borderRadius:6, padding:12 }}>
                  <div style={{ fontSize:12, color:T.muted, fontWeight:300, lineHeight:1.6, marginBottom:8 }}>Want to add a personal donation on top of <span style={{ color:T.coral }}>{fmt(givingPool)}</span> to {charity.name}? See our FAQ for details.</div>
                  <button className="btn-secondary" style={{ width:"100%", padding:"8px", fontSize:12 }}>I'd like to match</button>
                </div>
              )}
              <button className="btn-primary" style={{ width:"100%", padding:13, fontSize:13, borderRadius:6, opacity:charity?1:0.4, cursor:charity?"pointer":"default" }} onClick={() => charity && setMatched(true)}>
                {matched ? " Request sent" : "Get matched with an agent"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background:"#FFFFFF", padding:"52px 32px 36px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div className="pill" style={{ marginBottom:12 }}>Buyer portal</div>
          <h1 className="serif" style={{ fontSize:"clamp(26px,3.5vw,44px)", fontWeight:500, letterSpacing:"-0.02em", marginBottom:18, lineHeight:1.2 }}>
            Find your home.<br /><em style={{ color:T.coral }}>Fund a cause.</em>
          </h1>
          <div style={{ display:"flex", maxWidth:500, gap:0 }}>
            <input className="input-field" style={{ borderRadius:"6px 0 0 6px", borderRight:"none" }} placeholder="Address, city, or zip..." value={search} onChange={e => setSearch(e.target.value)} />
            <button className="btn-primary" style={{ borderRadius:"0 6px 6px 0", whiteSpace:"nowrap" }}>Search</button>
          </div>
        </div>
      </div>
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"36px 32px" }}>
        <div style={{ fontSize:13, color:T.muted, marginBottom:18 }}>{filtered.length} properties</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
          {filtered.map(h => {
            const { givingPool } = calc(h.price);
            return (
              <div key={h.id} className="card" style={{ cursor:"pointer", padding:0, overflow:"hidden" }} onClick={() => setHome(h)}>
                <div style={{ background:"#F5F4F2", height:130, display:"flex", alignItems:"flex-end", padding:"14px 18px" }}>
                  <div style={{ fontSize:10, color:T.muted, textTransform:"uppercase", letterSpacing:"0.06em" }}>{h.type}</div>
                </div>
                <div style={{ padding:"16px 18px" }}>
                  <div style={{ fontWeight:600, fontSize:15, marginBottom:1 }}>{fmt(h.price)}</div>
                  <div style={{ fontSize:13, fontWeight:500, marginBottom:1 }}>{h.address}</div>
                  <div style={{ fontSize:12, color:T.muted, marginBottom:12 }}>{h.city}</div>
                  <div style={{ display:"flex", gap:14, marginBottom:12 }}>
                    {[["Beds",h.beds],["Baths",h.baths],["Sqft",h.sqft.toLocaleString()]].map(([k,v]) => (
                      <div key={k}>
                        <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.06em", color:T.muted, fontWeight:500 }}>{k}</div>
                        <div style={{ fontWeight:600, fontSize:13, marginTop:1 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="divider" style={{ marginBottom:10 }} />
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                    <span style={{ fontSize:12, color:T.muted }}>Gives to charity</span>
                    <span style={{ fontWeight:600, fontSize:15, color:T.coral }}>{fmt(givingPool)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Sell() {
  const [value, setValue] = useState("");
  const [charity, setCharity] = useState(null);
  const [cSearch, setCSearch] = useState("");
  const num = parseFloat(value.replace(/[^0-9.]/g,"")) || 0;
  const { commission, givingPool } = calc(num);
  const filtered = CHARITIES.filter(c => c.name.toLowerCase().includes(cSearch.toLowerCase()) || c.category.toLowerCase().includes(cSearch.toLowerCase()));

  return (
    <div>
      <div style={{ background:"#FFFFFF", padding:"52px 32px 36px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div className="pill" style={{ marginBottom:12 }}>Seller portal</div>
          <h1 className="serif" style={{ fontSize:"clamp(26px,3.5vw,44px)", fontWeight:500, letterSpacing:"-0.02em", lineHeight:1.2 }}>
            Sell your home.<br /><em style={{ color:T.coral }}>Grow a cause.</em>
          </h1>
        </div>
      </div>
      <div style={{ maxWidth:860, margin:"0 auto", padding:"44px 32px", display:"grid", gridTemplateColumns:"1fr 320px", gap:44 }}>
        <div>
          <h3 className="serif" style={{ fontSize:17, fontWeight:500, marginBottom:18, letterSpacing:"-0.01em" }}>Estimate your giving</h3>
          <div className="card" style={{ padding:24 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:500, color:T.muted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:7 }}>Estimated home value</label>
            <div style={{ position:"relative", marginBottom:18 }}>
              <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:T.muted, fontSize:14 }}>$</span>
              <input className="input-field" style={{ paddingLeft:26 }} placeholder="550,000" value={value} onChange={e => setValue(e.target.value)} />
            </div>
            {num > 0 && (
              <div>
                {[["Home value",fmt(num),false],["Agent commission (2.5%)",fmt(commission),false],["Givenest donates",fmt(givingPool),true]].map(([l,v,hi]) => (
                  <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"11px 0", borderBottom:`1px solid ${T.border}` }}>
                    <span style={{ fontSize:14, color:hi?T.black:T.muted, fontWeight:hi?500:300 }}>{l}</span>
                    <span style={{ fontWeight:hi?600:400, fontSize:hi?19:14, color:hi?T.coral:T.black }}>{v}</span>
                  </div>
                ))}
                <div style={{ marginTop:14, padding:"11px 13px", background:"#FFFFFF", borderRadius:6, border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:12, color:T.muted, lineHeight:1.6 }}>Givenest donates this amount directly to your chosen charity at closing — from the standard commission, at no extra cost.</div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div>
          <h3 className="serif" style={{ fontSize:17, fontWeight:500, marginBottom:18, letterSpacing:"-0.01em" }}>Choose a charity</h3>
          <input className="input-field" placeholder="Search nonprofits..." style={{ marginBottom:8 }} value={cSearch} onChange={e => setCSearch(e.target.value)} />
          <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:14 }}>
            {filtered.map(c => (
              <div key={c.id} className={`charity-row ${charity?.id===c.id?"selected":""}`} onClick={() => setCharity(c)}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>{c.name}</div>
                  <div style={{ fontSize:11, color:T.muted }}>{c.category} · {c.city}</div>
                </div>
                {charity?.id===c.id && <span style={{ color:T.coral, fontSize:13 }}></span>}
              </div>
            ))}
          </div>
          {charity && num > 0 && (
            <div style={{ background:"#FFFFFF", border:`1px solid ${T.border}`, borderRadius:8, padding:"14px 16px", marginBottom:12 }}>
              <div style={{ fontSize:12, color:T.muted, marginBottom:3 }}>Your closing would give</div>
              <div style={{ fontWeight:600, fontSize:22, color:T.coral }}>{fmt(givingPool)}</div>
              <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>to {charity.name}</div>
            </div>
          )}
          <button className="btn-primary" style={{ width:"100%", padding:12, opacity:charity?1:0.4, cursor:charity?"pointer":"default" }}>Get matched with an agent</button>
        </div>
      </div>
    </div>
  );
}

function Charities() {
  const [search, setSearch] = useState("");
  const filtered = CHARITIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div style={{ background:"#FFFFFF", padding:"52px 32px 36px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div className="pill" style={{ marginBottom:12 }}>Charity showcase</div>
          <h1 className="serif" style={{ fontSize:"clamp(26px,3.5vw,44px)", fontWeight:500, letterSpacing:"-0.02em", marginBottom:18, lineHeight:1.2 }}>
            1.8M+ charities.<br /><em style={{ color:T.coral }}>Your choice.</em>
          </h1>
          <div style={{ display:"flex", maxWidth:460, gap:0 }}>
            <input className="input-field" style={{ borderRadius:"6px 0 0 6px", borderRight:"none" }} placeholder="Search any 501(c)(3)..." value={search} onChange={e => setSearch(e.target.value)} />
            <button className="btn-primary" style={{ borderRadius:"0 6px 6px 0" }}>Search</button>
          </div>
        </div>
      </div>
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"44px 32px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:24 }}>
          <h2 className="serif" style={{ fontSize:20, fontWeight:500, letterSpacing:"-0.01em" }}>Featured charities</h2>
          <span style={{ fontSize:13, color:T.muted, fontWeight:300 }}>Nonprofits that Givenest has donated to</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
          {filtered.map(c => (
            <div key={c.id} className="card" style={{ padding:0, overflow:"hidden" }}>
              <div style={{ height:3, background:T.coral }} />
              <div style={{ padding:"18px 20px" }}>
                <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:T.coral, fontWeight:500, marginBottom:5 }}>{c.category}</div>
                <div style={{ fontWeight:500, fontSize:14, marginBottom:2 }}>{c.name}</div>
                <div style={{ fontSize:12, color:T.muted, marginBottom:14 }}>{c.city}</div>
                <div className="divider" style={{ marginBottom:12 }} />
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div>
                    <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.06em", color:T.muted, fontWeight:500, marginBottom:3 }}>Received</div>
                    <div style={{ fontWeight:600, fontSize:16, color:T.coral }}>{fmt(c.total)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.06em", color:T.muted, fontWeight:500, marginBottom:3 }}>Closings</div>
                    <div style={{ fontWeight:600, fontSize:16 }}>{c.closings}</div>
                  </div>
                </div>
                <div style={{ marginTop:12 }}>
                  <div className="giving-bar"><div className="giving-bar-fill" style={{ width:`${Math.min(100,(c.total/65000)*100)}%` }} /></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop:52, background:"#FFFFFF", borderRadius:12, padding:44, display:"grid", gridTemplateColumns:"1fr 1fr", gap:44 }}>
          <div>
            <div className="pill" style={{ marginBottom:14, background:T.border, color:T.muted }}>Our giving commitment</div>
            <h2 className="serif" style={{ fontSize:"clamp(20px,2.5vw,32px)", color:T.offwhite, fontWeight:500, lineHeight:1.2, marginBottom:14, letterSpacing:"-0.02em" }}>
              Every closing funds a cause.<br /><em style={{ color:T.coral }}>No exceptions.</em>
            </h2>
            <p style={{ color:T.muted, fontWeight:300, lineHeight:1.8, fontSize:14 }}>Givenest donates directly to your chosen charity at every closing. The full amount, every time. No deductions.</p>
          </div>
          <div>
            {[["$284,190","Donated to charity"],["41","Charities supported"],["82","Closings"],["100%","Donated in full, every closing"]].map(([val,label]) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"12px 0", borderBottom:`1px solid ${T.border}` }}>
                <span style={{ color:T.muted, fontSize:13, fontWeight:300 }}>{label}</span>
                <span style={{ fontWeight:600, fontSize:16, color:val==="100%"?T.coral:T.black }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Partners() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name:"", license:"", markets:"", email:"" });

  return (
    <div>

      {/* Hero — black, bold, emotional */}
      <div style={{ background:"#FFFFFF", padding:"96px 32px 88px" }}>
        <div style={{ maxWidth:720, margin:"0 auto", textAlign:"center" }}>
          <div style={{ width:48, height:3, background:T.coral, margin:"0 auto 36px" }} />
          <h1 className="serif" style={{ fontSize:"clamp(38px,5vw,64px)", fontWeight:600, lineHeight:1.15, marginBottom:24, letterSpacing:"-0.02em", color:T.black }}>
            A career worth<br /><em style={{ color:T.coral }}>talking about.</em>
          </h1>
          <p style={{ fontSize:18, fontWeight:300, color:T.muted, maxWidth:480, lineHeight:1.85, marginBottom:48, margin:"0 auto 48px" }}>
            Most brokerages offer splits and tools. None offer meaning. givenest gives you something no other brokerage can — a reason for clients to choose you.
          </p>
          <button className="btn-primary" style={{ fontSize:16, padding:"16px 40px" }} onClick={() => document.getElementById('apply').scrollIntoView({ behavior:'smooth' })}>
            Schedule a conversation →
          </button>
        </div>
      </div>

      {/* The quote */}
      <div style={{ background:"#F4F3EE", padding:"80px 32px" }}>
        <div style={{ maxWidth:720, margin:"0 auto" }}>
          <p className="serif" style={{ fontSize:"clamp(20px,2.5vw,32px)", fontWeight:500, color:T.black, lineHeight:1.5, letterSpacing:"-0.01em", marginBottom:20 }}>
            "Hire me, and your closing generates a donation to the charity <em style={{ color:T.coral }}>you choose.</em>"
          </p>
          <p style={{ fontSize:15, color:T.muted, fontWeight:300 }}>No other agent in Arizona can say this.</p>
        </div>
      </div>

      {/* Three ideas — white cards on Pampas */}
      <div style={{ background:"#F4F3EE", padding:"0 32px 80px" }}>
        <div style={{ maxWidth:960, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          {[
            { title:"The listing wins itself", desc:"Clients choose you because your transaction does something theirs never has before. The story closes listings." },
            { title:"Charities send referrals", desc:"Every charity you fund becomes a referral source. Their donors are buying homes. You already have their trust." },
            { title:"Your impact compounds", desc:"Eight closings a year generates $33,000 to charity. Your brand becomes a documented story no competitor can copy." },
          ].map((card, i) => (
            <div key={i} style={{ background:"white", borderRadius:8, padding:"32px 28px", border:`1px solid ${T.border}` }}>
              <div style={{ width:32, height:3, background:"#E36858", marginBottom:20 }} />
              <div style={{ fontSize:15, fontWeight:700, color:T.black, marginBottom:10, lineHeight:1.3 }}>{card.title}</div>
              <div style={{ fontSize:14, fontWeight:300, color:T.muted, lineHeight:1.75 }}>{card.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Who we're looking for — black */}
      <div style={{ background:"#FFFFFF", padding:"80px 32px" }}>
        <div style={{ maxWidth:720, margin:"0 auto" }}>
          <h2 className="serif" style={{ fontSize:"clamp(24px,3vw,40px)", fontWeight:600, letterSpacing:"-0.02em", color:T.black, marginBottom:12 }}>Who we're looking for.</h2>
          <p style={{ fontSize:15, color:T.muted, fontWeight:300, marginBottom:40 }}>We don't need hundreds of agents. We need the right ones.</p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              "You believe real estate can mean more than a commission check.",
              "You want a story your clients are proud to share.",
              "You're connected to causes and communities you care about.",
              "You'd rather build something meaningful than chase another split.",
            ].map((item, i) => (
              <div key={i} style={{ display:"flex", gap:16, alignItems:"center", padding:"18px 22px", background:"#F4F3EE", borderRadius:8, border:`1px solid ${T.border}` }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:T.coral, flexShrink:0 }} />
                <span style={{ fontSize:15, color:T.black, fontWeight:300, lineHeight:1.6 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Application — Pampas, clean */}
      <div id="apply" style={{ background:"#F4F3EE", padding:"80px 32px" }}>
        <div style={{ maxWidth:520, margin:"0 auto" }}>
          <h2 className="serif" style={{ fontSize:"clamp(24px,3vw,38px)", fontWeight:600, letterSpacing:"-0.02em", color:T.black, marginBottom:10, lineHeight:1.2 }}>
            Let's talk.
          </h2>
          <p style={{ fontSize:15, color:T.muted, fontWeight:300, lineHeight:1.8, marginBottom:40 }}>Tell us a little about yourself. We review every application personally and respond within 24 hours.</p>
          {step === 0 ? (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {[
                ["Full name","name","Your full name"],
                ["AZ License number","license","AZ-XXXXXXX"],
                ["Markets served","markets","e.g. Scottsdale, Phoenix, Gilbert"],
                ["Email","email","your@email.com"],
              ].map(([label,key,ph]) => (
                <div key={key}>
                  <label style={{ display:"block", fontSize:11, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.08em", color:T.muted, marginBottom:6 }}>{label}</label>
                  <input className="input-field" placeholder={ph} value={form[key]} onChange={e => setForm(f => ({...f,[key]:e.target.value}))} />
                </div>
              ))}
              <button className="btn-primary" style={{ marginTop:8, padding:"14px", fontSize:14 }} onClick={() => setStep(1)}>
                Submit application →
              </button>
              <p style={{ fontSize:12, color:T.muted, fontWeight:300, textAlign:"center" }}>Reviewed personally by Dustin or Kyndall. You'll hear back within 24 hours.</p>
            </div>
          ) : (
            <div style={{ textAlign:"center", padding:"48px 0" }}>
              <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(227,104,88,0.1)", border:`1px solid ${T.coral}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
                <span style={{ color:T.coral, fontSize:22 }}></span>
              </div>
              <div className="serif" style={{ fontWeight:600, fontSize:24, color:T.black, marginBottom:10 }}>Application received.</div>
              <div style={{ color:T.muted, fontWeight:300, fontSize:14, lineHeight:1.8 }}>Dustin or Kyndall will reach out personally within 24 hours.</div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

function Footer() {
  return (
    <footer style={{ background:"#0C0D0D", borderTop:"1px solid #1a1a1a", padding:"44px 32px 28px" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:44, marginBottom:36 }}>
          <div>
            <div style={{ marginBottom:12 }}><Wordmark size={17} dark={true} /></div>
            <p style={{ color:"rgba(255,255,255,0.55)", fontWeight:300, fontSize:13, lineHeight:1.8, maxWidth:250 }}>Arizona's giving brokerage. Every home we close funds a cause — donated directly by Givenest, at no extra cost.</p>
          </div>
          {[["Platform",["Buy","Sell","Charities","Agents"]],["Company",["About","Giving","Press","Contact"]],["Legal",["Privacy","Terms","Licensing","FAQ"]]].map(([title,links]) => (
            <div key={title}>
              <div style={{ fontSize:11, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.08em", color:"rgba(255,255,255,0.4)", marginBottom:12 }}>{title}</div>
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {links.map(l => <span key={l} style={{ color:"rgba(255,255,255,0.55)", fontSize:13, fontWeight:300, cursor:"pointer" }}>{l}</span>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ height:1, background:"rgba(255,255,255,0.1)", marginBottom:18 }} />
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>© 2025 Givenest. Licensed Arizona Real Estate Brokerage.</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>givenest.com</div>
        </div>
      </div>
    </footer>
  );
}

function Wordmark({ size = 17, dark = false }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"baseline", gap:1 }}>
      <span style={{ fontFamily:"'Lora',serif", fontWeight:600, fontSize:size, color:dark?"#FAF9F7":T.black }}>give</span>
      <span style={{ fontFamily:"'Lora',serif", fontWeight:600, fontSize:size, color:T.coral, fontStyle:"italic" }}>nest</span>
    </span>
  );
}

export default function App() {
  const [tab, setTab] = useState("home");
  const pages = { home:Home, buy:Buy, sell:Sell, charities:Charities, partners:Partners };
  const Page = pages[tab] || Home;
  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", background:"#FFFFFF" }}>
        <Nav tab={tab} setTab={setTab} />
        <main style={{ flex:1 }}><Page setTab={setTab} /></main>
        <Footer />
      </div>
    </>
  );
}
