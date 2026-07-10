import React, { useState, useMemo, useRef } from 'react';
import {
  UploadCloud, Search, Cpu, HardDrive,
  Battery, ShieldAlert, ShieldCheck, Laptop, RotateCw, X, Activity, AlertCircle, CheckCircle2
} from 'lucide-react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

// Función robusta para parsear CSV manual sin dependencias
const parseCSV = (csvText) => {
  const lines = csvText.split('\n');
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const results = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const currentline = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const obj = {};
    headers.forEach((header, j) => {
      let val = currentline[j] ? currentline[j].replace(/^"|"$/g, '').trim() : '';
      obj[header] = val;
    });
    results.push(obj);
  }
  return results;
};

const parsePercent = (val) => {
  if (!val) return 0;
  return parseFloat(val.toString().replace('%', '')) || 0;
};

export default function App() {
  const [rawData, setRawData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const data = parseCSV(text);
        setRawData(data);
      };
      reader.readAsText(file);
    }
  };

  const assets = useMemo(() => {
    return rawData.map(item => ({
      id: item['ID de activo'],
      name: item['Activo'],
      user: item['Nombre del responsable'],
      manufacturer: item['Fabricante'],
      model: item['Modelo'],
      cpuName: item['Modelo de CPU'] || item['Procesador'],
      cpuUsage: parsePercent(item['Uso de CPU (promedio de 30 días)']),
      ramUsage: parsePercent(item['Uso de RAM (promedio de 30 días)']),
      ramSize: item['Tamaño de RAM'],
      batteryHealth: parsePercent(item['Estado de salud de la batería (%)']) || 100,
      serial: item['Número de serie (Predeterminado)'],
      rebootPending: item['Tiene reinicio pendiente'] === 'True' || item['Tiene reinicio pendiente'] === 'Verdadero',
      encryption: item['Estado de cifrado'],
      antivirus: item['Estado del antivirus'],
      lastReport: item['Último reporte'],
      bios: item['Versión de BIOS'],
      os: item['Sistema operativo']
    })).filter(a => a.id);
  }, [rawData]);

  const kpis = useMemo(() => {
    if (assets.length === 0) return null;
    return {
      total: assets.length,
      criticalPerformance: assets.filter(a => a.cpuUsage > 80 || a.ramUsage > 85).length,
      pendingReboots: assets.filter(a => a.rebootPending).length,
      securityWarnings: assets.filter(a => a.encryption !== 'Activado' && a.encryption !== 'Cifrado').length,
    };
  }, [assets]);

  const manufacturerData = useMemo(() => {
    const counts = {};
    assets.forEach(a => {
      const m = a.manufacturer || 'Desconocido';
      counts[m] = (counts[m] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [assets]);

  // Paleta de colores vivos para el gráfico de anillo (Donut)
  const PIE_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

  const scatterData = useMemo(() => {
    return assets.map(a => ({
      name: a.name,
      cpu: a.cpuUsage,
      ram: a.ramUsage,
      // Color rojo pastel para críticos, azul para normales
      fill: (a.cpuUsage > 80 || a.ramUsage > 85) ? '#ef4444' : '#3b82f6'
    }));
  }, [assets]);

  const filteredAssets = useMemo(() => {
    if (!searchTerm) return assets;
    const lower = searchTerm.toLowerCase();
    return assets.filter(a =>
      (a.serial && a.serial.toLowerCase().includes(lower)) ||
      (a.name && a.name.toLowerCase().includes(lower)) ||
      (a.user && a.user.toLowerCase().includes(lower))
    );
  }, [assets, searchTerm]);

  const renderKPIs = () => {
    if (!kpis) return null;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-5">
          <div className="p-4 bg-indigo-50 rounded-xl text-indigo-600">
            <Laptop size={28} strokeWidth={2} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Activos Monitoreados</p>
            <p className="text-3xl font-bold text-slate-800">{kpis.total} <span className="text-base font-normal text-slate-400">und.</span></p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-5">
          <div className="p-4 bg-rose-50 rounded-xl text-rose-600">
            <Activity size={28} strokeWidth={2} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Alertas Rendimiento</p>
            <p className="text-3xl font-bold text-slate-800">{kpis.criticalPerformance} <span className="text-base font-normal text-slate-400">equipos</span></p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-5">
          <div className="p-4 bg-amber-50 rounded-xl text-amber-600">
            <RotateCw size={28} strokeWidth={2} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Reinicios Pendientes</p>
            <p className="text-3xl font-bold text-slate-800">{kpis.pendingReboots} <span className="text-base font-normal text-slate-400">equipos</span></p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-5">
          <div className="p-4 bg-emerald-50 rounded-xl text-emerald-600">
            <ShieldAlert size={28} strokeWidth={2} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Riesgos de Seguridad</p>
            <p className="text-3xl font-bold text-slate-800">{kpis.securityWarnings} <span className="text-base font-normal text-slate-400">alertas</span></p>
          </div>
        </div>
      </div>
    );
  };

  return (
    // Fondo claro slate-50
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">

      {/* HEADER TIPO DASHBOARD LIMPIO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-200">
            <Activity size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Dashboard Inteligente de Telemetría
            </h1>
            <p className="text-slate-500 text-sm mt-1">Análisis operativo y rendimiento en tiempo real</p>
          </div>
        </div>

        <div className="mt-4 md:mt-0 flex gap-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            ref={fileInputRef}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium transition-all shadow-md shadow-blue-200"
          >
            <UploadCloud size={20} />
            Cargar Reporte CSV
          </button>
        </div>
      </header>

      {assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed border-slate-200 rounded-3xl bg-white shadow-sm">
          <div className="p-6 bg-slate-50 rounded-full mb-4">
            <Laptop size={48} className="text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-700">Aún no hay datos de inventario</h2>
          <p className="text-slate-500 mt-2 text-center max-w-md">Sube tu archivo CSV exportado desde tu MDM o sistema de gestión para visualizar las métricas dinámicas.</p>
        </div>
      ) : (
        <>
          {renderKPIs()}

          {/* ZONA DE GRÁFICOS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

            {/* Gráfico 1: Rendimiento */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Cpu className="text-blue-500" size={20} />
                <h3 className="text-lg font-bold text-slate-800">Matriz de Rendimiento (CPU vs RAM)</h3>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" dataKey="cpu" name="CPU" unit="%" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis type="number" dataKey="ram" name="RAM" unit="%" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <RechartsTooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Scatter name="Activos" data={scatterData}>
                      {scatterData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 2: Fabricantes */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <HardDrive className="text-indigo-500" size={20} />
                <h3 className="text-lg font-bold text-slate-800">Variedad por Fabricante</h3>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={manufacturerData}
                      cx="50%"
                      cy="45%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="count"
                      stroke="none"
                    >
                      {manufacturerData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#334155', fontWeight: 'bold' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', color: '#64748b' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* BUSCADOR DE SERIALES / DATA TABLE */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Search className="text-slate-400" size={20} />
                Explorador de Activos
              </h3>
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Buscar código, usuario o activo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400 text-slate-700"
                />
                <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-white">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 font-semibold bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">ACTIVO / SERIAL</th>
                    <th className="px-6 py-4">RESPONSABLE</th>
                    <th className="px-6 py-4">USO CPU (30D)</th>
                    <th className="px-6 py-4">USO RAM (30D)</th>
                    <th className="px-6 py-4 text-center">ESTADO</th>
                    <th className="px-6 py-4 text-right">ACCIÓN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{asset.name}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5 bg-slate-100 inline-block px-2 py-0.5 rounded">{asset.serial}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {asset.user || 'Sin asignar'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`w-10 font-medium ${asset.cpuUsage > 80 ? 'text-rose-600' : 'text-slate-700'}`}>
                            {asset.cpuUsage.toFixed(0)}%
                          </span>
                          <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${asset.cpuUsage > 80 ? 'bg-rose-500' : 'bg-blue-500'}`}
                              style={{ width: `${Math.min(asset.cpuUsage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`w-10 font-medium ${asset.ramUsage > 85 ? 'text-rose-600' : 'text-slate-700'}`}>
                            {asset.ramUsage.toFixed(0)}%
                          </span>
                          <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${asset.ramUsage > 85 ? 'bg-rose-500' : 'bg-indigo-400'}`}
                              style={{ width: `${Math.min(asset.ramUsage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          {asset.rebootPending ? (
                            <span title="Reinicio Pendiente" className="flex items-center justify-center w-8 h-8 bg-amber-50 text-amber-600 rounded-full">
                              <RotateCw size={16} />
                            </span>
                          ) : <span className="w-8 h-8 flex items-center justify-center text-slate-200"><CheckCircle2 size={16} /></span>}

                          {asset.encryption !== 'Activado' && asset.encryption !== 'Cifrado' ? (
                            <span title="Sin Cifrado" className="flex items-center justify-center w-8 h-8 bg-rose-50 text-rose-600 rounded-full">
                              <ShieldAlert size={16} />
                            </span>
                          ) : <span className="w-8 h-8 flex items-center justify-center text-slate-200"><CheckCircle2 size={16} /></span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedAsset(asset)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-bold bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAssets.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                        No se encontraron resultados para la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedAsset && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Cabecera Modal */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Laptop size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {selectedAsset.name}
                  </h2>
                  <p className="text-slate-500 text-sm font-mono mt-0.5">S/N: {selectedAsset.serial}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cuerpo Modal */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Columna Izquierda: Info Hardware */}
                <div className="space-y-5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Especificaciones de Hardware</h4>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Responsable</p>
                      <p className="font-semibold text-slate-800">{selectedAsset.user || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Modelo / Fabricante</p>
                      <p className="font-semibold text-slate-800">{selectedAsset.manufacturer} {selectedAsset.model}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Procesador</p>
                      <p className="font-semibold text-slate-800 text-sm">{selectedAsset.cpuName}</p>
                    </div>
                    <div className="flex gap-6">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">RAM</p>
                        <p className="font-semibold text-slate-800">{selectedAsset.ramSize}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Sistema Operativo</p>
                        <p className="font-semibold text-slate-800 text-sm truncate max-w-[120px]" title={selectedAsset.os}>{selectedAsset.os}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Salud y Telemetría */}
                <div className="space-y-5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Métricas de Salud Operativa</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                      <p className="text-xs text-slate-500 flex justify-center items-center gap-1 mb-2"><Cpu size={14} /> CPU 30 Días</p>
                      <p className={`text-2xl font-bold ${selectedAsset.cpuUsage > 80 ? 'text-rose-600' : 'text-blue-600'}`}>
                        {selectedAsset.cpuUsage.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                      <p className="text-xs text-slate-500 flex justify-center items-center gap-1 mb-2"><Activity size={14} /> RAM 30 Días</p>
                      <p className={`text-2xl font-bold ${selectedAsset.ramUsage > 85 ? 'text-rose-600' : 'text-indigo-600'}`}>
                        {selectedAsset.ramUsage.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mt-2">
                    <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg text-sm">
                      <span className="text-slate-600 font-medium flex items-center gap-2">
                        {selectedAsset.encryption === 'Activado' || selectedAsset.encryption === 'Cifrado' ? <ShieldCheck size={18} className="text-emerald-500" /> : <ShieldAlert size={18} className="text-rose-500" />}
                        Cifrado de Disco
                      </span>
                      <span className="font-bold text-slate-800">{selectedAsset.encryption || 'Desconocido'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg text-sm">
                      <span className="text-slate-600 font-medium flex items-center gap-2">
                        <RotateCw size={18} className={selectedAsset.rebootPending ? 'text-amber-500' : 'text-slate-400'} />
                        Estado de Reinicio
                      </span>
                      <span className={`font-bold ${selectedAsset.rebootPending ? 'text-amber-600' : 'text-slate-800'}`}>
                        {selectedAsset.rebootPending ? 'Pendiente' : 'Al día'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg text-sm">
                      <span className="text-slate-600 font-medium flex items-center gap-2">
                        <Battery size={18} className={selectedAsset.batteryHealth < 50 ? 'text-rose-500' : 'text-emerald-500'} />
                        Salud de Batería
                      </span>
                      <span className="font-bold text-slate-800">{selectedAsset.batteryHealth}%</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 flex justify-between items-center font-medium">
              <span>Versión BIOS: {selectedAsset.bios}</span>
              <span>Último reporte: {new Date(selectedAsset.lastReport).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}