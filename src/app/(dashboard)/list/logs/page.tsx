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
    header: "Log ID",
    accessor: "id",
    className: "hidden md:table-cell",
  },

  {
    header: "Log Tarihi",
    accessor: "date",
    className: "hidden md:table-cell",
  },

  {
    header: "Kullanıcı ID",
    accessor: "userId",
    className: "hidden md:table-cell",
  },

  {
    header: "İşlem",
    accessor: "actionId",
    className: "hidden md:table-cell",
  },

  {
    header: "Tablo Adı",
    accessor: "tableId",
    className: "hidden md:table-cell",
  },

  {
    header: "IP",
    accessor: "IP",
    className: "hidden md:table-cell",
  },
];

const renderRow = (item: Log) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
  >
    <td className="hidden md:table-cell">{item.id}</td>

    <td className="hidden md:table-cell">{item.date.toLocaleDateString()}</td>
    <td className="hidden md:table-cell">{item.user.name}</td>
    <td className="hidden md:table-cell">{item.action.name}</td>
    <td className="hidden md:table-cell">{item.table.name}</td>
    <td className="hidden md:table-cell">{item.IP}</td>

    <td>
      <div className="flex items-center gap-2">
        <Link href={`/list/logs/${item.id}`}>
          {/* ISG member Detayı için sayfa yapılmadı, detay butonu inaktif yapıldı */}
          {/* <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">
            <Image src="/view.png" alt="" width={24} height={24} />
          </button> */}
        </Link>
      </div>
    </td>
  </tr>
);

const LogListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  //URL PARAMS CONDITION

  const query: Prisma.LogsWhereInput = {}; // Prisma için boş bir query nesnesi oluşturuluyor.

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "id":
            const id = value; // value'yu tam sayıya çeviriyoruz.
            if (id) {
              // geçerli bir sayı olup olmadığını kontrol ediyoruz.
              // Users tablosundaki roleId'ye göre filtreleme yapıyoruz.
              query.id = id;
            }
            break;
          // Diğer case'ler eklenebilir. Örneğin, daha fazla filtrasyon yapılmak istenirse.
          // case "search":
          // query.userId = {contains:value, mode: "insensitive"}
          // break;
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
    }),
    prisma.logs.count(),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex item-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Tüm Loglar</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>

            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
          </div>
        </div>
      </div>

      {/* LIST */}
      <div className="">
        <Table columns={columns} renderRow={renderRow} data={data} />
      </div>

      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default LogListPage;
