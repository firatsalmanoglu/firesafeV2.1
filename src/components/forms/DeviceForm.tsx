// DeviceForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import toast from 'react-hot-toast';
import Image from "next/image";
import InputField from "../InputField";
import DeviceTypeSelect from "@/components/DeviceTypeSelect";
import DeviceFeatureSelect from "@/components/DeviceFeatureSelect";
import UserSelect from "@/components/UserSelect";
import InstitutionSelect from "@/components/InstitutionSelect";
import IsgMemberSelect from "@/components/IsgMemberSelect";

const schema = z.object({
  ownerId: z.string().min(1, { message: "Cihaz sahibi ID'si zorunludur" }),
  ownerInstId: z.string().min(1, { message: "Sahip kurum seçimi zorunludur" }),
  serialNumber: z.string()
    .min(3, { message: "Seri No min 3 karakter uzunluğunda olmalı!" })
    .max(20, { message: "Seri No maks 20 karakter uzunluğunda olmalı!" }),
  typeId: z.string().min(1, { message: "Cihaz tipi seçimi zorunludur" }),
  featureId: z.string().min(1, { message: "Cihaz özelliği seçimi zorunludur" }),
  productionDate: z.string().min(1, { message: "Üretim tarihi zorunludur" }),
  lastControlDate: z.string().min(1, { message: "Son kontrol tarihi zorunludur" }),
  expirationDate: z.string().min(1, { message: "Son kullanma tarihi zorunludur" }),
  nextControlDate: z.string().min(1, { message: "Sonraki kontrol tarihi zorunludur" }),
  location: z.string().min(1, { message: "Konum zorunludur" }),
  location1: z.string().optional(),
  currentStatus: z.enum(["Aktif", "Pasif"]),
  providerInstId: z.string().min(1, { message: "Sağlayıcı kurum seçimi zorunludur" }),
  providerId: z.string().min(1, { message: "Hizmet sağlayıcı seçimi zorunludur" }),
  isgMemberId: z.string().min(1, { message: "ISG üyesi seçimi zorunludur" }),
  details: z.string().min(1, { message: "Detaylar zorunludur" }),
  photo: z.any().optional()
});

type Inputs = z.infer<typeof schema>;

interface DeviceFormProps {
  type: "create" | "update";
  data?: any;
  currentUserId: string;
}

