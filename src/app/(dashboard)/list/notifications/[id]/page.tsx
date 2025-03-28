import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalendar";
import FormModal from "@/components/FormModal";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

import {
  Institutions,
  Notifications,
  User,
  DeviceFeatures,
  Devices,
  DeviceTypes,
  NotificationTypes,
  UserRole,
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const isAuthorized = (
  currentUserRole: UserRole
) => {
  // Sadece ADMIN bildirim güncelleyebilir
  return currentUserRole === UserRole.ADMIN;
};

const SingleNotificationPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const session = await auth();

  if (!session?.user?.id) {
    return notFound();
  }

  const currentUserRole = session.user.role as UserRole;

  const notificationId = id;
  const notification:
    | (Notifications & {
      creator: User;
      creatorIns: Institutions;
      recipient: User;
      recipientIns: Institutions;
      type: NotificationTypes;
      device: Devices | null;
      deviceType: DeviceTypes | null;
    })
    | null = await prisma.notifications.findUnique({
      where: { id: notificationId },
      include: {
        creator: true,
        creatorIns: true,
        recipient: true,
        recipientIns: true,
        type: true,
        device: true,
        deviceType: true,
      },
    });

  if (!notification) {
    return notFound();
  }

  const canUpdate = isAuthorized(currentUserRole);

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      <div className="w-full xl:w-2/3">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="bg-lamaPurpleLight py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-full flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">Bildirim Kartı</h1>
                {canUpdate && (
                  <FormModal
                    table="notification"
                    type="update"
                    data={{
                      id: notification.id,
                      creatorId: notification.creator.id,
                      creatorInsId: notification.creatorIns.id,
                      recipientId: notification.recipient.id,
                      recipientInsId: notification.recipientIns.id,
                      deviceId: notification.device?.id,
                      deviceSerialNumber: notification.device?.serialNumber,
                      deviceTypeId: notification.deviceType?.id,
                      typeId: notification.type.id,
                      content: notification.content,
                      isRead: notification.isRead
                    }}
                    currentUserRole={currentUserRole}
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Bildirim İçeriği:</span>
                <span className="text-sm text-gray-500">{notification.content}</span>
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <span className="text-gray-600">Bildirim No:</span>
                  <span>{notification.id}</span>
                </div>

                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <span className="text-gray-600">Bildirim Verilen Kişi:</span>
                  <span>{notification.recipient.name}</span>
                </div>

                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <span className="text-gray-600">Bildirim Verilen Kurum:</span>
                  <span>{notification.recipientIns.name}</span>
                </div>

                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{notification.recipientIns.phone}</span>
                </div>

                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span>{notification.recipientIns.email}</span>
                </div>

                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <Image src="/address.png" alt="" width={14} height={14} />
                  <span>{notification.recipientIns.address}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            <div className="bg-lamaSky p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[100%]">
              <Image
                src="/smc-serial.png"
                alt=""
                width={96}
                height={96}
                className="w-10 h-10"
              />
              <div className="">
                <h1 className="text-md font-semibold">İlgili Cihaz Seri No</h1>
                <span className="text-sm text-gray-400">
                  {notification.device && notification.device.serialNumber}
                </span>
              </div>
            </div>
            <div className="bg-lamaYellow p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[100%]">
              <Image
                src="/smc-device.png"
                alt=""
                width={96}
                height={96}
                className="w-10 h-12"
              />
              <div className="">
                <h1 className="text-md font-semibold">Cihaz Türü</h1>
                <span className="text-sm text-gray-400">
                  {notification.deviceType && notification.deviceType.name}
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
                <h1 className="text-md font-semibold">Bildirim Tarihi</h1>
                <span className="text-sm text-gray-400">
                  {notification.notificationDate.toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="bg-lamaYellow p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[100%]">
              <Image
                src="/smc-notification.png"
                alt=""
                width={96}
                height={96}
                className="w-10 h-10"
              />
              <div className="">
                <h1 className="text-md font-semibold">Bildirim Türü</h1>
                <span className="text-sm text-gray-400">
                  {notification.type.name}
                </span>
              </div>
            </div>
            <div className="bg-lamaSky p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[100%]">
              <Image
                src="/smc-status.png"
                alt=""
                width={96}
                height={96}
                className="w-10 h-10"
              />
              <div className="">
                <h1 className="text-md font-semibold">Durumu</h1>
                <span className="text-sm text-gray-400">
                  {notification.isRead}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
      </div>

      {/* SAĞ TARAF - Kısayollar */}
      <div className="w-full xl:w-1/3">
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold mb-4">Kısayollar</h1>
          <div className="flex flex-col gap-3">
            {/* Bildirim alan kişinin profili */}
            <Link
              href={`/list/users/${notification.recipientId}`}
              className="flex items-center gap-2 p-3 rounded-md bg-lamaSkyLight hover:bg-lamaSky transition-colors"
            >
              <Image src="/user.png" alt="" width={16} height={16} />
              <span className="text-sm">Bildirim Alan Kişi Profili</span>
            </Link>

            {/* Bildirim alan kurumun profili */}
            <Link
              href={`/list/institutions/${notification.recipientInsId}`}
              className="flex items-center gap-2 p-3 rounded-md bg-lamaPurpleLight hover:bg-lamaPurple transition-colors"
            >
              <Image src="/company.png" alt="" width={16} height={16} />
              <span className="text-sm">Bildirim Alan Kurum Profili</span>
            </Link>

            {/* İlgili cihazın detayları - Eğer cihaz bağlantısı varsa */}
            {notification.deviceId && (
              <Link
                href={`/list/devices/${notification.deviceId}`}
                className="flex items-center gap-2 p-3 rounded-md bg-lamaYellow hover:bg-lamaYellowDark transition-colors"
              >
                <Image src="/device.png" alt="" width={16} height={16} />
                <span className="text-sm">İlgili Cihaz Detayları</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleNotificationPage;