import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import { FileUpload } from './components/FileUpload';
import { MappingSelector } from './components/MappingSelector';
import { DataPreview } from './components/DataPreview';
import { getAuthToken, logout as authLogout, getCourses } from './utils/auth';
import { ERP_FIELDS, INITIAL_PAYLOAD_DEFAULTS } from './constants/erpFields';
import { autoMapFields } from './utils/excelUtils';
import { LoginForm } from './components/LoginForm';
import {
  ArrowRight,
  Sparkles,
  User,
  FileSpreadsheet,
  Layers,
  CheckCircle2,
  ShieldCheck,
  Loader2
} from 'lucide-react';

type Step = 'auth' | 'upload' | 'map' | 'preview';

function App() {
  const [excelData, setExcelData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [activeStep, setActiveStep] = useState<Step>('auth');
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken());
  const [erpCourses, setErpCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [courseInfo, setCourseInfo] = useState<{ name: string, stream: string } | null>(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      if (excelData.length > 0) {
        if (activeStep === 'auth' || activeStep === 'upload') setActiveStep('map');
      } else {
        if (activeStep === 'auth') setActiveStep('upload');
      }
      
      // Fetch ERP Courses
      const fetchCourses = async () => {
        try {
          setIsLoadingCourses(true);
          const response = await getCourses(INITIAL_PAYLOAD_DEFAULTS.entity, INITIAL_PAYLOAD_DEFAULTS.session);
          setErpCourses(Array.isArray(response.data) ? response.data : (response.data.data || []));
        } catch (error) {
          console.error("Error fetching courses:", error);
        } finally {
          setIsLoadingCourses(false);
        }
      };
      fetchCourses();
    } else {
      setActiveStep('auth');
    }
  }, [isAuthenticated, excelData.length]);

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
    if (!courseId) {
      setCourseInfo(null);
      return;
    }

    const course = erpCourses.find(c => c._id === courseId);
    if (course) {
      setCourseInfo({
        name: course.name,
        stream: course.name
      });
    }
  };

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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-card)', padding: '24px 32px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                       <div>
                          <p style={{ fontSize: '10px', fontWeight: 900, color: 'var(--accent)', marginBottom: '8px', textTransform: 'uppercase' }}>ERP Global Override</p>
                          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px 0' }}>Select Target ERP Course</h3>
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            {isLoadingCourses ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <Loader2 size={18} className="animate-spin" color="var(--accent)" />
                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Synchronizing ERP Course List...</span>
                              </div>
                            ) : (
                              <select 
                                value={selectedCourseId} 
                                onChange={(e) => handleCourseSelect(e.target.value)}
                                className="input-field"
                                style={{ flex: 1, maxWidth: '400px' }}
                              >
                                <option value="">-- Select Course From ERP --</option>
                                {erpCourses.map(c => (
                                  <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                              </select>
                            )}
                            {courseInfo && (
                              <div style={{ padding: '12px 24px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div>
                                  <span style={{ fontSize: '9px', fontWeight: 900, color: '#059669', display: 'block', marginBottom: '2px' }}>ERP TARGET (COURSE & STREAM)</span>
                                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>{courseInfo.name}</span>
                                </div>
                                <div style={{ width: '1px', height: '24px', background: 'rgba(16, 185, 129, 0.2)' }}></div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669' }}>
                                  <CheckCircle2 size={14} />
                                  <span style={{ fontSize: '10px', fontWeight: 900 }}>SYNCED</span>
                                </div>
                              </div>
                            )}
                          </div>
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
                    <DataPreview data={excelData} mappings={mappings} erpCourseInfo={courseInfo} />
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
