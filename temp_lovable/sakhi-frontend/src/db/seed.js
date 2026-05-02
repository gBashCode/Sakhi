import { db } from '../db';
export async function seedData() {
  const count = await db.patients.count();
  if (count === 0) {
    await db.patients.bulkAdd([
      {id: 'p1', name: 'Sunita Devi', village: 'Gubbi'},
      {id: 'p2', name: 'Kamala', village: 'Gubbi'},
      {id: 'p3', name: 'Geeta', village: 'Hosahalli'}
    ]);
  }
}
