import Announcements from "@/components/Announcements";
import FormModal from "@/components/FormModal";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import {
  OfferRequests,
  RequestSub,
  Services,
  User,
  Institutions,
  UserRole
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type RequestWithSubs = OfferRequests & {
  creator: User;
  creatorIns: Institutions;
  RequestSub: (RequestSub & {
    service: Services
  })[]
}

const isAuthorized = (
  currentUserRole: UserRole,
  currentUserId: string,
  currentUserInstitutionId: string | null,
  requestCreatorId: string,
  requestCreatorInstitutionId: string
) => {
  // ADMIN her teklif talebini güncelleyebilir
  if (currentUserRole === UserRole.ADMIN) {
    return true;
  }

  // MUSTERI_SEVIYE1 kendi kurumunun tüm teklif taleplerini güncelleyebilir
  if (currentUserRole === UserRole.MUSTERI_SEVIYE1) {
    return currentUserInstitutionId === requestCreatorInstitutionId;
  }

  // MUSTERI_SEVIYE2 sadece kendi oluşturduğu teklif taleplerini güncelleyebilir
  if (currentUserRole === UserRole.MUSTERI_SEVIYE2) {
    return currentUserId === requestCreatorId;
  }

  // HIZMETSAGLAYICI_SEVIYE1 ve HIZMETSAGLAYICI_SEVIYE2 hiçbir teklif talebini güncelleyemez
  return false;
};

const SingleOfferRequestPage = async ({
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

  const request: RequestWithSubs | null = await prisma.offerRequests.findUnique({
    where: { id },
    include: {
      creator: true,
      creatorIns: true,
      RequestSub: {
        include: {
          service: true
        }
      }
    }
  });

  if (!request) {
    return notFound();
  }

  const canUpdate = isAuthorized(
    currentUserRole,
    currentUserId,
    currentUser?.institutionId ?? null,
    request.creatorId,
    request.creatorInsId
  );

  const creatorFullName = [request.creator.name]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      <div className="w-full xl:w-2/3">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="bg-lamaPurpleLight py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">Teklif Talep Kartı</h1>
                <div className="flex items-center gap-2">
                  <FormModal
                    table="offer"
                    type="create"
                    currentUserId={currentUserId}
                    data={{
                      requestId: request.id,
                      recipientId: request.creator.id,
                      recipientInsId: request.creatorInsId,
                      offerDate: new Date().toISOString(),
                      validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                      status: "Beklemede",
                      offerSub: request.RequestSub.map(sub => ({
                        serviceId: sub.serviceId,
                        service: sub.service,
                        size: sub.quantity,
                        detail: sub.detail,
                        unitPrice: '',
                        isFromRequest: true
                      }))
                    }}
                  >
                    <button className="bg-lamaYellow hover:bg-yellow-500 text-white px-4 py-2 rounded-md text-sm">
                      Teklif Ver
                    </button>
                  </FormModal>
                  {canUpdate && (
                    <FormModal
                      table="offerRequest"
                      type="update"
                      data={{
                        id: request.id,
                        creatorId: request.creator.id,
                        creatorInsId: request.creatorInsId,
                        start: request.start.toISOString(),
                        end: request.end.toISOString(),
                        status: request.status,
                        details: request.details,
                        requestSub: request.RequestSub.map(sub => ({
                          requiredDate: new Date(sub.requiredDate).toISOString(),
                          serviceId: sub.serviceId,
                          quantity: sub.quantity.toString(),
                          detail: sub.detail
                        }))
                      }}
                      currentUserRole={currentUserRole}
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Talep Eden Kurum:</span>
                <span className="text-sm text-gray-500">{request.creatorIns.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Talep Eden Personel:</span>
                <span className="text-sm text-gray-500">{creatorFullName}</span>
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <Image src="/date.png" alt="" width={14} height={14} />
                  <span className="text-gray-600">Başlangıç Tarihi:</span>
                  <span>{request.start.toLocaleDateString('tr-TR')}</span>
                </div>

                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <Image src="/date.png" alt="" width={14} height={14} />
                  <span className="text-gray-600">Bitiş Tarihi:</span>
                  <span>{request.end.toLocaleDateString('tr-TR')}</span>
                </div>

                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <span className="text-gray-600">Durumu:</span>
                  <span>{request.status}</span>
                </div>

                <div className="w-full md:w-1/3 lg:w-full 2xl:w-2/3 flex items-center gap-2">
                  <span className="text-gray-600">Açıklama:</span>
                  <span>{request.details}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        {/* Kısayollar Bölümü */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Kısayollar</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-black-500">
            <Link
              className="p-3 rounded-md bg-lamaSkyLight"
              href={`/list/offers?requestId=${request.id}`} // requestId parametresi eklendi
            >
              Talebe Verilen Teklifler
            </Link>
            {/* <Link
              className="p-3 rounded-md bg-lamaPurpleLight"
              href={`/list/offers?creatorInsId=${request.creatorInsId}`}
            >
              Kurumun Diğer Talepleri
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaPurple"
              href={`/list/offers?creatorId=${request.creatorId}`}
            >
              Kullanıcının Diğer Talepleri
            </Link> */}
          </div>
        </div>

        {/* Alt Kalemler Bölümü */}
        <div className="bg-white p-4 rounded-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Alt Kalemler</h2>
          </div>
          <div className="flex flex-col gap-4">
            {request.RequestSub.map((sub, index) => (
              <div
                key={sub.id}
                className={`${index % 2 === 0 ? "bg-lamaSkyLight" : "bg-lamaPurpleLight"} p-4 rounded-md`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{sub.service.name}</span>
                  <span className="text-sm bg-white px-2 py-1 rounded-md">
                    {new Date(sub.requiredDate).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Miktar:</span>
                    <span className="ml-2">{sub.quantity.toString()}</span>
                  </div>
                  {sub.detail && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Detay:</span>
                      <span className="ml-2">{sub.detail}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Announcements />
      </div>
    </div>
  );
};

export default SingleOfferRequestPage;