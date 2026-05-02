export function parseVitals(text) {
  const bp = text.match(/bp.*?(\d+).*?by.*?(\d+)/i);
  const weight = text.match(/vajan.*?(\d+)/i);
  const edema = /sujan|pair me sujan/i.test(text);
  return {
    bpSys: bp ? parseInt(bp[1]) : '',
    bpDia: bp ? parseInt(bp[2]) : '',
    weight: weight ? parseInt(weight[1]) : '',
    symptoms: edema ? ['edema'] : []
  };
}
