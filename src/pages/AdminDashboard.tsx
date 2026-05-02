import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, AlertTriangle, Activity, MapPin, LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { GoogleMap, useJsApiLoader, Circle, InfoWindow } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

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
  { id: 1, lat: 12.9716, lng: 77.5946, count: 25, village: "North Block" },
  { id: 2, lat: 12.9352, lng: 77.6245, count: 42, village: "Koramangala South" },
  { id: 3, lat: 13.0100, lng: 77.5500, count: 15, village: "Yeshwanthpur Area" },
  { id: 4, lat: 12.9100, lng: 77.6000, count: 85, village: "BTM Layout Zone" },
  { id: 5, lat: 12.9600, lng: 77.6500, count: 12, village: "Indiranagar Post" },
];

const mockAshaWorkers = [
  { id: "AW-1042", name: "Sunita Devi", phone: "+91 9876543210", village: "North Block", patients: 142, highRisk: 12, status: "Active" },
  { id: "AW-1043", name: "Kamla Bai", phone: "+91 9876543211", village: "Koramangala South", patients: 89, highRisk: 5, status: "Offline" },
  { id: "AW-1044", name: "Rekha Sharma", phone: "+91 9876543212", village: "Yeshwanthpur Area", patients: 210, highRisk: 24, status: "Active" },
  { id: "AW-1045", name: "Pooja Patel", phone: "+91 9876543213", village: "BTM Layout Zone", patients: 156, highRisk: 18, status: "Active" },
  { id: "AW-1046", name: "Anita Kumari", phone: "+91 9876543214", village: "Indiranagar Post", patients: 94, highRisk: 2, status: "Active" },
];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 12.95,
  lng: 77.6
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });
  
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<typeof mockHeatmapData[0] | null>(null);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col font-body">
      {/* Top Navbar */}
      <header className="h-16 w-full bg-white/70 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-display font-bold text-slate-800">Sakhi Admin Command Center</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">Super Admin</span>
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/login")}>
            <LogOut className="h-5 w-5 text-slate-600" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto w-full max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <div className="glass-card p-6 flex flex-col justify-between shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Active ASHA Workers</p>
                <h3 className="text-3xl font-display font-bold text-slate-800 mt-2">1,248</h3>
              </div>
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-emerald-600">
              <span className="font-bold">+12%</span>
              <span className="ml-2 text-slate-500">from last month</span>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Visits Completed Today</p>
                <h3 className="text-3xl font-display font-bold text-slate-800 mt-2">8,452</h3>
              </div>
              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-100">
                <Activity className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-emerald-600">
              <span className="font-bold">+5%</span>
              <span className="ml-2 text-slate-500">vs yesterday</span>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between shadow-lg border-l-4 border-l-destructive">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">High Risk Alerts Pending</p>
                <h3 className="text-3xl font-display font-bold text-destructive mt-2">103</h3>
              </div>
              <div className="p-3 bg-red-50/80 rounded-xl border border-red-100">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-destructive">
              <span className="font-bold">+15%</span>
              <span className="ml-2 text-slate-500">needs immediate attention</span>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Sync Status</p>
                <h3 className="text-2xl font-display font-bold text-slate-800 mt-2">99.8%</h3>
              </div>
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
                <Activity className="h-6 w-6 text-slate-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
              <span>All blocks synced 5 mins ago</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="glass-card p-6 flex flex-col h-[500px] shadow-xl lg:col-span-1">
            <h3 className="text-lg font-bold text-slate-800 mb-6 font-display">Weekly Visit Trends</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(220, 80%, 50%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(220, 80%, 50%)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }}/>
                  <Area type="monotone" dataKey="visits" name="Total Visits" stroke="hsl(220, 80%, 50%)" fillOpacity={1} fill="url(#colorVisits)" strokeWidth={3} />
                  <Area type="monotone" dataKey="highRisk" name="High Risk" stroke="hsl(0, 84%, 60%)" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2 glass-card p-6 flex flex-col h-[500px] shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> High-Risk Heatmap (Google Maps)
              </h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">Real-time geographic distribution of critical cases across the blocks.</p>
            
            <div className="flex-1 w-full rounded-2xl overflow-hidden border border-slate-200 relative z-10 shadow-inner bg-slate-100">
              {!GOOGLE_MAPS_API_KEY ? (
                <div className="flex items-center justify-center h-full w-full text-slate-500 flex-col gap-3 p-6 text-center">
                  <MapPin className="h-10 w-10 text-slate-400" />
                  <p className="font-bold text-lg text-slate-700">Google Maps API Key Missing</p>
                  <p className="text-sm max-w-md">Please open your <code>.env</code> file and set <code>VITE_GOOGLE_MAPS_API_KEY</code> to your valid API key to view the map.</p>
                </div>
              ) : isLoaded ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={center}
                  zoom={11}
                  options={mapOptions}
                  onLoad={onLoad}
                  onUnmount={onUnmount}
                >
                  {mockHeatmapData.map(point => {
                    const radius = Math.min(point.count * 80, 2000);
                    const color = point.count > 50 ? '#ef4444' : point.count > 20 ? '#f59e0b' : '#3b82f6';
                    return (
                      <Circle
                        key={point.id}
                        center={{ lat: point.lat, lng: point.lng }}
                        radius={radius}
                        options={{
                          fillColor: color,
                          fillOpacity: 0.6,
                          strokeColor: color,
                          strokeOpacity: 0.8,
                          strokeWeight: 1,
                        }}
                        onClick={() => setSelectedPoint(point)}
                      />
                    );
                  })}

                  {selectedPoint && (
                    <InfoWindow
                      position={{ lat: selectedPoint.lat, lng: selectedPoint.lng }}
                      onCloseClick={() => setSelectedPoint(null)}
                    >
                      <div className="font-body p-2 text-slate-800 min-w-[120px]">
                        <div className="font-bold text-base mb-1">{selectedPoint.village}</div>
                        <div className="text-sm text-slate-600">{selectedPoint.count} High Risk Cases</div>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              ) : (
                <div className="flex items-center justify-center h-full w-full text-slate-500">
                  Loading Map Component...
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ASHA Workers DB Directory */}
        <div className="mt-8 glass-card p-6 shadow-xl mb-12">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
            <h3 className="text-xl font-bold text-slate-800 font-display flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" /> ASHA Workers Directory
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search worker by name, ID or phone..." className="pl-9 w-full md:w-[300px] bg-white/70 border-slate-200 shadow-sm" />
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/40">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-slate-50/80">
                <tr className="border-b border-slate-200 text-sm text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Worker ID</th>
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Phone</th>
                  <th className="py-4 px-6">Village / Block</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-center">Patients</th>
                  <th className="py-4 px-6 text-center">High Risk</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {mockAshaWorkers.map(worker => (
                  <tr key={worker.id} className="hover:bg-white/60 transition-colors">
                    <td className="py-4 px-6 font-mono text-slate-500 font-medium">{worker.id}</td>
                    <td className="py-4 px-6 font-bold text-slate-800 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {worker.name.charAt(0)}
                      </div>
                      {worker.name}
                    </td>
                    <td className="py-4 px-6 text-slate-600">{worker.phone}</td>
                    <td className="py-4 px-6 text-slate-600">{worker.village}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${worker.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {worker.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center font-medium text-slate-800">{worker.patients}</td>
                    <td className="py-4 px-6 text-center text-destructive font-bold">{worker.highRisk}</td>
                    <td className="py-4 px-6 text-right">
                      <Button variant="outline" size="sm" className="h-8 bg-white/60 hover:bg-white text-slate-700">Inspect Data</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
