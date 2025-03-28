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

type InstitutionList = Institutions & { user: User[] } & {
  devices: Devices[];
} & { offercards: OfferCards[] } & { teamsMemebers: TeamsMembers[] } & {
  maintenanceCards: MaintenanceCards[];
} & { appointments: Appointments[] } & { cNotifications: Notifications[] } & {
  isgMembers: IsgMembers[];
};

const columns = [
  {
    header: "Kurum ID",
    accessor: "id",
    className: "hidden md:table-cell",
  },
  {
    header: "Kurum Adı",
    accessor: "instname",
    className: "hidden md:table-cell",
  },
  {
    header: "Kurum Adresi",
    accessor: "instaddress",
    className: "hidden md:table-cell",
  },
  {
    header: "Eylemler",
    accessor: "action",
    className: "hidden md:table-cell",
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

  const renderRow = (
    item: InstitutionList,
    userRole: UserRole,
    userInstitutionId: string | null | undefined
  ) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="hidden md:table-cell">{item.id}</td>
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
          {canViewInstitutions(userRole) && (
            <Link href={`/list/institutions/${item.id}`}>
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">
                <Image src="/view.png" alt="" width={24} height={24} />
              </button>
            </Link>
          )}
          {canDeleteInstitution(userRole, item.id, userInstitutionId) && (
            <FormModal table="institution" type="delete" id={item.id} />
          )}
        </div>
      </td>
    </tr>
  );

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
      include: {},
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.institutions.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex item-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          {currentUserRole === UserRole.ADMIN ? 'Tüm Kurumlar' : 'Kurumunuz'}
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
            {canCreateInstitution(currentUserRole) && (
              <FormModal table="institution" type="create" />
            )}
          </div>
        </div>
      </div>

      <div className="">
        <Table 
          columns={columns} 
          renderRow={(item) => renderRow(item, currentUserRole, currentUserInstitutionId)} 
          data={data} 
        />
      </div>

      <Pagination page={p} count={count} />
    </div>
  );
};

export default InstitutionListPage;