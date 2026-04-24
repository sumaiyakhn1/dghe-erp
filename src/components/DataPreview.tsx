import React, { useState, useEffect } from 'react';
import { Search, Check, Loader2, PlayCircle, Edit3 } from 'lucide-react';
import { ERP_FIELDS, INITIAL_PAYLOAD_DEFAULTS } from '../constants/erpFields';
import { formatExcelDate } from '../utils/excelUtils';
import { addStudent } from '../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';

interface DataPreviewProps {
  data: any[];
  mappings: Record<string, string>;
  erpCourseInfo?: { name: string, stream: string } | null;
}

export const DataPreview: React.FC<DataPreviewProps> = ({ data, mappings, erpCourseInfo }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMap, setStatusMap] = useState<Record<number, 'idle' | 'loading' | 'success' | 'error'>>({});
  const [errorMessages, setErrorMessages] = useState<Record<number, string>>({});
  
  // workingData stores the ACTUAL VALUES for each student, not just the excel row
  const [workingData, setWorkingData] = useState<any[]>([]);

  // Initialize workingData with mapped values and user business rules
  useEffect(() => {
    const initialized = data.map((rawRow) => {
      const student: any = {};
      
      // 1. Basic Mapping from Excel for all fields
      ERP_FIELDS.forEach(field => {
        const excelHeader = mappings[field.key];
        const rawValue = excelHeader ? rawRow[excelHeader] : '';
        
        // Explicitly convert to string and trim
        student[field.key] = rawValue !== undefined && rawValue !== null ? String(rawValue).trim() : '';
        
        // Special cleanup for numeric phone/regNo strings that might have ".0" from Excel
        if (['phone', 'regNo'].includes(field.key) && student[field.key].endsWith('.0')) {
          student[field.key] = student[field.key].replace('.0', '');
        }
      });

      // 2. Data Normalization & Specific Rules
      
      // Gender: normalize to full words if possible
      // Gender: robust normalization to "Male" or "Female"
      if (student.gender) {
        const v = String(student.gender).toUpperCase().trim();
        if (v.startsWith('F')) student.gender = 'Female';
        else if (v.startsWith('M')) student.gender = 'Male';
      } else {
        student.gender = 'Male'; // Basic fallback if totally missing
      }

      // DOB/DOA Formatting
      if (student.dob) student.dob = formatExcelDate(student.dob);
      if (student.doa) student.doa = formatExcelDate(student.doa);
      else student.doa = new Date().toISOString();

      // 3. New Business Rules & Automated Logic
      
      // A. Mother's Name fallback
      if (!student.motherName) student.motherName = 'NA';
      
      // B. Batch & Section defaults
      if (!student.batch) student.batch = 'Sem 1';
      if (!student.section) student.section = 'A';

      // C. Category (Scheme) Logic: Aggressive search for "AIDED" in the row
      const searchStr = JSON.stringify(rawRow).toUpperCase();
      const isFemale = String(student.gender || '').toLowerCase().includes('female');
      const isAided = searchStr.includes('AIDED'); 

      if (isAided) {
        student.category = isFemale ? 'GIA Girls' : 'GIA Boys';
      } else {
        student.category = isFemale ? 'SFS Girls' : 'SFS Boys';
      }
      
      // D. Final Override: Standardization for ERP Target
      if (erpCourseInfo) {
        student.course = erpCourseInfo.name;
        student.stream = erpCourseInfo.stream;
      } else {
        if (!student.course) student.course = 'Bachelor of Arts';
        student.stream = student.course;
      }

      return student;
    });
    setWorkingData(initialized);
  }, [data, mappings]);

  const filteredIndices = workingData
    .map((student, originalIndex) => ({ student, originalIndex }))
    .filter(({ student }) => {
      if (!searchTerm) return true;
      return Object.values(student).some((val) => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .slice(0, 50);

  const handleCellEdit = (index: number, key: string, newValue: string) => {
    setWorkingData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: newValue };
      return updated;
    });
  };

  const handleAddToERP = async (originalIndex: number) => {
    const student = workingData[originalIndex];
    setStatusMap(prev => ({ ...prev, [originalIndex]: 'loading' }));
    
    try {
      const payload = { ...INITIAL_PAYLOAD_DEFAULTS, ...student };
      await addStudent(payload);
      setStatusMap(prev => ({ ...prev, [originalIndex]: 'success' }));
    } catch (error: any) {
      setStatusMap(prev => ({ ...prev, [originalIndex]: 'error' }));
      setErrorMessages(prev => ({ ...prev, [originalIndex]: error?.response?.data?.message || (typeof error === 'string' ? error : 'API Error') }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px', overflow: 'hidden' }}>
      {/* Search Header */}
      <div style={{ padding: '32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)' }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', marginBottom: '4px' }}>
              <Edit3 size={14} />
              <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Manual Review & Edit</span>
           </div>
           <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Active Buffer Staging</h3>
        </div>
        
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search records..."
            className="input-field"
            style={{ paddingLeft: '44px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid Container */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ minWidth: '1000px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'center', width: '60px' }}>#</th>
              {ERP_FIELDS.map(field => (
                <th key={field.key} style={{ whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span>{field.label}</span>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{field.key}</span>
                  </div>
                </th>
              ))}
              <th style={{ 
                textAlign: 'right', 
                position: 'sticky', 
                right: 0, 
                backgroundColor: 'var(--bg-main)', 
                boxShadow: '-4px 0 10px rgba(0,0,0,0.05)',
                zIndex: 10
              }}>EXECUTION</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {filteredIndices.map(({ student, originalIndex }) => {
                const status = statusMap[originalIndex] || 'idle';
                
                return (
                  <motion.tr 
                    key={originalIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ 
                      background: status === 'success' ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                      transition: 'background 0.3s'
                    }}
                  >
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{originalIndex + 1}</td>
                    {ERP_FIELDS.map(field => (
                      <td key={field.key} style={{ padding: '4px', minWidth: '120px' }}>
                        <input 
                          type="text"
                          value={student[field.key]}
                          onChange={(e) => handleCellEdit(originalIndex, field.key, e.target.value)}
                          disabled={status === 'success' || status === 'loading'}
                          style={{
                            width: '100%',
                            background: 'transparent',
                            border: '1px solid transparent',
                            color: 'var(--text-primary)',
                            padding: '8px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 600,
                            outline: 'none',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => { e.target.style.background = 'rgba(255,255,255,0.02)'; e.target.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                          onBlur={(e) => { e.target.style.background = 'transparent'; e.target.style.borderColor = 'transparent'; }}
                        />
                      </td>
                    ))}
                    <td style={{ 
                      textAlign: 'right', 
                      position: 'sticky', 
                      right: 0, 
                      backgroundColor: 'var(--bg-card)', 
                      boxShadow: '-4px 0 10px rgba(0,0,0,0.05)',
                      zIndex: 10
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 8px' }}>
                        {status === 'success' ? (
                          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: 900 }}>
                            <Check size={12} style={{ marginRight: '4px' }} /> PUSHED
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '4px' }}>
                            <button
                              disabled={status === 'loading'}
                              onClick={() => handleAddToERP(originalIndex)}
                              className="btn-primary"
                              style={{ padding: '8px 16px', fontSize: '11px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              {status === 'loading' ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <PlayCircle size={12} />
                              )}
                              {status === 'error' ? 'RETRY' : 'ADD_REC'}
                            </button>
                            {status === 'error' && (
                              <span style={{ fontSize: '8px', color: '#ef4444', fontWeight: 800, maxWidth: '100px', overflow: 'hidden' }}>
                                {errorMessages[originalIndex]}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      
      {/* Buffer Status */}
      <div style={{ padding: '16px 32px', background: 'var(--bg-main)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', margin: 0, letterSpacing: '1px' }}>B_BATCH_050</p>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }}></div>
            <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--accent)' }}>SYNC_READY</span>
         </div>
      </div>
    </div>
  );
};
