import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { Actions, Logs, Prisma, Tables, User } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";

type Log = Logs & { user: User } & { action: Actions } & { table: Tables };

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
  }
];

const LogListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.LogsWhereInput = {};

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
            query.OR = [
              { user: { name: { contains: value, mode: "insensitive" } } },
              { action: { name: { contains: value, mode: "insensitive" } } },
              { table: { name: { contains: value, mode: "insensitive" } } },
            ];
            break;
        }
      }
    }
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
      orderBy: { date: 'desc' }
    }),
    prisma.logs.count({ where: query }),
  ]);

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
          <span className={`px-2 py-1 rounded-full text-xs ${
            item.action.name.includes('ekle') ? 'bg-green-100 text-green-800' : 
            item.action.name.includes('sil') ? 'bg-red-100 text-red-800' : 
            'bg-blue-100 text-blue-800'
          }`}>
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

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex item-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold">Tüm Loglar</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow" title="Filtrele">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow" title="Sırala">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
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