import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
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
  UserRole
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

type OfferRequestList = OfferRequests & {
  creatorIns: Institutions
} & {
  creator: User
} & {
  RequestSub: (RequestSub & {
    service: Services
  })[];
};

const columns = [
  {
    header: "Talep ID",
    accessor: "id",
    className: "hidden md:table-cell",
  },
  {
    header: "Kurum Adı",
    accessor: "creatorInsId",
    className: "hidden md:table-cell",
  },
  {
    header: "Durum",
    accessor: "status",
    className: "hidden md:table-cell",
  },
  {
    header: "Eylemler",
    accessor: "action",
    className: "hidden md:table-cell",
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

  const currentUserId = currentUser?.id; // Bu satırı ekledik


  const currentUserInstitutionId = currentUser?.institutionId;

  const renderRow = (item: OfferRequestList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="hidden md:table-cell">{item.id}</td>
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.creatorIns.name}</h3>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.status}</td>
      <td>
        <div className="flex items-center gap-2">
          {canViewOfferRequests(currentUserRole, item.creatorInsId, currentUserInstitutionId) && (
            <Link href={`/list/offerRequests/${item.id}`}>
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">
                <Image src="/view.png" alt="" width={24} height={24} />
              </button>
            </Link>
          )}

          {canCreateOffer(currentUserRole) && (
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
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaYellow">
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

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

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
          case "search":
            query.creatorId = { contains: value, mode: "insensitive" };
            break;
        }
      }
    }
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
    }),
    prisma.offerRequests.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex item-center justify-between">
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
            {currentUserRole === UserRole.ADMIN && (
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                <Image src="/filter.png" alt="" width={14} height={14} />
              </button>
            )}
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {canCreateOfferRequest(currentUserRole) && (
              <FormModal
                table="offerRequest"
                type="create"
                currentUserRole={currentUserRole}
                currentUserId={currentUserId || ''}  // currentUserId'yi ekledik
              />
            )}
          </div>
        </div>
      </div>

      <div className="">
        <Table columns={columns} renderRow={renderRow} data={data} />
      </div>

      <Pagination page={p} count={count} />
    </div>
  );
};

export default OfferRequestListPage;