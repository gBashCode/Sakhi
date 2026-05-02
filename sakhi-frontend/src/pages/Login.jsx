import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';
import { db } from '../db';

export default function Login() {
  const [phone, setPhone] = useState('9999999999');
  const [pin, setPin] = useState('1234');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(phone, pin);
      await db.meta.put({key: 'token', value: data.access_token});
      navigate('/patients');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Sakhi Login</h2>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input 
              id="phone-input"
              type="text" 
              className="w-full px-3 py-2 border rounded" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">PIN</label>
            <input 
              id="pin-input"
              type="password" 
              className="w-full px-3 py-2 border rounded" 
              value={pin} 
              onChange={e => setPin(e.target.value)} 
            />
          </div>
          <button id="login-button" type="submit" className="w-full py-2 bg-blue-600 text-white rounded font-medium mt-2">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
