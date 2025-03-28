import { useEffect, useState } from "react";
import { UseFormRegister, FieldError } from "react-hook-form";

interface Service {
  id: string;
  name: string;
}

interface ServiceSelectProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  disabled?: boolean;
  required?: boolean;
  defaultValue?: string;
  value?: string; // Yeni eklenen prop
}

const ServiceSelect = ({ 
  label, 
  name, 
  register, 
  error, 
  disabled = false,
  required = false,
  defaultValue,
  value // Yeni eklenen prop
}: ServiceSelectProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState<string>(value || defaultValue || "");

  useEffect(() => {
    // value prop'u değiştiğinde selectedValue'yu güncelle
    if (value) {
      setSelectedValue(value);
    }
  }, [value]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        
        const response = await fetch('/api/services');
        
        if (!response.ok) {
          throw new Error('Hizmetler yüklenirken bir hata oluştu');
        }

        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error('Geçersiz veri formatı');
        }

        setServices(data);
      } catch (error) {
        console.error('Hizmetler yüklenemedi:', error);
        setFetchError(error instanceof Error ? error.message : 'Hizmetler yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-gray-500">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <select
          {...register(name)}
          value={selectedValue}
          onChange={(e) => setSelectedValue(e.target.value)}
          disabled={disabled || loading}
          className={`
            ring-[1.5px] 
            ${error ? 'ring-red-400' : 'ring-gray-300'} 
            p-2 
            rounded-md 
            text-sm 
            w-full 
            ${disabled || loading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${error ? 'border-red-500' : 'border-gray-300'}
            transition-colors
            duration-200
          `}
        >
          <option value="">
            {loading ? 'Yükleniyor...' : 'Hizmet Seçin'}
          </option>
          
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>

        {loading && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          </div>
        )}
      </div>
      
      {fetchError && (
        <p className="text-xs text-amber-500 mt-1">
          {fetchError}
        </p>
      )}
      
      {error?.message && (
        <p className="text-xs text-red-400 mt-1">
          {error.message}
        </p>
      )}
    </div>
  );
};

export default ServiceSelect;