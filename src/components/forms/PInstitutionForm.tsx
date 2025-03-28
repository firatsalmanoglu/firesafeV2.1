"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import Image from "next/image";

const schema = z.object({

    id: z.string().min(1, { message: "Bu alan boş geçilemez!" }),
    name: z.string().min(1, { message: "Bu alan boş geçilemez!" }),
    address: z.string().min(1, { message: "Bu alan boş geçilemez!" }),
    

});

type Inputs = z.infer<typeof schema>;

const PInstitutionForm = ({
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
      <h1 className="text-xl font-semibold">Hizmet Sağlayıcı Kurum Kartı</h1>
      <span className="text-xs text-gray-400 font-medium">
       Kurum
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="No"
          name="id"
          defaultValue={data?.id}
          register={register}
          error={errors?.id}
        />
       
        <InputField
          label="Adı"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />

        <InputField
          label="Adresi"
          name="address"
          defaultValue={data?.address}
          register={register}
          error={errors?.address}
        />
        
      </div>
      
      
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default PInstitutionForm;