import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalendar";
import FormModal from "@/components/FormModal";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import {
  Appointments,
  Institutions,
  User,
  UserRole
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const isAuthorized = (
  currentUserRole: UserRole,
  currentUserId: string,
  currentUserInstitutionId: string | null,
  eventCreatorId: string,
  eventCreatorInstitutionId: string
) => {
  // ADMIN her randevuyu güncelleyebilir
  if (currentUserRole === UserRole.ADMIN) {
    return true;
  }

  // HIZMETSAGLAYICI_SEVIYE1 kendi kurumunun tüm randevularını güncelleyebilir
  if (currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1) {
    return currentUserInstitutionId === eventCreatorInstitutionId;
  }

  // HIZMETSAGLAYICI_SEVIYE2 sadece kendi oluşturduğu randevuları güncelleyebilir
  if (currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) {
    return currentUserId === eventCreatorId;
  }

  // MUSTERI_SEVIYE1 ve MUSTERI_SEVIYE2 hiçbir randevuyu güncelleyemez
  return false;
};

const SingleEventPage = async ({
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

  const eventId = id;
  const event:
    | (Appointments & {
      creator: User;
      creatorIns: Institutions;
      recipient: User;
      recipientIns: Institutions;
    })
    | null = await prisma.appointments.findUnique({
      where: { id: eventId },
      include: {
        creator: true,
        creatorIns: true,
        recipient: true,
        recipientIns: true,
      },
    });

  if (!event) {
    return notFound();
  }

  const canUpdate = isAuthorized(
    currentUserRole,
    currentUserId,
    currentUser?.institutionId ?? null,
    event.creator.id,
    event.creatorIns.id
  );

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      <div className="w-full xl:w-2/3">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="bg-lamaPurpleLight py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-full flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">Randevu Kartı</h1>
                {canUpdate && (
                  <FormModal
                    table="event"
                    type="update"
                    data={{
                      id: event.id,
                      creatorId: event.creator.id,
                      creatorInsId: event.creatorIns.id,
                      recipientId: event.recipient.id,
                      recipientInsId: event.recipientIns.id,
                      title: event.tittle,
                      content: event.content,
                      start: new Date(event.start).toISOString().slice(0, 16),
                      end: new Date(event.end).toISOString().slice(0, 16)
                    }}
                    currentUserRole={currentUserRole}
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Randevu Verilen Kurum:</span>
                <span className="text-sm text-gray-500">{event.recipientIns.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Randevu Verilen Kişi:</span>
                <span className="text-sm text-gray-500">{event.recipient.name}</span>
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <Image src="/date.png" alt="" width={14} height={14} />
                  <span className="text-gray-600">Başlangıç Tarihi:</span>
                  <span>{event.start.toLocaleDateString('tr-TR')}</span>
                </div>

                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <Image src="/date.png" alt="" width={14} height={14} />
                  <span className="text-gray-600">Bitiş Tarihi:</span>
                  <span>{event.end.toLocaleDateString('tr-TR')}</span>
                </div>

                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <span className="text-gray-600">Randevu No:</span>
                  <span>{event.id}</span>
                </div>

                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <span className="text-gray-600">Açıklama:</span>
                  <span>{event.content}</span>
                </div>

                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{event.recipientIns.phone}</span>
                </div>

                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span>{event.recipientIns.email}</span>
                </div>

                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <Image src="/address.png" alt="" width={14} height={14} />
                  <span>{event.recipientIns.address}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            <div className="bg-lamaSky p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[100%]">
              <Image
                src="/smc-customer.png"
                alt=""
                width={96}
                height={96}
                className="w-10 h-12"
              />
              <div className="">
                <h1 className="text-md font-semibold">Oluşturan Personel</h1>
                <span className="text-sm text-gray-400">{event.creator.id}</span>
                <br></br>
                <span className="text-sm text-gray-400">{event.creator.name}</span>
                <br></br>
                <span className="text-sm text-gray-400">{event.creatorIns.name}</span>
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
                <h1 className="text-md font-semibold">Randevu Başlangıç Tarihi</h1>
                <span className="text-sm text-gray-400">
                  {event.start.toLocaleDateString()}
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
                <h1 className="text-md font-semibold">Randevu Bitiş Tarihi</h1>
                <span className="text-sm text-gray-400">
                  {event.end.toLocaleDateString()}
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
                <h1 className="text-md font-semibold">Randevu Oluşturma Tarihi</h1>
                <span className="text-sm text-gray-400">
                  {event.create.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* SAĞ TARAF - Kısayollar */}
      <div className="w-full xl:w-1/3">
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold mb-4">Kısayollar</h1>
          <div className="flex flex-col gap-3">
            {/* Randevuyu alan kişinin profili */}
            <Link
              href={`/list/users/${event.recipientId}`}
              className="flex items-center gap-2 p-3 rounded-md bg-lamaSkyLight hover:bg-lamaSky transition-colors"
            >
              <Image src="/user.png" alt="" width={16} height={16} />
              <span className="text-sm">Randevu Alan Kişi Profili</span>
            </Link>

            {/* Randevuyu alan kurumun profili */}
            <Link
              href={`/list/institutions/${event.recipientInsId}`}
              className="flex items-center gap-2 p-3 rounded-md bg-lamaPurpleLight hover:bg-lamaPurple transition-colors"
            >
              <Image src="/company.png" alt="" width={16} height={16} />
              <span className="text-sm">Randevu Alan Kurum Profili</span>
            </Link>

            {/* Aynı kurumlar arasındaki diğer randevular */}
            <Link
              href={`/list/events?creatorInstId=${event.creatorInsId}&recipientInstId=${event.recipientInsId}`}
              className="flex items-center gap-2 p-3 rounded-md bg-lamaYellow hover:bg-lamaYellowDark transition-colors"
            >
              <Image src="/calendar.png" alt="" width={16} height={16} />
              <span className="text-sm">Kurumlar Arası Diğer Randevular</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleEventPage;