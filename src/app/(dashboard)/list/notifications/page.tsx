import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import TableSort from "@/components/TableSort";
import TableFilter from "@/components/TableFilter";
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
import { FilterOption } from "@/components/TableFilter";

type NotificationList = Notifications & { creator: User } & {
  creatorIns: Institutions;
} & { recipient: User } & { recipientIns: Institutions } & {
  type: NotificationTypes;
} & { device: Devices | null } & { deviceType: DeviceTypes | null };

// TableSort bileşeninin beklediği SortOption tipi
type SortOption = {
  label: string;
  field: string;
  order: "asc" | "desc";
};

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

  // URL parametrelerini genişletilmiş şekilde al
  const { page, sort, order, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;
  
  // Varsayılan olarak bildirim tarihine göre sıralama
  const sortField = sort || 'notificationDate';
  const sortOrder = order || 'desc';

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
      if (value !== undefined) {
        switch (key) {
          case "recipientId":
            if (currentUserRole === UserRole.ADMIN || 
               (currentUserRole === UserRole.MUSTERI_SEVIYE1 || 
                currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1)) {
              query.recipientId = value;
            }
            break;
          case "creatorId":
            if (currentUserRole === UserRole.ADMIN) {
              query.creatorId = value;
            }
            break;
          case "recipientInsId":
            if (currentUserRole === UserRole.ADMIN) {
              query.recipientInsId = value;
            }
            break;
          case "creatorInsId":
            if (currentUserRole === UserRole.ADMIN) {
              query.creatorInsId = value;
            }
            break;
          case "typeId":
            query.typeId = value;
            break;
          case "deviceId":
            query.deviceId = value;
            break;
          case "deviceTypeId":
            query.deviceTypeId = value;
            break;
          case "isRead":
            query.isRead = value as NotificationStatus;
            break;
          case "search":
            query.OR = [
              { content: { contains: value, mode: "insensitive" } },
              {
                creator: {
                  name: { contains: value, mode: "insensitive" }
                }
              },
              {
                creatorIns: {
                  name: { contains: value, mode: "insensitive" }
                }
              },
              {
                recipient: {
                  name: { contains: value, mode: "insensitive" }
                }
              },
              {
                recipientIns: {
                  name: { contains: value, mode: "insensitive" }
                }
              },
              {
                type: {
                  name: { contains: value, mode: "insensitive" }
                }
              }
            ];
            break;
          case "notificationDateFrom":
            // Bildirim tarihi için filtreleme
            if (query.notificationDate && typeof query.notificationDate === 'object') {
              const dateFilter = query.notificationDate as Prisma.DateTimeFilter<"Notifications">;
              dateFilter.gte = new Date(value);
            } else {
              query.notificationDate = {
                gte: new Date(value)
              };
            }
            break;
          case "notificationDateTo":
            if (query.notificationDate && typeof query.notificationDate === 'object') {
              const dateFilter = query.notificationDate as Prisma.DateTimeFilter<"Notifications">;
              dateFilter.lte = new Date(value);
            } else {
              query.notificationDate = {
                lte: new Date(value)
              };
            }
            break;
        }
      }
    }
  }

  // Filtreleme seçenekleri için gerekli verileri getir
  let recipientInstitutions: { id: string; name: string }[] = [];
  let creatorInstitutions: { id: string; name: string }[] = [];
  let recipients: { id: string; name: string | null }[] = [];
  let notificationTypes: { id: string; name: string }[] = [];
  let deviceTypes: { id: string; name: string }[] = [];
  let devices: { id: string; name: string }[] = [];

  // Admin için daha fazla filtreleme seçeneği
  if (currentUserRole === UserRole.ADMIN) {
    // Kurum listeleri
    recipientInstitutions = await prisma.institutions.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
    
    creatorInstitutions = await prisma.institutions.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
  } else if (currentUserRole === UserRole.MUSTERI_SEVIYE1 || 
            currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1) {
    // SEVIYE1 kullanıcıları kendi kurumlarındaki kullanıcılar arasında filtreleme yapabilir
    if (currentUserInstitutionId) {
      recipients = await prisma.user.findMany({
        where: { 
          institutionId: currentUserInstitutionId,
          name: { not: null }
        },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      });
    }
  }

  // Cihaz türleri ve bildirimleri
  notificationTypes = await prisma.notificationTypes.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });
  
  deviceTypes = await prisma.deviceTypes.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  // Özel seçilmiş bir cihaz türü varsa o türdeki cihazları getir
  if (queryParams.deviceTypeId) {
    devices = await prisma.devices.findMany({
      where: { 
        typeId: queryParams.deviceTypeId,
        currentStatus: 'Aktif'
      },
      select: { 
        id: true, 
        serialNumber: true 
      },
      orderBy: { serialNumber: 'asc' }
    }).then(devices => 
      devices.map(d => ({ id: d.id, name: d.serialNumber }))
    );
  }

  // Dinamik sıralama için orderBy nesnesini oluştur
  let orderBy: any = {};
  
  // Özel alanlar için sıralama mantığı
  if (sortField === 'creator') {
    orderBy = {
      creator: {
        name: sortOrder
      }
    };
  } else if (sortField === 'recipient') {
    orderBy = {
      recipient: {
        name: sortOrder
      }
    };
  } else if (sortField === 'creatorIns') {
    orderBy = {
      creatorIns: {
        name: sortOrder
      }
    };
  } else if (sortField === 'recipientIns') {
    orderBy = {
      recipientIns: {
        name: sortOrder
      }
    };
  } else if (sortField === 'type') {
    orderBy = {
      type: {
        name: sortOrder
      }
    };
  } else {
    // Diğer alanlar için doğrudan sıralama
    orderBy[sortField] = sortOrder;
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
      orderBy: orderBy
    }),
    prisma.notifications.count({ where: query }),
  ]);

  // Sıralama seçenekleri
  const sortOptions: SortOption[] = [
    { label: "Tarih (Yeni-Eski)", field: "notificationDate", order: "desc" },
    { label: "Tarih (Eski-Yeni)", field: "notificationDate", order: "asc" },
    { label: "Gönderen Kişi (A-Z)", field: "creator", order: "asc" },
    { label: "Gönderen Kişi (Z-A)", field: "creator", order: "desc" },
    { label: "Gönderen Kurum (A-Z)", field: "creatorIns", order: "asc" },
    { label: "Gönderen Kurum (Z-A)", field: "creatorIns", order: "desc" },
    { label: "Alıcı Kişi (A-Z)", field: "recipient", order: "asc" },
    { label: "Alıcı Kişi (Z-A)", field: "recipient", order: "desc" },
    { label: "Alıcı Kurum (A-Z)", field: "recipientIns", order: "asc" },
    { label: "Alıcı Kurum (Z-A)", field: "recipientIns", order: "desc" },
    { label: "Bildirim Türü (A-Z)", field: "type", order: "asc" },
    { label: "Bildirim Türü (Z-A)", field: "type", order: "desc" }
  ];

  // Filtreleme seçenekleri
  const filterOptions: FilterOption[] = [];

  // Durum filtresi - herkese gösteriliyor
  filterOptions.push({
    type: "status",
    label: "Durum",
    field: "isRead",
    options: [
      { value: "Okundu", label: "Okundu" },
      { value: "Okunmadi", label: "Okunmadı" }
    ]
  });

  // Bildirim türü filtresi - herkese gösteriliyor
  filterOptions.push({
    type: "select",
    label: "Bildirim Türü",
    field: "typeId",
    data: notificationTypes
  });

  // Cihaz türü filtresi
  filterOptions.push({
    type: "select",
    label: "Cihaz Türü",
    field: "deviceTypeId",
    data: deviceTypes
  });

  // Eğer cihaz türü seçiliyse cihaz listesi göster
  if (devices.length > 0) {
    filterOptions.push({
      type: "select",
      label: "Cihaz",
      field: "deviceId",
      data: devices
    });
  }

  // Admin için kurum filtreleri
  if (currentUserRole === UserRole.ADMIN) {
    filterOptions.push({
      type: "select",
      label: "Gönderen Kurum",
      field: "creatorInsId",
      data: creatorInstitutions
    });
    
    filterOptions.push({
      type: "select",
      label: "Alıcı Kurum",
      field: "recipientInsId",
      data: recipientInstitutions
    });
  }

  // SEVIYE1 kullanıcıları için kendi kurumlarındaki kullanıcılar
  if ((currentUserRole === UserRole.MUSTERI_SEVIYE1 || 
       currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1) && 
      recipients.length > 0) {
    // name değeri null olabilir, güvenlik için kontrol
    const validRecipients = recipients
      .filter(r => r.name !== null)
      .map(r => ({ id: r.id, name: r.name as string }));
      
    if (validRecipients.length > 0) {
      filterOptions.push({
        type: "select",
        label: "Alıcı Kişi",
        field: "recipientId",
        data: validRecipients
      });
    }
  }

  // Tarih aralığı filtresi
  filterOptions.push({
    type: "dateRange",
    label: "Bildirim Tarihi",
    fieldFrom: "notificationDateFrom",
    fieldTo: "notificationDateTo"
  });

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
            <TableFilter options={filterOptions} />
            <TableSort options={sortOptions} />
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