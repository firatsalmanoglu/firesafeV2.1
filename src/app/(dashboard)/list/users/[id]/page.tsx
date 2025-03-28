import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalendar";
import FormModal from "@/components/FormModal";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { Institutions, User, UserRole } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const isAuthorized = (
  currentUserRole: UserRole,
  currentUserId: string,
  currentUserInstitutionId: string | null,
  targetUserId: string,
  targetUserInstitutionId: string | null
) => {
  // ADMIN her kullanıcıyı güncelleyebilir
  if (currentUserRole === UserRole.ADMIN) {
    return true;
  }

  // HIZMETSAGLAYICI_SEVIYE1 sadece kendi kurumundaki kullanıcıları güncelleyebilir
  if (currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1) {
    return currentUserInstitutionId && currentUserInstitutionId === targetUserInstitutionId;
  }

  // HIZMETSAGLAYICI_SEVIYE2 sadece kendi profilini güncelleyebilir
  if (currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) {
    return currentUserId === targetUserId;
  }

  // MUSTERI_SEVIYE1 sadece kendi kurumundaki kullanıcıları güncelleyebilir
  if (currentUserRole === UserRole.MUSTERI_SEVIYE1) {
    return currentUserInstitutionId && currentUserInstitutionId === targetUserInstitutionId;
  }

  // MUSTERI_SEVIYE2 sadece kendi profilini güncelleyebilir
  if (currentUserRole === UserRole.MUSTERI_SEVIYE2) {
    return currentUserId === targetUserId;
  }

  return false;
};

const SingleUserPage = async ({
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

  const userId = id;
  const user: (User & { institution: Institutions | null }) | null =
    await prisma.user.findUnique({
      where: { id: id },
      include: {
        institution: true,
      },
    });

  if (!user) {
    return notFound();
  }

  const canUpdate = isAuthorized(
    currentUserRole,
    currentUserId,
    currentUser?.institutionId ?? null,
    user.id,
    user.institutionId
  );

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* USER INFO CARD */}
          <div className="bg-lamaPurpleLight py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-1/3">
              <Image
                src={user.photo || "/noAvatar.png"}
                alt=""
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover"
              />
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">{user.name}</h1>
                {canUpdate && (
                  <FormModal
                    table="user"
                    type="update"
                    data={{
                      id: user.id,
                      name: user.name,
                      email: user.email,
                      bloodType: user.bloodType,
                      birthday: user.birthday
                        ? user.birthday.toISOString().split("T")[0]
                        : null,
                      sex: user.sex,
                      phone: user.phone,
                      photo: user.photo,
                      institutionId: user.institutionId,
                      role: user.role,
                    }}
                    currentUserRole={currentUserRole}
                  />
                )}
              </div>
              <p className="text-sm text-gray-500">
                <span className="text-gray-600">Kullanıcı Adı: </span>
                {user.name}
              </p>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <Image src="/blood.png" alt="" width={14} height={14} />
                  <span>{user.bloodType}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <Image src="/date.png" alt="" width={14} height={14} />
                  <span>{user.birthday?.toLocaleDateString()}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span>{user.email}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{user.phone}</span>
                </div>
              </div>
            </div>
          </div>
          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            {/* CARD */}
            <div className="bg-lamaSky p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[100%]">
              <Image
                src="/smc-role.png"
                alt=""
                width={96}
                height={96}
                className="w-10 h-10"
              />
              <div className="">
                <h1 className="text-md font-semibold">Rolü</h1>
                <span className="text-sm text-gray-400">{user.role}</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-lamaYellow p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[100%]">
              <Image
                src="/smc-sex.png"
                alt=""
                width={96}
                height={96}
                className="w-10 h-10"
              />
              <div className="">
                <h1 className="text-md font-semibold">Cinsiyet</h1>
                <span className="text-sm text-gray-400">{user.sex}</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-lamaSky p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[100%]">
              <Image
                src="/smc-company.png"
                alt=""
                width={96}
                height={96}
                className="w-10 h-12"
              />
              <div className="">
                <h1 className="text-md font-semibold">Kurumu</h1>
                <span className="text-sm text-gray-400">
                  {user.institution?.name}
                </span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-lamaYellow p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[100%]">
              <Image
                src="/smc-calendar.png"
                alt=""
                width={96}
                height={96}
                className="w-10 h-10"
              />
              <div className="">
                <h1 className="text-md font-semibold">Üyelik Tarihi</h1>
                <span className="text-sm text-gray-400">
                  {user.registrationDate.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* BOTTOM */}
        <div className="mt-4 bg-white rounded-md p-4 h-[800px]">
          <h1 className="text-xl font-semibold">Kullanıcı Takvimi</h1>
          <BigCalendar userId={user.id} />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Kısayollar</h1>
          <br/>
          <h1 className="text-md font-semibold">Kullanıcının</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-black-500">
            {user.role === UserRole.ADMIN ? (
              <>
                <Link
                  className="p-3 rounded-md bg-lamaSkyLight"
                  href={`/list/offers?filters=recipientId|${user.id}|creatorId|${user.id}`}
                >
                  Teklifleri
                </Link>
                <Link
                  className="p-3 rounded-md bg-lamaPurple"
                  href={`/list/maintenances?filters=customerId|${user.id}|providerId|${user.id}`}
                >
                  Bakımları
                </Link>
                <Link
                  className="p-3 rounded-md bg-lamaPurpleLight"
                  href={`/list/devices?filters=ownerId|${user.id}|providerId|${user.id}`}
                >
                  Cihazları
                </Link>
                <Link
                  className="p-3 rounded-md bg-lamaYellowLight"
                  href={`/list/notifications?recipientId=${user.id}`}
                >
                  Bildirimleri
                </Link>
              </>
            ) : user.role === UserRole.MUSTERI_SEVIYE1 || user.role === UserRole.MUSTERI_SEVIYE2 ? (
              <>
                <Link
                  className="p-3 rounded-md bg-lamaSkyLight"
                  href={`/list/offers?recipientId=${user.id}`}
                >
                  Teklifleri
                </Link>
                <Link
                  className="p-3 rounded-md bg-lamaPurple"
                  href={`/list/maintenances?customerId=${user.id}`}
                >
                  Bakımları
                </Link>
                <Link
                  className="p-3 rounded-md bg-lamaPurpleLight"
                  href={`/list/devices?ownerId=${user.id}`}
                >
                  Cihazları
                </Link>
                <Link
                  className="p-3 rounded-md bg-lamaYellowLight"
                  href={`/list/notifications?recipientId=${user.id}`}
                >
                  Bildirimleri
                </Link>
              </>
            ) : user.role === UserRole.HIZMETSAGLAYICI_SEVIYE1 || user.role === UserRole.HIZMETSAGLAYICI_SEVIYE2 ? (
              <>
                <Link
                  className="p-3 rounded-md bg-lamaSkyLight"
                  href={`/list/offers?creatorId=${user.id}`}
                >
                  Teklifleri
                </Link>
                <Link
                  className="p-3 rounded-md bg-lamaPurple"
                  href={`/list/maintenances?providerId=${user.id}`}
                >
                  Bakımları
                </Link>
                <Link
                  className="p-3 rounded-md bg-lamaPurpleLight"
                  href={`/list/devices?providerId=${user.id}`}
                >
                  Cihazları
                </Link>
                <Link
                  className="p-3 rounded-md bg-lamaYellowLight"
                  href={`/list/notifications?recipientId=${user.id}`}
                >
                  Bildirimleri
                </Link>
              </>
            ) : null}
          </div>
        </div>
        <Announcements />
      </div>
    </div>
  );
};

export default SingleUserPage;