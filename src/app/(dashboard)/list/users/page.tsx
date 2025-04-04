import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import TableSort from "@/components/TableSort";
import TableFilter from "@/components/TableFilter";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { Institutions, Prisma, User, UserRole } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { FilterOption } from "@/components/TableFilter";

type UserList = User & { 
  institution: Institutions | null 
};

// TableSort bileşeninin beklediği SortOption tipi ile uyumlu olacak şekilde tanımlandı
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
    header: "Kullanıcı",
    accessor: "user",
  },
  {
    header: "İletişim",
    accessor: "contact",
    className: "hidden md:table-cell",
  },
  {
    header: "Rolü",
    accessor: "role",
    className: "hidden md:table-cell",
  },
  {
    header: "Üyelik Tarihi",
    accessor: "registrationDate",
    className: "hidden md:table-cell",
  },
  {
    header: "Eylemler",
    accessor: "action",
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

  // URL parametrelerini genişletilmiş şekilde al
  const { page, sort, order, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;
  
  // Varsayılan olarak isme göre artan sıralama
  const sortField = sort || 'name';
  const sortOrder = order || 'asc';

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
          case "role":
            // Rol bazlı filtreleme eklendi
            query.role = value as UserRole;
            break;
          case "search":
            query.OR = [
              { name: { contains: value, mode: "insensitive" } },
              { email: { contains: value, mode: "insensitive" } },
              { phone: { contains: value, mode: "insensitive" } },
              // Kurum adı araması eklendi
              {
                institution: {
                  name: { contains: value, mode: "insensitive" }
                }
              }
            ];
            break;
          case "registrationDateFrom":
            // Tarih aralığı filtrelemesi için güvenli dönüşüm
            if (query.registrationDate && typeof query.registrationDate === 'object') {
              // Tip dönüşümü
              const dateFilter = query.registrationDate as Prisma.DateTimeFilter<"User">;
              dateFilter.gte = new Date(value);
            } else {
              // Yeni filtre
              query.registrationDate = {
                gte: new Date(value)
              };
            }
            break;
          case "registrationDateTo":
            if (query.registrationDate && typeof query.registrationDate === 'object') {
              // Tip dönüşümü
              const dateFilter = query.registrationDate as Prisma.DateTimeFilter<"User">;
              dateFilter.lte = new Date(value);
            } else {
              // Yeni filtre
              query.registrationDate = {
                lte: new Date(value)
              };
            }
            break;
        }
      }
    }
  }

  // Admin için kurumlar listesini getir
  const institutions = currentUserRole === UserRole.ADMIN
    ? await prisma.institutions.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      })
    : [];

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
    prisma.user.findMany({
      where: query,
      include: {
        institution: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: orderBy
    }),
    prisma.user.count({ where: query }),
  ]);

  // Sıralama seçenekleri - order tipi açıkça "asc" | "desc" olarak belirleniyor
  const sortOptions: SortOption[] = [
    { label: "Ad (A-Z)", field: "name", order: "asc" },
    { label: "Ad (Z-A)", field: "name", order: "desc" },
    { label: "E-posta (A-Z)", field: "email", order: "asc" },
    { label: "E-posta (Z-A)", field: "email", order: "desc" },
    { label: "Rol (A-Z)", field: "role", order: "asc" },
    { label: "Rol (Z-A)", field: "role", order: "desc" },
    { label: "Üyelik Tarihi (Yeni-Eski)", field: "registrationDate", order: "desc" },
    { label: "Üyelik Tarihi (Eski-Yeni)", field: "registrationDate", order: "asc" },
    { label: "Kurum (A-Z)", field: "institution", order: "asc" },
    { label: "Kurum (Z-A)", field: "institution", order: "desc" },
  ];

  // Filtreleme seçenekleri - User tablosu için özelleştirilmiş
  const filterOptions: FilterOption[] = [
    {
      type: "select",
      label: "Kurum",
      field: "institutionId",
      data: institutions
    },
    {
      type: "status",
      label: "Kullanıcı Rolü",
      field: "role",
      options: [
        { value: "ADMIN", label: "Yönetici" },
        { value: "MUSTERI_SEVIYE1", label: "Müşteri Yöneticisi" },
        { value: "MUSTERI_SEVIYE2", label: "Müşteri Kullanıcısı" },
        { value: "HIZMETSAGLAYICI_SEVIYE1", label: "Hizmet Sağlayıcı Yöneticisi" },
        { value: "HIZMETSAGLAYICI_SEVIYE2", label: "Hizmet Sağlayıcı Kullanıcısı" },
        { value: "GUEST", label: "Misafir" },
        { value: "USER", label: "Kullanıcı" }
      ]
    },
    {
      type: "dateRange",
      label: "Üyelik Tarihi",
      fieldFrom: "registrationDateFrom",
      fieldTo: "registrationDateTo"
    }
  ];

  const renderRow = (item: UserList) => {
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
    
    // Kullanıcı rolünü daha okunabilir hale getirme
    const formatRole = (role: UserRole) => {
      switch (role) {
        case 'ADMIN':
          return 'Yönetici';
        case 'MUSTERI_SEVIYE1':
          return 'Müşteri Yöneticisi';
        case 'MUSTERI_SEVIYE2':
          return 'Müşteri Kullanıcısı';
        case 'HIZMETSAGLAYICI_SEVIYE1':
          return 'Hizmet Sağlayıcı Yöneticisi';
        case 'HIZMETSAGLAYICI_SEVIYE2':
          return 'Hizmet Sağlayıcı Kullanıcısı';
        case 'GUEST':
          return 'Misafir';
        case 'USER':
          return 'Kullanıcı';
        default:
          return role;
      }
    };
    
    // Rolün rengini belirleme
    const getRoleClass = (role: UserRole) => {
      switch (role) {
        case 'ADMIN':
          return 'bg-purple-100 text-purple-800';
        case 'MUSTERI_SEVIYE1':
          return 'bg-blue-100 text-blue-800';
        case 'MUSTERI_SEVIYE2':
          return 'bg-blue-50 text-blue-600';
        case 'HIZMETSAGLAYICI_SEVIYE1':
          return 'bg-green-100 text-green-800';
        case 'HIZMETSAGLAYICI_SEVIYE2':
          return 'bg-green-50 text-green-600';
        case 'GUEST':
          return 'bg-gray-100 text-gray-800';
        case 'USER':
          return 'bg-gray-100 text-gray-800';
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
          <div className="flex items-center gap-3">
            <Image
              src={item.photo || "/noAvatar.png"}
              alt=""
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex flex-col">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-xs text-gray-500">
                {item.institution ? item.institution.name : "Kurum Bilgisi Yok"}
              </p>
            </div>
          </div>
        </td>
        <td className="hidden md:table-cell p-4">
          <div className="flex flex-col">
            <p className="text-sm">{item.email}</p>
            <p className="text-xs text-gray-500">{item.phone || "Telefon Bilgisi Yok"}</p>
          </div>
        </td>
        <td className="hidden md:table-cell p-4">
          <span className={`px-2 py-1 rounded-full text-xs ${getRoleClass(item.role)}`}>
            {formatRole(item.role)}
          </span>
        </td>
        <td className="hidden md:table-cell p-4">{formatDate(item.registrationDate)}</td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            {canViewUsers(currentUserRole) && (
              <Link href={`/list/users/${item.id}`}>
                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple" title="Görüntüle">
                  <Image src="/view.png" alt="" width={24} height={24} />
                </button>
              </Link>
            )}
            {canDeleteUser(currentUserRole, item.institutionId, currentUserInstitutionId) && (
              <FormModal table="user" type="delete" id={item.id} />
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
          {currentUserRole === UserRole.ADMIN ? 'Tüm Kullanıcılar' : 'Kurum Kullanıcıları'}
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            {currentUserRole === UserRole.ADMIN && (
              <TableFilter options={filterOptions} />
            )}
            <TableSort options={sortOptions} />
            {canCreateUser(currentUserRole) && (
              <FormModal table="user" type="create" />
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

export default UserListPage;