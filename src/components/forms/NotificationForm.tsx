"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import toast from 'react-hot-toast';
import { useDebounce } from 'use-debounce';
import InputField from "../InputField";
import UserSelect from "@/components/UserSelect";
import InstitutionSelect from "@/components/InstitutionSelect";
import NotificationTypeSelect from "@/components/NotificationTypeSelect";

interface Device {
  id: string;
  serialNumber: string;
  type: {
    id: string;
    name: string;
  };
  feature: {
    id: string;
    name: string;
  };
  location: string;
}

const schema = z.object({
  creatorId: z.string().min(1, { message: "Oluşturan kişi ID'si zorunludur" }),
  creatorInsId: z.string().min(1, { message: "Gönderen kurum seçimi zorunludur" }),
  deviceSerialNumber: z.string().min(1, { message: "Cihaz seri numarası zorunludur" }),
  deviceId: z.string().min(1, { message: "Cihaz ID zorunludur" }),
  deviceTypeId: z.string().min(1, { message: "Cihaz tipi ID zorunludur" }),
  content: z.string()
    .min(10, { message: "Bildirim içeriği en az 10 karakter olmalıdır" })
    .max(500, { message: "Bildirim içeriği en fazla 500 karakter olabilir" }),
  typeId: z.string().min(1, { message: "Bildirim tipi seçimi zorunludur" }),
  recipientId: z.string().min(1, { message: "Alıcı kullanıcı seçimi zorunludur" }),
  recipientInsId: z.string().min(1, { message: "Alıcı kurum seçimi zorunludur" }),
  isRead: z.enum(["Okundu", "Okunmadi"]).default("Okunmadi")
});

type Inputs = z.infer<typeof schema>;

interface NotificationFormProps {
  type: "create" | "update";
  data?: any;
  currentUserId: string;
}

