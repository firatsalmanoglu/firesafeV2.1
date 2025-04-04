import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import TableSort from "@/components/TableSort";
import TableFilter from "@/components/TableFilter";
import prisma from "@/lib/prisma";
import { Actions, Logs, Prisma, Tables, User, UserRole } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@/auth";
import { FilterOption } from "@/components/TableFilter";

type Log = Logs & { user: User } & { action: Actions } & { table: Tables };

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
    header: "Tarih",
    accessor: "date",
  },
  {
    header: "Kullanıcı",
    accessor: "user",
  },
  {
    header: "İşlem",
    accessor: "action",
    className: "hidden md:table-cell",
  },
  {
    header: "Tablo",
    accessor: "table",
    className: "hidden md:table-cell",
  },
  {
    header: "IP",
    accessor: "IP",
    className: "hidden md:table-cell",
  },
  {
    header: "Eylemler",
    accessor: "actions",
  }
];

const LogListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  // Sadece admin erişebilmeli
  const session = await auth();
  const currentUserRole = session?.user?.role as UserRole;

  // URL parametrelerini genişletilmiş şekilde al
  const { page, sort, order, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;
  
  // Varsayılan olarak tarihe göre azalan sıralama
  const sortField = sort || 'date';
  const sortOrder = order || 'desc';

  // URL PARAMS CONDITION
  const query: Prisma.LogsWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "userId":
            query.userId = value;
            break;
          case "actionId":
            query.actionId = value;
            break;
          case "tableId":
            query.tableId = value;
            break;
          case "ip":
            query.IP = { contains: value, mode: "insensitive" };
            break;
          case "search":
            query.OR = [
              { user: { name: { contains: value, mode: "insensitive" } } },
              { action: { name: { contains: value, mode: "insensitive" } } },
              { table: { name: { contains: value, mode: "insensitive" } } },
              { IP: { contains: value, mode: "insensitive" } }
            ];
            break;
          case "dateFrom":
            // Log tarihi için filtreleme
            if (query.date && typeof query.date === 'object') {
              const dateFilter = query.date as Prisma.DateTimeFilter<"Logs">;
              dateFilter.gte = new Date(value);
            } else {
              query.date = {
                gte: new Date(value)
              };
            }
            break;
          case "dateTo":
            if (query.date && typeof query.date === 'object') {
              const dateFilter = query.date as Prisma.DateTimeFilter<"Logs">;
              dateFilter.lte = new Date(value);
            } else {
              query.date = {
                lte: new Date(value)
              };
            }
            break;
        }
      }
    }
  }

  // Gerekli filtreleme seçenekleri için verileri getir
  const users = await prisma.user.findMany({
    where: { name: { not: null } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  const actions = await prisma.actions.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  const tables = await prisma.tables.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  // Dinamik sıralama için orderBy nesnesini oluştur
  let orderBy: any = {};
  
  // Özel alanlar için sıralama mantığı
  if (sortField === 'user') {
    orderBy = {
      user: {
        name: sortOrder
      }
    };
  } else if (sortField === 'action') {
    orderBy = {
      action: {
        name: sortOrder
      }
    };
  } else if (sortField === 'table') {
    orderBy = {
      table: {
        name: sortOrder
      }
    };
  } else {
    // Diğer alanlar için doğrudan sıralama
    orderBy[sortField] = sortOrder;
  }

  const [data, count] = await prisma.$transaction([
    prisma.logs.findMany({
      where: query,
      include: {
        user: true,
        action: true,
        table: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: orderBy
    }),
    prisma.logs.count({ where: query }),
  ]);

  // Sıralama seçenekleri
  const sortOptions: SortOption[] = [
    { label: "Tarih (Yeni-Eski)", field: "date", order: "desc" },
    { label: "Tarih (Eski-Yeni)", field: "date", order: "asc" },
    { label: "Kullanıcı (A-Z)", field: "user", order: "asc" },
    { label: "Kullanıcı (Z-A)", field: "user", order: "desc" },
    { label: "İşlem (A-Z)", field: "action", order: "asc" },
    { label: "İşlem (Z-A)", field: "action", order: "desc" },
    { label: "Tablo (A-Z)", field: "table", order: "asc" },
    { label: "Tablo (Z-A)", field: "table", order: "desc" },
    { label: "IP (A-Z)", field: "IP", order: "asc" },
    { label: "IP (Z-A)", field: "IP", order: "desc" }
  ];

  // Filtreleme seçenekleri
  const filterOptions: FilterOption[] = [];

  // Kullanıcılar null olabilir, güvenlik için kontrol
  const validUsers = users
    .filter(u => u.name !== null)
    .map(u => ({ id: u.id, name: u.name as string }));

  if (validUsers.length > 0) {
    filterOptions.push({
      type: "select",
      label: "Kullanıcı",
      field: "userId",
      data: validUsers
    });
  }

  // İşlem türü ve tablo filtreleri
  filterOptions.push({
    type: "select",
    label: "İşlem Türü",
    field: "actionId",
    data: actions
  });

  filterOptions.push({
    type: "select",
    label: "Tablo",
    field: "tableId",
    data: tables
  });

  // IP filtresi
  filterOptions.push({
    type: "status",
    label: "IP Adresi",
    field: "ip",
    options: [
      ...Array.from(new Set(data.map(log => log.IP)))
        .map(ip => ({ value: ip, label: ip }))
    ]
  });

  // Tarih aralığı filtresi
  filterOptions.push({
    type: "dateRange",
    label: "İşlem Tarihi",
    fieldFrom: "dateFrom",
    fieldTo: "dateTo"
  });

  const renderRow = (item: Log) => {
    // Veri dizisindeki indeksi bulma
    const index = data.findIndex(d => d.id === item.id);
    // Sayfa ve veri sayısına göre sıra numarası hesaplama
    const rowNumber = (p - 1) * ITEM_PER_PAGE + index + 1;
    
    // Tarih ve saati formatlama
    const formatDateTime = (date: Date) => {
      return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    };
    
    // İşlem türüne göre renk belirleme
    const getActionClass = (actionName: string) => {
      if (actionName.includes('ekle') || actionName.includes('oluştur')) 
        return 'bg-green-100 text-green-800';
      if (actionName.includes('sil')) 
        return 'bg-red-100 text-red-800';
      if (actionName.includes('güncelle') || actionName.includes('düzenle')) 
        return 'bg-yellow-100 text-yellow-800';
      return 'bg-blue-100 text-blue-800';
    };
    
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-4">{rowNumber}</td>
        <td className="p-4">
          <div className="flex flex-col">
            <span className="font-medium">{formatDateTime(item.date)}</span>
          </div>
        </td>
        <td className="p-4">
          <div className="flex flex-col">
            <span className="font-medium">{item.user.name || 'Bilinmiyor'}</span>
            <span className="text-xs text-gray-500 md:hidden">{item.action.name}</span>
          </div>
        </td>
        <td className="hidden md:table-cell p-4">
          <span className={`px-2 py-1 rounded-full text-xs ${getActionClass(item.action.name)}`}>
            {item.action.name}
          </span>
        </td>
        <td className="hidden md:table-cell p-4">{item.table.name}</td>
        <td className="hidden md:table-cell p-4">{item.IP}</td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <Link href={`/list/logs/${item.id}`}>
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple" title="Detaylar">
                <Image src="/view.png" alt="" width={24} height={24} />
              </button>
            </Link>
          </div>
        </td>
      </tr>
    );
  };

  // Eğer admin değilse erişimi engelle
  if (currentUserRole !== UserRole.ADMIN) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Erişim Engellendi</h2>
          <p className="text-gray-600">Bu sayfayı görüntülemek için yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex item-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold">Tüm Loglar</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <TableFilter options={filterOptions} />
            <TableSort options={sortOptions} />
          </div>
        </div>
      </div>

      {/* LIST */}
      <div className="overflow-x-auto">
        <Table columns={columns} renderRow={renderRow} data={data} />
      </div>

      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default LogListPage;