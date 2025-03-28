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
  isgNumber: z
    .string()
    .min(3, { message: "KUllanıcı ID min 3 karakter uzunluğunda olmalı!" })
    .max(20, { message: "KUllanıcı ID maks 20 karakter uzunluğunda olmalı!" }),
  name: z
    .string()
    .min(3, { message: "Kullanıcı Adı min 3 karakter uzunluğunda olmalı!" })
    .max(20, { message: "KUllanıcı Adı maks 20 karakter uzunluğunda olmalı!" }),
  contractDate: z.
    date({ message: "Bu alan boş geçilemez!" }),
  institutionId: z
    .string().min(1, { message: "Bu alan boş geçilemez!" }),
  
});

type Inputs = z.infer<typeof schema>;

const IsgMemberForm = ({
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
      <h1 className="text-xl font-semibold">Yeni ISG Sorumlusu Oluştur</h1>
      <span className="text-xs text-gray-400 font-medium">
        Bilgileri
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Kullaıcı ID"
          name="id"
          defaultValue={data?.id}
          register={register}
          error={errors?.id}
        />
        <InputField
          label="ISG Numarası"
          name="isgNumber"
          defaultValue={data?.isgNumber}
          register={register}
          error={errors?.isgNumber}
        />
        <InputField
          label="Adı-Soyadı"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />

        <InputField
          label="Kontrat Tarihi"
          name="contractDate"
          defaultValue={data?.contractDate}
          register={register}
          error={errors.contractDate}
          type="date"
        />

        <InputField
          label="Kurum ID"
          name="institutionId"
          defaultValue={data?.institutionId}
          register={register}
          error={errors.institutionId}
        />
               
        
      </div>
      
     
        
        
        
        
       
     
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default IsgMemberForm;