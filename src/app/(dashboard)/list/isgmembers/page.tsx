import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import TableSort from "@/components/TableSort";
import TableFilter from "@/components/TableFilter";
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
import { ITEM_PER_PAGE } from "@/lib/settings";
import { FilterOption } from "@/components/TableFilter";

type IsgMemberList = IsgMembers & { institution: Institutions } & {
  Devices: Devices[];
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
  
  // URL parametrelerini genişletilmiş şekilde al
  const { page, sort, order, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;
  
  // Varsayılan olarak isme göre artan sıralama
  const sortField = sort || 'name';
  const sortOrder = order || 'asc';

  const query: Prisma.IsgMembersWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "isgNumber":
            query.isgNumber = { contains: value, mode: "insensitive" };
            break;
          case "institutionId":
            query.institutionId = value;
            break;
          case "search":
            query.OR = [
              { name: { contains: value, mode: "insensitive" } },
              { isgNumber: { contains: value, mode: "insensitive" } },
              {
                institution: {
                  name: { contains: value, mode: "insensitive" }
                }
              }
            ];
            break;
          case "contractDateFrom":
            // Kontrat tarihi için filtreleme
            if (query.contractDate && typeof query.contractDate === 'object') {
              const dateFilter = query.contractDate as Prisma.DateTimeFilter<"IsgMembers">;
              dateFilter.gte = new Date(value);
            } else {
              query.contractDate = {
                gte: new Date(value)
              };
            }
            break;
          case "contractDateTo":
            if (query.contractDate && typeof query.contractDate === 'object') {
              const dateFilter = query.contractDate as Prisma.DateTimeFilter<"IsgMembers">;
              dateFilter.lte = new Date(value);
            } else {
              query.contractDate = {
                lte: new Date(value)
              };
            }
            break;
        }
      }
    }
  }
  
  // Tüm kurumları getir (filtreleme için)
  const institutions = await prisma.institutions.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  // Dinamik sıralama için orderBy nesnesini oluştur
  let orderBy: any = {};
  
  // Özel alanlar için sıralama mantığı
  if (sortField === 'institution') {
    orderBy = {
      institution: {
        name: sortOrder
      }
    };
  } else {
    // Diğer alanlar için doğrudan sıralama
    orderBy[sortField] = sortOrder;
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
      orderBy: orderBy
    }),
    prisma.isgMembers.count({ where: query }),
  ]);

  // Sıralama seçenekleri
  const sortOptions: SortOption[] = [
    { label: "Ad (A-Z)", field: "name", order: "asc" },
    { label: "Ad (Z-A)", field: "name", order: "desc" },
    { label: "ISG Numarası (A-Z)", field: "isgNumber", order: "asc" },
    { label: "ISG Numarası (Z-A)", field: "isgNumber", order: "desc" },
    { label: "Kontrat Tarihi (Yeni-Eski)", field: "contractDate", order: "desc" },
    { label: "Kontrat Tarihi (Eski-Yeni)", field: "contractDate", order: "asc" },
    { label: "Kurum (A-Z)", field: "institution", order: "asc" },
    { label: "Kurum (Z-A)", field: "institution", order: "desc" },
  ];

  // Filtreleme seçenekleri - ISG Members için özelleştirilmiş
  const filterOptions: FilterOption[] = [
    { 
      type: "select",
      label: "Kurum", 
      field: "institutionId", 
      data: institutions 
    },
    { 
      type: "dateRange",
      label: "Kontrat Tarihi", 
      fieldFrom: "contractDateFrom", 
      fieldTo: "contractDateTo" 
    }
  ];

  const renderRow = (item: IsgMemberList) => {
    // Veri dizisindeki indeksi bulma
    const index = data.findIndex(d => d.id === item.id);
    // Sayfa ve veri sayısına göre sıra numarası hesaplama
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
            {isAuthorized(currentUserRole) && (
              <FormModal table="isgmember" type="delete" id={item.id} />
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
          Tüm ISG Sorumluları
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <TableFilter options={filterOptions} />
            <TableSort options={sortOptions} />
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