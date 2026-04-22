import * as XLSX from 'xlsx';

export const parseExcelFile = (file: File): Promise<{ headers: string[], data: any[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        if (jsonData.length === 0) {
          resolve({ headers: [], data: [] });
          return;
        }

        const headers = Object.keys(jsonData[0] as object);
        resolve({ headers, data: jsonData });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const formatExcelDate = (value: any): string => {
  if (!value) return '';
  
  let date: Date;
  
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'number') {
    const d = XLSX.SSF.parse_date_code(value);
    date = new Date(d.y, d.m - 1, d.d);
  } else {
    const dateStr = String(value).trim();
    // Try standard parsing first
    date = new Date(dateStr);
    
    // If invalid, try manual parsing for DD-MM-YYYY or DD/MM/YYYY
    if (isNaN(date.getTime())) {
      const parts = dateStr.split(/[-/]/);
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        if (y > 1000) { // Ensure it's a full year
          date = new Date(y, m - 1, d);
        }
      }
    }
  }

  if (isNaN(date.getTime())) return String(value);

  return date.toISOString();
};

export const autoMapFields = (excelHeaders: string[], erpFields: any[]): Record<string, string> => {
  const mapping: Record<string, string> = {};
  
  erpFields.forEach(field => {
    const match = excelHeaders.find(header => {
      const lowerHeader = header.toLowerCase();
      return field.autoMapKeywords.some((keyword: string) => lowerHeader.includes(keyword.toLowerCase()));
    });
    
    if (match) {
      mapping[field.key] = match;
    }
  });
  
  return mapping;
};
