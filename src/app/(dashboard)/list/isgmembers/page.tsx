import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { 
  IsgMembers, 
  Prisma, 
  Institutions, 
  Devices,
  UserRole 
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";

type IsgMemberList = IsgMembers & { institution: Institutions } & {
  device: Devices[];
};

const columns = [
  {
    header: "No",
    accessor: "rowNumber",
  },
  {
    header: "ISG Numarası",
    accessor: "isgNumber",
  },
  {
    header: "Adı-Soyadı",
    accessor: "name",
  },
  {
    header: "Kurum",
    accessor: "institution",
    className: "hidden md:table-cell",
  },
  {
    header: "Kontrat Tarihi",
    accessor: "contractDate",
    className: "hidden md:table-cell",
  },
  {
    header: "Eylemler",
    accessor: "action",
  },
];

const isAuthorized = (userRole: UserRole) => {
  const authorizedRoles: Array<UserRole> = [
    UserRole.ADMIN,
    UserRole.HIZMETSAGLAYICI_SEVIYE2
  ];
  return authorizedRoles.includes(userRole);
};

const IsgMemberListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const session = await auth();
  const currentUserRole = session?.user?.role as UserRole;

  const renderRow = (item: IsgMemberList) => {
    // Veri dizisindeki indeksi bulma
    const index = data.findIndex(d => d.id === item.id);
    // Sayfa ve veri sayısına göre sıra numarası hesaplama
    const { page } = searchParams;
    const p = page ? parseInt(page) : 1;
    const rowNumber = (p - 1) * ITEM_PER_PAGE + index + 1;
    
    // Tarih formatını düzenle
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };
    
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-4">{rowNumber}</td>
        <td className="p-4">
          <span className="font-medium">{item.isgNumber}</span>
        </td>
        <td className="p-4">
          <div className="flex flex-col">
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-xs text-gray-500 md:hidden">{item.institution.name}</p>
          </div>
        </td>
        <td className="hidden md:table-cell p-4">{item.institution.name}</td>
        <td className="hidden md:table-cell p-4">
          {formatDate(item.contractDate)}
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <Link href={`/list/isgmembers/${item.id}`}>
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple" title="Görüntüle">
                <Image src="/view.png" alt="" width={24} height={24} />
              </button>
            </Link>
            {isAuthorized(currentUserRole) && (
              <FormModal table="isgmember" type="delete" id={item.id} />
            )}
          </div>
        </td>
      </tr>
    );
  };

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.IsgMembersWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "isgNumber":
            const isgNumber = value;
            if (isgNumber) {
              query.isgNumber = isgNumber;
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
    prisma.isgMembers.findMany({
      where: query,
      include: {
        institution: true,
        Devices: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.isgMembers.count(),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex item-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold">
          Tüm ISG Sorumluları
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow" title="Filtrele">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow" title="Sırala">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {isAuthorized(currentUserRole) && (
              <FormModal table="isgmember" type="create" />
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

export default IsgMemberListPage;