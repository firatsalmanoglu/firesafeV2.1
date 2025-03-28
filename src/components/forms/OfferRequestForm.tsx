"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import toast from 'react-hot-toast';
import InputField from "../InputField";
import ServiceSelect from "@/components/ServiceSelect";

// Form validation şeması
const requestSubSchema = z.object({
  requiredDate: z.string().min(1, { message: "Gerekli tarih zorunludur" }),
  serviceId: z.string().min(1, { message: "Hizmet seçimi zorunludur" }),
  quantity: z.string().min(1, { message: "Miktar zorunludur" }),
  detail: z.string().optional(),
});

const schema = z.object({
  creatorId: z.string().min(1, { message: "Oluşturan kişi seçimi zorunludur" }),
  creatorInsId: z.string().min(1, { message: "Oluşturan kurum seçimi zorunludur" }),
  start: z.string().min(1, { message: "Başlangıç tarihi zorunludur" }),
  end: z.string().min(1, { message: "Bitiş tarihi zorunludur" }),
  details: z.string()
    .min(10, { message: "Detay en az 10 karakter olmalıdır" })
    .max(500, { message: "Detay en fazla 500 karakter olabilir" }),
  status: z.enum(["Aktif", "Pasif", "Beklemede", "Iptal", "TeklifAlindi", "Tamamlandi"]),
  requestSub: z.array(requestSubSchema).min(1, { message: "En az bir hizmet kalemi eklemelisiniz" })
});

type Inputs = z.infer<typeof schema>;

interface OfferRequestFormProps {
  type: "create" | "update";
  data?: any;
  currentUserId: string; // Yeni eklenen prop
}

const OfferRequestForm = ({ type, data, currentUserId }: OfferRequestFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [creatorInfo, setCreatorInfo] = useState<any>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: type === "create" ? "Beklemede" : (data?.status || "Beklemede"),
      creatorId: currentUserId, // currentUserId'yi ekledik
      requestSub: data?.requestSub || [{
        requiredDate: '',
        serviceId: '',
        quantity: '',
        detail: ''
      }]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "requestSub"
  });

  const selectedCreatorId = watch("creatorId");

  useEffect(() => {
    if (data && type === "update") {
      // Tarihleri doğru formata çeviriyoruz
      setValue('start', new Date(data.start).toISOString().slice(0, 16));
      setValue('end', new Date(data.end).toISOString().slice(0, 16));
      setValue('creatorId', data.creatorId);
      setValue('creatorInsId', data.creatorInsId);
      setValue('status', data.status);
      setValue('details', data.details);

      // Alt kalemleri set ediyoruz
      data.requestSub?.forEach((sub: any, index: number) => {
        setValue(`requestSub.${index}.requiredDate`, new Date(sub.requiredDate).toISOString().slice(0, 16));
        setValue(`requestSub.${index}.serviceId`, sub.serviceId);
        setValue(`requestSub.${index}.quantity`, sub.quantity.toString());
        setValue(`requestSub.${index}.detail`, sub.detail || '');
      });

      if (data.creatorId) {
        fetchCreatorInfo(data.creatorId);
      }
    } else {
      // Create modunda currentUserId'yi set edip bilgileri getir
      setValue("creatorId", currentUserId);
      fetchCreatorInfo(currentUserId);
    }
  }, [data, type, setValue, currentUserId]);

  useEffect(() => {
    if (selectedCreatorId) {
      fetchCreatorInfo(selectedCreatorId);
    }
  }, [selectedCreatorId]);

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

  const onSubmit = async (formData: Inputs) => {
    const submitPromise = new Promise(async (resolve, reject) => {
      try {
        setLoading(true);

        const endpoint = type === "create" ? '/api/offer-requests' : `/api/offer-requests/${data?.id}`;
        const method = type === "create" ? 'POST' : 'PUT';

        const requestData = {
          ...formData,
          requestSub: formData.requestSub.map(sub => ({
            ...sub,
            quantity: sub.quantity
          }))
        };

        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(errorData || 'İşlem başarısız oldu');
        }

        await response.json();
        window.location.href = '/list/offerRequests'; 
        resolve('İşlem başarıyla tamamlandı');
      } catch (error) {
        console.error('Hata:', error);
        reject(error);
      } finally {
        setLoading(false);
      }
    });

    toast.promise(submitPromise, {
      loading: type === "create" ? 'Teklif talebi kaydediliyor...' : 'Teklif talebi güncelleniyor...',
      success: type === "create" ? 'Teklif talebi başarıyla kaydedildi!' : 'Teklif talebi başarıyla güncellendi!',
      error: (err) => `Hata: ${err.message}`
    });
  };

  return (
    <form className="flex flex-col gap-4 max-w-7xl mx-auto w-full" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Teklif Talebi Oluştur" : "Teklif Talebi Düzenle"}
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

      {/* Teklif Talebi Bilgileri */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500">Teklif Talebi Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">Başlangıç Tarihi</label>
            <input
              type="datetime-local"
              {...register("start")}
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            />
            {errors.start?.message && (
              <p className="text-xs text-red-400">{errors.start.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">Bitiş Tarihi</label>
            <input
              type="datetime-local"
              {...register("end")}
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            />
            {errors.end?.message && (
              <p className="text-xs text-red-400">{errors.end.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-xs text-gray-500">Detay</label>
            <textarea
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm min-h-[100px] resize-none w-full"
              {...register("details")}
            />
            {errors.details?.message && (
              <p className="text-xs text-red-400">{errors.details.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Talep Edilen Hizmetler */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-medium text-gray-500">Talep Edilen Hizmetler</h2>
          <button
            type="button"
            onClick={() => append({ requiredDate: '', serviceId: '', quantity: '', detail: '' })}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm"
          >
            Hizmet Ekle
          </button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="p-4 border rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Hizmet #{index + 1}</h3>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-red-500 hover:text-red-600 text-sm"
                >
                  Kaldır
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ServiceSelect
                label="Hizmet"
                register={register}
                name={`requestSub.${index}.serviceId`}
                error={errors.requestSub?.[index]?.serviceId}
                value={field.serviceId}
              />

              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">Gerekli Tarih</label>
                <input
                  type="datetime-local"
                  {...register(`requestSub.${index}.requiredDate`)}
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                />
                {errors.requestSub?.[index]?.requiredDate?.message && (
                  <p className="text-xs text-red-400">{errors.requestSub?.[index]?.requiredDate?.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">Miktar</label>
                <input
                  type="number"
                  step="0.01"
                  {...register(`requestSub.${index}.quantity`)}
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                />
                {errors.requestSub?.[index]?.quantity?.message && (
                  <p className="text-xs text-red-400">{errors.requestSub?.[index]?.quantity?.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">Detay</label>
                <input
                  type="text"
                  {...register(`requestSub.${index}.detail`)}
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                />
                {errors.requestSub?.[index]?.detail?.message && (
                  <p className="text-xs text-red-400">{errors.requestSub?.[index]?.detail?.message}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
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

export default OfferRequestForm;