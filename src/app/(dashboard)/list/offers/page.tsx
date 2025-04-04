import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import TableSort from "@/components/TableSort";
import TableFilter from "@/components/TableFilter";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import {
  PaymentTermTypes,
  Services,
  User,
  Institutions,
  OfferCards,
  Prisma,
  UserRole,
  OfferRequests,
  OfferStatus
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { FilterOption } from "@/components/TableFilter";

type OfferList = OfferCards & {
  paymentTerm: PaymentTermTypes;
  creator: User;
  creatorIns: Institutions;
  recipient: User;
  recipientIns: Institutions;
  OfferSub: {
    unitPrice: Prisma.Decimal;
    size: Prisma.Decimal;
  }[];
};

// TableSort bileşeninin beklediği SortOption tipi
type SortOption = {
  label: string;
  field: string;
  order: "asc" | "desc";
};

const calculateTotalAmount = (offerSubs: { unitPrice: Prisma.Decimal; size: Prisma.Decimal }[]) => {
  return offerSubs.reduce((total, sub) => {
    const subTotal = parseFloat(sub.unitPrice.toString()) * parseFloat(sub.size.toString());
    return total + subTotal;
  }, 0);
};

const columns = [
  {
    header: "No",
    accessor: "rowNumber",
  },
  {
    header: "Teklif Veren",
    accessor: "creator",
  },
  {
    header: "Müşteri",
    accessor: "recipient",
  },
  {
    header: "Teklif Tarihi",
    accessor: "offerDate",
    className: "hidden md:table-cell",
  },
  {
    header: "Geçerlilik",
    accessor: "validityDate",
    className: "hidden md:table-cell",
  },
  {
    header: "Tutar",
    accessor: "amount",
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

const canViewOffer = (
  userRole: UserRole,
  offerCreatorInsId: string,
  offerRecipientInsId: string,
  currentUserInstitutionId: string | null | undefined
) => {
  if (userRole === UserRole.ADMIN) return true;

  if (!currentUserInstitutionId) return false;

  // Müşteri rolleri sadece kendilerine verilen teklifleri görebilir
  if (
    (userRole === UserRole.MUSTERI_SEVIYE1 ||
      userRole === UserRole.MUSTERI_SEVIYE2) &&
    currentUserInstitutionId === offerRecipientInsId
  ) return true;

  // Hizmet sağlayıcı rolleri sadece kendi verdikleri teklifleri görebilir
  if (
    (userRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 ||
      userRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) &&
    currentUserInstitutionId === offerCreatorInsId
  ) return true;

  return false;
};

const canDeleteOffer = (
  userRole: UserRole,
  offerCreatorInsId: string,
  currentUserInstitutionId: string | null | undefined
) => {
  if (userRole === UserRole.ADMIN) return true;

  if (!currentUserInstitutionId) return false;

  // Sadece HIZMETSAGLAYICI_SEVIYE1 kendi verdiği teklifleri silebilir
  if (
    userRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 &&
    currentUserInstitutionId === offerCreatorInsId
  ) return true;

  return false;
};

const OfferListPage = async ({
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
  
  // Varsayılan olarak duruma göre artan ve tarihe göre azalan sıralama
  const sortField = sort || 'status';
  const sortOrder = order || 'asc';

  const query: Prisma.OfferCardsWhereInput = {};

  // Role göre filtreleme
  if (currentUserRole !== UserRole.ADMIN && currentUserInstitutionId) {
    if (currentUserRole === UserRole.MUSTERI_SEVIYE1 ||
      currentUserRole === UserRole.MUSTERI_SEVIYE2) {
      // Müşteriler sadece kendilerine verilen teklifleri görebilir
      query.recipientInsId = currentUserInstitutionId;
    } else if (currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 ||
      currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) {
      // Hizmet sağlayıcılar sadece kendi verdikleri teklifleri görebilir
      query.creatorInsId = currentUserInstitutionId;
    }
  }

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
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
            if (currentUserRole === UserRole.ADMIN || 
                (currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 || 
                 currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2)) {
              query.recipientInsId = value;
            }
            break;
          case "creatorInsId":
            if (currentUserRole === UserRole.ADMIN || 
                (currentUserRole === UserRole.MUSTERI_SEVIYE1 || 
                 currentUserRole === UserRole.MUSTERI_SEVIYE2)) {
              query.creatorInsId = value;
            }
            break;
          case "paymentTermId":
            query.paymentTermId = value;
            break;
          case "status":
            query.status = value as OfferStatus;
            break;
          case "requestId":
            const requestId = value;
            if (requestId) {
              query.requestId = requestId;
            }
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
                recipientIns: {
                  name: { contains: value, mode: "insensitive" }
                }
              },
              {
                creator: {
                  name: { contains: value, mode: "insensitive" }
                }
              },
              {
                recipient: {
                  name: { contains: value, mode: "insensitive" }
                }
              }
            ];
            break;
          case "offerDateFrom":
            // Teklif tarihi için filtreleme
            if (query.offerDate && typeof query.offerDate === 'object') {
              const dateFilter = query.offerDate as Prisma.DateTimeFilter<"OfferCards">;
              dateFilter.gte = new Date(value);
            } else {
              query.offerDate = {
                gte: new Date(value)
              };
            }
            break;
          case "offerDateTo":
            if (query.offerDate && typeof query.offerDate === 'object') {
              const dateFilter = query.offerDate as Prisma.DateTimeFilter<"OfferCards">;
              dateFilter.lte = new Date(value);
            } else {
              query.offerDate = {
                lte: new Date(value)
              };
            }
            break;
          case "validityDateFrom":
            // Geçerlilik tarihi için filtreleme
            if (query.validityDate && typeof query.validityDate === 'object') {
              const dateFilter = query.validityDate as Prisma.DateTimeFilter<"OfferCards">;
              dateFilter.gte = new Date(value);
            } else {
              query.validityDate = {
                gte: new Date(value)
              };
            }
            break;
          case "validityDateTo":
            if (query.validityDate && typeof query.validityDate === 'object') {
              const dateFilter = query.validityDate as Prisma.DateTimeFilter<"OfferCards">;
              dateFilter.lte = new Date(value);
            } else {
              query.validityDate = {
                lte: new Date(value)
              };
            }
            break;
          case "isExpired":
            if (value === "true") {
              const today = new Date();
              query.validityDate = { lt: today };
              query.status = "Beklemede";
            } else if (value === "false") {
              const today = new Date();
              query.OR = [
                { validityDate: { gte: today } },
                { status: { not: "Beklemede" } }
              ];
            }
            break;
        }
      }
    }
  }

  // Kurumları getir
  let recipientInstitutions: { id: string; name: string }[] = [];
  let creatorInstitutions: { id: string; name: string }[] = [];
  let paymentTerms: { id: string; name: string }[] = [];

  if (currentUserRole === UserRole.ADMIN) {
    // Admin için tüm kurumları getir
    const institutions = await prisma.institutions.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
    
    recipientInstitutions = institutions;
    creatorInstitutions = institutions;
  } else if (currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 || 
             currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) {
    // Hizmet sağlayıcılar için müşteri kurumları getir
    recipientInstitutions = await prisma.institutions.findMany({
      where: {
        User: {
          some: {
            role: {
              in: [UserRole.MUSTERI_SEVIYE1, UserRole.MUSTERI_SEVIYE2]
            }
          }
        }
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
  } else if (currentUserRole === UserRole.MUSTERI_SEVIYE1 || 
             currentUserRole === UserRole.MUSTERI_SEVIYE2) {
    // Müşteriler için hizmet sağlayıcı kurumları getir
    creatorInstitutions = await prisma.institutions.findMany({
      where: {
        User: {
          some: {
            role: {
              in: [UserRole.HIZMETSAGLAYICI_SEVIYE1, UserRole.HIZMETSAGLAYICI_SEVIYE2]
            }
          }
        }
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
  }

  // Ödeme koşullarını getir
  paymentTerms = await prisma.paymentTermTypes.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  // Dinamik sıralama için orderBy nesnesini oluştur
  let orderBy: any = {};
  
  // Özel alanlar için sıralama mantığı
  if (sortField === 'creatorIns') {
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
  } else if (sortField === 'creator') {
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
  } else if (sortField === 'paymentTerm') {
    orderBy = {
      paymentTerm: {
        name: sortOrder
      }
    };
  } else {
    // Diğer alanlar için doğrudan sıralama
    orderBy[sortField] = sortOrder;
  }

  // İkincil sıralama (duruma göre önce, sonra tarihe göre)
  if (sortField !== 'status' && sortField !== 'offerDate') {
    orderBy = [
      orderBy,
      { status: 'asc' },
      { offerDate: 'desc' }
    ];
  }

  const [data, count] = await prisma.$transaction([
    prisma.offerCards.findMany({
      where: query,
      include: {
        paymentTerm: true,
        creator: true,
        creatorIns: true,
        recipient: true,
        recipientIns: true,
        OfferSub: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: orderBy
    }),
    prisma.offerCards.count({ where: query }),
  ]);

  // Sıralama seçenekleri
  const sortOptions: SortOption[] = [
    { label: "Teklif Veren Kurum (A-Z)", field: "creatorIns", order: "asc" },
    { label: "Teklif Veren Kurum (Z-A)", field: "creatorIns", order: "desc" },
    { label: "Teklif Veren Kişi (A-Z)", field: "creator", order: "asc" },
    { label: "Teklif Veren Kişi (Z-A)", field: "creator", order: "desc" },
    { label: "Müşteri Kurum (A-Z)", field: "recipientIns", order: "asc" },
    { label: "Müşteri Kurum (Z-A)", field: "recipientIns", order: "desc" },
    { label: "Müşteri Kişi (A-Z)", field: "recipient", order: "asc" },
    { label: "Müşteri Kişi (Z-A)", field: "recipient", order: "desc" },
    { label: "Teklif Tarihi (Yeni-Eski)", field: "offerDate", order: "desc" },
    { label: "Teklif Tarihi (Eski-Yeni)", field: "offerDate", order: "asc" },
    { label: "Geçerlilik Tarihi (Yakın-Uzak)", field: "validityDate", order: "asc" },
    { label: "Geçerlilik Tarihi (Uzak-Yakın)", field: "validityDate", order: "desc" },
    { label: "Durum (A-Z)", field: "status", order: "asc" },
    { label: "Durum (Z-A)", field: "status", order: "desc" }
  ];

  // Filtreleme seçenekleri
  const filterOptions: FilterOption[] = [];

  // Durum filtresi - herkese gösteriliyor
  filterOptions.push({
    type: "status",
    label: "Durum",
    field: "status",
    options: [
      { value: "Onaylandi", label: "Onaylandı" },
      { value: "Red", label: "Reddedildi" },
      { value: "Beklemede", label: "Beklemede" }
    ]
  });

  // Süresi dolmuş teklifler filtresi
  filterOptions.push({
    type: "status",
    label: "Geçerlilik",
    field: "isExpired",
    options: [
      { value: "true", label: "Süresi Dolmuş" },
      { value: "false", label: "Geçerli" }
    ]
  });

  // Ödeme koşulu filtresi
  filterOptions.push({
    type: "select",
    label: "Ödeme Koşulu",
    field: "paymentTermId",
    data: paymentTerms
  });

  // Admin ve hizmet sağlayıcılar için müşteri kurumu filtresi
  if ((currentUserRole === UserRole.ADMIN || 
       currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 || 
       currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) && 
      recipientInstitutions.length > 0) {
    filterOptions.push({
      type: "select",
      label: "Müşteri Kurumu",
      field: "recipientInsId",
      data: recipientInstitutions
    });
  }

  // Admin ve müşteriler için hizmet sağlayıcı kurumu filtresi
  if ((currentUserRole === UserRole.ADMIN || 
       currentUserRole === UserRole.MUSTERI_SEVIYE1 || 
       currentUserRole === UserRole.MUSTERI_SEVIYE2) && 
      creatorInstitutions.length > 0) {
    filterOptions.push({
      type: "select",
      label: "Hizmet Sağlayıcı Kurumu",
      field: "creatorInsId",
      data: creatorInstitutions
    });
  }

  // Tarih aralığı filtreleri
  filterOptions.push({
    type: "dateRange",
    label: "Teklif Tarihi",
    fieldFrom: "offerDateFrom",
    fieldTo: "offerDateTo"
  });

  filterOptions.push({
    type: "dateRange",
    label: "Geçerlilik Tarihi",
    fieldFrom: "validityDateFrom",
    fieldTo: "validityDateTo"
  });

  const renderRow = (item: OfferList) => {
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
    
    // Toplam tutar hesaplama
    const totalAmount = calculateTotalAmount(item.OfferSub);
    
    // Duruma göre renk belirleme
    const getStatusClass = (status: OfferStatus) => {
      switch(status) {
        case 'Onaylandi':
          return 'bg-green-100 text-green-800';
        case 'Red':
          return 'bg-red-100 text-red-800';
        case 'Beklemede':
          return 'bg-yellow-100 text-yellow-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };
    
    // Teklifin geçerlilik durumunu kontrol etme
    const isOfferExpired = () => {
      const today = new Date();
      return item.validityDate < today && item.status === 'Beklemede';
    };
    
    return (
      <tr
        key={item.id}
        className={`border-b border-gray-200 text-sm hover:bg-lamaPurpleLight ${
          isOfferExpired() ? 'bg-orange-50' : 'even:bg-slate-50'
        }`}
      >
        <td className="p-4">{rowNumber}</td>
        <td className="p-4">
          <div className="flex flex-col">
            <h3 className="font-semibold">{item.creatorIns.name}</h3>
            <p className="text-xs text-gray-500">{item.creator.name}</p>
          </div>
        </td>
        <td className="p-4">
          <div className="flex flex-col">
            <h3 className="font-semibold">{item.recipientIns.name}</h3>
            <p className="text-xs text-gray-500">{item.recipient.name}</p>
          </div>
        </td>
        <td className="hidden md:table-cell p-4">{formatDate(item.offerDate)}</td>
        <td className="hidden md:table-cell p-4">
          <span className={isOfferExpired() ? 'text-red-600 font-medium' : ''}>
            {formatDate(item.validityDate)}
          </span>
          {isOfferExpired() && (
            <span className="block text-xs text-red-600">Süresi doldu</span>
          )}
        </td>
        <td className="p-4">
          <span className="font-medium">
            {totalAmount.toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} ₺
          </span>
          {item.paymentTerm && (
            <p className="text-xs text-gray-500">{item.paymentTerm.name}</p>
          )}
        </td>
        <td className="p-4">
          <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(item.status)}`}>
            {item.status}
          </span>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            {canViewOffer(currentUserRole, item.creatorInsId, item.recipientInsId, currentUserInstitutionId) && (
              <Link href={`/list/offers/${item.id}`}>
                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple" title="Görüntüle">
                  <Image src="/view.png" alt="" width={24} height={24} />
                </button>
              </Link>
            )}
            {canDeleteOffer(currentUserRole, item.creatorInsId, currentUserInstitutionId) && (
              <FormModal table="offer" type="delete" id={item.id} />
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
            ? 'Tüm Teklifler'
            : currentUserRole.startsWith('MUSTERI')
              ? 'Size Verilen Teklifler'
              : 'Verdiğiniz Teklifler'}
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <TableFilter options={filterOptions} />
            <TableSort options={sortOptions} />
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

export default OfferListPage;