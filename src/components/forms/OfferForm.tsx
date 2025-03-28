"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import toast from 'react-hot-toast';
import InputField from "../InputField";
import ServiceSelect from "@/components/ServiceSelect";

type OfferSubInput = {
  serviceId: string;
  unitPrice: string;
  size: string;
  detail?: string;
  isFromRequest?: boolean;
};

interface PaymentTerm {
  id: string;
  name: string;
}

const offerSubSchema = z.object({
  serviceId: z.string().min(1, { message: "Hizmet seçimi zorunludur" }),
  unitPrice: z.string().min(1, { message: "Birim fiyat zorunludur" }),
  size: z.string().min(1, { message: "Miktar zorunludur" }),
  detail: z.string().optional(),
  isFromRequest: z.boolean().optional(),
});

const schema = z.object({
  creatorId: z.string().min(1, { message: "Oluşturan kişi seçimi zorunludur" }),
  creatorInsId: z.string().min(1, { message: "Oluşturan kurum seçimi zorunludur" }),
  recipientId: z.string().min(1, { message: "Alıcı kişi seçimi zorunludur" }),
  recipientInsId: z.string().min(1, { message: "Alıcı kurum seçimi zorunludur" }),
  offerDate: z.string().min(1, { message: "Teklif tarihi zorunludur" }),
  validityDate: z.string().min(1, { message: "Geçerlilik tarihi zorunludur" }),
  paymentTermId: z.string().min(1, { message: "Ödeme koşulu seçimi zorunludur" }),
  details: z.string()
    .min(10, { message: "Detay en az 10 karakter olmalıdır" })
    .max(500, { message: "Detay en fazla 500 karakter olabilir" }),
  status: z.enum(["Onaylandi", "Red", "Beklemede"]),
  offerSub: z.array(offerSubSchema).min(1, { message: "En az bir hizmet kalemi eklemelisiniz" }),
  requestId: z.string().optional(), // Bunu eklemeliyiz
});

type Inputs = z.infer<typeof schema>;

interface OfferFormProps {
  type: "create" | "update";
  data?: any;
  currentUserId: string; // Yeni eklenen prop
}

