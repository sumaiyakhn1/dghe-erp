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
    // Excel numeric date
    date = XLSX.SSF.parse_date_code(value) as unknown as Date;
    // XLSX.SSF returns an object {y,m,d,H,M,S}, we convert to ISO string manually or use helper
    const d = XLSX.SSF.parse_date_code(value);
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  } else {
    date = new Date(value);
  }

  if (isNaN(date.getTime())) return String(value);

  return date.toISOString().split('T')[0];
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
