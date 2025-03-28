'use client';

import React from 'react';
import {
  Institutions,
  User,
  OfferCards,
  PaymentTermTypes,
  Services,
  OfferSub,
} from "@prisma/client";

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

interface OfferDocumentProps {
  offer: OfferWithRelations;
  totalAmount: string;
}

const OfferDocument: React.FC<OfferDocumentProps> = ({ offer, totalAmount }) => {
  return (
    <div id="offer-document" className="bg-white rounded-md shadow-md p-8 max-w-5xl mx-auto w-full">
      {/* Antet - Yazdırma için düzenlenmiş */}
      <div className="header flex flex-col md:flex-row justify-between items-start border-b-2 border-gray-200 pb-6 mb-6 gap-4">
        <div className="company-info">
          <h2 className="text-2xl font-bold text-gray-800">{offer.creatorIns.name}</h2>
          <p className="text-gray-600">{offer.creatorIns.address}</p>
          <p className="text-gray-600">Tel: {offer.creatorIns.phone}</p>
          <p className="text-gray-600">E-posta: {offer.creatorIns.email}</p>
        </div>
        <div className="offer-info text-left md:text-right mt-4 md:mt-0">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">TEKLİF</h1>
          <p className="text-gray-600">Teklif No: {offer.id}</p>
          <p className="text-gray-600">Tarih: {new Date(offer.offerDate).toLocaleDateString('tr-TR')}</p>
          <p className="text-gray-600">Geçerlilik: {new Date(offer.validityDate).toLocaleDateString('tr-TR')}</p>
          <p className="text-gray-600 mt-2">
            <span className="font-semibold">Durum: </span>
            <span className={
              offer.status === "Onaylandi" ? "text-green-600" : 
              offer.status === "Red" ? "text-red-600" : "text-yellow-600"
            }>{offer.status}</span>
          </p>
        </div>
      </div>

      {/* Alıcı bilgileri */}
      <div className="section mb-8">
        <h3 className="text-lg font-semibold mb-2">Teklif Alıcısı:</h3>
        <p className="font-bold">{offer.recipientIns.name}</p>
        <p>{offer.recipient.name}</p>
        {offer.recipientIns.address && <p className="text-gray-600 mt-1">{offer.recipientIns.address}</p>}
        {offer.recipientIns.phone && <p className="text-gray-600">Tel: {offer.recipientIns.phone}</p>}
        {offer.recipientIns.email && <p className="text-gray-600">E-posta: {offer.recipientIns.email}</p>}
      </div>

      {/* Teklif açıklaması */}
      {offer.details && (
        <div className="section mb-8">
          <h3 className="text-lg font-semibold mb-2">Teklif Detayı:</h3>
          <p className="text-gray-700 whitespace-pre-line">{offer.details}</p>
        </div>
      )}

      {/* Teklif kalemleri tablosu */}
      <table className="w-full border-collapse mb-8">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2 text-left">Hizmet</th>
            <th className="border border-gray-300 p-2 text-right">Miktar</th>
            <th className="border border-gray-300 p-2 text-right">Birim Fiyat</th>
            <th className="border border-gray-300 p-2 text-right">Toplam</th>
          </tr>
        </thead>
        <tbody>
          {offer.OfferSub.map((sub, index) => (
            <tr key={sub.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="border border-gray-300 p-2">
                <div>
                  <p className="font-medium">{sub.service.name}</p>
                  {sub.detail && <p className="text-sm text-gray-600 mt-1">{sub.detail}</p>}
                </div>
              </td>
              <td className="border border-gray-300 p-2 text-right">{Number(sub.size).toString()}</td>
              <td className="border border-gray-300 p-2 text-right">{Number(sub.unitPrice).toFixed(2)} ₺</td>
              <td className="border border-gray-300 p-2 text-right font-medium">
                {(Number(sub.unitPrice) * Number(sub.size)).toFixed(2)} ₺
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100">
            <td colSpan={3} className="border border-gray-300 p-2 text-right font-bold">
              Toplam:
            </td>
            <td className="border border-gray-300 p-2 text-right font-bold">
              {totalAmount} ₺
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Ödeme koşulları */}
      <div className="section mb-8">
        <h3 className="text-lg font-semibold mb-2">Ödeme Koşulları:</h3>
        <p className="text-gray-700">{offer.paymentTerm.name}</p>
      </div>

      {/* İmza & Not alanı */}
      <div className="footer mt-12 pt-6 border-t border-gray-300">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="notes mb-4 md:mb-0">
            <p className="font-semibold">Notlar:</p>
            <ul className="text-gray-700 mt-2 list-disc list-inside">
              <li>Bu teklif, belirtilen geçerlilik tarihine kadar geçerlidir.</li>
              <li>Fiyatlara KDV dahil değildir.</li>
              <li>Ödeme, belirtilen ödeme koşullarına göre yapılacaktır.</li>
            </ul>
          </div>
          <div className="signature text-left md:text-right">
            <p className="font-semibold mb-1">Teklifi Hazırlayan</p>
            <p className="font-medium">{offer.creator.name}</p>
            <p className="text-gray-700">{offer.creatorIns.name}</p>
            <div className="signature-line mt-8 border-t-2 border-gray-300 pt-2 text-center">
              <p className="text-sm text-gray-600">İmza & Kaşe</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferDocument;