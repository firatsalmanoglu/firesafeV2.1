"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import Image from "next/image";

const schema = z.object({
  id: z
    .string()
    .min(3, { message: "KUllanıcı ID min 3 karakter uzunluğunda olmalı!" })
    .max(20, { message: "KUllanıcı ID maks 20 karakter uzunluğunda olmalı!" }),
  name: z
    .string()
    .min(3, { message: "Kullanıcı Adı min 3 karakter uzunluğunda olmalı!" })
    .max(20, { message: "KUllanıcı Adı maks 20 karakter uzunluğunda olmalı!" }),
  password: z
    .string()
    .min(8, { message: "Password en az 8 karakter uzunluğunda olmalı!" }),
  
  bloodType: z
  .enum(["A+", "A-", "B+", "B-", "AB+", "AB-","0+", "0-"], { message: "Bu alan boş geçilemez!" }),  
  birthday: z.
    date({ message: "Bu alan boş geçilemez!" }),
  sex: z
    .enum(["male", "female", "other"], { message: "Bu alan boş geçilemez!" }),
  email: z.string().email({ message: "Geçersiz e-posta!" }),
  phoneNumber: z.string().min(1, { message: "Bu alan boş geçilemez!" }),
  registrationDate: z.string().min(1, { message: "Bu alan boş geçilemez!" }),
  organizationId: z
    .string().min(1, { message: "Bu alan boş geçilemez!" }),
  organizationName: z
    .string().min(1, { message: "Bu alan boş geçilemez!" }),
  role: z
  .enum(["admin", "customerI", "customerII", "providerI", "providerII"], { message: "Bu alan boş geçilemez!" }),
  // address: z.string().min(1, { message: "Bu alan boş geçilemez!" }),
  photo: z.instanceof(File, { message: "Bu alan boş geçilemez!" }),
  
});

type Inputs = z.infer<typeof schema>;

const ProviderForm = ({
  type,
  data,
}: {
  type: "create" | "update";
  data?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit((data) => {
    console.log(data);
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">Yeni Hizmet Sağlayıcı Oluştur</h1>
      <span className="text-xs text-gray-400 font-medium">
        Kimlik Doğrulama Bilgileri
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Kullaıcı ID"
          name="userId"
          defaultValue={data?.id}
          register={register}
          error={errors?.id}
        />
        <InputField
          label="Kullaıcı Adı"
          name="userName"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />
        <InputField
          label="Şifre"
          name="password"
          type="password"
          defaultValue={data?.password}
          register={register}
          error={errors?.password}
        />
        
        
      </div>
      <span className="text-xs text-gray-400 font-medium">
        Kişisel Bilgiler
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Adı"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors.name}
        />
        

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Kan Grubu</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("bloodType")}
            defaultValue={data?.bloodType}
          >
            <option value="A+">A Rh Pozitif /A+/</option>
            <option value="A-"> A Rh Negatif /A-/</option>
            <option value="B+">B Rh Pozitif /B+/</option>
            <option value="B-">B Rh Negatif /B+/</option>
            <option value="AB+">AB Rh Pozitif /AB+/</option>
            <option value="AB-">AB Rh Negatif /AB+/</option>
            <option value="0+">0 Rh Pozitif /0+/</option>
            <option value="0-">0 Rh Negatif /0-/</option>

          </select>
          {errors.bloodType?.message && (
            <p className="text-xs text-red-400">
              {errors.bloodType.message.toString()}
            </p>
          )}

        </div>
        <InputField
          label="Doğum Tarihi"
          name="birthday"
          defaultValue={data?.birthday}
          register={register}
          error={errors.birthday}
          type="date"
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Cinsiyet</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("sex")}
            defaultValue={data?.sex}
          >
            <option value="male">Erkek</option>
            <option value="female">Kadın</option>
            <option value="other">Diğer</option>

          </select>
          {errors.sex?.message && (
            <p className="text-xs text-red-400">
              {errors.sex.message.toString()}
            </p>
          )}

        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Rol</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("role")}
            defaultValue={data?.role}
          >
            <option value="admin">Admin</option>
            <option value="customerI">I. Seviye Müşteri</option>
            <option value="customerII">II. Seviye Müşteri</option>
            <option value="providerI">I. Servis Sağlayıcı</option>
            <option value="providerII">II. Servis Sağlayıcı</option>


          </select>
          {errors.role?.message && (
            <p className="text-xs text-red-400">
              {errors.role.message.toString()}
            </p>
          )}

        </div>
        <InputField
          label="Email"
          name="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
        />
        <InputField
          label="Tel"
          name="phoneNumber"
          defaultValue={data?.phoneNumber}
          register={register}
          error={errors.phoneNumber}
        />
        
        <InputField
          label="Üyelik Tarihi"
          name="registrationDate"
          defaultValue={data?.registrationDate}
          register={register}
          error={errors.registrationDate}
          type="date"
        />

        </div>
      <span className="text-xs text-gray-400 font-medium">
        Kurum
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        
        <InputField
          label="ID"
          name="organizationId"
          defaultValue={data?.organizationId}
          register={register}
          error={errors.organizationId}
        />
        <InputField
          label="Adı"
          name="organizationName"
          defaultValue={data?.organizationName}
          register={register}
          error={errors.organizationName}
        />
        {/* <InputField
          label="Adres"
          name="address"
          defaultValue={data?.address}
          register={register}
          error={errors.address}
        /> */}
        
        
        <div className="flex flex-col gap-2 w-full md:w-1/4 justify-center">
          <label
            className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer"
            htmlFor="img"
          >
            <Image src="/upload.png" alt="" width={28} height={28} />
            <span>Foto Yükleyin</span>
          </label>
          <input type="file" id="img" {...register("photo")} className="hidden" />
          {errors.photo?.message && (
            <p className="text-xs text-red-400">
              {errors.photo.message.toString()}
            </p>
          )}
        </div>
      </div>
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ProviderForm;