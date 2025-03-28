// components/IsgMemberSelect.tsx
"use client";

import { useEffect, useState } from "react";

interface IsgMember {
  id: string;
  name: string;
  isgNumber: string;
}

interface IsgMemberSelectProps {
  defaultValue?: string;
  register: any;
  error?: any;
  isLoading?: boolean;
}

const IsgMemberSelect = ({ defaultValue, register, error, isLoading = false }: IsgMemberSelectProps) => {
  const [members, setMembers] = useState<IsgMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/isgMembers');
        const data = await response.json();
        setMembers(data);
      } catch (error) {
        console.error('Error fetching ISG members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  if (loading || isLoading) {
    return (
      <div className="flex flex-col gap-2 w-full ">
        <label className="text-xs text-gray-500">ISG Üyesi</label>
        <select disabled className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-gray-100">
          <option>Yükleniyor...</option>
        </select>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full ">
      <label className="text-xs text-gray-500">ISG Üyesi</label>
      <select
        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
        {...register("isgMemberId")}
        defaultValue={defaultValue || ""}
      >
        <option value="">ISG Üyesi Seçiniz</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name} ({member.isgNumber})
          </option>
        ))}
      </select>
      {error?.message && (
        <p className="text-xs text-red-400">{error.message}</p>
      )}
    </div>
  );
};

export default IsgMemberSelect;