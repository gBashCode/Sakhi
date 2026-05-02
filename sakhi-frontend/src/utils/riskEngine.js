export function getRisk({bpSys, bpDia, symptoms}) {
  if (bpSys >= 140 || bpDia >= 90) return 'high';
  if (symptoms.includes('edema')) return 'high';
  return 'low';
}
