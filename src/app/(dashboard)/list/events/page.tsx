import { auth } from "@/auth";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import {
  Appointments,
  Institutions,
  User,
  Prisma,
  UserRole
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

type EventList = Appointments & { creator: User } & {
  creatorIns: Institutions;
} & { recipient: User } & { recipientIns: Institutions };

const columns = [
  {
    header: "Randevu ID",
    accessor: "id",
    className: "hidden md:table-cell",
  },
  {
    header: "Oluşturan Kullanıcı",
    accessor: "info",
  },
  {
    header: "Oluşturma Tarihi",
    accessor: "create",
    className: "hidden md:table-cell",
  },
  {
    header: "İlgili Kullanıcı",
    accessor: "info",
  },
  {
    header: "Başlangıç Tarihi",
    accessor: "start",
    className: "hidden md:table-cell",
  },
  {
    header: "Bitiş Tarihi",
    accessor: "end",
    className: "hidden md:table-cell",
  },
  {
    header: "Eylemler",
    accessor: "action",
    className: "hidden md:table-cell",
  },
];

const canViewAppointment = (
  userRole: UserRole,
  appointmentCreatorId: string,
  appointmentCreatorInsId: string,
  appointmentRecipientId: string,
  appointmentRecipientInsId: string,
  currentUserId: string | null | undefined,
  currentUserInstitutionId: string | null | undefined
) => {
  if (userRole === UserRole.ADMIN) return true;

  if (!currentUserId || !currentUserInstitutionId) return false;

  // MUSTERI_SEVIYE2 sadece kendisine ait randevuları görür
  if (
    userRole === UserRole.MUSTERI_SEVIYE2 &&
    currentUserId === appointmentRecipientId
  ) return true;

  // MUSTERI_SEVIYE1 kendi kurumuna ait tüm randevuları görür
  if (
    userRole === UserRole.MUSTERI_SEVIYE1 &&
    currentUserInstitutionId === appointmentRecipientInsId
  ) return true;

  // HIZMETSAGLAYICI_SEVIYE2 kendisinin oluşturduğu randevuları görür
  if (
    userRole === UserRole.HIZMETSAGLAYICI_SEVIYE2 &&
    currentUserId === appointmentCreatorId
  ) return true;

  // HIZMETSAGLAYICI_SEVIYE1 kurumunun oluşturduğu tüm randevuları görür
  if (
    userRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 &&
    currentUserInstitutionId === appointmentCreatorInsId
  ) return true;

  return false;
};

const canManageAppointment = (
  userRole: UserRole,
  appointmentCreatorId: string,
  appointmentCreatorInsId: string,
  currentUserId: string | null | undefined,
  currentUserInstitutionId: string | null | undefined
) => {
  if (userRole === UserRole.ADMIN) return true;

  if (!currentUserId || !currentUserInstitutionId) return false;

  // HIZMETSAGLAYICI_SEVIYE2 kendisinin oluşturduğu randevuları yönetebilir
  if (
    userRole === UserRole.HIZMETSAGLAYICI_SEVIYE2 &&
    currentUserId === appointmentCreatorId
  ) return true;

  // HIZMETSAGLAYICI_SEVIYE1 kurumunun oluşturduğu tüm randevuları yönetebilir
  if (
    userRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 &&
    currentUserInstitutionId === appointmentCreatorInsId
  ) return true;

  return false;
};

const canCreateAppointment = (userRole: UserRole) => {
  const authorizedRoles: Array<UserRole> = [
    UserRole.ADMIN,
    UserRole.HIZMETSAGLAYICI_SEVIYE1,
    UserRole.HIZMETSAGLAYICI_SEVIYE2
  ];
  return authorizedRoles.includes(userRole);
};

const EventListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const session = await auth();
  const currentUserRole = session?.user?.role as UserRole;

  const currentUser = session?.user?.email ? await prisma.user.findUnique({
    where: { email: session.user.email }
  }) : null;

  const currentUserId = currentUser?.id;
  const currentUserInstitutionId = currentUser?.institutionId;

  const renderRow = (
    item: EventList,
    userRole: UserRole,
    userId: string | null | undefined,
    userInstitutionId: string | null | undefined
  ) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="hidden md:table-cell">{item.id}</td>
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">
            {item.creator.name}
          </h3>
          <p className="text-xs text-gray-500">{item.creatorIns.name}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.create.toLocaleDateString()}</td>
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">
            {item.recipient.name}
          </h3>
          <p className="text-xs text-gray-500">{item.recipientIns.name}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.start.toLocaleDateString()}</td>
      <td className="hidden md:table-cell">{item.end.toLocaleDateString()}</td>
      <td>
        <div className="flex items-center gap-2">
          {canViewAppointment(
            userRole,
            item.creatorId,
            item.creatorInsId,
            item.recipientId,
            item.recipientInsId,
            userId,
            userInstitutionId
          ) && (
              <Link href={`/list/events/${item.id}`}>
                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">
                  <Image src="/view.png" alt="" width={24} height={24} />
                </button>
              </Link>
            )}
          {canManageAppointment(
            userRole,
            item.creatorId,
            item.creatorInsId,
            userId,
            userInstitutionId
          ) && (
              <FormModal table="event" type="delete" id={item.id} />
            )}
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.AppointmentsWhereInput = {};

  // Role göre filtreleme
  if (currentUserRole !== UserRole.ADMIN) {
    if (currentUserRole === UserRole.MUSTERI_SEVIYE2) {
      // MUSTERI_SEVIYE2 sadece kendisine ait randevuları görür
      query.recipientId = currentUserId;
    } else if (currentUserRole === UserRole.MUSTERI_SEVIYE1 && currentUserInstitutionId) {
      // MUSTERI_SEVIYE1 kendi kurumuna ait tüm randevuları görür
      query.recipientInsId = currentUserInstitutionId;
    } else if (currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) {
      // HIZMETSAGLAYICI_SEVIYE2 kendisinin oluşturduğu randevuları görür
      query.creatorId = currentUserId;
    } else if (currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 && currentUserInstitutionId) {
      // HIZMETSAGLAYICI_SEVIYE1 kurumunun oluşturduğu tüm randevuları görür
      query.creatorInsId = currentUserInstitutionId;
    }
  }

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "recipientInsId":
            query.recipientInsId = value;
            break;
          case "creatorInstId":
            query.creatorInsId = value;
            break;
          case "institutionFilter":
            const institutionId = value;
            if (institutionId) {
              query.OR = [
                { recipientInsId: institutionId },
                { creatorInsId: institutionId }
              ];
            }
            break;
          case "search":
            query.tittle = { contains: value, mode: "insensitive" };
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.appointments.findMany({
      where: query,
      include: {
        creator: true,
        creatorIns: true,
        recipient: true,
        recipientIns: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.appointments.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex item-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          {currentUserRole === UserRole.ADMIN
            ? 'Tüm Randevular'
            : currentUserRole.startsWith('MUSTERI')
              ? currentUserRole === UserRole.MUSTERI_SEVIYE1
                ? 'Kurumunuzun Randevuları'
                : 'Randevularınız'
              : currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1
                ? 'Kurumunuzun Oluşturduğu Randevular'
                : 'Oluşturduğunuz Randevular'
          }
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
            {canCreateAppointment(currentUserRole) && (
              <FormModal
                table="event"
                type="create"
                currentUserRole={currentUserRole}
                currentUserId={currentUserId || ''}
              />
            )}
          </div>
        </div>
      </div>

      <div className="">
        <Table
          columns={columns}
          renderRow={(item) => renderRow(item, currentUserRole, currentUserId, currentUserInstitutionId)}
          data={data}
        />
      </div>

      <Pagination page={p} count={count} />
    </div>
  );
};

export default EventListPage;