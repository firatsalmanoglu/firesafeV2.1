"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

type SortOption = {
  label: string;
  field: string;
  order: "asc" | "desc";
};

type TableSortProps = {
  options: SortOption[];
};

const TableSort = ({ options }: TableSortProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  // Mevcut sıralama durumunu belirle
  const currentSort = searchParams.get("sort") || "name";
  const currentOrder = searchParams.get("order") || "asc";
  
  // Mevcut sıralama seçeneğinin etiketini bul
  const currentSortLabel = options.find(
    option => option.field === currentSort && option.order === currentOrder
  )?.label || "Sırala";

  const handleSort = (field: string, order: "asc" | "desc") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", field);
    params.set("order", order);
    router.push(`${pathname}?${params.toString()}`);
    setShowSortMenu(false);
  };

  return (
    <div className="relative">
      <button
        className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow"
        title={currentSortLabel}
        onClick={() => setShowSortMenu(!showSortMenu)}
      >
        <Image src="/sort.png" alt="" width={14} height={14} />
      </button>

      {showSortMenu && (
        <div className="absolute right-0 top-10 z-10 bg-white shadow-md rounded-md py-2 w-56">
          {options.map((option, index) => (
            <button
              key={index}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-sm ${
                currentSort === option.field && currentOrder === option.order
                  ? "font-bold bg-gray-50"
                  : ""
              }`}
              onClick={() => handleSort(option.field, option.order)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TableSort;