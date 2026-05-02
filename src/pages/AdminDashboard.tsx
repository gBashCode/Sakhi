import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, AlertTriangle, Activity, MapPin, LogOut, Search, Baby, 
  Syringe, HeartPulse, Stethoscope, Download, Filter, Bell 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from 'react-leaflet';
import "leaflet/dist/leaflet.css";

// --- Mock Data ---
const mockChartData = [
  { name: 'Mon', visits: 120, highRisk: 15 },
  { name: 'Tue', visits: 132, highRisk: 18 },
  { name: 'Wed', visits: 101, highRisk: 10 },
  { name: 'Thu', visits: 145, highRisk: 22 },
  { name: 'Fri', visits: 150, highRisk: 25 },
  { name: 'Sat', visits: 90, highRisk: 8 },
  { name: 'Sun', visits: 80, highRisk: 5 },
];

const mockHeatmapData = [
  { id: 1, lat: 12.9716, lng: 77.5946, count: 25, village: "North Block", type: 'maternal' },
  { id: 2, lat: 12.9352, lng: 77.6245, count: 42, village: "Koramangala", type: 'disease' },
  { id: 3, lat: 13.0100, lng: 77.5500, count: 15, village: "Yeshwanthpur", type: 'maternal' },
  { id: 4, lat: 12.9100, lng: 77.6000, count: 85, village: "BTM Layout", type: 'disease' },
  { id: 5, lat: 12.9600, lng: 77.6500, count: 12, village: "Indiranagar", type: 'ncd' },
  { id: 6, lat: 12.9800, lng: 77.5800, count: 6, village: "Shivajinagar", type: 'maternal' },
];

const mockAshaWorkers = [
  { id: "AW-1042", name: "Sunita Devi", assigned: 450, visits: 142, missed: 2, score: 95, status: "Active" },
  { id: "AW-1043", name: "Kamla Bai", assigned: 300, visits: 89, missed: 15, score: 72, status: "Offline" },
  { id: "AW-1044", name: "Rekha Sharma", assigned: 520, visits: 210, missed: 0, score: 99, status: "Active" },
  { id: "AW-1045", name: "Pooja Patel", assigned: 410, visits: 180, missed: 4, score: 88, status: "Active" },
];

const mockMaternal = [
  { id: "M-101", name: "Lakshmi Bai", village: "Mandya", edd: "2026-05-10", ancMissed: true, risk: "High Risk" },
  { id: "M-102", name: "Priya R.", village: "Tumkur", edd: "2026-06-21", ancMissed: false, risk: "Standard" },
  { id: "M-103", name: "Geeta Devi", village: "Hoskote", edd: "2026-05-05", ancMissed: true, risk: "Medium Risk" },
];

const mockChild = [
  { id: "C-201", name: "Baby Arjun", age: "6 Months", vaccineDue: "Measles", status: "Defaulter (Overdue 14 days)" },
  { id: "C-202", name: "Riya", age: "2 Months", vaccineDue: "OPV-1, Pentavalent-1", status: "Due this week" },
  { id: "C-203", name: "Kiran", age: "9 Months", vaccineDue: "Vitamin A", status: "Due next week" },
];

const mockDisease = [
  { id: "D-301", village: "BTM Layout", issue: "Fever Cluster", cases: 14, status: "Investigating" },
  { id: "D-302", village: "Shivajinagar", issue: "TB Suspect", cases: 2, status: "Sputum Test Pending" },
  { id: "D-303", village: "Koramangala", issue: "Diarrhea", cases: 8, status: "Outbreak Alert Sent" },
];