const NotificationForm = ({ type, data, currentUserId }: NotificationFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [creatorInfo, setCreatorInfo] = useState<any>(null);
  const [deviceInfo, setDeviceInfo] = useState<Device | null>(null);

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
      isRead: "Okunmadi",
      creatorId: currentUserId,
      ...data,
    },
  });

  const selectedCreatorId = watch("creatorId");
  const deviceSerialNumber = watch("deviceSerialNumber");
  const selectedRecipientInsId = watch("recipientInsId");
  const [debouncedSerialNumber] = useDebounce(deviceSerialNumber, 500);

  useEffect(() => {
    if (data && type === "update") {
      reset(data);
      if (data.creatorId) {
        fetchCreatorInfo(data.creatorId);
      }
      if (data.deviceSerialNumber) {
        fetchDeviceInfo(data.deviceSerialNumber);
      }
    } else {
      // Create modunda currentUserId'yi set edip bilgileri getir
      setValue("creatorId", currentUserId);
      fetchCreatorInfo(currentUserId);
    }
  }, [data, type, reset, currentUserId, setValue]);

  useEffect(() => {
    if (selectedCreatorId) {
      fetchCreatorInfo(selectedCreatorId);
    }
  }, [selectedCreatorId]);

  useEffect(() => {
    if (debouncedSerialNumber) {
      fetchDeviceInfo(debouncedSerialNumber);
    }
  }, [debouncedSerialNumber]);

  const fetchCreatorInfo = async (creatorId: string) => {
    try {
      const response = await fetch(`/api/users/detail/${creatorId}`);
      if (!response.ok) {
        throw new Error('Kullanıcı bilgileri alınamadı');
      }
      const data = await response.json();
      setCreatorInfo(data);
      setValue("creatorInsId", data.institutionId);
      toast.success('Oluşturan kişi bilgileri yüklendi');
    } catch (error) {
      console.error("Creator bilgisi alınamadı:", error);
      toast.error('Oluşturan kişi bilgileri alınamadı');
    }
  };

  const fetchDeviceInfo = async (serialNumber: string) => {
    if (!serialNumber || serialNumber.length < 3) {
      setDeviceInfo(null);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`/api/devices?serialNumber=${serialNumber}`);
      if (!response.ok) {
        throw new Error('Cihaz bulunamadı');
      }
      const data = await response.json();
      setDeviceInfo(data);

      setValue("deviceId", data.id);
      setValue("deviceTypeId", data.type.id);

      toast.success('Cihaz bilgileri yüklendi');
    } catch (error) {
      console.error("Cihaz bilgisi alınamadı:", error);
      setDeviceInfo(null);
      setValue("deviceId", "");
      setValue("deviceTypeId", "");
      toast.error('Cihaz bilgileri alınamadı');
    } finally {
      setSearchLoading(false);
    }
  };

  const onSubmit = async (formData: Inputs) => {
    if (!deviceInfo) {
      toast.error('Lütfen geçerli bir cihaz seçin');
      return;
    }

    const submitPromise = new Promise(async (resolve, reject) => {
      try {
        setLoading(true);

        const endpoint = type === "create" ? '/api/notifications' : `/api/notifications/${data?.id}`;
        const method = type === "create" ? 'POST' : 'PUT';

        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(errorData || 'İşlem başarısız oldu');
        }

        await response.json();
        window.location.href = '/list/notifications';
        resolve('İşlem başarıyla tamamlandı');
      } catch (error) {
        console.error('Hata:', error);
        reject(error);
      } finally {
        setLoading(false);
      }
    });

    toast.promise(submitPromise, {
      loading: type === "create" ? 'Bildirim kaydediliyor...' : 'Bildirim güncelleniyor...',
      success: type === "create" ? 'Bildirim başarıyla kaydedildi!' : 'Bildirim başarıyla güncellendi!',
      error: (err) => `Hata: ${err.message}`
    });
  };

  return (
    <form className="flex flex-col gap-4 max-w-7xl mx-auto w-full" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Bildirim Oluştur" : "Bildirim Düzenle"}
      </h1>

      {/* Oluşturan Kişi Bilgileri */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500">Oluşturan Kişi Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex-col gap-2 hidden">
            <label className="text-xs text-gray-500">Oluşturan Kişi ID</label>
            <input
              type="text"
              {...register("creatorId")}
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm bg-gray-50"
              readOnly
            />
            {errors?.creatorId && (
              <span className="text-xs text-red-500">{errors.creatorId.message}</span>
            )}
          </div>

          {creatorInfo && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">Oluşturan Kişi</label>
                <input
                  type="text"
                  value={`${creatorInfo.name || ''}`}
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-gray-50"
                  disabled
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">Oluşturan Kurum</label>
                <input
                  type="text"
                  value={creatorInfo.institution?.name || ''}
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-gray-50"
                  disabled
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cihaz Bilgileri */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500">Cihaz Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">Cihaz Seri No</label>
            <div className="relative">
              <input
                type="text"
                {...register("deviceSerialNumber")}
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              />
              {searchLoading && (
                <div className="absolute right-2 top-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                </div>
              )}
            </div>
            {errors?.deviceSerialNumber && (
              <p className="text-xs text-red-400">{errors.deviceSerialNumber.message}</p>
            )}
          </div>

          {deviceInfo && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">Cihaz Tipi</label>
                <input
                  type="text"
                  value={deviceInfo.type?.name || ''}
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-gray-50"
                  disabled
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">Cihaz Özelliği</label>
                <input
                  type="text"
                  value={deviceInfo.feature?.name || ''}
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-gray-50"
                  disabled
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">Konum</label>
                <input
                  type="text"
                  value={deviceInfo.location || ''}
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-gray-50"
                  disabled
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bildirim İçeriği */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500">Bildirim İçeriği</h2>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">İçerik</label>
            <textarea
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm min-h-[100px] resize-none w-full"
              {...register("content")}
            />
            {errors.content?.message && (
              <p className="text-xs text-red-400">{errors.content.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Bildirim Tipi */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500">Bildirim Tipi</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NotificationTypeSelect
            register={register}
            error={errors.typeId}
          />
        </div>
      </div>

      {/* Alıcı Bilgileri */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500">Alıcı Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InstitutionSelect
            label="Alıcı Kurum"
            register={register}
            name="recipientInsId"
            error={errors.recipientInsId}
            defaultValue={data?.recipientInsId}
            showInstitutionName={true}
          />

          <UserSelect
            label="Alıcı Kullanıcı"
            name="recipientId"
            register={register}
            error={errors.recipientId}
            institutionId={selectedRecipientInsId}
          />
        </div>
      </div>

      {/* Bildirim Durumu */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500">Bildirim Durumu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">Durum</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("isRead")}
            >
              <option value="Okunmadi">Okunmadı</option>
              <option value="Okundu">Okundu</option>
            </select>
            {errors.isRead?.message && (
              <p className="text-xs text-red-400">{errors.isRead.message}</p>
            )}
          </div>
        </div>
      </div>
 
      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !deviceInfo}
        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md transition-colors disabled:opacity-50"
      >
        {loading ? "İşlem yapılıyor..." : type === "create" ? "Oluştur" : "Güncelle"}
      </button>
    </form>
  );
 };
 
 export default NotificationForm;