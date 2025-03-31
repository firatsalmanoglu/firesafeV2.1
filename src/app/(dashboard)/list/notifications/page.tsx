import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import {
  Institutions,
  Notifications,
  User,
  NotificationTypes,
  Devices,
  Prisma,
  DeviceTypes,
  UserRole,
  NotificationStatus,
} from "@prisma/client";
import { auth } from "@/auth";
import Image from "next/image";
import Link from "next/link";

type NotificationList = Notifications & { creator: User } & {
  creatorIns: Institutions;
} & { recipient: User } & { recipientIns: Institutions } & {
  type: NotificationTypes;
} & { device: Devices } & { deviceType: DeviceTypes };

const columns = [
  {
    header: "No",
    accessor: "rowNumber",
  },
  {
    header: "Gönderen",
    accessor: "creator",
  },
  {
    header: "Alıcı",
    accessor: "recipient",
  },
  {
    header: "Bildirim Türü",
    accessor: "type",
    className: "hidden md:table-cell",
  },
  {
    header: "Tarih",
    accessor: "notificationDate",
    className: "hidden md:table-cell",
  },
  {
    header: "Durum",
    accessor: "isRead",
    className: "hidden md:table-cell",
  },
  {
    header: "Eylemler",
    accessor: "action",
  },
];

const canViewNotification = (
  userRole: UserRole,
  notificationRecipientId: string,
  notificationRecipientInsId: string,
  currentUserId: string | null | undefined,
  currentUserInstitutionId: string | null | undefined
) => {
  if (userRole === UserRole.ADMIN) return true;

  if (!currentUserId || !currentUserInstitutionId) return false;

  // SEVIYE2 rolleri sadece kendi bildirimlerini görebilir
  if (
    (userRole === UserRole.MUSTERI_SEVIYE2 ||
      userRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) &&
    currentUserId === notificationRecipientId
  ) return true;

  // SEVIYE1 rolleri kendi kurumlarına ait tüm bildirimleri görebilir
  if (
    (userRole === UserRole.MUSTERI_SEVIYE1 ||
      userRole === UserRole.HIZMETSAGLAYICI_SEVIYE1) &&
    currentUserInstitutionId === notificationRecipientInsId
  ) return true;

  return false;
};

const canManageNotification = (userRole: UserRole) => {
  return userRole === UserRole.ADMIN;
};

const NotificationListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const session = await auth();
  const currentUserRole = session?.user?.role as UserRole;

  const currentUser = session?.user?.email ? await prisma.user.findUnique({
    where: { email: session.user.email }
  }) : null;

  const currentUserId = currentUser?.id;
  const currentUserInstitutionId = currentUser?.institutionId;

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.NotificationsWhereInput = {};

  // Role göre filtreleme
  if (currentUserRole !== UserRole.ADMIN) {
    if (currentUserRole === UserRole.MUSTERI_SEVIYE2 ||
      currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) {
      // SEVIYE2 rolleri sadece kendi bildirimlerini görebilir
      query.recipientId = currentUserId;
    } else if ((currentUserRole === UserRole.MUSTERI_SEVIYE1 ||
      currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1) &&
      currentUserInstitutionId) {
      // SEVIYE1 rolleri kendi kurumlarındaki tüm bildirimleri görebilir
      query.recipientInsId = currentUserInstitutionId;
    }
  }

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && currentUserRole === UserRole.ADMIN) {
        switch (key) {
          case "recipientId":
            const recipientId = value;
            if (recipientId) {
              query.recipientId = recipientId;
            }
            break;
          case "creatorId":
            const creatorId = value;
            if (creatorId) {
              query.creatorId = creatorId;
            }
            break;
          case "recipientInsId":
            const recipientInsId = value;
            if (recipientInsId) {
              query.recipientInsId = recipientInsId;
            }
            break;
          case "deviceId":
            const deviceId = value;
            if (deviceId) {
              query.deviceId = deviceId;
            }
            break;
          case "search":
            query.content = { contains: value, mode: "insensitive" };
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.notifications.findMany({
      where: query,
      include: {
        creator: true,
        creatorIns: true,
        recipient: true,
        recipientIns: true,
        type: true,
        device: true,
        deviceType: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { notificationDate: 'desc' }
    }),
    prisma.notifications.count({ where: query }),
  ]);

  const renderRow = (item: NotificationList) => {
    // Veri dizisindeki indeksi bulma
    const index = data.findIndex(d => d.id === item.id);
    // Sayfa ve veri sayısına göre sıra numarası hesaplama
    const rowNumber = (p - 1) * ITEM_PER_PAGE + index + 1;
    
    // Tarih formatını düzenleme
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    };
    
    // Bildirim durumunu görselleştirme
    const getStatusBadge = (status: NotificationStatus) => {
      if (status === 'Okundu') {
        return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Okundu</span>;
      } else {
        return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Okunmadı</span>;
      }
    };
    
    return (
      <tr
        key={item.id}
        className={`border-b border-gray-200 text-sm hover:bg-lamaPurpleLight ${
          item.isRead === 'Okunmadi' ? 'bg-blue-50' : 'even:bg-slate-50'
        }`}
      >
        <td className="p-4">{rowNumber}</td>
        <td className="p-4">
          <div className="flex flex-col">
            <h3 className="font-semibold">{item.creator.name}</h3>
            <p className="text-xs text-gray-500">{item.creatorIns.name}</p>
          </div>
        </td>
        <td className="p-4">
          <div className="flex flex-col">
            <h3 className="font-semibold">{item.recipient.name}</h3>
            <p className="text-xs text-gray-500">{item.recipientIns.name}</p>
          </div>
        </td>
        <td className="hidden md:table-cell p-4">
          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
            {item.type.name}
          </span>
        </td>
        <td className="hidden md:table-cell p-4">{formatDate(item.notificationDate)}</td>
        <td className="hidden md:table-cell p-4">
          {getStatusBadge(item.isRead)}
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            {canViewNotification(currentUserRole, item.recipientId, item.recipientInsId, currentUserId, currentUserInstitutionId) && (
              <Link href={`/list/notifications/${item.id}`}>
                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple" title="Görüntüle">
                  <Image src="/view.png" alt="" width={24} height={24} />
                </button>
              </Link>
            )}
            {canManageNotification(currentUserRole) && (
              <FormModal table="notification" type="delete" id={item.id} />
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex item-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold">
          {currentUserRole === UserRole.ADMIN
            ? 'Tüm Bildirimler'
            : (currentUserRole === UserRole.MUSTERI_SEVIYE1 || currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1)
              ? 'Kurumunuzun Bildirimleri'
              : 'Bildirimleriniz'}
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            {currentUserRole === UserRole.ADMIN && (
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow" title="Filtrele">
                <Image src="/filter.png" alt="" width={14} height={14} />
              </button>
            )}
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow" title="Sırala">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {canManageNotification(currentUserRole) && (
              <FormModal
                table="notification"
                type="create"
                currentUserRole={currentUserRole}
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

      <Pagination page={p} count={count} />
    </div>
  );
};

export default NotificationListPage;