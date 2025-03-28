// Bu form, bir bakım kartı oluşturma/güncelleme formu ve daha karmaşık API etkileşimleri içeriyor. İşte detaylı dökümü:
// API Endpoints:
// /api/devices?serialNumber=${debouncedSerialNumber} - Cihaz arama endpoint'i
// /api/operations?deviceTypeId=${data.type.id} - Cihaz tipine göre bakım operasyonlarını getiren endpoint
// /api/maintenance-cards - Bakım kartı oluşturma/güncelleme endpoint'i

// Özel Componentler:
// InputField - Form inputları için kullanılan temel input bileşeni (import edilmiş ama kullanılmamış)

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useDebounce } from 'use-debounce';

// Veri tipi tanımlamaları
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
    owner: {
        id: string;
        name: string;
    };
    ownerIns: {
        id: string;
        name: string;
    };
    provider: {
        id: string;
        name: string;
    };
    providerIns: {
        id: string;
        name: string;
    };
}

interface Operation {
    id: string;
    name: string;
}

const schema = z.object({
    serialNumber: z.string().min(1, { message: "Cihaz seri numarası zorunludur!" }),
    maintenanceDate: z.string().default(() => new Date().toISOString().split('T')[0]),
    nextMaintenanceDate: z.string().min(1, { message: "Sonraki bakım tarihi zorunludur!" }),
    details: z.string().optional(),
    operations: z.array(z.string()).min(1, { message: "En az bir işlem seçilmelisiniz!" })
});

type Inputs = z.infer<typeof schema>;

