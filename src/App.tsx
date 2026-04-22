import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import { FileUpload } from './components/FileUpload';
import { MappingSelector } from './components/MappingSelector';
import { DataPreview } from './components/DataPreview';
import { ERP_FIELDS } from './constants/erpFields';
import { autoMapFields } from './utils/excelUtils';
import { LoginForm } from './components/LoginForm';
import { getAuthToken, logout as authLogout } from './utils/auth';
import {
  ArrowRight,
  Sparkles,
  User,
  FileSpreadsheet,
  Layers,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

type Step = 'auth' | 'upload' | 'map' | 'preview';

function App() {
  const [excelData, setExcelData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [activeStep, setActiveStep] = useState<Step>('auth');
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken());

  useEffect(() => {
    if (isAuthenticated) {
      if (excelData.length > 0) {
        if (activeStep === 'auth' || activeStep === 'upload') setActiveStep('map');
      } else {
        if (activeStep === 'auth') setActiveStep('upload');
      }
    } else {
      setActiveStep('auth');
    }
  }, [isAuthenticated, excelData.length]);

  const handleLogout = () => {
    authLogout();
    setIsAuthenticated(false);
    handleReset();
  };

  const handleDataLoaded = useCallback((newHeaders: string[], newData: any[], name: string) => {
    setHeaders(newHeaders);
    setExcelData(newData);
    setFileName(name);
    setActiveStep('map');

    const autoMappings = autoMapFields(newHeaders, ERP_FIELDS);
    setMappings(autoMappings);
  }, []);

  const handleReset = () => {
    setExcelData([]);
    setHeaders([]);
    setFileName(null);
    setActiveStep('upload');
  };

  const handleMappingChange = (erpKey: string, excelHeader: string) => {
    setMappings(prev => ({ ...prev, [erpKey]: excelHeader }));
  };

  const isMappingValid = () => {
    return ERP_FIELDS
      .filter(f => f.required)
      .every(f => !!mappings[f.key]);
  };

  const steps = [
    { id: 'auth', label: 'Identity', icon: ShieldCheck },
    { id: 'upload', label: 'Source', icon: FileSpreadsheet },
    { id: 'map', label: 'Mapping', icon: Layers },
    { id: 'preview', label: 'Gateway', icon: CheckCircle2 },
  ];

  return (
    <div className="app-shell">
      <div className="dashboard-container">

        {/* Sidebar Indicator */}
        <aside className="sidebar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px 40px' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color="white" />
            </div>
            <span style={{ fontWeight: 900, letterSpacing: '1px', fontSize: '15px' }}>DGHE BRIDGE</span>
          </div>

          {steps.map((s, idx) => {
            const Icon = s.icon;
            const stepIdx = steps.findIndex(x => x.id === activeStep);
            const isActive = activeStep === s.id;
            const isCompleted = stepIdx > idx;

            return (
              <div key={s.id} className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                <div className="step-icon">
                  {isCompleted ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                </div>
                <div className="step-label">{s.label}</div>
              </div>
            );
          })}

          {isAuthenticated && (
            <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={14} color="var(--text-muted)" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800 }}>ADM_SYSTEM</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>ONLINE_ACTIVE</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn-secondary"
                style={{ width: '100%', fontSize: '11px' }}
              >
                DISCONNECT
              </button>
            </div>
          )}
        </aside>

        {/* Dynamic Space Area */}
        <main className="main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            >
              <div style={{ width: '100%', maxWidth: '1000px' }}>
                {activeStep === 'auth' && <LoginForm onSuccess={() => setIsAuthenticated(true)} />}

                {activeStep === 'upload' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <h1 style={{ fontSize: '42px', fontWeight: 900, marginBottom: '8px' }}>Secure Ingestion</h1>
                      <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Upload Excel buffer for ERP synchronization.</p>
                    </div>
                    <FileUpload onDataLoaded={handleDataLoaded} onReset={handleReset} fileName={fileName} />
                  </div>
                )}

                {activeStep === 'map' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '24px 32px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '56px', height: '56px', background: 'var(--accent)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileSpreadsheet color="white" />
                        </div>
                        <div>
                          <p style={{ fontSize: '10px', fontWeight: 900, color: 'var(--accent)', margin: 0 }}>ACTIVE BUFFER</p>
                          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>{fileName}</h2>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={handleReset} className="btn-secondary">Change Source</button>
                        <button
                          disabled={!isMappingValid()}
                          onClick={() => setActiveStep('preview')}
                          className="btn-primary"
                        >
                          Continue to Gateway
                        </button>
                      </div>
                    </div>
                    <MappingSelector excelHeaders={headers} mappings={mappings} onMappingChange={handleMappingChange} />
                  </div>
                )}

                {activeStep === 'preview' && (
                  <div style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button onClick={() => setActiveStep('map')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> BACK TO MAPPING
                      </button>
                      <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)' }}>STAGING_BUFFER_v2</span>
                    </div>
                    <DataPreview data={excelData} mappings={mappings} />
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
}

export default App;
