'use client';

import { useEffect, useState } from 'react';
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import TableSort from "@/components/TableSort";
import TableFilter from "@/components/TableFilter";
import { UserRole, Devices, DeviceTypes, DeviceFeatures, User, Institutions, IsgMembers, DeviceStatus } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { Camera } from 'lucide-react';
import { IoMdQrScanner } from "react-icons/io";
import { FilterOption } from "@/components/TableFilter";

const QRScanner = dynamic(() => import('@/components/QRScanner'), {
  ssr: false
});

type DeviceWithRelations = Devices & {
  type: DeviceTypes;
  feature: DeviceFeatures;
  owner: User;
  ownerIns: Institutions;
  isgMember: IsgMembers;
};

type SortOption = {
  label: string;
  field: string;
  order: "asc" | "desc";
};

interface PageProps {
  searchParams: {
    page?: string;
    search?: string;
    institutionFilter?: string;
    ownerId?: string;
    providerId?: string;
    ownerInstId?: string;
    typeId?: string;
    featureId?: string;
    currentStatus?: string;
    sort?: string;
    order?: string;
    lastControlDateFrom?: string;
    lastControlDateTo?: string;
    expirationDateFrom?: string;
    expirationDateTo?: string;
    [key: string]: string | undefined;
  };
}

const columns = [
  {
    header: "No",
    accessor: "rowNumber",
  },
  {
    header: "Seri No",
    accessor: "serialNumber",
    className: "hidden md:table-cell",
  },
  {
    header: "Bilgi",
    accessor: "info",
  },
  {
    header: "Özelliği",
    accessor: "features",
    className: "hidden md:table-cell",
  },
  {
    header: "Son Kont.Tar.",
    accessor: "lastControlDate",
    className: "hidden md:table-cell",
  },
  {
    header: "Durumu",
    accessor: "currentStatus",
    className: "hidden md:table-cell",
  },
  {
    header: "Eylemler",
    accessor: "action",
    className: "hidden md:table-cell",
  },
];

const canViewDevices = (
  userRole: UserRole | null,
  deviceOwnerId: string | null,
  deviceProviderId: string | null,
  currentUserId: string | null
) => {
  if (userRole === UserRole.ADMIN) return true;

  if (
    (userRole === UserRole.MUSTERI_SEVIYE1 ||
      userRole === UserRole.MUSTERI_SEVIYE2) &&
    deviceOwnerId === currentUserId
  ) {
    return true;
  }

  if (
    (userRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 ||
      userRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) &&
    deviceProviderId === currentUserId
  ) {
    return true;
  }

  return false;
};

const canDeleteDevice = (
  userRole: UserRole | null,
  deviceOwnerId: string | null,
  currentUserId: string | null
) => {
  if (userRole === UserRole.ADMIN) return true;

  if (
    userRole === UserRole.MUSTERI_SEVIYE1 &&
    deviceOwnerId === currentUserId
  ) {
    return true;
  }

  return false;
};

const canCreateDevice = (userRole: UserRole | null) => {
  if (!userRole) return false;
  
  const authorizedRoles: Array<UserRole> = [
    UserRole.ADMIN,
    UserRole.MUSTERI_SEVIYE1,
    UserRole.MUSTERI_SEVIYE2
  ];
  return authorizedRoles.includes(userRole);
};

