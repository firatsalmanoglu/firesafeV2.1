// Bu form diğer formlara göre daha basit. İşte detaylı dökümü:
// API Endpoints:
// /api/institutions - Kurum oluşturma için POST isteği yapılan endpoint

// Özel Componentler:
// InputField - Form inputları için kullanılan temel input bileşeni (import edilmiş ama kullanılmamış)

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const schema = z.object({
    name: z.string().min(1, { message: "Bu alan boş geçilemez!" }),
    address: z.string().min(1, { message: "Bu alan boş geçilemez!" }),
    email: z.string()
        .min(1, { message: "Email adresi zorunludur" })
        .email({ message: "Geçerli bir email adresi giriniz (örnek: kurum@domain.com)" }),
    phone: z.string()
        .refine((val) => {
            if (!val) return false;  // zorunlu alan olduğu için boş geçilemez
            const phoneRegex = /^[0-9]{10}$/;
            return phoneRegex.test(val.replace(/\s/g, ''));
        }, {
            message: "Telefon numarası 10 haneli olmalı ve sadece rakam içermelidir"
        }),
    registrationDate: z.string().default(() => new Date().toISOString().split('T')[0]),

});

type Inputs = z.infer<typeof schema>;

const InstitutionForm = ({
    type,
    data,
}: {
    type: "create" | "update";
    data?: any;
}) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue, // Bunu ekle
        formState: { errors },
    } = useForm<Inputs>({
        resolver: zodResolver(schema),
    });

    // useEffect ekleyelim (register üstüne)
    useEffect(() => {
        if (data) {
            setValue('name', data.name);
            setValue('address', data.address);
            setValue('email', data.email);
            setValue('phone', data.phone);
            setValue('registrationDate', data.registrationDate);
        }
    }, [data, setValue]);

    const onSubmit = async (values: Inputs) => {
        try {
            setLoading(true);

            const validationResult = schema.safeParse(values);
            if (!validationResult.success) {
                console.error("Validation hatası:", validationResult.error);
                throw new Error("Form validation hatası");
            }

            // Update durumunda farklı endpoint ve method kullan
            const url = type === "create" ? '/api/institutions' : `/api/institutions`;
            const method = type === "create" ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...(type === "update" && { id: data.id }), // Update durumunda ID'yi ekle
                    ...values,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error('İşlem başarısız oldu: ' + errorText);
            }

            await response.json();
            window.location.href = '/list/institutions';
        } catch (error) {
            console.error('Error:', error);
            alert(type === "create" ? 'Kurum oluşturulurken bir hata oluştu!' : 'Kurum güncellenirken bir hata oluştu!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="flex flex-col gap-4 max-w-7xl mx-auto w-full" onSubmit={handleSubmit(onSubmit)}>
  
            <h1 className="text-xl font-semibold">
                {type === "create" ? "Kurum Oluştur" : "Kurumu Düzenle"}
            </h1>

            {/* Kurum Bilgileri */}
            <div className="space-y-4">
                <h2 className="text-sm font-medium text-gray-500">Kurum Bilgileri</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500">Adı</label>
                        <input
                            type="text"
                            {...register("name")}
                            defaultValue={data?.name}
                            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
                        />
                        {errors?.name && (
                            <span className="text-xs text-red-500">{errors.name.message}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500">Adresi</label>
                        <input
                            type="text"
                            {...register("address")}
                            defaultValue={data?.address}
                            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
                        />
                        {errors?.address && (
                            <span className="text-xs text-red-500">{errors.address.message}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500">Email</label>
                        <input
                            type="email"
                            {...register("email")}
                            defaultValue={data?.email}
                            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
                        />
                        {errors?.email && (
                            <span className="text-xs text-red-500">{errors.email.message}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500">Tel</label>
                        <input
                            type="text"
                            {...register("phone")}
                            defaultValue={data?.phone}
                            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
                        />
                        {errors?.phone && (
                            <span className="text-xs text-red-500">{errors.phone.message}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500">Kayıt Tarihi</label>
                        <input
                            type="date"
                            {...register("registrationDate")}
                            defaultValue={new Date().toISOString().split('T')[0]}
                            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm bg-gray-50"
                            disabled
                        />
                        {errors?.registrationDate && (
                            <span className="text-xs text-red-500">{errors.registrationDate.message}</span>
                        )}
                    </div>


                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md transition-colors disabled:opacity-50 mt-4"
            >
                {loading ? 'Kaydediliyor...' : type === "create" ? "Oluştur" : "Güncelle"}
            </button>
        </form>
    );
};

export default InstitutionForm;