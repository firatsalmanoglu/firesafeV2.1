"use client";

import { useEffect, useState } from "react";

interface DeviceFeature {
  id: string;
  name: string;
  deviceTypeId: string; // deviceTypeId'yi interface'e ekledik
}

interface DeviceFeatureSelectProps {
  defaultValue?: string;
  register: any;
  error?: any;
  isLoading?: boolean;
  typeId?: string;
}

const DeviceFeatureSelect = ({ 
  defaultValue, 
  register, 
  error, 
  isLoading = false,
  typeId 
}: DeviceFeatureSelectProps) => {
  const [features, setFeatures] = useState<DeviceFeature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        setLoading(true);
        if (!typeId) {
          setFeatures([]); // typeId yoksa features'ı temizle
          return;
        }
        
        const response = await fetch(`/api/deviceFeatures?typeId=${typeId}`);
        const data = await response.json();
        setFeatures(data);
      } catch (error) {
        console.error('Error fetching device features:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, [typeId]); // typeId değiştiğinde useEffect'i tetikle

  if (loading || isLoading) {
    return (
      <div className="flex flex-col gap-2 w-full ">
        <label className="text-xs text-gray-500">Cihaz Özelliği</label>
        <select disabled className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-gray-100">
          <option>Yükleniyor...</option>
        </select>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full ">
      <label className="text-xs text-gray-500">Cihaz Özelliği</label>
      <select
        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
        {...register("featureId")}
        defaultValue={defaultValue || ""}
        disabled={!typeId} // typeId yoksa select'i disable et
      >
        <option value="">Özellik Seçiniz</option>
        {features.map((feature) => (
          <option key={feature.id} value={feature.id}>{feature.name}</option>
        ))}
      </select>
      {error?.message && (
        <p className="text-xs text-red-400">{error.message}</p>
      )}
    </div>
  );
};

export default DeviceFeatureSelect;