"use client";

import { useEffect, useState } from "react";
import toast from 'react-hot-toast';

// Kullanıcı tipi tanımı
interface User {
  id: string;
  name: string;
  email?: string;
  institutionId?: string;
}

// Bileşen props tipi tanımı
interface UserSelectProps {
  label: string;
  name: string;
  defaultValue?: string;
  register: any;
  error?: any;
  isLoading?: boolean;
  institutionId?: string; // Opsiyonel: Belirli bir kuruma ait kullanıcıları filtrelemek için
  className?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

const UserSelect = ({ 
  label, 
  name, 
  defaultValue = "", 
  register, 
  error, 
  isLoading = false,
  institutionId,
  className = "",
  required = false,
  disabled = false,
  onChange
}: UserSelectProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setFetchError(null);

        // Endpoint seçimi: Kurum ID varsa o kuruma ait kullanıcılar, yoksa tüm kullanıcılar
        const endpoint = institutionId 
          ? `/api/users/by-institution/${institutionId}`
          : '/api/users/list';

        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Gelen veriyi kontrol et ve düzenle
        const validUsers = data.filter((user: User) => 
          user.id && (user.name )
        );

        setUsers(validUsers);
        
        if (validUsers.length === 0) {
          setFetchError("Listelenecek kullanıcı bulunamadı");
          toast.error("Kullanıcı listesi boş");
        }

      } catch (error) {
        console.error('Error fetching users:', error);
        setFetchError("Kullanıcı listesi alınamadı");
        toast.error("Kullanıcı listesi yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [institutionId]); // institutionId değiştiğinde yeniden çağır

  // Yükleme durumu gösterimi
  if (loading || isLoading) {
    return (
      <div className={`flex flex-col gap-2 w-full ${className}`}>
        <label className="text-xs text-gray-500">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select 
          disabled 
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-gray-100"
        >
          <option>Yükleniyor...</option>
        </select>
      </div>
    );
  }

  // Hata durumu gösterimi
  if (fetchError) {
    return (
      <div className={`flex flex-col gap-2 w-full  ${className}`}>
        <label className="text-xs text-gray-500">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select 
          disabled 
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-gray-100"
        >
          <option>{fetchError}</option>
        </select>
      </div>
    );
  }

  // Normal render
  return (
    <div className={`flex flex-col gap-2 w-full  ${className}`}>
      <label className="text-xs text-gray-500">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        className={`ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full
          ${disabled ? 'bg-gray-100' : 'bg-white'}
          ${error ? 'ring-red-500' : 'ring-gray-300'}
        `}
        {...register(name)}
        defaultValue={defaultValue}
        disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.value)}
      >
        <option value="">Kullanıcı Seçiniz</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name }
          </option>
        ))}
      </select>
      
      {/* Hata mesajı gösterimi */}
      {error?.message && (
        <p className="text-xs text-red-400">{error.message}</p>
      )}
    </div>
  );
};

export default UserSelect;