const OfferForm = ({ type, data, currentUserId }: OfferFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [creatorInfo, setCreatorInfo] = useState<any>(null);
  const [recipientInfo, setRecipientInfo] = useState<any>(null);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [isLoadingPaymentTerms, setIsLoadingPaymentTerms] = useState(false);

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
      ...data,
      requestId: data?.requestId, // Bunu eklemeliyiz
      creatorId: currentUserId, // currentUserId'yi ekledik
      status: type === "create" ? "Beklemede" : (data?.status || "Beklemede"),
      offerSub: data?.offerSub || [{
        serviceId: '',
        unitPrice: '',
        size: '',
        detail: ''
      }]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "offerSub"
  });

  const selectedCreatorId = watch("creatorId");
  const selectedRecipientId = watch("recipientId");

  const fetchPaymentTerms = async () => {
    try {
      setIsLoadingPaymentTerms(true);
      const response = await fetch('/api/payment-terms');
      if (!response.ok) {
        throw new Error('Ödeme koşulları yüklenemedi');
      }
      const data = await response.json();
      setPaymentTerms(data);
    } catch (error) {
      console.error("Ödeme koşulları yüklenirken hata:", error);
      toast.error('Ödeme koşulları yüklenemedi');
    } finally {
      setIsLoadingPaymentTerms(false);
    }
  };

  const fetchCreatorInfo = async (creatorId: string) => {
    try {
      const response = await fetch(`/api/users/detail/${creatorId}`);
      if (!response.ok) throw new Error('Kullanıcı bilgileri alınamadı');
      const data = await response.json();
      setCreatorInfo(data);
      setValue("creatorInsId", data.institutionId);
      toast.success('Oluşturan kişi bilgileri yüklendi');
    } catch (error) {
      console.error("Creator bilgisi alınamadı:", error);
      toast.error('Oluşturan kişi bilgileri alınamadı');
    }
  };

  const fetchRecipientInfo = async (recipientId: string) => {
    try {
      const response = await fetch(`/api/users/detail/${recipientId}`);
      if (!response.ok) throw new Error('Kullanıcı bilgileri alınamadı');
      const data = await response.json();
      setRecipientInfo(data);
      setValue("recipientInsId", data.institutionId);
      toast.success('Alıcı kişi bilgileri yüklendi');
    } catch (error) {
      console.error("Recipient bilgisi alınamadı:", error);
      toast.error('Alıcı kişi bilgileri alınamadı');
    }
  };

  useEffect(() => {
    if (data && type === "update") {
      const offerDate = data.offerDate ? new Date(data.offerDate).toISOString().slice(0, 16) : '';
      const validityDate = data.validityDate ? new Date(data.validityDate).toISOString().slice(0, 16) : '';

      reset({
        ...data,
        requestId: data.requestId, // Bunu eklemeliyiz
        offerDate,
        validityDate,
        paymentTermId: data.paymentTermId,
        offerSub: data.OfferSub?.map((sub: any) => ({
          serviceId: sub.servideId,
          unitPrice: sub.unitPrice.toString(),
          size: sub.size.toString(),
          detail: sub.detail || '',
          isFromRequest: sub.isFromRequest || false
        }))
      });

      if (data.creatorId) {
        fetchCreatorInfo(data.creatorId);
      }
      if (data.recipientId) {
        fetchRecipientInfo(data.recipientId);
      }
    } else {
      // Create modunda currentUserId'yi set edip bilgileri getir
      setValue("creatorId", currentUserId);
      fetchCreatorInfo(currentUserId);
    }

    fetchPaymentTerms();
  }, [data, type, reset, setValue, currentUserId]);

  useEffect(() => {
    if (selectedCreatorId) {
      fetchCreatorInfo(selectedCreatorId);
    }
  }, [selectedCreatorId]);

  useEffect(() => {
    if (selectedRecipientId) {
      fetchRecipientInfo(selectedRecipientId);
    }
  }, [selectedRecipientId]);

  const onSubmit = async (formData: Inputs) => {
    const submitPromise = new Promise(async (resolve, reject) => {
      try {
        setLoading(true);

        const endpoint = type === "create" ? '/api/offers' : `/api/offers/${data?.id}`;
        const method = type === "create" ? 'POST' : 'PUT';

        const requestData = {
          ...formData,
          offerSub: formData.offerSub.map(sub => ({
            ...sub,
            unitPrice: sub.unitPrice,
            size: sub.size
          }))
        };

        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(errorData || 'İşlem başarısız oldu');
        }

        await response.json();
        window.location.href = '/list/offers';
        resolve('İşlem başarıyla tamamlandı');
      } catch (error) {
        console.error('Hata:', error);
        reject(error);
      } finally {
        setLoading(false);
      }
    });

    toast.promise(submitPromise, {
      loading: type === "create" ? 'Teklif kaydediliyor...' : 'Teklif güncelleniyor...',
      success: type === "create" ? 'Teklif başarıyla kaydedildi!' : 'Teklif başarıyla güncellendi!',
      error: (err) => `Hata: ${err.message}`
    });
  };

  return (
    <form className="flex flex-col gap-4 max-w-7xl mx-auto w-full" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Teklif Ver" : "Teklif Düzenle"}
      </h1>

      {/* Oluşturan Bilgileri */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500">Oluşturan Bilgileri</h2>
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

      {/* Alıcı Bilgileri */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500">Alıcı Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="hidden">
            <InputField
              label="Alıcı Kişi ID"
              name="recipientId"
              register={register}
              error={errors?.recipientId}
            />
          </div>
          {recipientInfo && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">Alıcı Kişi</label>
                <input
                  type="text"
                  value={`${recipientInfo.name || ''}`}
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-gray-50"
                  disabled
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">Alıcı Kurum</label>
                <input
                  type="text"
                  value={recipientInfo.institution?.name || ''}
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-gray-50"
                  disabled
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Teklif Bilgileri */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500">Teklif Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">Teklif Tarihi</label>
            <input
              type="datetime-local"
              {...register("offerDate")}
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            />
            {errors.offerDate?.message && (
              <p className="text-xs text-red-400">{errors.offerDate.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">Geçerlilik Tarihi</label>
            <input
              type="datetime-local"
              {...register("validityDate")}
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            />
            {errors.validityDate?.message && (
              <p className="text-xs text-red-400">{errors.validityDate.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">Ödeme Koşulu</label>
            <select
              {...register("paymentTermId")}
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:bg-gray-50"
              disabled={isLoadingPaymentTerms}
            >
              <option value="">Seçiniz</option>
              {paymentTerms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>
            {isLoadingPaymentTerms && (
              <p className="text-xs text-gray-500">Ödeme koşulları yükleniyor...</p>
            )}
            {errors.paymentTermId?.message && (
              <p className="text-xs text-red-400">{errors.paymentTermId.message}</p>
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

      {/* Teklif Kalemleri */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-medium text-gray-500">Teklif Kalemleri</h2>
          <button
            type="button"
            onClick={() => append({ serviceId: '', unitPrice: '', size: '', detail: '' })}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm"
          >
            Kalem Ekle
          </button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="p-4 border rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Kalem #{index + 1}</h3>
              {!field.isFromRequest && fields.length > 1 && (
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
                name={`offerSub.${index}.serviceId`}
                error={errors.offerSub?.[index]?.serviceId}
                defaultValue={field.serviceId}
                disabled={field.isFromRequest}
              />

              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">Miktar</label>
                <input
                  type="number"
                  step="0.01"
                  {...register(`offerSub.${index}.size`)}
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-gray-50"
                  disabled={field.isFromRequest}
                />
                {errors.offerSub?.[index]?.size?.message && (
                  <p className="text-xs text-red-400">{errors.offerSub?.[index]?.size?.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">Birim Fiyat</label>
                <input
                  type="number"
                  step="0.01"
                  {...register(`offerSub.${index}.unitPrice`)}
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                />
                {errors.offerSub?.[index]?.unitPrice?.message && (
                  <p className="text-xs text-red-400">{errors.offerSub?.[index]?.unitPrice?.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">Detay</label>
                <input
                  type="text"
                  {...register(`offerSub.${index}.detail`)}
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-gray-50"
                  disabled={field.isFromRequest}
                />
                {errors.offerSub?.[index]?.detail?.message && (
                  <p className="text-xs text-red-400">{errors.offerSub?.[index]?.detail?.message}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Genel Toplam */}
        <div className="flex justify-end p-4 border rounded-lg">
          <div className="flex flex-col gap-2 w-64">
            <label className="text-xs text-gray-500">Genel Toplam</label>
            <input
              type="text"
              value={fields.reduce((total, _, index) => {
                const unitPrice = parseFloat(watch(`offerSub.${index}.unitPrice`) || '0');
                const size = parseFloat(watch(`offerSub.${index}.size`) || '0');
                return total + (unitPrice * size);
              }, 0).toFixed(2)}
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-gray-50 font-semibold"
              disabled
            />
          </div>
        </div>
      </div>

      {/* Durum Seçimi */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500">Teklif Durumu</h2>
        <div className="flex flex-col gap-2">
          <select
            {...register("status")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          >
            <option value="Beklemede">Beklemede</option>
            <option value="Onaylandi">Onaylandı</option>
            <option value="Red">Red</option>
          </select>
          {errors.status?.message && (
            <p className="text-xs text-red-400">{errors.status.message}</p>
          )}
        </div>
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

export default OfferForm;