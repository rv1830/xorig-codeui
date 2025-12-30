// components/ui/primitives.tsx
import React from 'react';
import { X } from 'lucide-react';

export const Button = ({ children, variant = "primary", className = "", ...props }: any) => {
  const base = "px-4 py-2 rounded-xl font-medium transition-colors text-sm flex items-center justify-center gap-2";
  const styles: any = {
    primary: "bg-black text-white hover:bg-gray-800",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200",
    destructive: "bg-red-50 text-red-600 hover:bg-red-100",
    outline: "border border-gray-300 hover:bg-gray-50"
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props}>{children}</button>;
};

export const Input = ({ label, className = "", ...props }: any) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs font-medium text-gray-500 uppercase">{label}</label>}
    <input className={`flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black ${className}`} {...props} />
  </div>
);

export const Badge = ({ children, variant = "default" }: any) => {
  const styles: any = {
    default: "bg-gray-100 text-gray-800 border-gray-200",
    success: "bg-green-50 text-green-700 border-green-200",
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[variant]}`}>{children}</span>;
};

export const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};