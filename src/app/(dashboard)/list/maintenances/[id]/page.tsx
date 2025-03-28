import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalendar";
import FormModal from "@/components/FormModal";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import {
  Institutions,
  User,
  DeviceFeatures,
  Devices,
  DeviceTypes,
  MaintenanceCards,
  Services,
  Operations,
  UserRole,
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type MaintenanceType = MaintenanceCards & {
  device: Devices;
  deviceType: DeviceTypes;
  deviceFeature: DeviceFeatures;
  provider: User;
  providerIns: Institutions;
  customer: User;
  customerIns: Institutions;
  MaintenanceSub: {
    id: string;
    maintenanceCardId: string;
    operationId: string;
    detail: string | null;
    opreation: Operations;
  }[];
};

const isAuthorized = (
  currentUserRole: UserRole,
  currentUserId: string,
  currentUserInstitutionId: string | null,
  maintenanceProviderId: string,
  maintenanceProviderInstitutionId: string
) => {
  // ADMIN her bakımı güncelleyebilir
  if (currentUserRole === UserRole.ADMIN) {
    return true;
  }

  // HIZMETSAGLAYICI_SEVIYE1 kendi kurumunun tüm bakımlarını güncelleyebilir
  if (currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1) {
    return currentUserInstitutionId === maintenanceProviderInstitutionId;
  }

  // HIZMETSAGLAYICI_SEVIYE2 sadece kendi provider olduğu bakımları güncelleyebilir
  if (currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) {
    return currentUserId === maintenanceProviderId;
  }

  // MUSTERI_SEVIYE1 ve MUSTERI_SEVIYE2 hiçbir bakımı güncelleyemez
  return false;
};

const SingleMaintenancePage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const session = await auth();

  if (!session?.user?.id) {
    return notFound();
  }

  const currentUserRole = session.user.role as UserRole;
  const currentUserId = session.user.id;

  // Mevcut kullanıcının kurum bilgisini almak için
  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { institutionId: true }
  });

  const maintenance = (await prisma.maintenanceCards.findUnique({
    where: { id },
    include: {
      device: true,
      deviceType: true,
      deviceFeature: true,
      provider: true,
      providerIns: true,
      customer: true,
      customerIns: true,
      MaintenanceSub: {
        include: {
          opreation: true,
        },
      },
    },
  })) as MaintenanceType | null;

  if (!maintenance) {
    return notFound();
  }

  const canUpdate = isAuthorized(
    currentUserRole,
    currentUserId,
    currentUser?.institutionId ?? null,
    maintenance.providerId,
    maintenance.providerInsId
  );

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      <div className="w-full xl:w-2/3">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="bg-lamaPurpleLight py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">Bakım Kartı</h1>
                {canUpdate && (
                  <FormModal
                    table="maintenance"
                    type="update"
                    data={{
                      id: maintenance.id,
                      serialNumber: maintenance.device.serialNumber,
                      maintenanceDate: new Date(maintenance.maintenanceDate).toISOString().split('T')[0],
                      nextMaintenanceDate: new Date(maintenance.nextMaintenanceDate).toISOString().split('T')[0],
                      details: maintenance.details,
                      operations: maintenance.MaintenanceSub.map(sub => sub.opreation.id)
                    }}
                    currentUserRole={currentUserRole}
                  />
                )}
              </div>
              <p className="text-sm text-gray-500">{maintenance.details}</p>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <span>Bakım No: {maintenance.id}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <span>Cihaz Seri No: {maintenance.device.serialNumber}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <span>Cihaz Sorumlusu: {maintenance.customer.name}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <span>Cihaz Sahibi: {maintenance.customerIns.name}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <span>Türü: {maintenance.deviceType.name}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <span>Özelliği: {maintenance.deviceFeature.name}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <Image src="/address.png" alt="" width={14} height={14} />
                  <span>{maintenance.customerIns.address}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            <div className="bg-lamaSky p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[100%]">
              <Image
                src="/smc-company.png"
                alt=""
                width={96}
                height={96}
                className="w-10 h-12"
              />
              <div className="">
                <h1 className="text-md font-semibold">Hizmet Veren Firma</h1>
                <span className="text-sm text-gray-400">
                  {maintenance.provider.name}
                </span>
                <br></br>
                <span className="text-sm text-gray-400">
                  {maintenance.providerIns.name}
                </span>
              </div>
            </div>
            <div className="bg-lamaYellow p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[100%]">
              <Image
                src="/smc-calendar.png"
                alt=""
                width={96}
                height={96}
                className="w-10 h-10"
              />
              <div className="">
                <h1 className="text-md font-semibold">Bakım Tarihi</h1>
                <span className="text-sm text-gray-400">
                  {maintenance.maintenanceDate.toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="bg-lamaSky p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[100%]">
              <Image
                src="/smc-calendar.png"
                alt=""
                width={96}
                height={96}
                className="w-10 h-10"
              />
              <div className="">
                <h1 className="text-md font-semibold">Sonraki Bakım Tarihi</h1>
                <span className="text-sm text-gray-400">
                  {maintenance.nextMaintenanceDate.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Bakım İşlemleri</h1>
        <div className="flex flex-col gap-4 mt-4">
          {maintenance.MaintenanceSub.map((sub) => (
            <div key={sub.id} className="bg-lamaSkyLight rounded-md p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">{sub.opreation.name}</h2>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {sub.detail || "Detay girilmemiş"}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold mb-4">Kısayollar</h1>
          <div className="flex flex-col gap-3">
            {/* Cihaz detaylarına git */}
            <Link
              href={`/list/devices/${maintenance.deviceId}`}
              className="flex items-center gap-2 p-3 rounded-md bg-lamaSkyLight hover:bg-lamaSky transition-colors"
            >
              <Image src="/view.png" alt="" width={16} height={16} />
              <span className="text-sm">Cihaz Detayları</span>
            </Link>

            {/* Cihazın diğer bakımları */}
            <Link
              href={`/list/maintenances?deviceId=${maintenance.deviceId}`}
              className="flex items-center gap-2 p-3 rounded-md bg-lamaPurpleLight hover:bg-lamaPurple transition-colors"
            >
              <Image src="/maintenance.png" alt="" width={16} height={16} />
              <span className="text-sm">Cihazın Diğer Bakımları</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SingleMaintenancePage;