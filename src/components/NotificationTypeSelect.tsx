"use client";

import { useEffect, useState } from "react";

interface NotificationType {
  id: string;
  name: string;
}

interface NotificationTypeSelectProps {
  defaultValue?: string;
  register: any;
  error?: any;
  isLoading?: boolean;
}

const NotificationTypeSelect = ({ defaultValue, register, error, isLoading = false }: NotificationTypeSelectProps) => {
  const [types, setTypes] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await fetch('/api/notificationTypes');
        const data = await response.json();
        setTypes(data);
      } catch (error) {
        console.error('Error fetching notification types:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTypes();
  }, []);

  if (loading || isLoading) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs text-gray-500">Bildirim Tipi</label>
        <select disabled className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-gray-100">
          <option>Yükleniyor...</option>
        </select>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-xs text-gray-500">Bildirim Tipi</label>
      <select
        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
        {...register("typeId")}
        defaultValue={defaultValue || ""}
      >
        <option value="">Tip Seçiniz</option>
        {types.map((type) => (
          <option key={type.id} value={type.id}>{type.name}</option>
        ))}
      </select>
      {error?.message && (
        <p className="text-xs text-red-400">{error.message}</p>
      )}
    </div>
  );
};

export default NotificationTypeSelect;