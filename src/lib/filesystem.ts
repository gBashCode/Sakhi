import { Filesystem, Directory } from '@capacitor/filesystem';
import { toast } from 'sonner';

/**
 * Saves a Blob (PDF/Excel) directly to the phone's documents folder.
 * This is the ONLY way it will work in the APK.
 */
export async function saveToPhone(blob, filename) {
  try {
    // 1. Convert Blob to Base64 (required by Capacitor Filesystem)
    const reader = new FileReader();
    const base64Promise = new Promise((resolve, reject) => {
      reader.onload = () => {
        const base64Data = reader.result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const base64Data = await base64Promise;

    // 2. Save to Documents directory
    const result = await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Documents,
      recursive: true
    });

    console.log('File saved at:', result.uri);
    toast.success(`File saved to Documents: ${filename}`);
    return result.uri;
  } catch (e) {
    console.error('Save to phone failed:', e);
    // Fallback to browser download if capacitor fails (e.g. on web)
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.info(`Download started: ${filename}`);
  }
}
