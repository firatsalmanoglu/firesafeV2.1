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
  OfferRequests,
  User,
  Institutions,
  RequestSub,
  Prisma,
  Services,
  UserRole,
  RequestStatus
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { FilterOption } from "@/components/TableFilter";

type OfferRequestList = OfferRequests & {
  creatorIns: Institutions
} & {
  creator: User
} & {
  RequestSub: (RequestSub & {
    service: Services
  })[];
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
    header: "Kurum",
    accessor: "institution",
  },
  {
    header: "İçerik",
    accessor: "content",
    className: "hidden md:table-cell",
  },
  {
    header: "Tarih Aralığı",
    accessor: "dateRange",
    className: "hidden md:table-cell",
  },
  {
    header: "Durum",
    accessor: "status",
  },
  {
    header: "Eylemler",
    accessor: "action",
  },
];

const canViewOfferRequests = (
  userRole: UserRole,
  requestCreatorInsId: string,
  currentUserInstitutionId: string | null | undefined
) => {
  if (userRole === UserRole.ADMIN) return true;

  if (
    (userRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 ||
      userRole === UserRole.HIZMETSAGLAYICI_SEVIYE2)
  ) return true;

  if (
    (userRole === UserRole.MUSTERI_SEVIYE1 ||
      userRole === UserRole.MUSTERI_SEVIYE2) &&
    currentUserInstitutionId === requestCreatorInsId
  ) return true;

  return false;
};

const canCreateOfferRequest = (userRole: UserRole) => {
  const authorizedRoles: Array<UserRole> = [
    UserRole.ADMIN,
    UserRole.MUSTERI_SEVIYE1
  ];
  return authorizedRoles.includes(userRole);
};

const canDeleteOfferRequest = (
  userRole: UserRole,
  requestCreatorInsId: string,
  currentUserInstitutionId: string | null | undefined
) => {
  if (userRole === UserRole.ADMIN) return true;

  if (
    userRole === UserRole.MUSTERI_SEVIYE1 &&
    currentUserInstitutionId === requestCreatorInsId
  ) return true;

  return false;
};

const canCreateOffer = (userRole: UserRole) => {
  const authorizedRoles: Array<UserRole> = [
    UserRole.ADMIN,
    UserRole.HIZMETSAGLAYICI_SEVIYE1,
    UserRole.HIZMETSAGLAYICI_SEVIYE2
  ];
  return authorizedRoles.includes(userRole);
};

