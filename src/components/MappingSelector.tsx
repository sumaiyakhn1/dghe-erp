import React from 'react';
import { ERP_FIELDS } from '../constants/erpFields';
import { CheckCircle2, ChevronDown, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface MappingSelectorProps {
  excelHeaders: string[];
  mappings: Record<string, string>;
  onMappingChange: (erpKey: string, excelHeader: string) => void;
}

export const MappingSelector: React.FC<MappingSelectorProps> = ({ excelHeaders, mappings, onMappingChange }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
      {ERP_FIELDS.map((field, idx) => {
        const isAuto = ['stream', 'batch', 'section'].includes(field.key);
        const autoValue = field.key === 'section' ? 'A' : (field.key === 'batch' ? 'Sem 1' : 'Same as Course');
        const isMapped = !!mappings[field.key];
        
        return (
          <motion.div 
            key={field.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.02 }}
            style={{
              position: 'relative',
              padding: '24px',
              borderRadius: '24px',
              background: isMapped ? 'rgba(37, 99, 235, 0.03)' : 'var(--bg-card)',
              border: isMapped ? '1px solid rgba(37, 99, 235, 0.2)' : '1px solid var(--border)',
              transition: 'all 0.3s'
            }}
          >
            {isMapped && (
              <div style={{ position: 'absolute', top: '24px', right: '24px', color: 'var(--accent)' }}>
                <CheckCircle2 size={18} />
              </div>
            )}

            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'start', gap: '12px' }}>
               <div style={{ 
                 marginTop: '6px', 
                 width: '6px', 
                 height: '6px', 
                 borderRadius: '50%', 
                 background: field.required ? '#ef4444' : '#333',
                 boxShadow: field.required ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none' 
               }}></div>
               <div>
                  <label style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#555', marginBottom: '2px', display: 'block' }}>
                    ERP TARGET
                  </label>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'white', margin: 0 }}>
                    {field.label}
                  </h4>
               </div>
            </div>

            <div style={{ position: 'relative' }}>
              <select
                value={mappings[field.key] || ''}
                onChange={(e) => onMappingChange(field.key, e.target.value)}
                className="input-field"
                style={{ 
                  appearance: 'none', 
                  paddingRight: '40px',
                  borderColor: isMapped ? 'rgba(37, 99, 235, 0.3)' : 'var(--border)',
                  color: isMapped ? 'var(--accent)' : 'white'
                }}
              >
                <option value="">-- UNMAPPED --</option>
                {excelHeaders.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
              <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#555' }}>
                <ChevronDown size={14} />
              </div>
            </div>
            
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isAuto && !isMapped ? (
                <>
                  <div style={{ width: '12px', height: '1px', background: '#10b981', opacity: 0.3 }}></div>
                  <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#10b981' }}>
                    Default: {autoValue}
                  </span>
                </>
              ) : isMapped ? (
                <>
                  <div style={{ width: '12px', height: '1px', background: 'var(--accent)', opacity: 0.3 }}></div>
                  <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(37, 99, 235, 0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mappings[field.key]}
                  </span>
                </>
              ) : (
                <>
                  <Info size={12} color="#333" />
                  <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#333' }}>Selection required</span>
                </>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