const MaintenanceForm = ({ type, data }: { type: "create" | "update"; data?: any; }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [deviceData, setDeviceData] = useState<Device | null>(null);
    const [operations, setOperations] = useState<Operation[]>([]);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<Inputs>({
        resolver: zodResolver(schema),
        defaultValues: {
            serialNumber: data?.serialNumber || "",
            maintenanceDate: new Date().toISOString().split('T')[0],
            nextMaintenanceDate: data?.nextMaintenanceDate ? new Date(data.nextMaintenanceDate).toISOString().split('T')[0] : "",
            details: data?.details || "",
            operations: data?.operations || []
        }
    });

    // Seri numarası değişikliğini izle
    const serialNumber = watch('serialNumber');
    const [debouncedSerialNumber] = useDebounce(serialNumber, 500);

    useEffect(() => {
        const searchDevice = async () => {
            if (!debouncedSerialNumber || debouncedSerialNumber.length < 3) {
                setDeviceData(null);
                setOperations([]);
                return;
            }

            setSearchLoading(true);
            try {
                const response = await fetch(`/api/devices?serialNumber=${debouncedSerialNumber}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Cihaz bulunamadı');
                }

                setDeviceData(data);

                // Cihaz türüne göre operasyonları getir
                if (data.type.id) {
                    const operationsResponse = await fetch(`/api/operations?deviceTypeId=${data.type.id}`);
                    const operationsData = await operationsResponse.json();

                    if (!operationsResponse.ok) {
                        throw new Error('İşlemler getirilemedi');
                    }

                    setOperations(operationsData);
                }

                toast.success('Cihaz bilgileri getirildi');
            } catch (error) {
                console.error('Cihaz arama hatası:', error);
                setDeviceData(null);
                setOperations([]);
                toast.error(error instanceof Error ? error.message : 'Cihaz bulunamadı');
            } finally {
                setSearchLoading(false);
            }
        };

        searchDevice();
    }, [debouncedSerialNumber]);

    const onSubmit = async (formData: Inputs) => {
        if (!deviceData) {
          toast.error('Lütfen geçerli bir cihaz seçin');
          return;
        }
      
        try {
          setLoading(true);
          
          // Create ve update için farklı URL ve method kullan
          const url = type === "create" ? '/api/maintenance-cards' : `/api/maintenance-cards/${data?.id}`;
          const method = type === "create" ? 'POST' : 'PUT';
      
          const requestData = {
            deviceId: deviceData.id,
            deviceTypeId: deviceData.type.id,
            deviceFeatureId: deviceData.feature.id,
            providerId: deviceData.provider.id,
            providerInsId: deviceData.providerIns.id,
            customerId: deviceData.owner.id,
            customerInsId: deviceData.ownerIns.id,
            maintenanceDate: formData.maintenanceDate,
            nextMaintenanceDate: formData.nextMaintenanceDate,
            details: formData.details,
            operations: formData.operations,
          };
      
          const response = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
          });
      
          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || "Bir hata oluştu");
          }
      
          // Başarılı response
          const result = await response.json().catch(() => ({}));
          
          toast.success(type === "create" ? "Bakım kartı oluşturuldu" : "Bakım kartı güncellendi");
          await response.json();
          window.location.href = '/list/maintenances';
        } catch (error) {
          console.error('Error:', error);
          toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
        } finally {
          setLoading(false);
        }
      };

    return (
        <form className="flex flex-col gap-4 max-w-7xl mx-auto w-full" onSubmit={handleSubmit(onSubmit)}>
            <h1 className="text-xl font-semibold">Bakım Kartı</h1>

            {/* Cihaz Bilgileri */}
            <div className="space-y-4">
                <h2 className="text-sm font-medium text-gray-500">Cihaz Bilgileri</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500">Cihaz Seri No</label>
                        <div className="relative">
                            <input
                                type="text"
                                {...register("serialNumber")}
                                className="w-full ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
                            />
                            {searchLoading && (
                                <div className="absolute right-2 top-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                                </div>
                            )}
                        </div>
                        {errors?.serialNumber && (
                            <span className="text-xs text-red-500">{errors.serialNumber.message}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500">Cihaz Türü</label>
                        <input
                            type="text"
                            value={deviceData?.type.name || ''}
                            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm bg-gray-50"
                            disabled
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500">Cihaz Özelliği</label>
                        <input
                            type="text"
                            value={deviceData?.feature.name || ''}
                            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm bg-gray-50"
                            disabled
                        />
                    </div>
                </div>
            </div>

            {/* Sorumlu Personel Bilgileri */}
            <div className="space-y-4">
                <h2 className="text-sm font-medium text-gray-500">Sorumlu Personel Bilgileri</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500">Sorumlu Personel</label>
                        <input
                            type="text"
                            value={deviceData ? deviceData.owner.name : ''}
                            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm bg-gray-50"
                            disabled
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500">Sorumlu Personel Kurumu</label>
                        <input
                            type="text"
                            value={deviceData?.ownerIns.name || ''}
                            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm bg-gray-50"
                            disabled
                        />
                    </div>
                </div>
            </div>

            {/* Bakım Personeli Bilgileri */}
            <div className="space-y-4">
                <h2 className="text-sm font-medium text-gray-500">Bakım Personeli Bilgileri</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500">Bakım Personeli</label>
                        <input
                            type="text"
                            value={deviceData ? deviceData.provider.name : ''}
                            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm bg-gray-50"
                            disabled
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500">Bakım Yapan Kurum</label>
                        <input
                            type="text"
                            value={deviceData?.providerIns.name || ''}
                            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm bg-gray-50"
                            disabled
                        />
                    </div>
                </div>
            </div>

            {/* Bakım Bilgileri */}
            <div className="space-y-4">
                <h2 className="text-sm font-medium text-gray-500">Bakım Bilgileri</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500">Bakım Tarihi</label>
                        <input
                            type="date"
                            {...register("maintenanceDate")}
                            defaultValue={new Date().toISOString().split('T')[0]}
                            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm bg-gray-50"
                            disabled
                        />
                        {errors?.maintenanceDate && (
                            <span className="text-xs text-red-500">{errors.maintenanceDate.message}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500">Sonraki Bakım Tarihi</label>
                        <input
                            type="date"
                            {...register("nextMaintenanceDate")}
                            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
                        />
                        {errors?.nextMaintenanceDate && (
                            <span className="text-xs text-red-500">{errors.nextMaintenanceDate.message}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 col-span-2">
                        <label className="text-xs text-gray-500">Detaylar</label>
                        <textarea
                            {...register("details")}
                            rows={4}
                            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm resize-none"
                        />
                        {errors?.details && (
                            <span className="text-xs text-red-500">{errors.details.message}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Operasyonlar */}
            {operations.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-sm font-medium text-gray-500">Bakım İşlemleri</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {operations.map((operation) => (
                            <div key={operation.id} className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id={operation.id}
                                    value={operation.id}
                                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                    {...register('operations')}
                                />
                                <label
                                    htmlFor={operation.id}
                                    className="text-sm text-gray-700"
                                >
                                    {operation.name}
                                </label>
                            </div>
                        ))}
                    </div>
                    {errors.operations && (
                        <p className="text-xs text-red-500 mt-1">{errors.operations.message}</p>
                    )}
                </div>
            )}

            <button
                type="submit"
                disabled={loading || !deviceData}
                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md transition-colors disabled:opacity-50"
            >
                {loading ? "İşlem yapılıyor..." : type === "create" ? "Oluştur" : "Güncelle"}
            </button>
        </form>
    );
};

export default MaintenanceForm;