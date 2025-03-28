import Announcements from "@/components/Announcements";
import FormModal from "@/components/FormModal";
import OfferDocument from "@/components/OfferDocument";
import ActionButtons from "@/components/ActionButtons"; // ActionButtons'u doğrudan import ediyoruz
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import {
  Institutions,
  User,
  OfferCards,
  PaymentTermTypes,
  Services,
  OfferSub,
  UserRole
} from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

type OfferWithRelations = OfferCards & {
  paymentTerm: PaymentTermTypes;
  OfferSub: (OfferSub & {
    service: Services;
  })[];
  creator: User;
  creatorIns: Institutions;
  recipient: User;
  recipientIns: Institutions;
};

const isAuthorized = (
  currentUserRole: UserRole,
  currentUserId: string,
  currentUserInstitutionId: string | null,
  offerCreatorId: string,
  offerCreatorInstitutionId: string
) => {
  // ADMIN her teklifi güncelleyebilir
  if (currentUserRole === UserRole.ADMIN) {
    return true;
  }

  // HIZMETSAGLAYICI_SEVIYE1 kendi kurumunun tüm tekliflerini güncelleyebilir
  if (currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE1) {
    return currentUserInstitutionId === offerCreatorInstitutionId;
  }

  // HIZMETSAGLAYICI_SEVIYE2 sadece kendi oluşturduğu teklifleri güncelleyebilir
  if (currentUserRole === UserRole.HIZMETSAGLAYICI_SEVIYE2) {
    return currentUserId === offerCreatorId;
  }

  // MUSTERI_SEVIYE1 ve MUSTERI_SEVIYE2 hiçbir teklifi güncelleyemez
  return false;
};

const SingleOfferPage = async ({
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

  const offer: OfferWithRelations | null = await prisma.offerCards.findUnique({
    where: { id },
    include: {
      paymentTerm: true,
      OfferSub: {
        include: {
          service: true
        }
      },
      creator: true,
      creatorIns: true,
      recipient: true,
      recipientIns: true,
    },
  });

  if (!offer) {
    return notFound();
  }

  const canUpdate = isAuthorized(
    currentUserRole,
    currentUserId,
    currentUser?.institutionId ?? null,
    offer.creatorId,
    offer.creatorInsId
  );

  // Toplam tutar hesaplama
  const totalAmount = offer.OfferSub.reduce((total, sub) =>
    total + (Number(sub.unitPrice) * Number(sub.size)),
    0
  ).toFixed(2);

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      {/* Üst Kısım: Başlık, Eylemler ve Kısayollar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <h1 className="text-xl font-semibold">Teklif Dokümanı</h1>
        <div className="flex items-center gap-2">
          {canUpdate && (
            <FormModal
              table="offer"
              type="update"
              data={{
                id: offer.id,
                creatorId: offer.creator.id,
                creatorInsId: offer.creatorIns.id,
                recipientId: offer.recipient.id,
                recipientInsId: offer.recipientIns.id,
                offerDate: new Date(offer.offerDate).toISOString().slice(0, 16),
                validityDate: new Date(offer.validityDate).toISOString().slice(0, 16),
                paymentTermId: offer.paymentTerm.id,
                details: offer.details,
                status: offer.status,
                offerSub: offer.OfferSub.map(sub => ({
                  serviceId: sub.service.id,
                  unitPrice: sub.unitPrice.toString(),
                  size: sub.size.toString(),
                  detail: sub.detail || '',
                }))
              }}
              currentUserRole={currentUserRole}
            />
          )}
          {/* Butonları burada tutuyoruz - orijinal konumları */}
          <ActionButtons offerId={offer.id} />
        </div>
      </div>

      {/* Kısayollar */}
      {offer.requestId && (
        <div className="bg-white p-4 rounded-md shadow-sm mb-4">
          <h2 className="text-lg font-semibold mb-2">Kısayollar</h2>
          <div className="flex gap-4 flex-wrap text-xs text-black-500">
            <Link
              className="p-3 rounded-md bg-lamaPurpleLight"
              href={`/list/offerRequests/${offer.requestId}`}
            >
              İlgili Teklif Talebi
            </Link>
          </div>
        </div>
      )}

      {/* Teklif Dokümanı - İstemci Bileşeni (butonlar olmadan) */}
      <OfferDocument 
        offer={offer} 
        totalAmount={totalAmount} 
      />

      {/* Diğer Bilgiler */}
      <Announcements />
    </div>
  );
};

export default SingleOfferPage;