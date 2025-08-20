// src/app/login/page.jsx
'use client';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

const _cleanAN = v => (v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const _digits  = v => (v || '').replace(/\D/g, '');

const _detectCountry = (raw) => {
  const nospace = (raw || '').toUpperCase().replace(/\s/g, '');
  const an = _cleanAN(raw);
  if (/^\d{4}-?\d{3}$/.test(raw) || /^\d{7}$/.test(_digits(raw))) return 'PT';
  if (/^\d{4}\s?[A-Z]{2}$/.test(nospace)) return 'NL';
  if (/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(an)) return 'GB';
  if (/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(an)) return 'CA';
  if (/^\d{9}$/.test(_digits(raw))) return 'US9';
  if (/^\d{5}$/.test(_digits(raw))) return 'NUM5';
  return 'UNKNOWN';
};

const formatPostalAuto = (value) => {
  const type = _detectCountry(value);
  switch (type) {
    case 'CA': { const s = _cleanAN(value).slice(0, 6); return s.replace(/(^.{3})/, '$1 ').trim(); }
    case 'NL': { const s = _cleanAN(value).slice(0, 6); return s.length <= 4 ? s : `${s.slice(0,4)} ${s.slice(4)}`; }
    case 'PT': { const d = _digits(value).slice(0, 7); return d.length <= 4 ? d : `${d.slice(0,4)}-${d.slice(4)}`; }
    case 'GB': { const s = _cleanAN(value).slice(0, 8); return s.length > 3 ? `${s.slice(0, s.length - 3)} ${s.slice(-3)}` : s; }
    case 'US9': { const d = _digits(value).slice(0, 9); return `${d.slice(0,5)}-${d.slice(5)}`; }
    case 'NUM5': return _digits(value).slice(0, 5);
    default: return _cleanAN(value).slice(0, 10);
  }
};

const normalizePostalAuto = (value) => {
  const type = _detectCountry(value);
  switch (type) {
    case 'CA':
    case 'GB':
    case 'NL':  return _cleanAN(value);
    case 'PT':
    case 'US9':
    case 'NUM5': return _digits(value);
    default:     return _cleanAN(value);
  }
};

const isValidPostalAuto = (value) => {
  const type = _detectCountry(value);
  const an = _cleanAN(value);
  const d  = _digits(value);
  switch (type) {
    case 'CA':  return /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(an);
    case 'NL':  return /^\d{4}[A-Z]{2}$/.test(an);
    case 'PT':  return /^\d{7}$/.test(d);
    case 'GB':  return /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(an);
    case 'US9': return /^\d{9}$/.test(d);
    case 'NUM5':return /^\d{5}$/.test(d);
    default:    return an.length >= 3;
  }
};

export default function LoginPage() {
  const { login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const ready = useMemo(
    () => fullName.trim().length > 1 && isValidPostalAuto(postalCode),
    [fullName, postalCode]
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');

    const name = fullName.trim().replace(/\s+/g, ' ');
    const pc = normalizePostalAuto(postalCode);
    if (!name || !isValidPostalAuto(postalCode)) {
      setError('Please enter a valid name and postal/ZIP code.');
      return;
    }

    try {
      setIsLoading(true);
      await login({ fullName: name, postalCode: pc });
    } catch (err) {
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-champagne flex flex-col items-center justify-center p-6">
      <h1 className="mb-8 text-4xl md:text-5xl">Guest Login</h1>
      <div className="bg-white shadow-md w-full max-w-[560px] p-6 md:p-10">
        <div className="flex flex-col items-center space-y-8 md:space-y-10">
          <Image src="/images/swans.svg" alt="Swans Logo" width={220} height={87} priority className="select-none w-40 md:w-[220px] h-auto" />
          <form onSubmit={handleLogin} className="w-full space-y-8 md:space-y-10">
            <div className="max-w-[504px] mx-auto w-full">
              <div className="grid grid-cols-1 md:grid-cols-[12rem_minmax(0,1fr)] items-center gap-y-6 md:gap-x-6">
                <label htmlFor="fullName" className="text-base font-trajan leading-none md:justify-self-end">Full Name:</label>
                <input id="fullName" type="text" autoComplete="name" autoCapitalize="words" disabled={isLoading}
                  value={fullName} onChange={(e)=>setFullName(e.target.value.replace(/\s+/g,' '))}
                  className="font-trajan text-[16px] md:text-sm w-full h-12 px-4 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green/70" />
                <label htmlFor="postalCode" className="text-base font-trajan leading-none md:justify-self-end">Postal Code:</label>
                <input id="postalCode" type="text" autoComplete="postal-code" disabled={isLoading}
                  value={postalCode} onChange={(e)=>setPostalCode(formatPostalAuto(e.target.value))}
                  className="font-trajan text-[16px] md:text-sm w-full h-12 px-4 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green/70" />
              </div>
            </div>
            <div className="text-center">
              <button type="submit" disabled={isLoading || !ready}
                className={`font-trajan w-full md:w-auto py-3 px-12 bg-green text-white text-sm tracking-wide ${isLoading?'cursor-not-allowed opacity-70':''}`}>
                {isLoading ? 'LOGGING IN…' : 'LOGIN'}
              </button>
            </div>
          </form>
          {error && <p className="text-red-600 text-sm" role="status" aria-live="polite">{error}</p>}
        </div>
      </div>
    </div>
  );
}
