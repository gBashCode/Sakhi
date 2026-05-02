import { useState, useEffect } from 'react';
import { db } from '../db';

export function useToken() {
  const [token, setToken] = useState(null);
  useEffect(() => { 
    db.meta.get('token').then(t => setToken(t?.value));
  }, []);
  return token;
}