const DeviceForm = ({ type, data, currentUserId }: DeviceFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [ownerInfo, setOwnerInfo] = useState<any>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentStatus: "Aktif",
      ownerId: currentUserId,
      ...data,
    },
  });

  const selectedOwnerId = watch("ownerId");
  const selectedTypeId = watch("typeId");
  const selectedProviderInstId = watch("providerInstId");

  useEffect(() => {
    if (selectedOwnerId) {
      fetchOwnerInfo(selectedOwnerId);
    }
  }, [selectedOwnerId]);

  useEffect(() => {
    if (data && type === "update") {
      reset(data);
      if (data.ownerId) {
        fetchOwnerInfo(data.ownerId);
      }
    } else {
      setValue("ownerId", currentUserId);
      fetchOwnerInfo(currentUserId);
    }
  }, [data, type, reset, currentUserId, setValue]);

  const fetchOwnerInfo = async (ownerId: string) => {
    try {
      const response = await fetch(`/api/users/detail/${ownerId}`);
      if (!response.ok) {
        throw new Error('Kullanıcı bilgileri alınamadı');
      }
      const data = await response.json();
      setOwnerInfo(data);
      setValue("ownerInstId", data.institutionId);
      toast.success('Cihaz sahibi bilgileri yüklendi');
    } catch (error) {
      console.error("Owner bilgisi alınamadı:", error);
      toast.error('Cihaz sahibi bilgileri alınamadı');
    }
  };

  const onSubmit = async (formData: Inputs) => {
    const submitPromise = new Promise(async (resolve, reject) => {
      try {
        setLoading(true);
        const submitData = new FormData();
  
        Object.entries(formData).forEach(([key, value]) => {
          if (value instanceof File) {
            submitData.append(key, value);
          } else if (value !== undefined && value !== null) {
            submitData.append(key, String(value));
          }
        });
  
        const endpoint = type === "create" ? '/api/devices' : `/api/devices/${data?.id}`;
        const method = type === "create" ? 'POST' : 'PUT';
  
        const response = await fetch(endpoint, {
          method,
          body: submitData,
        });
  
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(errorData || 'İşlem başarısız oldu');
        }
  
        await response.json();
        window.location.href = '/list/devices';
        resolve('İşlem başarıyla tamamlandı');
      } catch (error) {
        console.error('Hata:', error);
        reject(error);
      } finally {
        setLoading(false);
      }
    });
  
    toast.promise(submitPromise, {
      loading: type === "create" ? 'Cihaz kaydediliyor...' : 'Cihaz güncelleniyor...',
      success: type === "create" ? 'Cihaz başarıyla kaydedildi!' : 'Cihaz başarıyla güncellendi!',
      error: (err) => `Hata: ${err.message}`
    });
  };

  return (
    <form className="flex flex-col gap-4 max-w-7xl mx-auto w-full" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Yangın Güvenlik Tedbiri Oluştur" : "Cihaz Düzenle"}
      </h1>

      {/* Cihaz Sahibi Bilgileri */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500">Cihaz Sahibi Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* //Cihaz Sahibi ID gizlendi */}
          <div className="flex-col gap-2 hidden"> 
            <label className="text-xs text-gray-500">Cihaz Sahibi ID</label>
            <input
              type="text"
              {...register("ownerId")}
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm bg-gray-50"
              readOnly
            />
            {errors?.ownerId && (
              <span className="text-xs text-red-500">{errors.ownerId.message}</span>
            )}
          </div>

          {ownerInfo && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">Cihaz Sahibi</label>
                <input
                  type="text"
                  value={`${ownerInfo.name}`}
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-gray-50"
                  disabled
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">Sahip Kurum</label>
                <input
                  type="text"
                  value={ownerInfo.institution?.name || ''}
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-gray-50"
                  disabled
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Temel Cihaz Bilgileri */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500">Temel Cihaz Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Seri No"
            name="serialNumber"
            register={register}
            error={errors?.serialNumber}
          />

          <DeviceTypeSelect
            register={register}
            error={errors.typeId}
          />

          <DeviceFeatureSelect
            register={register}
            error={errors.featureId}
            typeId={selectedTypeId}
          />

          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">Durum</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("currentStatus")}
            >
              <option value="Aktif">Aktif</option>
              <option value="Pasif">Pasif</option>
            </select>
            {errors.currentStatus?.message && (
              <p className="text-xs text-red-400">{errors.currentStatus.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tarih Bilgileri */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500">Tarih Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Üretim Tarihi"
            name="productionDate"
            type="date"
            register={register}
            error={errors?.productionDate}
          />

          <InputField
            label="Son Kontrol Tarihi"
            name="lastControlDate"
            type="date"
            register={register}
            error={errors?.lastControlDate}
          />

          <InputField
            label="Son Kullanma Tarihi"
            name="expirationDate"
            type="date"
            register={register}
            error={errors?.expirationDate}
          />

          <InputField
            label="Sonraki Kontrol Tarihi"
            name="nextControlDate"
            type="date"
            register={register}
            error={errors?.nextControlDate}
          />
        </div>
      </div>

      {/* Konum Bilgileri */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500">Konum Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Konum"
            name="location"
            register={register}
            error={errors?.location}
          />

          <InputField
            label="Bölüm"
            name="location1"
            register={register}
            error={errors?.location1}
          />
        </div>
      </div>

      {/* Hizmet Sağlayıcı Bilgileri */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500">Hizmet Sağlayıcı Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InstitutionSelect
            label="Sağlayıcı Kurum"
            register={register}
            name="providerInstId"
            error={errors.providerInstId}
            defaultValue={data?.providerInstId}
          />

          <UserSelect
            label="Hizmet Sağlayıcı"
            name="providerId"
            register={register}
            error={errors.providerId}
            institutionId={selectedProviderInstId}
          />
        </div>
      </div>

      {/* ISG Bilgileri */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500">ISG Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <IsgMemberSelect
            register={register}
            error={errors.isgMemberId}
          />
        </div>
      </div>

      {/* Detay Bilgileri */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500">Detay Bilgileri</h2>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">Detaylar</label>
            <textarea
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm min-h-[100px] resize-none w-full"
              {...register("details")}
            />
            {errors.details?.message && (
              <p className="text-xs text-red-400">{errors.details.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer" htmlFor="photo">
              <Image src="/upload.png" alt="" width={28} height={28} />
              <span>Fotoğraf Yükle</span>
            </label>
            <input
              id="photo"
              type="file"
              accept="image/*"
              {...register("photo")}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md transition-colors disabled:opacity-50"
      >
        {loading ? "İşlem yapılıyor..." : type === "create" ? "Oluştur" : "Güncelle"}
      </button>
    </form>
  );
};

export default DeviceForm