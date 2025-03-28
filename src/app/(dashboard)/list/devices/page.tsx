'use client';

import { useEffect, useState } from 'react';
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { UserRole, Devices, DeviceTypes, DeviceFeatures, User, Institutions, IsgMembers } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { Camera } from 'lucide-react';
import { IoMdQrScanner } from "react-icons/io";


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

interface PageProps {
  searchParams: {
    page?: string;
    search?: string;
    institutionFilter?: string;
    ownerId?: string;
    providerId?: string;
    ownerInstId?: string;
    [key: string]: string | undefined;
  };
}

const columns = [
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

  const page = searchParams?.page ? parseInt(searchParams.page) : 1;

  const renderRow = (
    item: DeviceWithRelations,
    userRole: UserRole | null,
    userId: string | null
  ) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
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
      <td className="hidden md:table-cell">{item.currentStatus}</td>
      <td>
        <div className="flex items-center gap-2">
          {canViewDevices(userRole, item.ownerId, item.providerId, userId) && (
            <Link href={`/list/devices/${item.id}`}>
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">
                <Image src="/view.png" alt="" width={24} height={24} />
              </button>
            </Link>
          )}
          {canDeleteDevice(userRole, item.ownerId, userId) && (
            <FormModal table="device" type="delete" id={item.id} />
          )}
        </div>
      </td>
    </tr>
  );

  useEffect(() => {
    fetchDevices();
  }, [page, searchParams]);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices/my-devices');
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
            > 
               <IoMdQrScanner />
              <Camera size={16} color="white" />
            </button>
            <Link href="/list/devices/qrcodes" className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaBlue">
              <Image src="/qrcode1.png" alt="QR Kodları" width={24} height={24} />
            </Link>
            {currentUserRole === UserRole.ADMIN && (
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                <Image src="/filter.png" alt="" width={14} height={14} />
              </button>
            )}
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
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

      <div className="">
        <Table
          columns={columns}
          renderRow={(item) => renderRow(item, currentUserRole, currentUserId)}
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