const mockNcd = [
  { id: "N-401", name: "Ramesh K.", age: 55, issue: "Hypertension (160/95)", followup: "Pending" },
  { id: "N-402", name: "Suresh P.", age: 62, issue: "Diabetes Risk", followup: "Referred to PHC" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col font-body">
      {/* Top Navbar */}
      <header className="h-16 w-full bg-white/70 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-display font-bold text-slate-800">Sakhi Central Command</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="hidden md:flex gap-2 text-slate-600 bg-white">
            <Download className="w-4 h-4" /> Export Report
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-slate-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full"></span>
          </Button>
          <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">Super Admin</span>
          <Button variant="ghost" size="icon" onClick={() => navigate("/login")}>
            <LogOut className="h-5 w-5 text-slate-600" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto w-full max-w-[1600px] mx-auto">
        <Tabs defaultValue="master" className="w-full">
          <TabsList className="mb-8 bg-white shadow-sm border border-slate-200 flex overflow-x-auto w-full justify-start md:justify-center p-1 rounded-2xl h-14">
            <TabsTrigger value="master" className="rounded-xl px-4 py-2 font-semibold">Master Overview</TabsTrigger>
            <TabsTrigger value="asha" className="rounded-xl px-4 py-2 font-semibold">ASHA Performance</TabsTrigger>
            <TabsTrigger value="maternal" className="rounded-xl px-4 py-2 font-semibold">Maternal Health</TabsTrigger>
            <TabsTrigger value="child" className="rounded-xl px-4 py-2 font-semibold">Child & Immunization</TabsTrigger>
            <TabsTrigger value="disease" className="rounded-xl px-4 py-2 font-semibold">Disease Alerts</TabsTrigger>
            <TabsTrigger value="ncd" className="rounded-xl px-4 py-2 font-semibold">NCD Tracker</TabsTrigger>
            <TabsTrigger value="geo" className="rounded-xl px-4 py-2 font-semibold">Geo View</TabsTrigger>
          </TabsList>

          {/* MASTER DASHBOARD */}
          <TabsContent value="master" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPI title="Total Households" value="45,210" icon={Users} color="blue" trend="+1.2%" />
              <KPI title="Active Pregnancies" value="1,245" icon={Baby} color="pink" trend="+5%" />
              <KPI title="High-Risk Cases" value="84" icon={AlertTriangle} color="red" trend="-2%" />
              <KPI title="Disease Alerts" value="12" icon={Activity} color="orange" trend="+4" />
            </div>
            
            <div className="glass-card p-6 h-[400px] shadow-xl flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 font-display">Weekly Field Visits vs High Risk Findings</h3>
              </div>
              <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '10px' }} />
                  <Area type="monotone" dataKey="visits" name="Total Visits" stroke="#3b82f6" fill="url(#colorV)" strokeWidth={3} />
                  <Area type="monotone" dataKey="highRisk" name="High Risk Identified" stroke="#ef4444" fill="url(#colorR)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          {/* ASHA PERFORMANCE */}
          <TabsContent value="asha" className="space-y-6">
            <div className="glass-card p-6 shadow-xl">
              <h3 className="text-xl font-bold text-slate-800 font-display mb-6">ASHA Worker Performance</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-slate-600 text-sm">
                      <th className="p-4">Worker Name</th>
                      <th className="p-4 text-center">Households</th>
                      <th className="p-4 text-center">Visits (Month)</th>
                      <th className="p-4 text-center text-red-500">Missed Follow-ups</th>
                      <th className="p-4 text-center">Data Quality Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mockAshaWorkers.map(w => (
                      <tr key={w.id} className="hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-800">{w.name} <span className="text-xs font-normal text-slate-500 block">{w.id}</span></td>
                        <td className="p-4 text-center text-slate-600">{w.assigned}</td>
                        <td className="p-4 text-center text-slate-600">{w.visits}</td>
                        <td className="p-4 text-center font-bold text-red-500">{w.missed}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${w.score > 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{w.score}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* MATERNAL HEALTH */}
          <TabsContent value="maternal" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <KPI title="Deliveries Next 7 Days" value="4" icon={Baby} color="indigo" />
              <KPI title="Missed ANC (>30 days)" value="12" icon={AlertTriangle} color="red" />
              <KPI title="High-Risk Pregnancies" value="84" icon={HeartPulse} color="pink" />
            </div>
            <div className="glass-card p-6 shadow-xl">
              <h3 className="text-xl font-bold text-slate-800 font-display mb-6">Pregnant Women Tracking</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-slate-600 text-sm">
                      <th className="p-4">Name</th>
                      <th className="p-4">Village</th>
                      <th className="p-4 text-center">EDD (Expected Delivery)</th>
                      <th className="p-4 text-center">ANC Status</th>
                      <th className="p-4 text-right">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mockMaternal.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-800">{m.name}</td>
                        <td className="p-4 text-slate-600">{m.village}</td>
                        <td className="p-4 text-center font-mono">{m.edd}</td>
                        <td className="p-4 text-center">
                          {m.ancMissed ? <span className="text-red-500 font-bold text-xs uppercase bg-red-50 px-2 py-1 rounded">Missed</span> : <span className="text-emerald-500 font-bold text-xs uppercase bg-emerald-50 px-2 py-1 rounded">On Track</span>}
                        </td>
                        <td className="p-4 text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${m.risk === 'High Risk' ? 'bg-red-100 text-red-700' : m.risk === 'Medium Risk' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{m.risk}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* CHILD HEALTH */}
          <TabsContent value="child" className="space-y-6">
            <div className="glass-card p-6 shadow-xl">
              <h3 className="text-xl font-bold text-slate-800 font-display mb-6">Immunization Defaulters & Due List</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-slate-600 text-sm">
                      <th className="p-4">Child Name</th>
                      <th className="p-4">Age</th>
                      <th className="p-4">Vaccine Due</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mockChild.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-800">{c.name}</td>
                        <td className="p-4 text-slate-600">{c.age}</td>
                        <td className="p-4 text-slate-800 font-medium">{c.vaccineDue}</td>
                        <td className="p-4 text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${c.status.includes('Defaulter') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{c.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* DISEASE ALERTS */}
          <TabsContent value="disease" className="space-y-6">
            <div className="glass-card p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
                <h3 className="text-xl font-bold text-slate-800 font-display">Auto-Detected Outbreak Patterns</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockDisease.map(d => (
                  <div key={d.id} className="p-5 border border-orange-200 bg-orange-50/50 rounded-2xl relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-orange-500/10 rounded-full blur-xl"></div>
                    <div className="font-bold text-lg text-slate-800">{d.issue}</div>
                    <div className="text-sm text-slate-600 mt-1">{d.village} • <span className="font-bold text-orange-600">{d.cases} cases reported</span></div>
                    <div className="mt-4 pt-4 border-t border-orange-200/50 text-xs font-bold uppercase text-orange-700 tracking-wider">
                      Status: {d.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* NCD */}
          <TabsContent value="ncd" className="space-y-6">
            <div className="glass-card p-6 shadow-xl">
              <h3 className="text-xl font-bold text-slate-800 font-display mb-6">NCD High-Risk Individuals</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-slate-600 text-sm">
                      <th className="p-4">Patient Name</th>
                      <th className="p-4">Age</th>
                      <th className="p-4">Screening Result</th>
                      <th className="p-4 text-right">Action Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mockNcd.map(n => (
                      <tr key={n.id} className="hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-800">{n.name}</td>
                        <td className="p-4 text-slate-600">{n.age}</td>
                        <td className="p-4 text-red-600 font-bold">{n.issue}</td>
                        <td className="p-4 text-right text-slate-600 font-medium">{n.followup}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* GEO MAP LEAFLET */}
          <TabsContent value="geo" className="space-y-6 h-[700px]">
            <div className="glass-card p-6 shadow-xl h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800 font-display flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-primary" /> District Geo-Surveillance
                </h3>
                <div className="flex gap-4 text-sm font-semibold">
                  <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-pink-500"></span> Maternal High-Risk</div>
                  <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Disease Clusters</div>
                  <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> NCD Screening</div>
                </div>
              </div>
              <div className="flex-1 w-full rounded-2xl overflow-hidden border border-slate-200 relative z-0">
                <MapContainer center={[12.95, 77.6]} zoom={11} style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {mockHeatmapData.map((pt) => {
                    const color = pt.type === 'maternal' ? '#ec4899' : pt.type === 'disease' ? '#f97316' : '#3b82f6';
                    return (
                      <CircleMarker
                        key={pt.id}
                        center={[pt.lat, pt.lng]}
                        radius={Math.min(Math.max(pt.count * 1.5, 10), 40)}
                        pathOptions={{ fillColor: color, color: color, fillOpacity: 0.6, weight: 2 }}
                      >
                        <LeafletTooltip>
                          <div className="font-body text-slate-800 text-sm p-1">
                            <strong>{pt.village}</strong><br/>
                            {pt.count} {pt.type} alerts
                          </div>
                        </LeafletTooltip>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}

// KPI Helper
function KPI({ title, value, icon: Icon, color, trend }: any) {
  const colorMap: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    red: "bg-red-50 text-red-600 border-red-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    pink: "bg-pink-50 text-pink-600 border-pink-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };
  
  return (
    <div className="glass-card p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-3xl font-display font-bold text-slate-800 mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl border ${colorMap[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {trend && (
        <div className={`mt-4 flex items-center text-sm font-bold ${trend.startsWith('-') && color !== 'red' ? 'text-red-500' : 'text-emerald-500'}`}>
          {trend} <span className="ml-2 font-normal text-slate-500">vs last month</span>
        </div>
      )}
    </div>
  );
}