const OfferRequestListPage = async ({
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
  
  // Varsayılan olarak duruma göre artan ve tarihe göre azalan sıralama
  const sortField = sort || 'status';
  const sortOrder = order || 'asc';

  const query: Prisma.OfferRequestsWhereInput = {};

  // Role göre filtreleme
  if (currentUserRole !== UserRole.ADMIN && currentUserInstitutionId) {
    if (currentUserRole === UserRole.MUSTERI_SEVIYE1 ||
      currentUserRole === UserRole.MUSTERI_SEVIYE2) {
      // Müşteri rolündeki kullanıcılar sadece kendi kurumlarının taleplerini görebilir
      query.creatorInsId = currentUserInstitutionId;
    }
    // Hizmet sağlayıcılar tüm talepleri görebilir, ek filtreye gerek yok
  }

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "id":
            const id = value;
            if (id) {
              query.id = id;
            }
            break;
          case "creatorInsId":
            if (currentUserRole === UserRole.ADMIN || 
                currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 ||
                currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) {
              query.creatorInsId = value;
            }
            break;
          case "status":
            query.status = value as RequestStatus;
            break;
          case "search":
            query.OR = [
              { details: { contains: value, mode: "insensitive" } },
              {
                creatorIns: {
                  name: { contains: value, mode: "insensitive" }
                }
              },
              {
                creator: {
                  name: { contains: value, mode: "insensitive" }
                }
              },
              {
                RequestSub: {
                  some: {
                    service: {
                      name: { contains: value, mode: "insensitive" }
                    }
                  }
                }
              }
            ];
            break;
          case "startDateFrom":
            // Başlangıç tarihi için filtreleme
            if (query.start && typeof query.start === 'object') {
              const dateFilter = query.start as Prisma.DateTimeFilter<"OfferRequests">;
              dateFilter.gte = new Date(value);
            } else {
              query.start = {
                gte: new Date(value)
              };
            }
            break;
          case "startDateTo":
            if (query.start && typeof query.start === 'object') {
              const dateFilter = query.start as Prisma.DateTimeFilter<"OfferRequests">;
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
              const dateFilter = query.end as Prisma.DateTimeFilter<"OfferRequests">;
              dateFilter.gte = new Date(value);
            } else {
              query.end = {
                gte: new Date(value)
              };
            }
            break;
          case "endDateTo":
            if (query.end && typeof query.end === 'object') {
              const dateFilter = query.end as Prisma.DateTimeFilter<"OfferRequests">;
              dateFilter.lte = new Date(value);
            } else {
              query.end = {
                lte: new Date(value)
              };
            }
            break;
        }
      }
    }
  }

  // Admin veya hizmet sağlayıcılar için kurumları getir (filtreleme için)
  let institutions: { id: string; name: string }[] = [];
  if (currentUserRole === UserRole.ADMIN || 
      currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 ||
      currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) {
    institutions = await prisma.institutions.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
  }

  // Dinamik sıralama için orderBy nesnesini oluştur
  let orderBy: any = {};
  
  // Özel alanlar için sıralama mantığı
  if (sortField === 'creatorIns') {
    orderBy = {
      creatorIns: {
        name: sortOrder
      }
    };
  } else if (sortField === 'creator') {
    orderBy = {
      creator: {
        name: sortOrder
      }
    };
  } else {
    // Diğer alanlar için doğrudan sıralama
    orderBy[sortField] = sortOrder;
  }

  // İkincil sıralama (duruma göre önce, sonra tarihe göre)
  if (sortField !== 'status' && sortField !== 'start') {
    orderBy = [
      orderBy,
      { status: 'asc' },
      { start: 'desc' }
    ];
  }

  const [data, count] = await prisma.$transaction([
    prisma.offerRequests.findMany({
      where: query,
      include: {
        creatorIns: true,
        creator: true,
        RequestSub: {
          include: {
            service: true
          }
        }
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: orderBy
    }),
    prisma.offerRequests.count({ where: query }),
  ]);

  // Sıralama seçenekleri
  const sortOptions: SortOption[] = [
    { label: "Kurum (A-Z)", field: "creatorIns", order: "asc" },
    { label: "Kurum (Z-A)", field: "creatorIns", order: "desc" },
    { label: "Kullanıcı (A-Z)", field: "creator", order: "asc" },
    { label: "Kullanıcı (Z-A)", field: "creator", order: "desc" },
    { label: "Başlangıç Tarihi (Yeni-Eski)", field: "start", order: "desc" },
    { label: "Başlangıç Tarihi (Eski-Yeni)", field: "start", order: "asc" },
    { label: "Bitiş Tarihi (Yeni-Eski)", field: "end", order: "desc" },
    { label: "Bitiş Tarihi (Eski-Yeni)", field: "end", order: "asc" },
    { label: "Durum (A-Z)", field: "status", order: "asc" },
    { label: "Durum (Z-A)", field: "status", order: "desc" }
  ];

  // Filtreleme seçenekleri - OfferRequests için özelleştirilmiş
  const filterOptions: FilterOption[] = [];

  // Durum filtresi - herkese gösteriliyor
  filterOptions.push({
    type: "status",
    label: "Durum",
    field: "status",
    options: [
      { value: "Aktif", label: "Aktif" },
      { value: "Pasif", label: "Pasif" },
      { value: "Beklemede", label: "Beklemede" },
      { value: "Iptal", label: "İptal" },
      { value: "TeklifAlindi", label: "Teklif Alındı" },
      { value: "Tamamlandi", label: "Tamamlandı" }
    ]
  });

  // Kurum filtresi - sadece admin ve hizmet sağlayıcılar için
  if (currentUserRole === UserRole.ADMIN || 
      currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 ||
      currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) {
    filterOptions.push({
      type: "select",
      label: "Talep Eden Kurum",
      field: "creatorInsId",
      data: institutions
    });
  }

  // Tarih aralığı filtreleri - herkese gösteriliyor
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

  const renderRow = (item: OfferRequestList) => {
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
    
    // İçerik özeti oluşturma (alt hizmetler)
    const getContentSummary = () => {
      if (!item.RequestSub || item.RequestSub.length === 0) return "Detay bulunamadı";
      
      const serviceNames = item.RequestSub.map(sub => sub.service.name);
      if (serviceNames.length <= 2) return serviceNames.join(", ");
      
      return `${serviceNames[0]}, ${serviceNames[1]} ve ${serviceNames.length - 2} diğer`;
    };
    
    // Durum rozetinin rengini belirleme
    const getStatusClass = (status: RequestStatus) => {
      switch(status) {
        case 'Aktif':
          return 'bg-green-100 text-green-800';
        case 'Pasif':
          return 'bg-gray-100 text-gray-800';
        case 'Beklemede':
          return 'bg-yellow-100 text-yellow-800';
        case 'Iptal':
          return 'bg-red-100 text-red-800';
        case 'TeklifAlindi':
          return 'bg-blue-100 text-blue-800';
        case 'Tamamlandi':
          return 'bg-purple-100 text-purple-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };
    
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-4">{rowNumber}</td>
        <td className="p-4">
          <div className="flex flex-col">
            <h3 className="font-semibold">{item.creatorIns.name}</h3>
            <p className="text-xs text-gray-500">{item.creator.name}</p>
          </div>
        </td>
        <td className="hidden md:table-cell p-4">
          <div className="flex flex-col">
            <p className="text-sm">{getContentSummary()}</p>
            <p className="text-xs text-gray-500 line-clamp-1" title={item.details}>
              {item.details}
            </p>
          </div>
        </td>
        <td className="hidden md:table-cell p-4">
          <div className="flex flex-col">
            <p className="text-xs">Başlangıç: {formatDate(item.start)}</p>
            <p className="text-xs">Bitiş: {formatDate(item.end)}</p>
          </div>
        </td>
        <td className="p-4">
          <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(item.status)}`}>
            {item.status}
          </span>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            {canViewOfferRequests(currentUserRole, item.creatorInsId, currentUserInstitutionId) && (
              <Link href={`/list/offerRequests/${item.id}`}>
                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple" title="Görüntüle">
                  <Image src="/view.png" alt="" width={24} height={24} />
                </button>
              </Link>
            )}

            {canCreateOffer(currentUserRole) && item.status === 'Aktif' && (
              <FormModal
                table="offer"
                type="create"
                currentUserRole={currentUserRole}
                currentUserId={currentUserId || ''}
                data={{
                  requestId: item.id,
                  recipientId: item.creator.id,
                  recipientInsId: item.creatorInsId,
                  offerDate: new Date().toISOString(),
                  validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                  status: "Beklemede",
                  offerSub: item.RequestSub.map(sub => ({
                    serviceId: sub.serviceId,
                    service: sub.service,
                    size: sub.quantity,
                    detail: sub.detail,
                    unitPrice: '',
                    isFromRequest: true
                  }))
                }}
              >
                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaYellow" title="Teklif Oluştur">
                  <Image src="/offer.png" alt="" width={20} height={20} />
                </button>
              </FormModal>
            )}

            {canDeleteOfferRequest(currentUserRole, item.creatorInsId, currentUserInstitutionId) && (
              <FormModal table="offerRequest" type="delete" id={item.id} />
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
            ? 'Tüm Teklif Talepleri'
            : currentUserRole.startsWith('MUSTERI')
              ? 'Kurumunuzun Teklif Talepleri'
              : 'Mevcut Teklif Talepleri'}
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <TableFilter options={filterOptions} />
            <TableSort options={sortOptions} />
            {canCreateOfferRequest(currentUserRole) && (
              <FormModal
                table="offerRequest"
                type="create"
                currentUserRole={currentUserRole}
                currentUserId={currentUserId || ''}
              />
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table columns={columns} renderRow={renderRow} data={data} />
      </div>

      <Pagination page={p} count={count} />
    </div>
  );
};

export default OfferRequestListPage;