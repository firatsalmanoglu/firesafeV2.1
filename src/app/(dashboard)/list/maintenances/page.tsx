import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import TableSort from "@/components/TableSort";
import TableFilter from "@/components/TableFilter";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { ITEM_PER_PAGE } from "@/lib/settings";
import {
  DeviceTypes,
  DeviceFeatures,
  Devices,
  User,
  Institutions,
  MaintenanceCards,
  Prisma,
  UserRole,
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { FilterOption } from "@/components/TableFilter";

type MaintenanceList = MaintenanceCards & {
  device: Devices;
  deviceType: DeviceTypes;
  deviceFeature: DeviceFeatures;
  provider: User;
  providerIns: Institutions;
  customer: User;
  customerIns: Institutions;
  MaintenanceSub: MaintenanceList[];
};

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
    header: "Cihaz",
    accessor: "device",
  },
  {
    header: "Servis Sağlayıcı",
    accessor: "provider",
  },
  {
    header: "Müşteri",
    accessor: "customer",
    className: "hidden md:table-cell",
  },
  {
    header: "Bakım Tarihi",
    accessor: "maintenanceDate",
    className: "hidden md:table-cell",
  },
  {
    header: "Sonraki Bakım",
    accessor: "nextMaintenanceDate",
    className: "hidden md:table-cell",
  },
  {
    header: "Eylemler",
    accessor: "action",
  },
];

const canViewMaintenance = (
  userRole: UserRole,
  maintenanceProviderInsId: string,
  maintenanceCustomerInsId: string,
  currentUserInstitutionId: string | null | undefined
) => {
  if (userRole === UserRole.ADMIN) return true;

  if (!currentUserInstitutionId) return false;

  // Müşteri rolleri sadece kendi cihazlarının bakımlarını görebilir
  if (
    (userRole === UserRole.MUSTERI_SEVIYE1 ||
      userRole === UserRole.MUSTERI_SEVIYE2) &&
    currentUserInstitutionId === maintenanceCustomerInsId
  ) return true;

  // Hizmet sağlayıcı rolleri sadece kendi yaptıkları bakımları görebilir
  if (
    (userRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 ||
      userRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) &&
    currentUserInstitutionId === maintenanceProviderInsId
  ) return true;

  return false;
};

const canManageMaintenance = (
  userRole: UserRole,
  maintenanceProviderInsId: string,
  currentUserInstitutionId: string | null | undefined
) => {
  if (userRole === UserRole.ADMIN) return true;

  if (!currentUserInstitutionId) return false;

  // Hizmet sağlayıcı rolleri kendi yaptıkları bakımları yönetebilir
  if (
    (userRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 ||
      userRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) &&
    currentUserInstitutionId === maintenanceProviderInsId
  ) return true;

  return false;
};

const canCreateMaintenance = (userRole: UserRole) => {
  const authorizedRoles: Array<UserRole> = [
    UserRole.ADMIN,
    UserRole.HIZMETSAGLAYICI_SEVIYE1,
    UserRole.HIZMETSAGLAYICI_SEVIYE2
  ];
  return authorizedRoles.includes(userRole);
};

const MaintenanceListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const session = await auth();
  const currentUserRole = session?.user?.role as UserRole;

  const currentUser = session?.user?.email ? await prisma.user.findUnique({
    where: { email: session.user.email }
  }) : null;

  const currentUserInstitutionId = currentUser?.institutionId;

  // URL parametrelerini genişletilmiş şekilde al
  const { page, sort, order, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;
  
  // Varsayılan olarak bakım tarihine göre azalan sıralama (yeniden eskiye)
  const sortField = sort || 'maintenanceDate';
  const sortOrder = order || 'desc';

  const query: Prisma.MaintenanceCardsWhereInput = {};

  // Role göre filtreleme
  if (currentUserRole !== UserRole.ADMIN && currentUserInstitutionId) {
    if (currentUserRole === UserRole.MUSTERI_SEVIYE1 ||
      currentUserRole === UserRole.MUSTERI_SEVIYE2) {
      // Müşteriler sadece kendi cihazlarının bakımlarını görebilir
      query.customerInsId = currentUserInstitutionId;
    } else if (currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 ||
      currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) {
      // Hizmet sağlayıcılar sadece kendi yaptıkları bakımları görebilir
      query.providerInsId = currentUserInstitutionId;
    }
  }

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "customerId":
            const customerId = value;
            if (customerId) {
              query.customerId = customerId;
            }
            break;
          case "providerId":
            const providerId = value;
            if (providerId) {
              query.providerId = providerId;
            }
            break;
          case "customerInsId":
            if (currentUserRole === UserRole.ADMIN || 
                (currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 || 
                 currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2)) {
              query.customerInsId = value;
            }
            break;
          case "providerInsId":
            if (currentUserRole === UserRole.ADMIN || 
                (currentUserRole === UserRole.MUSTERI_SEVIYE1 || 
                 currentUserRole === UserRole.MUSTERI_SEVIYE2)) {
              query.providerInsId = value;
            }
            break;
          case "deviceId":
            const deviceId = value;
            if (deviceId) {
              query.deviceId = deviceId;
            }
            break;
          case "deviceTypeId":
            query.deviceTypeId = value;
            break;
          case "deviceFeatureId":
            query.deviceFeatureId = value;
            break;
          case "search":
            query.OR = [
              { details: { contains: value, mode: "insensitive" } },
              {
                device: {
                  serialNumber: { contains: value, mode: "insensitive" }
                }
              },
              {
                deviceType: {
                  name: { contains: value, mode: "insensitive" }
                }
              },
              {
                deviceFeature: {
                  name: { contains: value, mode: "insensitive" }
                }
              },
              {
                providerIns: {
                  name: { contains: value, mode: "insensitive" }
                }
              },
              {
                customerIns: {
                  name: { contains: value, mode: "insensitive" }
                }
              }
            ];
            break;
          case "maintenanceDateFrom":
            // Bakım tarihi için filtreleme
            if (query.maintenanceDate && typeof query.maintenanceDate === 'object') {
              const dateFilter = query.maintenanceDate as Prisma.DateTimeFilter<"MaintenanceCards">;
              dateFilter.gte = new Date(value);
            } else {
              query.maintenanceDate = {
                gte: new Date(value)
              };
            }
            break;
          case "maintenanceDateTo":
            if (query.maintenanceDate && typeof query.maintenanceDate === 'object') {
              const dateFilter = query.maintenanceDate as Prisma.DateTimeFilter<"MaintenanceCards">;
              dateFilter.lte = new Date(value);
            } else {
              query.maintenanceDate = {
                lte: new Date(value)
              };
            }
            break;
          case "nextMaintenanceDateFrom":
            // Sonraki bakım tarihi için filtreleme
            if (query.nextMaintenanceDate && typeof query.nextMaintenanceDate === 'object') {
              const dateFilter = query.nextMaintenanceDate as Prisma.DateTimeFilter<"MaintenanceCards">;
              dateFilter.gte = new Date(value);
            } else {
              query.nextMaintenanceDate = {
                gte: new Date(value)
              };
            }
            break;
          case "nextMaintenanceDateTo":
            if (query.nextMaintenanceDate && typeof query.nextMaintenanceDate === 'object') {
              const dateFilter = query.nextMaintenanceDate as Prisma.DateTimeFilter<"MaintenanceCards">;
              dateFilter.lte = new Date(value);
            } else {
              query.nextMaintenanceDate = {
                lte: new Date(value)
              };
            }
            break;
          case "maintenanceStatus":
            const today = new Date();
            if (value === "overdue") {
              // Zamanı geçmiş bakımlar
              query.nextMaintenanceDate = { lt: today };
            } else if (value === "upcoming") {
              // Yaklaşan bakımlar (30 gün içinde)
              const thirtyDaysLater = new Date();
              thirtyDaysLater.setDate(today.getDate() + 30);
              query.nextMaintenanceDate = { 
                gte: today,
                lte: thirtyDaysLater
              };
            } else if (value === "normal") {
              // Normal bakımlar (30 günden fazla)
              const thirtyDaysLater = new Date();
              thirtyDaysLater.setDate(today.getDate() + 30);
              query.nextMaintenanceDate = { gt: thirtyDaysLater };
            }
            break;
        }
      }
    }
  }

  // Gerekli filtreleme seçenekleri için verileri getir
  let customerInstitutions: { id: string; name: string }[] = [];
  let providerInstitutions: { id: string; name: string }[] = [];
  let deviceTypes: { id: string; name: string }[] = [];
  let deviceFeatures: { id: string; name: string }[] = [];

  // Admin ve hizmet sağlayıcılar için müşteri kurumları
  if (currentUserRole === UserRole.ADMIN || 
      currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 || 
      currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) {
    
    // Sadece kurum ID'leri ve isimleri alınacak basit sorgu
    customerInstitutions = await prisma.institutions.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
  }

  // Admin ve müşteriler için hizmet sağlayıcı kurumları
  if (currentUserRole === UserRole.ADMIN || 
      currentUserRole === UserRole.MUSTERI_SEVIYE1 || 
      currentUserRole === UserRole.MUSTERI_SEVIYE2) {
    
    // Sadece kurum ID'leri ve isimleri alınacak basit sorgu
    providerInstitutions = await prisma.institutions.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
  }

  // Cihaz türleri ve özellikleri
  deviceTypes = await prisma.deviceTypes.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  deviceFeatures = await prisma.deviceFeatures.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  // Dinamik sıralama için orderBy nesnesini oluştur
  let orderBy: any = {};
  
  // Özel alanlar için sıralama mantığı
  if (sortField === 'deviceType') {
    orderBy = {
      deviceType: {
        name: sortOrder
      }
    };
  } else if (sortField === 'deviceFeature') {
    orderBy = {
      deviceFeature: {
        name: sortOrder
      }
    };
  } else if (sortField === 'providerIns') {
    orderBy = {
      providerIns: {
        name: sortOrder
      }
    };
  } else if (sortField === 'customerIns') {
    orderBy = {
      customerIns: {
        name: sortOrder
      }
    };
  } else if (sortField === 'device') {
    orderBy = {
      device: {
        serialNumber: sortOrder
      }
    };
  } else {
    // Diğer alanlar için doğrudan sıralama
    orderBy[sortField] = sortOrder;
  }

  const [data, count] = await prisma.$transaction([
    prisma.maintenanceCards.findMany({
      where: query,
      include: {
        device: true,
        deviceType: true,
        deviceFeature: true,
        provider: true,
        providerIns: true,
        customer: true,
        customerIns: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: orderBy,
    }),
    prisma.maintenanceCards.count({ where: query }),
  ]);

  // Sıralama seçenekleri
  const sortOptions: SortOption[] = [
    { label: "Bakım Tarihi (Yeni-Eski)", field: "maintenanceDate", order: "desc" },
    { label: "Bakım Tarihi (Eski-Yeni)", field: "maintenanceDate", order: "asc" },
    { label: "Sonraki Bakım (Yakın-Uzak)", field: "nextMaintenanceDate", order: "asc" },
    { label: "Sonraki Bakım (Uzak-Yakın)", field: "nextMaintenanceDate", order: "desc" },
    { label: "Cihaz Türü (A-Z)", field: "deviceType", order: "asc" },
    { label: "Cihaz Türü (Z-A)", field: "deviceType", order: "desc" },
    { label: "Cihaz Seri No (A-Z)", field: "device", order: "asc" },
    { label: "Cihaz Seri No (Z-A)", field: "device", order: "desc" },
    { label: "Servis Sağlayıcı (A-Z)", field: "providerIns", order: "asc" },
    { label: "Servis Sağlayıcı (Z-A)", field: "providerIns", order: "desc" },
    { label: "Müşteri (A-Z)", field: "customerIns", order: "asc" },
    { label: "Müşteri (Z-A)", field: "customerIns", order: "desc" }
  ];

  // Filtreleme seçenekleri
  const filterOptions: FilterOption[] = [];

  // Bakım durumu filtresi - herkese gösteriliyor
  filterOptions.push({
    type: "status",
    label: "Bakım Durumu",
    field: "maintenanceStatus",
    options: [
      { value: "overdue", label: "Zamanı Geçmiş" },
      { value: "upcoming", label: "Yaklaşan (30 gün)" },
      { value: "normal", label: "Normal" }
    ]
  });

  // Cihaz türü filtresi
  filterOptions.push({
    type: "select",
    label: "Cihaz Türü",
    field: "deviceTypeId",
    data: deviceTypes
  });

  // Cihaz özelliği filtresi
  filterOptions.push({
    type: "select",
    label: "Cihaz Özelliği",
    field: "deviceFeatureId",
    data: deviceFeatures
  });

  // Admin ve hizmet sağlayıcılar için müşteri kurumu filtresi
  if ((currentUserRole === UserRole.ADMIN || 
       currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 || 
       currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) && 
      customerInstitutions.length > 0) {
    filterOptions.push({
      type: "select",
      label: "Müşteri Kurumu",
      field: "customerInsId",
      data: customerInstitutions
    });
  }

  // Admin ve müşteriler için hizmet sağlayıcı kurumu filtresi
  if ((currentUserRole === UserRole.ADMIN || 
       currentUserRole === UserRole.MUSTERI_SEVIYE1 || 
       currentUserRole === UserRole.MUSTERI_SEVIYE2) && 
      providerInstitutions.length > 0) {
    filterOptions.push({
      type: "select",
      label: "Servis Sağlayıcı Kurumu",
      field: "providerInsId",
      data: providerInstitutions
    });
  }

  // Tarih aralığı filtreleri
  filterOptions.push({
    type: "dateRange",
    label: "Bakım Tarihi",
    fieldFrom: "maintenanceDateFrom",
    fieldTo: "maintenanceDateTo"
  });

  filterOptions.push({
    type: "dateRange",
    label: "Sonraki Bakım Tarihi",
    fieldFrom: "nextMaintenanceDateFrom",
    fieldTo: "nextMaintenanceDateTo"
  });

  const renderRow = (item: MaintenanceList) => {
    // Veri dizisindeki indeksi bulma
    const index = data.findIndex(d => d.id === item.id);
    // Sayfa ve veri sayısına göre sıra numarası hesaplama
    const rowNumber = (p - 1) * ITEM_PER_PAGE + index + 1;
    
    // Tarih formatını düzenleme
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };
    
    // Bakım zamanı kontrolü (zamanı geçmiş, yaklaşan, normal)
    const getNextMaintenanceClass = () => {
      const today = new Date();
      const nextDate = new Date(item.nextMaintenanceDate);
      const diffTime = nextDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'bg-red-100 text-red-800'; // Zamanı geçmiş
      if (diffDays <= 30) return 'bg-yellow-100 text-yellow-800'; // 30 gün içinde
      return 'bg-green-100 text-green-800'; // Normal
    };
    
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-4">{rowNumber}</td>
        <td className="p-4">
          <div className="flex flex-col">
            <h3 className="font-semibold">{item.deviceType.name}</h3>
            <p className="text-xs text-gray-500">{item.device.serialNumber}</p>
            <p className="text-xs text-gray-500 md:hidden">{item.deviceFeature.name}</p>
          </div>
        </td>
        <td className="p-4">
          <div className="flex flex-col">
            <h3 className="font-semibold">{item.providerIns.name}</h3>
            <p className="text-xs text-gray-500">{item.provider.name}</p>
          </div>
        </td>
        <td className="hidden md:table-cell p-4">
          <div className="flex flex-col">
            <h3 className="font-semibold">{item.customerIns.name}</h3>
            <p className="text-xs text-gray-500">{item.customer.name}</p>
          </div>
        </td>
        <td className="hidden md:table-cell p-4">
          {formatDate(item.maintenanceDate)}
        </td>
        <td className="hidden md:table-cell p-4">
          <span className={`px-2 py-1 rounded-full text-xs ${getNextMaintenanceClass()}`}>
            {formatDate(item.nextMaintenanceDate)}
          </span>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            {canViewMaintenance(currentUserRole, item.providerInsId, item.customerInsId, currentUserInstitutionId) && (
              <Link href={`/list/maintenances/${item.id}`}>
                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple" title="Görüntüle">
                  <Image src="/view.png" alt="" width={24} height={24} />
                </button>
              </Link>
            )}
            {canManageMaintenance(currentUserRole, item.providerInsId, currentUserInstitutionId) && (
              <FormModal table="maintenance" type="delete" id={item.id} />
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
            ? 'Tüm Bakımlar'
            : currentUserRole.startsWith('MUSTERI')
              ? 'Cihazlarınıza Yapılan Bakımlar'
              : 'Yaptığınız Bakımlar'}
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <TableFilter options={filterOptions} />
            <TableSort options={sortOptions} />
            {canCreateMaintenance(currentUserRole) && (
              <FormModal table="maintenance" type="create" />
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

export default MaintenanceListPage;