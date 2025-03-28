"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Institutions } from "@prisma/client";

const schema = z.object({
  isgNumber: z
    .string()
    .min(3, { message: "ISG Numarası min 3 karakter uzunluğunda olmalı!" })
    .max(20, { message: "ISG Numarası maks 20 karakter uzunluğunda olmalı!" }),
  name: z
    .string()
    .min(3, { message: "Kullanıcı Adı min 3 karakter uzunluğunda olmalı!" })
    .max(20, { message: "KUllanıcı Adı maks 20 karakter uzunluğunda olmalı!" }),
  contractDate: z
    .string()
    .min(1, { message: "Bu alan boş geçilemez!" }),
  institutionId: z
    .string().min(1, { message: "Kurum seçimi zorunludur!" }),
});

type Inputs = z.infer<typeof schema>;

const IsgMemberForm = ({
  type,
  data,
}: {
  type: "create" | "update";
  data?: any;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [institutions, setInstitutions] = useState<Institutions[]>([]);
  const router = useRouter();

  // Kurumları yükle
  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const response = await fetch('/api/institutions');
        if (!response.ok) throw new Error('Kurumlar yüklenemedi');
        const institutionsData = await response.json();
        setInstitutions(institutionsData);
      } catch (error) {
        console.error('Kurumlar yüklenirken hata:', error);
        setError('Kurumlar yüklenirken bir hata oluştu');
      }
    };

    fetchInstitutions();
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      isgNumber: data?.isgNumber || "",
      name: data?.name || "",
      contractDate: data?.contractDate 
        ? (data.contractDate instanceof Date 
            ? data.contractDate.toISOString().split('T')[0] 
            : data.contractDate)
        : "",
      institutionId: data?.institutionId || "",
    }
  });

  const onSubmit = handleSubmit(async (formData) => {
    try {
      setIsLoading(true);
      setError(null);

      const submitData = {
        ...formData,
        contractDate: new Date(formData.contractDate)
      };

      const response = await fetch('/api/isgMembers', {
        method: type === 'create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Bir hata oluştu');
      }

      await response.json();
      window.location.href = '/list/isgmembers';
      

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Bir hata oluştu');
      console.error('Hata:', error);
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Yeni ISG Sorumlusu Oluştur" : "ISG Sorumlusu Güncelle"}
      </h1>
      
      <span className="text-xs text-gray-400 font-medium">
        ISG Sorumlusu Bilgileri
      </span>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">ISG Numarası</label>
          <input
            type="text"
            className={`w-full p-2 border rounded-md ${
              errors.isgNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            {...register("isgNumber")}
          />
          {errors.isgNumber && (
            <span className="text-red-500 text-xs">
              {errors.isgNumber.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Adı-Soyadı</label>
          <input
            type="text"
            className={`w-full p-2 border rounded-md ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            {...register("name")}
          />
          {errors.name && (
            <span className="text-red-500 text-xs">
              {errors.name.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Kontrat Tarihi</label>
          <input
            type="date"
            className={`w-full p-2 border rounded-md ${
              errors.contractDate ? 'border-red-500' : 'border-gray-300'
            }`}
            {...register("contractDate")}
          />
          {errors.contractDate && (
            <span className="text-red-500 text-xs">
              {errors.contractDate.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Kurum</label>
          <select
            {...register("institutionId")}
            className={`w-full p-2 border rounded-md ${
              errors.institutionId ? 'border-red-500' : 'border-gray-300'
            }`}
            value={watch("institutionId") || ""}
            onChange={(e) => setValue("institutionId", e.target.value)}
          >
            <option value="">Kurum Seçiniz</option>
            {institutions.map((institution) => (
              <option 
                key={institution.id} 
                value={institution.id}
              >
                {institution.name}
              </option>
            ))}
          </select>
          {errors.institutionId && (
            <span className="text-red-500 text-xs">
              {errors.institutionId.message}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-500 text-sm rounded-md p-2">
          {error}
        </div>
      )}

      <div className="flex gap-2 justify-end mt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
          disabled={isLoading}
        >
          İptal
        </button>

        <button 
          type="submit"
          disabled={isLoading}
          className={`px-4 py-2 rounded-md text-white ${
            isLoading 
              ? 'bg-blue-300 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isLoading 
            ? 'İşleniyor...' 
            : type === "create" 
              ? "Oluştur" 
              : "Güncelle"
          }
        </button>
      </div>
    </form>
  );
};

export default IsgMemberForm;