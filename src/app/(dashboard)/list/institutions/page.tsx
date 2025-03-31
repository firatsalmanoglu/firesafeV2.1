import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@/auth";
import {
  Institutions,
  Notifications,
  TeamsMembers,
  MaintenanceCards,
  Appointments,
  IsgMembers,
  OfferCards,
  Devices,
  Prisma,
  User,
  UserRole,
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

type InstitutionList = Institutions & { 
  user: User[];
  devices: Devices[];
  offercards: OfferCards[];
  teamsMemebers: TeamsMembers[];
  maintenanceCards: MaintenanceCards[];
  appointments: Appointments[];
  cNotifications: Notifications[];
  isgMembers: IsgMembers[];
  country?: { name: string; code?: string };
  city?: { name: string };
  district?: { name: string };
};

const columns = [
  {
    header: "No",
    accessor: "rowNumber",
  },
  {
    header: "Kurum Adı",
    accessor: "name",
  },
  {
    header: "İletişim",
    accessor: "contact",
    className: "hidden md:table-cell",
  },
  {
    header: "Konum",
    accessor: "location",
    className: "hidden md:table-cell",
  },
  {
    header: "Eylemler",
    accessor: "action",
  },
];

const canViewInstitutions = (userRole: UserRole) => {
  const authorizedRoles: Array<UserRole> = [
    UserRole.ADMIN,
    UserRole.MUSTERI_SEVIYE1,
    UserRole.MUSTERI_SEVIYE2,
    UserRole.HIZMETSAGLAYICI_SEVIYE1,
    UserRole.HIZMETSAGLAYICI_SEVIYE2
  ];
  return authorizedRoles.includes(userRole);
};

const canDeleteInstitution = (
  currentUserRole: UserRole, 
  targetInstitutionId: string,
  currentUserInstitutionId: string | null | undefined
) => {
  if (currentUserRole === UserRole.ADMIN) return true;

  if (!currentUserInstitutionId) return false;

  if (
    (currentUserRole === UserRole.MUSTERI_SEVIYE1 || 
     currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1) &&
    currentUserInstitutionId === targetInstitutionId
  ) {
    return true;
  }

  return false;
};

const canCreateInstitution = (userRole: UserRole) => {
  const authorizedRoles: Array<UserRole> = [
    UserRole.ADMIN,
    UserRole.MUSTERI_SEVIYE1,
    UserRole.HIZMETSAGLAYICI_SEVIYE1
  ];
  return authorizedRoles.includes(userRole);
};

const InstitutionListPage = async ({
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

  const renderRow = (item: InstitutionList) => {
    // Veri dizisindeki indeksi bulma
    const index = data.findIndex(d => d.id === item.id);
    // Sayfa ve veri sayısına göre sıra numarası hesaplama
    const { page } = searchParams;
    const p = page ? parseInt(page) : 1;
    const rowNumber = (p - 1) * ITEM_PER_PAGE + index + 1;
    
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-4">{rowNumber}</td>
        <td className="p-4">
          <div className="flex flex-col">
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-xs text-gray-500">{item.registrationDate ? new Date(item.registrationDate).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}</p>
          </div>
        </td>
        <td className="hidden md:table-cell p-4">
          <div className="flex flex-col">
            <p className="text-sm">{item.email}</p>
            <p className="text-xs text-gray-500">{item.phone}</p>
          </div>
        </td>
        <td className="hidden md:table-cell p-4">
          <div className="flex flex-col">
            <p className="text-sm">{item.country?.name || 'Belirtilmemiş'}</p>
            <p className="text-xs text-gray-500">
              {item.city?.name}{item.district?.name ? `, ${item.district.name}` : ''}
            </p>
          </div>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            {canViewInstitutions(currentUserRole) && (
              <Link href={`/list/institutions/${item.id}`}>
                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple" title="Görüntüle">
                  <Image src="/view.png" alt="" width={24} height={24} />
                </button>
              </Link>
            )}
            {canDeleteInstitution(currentUserRole, item.id, currentUserInstitutionId) && (
              <FormModal table="institution" type="delete" id={item.id} />
            )}
          </div>
        </td>
      </tr>
    );
  };

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.InstitutionsWhereInput = {};

  // ADMIN değilse sadece kendi kurumunu görebilir
  if (currentUserRole !== UserRole.ADMIN && currentUserInstitutionId) {
    query.id = currentUserInstitutionId;
  }

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "id":
            // ADMIN değilse kurum filtresini değiştirmeye izin verme
            if (currentUserRole === UserRole.ADMIN) {
              const id = value;
              if (id) {
                query.id = id;
              }
            }
            break;
          case "search":
            query.name = { contains: value, mode: "insensitive" };
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.institutions.findMany({
      where: query,
      include: {
        country: true,
        city: true,
        district: true
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.institutions.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex item-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold">
          {currentUserRole === UserRole.ADMIN ? 'Tüm Kurumlar' : 'Kurumunuz'}
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
            {canCreateInstitution(currentUserRole) && (
              <FormModal table="institution" type="create" />
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

export default InstitutionListPage;