const DeviceListPage = ({ searchParams }: PageProps) => {
  const [data, setData] = useState<DeviceWithRelations[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [deviceTypes, setDeviceTypes] = useState<{id: string, name: string}[]>([]);
  const [deviceFeatures, setDeviceFeatures] = useState<{id: string, name: string}[]>([]);
  const [institutions, setInstitutions] = useState<{id: string, name: string}[]>([]);

  const page = searchParams?.page ? parseInt(searchParams.page) : 1;
  const sort = searchParams?.sort || 'serialNumber';
  const order = searchParams?.order || 'asc';

  // Sıralama seçenekleri
  const sortOptions: SortOption[] = [
    { label: "Seri No (A-Z)", field: "serialNumber", order: "asc" },
    { label: "Seri No (Z-A)", field: "serialNumber", order: "desc" },
    { label: "Cihaz Türü (A-Z)", field: "type", order: "asc" },
    { label: "Cihaz Türü (Z-A)", field: "type", order: "desc" },
    { label: "Son Kontrol (Yeni-Eski)", field: "lastControlDate", order: "desc" },
    { label: "Son Kontrol (Eski-Yeni)", field: "lastControlDate", order: "asc" },
    { label: "Sonraki Kontrol (Yakın-Uzak)", field: "nextControlDate", order: "asc" },
    { label: "Sonraki Kontrol (Uzak-Yakın)", field: "nextControlDate", order: "desc" },
    { label: "Kurum (A-Z)", field: "ownerIns", order: "asc" },
    { label: "Kurum (Z-A)", field: "ownerIns", order: "desc" }
  ];

  useEffect(() => {
    fetchDevices();
    fetchFilterOptions();
  }, [page, searchParams]);

  const fetchDevices = async () => {
    try {
      // API isteği yapılırken tüm parametreleri gönder
      let url = `/api/devices/my-devices?page=${page}`;
      
      if (searchParams.search) url += `&search=${searchParams.search}`;
      if (searchParams.typeId) url += `&typeId=${searchParams.typeId}`;
      if (searchParams.featureId) url += `&featureId=${searchParams.featureId}`;
      if (searchParams.ownerInstId) url += `&ownerInstId=${searchParams.ownerInstId}`;
      if (searchParams.currentStatus) url += `&currentStatus=${searchParams.currentStatus}`;
      if (searchParams.lastControlDateFrom) url += `&lastControlDateFrom=${searchParams.lastControlDateFrom}`;
      if (searchParams.lastControlDateTo) url += `&lastControlDateTo=${searchParams.lastControlDateTo}`;
      if (searchParams.expirationDateFrom) url += `&expirationDateFrom=${searchParams.expirationDateFrom}`;
      if (searchParams.expirationDateTo) url += `&expirationDateTo=${searchParams.expirationDateTo}`;
      if (searchParams.sort) url += `&sort=${searchParams.sort}`;
      if (searchParams.order) url += `&order=${searchParams.order}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Veri çekme hatası');
      }
      const result = await response.json();
      setData(result.devices);
      setCount(result.count);
      setCurrentUserRole(result.currentUserRole);
      setCurrentUserId(result.currentUserId);
    } catch (error) {
      console.error('Cihazlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/devices/filter-options');
      if (!response.ok) {
        throw new Error('Filtre seçenekleri alınamadı');
      }
      const result = await response.json();
      setDeviceTypes(result.deviceTypes || []);
      setDeviceFeatures(result.deviceFeatures || []);
      setInstitutions(result.institutions || []);
    } catch (error) {
      console.error('Filtre seçenekleri yüklenirken hata:', error);
    }
  };

  // Filtreleme seçenekleri
  const filterOptions: FilterOption[] = [
    {
      type: "select",
      label: "Cihaz Türü",
      field: "typeId",
      data: deviceTypes
    },
    {
      type: "select",
      label: "Cihaz Özelliği",
      field: "featureId",
      data: deviceFeatures
    },
    {
      type: "select",
      label: "Kurum",
      field: "ownerInstId",
      data: institutions
    },
    {
      type: "status",
      label: "Durumu",
      field: "currentStatus",
      options: [
        { value: "Aktif", label: "Aktif" },
        { value: "Pasif", label: "Pasif" }
      ]
    },
    {
      type: "dateRange",
      label: "Son Kontrol Tarihi",
      fieldFrom: "lastControlDateFrom",
      fieldTo: "lastControlDateTo"
    },
    {
      type: "dateRange",
      label: "Son Kullanma Tarihi",
      fieldFrom: "expirationDateFrom",
      fieldTo: "expirationDateTo"
    }
  ];

  const renderRow = (item: DeviceWithRelations) => {
    // Cihaz için sıra numarası hesaplama
    const index = data.findIndex(d => d.id === item.id);
    const rowNumber = (page - 1) * 10 + index + 1;
    
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td>{rowNumber}</td>
        <td className="hidden md:table-cell">{item.serialNumber}</td>
        <td className="flex items-center gap-4 p-4">
          <Image
            src={item.photo || "/noAvatar.png"}
            alt=""
            width={40}
            height={40}
            className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
          />
          <div className="flex flex-col">
            <h3 className="font-semibold">{item.type.name}</h3>
            <p className="text-xs text-gray-500">{item.ownerIns.name}</p>
            <p className="text-xs text-gray-500">{item.owner.name}</p>
          </div>
        </td>
        <td className="hidden md:table-cell">{item.feature.name}</td>
        <td className="hidden md:table-cell">
          {new Date(item.lastControlDate).toLocaleDateString()}
        </td>
        <td className="hidden md:table-cell">
          <span className={`px-2 py-1 rounded-full text-xs ${
            item.currentStatus === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {item.currentStatus}
          </span>
        </td>
        <td>
          <div className="flex items-center gap-2">
            {canViewDevices(currentUserRole, item.ownerId, item.providerId, currentUserId) && (
              <Link href={`/list/devices/${item.id}`}>
                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">
                  <Image src="/view.png" alt="" width={24} height={24} />
                </button>
              </Link>
            )}
            {canDeleteDevice(currentUserRole, item.ownerId, currentUserId) && (
              <FormModal table="device" type="delete" id={item.id} />
            )}
          </div>
        </td>
      </tr>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex item-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          {currentUserRole === UserRole.ADMIN
            ? 'Tüm Yangın Güvenlik Önlemleri'
            : currentUserRole?.toString().startsWith('MUSTERI')
              ? 'Sahip Olduğunuz Yangın Güvenlik Önlemleri'
              : 'Hizmet Verdiğiniz Yangın Güvenlik Önlemleri'}
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button
              onClick={() => setShowScanner(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaGreen"
              title="QR Kod Tara"
            > 
              <IoMdQrScanner size={16} color="white" />
            </button>
            <Link href="/list/devices/qrcodes" className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaBlue" title="QR Kodları">
              <Image src="/qrcode1.png" alt="QR Kodları" width={18} height={18} />
            </Link>
            <TableFilter options={filterOptions} />
            <TableSort options={sortOptions} />
            {canCreateDevice(currentUserRole) && (
              <FormModal
                table="device"
                type="create"
                currentUserRole={currentUserRole || undefined}
                currentUserId={currentUserId || ''}
              />
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table
          columns={columns}
          renderRow={renderRow}
          data={data}
        />
      </div>

      <Pagination page={page} count={count} />

      {showScanner && (
        <QRScanner onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
};

export default DeviceListPage;