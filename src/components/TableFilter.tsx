// components/TableFilter.tsx
"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

// Filtre seçenekleri için tip tanımları
type SelectFilterOption = {
  type: "select";
  label: string;
  field: string;
  data: { id: string; name: string; }[];
  multiple?: boolean;
};

type DateRangeFilterOption = {
  type: "dateRange";
  label: string;
  fieldFrom: string;
  fieldTo: string;
};

type StatusFilterOption = {
  type: "status";
  label: string;
  field: string;
  options: { value: string; label: string; }[];
};

type NumberRangeFilterOption = {
  type: "numberRange";
  label: string;
  fieldFrom: string;
  fieldTo: string;
};

// Tüm filtre seçenekleri tiplerini birleştir
export type FilterOption = 
  | SelectFilterOption 
  | DateRangeFilterOption 
  | StatusFilterOption
  | NumberRangeFilterOption;

// Bileşen props tanımı
type TableFilterProps = {
  options: FilterOption[];
};

const TableFilter = ({ options }: TableFilterProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});

  // URL parametreleri değiştiğinde state güncelle
  useEffect(() => {
    const newFilters: Record<string, string> = {};
    
    options.forEach(option => {
      if (option.type === "select") {
        const value = searchParams.get(option.field) || "";
        newFilters[option.field] = value;
      } else if (option.type === "dateRange") {
        const valueFrom = searchParams.get(option.fieldFrom) || "";
        const valueTo = searchParams.get(option.fieldTo) || "";
        newFilters[option.fieldFrom] = valueFrom;
        newFilters[option.fieldTo] = valueTo;
      } else if (option.type === "status") {
        const value = searchParams.get(option.field) || "";
        newFilters[option.field] = value;
      } else if (option.type === "numberRange") {
        const valueFrom = searchParams.get(option.fieldFrom) || "";
        const valueTo = searchParams.get(option.fieldTo) || "";
        newFilters[option.fieldFrom] = valueFrom;
        newFilters[option.fieldTo] = valueTo;
      }
    });
    
    setFilters(newFilters);
  }, [searchParams, options]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Her bir filtre için params'a ekle veya sil
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    // Sayfa 1'e dön
    params.delete("page");
    
    router.push(`${pathname}?${params.toString()}`);
    setShowFilter(false);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    
    // Sadece sort ve order parametrelerini koru
    if (searchParams.has("sort")) {
      params.set("sort", searchParams.get("sort")!);
    }
    if (searchParams.has("order")) {
      params.set("order", searchParams.get("order")!);
    }
    if (searchParams.has("search")) {
      params.set("search", searchParams.get("search")!);
    }
    
    router.push(`${pathname}?${params.toString()}`);
    
    // Tüm filtreleri temizle
    const emptyFilters: Record<string, string> = {};
    options.forEach(option => {
      if (option.type === "select") {
        emptyFilters[option.field] = "";
      } else if (option.type === "dateRange") {
        emptyFilters[option.fieldFrom] = "";
        emptyFilters[option.fieldTo] = "";
      } else if (option.type === "status") {
        emptyFilters[option.field] = "";
      } else if (option.type === "numberRange") {
        emptyFilters[option.fieldFrom] = "";
        emptyFilters[option.fieldTo] = "";
      }
    });
    
    setFilters(emptyFilters);
    setShowFilter(false);
  };

  // Aktif filtre sayısını hesapla
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="relative">
      <button
        className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow relative"
        title="Filtrele"
        onClick={() => setShowFilter(!showFilter)}
      >
        <Image src="/filter.png" alt="" width={14} height={14} />
        {activeFilterCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
            {activeFilterCount}
          </span>
        )}
      </button>

      {showFilter && (
        <div className="absolute right-0 top-10 z-10 bg-white shadow-lg rounded-md p-4 w-72">
          <h3 className="font-semibold mb-4">Filtreler</h3>
          
          {options.map((option, index) => {
            if (option.type === "select") {
              return (
                <div key={index} className="mb-3">
                  <label className="block text-sm font-medium mb-1">{option.label}</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={filters[option.field] || ""}
                    onChange={(e) => handleFilterChange(option.field, e.target.value)}
                  >
                    <option value="">Tümü</option>
                    {option.data.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            } else if (option.type === "dateRange") {
              return (
                <div key={index} className="mb-3">
                  <label className="block text-sm font-medium mb-1">{option.label} Aralığı</label>
                  <div className="flex gap-2">
                    <div>
                      <label className="block text-xs mb-1">Başlangıç</label>
                      <input
                        type="date"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={filters[option.fieldFrom] || ""}
                        onChange={(e) => handleFilterChange(option.fieldFrom, e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Bitiş</label>
                      <input
                        type="date"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={filters[option.fieldTo] || ""}
                        onChange={(e) => handleFilterChange(option.fieldTo, e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              );
            } else if (option.type === "status") {
              return (
                <div key={index} className="mb-3">
                  <label className="block text-sm font-medium mb-1">{option.label}</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={filters[option.field] || ""}
                    onChange={(e) => handleFilterChange(option.field, e.target.value)}
                  >
                    <option value="">Tümü</option>
                    {option.options.map((item, i) => (
                      <option key={i} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            } else if (option.type === "numberRange") {
              return (
                <div key={index} className="mb-3">
                  <label className="block text-sm font-medium mb-1">{option.label} Aralığı</label>
                  <div className="flex gap-2">
                    <div>
                      <label className="block text-xs mb-1">Minimum</label>
                      <input
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={filters[option.fieldFrom] || ""}
                        onChange={(e) => handleFilterChange(option.fieldFrom, e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Maksimum</label>
                      <input
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={filters[option.fieldTo] || ""}
                        onChange={(e) => handleFilterChange(option.fieldTo, e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })}
          
          <div className="flex justify-between mt-4">
            <button
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              onClick={clearFilters}
            >
              Temizle
            </button>
            <button
              className="px-3 py-1 bg-lamaPurple text-white rounded-md hover:bg-lamaPurpleDark"
              onClick={applyFilters}
            >
              Uygula
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableFilter;