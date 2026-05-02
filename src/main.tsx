import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { db } from "./lib/db";

// Seed demo patients into IndexedDB on first launch
(async () => {
  try {
    const count = await db.patients.count();
    if (count === 0) {
      await db.patients.bulkAdd([
        { id: 'p1', name: 'Sunita Devi', synced: 0 },
        { id: 'p2', name: 'Kamala',      synced: 0 },
        { id: 'p3', name: 'Geeta',       synced: 0 },
      ]);
      console.log('[SakhiAI] Seeded 3 demo patients into IndexedDB');
    }
  } catch (err) {
    console.warn('[SakhiAI] IndexedDB seed skipped:', err);
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
