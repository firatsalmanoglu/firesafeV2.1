import { auth } from "@/auth";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import TableSort from "@/components/TableSort";
import TableFilter from "@/components/TableFilter";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import {
  Appointments,
  Institutions,
  User,
  Prisma,
  UserRole
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { FilterOption } from "@/components/TableFilter";

type EventList = Appointments & { creator: User } & {
  creatorIns: Institutions;
} & { recipient: User } & { recipientIns: Institutions };

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
    header: "Oluşturan",
    accessor: "creator",
  },
  {
    header: "İlgili Kişi",
    accessor: "recipient",
  },
  {
    header: "Başlangıç",
    accessor: "start",
    className: "hidden md:table-cell",
  },
  {
    header: "Bitiş",
    accessor: "end",
    className: "hidden md:table-cell",
  },
  {
    header: "Başlık",
    accessor: "title",
    className: "hidden md:table-cell",
  },
  {
    header: "Eylemler",
    accessor: "action",
  },
];

const canViewAppointment = (
  userRole: UserRole,
  appointmentCreatorId: string,
  appointmentCreatorInsId: string,
  appointmentRecipientId: string,
  appointmentRecipientInsId: string,
  currentUserId: string | null | undefined,
  currentUserInstitutionId: string | null | undefined
) => {
  if (userRole === UserRole.ADMIN) return true;

  if (!currentUserId || !currentUserInstitutionId) return false;

  // MUSTERI_SEVIYE2 sadece kendisine ait randevuları görür
  if (
    userRole === UserRole.MUSTERI_SEVIYE2 &&
    currentUserId === appointmentRecipientId
  ) return true;

  // MUSTERI_SEVIYE1 kendi kurumuna ait tüm randevuları görür
  if (
    userRole === UserRole.MUSTERI_SEVIYE1 &&
    currentUserInstitutionId === appointmentRecipientInsId
  ) return true;

  // HIZMETSAGLAYICI_SEVIYE2 kendisinin oluşturduğu randevuları görür
  if (
    userRole === UserRole.HIZMETSAGLAYICI_SEVIYE2 &&
    currentUserId === appointmentCreatorId
  ) return true;

  // HIZMETSAGLAYICI_SEVIYE1 kurumunun oluşturduğu tüm randevuları görür
  if (
    userRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 &&
    currentUserInstitutionId === appointmentCreatorInsId
  ) return true;

  return false;
};

const canManageAppointment = (
  userRole: UserRole,
  appointmentCreatorId: string,
  appointmentCreatorInsId: string,
  currentUserId: string | null | undefined,
  currentUserInstitutionId: string | null | undefined
) => {
  if (userRole === UserRole.ADMIN) return true;

  if (!currentUserId || !currentUserInstitutionId) return false;

  // HIZMETSAGLAYICI_SEVIYE2 kendisinin oluşturduğu randevuları yönetebilir
  if (
    userRole === UserRole.HIZMETSAGLAYICI_SEVIYE2 &&
    currentUserId === appointmentCreatorId
  ) return true;

  // HIZMETSAGLAYICI_SEVIYE1 kurumunun oluşturduğu tüm randevuları yönetebilir
  if (
    userRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 &&
    currentUserInstitutionId === appointmentCreatorInsId
  ) return true;

  return false;
};

const canCreateAppointment = (userRole: UserRole) => {
  const authorizedRoles: Array<UserRole> = [
    UserRole.ADMIN,
    UserRole.HIZMETSAGLAYICI_SEVIYE1,
    UserRole.HIZMETSAGLAYICI_SEVIYE2
  ];
  return authorizedRoles.includes(userRole);
};

