import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import {
  Institutions,
  Notifications,
  User,
  NotificationTypes,
  Devices,
  Prisma,
  DeviceTypes,
  UserRole,
} from "@prisma/client";
import { auth } from "@/auth";
import Image from "next/image";
import Link from "next/link";

type NotificationList = Notifications & { creator: User } & {
  creatorIns: Institutions;
} & { recipient: User } & { recipientIns: Institutions } & {
  type: NotificationTypes;
} & { device: Devices } & { deviceType: DeviceTypes };

const columns = [
  {
    header: "Bildirim ID",
    accessor: "id",
    className: "hidden md:table-cell",
  },
  {
    header: "Oluşturan Kullanıcı",
    accessor: "info",
  },
  {
    header: "Bildirim Tarihi",
    accessor: "notificationDate",
    className: "hidden md:table-cell",
  },
  {
    header: "İlgili Kullanıcı",
    accessor: "info1",
  },
  {
    header: "Durumu",
    accessor: "isRead",
    className: "hidden md:table-cell",
  },
  {
    header: "Eylemler",
    accessor: "action",
    className: "hidden md:table-cell",
  },
];

const canViewNotification = (
  userRole: UserRole,
  notificationRecipientId: string,
  notificationRecipientInsId: string,
  currentUserId: string | null | undefined,
  currentUserInstitutionId: string | null | undefined
) => {
  if (userRole === UserRole.ADMIN) return true;

  if (!currentUserId || !currentUserInstitutionId) return false;

  // SEVIYE2 rolleri sadece kendi bildirimlerini görebilir
  if (
    (userRole === UserRole.MUSTERI_SEVIYE2 ||
      userRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) &&
    currentUserId === notificationRecipientId
  ) return true;

  // SEVIYE1 rolleri kendi kurumlarına ait tüm bildirimleri görebilir
  if (
    (userRole === UserRole.MUSTERI_SEVIYE1 ||
      userRole === UserRole.HIZMETSAGLAYICI_SEVIYE1) &&
    currentUserInstitutionId === notificationRecipientInsId
  ) return true;

  return false;
};

const canManageNotification = (userRole: UserRole) => {
  return userRole === UserRole.ADMIN;
};

const NotificationListPage = async ({
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

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const renderRow = (
    item: NotificationList,
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
      <td className="hidden md:table-cell">
        {item.notificationDate.toLocaleDateString()}
      </td>
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">
            {item.recipient.name}
          </h3>
          <p className="text-xs text-gray-500">{item.recipientIns.name}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.isRead}</td>
      <td>
        <div className="flex items-center gap-2">
          {canViewNotification(userRole, item.recipientId, item.recipientInsId, userId, userInstitutionId) && (
            <Link href={`/list/notifications/${item.id}`}>
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">
                <Image src="/view.png" alt="" width={24} height={24} />
              </button>
            </Link>
          )}
          {canManageNotification(userRole) && (
            <FormModal table="notification" type="delete" id={item.id} />
          )}
        </div>
      </td>
    </tr>
  );

  const query: Prisma.NotificationsWhereInput = {};

  // Role göre filtreleme
  if (currentUserRole !== UserRole.ADMIN) {
    if (currentUserRole === UserRole.MUSTERI_SEVIYE2 ||
      currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) {
      // SEVIYE2 rolleri sadece kendi bildirimlerini görebilir
      query.recipientId = currentUserId;
    } else if ((currentUserRole === UserRole.MUSTERI_SEVIYE1 ||
      currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1) &&
      currentUserInstitutionId) {
      // SEVIYE1 rolleri kendi kurumlarındaki tüm bildirimleri görebilir
      query.recipientInsId = currentUserInstitutionId;
    }
  }

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && currentUserRole === UserRole.ADMIN) {
        switch (key) {
          case "recipientId":
            const recipientId = value;
            if (recipientId) {
              query.recipientId = recipientId;
            }
            break;
          case "creatorId":
            const creatorId = value;
            if (creatorId) {
              query.creatorId = creatorId;
            }
            break;
          case "recipientInsId":
            const recipientInsId = value;
            if (recipientInsId) {
              query.recipientInsId = recipientInsId;
            }
            break;
          case "deviceId":
            const deviceId = value;
            if (deviceId) {
              query.deviceId = deviceId;
            }
            break;
          case "search":
            query.content = { contains: value, mode: "insensitive" };
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.notifications.findMany({
      where: query,
      include: {
        creator: true,
        creatorIns: true,
        recipient: true,
        recipientIns: true,
        type: true,
        device: true,
        deviceType: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.notifications.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex item-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          {currentUserRole === UserRole.ADMIN
            ? 'Tüm Bildirimler'
            : (currentUserRole === UserRole.MUSTERI_SEVIYE1 || currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1)
              ? 'Kurumunuzun Bildirimleri'
              : 'Bildirimleriniz'}
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
            {canManageNotification(currentUserRole) && (
              <FormModal
                table="notification"
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

export default NotificationListPage;