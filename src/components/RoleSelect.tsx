// components/RoleSelect.tsx
"use client";

import { useEffect, useState } from "react";

interface Role {
  id: string; // Eğer id'ye ihtiyaç yoksa kaldırabilirsiniz
  name: string;
}

interface RoleSelectProps {
  defaultValue?: string;
  register: any;
  error?: any;
  isLoading?: boolean;
}

const roles: Role[] = [
  { id: "ADMIN", name: "Admin" },
  { id: "USER", name: "User" },
  { id: "GUEST", name: "Guest" },
  { id: "MUSTERI_SEVIYE1", name: "Müşteri Seviye 1" },
  { id: "MUSTERI_SEVIYE2", name: "Müşteri Seviye 2" },
  { id: "HIZMETSAGLAYICI_SEVIYE1", name: "Hizmet Sağlayıcı Seviye 1" },
  { id: "HIZMETSAGLAYICI_SEVIYE2", name: "Hizmet Sağlayıcı Seviye 2" },
];

const RoleSelect = ({ defaultValue, register, error }: RoleSelectProps) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-xs text-gray-500">Rol</label>
      <select
        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
        {...register("roleId")}
        defaultValue={defaultValue || ""}
      >
        <option value="">Rol Seçiniz</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>
      {error?.message && (
        <p className="text-xs text-red-400">{error.message}</p>
      )}
    </div>
  );
};

export default RoleSelect;