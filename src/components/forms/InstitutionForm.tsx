"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

// Tip tanımları
interface Country {
  id: string;
  name: string;
  code?: string;
  phoneCode?: string;
}

interface City {
  id: string;
  name: string;
  countryId: string;
}

interface District {
  id: string;
  name: string;
  cityId: string;
}

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
    countryId: z.string().optional(),
    cityId: z.string().optional(),
    districtId: z.string().optional(),
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
    const [countries, setCountries] = useState<Country[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    
    // İlk yükleme işlemini takip etmek için ref kullanıyoruz
    const isInitializing = useRef(type === "update");
    const hasInitialized = useRef(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<Inputs>({
        resolver: zodResolver(schema),
    });

    // İzlenen alanlar
    const watchCountry = watch("countryId");
    const watchCity = watch("cityId");

    // Ülkeleri getirme
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await fetch('/api/countries');
                if (!response.ok) {
                    throw new Error('Ülkeler getirilirken bir hata oluştu');
                }
                const countriesData = await response.json();
                setCountries(countriesData);
                
                // Eğer create modundaysa, initializing'i false yap
                if (type === "create") {
                    isInitializing.current = false;
                }
            } catch (error) {
                console.error('Error fetching countries:', error);
                // Hata durumunda da initializing'i false yap
                isInitializing.current = false;
            }
        };

        fetchCountries();
    }, [type]);

    // İlk yükleme için - Form verilerini yükleme (düzenleme durumunda)
    useEffect(() => {
        // Sadece update modunda, ülkeler yüklendikten sonra ve henüz başlatılmamışsa çalışır
        if (type !== "update" || !data || countries.length === 0 || !isInitializing.current) {
            return;
        }

        const initForm = async () => {
            try {
                // Temel form değerlerini ayarla
                setValue('name', data.name);
                setValue('address', data.address);
                setValue('email', data.email);
                setValue('phone', data.phone);
                setValue('registrationDate', data.registrationDate?.split('T')[0] || new Date().toISOString().split('T')[0]);
                
                // Ülke, şehir ve ilçe değerlerini ayarlama
                if (data.countryId) {
                    setValue('countryId', data.countryId);
                    
                    // Şehirleri yükle
                    const cityResponse = await fetch(`/api/cities?countryId=${data.countryId}`);
                    if (!cityResponse.ok) throw new Error('Şehirler yüklenirken hata oluştu');
                    
                    const cityData = await cityResponse.json();
                    setCities(cityData);
                    
                    if (data.cityId) {
                        // Şehri ayarla
                        setValue('cityId', data.cityId);
                        
                        // İlçeleri yükle
                        const districtResponse = await fetch(`/api/districts?cityId=${data.cityId}`);
                        if (!districtResponse.ok) throw new Error('İlçeler yüklenirken hata oluştu');
                        
                        const districtData = await districtResponse.json();
                        setDistricts(districtData);
                        
                        if (data.districtId) {
                            // İlçeyi ayarla
                            setValue('districtId', data.districtId);
                        }
                    }
                }
                
                // İlk yükleme işlemi tamamlandı
                isInitializing.current = false;
                hasInitialized.current = true;
                
            } catch (error) {
                console.error('Form verileri yüklenirken hata:', error);
                isInitializing.current = false;
            }
        };

        initForm();
    }, [data, countries, setValue, type]);

    // Kullanıcı ülkeyi değiştirdiğinde şehirleri getir
    useEffect(() => {
        // watchCountry yoksa hiçbir şey yapma
        if (!watchCountry) return;
        
        // İlk yükleme sırasında çalışmasını engelle (sadece update modunda)
        if (type === "update" && isInitializing.current) return;

        const fetchCities = async () => {
            try {
                // Eğer update modundaysa ve ilk yükleme tamamlandıysa veya create modundaysa
                if ((type === "update" && hasInitialized.current) || type === "create") {
                    // Şehir ve ilçe seçimlerini temizle
                    setValue('cityId', '');
                    setValue('districtId', '');
                    setDistricts([]);
                }

                const response = await fetch(`/api/cities?countryId=${watchCountry}`);
                if (!response.ok) {
                    throw new Error('Şehirler getirilirken bir hata oluştu');
                }
                const cityData = await response.json();
                setCities(cityData);
            } catch (error) {
                console.error('Error fetching cities:', error);
            }
        };

        fetchCities();
    }, [watchCountry, setValue, type]);

    // Kullanıcı şehri değiştirdiğinde ilçeleri getir
    useEffect(() => {
        // watchCity yoksa hiçbir şey yapma
        if (!watchCity) return;
        
        // İlk yükleme sırasında çalışmasını engelle (sadece update modunda)
        if (type === "update" && isInitializing.current) return;

        const fetchDistricts = async () => {
            try {
                // Eğer update modundaysa ve ilk yükleme tamamlandıysa veya create modundaysa
                if ((type === "update" && hasInitialized.current) || type === "create") {
                    // İlçe seçimini temizle
                    setValue('districtId', '');
                }

                const response = await fetch(`/api/districts?cityId=${watchCity}`);
                if (!response.ok) {
                    throw new Error('İlçeler getirilirken bir hata oluştu');
                }
                const districtData = await response.json();
                setDistricts(districtData);
            } catch (error) {
                console.error('Error fetching districts:', error);
            }
        };

        fetchDistricts();
    }, [watchCity, setValue, type]);

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
                            placeholder="5xxxxxxxxx"
                            {...register("phone")}
                            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
                        />
                        {errors?.phone && (
                            <span className="text-xs text-red-500">{errors.phone.message}</span>
                        )}
                    </div>

                    {/* Lokasyon Bilgileri */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500">Ülke</label>
                        <select
                            {...register("countryId")}
                            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
                        >
                            <option value="">-- Ülke Seçin --</option>
                            {countries.map((country) => (
                                <option key={country.id} value={country.id}>
                                    {country.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500">Şehir</label>
                        <select
                            {...register("cityId")}
                            disabled={!watchCountry}
                            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm disabled:bg-gray-100"
                        >
                            <option value="">-- Şehir Seçin --</option>
                            {cities.map((city) => (
                                <option key={city.id} value={city.id}>
                                    {city.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500">İlçe</label>
                        <select
                            {...register("districtId")}
                            disabled={!watchCity}
                            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm disabled:bg-gray-100"
                        >
                            <option value="">-- İlçe Seçin --</option>
                            {districts.map((district) => (
                                <option key={district.id} value={district.id}>
                                    {district.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500">Kayıt Tarihi</label>
                        <input
                            type="date"
                            {...register("registrationDate")}
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