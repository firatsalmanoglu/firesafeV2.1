import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { ITEM_PER_PAGE } from "@/lib/settings";
import {
  DeviceTypes,
  DeviceFeatures,
  Devices,
  User,
  Institutions,
  MaintenanceCards,
  Prisma,
  UserRole,
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

type MaintenanceList = MaintenanceCards & {
  device: Devices;
  deviceType: DeviceTypes;
  deviceFeature: DeviceFeatures;
  provider: User;
  providerIns: Institutions;
  customer: User;
  customerIns: Institutions;
  MaintenanceSub: MaintenanceList[];
};

const columns = [
  {
    header: "Kayıt No",
    accessor: "id",
  },
  {
    header: "Cihaz Seri No",
    accessor: "deviceSerialNumber",
    className: "hidden md:table-cell",
  },
  {
    header: "Servis Sağlayıcı",
    accessor: "info",
  },
  {
    header: "Bakım Tarihi",
    accessor: "maintenanceDate",
    className: "hidden md:table-cell",
  },
  {
    header: "Müşteri",
    accessor: "info",
  },
  {
    header: "Eylemler",
    accessor: "action",
    className: "hidden md:table-cell",
  },
];

const canViewMaintenance = (
  userRole: UserRole,
  maintenanceProviderInsId: string,
  maintenanceCustomerInsId: string,
  currentUserInstitutionId: string | null | undefined
) => {
  if (userRole === UserRole.ADMIN) return true;

  if (!currentUserInstitutionId) return false;

  // Müşteri rolleri sadece kendi cihazlarının bakımlarını görebilir
  if (
    (userRole === UserRole.MUSTERI_SEVIYE1 ||
      userRole === UserRole.MUSTERI_SEVIYE2) &&
    currentUserInstitutionId === maintenanceCustomerInsId
  ) return true;

  // Hizmet sağlayıcı rolleri sadece kendi yaptıkları bakımları görebilir
  if (
    (userRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 ||
      userRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) &&
    currentUserInstitutionId === maintenanceProviderInsId
  ) return true;

  return false;
};

const canManageMaintenance = (
  userRole: UserRole,
  maintenanceProviderInsId: string,
  currentUserInstitutionId: string | null | undefined
) => {
  if (userRole === UserRole.ADMIN) return true;

  if (!currentUserInstitutionId) return false;

  // Hizmet sağlayıcı rolleri kendi yaptıkları bakımları yönetebilir
  if (
    (userRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 ||
      userRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) &&
    currentUserInstitutionId === maintenanceProviderInsId
  ) return true;

  return false;
};

const canCreateMaintenance = (userRole: UserRole) => {
  const authorizedRoles: Array<UserRole> = [
    UserRole.ADMIN,
    UserRole.HIZMETSAGLAYICI_SEVIYE1,
    UserRole.HIZMETSAGLAYICI_SEVIYE2
  ];
  return authorizedRoles.includes(userRole);
};

const MaintenanceListPage = async ({
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
    item: MaintenanceList,
    userRole: UserRole,
    userInstitutionId: string | null | undefined
  ) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="hidden md:table-cell">{item.id}</td>
      <td className="hidden md:table-cell">{item.device.serialNumber}</td>
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.providerIns.name}</h3>
          <p className="text-xs text-gray-500">
            {item.provider.name}
          </p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        {item.maintenanceDate.toLocaleDateString()}
      </td>
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.customerIns.name}</h3>
          <p className="text-xs text-gray-500">
            {item.customer.name}
          </p>
        </div>
      </td>
      <td>
        <div className="flex items-center gap-2">
          {canViewMaintenance(userRole, item.providerInsId, item.customerInsId, userInstitutionId) && (
            <Link href={`/list/maintenances/${item.id}`}>
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">
                <Image src="/view.png" alt="" width={24} height={24} />
              </button>
            </Link>
          )}
          {canManageMaintenance(userRole, item.providerInsId, userInstitutionId) && (
            <FormModal table="maintenance" type="delete" id={item.id} />
          )}
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.MaintenanceCardsWhereInput = {};

  // Role göre filtreleme
  if (currentUserRole !== UserRole.ADMIN && currentUserInstitutionId) {
    if (currentUserRole === UserRole.MUSTERI_SEVIYE1 ||
      currentUserRole === UserRole.MUSTERI_SEVIYE2) {
      // Müşteriler sadece kendi cihazlarının bakımlarını görebilir
      query.customerInsId = currentUserInstitutionId;
    } else if (currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1 ||
      currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) {
      // Hizmet sağlayıcılar sadece kendi yaptıkları bakımları görebilir
      query.providerInsId = currentUserInstitutionId;
    }
  }

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "customerId":
            const customerId = value;
            if (customerId) {
              query.customerId = customerId;
            }
            break;
          case "providerId":
            const providerId = value;
            if (providerId) {
              query.providerId = providerId;
            }
            break;
          case "customerInsId":
            const customerInstId = value;
            if (customerInstId) {
              query.customerInsId = customerInstId;
            }
            break;
          case "providerInstId":
            const providerInstId = value;
            if (providerInstId) {
              query.providerInsId = providerInstId;
            }
            break;
          case "deviceId":
            const deviceId = value;
            if (deviceId) {
              query.deviceId = deviceId;
            }
            break;
          case "institutionFilter":
            const institutionId = value;
            if (institutionId) {
              query.OR = [
                { customerInsId: institutionId },
                { providerInsId: institutionId }
              ];
            }
            break;

          case "search":
            query.details = { contains: value, mode: "insensitive" };
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.maintenanceCards.findMany({
      where: query,
      include: {
        device: true,
        deviceType: true,
        deviceFeature: true,
        provider: true,
        providerIns: true,
        customer: true,
        customerIns: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.maintenanceCards.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex item-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          {currentUserRole === UserRole.ADMIN
            ? 'Tüm Bakımlar'
            : currentUserRole.startsWith('MUSTERI')
              ? 'Cihazlarınıza Yapılan Bakımlar'
              : 'Yaptığınız Bakımlar'}
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
            {canCreateMaintenance(currentUserRole) && (
              <FormModal table="maintenance" type="create" />
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

export default MaintenanceListPage;