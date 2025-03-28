import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { Institutions, Prisma, User, UserRole } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";

type UserList = User & { 
  institution: Institutions | null 
};

const columns = [
  {
    header: "Kullanıcı ID",
    accessor: "id",
    className: "hidden md:table-cell",
  },
  {
    header: "Bilgi",
    accessor: "info",
  },
  {
    header: "Rolü",
    accessor: "roleId",
    className: "hidden md:table-cell",
  },
  {
    header: "Üyelik Tarihi",
    accessor: "registrationDate",
    className: "hidden md:table-cell",
  },
  {
    header: "Tel No",
    accessor: "phone",
    className: "hidden md:table-cell",
  },
  {
    header: "E-mail",
    accessor: "email",
    className: "hidden md:table-cell",
  },
  {
    header: "Eylemler",
    accessor: "action",
    className: "hidden md:table-cell",
  },
];

const canViewUsers = (userRole: UserRole) => {
  const authorizedRoles: Array<UserRole> = [
    UserRole.ADMIN,
    UserRole.MUSTERI_SEVIYE1,
    UserRole.MUSTERI_SEVIYE2,
    UserRole.HIZMETSAGLAYICI_SEVIYE1,
    UserRole.HIZMETSAGLAYICI_SEVIYE2
  ];
  return authorizedRoles.includes(userRole);
};

const canDeleteUser = (
  currentUserRole: UserRole, 
  targetUserInstitutionId: string | null | undefined, 
  currentUserInstitutionId: string | null | undefined
) => {
  if (currentUserRole === UserRole.ADMIN) return true;

  if (!targetUserInstitutionId || !currentUserInstitutionId) return false;

  if (
    (currentUserRole === UserRole.MUSTERI_SEVIYE1 || 
     currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1) &&
    currentUserInstitutionId === targetUserInstitutionId
  ) {
    return true;
  }

  return false;
};

const canCreateUser = (userRole: UserRole) => {
  const authorizedRoles: Array<UserRole> = [
    UserRole.ADMIN,
    UserRole.MUSTERI_SEVIYE1,
    UserRole.HIZMETSAGLAYICI_SEVIYE1
  ];
  return authorizedRoles.includes(userRole);
};

const UserListPage = async ({
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
    item: UserList,
    userRole: UserRole,
    userInstitutionId: string | null | undefined
  ) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="hidden md:table-cell">{item.id}</td>
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.photo || "/noAvatar.png"}
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">
            {item.institution ? item.institution.name : "Kurum Bilgisi Yok"}
          </p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        {item.role ? item.role : "Rol Bilgisi Yok"}
      </td>
      <td className="hidden md:table-cell">
        {item.registrationDate.toLocaleDateString()}
      </td>
      <td className="hidden md:table-cell">{item.phone}</td>
      <td className="hidden md:table-cell">{item.email}</td>
      <td>
        <div className="flex items-center gap-2">
          {canViewUsers(userRole) && (
            <Link href={`/list/users/${item.id}`}>
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">
                <Image src="/view.png" alt="" width={24} height={24} />
              </button>
            </Link>
          )}
          {canDeleteUser(userRole, item.institutionId, userInstitutionId) && (
            <FormModal table="user" type="delete" id={item.id} />
          )}
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.UserWhereInput = {};

  if (currentUserRole !== UserRole.ADMIN && currentUserInstitutionId) {
    query.institutionId = currentUserInstitutionId;
  }

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "institutionId":
            if (currentUserRole === UserRole.ADMIN) {
              const institutionId = value;
              if (institutionId) {
                query.institutionId = institutionId;
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
    prisma.user.findMany({
      where: query,
      include: {
        institution: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.user.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex item-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          {currentUserRole === UserRole.ADMIN ? 'Tüm Kullanıcılar' : 'Kurum Kullanıcıları'}
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
            {canCreateUser(currentUserRole) && (
              <FormModal table="user" type="create" />
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

export default UserListPage;