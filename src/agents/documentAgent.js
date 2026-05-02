import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// MASTER TEMPLATE: Maps AI output → All documents
export function generateAllDocuments(patient, medical, risk, action) {

  const today = new Date().toLocaleDateString('hi-IN');
  const edd = medical.lmp_date? calculateEDD(medical.lmp_date) : 'N/A';

  const docData = {
    // Common fields for all docs
    name: medical.patient_name || patient.name || 'Unknown',
    age: patient.age || 'N/A',
    husband_name: patient.husband_name || '',
    village: patient.village || '',
    asha_name: 'Sunita ASHA', // From login
    date: today,

    // Vitals
    bp: medical.bp_sys && medical.bp_dia? `${medical.bp_sys}/${medical.bp_dia}` : '',
    weight: medical.weight_kg? `${medical.weight_kg} kg` : '',
    lmp: medical.lmp_date || '',
    edd: edd,

    // Risk
    risk_level: risk.level.toUpperCase(),
    danger_signs: risk.flags.join(', '),
    action: action,

    // Symptoms
    symptoms: (medical.symptoms || []).join(', ')
  };

  return {
    ancCardPDF: generateANCCardPDF(docData),
    registerExcel: generateRegisterExcel(docData),
    referralSlipPDF: risk.level === 'high'? generateReferralPDF(docData) : null,
    smsText: risk.level === 'high'? generateReferralSMS(docData) : null
  };
}

// DOCUMENT 1: ANC CARD PDF
function generateANCCardPDF(data) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(16);
  doc.text('ANC CARD - RCH Program', 105, 15, {align: 'center'});
  doc.setFontSize(10);
  doc.text(`Date: ${data.date}`, 15, 25);

  // Patient Details
  doc.setFontSize(12);
  doc.text('PATIENT DETAILS', 15, 35);
  doc.setFontSize(10);
  doc.text(`Name: ${data.name}`, 15, 42);
  doc.text(`Age: ${data.age} | Husband: ${data.husband_name}`, 15, 48);
  doc.text(`Village: ${data.village} | ASHA: ${data.asha_name}`, 15, 54);

  // Vitals Table
  doc.setFontSize(12);
  doc.text('VITALS - TODAY', 15, 65);
  (doc).autoTable({
    startY: 70,
    head: [['Parameter', 'Value', 'Normal']],
    body: [
      ['BP', data.bp, '< 140/90'],
      ['Weight', data.weight, ''],
      ['LMP', data.lmp, ''],
      ['EDD', data.edd, ''],
      ['Symptoms', data.symptoms, 'None']
    ],
    theme: 'grid'
  });

  // Risk Assessment
  const finalY = (doc).lastAutoTable.finalY;
  doc.setFontSize(12);
  doc.text('RISK ASSESSMENT', 15, finalY + 10);
  doc.setFontSize(10);
  doc.setTextColor(data.risk_level === 'HIGH'? 255 : 0, 0, 0);
  doc.text(`Risk Level: ${data.risk_level}`, 15, finalY + 17);
  doc.setTextColor(0, 0, 0);
  doc.text(`Danger Signs: ${data.danger_signs || 'None'}`, 15, finalY + 23);
  doc.text(`Action: ${data.action}`, 15, finalY + 29);

  // ASHA Signature
  doc.text(`ASHA Signature: ${data.asha_name}`, 15, 270);
  doc.text(`Date: ${data.date}`, 150, 270);

  return doc.output('blob'); // Returns PDF blob
}

// DOCUMENT 2: RCH REGISTER EXCEL
function generateRegisterExcel(data) {
  const wsData = [
    ['Date', 'Name', 'Age', 'Village', 'LMP', 'EDD', 'BP', 'Weight', 'Risk', 'Action', 'ASHA'],
    [data.date, data.name, data.age, data.village, data.lmp, data.edd, data.bp, data.weight, data.risk_level, data.action, data.asha_name]
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ANC Visits');

  const excelBuffer = XLSX.write(wb, {bookType: 'xlsx', type: 'array'});
  return new Blob([excelBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}

// DOCUMENT 3: REFERRAL SLIP PDF - Only if high risk
function generateReferralPDF(data) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setTextColor(255, 0, 0);
  doc.text('URGENT REFERRAL SLIP', 105, 20, {align: 'center'});

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('TO: Medical Officer, PHC', 15, 35);
  doc.text(`FROM: ASHA ${data.asha_name}, ${data.village}`, 15, 42);

  doc.text('PATIENT DETAILS:', 15, 55);
  doc.setFontSize(10);
  doc.text(`Name: ${data.name} | Age: ${data.age}`, 15, 62);
  doc.text(`LMP: ${data.lmp} | EDD: ${data.edd}`, 15, 68);

  doc.setFontSize(12);
  doc.text('REASON FOR REFERRAL:', 15, 80);
  doc.setFontSize(10);
  doc.text(`BP: ${data.bp} | Danger Signs: ${data.danger_signs}`, 15, 87);
  doc.text(`AI Assessment: ${data.risk_level} RISK`, 15, 93);
  doc.text(`Action Required: ${data.action}`, 15, 99);

  doc.text(`Referred on: ${data.date}`, 15, 270);
  doc.text('ASHA Signature: _________________', 120, 270);

  return doc.output('blob');
}

// SMS TEXT for ANM
function generateReferralSMS(data) {
  return `URGENT REFERRAL: ${data.name}, ${data.age}y, ${data.village}. BP ${data.bp}. ${data.danger_signs}. ASHA ${data.asha_name} referring to PHC now. ${data.date}`;
}

// Helper: Calculate EDD from LMP
function calculateEDD(lmpDate) {
  const lmp = new Date(lmpDate);
  lmp.setDate(lmp.getDate() + 280); // 40 weeks
  return lmp.toLocaleDateString('hi-IN');
}
