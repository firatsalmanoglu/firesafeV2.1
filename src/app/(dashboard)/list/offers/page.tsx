import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
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

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

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
          case "recipientInstId":
            const recipientInstId = value;
            if (recipientInstId) {
              query.recipientInsId = recipientInstId;
            }
            break;
          case "creatorInstId":
            const creatorInstId = value;
            if (creatorInstId) {
              query.creatorInsId = creatorInstId;
            }
            break;
          case "institutionFilter":
            const institutionId = value;
            if (institutionId) {
              query.OR = [
                { recipientInsId: institutionId },
                { creatorInsId: institutionId }
              ];
            }
            break;
          case "requestId":
            const requestId = value;
            if (requestId) {
              query.requestId = requestId;
            }
            break;
          case "search":
            query.details = { contains: value, mode: "insensitive" };
            break;
        }
      }
    }
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
      orderBy: [{ status: 'asc' }, { offerDate: 'desc' }]
    }),
    prisma.offerCards.count({ where: query }),
  ]);

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
            {currentUserRole === UserRole.ADMIN && (
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow" title="Filtrele">
                <Image src="/filter.png" alt="" width={14} height={14} />
              </button>
            )}
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow" title="Sırala">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
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