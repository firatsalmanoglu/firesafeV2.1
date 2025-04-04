import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import TableSort from "@/components/TableSort";
import TableFilter from "@/components/TableFilter";
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
import { FilterOption } from "@/components/TableFilter";

type InstitutionList = Institutions & { 
  user: User[];
  devices: Devices[];
  offercards: OfferCards[];
  teamsMemebers: TeamsMembers[];
  maintenanceCards: MaintenanceCards[];
  appointments: Appointments[];
  cNotifications: Notifications[];
  isgMembers: IsgMembers[];
  country?: { name: string; code?: string; id: string };
  city?: { name: string; id: string };
  district?: { name: string; id: string };
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

  // URL parametrelerini genişletilmiş şekilde al
  const { page, sort, order, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;
  
  // Varsayılan olarak isme göre artan sıralama
  const sortField = sort || 'name';
  const sortOrder = order || 'asc';

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
          case "countryId":
            if (currentUserRole === UserRole.ADMIN) {
              query.countryId = value;
            }
            break;
          case "cityId":
            if (currentUserRole === UserRole.ADMIN) {
              query.cityId = value;
            }
            break;
          case "districtId":
            if (currentUserRole === UserRole.ADMIN) {
              query.districtId = value;
            }
            break;
          case "search":
            query.OR = [
              { name: { contains: value, mode: "insensitive" } },
              { email: { contains: value, mode: "insensitive" } },
              { phone: { contains: value, mode: "insensitive" } },
              { address: { contains: value, mode: "insensitive" } }
            ];
            break;
          case "registrationDateFrom":
            // Kayıt tarihi için filtreleme
            if (query.registrationDate && typeof query.registrationDate === 'object') {
              const dateFilter = query.registrationDate as Prisma.DateTimeFilter<"Institutions">;
              dateFilter.gte = new Date(value);
            } else {
              query.registrationDate = {
                gte: new Date(value)
              };
            }
            break;
          case "registrationDateTo":
            if (query.registrationDate && typeof query.registrationDate === 'object') {
              const dateFilter = query.registrationDate as Prisma.DateTimeFilter<"Institutions">;
              dateFilter.lte = new Date(value);
            } else {
              query.registrationDate = {
                lte: new Date(value)
              };
            }
            break;
        }
      }
    }
  }

  // Admin için lokasyon verilerini getir (filtreleme için)
  let countries: { id: string; name: string }[] = [];
  let cities: { id: string; name: string }[] = [];
  let districts: { id: string; name: string }[] = [];

  if (currentUserRole === UserRole.ADMIN) {
    countries = await prisma.country.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });

    // Eğer ülke seçilmişse şehirleri getir
    if (queryParams.countryId) {
      cities = await prisma.city.findMany({
        where: { countryId: queryParams.countryId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      });
    }

    // Eğer şehir seçilmişse ilçeleri getir
    if (queryParams.cityId) {
      districts = await prisma.district.findMany({
        where: { cityId: queryParams.cityId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      });
    }
  }

  // Dinamik sıralama için orderBy nesnesini oluştur
  let orderBy: any = {};
  
  // Özel alanlar için sıralama mantığı
  if (sortField === 'country') {
    orderBy = {
      country: {
        name: sortOrder
      }
    };
  } else if (sortField === 'city') {
    orderBy = {
      city: {
        name: sortOrder
      }
    };
  } else {
    // Diğer alanlar için doğrudan sıralama
    orderBy[sortField] = sortOrder;
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
      orderBy: orderBy
    }),
    prisma.institutions.count({ where: query }),
  ]);

  // Sıralama seçenekleri
  const sortOptions: SortOption[] = [
    { label: "Kurum Adı (A-Z)", field: "name", order: "asc" },
    { label: "Kurum Adı (Z-A)", field: "name", order: "desc" },
    { label: "E-posta (A-Z)", field: "email", order: "asc" },
    { label: "E-posta (Z-A)", field: "email", order: "desc" },
    { label: "Kayıt Tarihi (Yeni-Eski)", field: "registrationDate", order: "desc" },
    { label: "Kayıt Tarihi (Eski-Yeni)", field: "registrationDate", order: "asc" },
    { label: "Ülke (A-Z)", field: "country", order: "asc" },
    { label: "Ülke (Z-A)", field: "country", order: "desc" },
    { label: "Şehir (A-Z)", field: "city", order: "asc" },
    { label: "Şehir (Z-A)", field: "city", order: "desc" }
  ];

  // Filtreleme seçenekleri - Institutions için özelleştirilmiş
  const filterOptions: FilterOption[] = [];
  
  if (currentUserRole === UserRole.ADMIN) {
    filterOptions.push({
      type: "select",
      label: "Ülke",
      field: "countryId",
      data: countries
    });

    if (queryParams.countryId && cities.length > 0) {
      filterOptions.push({
        type: "select",
        label: "Şehir",
        field: "cityId",
        data: cities
      });
    }

    if (queryParams.cityId && districts.length > 0) {
      filterOptions.push({
        type: "select",
        label: "İlçe",
        field: "districtId",
        data: districts
      });
    }

    filterOptions.push({
      type: "dateRange",
      label: "Kayıt Tarihi",
      fieldFrom: "registrationDateFrom",
      fieldTo: "registrationDateTo"
    });
  }

  const renderRow = (item: InstitutionList) => {
    // Veri dizisindeki indeksi bulma
    const index = data.findIndex(d => d.id === item.id);
    // Sayfa ve veri sayısına göre sıra numarası hesaplama
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

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex item-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold">
          {currentUserRole === UserRole.ADMIN ? 'Tüm Kurumlar' : 'Kurumunuz'}
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            {currentUserRole === UserRole.ADMIN && filterOptions.length > 0 && (
              <TableFilter options={filterOptions} />
            )}
            <TableSort options={sortOptions} />
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