const EventListPage = async ({
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
  
  // Varsayılan olarak başlangıç tarihine göre sıralama
  const sortField = sort || 'start';
  const sortOrder = order || 'asc';

  const query: Prisma.AppointmentsWhereInput = {};

  // Role göre filtreleme
  if (currentUserRole !== UserRole.ADMIN) {
    if (currentUserRole === UserRole.MUSTERI_SEVIYE2) {
      // MUSTERI_SEVIYE2 sadece kendisine ait randevuları görür
      query.recipientId = currentUserId;
    } else if (currentUserRole === UserRole.MUSTERI_SEVIYE1 && currentUserInstitutionId) {
      // MUSTERI_SEVIYE1 kendi kurumuna ait tüm randevuları görür
      query.recipientInsId = currentUserInstitutionId;
    } else if (currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) {
      // HIZMETSAGLAYICI_SEVIYE2 kendisinin oluşturduğu randevuları görür
      query.creatorId = currentUserId;
    } else if (currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 && currentUserInstitutionId) {
      // HIZMETSAGLAYICI_SEVIYE1 kurumunun oluşturduğu tüm randevuları görür
      query.creatorInsId = currentUserInstitutionId;
    }
  }

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "recipientId":
            if (currentUserRole === UserRole.ADMIN || 
                (currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 || 
                 currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2)) {
              query.recipientId = value;
            }
            break;
          case "recipientInsId":
            if (currentUserRole === UserRole.ADMIN || 
                (currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 || 
                 currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2)) {
              query.recipientInsId = value;
            }
            break;
          case "creatorId":
            if (currentUserRole === UserRole.ADMIN || 
                (currentUserRole === UserRole.MUSTERI_SEVIYE1 || 
                 currentUserRole === UserRole.MUSTERI_SEVIYE2)) {
              query.creatorId = value;
            }
            break;
          case "creatorInsId":
            if (currentUserRole === UserRole.ADMIN || 
                (currentUserRole === UserRole.MUSTERI_SEVIYE1 || 
                 currentUserRole === UserRole.MUSTERI_SEVIYE2)) {
              query.creatorInsId = value;
            }
            break;
          case "search":
            query.OR = [
              { tittle: { contains: value, mode: "insensitive" } },
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
              }
            ];
            break;
          case "startDateFrom":
            // Başlangıç tarihi için filtreleme
            if (query.start && typeof query.start === 'object') {
              const dateFilter = query.start as Prisma.DateTimeFilter<"Appointments">;
              dateFilter.gte = new Date(value);
            } else {
              query.start = {
                gte: new Date(value)
              };
            }
            break;
          case "startDateTo":
            if (query.start && typeof query.start === 'object') {
              const dateFilter = query.start as Prisma.DateTimeFilter<"Appointments">;
              dateFilter.lte = new Date(value);
            } else {
              query.start = {
                lte: new Date(value)
              };
            }
            break;
          case "endDateFrom":
            // Bitiş tarihi için filtreleme
            if (query.end && typeof query.end === 'object') {
              const dateFilter = query.end as Prisma.DateTimeFilter<"Appointments">;
              dateFilter.gte = new Date(value);
            } else {
              query.end = {
                gte: new Date(value)
              };
            }
            break;
          case "endDateTo":
            if (query.end && typeof query.end === 'object') {
              const dateFilter = query.end as Prisma.DateTimeFilter<"Appointments">;
              dateFilter.lte = new Date(value);
            } else {
              query.end = {
                lte: new Date(value)
              };
            }
            break;
          case "status":
            const today = new Date();
            if (value === "upcoming") {
              // Gelecek randevular
              query.start = { gt: today };
            } else if (value === "past") {
              // Geçmiş randevular
              query.end = { lt: today };
            } else if (value === "current") {
              // Şu an devam eden randevular
              query.start = { lte: today };
              query.end = { gte: today };
            }
            break;
        }
      }
    }
  }

  // Kurumlar ve kullanıcılar için filtreleme seçeneklerini getir
  let recipientInstitutions: { id: string; name: string }[] = [];
  let creatorInstitutions: { id: string; name: string }[] = [];
  let recipients: { id: string; name: string | null }[] = [];
  let creators: { id: string; name: string | null }[] = [];

  // Kurumlar - basit sorgular
  if (currentUserRole === UserRole.ADMIN || 
      currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 || 
      currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) {
    recipientInstitutions = await prisma.institutions.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
  }

  if (currentUserRole === UserRole.ADMIN || 
      currentUserRole === UserRole.MUSTERI_SEVIYE1 || 
      currentUserRole === UserRole.MUSTERI_SEVIYE2) {
    creatorInstitutions = await prisma.institutions.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
  }

  // İlgili kuruma ait kullanıcılar
  if (queryParams.recipientInsId) {
    recipients = await prisma.user.findMany({
      where: { 
        institutionId: queryParams.recipientInsId,
        name: { not: null } // Adı null olmayanları getir
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
  }

  if (queryParams.creatorInsId) {
    creators = await prisma.user.findMany({
      where: { 
        institutionId: queryParams.creatorInsId,
        name: { not: null } // Adı null olmayanları getir
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
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
  } else {
    // Diğer alanlar için doğrudan sıralama
    orderBy[sortField] = sortOrder;
  }

  const [data, count] = await prisma.$transaction([
    prisma.appointments.findMany({
      where: query,
      include: {
        creator: true,
        creatorIns: true,
        recipient: true,
        recipientIns: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: orderBy
    }),
    prisma.appointments.count({ where: query }),
  ]);

  // Sıralama seçenekleri
  const sortOptions: SortOption[] = [
    { label: "Başlangıç (Yakın-Uzak)", field: "start", order: "asc" },
    { label: "Başlangıç (Uzak-Yakın)", field: "start", order: "desc" },
    { label: "Bitiş (Yakın-Uzak)", field: "end", order: "asc" },
    { label: "Bitiş (Uzak-Yakın)", field: "end", order: "desc" },
    { label: "Başlık (A-Z)", field: "tittle", order: "asc" },
    { label: "Başlık (Z-A)", field: "tittle", order: "desc" },
    { label: "Oluşturan Kişi (A-Z)", field: "creator", order: "asc" },
    { label: "Oluşturan Kişi (Z-A)", field: "creator", order: "desc" },
    { label: "Oluşturan Kurum (A-Z)", field: "creatorIns", order: "asc" },
    { label: "Oluşturan Kurum (Z-A)", field: "creatorIns", order: "desc" },
    { label: "İlgili Kişi (A-Z)", field: "recipient", order: "asc" },
    { label: "İlgili Kişi (Z-A)", field: "recipient", order: "desc" },
    { label: "İlgili Kurum (A-Z)", field: "recipientIns", order: "asc" },
    { label: "İlgili Kurum (Z-A)", field: "recipientIns", order: "desc" }
  ];

  // Filtreleme seçenekleri
  const filterOptions: FilterOption[] = [];

  // Durum filtresi
  filterOptions.push({
    type: "status",
    label: "Durum",
    field: "status",
    options: [
      { value: "upcoming", label: "Gelecek" },
      { value: "past", label: "Geçmiş" },
      { value: "current", label: "Şu an devam eden" }
    ]
  });

  // Kurum ve kişi filtreleri - yetkilere göre
  if (currentUserRole === UserRole.ADMIN || 
      currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 || 
      currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) {
    
    filterOptions.push({
      type: "select",
      label: "İlgili Kurum",
      field: "recipientInsId",
      data: recipientInstitutions
    });

    if (recipients.length > 0) {
      // name değeri null olabilir, güvenlik için kontrol
      const validRecipients = recipients
        .filter(r => r.name !== null)
        .map(r => ({ id: r.id, name: r.name as string }));
        
      if (validRecipients.length > 0) {
        filterOptions.push({
          type: "select",
          label: "İlgili Kişi",
          field: "recipientId",
          data: validRecipients
        });
      }
    }
  }

  if (currentUserRole === UserRole.ADMIN || 
      currentUserRole === UserRole.MUSTERI_SEVIYE1 || 
      currentUserRole === UserRole.MUSTERI_SEVIYE2) {
    
    filterOptions.push({
      type: "select",
      label: "Oluşturan Kurum",
      field: "creatorInsId",
      data: creatorInstitutions
    });

    if (creators.length > 0) {
      // name değeri null olabilir, güvenlik için kontrol
      const validCreators = creators
        .filter(c => c.name !== null)
        .map(c => ({ id: c.id, name: c.name as string }));
        
      if (validCreators.length > 0) {
        filterOptions.push({
          type: "select",
          label: "Oluşturan Kişi",
          field: "creatorId",
          data: validCreators
        });
      }
    }
  }

  // Tarih filtreleri
  filterOptions.push({
    type: "dateRange",
    label: "Başlangıç Tarihi",
    fieldFrom: "startDateFrom",
    fieldTo: "startDateTo"
  });

  filterOptions.push({
    type: "dateRange",
    label: "Bitiş Tarihi",
    fieldFrom: "endDateFrom",
    fieldTo: "endDateTo"
  });

  const renderRow = (item: EventList) => {
    // Veri dizisindeki indeksi bulma
    const index = data.findIndex(d => d.id === item.id);
    // Sayfa ve veri sayısına göre sıra numarası hesaplama
    const rowNumber = (p - 1) * ITEM_PER_PAGE + index + 1;
    
    // Tarih formatını Türkçe olarak ayarlama
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };
    
    // Randevu durumu sınıfı
    const getEventClass = () => {
      const today = new Date();
      const start = new Date(item.start);
      const end = new Date(item.end);
      
      if (start > today) return ''; // Gelecek randevu
      if (end < today) return 'bg-gray-50'; // Geçmiş randevu
      return 'bg-green-50'; // Devam eden randevu
    };
    
    return (
      <tr
        key={item.id}
        className={`border-b border-gray-200 text-sm hover:bg-lamaPurpleLight ${getEventClass()}`}
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
        <td className="hidden md:table-cell p-4">{formatDate(item.start)}</td>
        <td className="hidden md:table-cell p-4">{formatDate(item.end)}</td>
        <td className="hidden md:table-cell p-4">
          <span className="line-clamp-1" title={item.tittle}>
            {item.tittle}
          </span>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            {canViewAppointment(
              currentUserRole,
              item.creatorId,
              item.creatorInsId,
              item.recipientId,
              item.recipientInsId,
              currentUserId,
              currentUserInstitutionId
            ) && (
              <Link href={`/list/events/${item.id}`}>
                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple" title="Görüntüle">
                  <Image src="/view.png" alt="" width={24} height={24} />
                </button>
              </Link>
            )}
            {canManageAppointment(
              currentUserRole,
              item.creatorId,
              item.creatorInsId,
              currentUserId,
              currentUserInstitutionId
            ) && (
              <FormModal table="event" type="delete" id={item.id} />
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
            ? 'Tüm Randevular'
            : currentUserRole.startsWith('MUSTERI')
              ? currentUserRole === UserRole.MUSTERI_SEVIYE1
                ? 'Kurumunuzun Randevuları'
                : 'Randevularınız'
              : currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1
                ? 'Kurumunuzun Oluşturduğu Randevular'
                : 'Oluşturduğunuz Randevular'
          }
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <TableFilter options={filterOptions} />
            <TableSort options={sortOptions} />
            {canCreateAppointment(currentUserRole) && (
              <FormModal
                table="event"
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

export default EventListPage;