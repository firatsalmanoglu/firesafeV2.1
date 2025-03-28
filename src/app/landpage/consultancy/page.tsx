"use client";

import React from "react";
import { Users } from "lucide-react";

import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Subject {
  d1: string;
  d2: string;
  d3?: string;
}

interface Consultancy {
  title: string;
  description: string;
  subjects: Subject;
  icon: any;
  slogan: string;
}

const ConsultancyCard = ({
  consultancy,
  index,
}: {
  consultancy: Consultancy;
  index: number;
}) => {
  const isEven = index % 2 === 0;

  return (
    <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
      {/* Çift sayılı kartlarda resim solda */}
      {isEven && (
        <div className="w-full md:w-1/2">
          <Image
            src={`/education-${index + 1}.jpg`}
            alt={consultancy.title}
            width={500}
            height={300}
            className="rounded-lg shadow-md object-cover h-[300px]"
          />
        </div>
      )}

      {/* Kart içeriği */}
      <div className="w-full md:w-1/2 bg-white p-8 rounded-lg shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <Users className="w-8 h-8 text-red-600" />
          <h3 className="text-2xl font-bold text-gray-900">
            {consultancy.title}
          </h3>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">{consultancy.description}</p>

          <div className="mt-6">
            <h4 className="font-semibold mb-3">Danışmanlık konuları</h4>
            <ul className="space-y-3">
              {Object.values(consultancy.subjects || {}).map((subject, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-xs text-red-600 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-gray-600">{subject}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <span className="inline-block bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium">
              {consultancy.slogan}
            </span>
          </div>
        </div>
      </div>

      {/* Tek sayılı kartlarda resim sağda */}
      {!isEven && (
        <div className="w-full md:w-1/2">
          <Image
            src={`/education-${index + 1}.jpg`}
            alt={consultancy.title}
            width={500}
            height={300}
            className="rounded-lg shadow-md object-cover h-[300px]"
          />
        </div>
      )}
    </div>
  );
};

const ConsultancyPage = () => {
  const consultan = [
    //-----1------
    {
      title: "Risk Analizi ve Değerlendirme",
      description:
        "Kuruluşun faaliyet alanına uygun potansiyel risklerin belirlenmesi için yapılan değerlendirme süreci.",
      subjects: {
        d1: "İlgili yer ve alanın belirlenmesi.",
        d2: "Risk seviyelerine göre önceliklendirme.",
      },
      icon: Users,
      slogan: "Riskleri Belirle, Hazırlığını Sağla!",
    },
    //-----2------
    {
      title: "Acil Durum Planlarının Hazırlanması",
      description:
        "Kriz durumlarında etkin bir yanıt için planların detaylandırılması.",
      subjects: {
        d1: "Tahliye planları.",
        d2: "Kriz yönetimi prosedürleri.",
        d3: "İletişim stratejileri ve alternatif çalışma yöntemleri.",
      },
      icon: Users,
      slogan: "Planla, Krize Hazır Ol!",
    },
    //-----3------
    {
      title: "Eğitim ve Farkındalık Çalışmaları",
      description:
        "Çalışanların acil durumlara karşı hazırlıklı olmasını sağlamak amacıyla verilen eğitimler.",
      subjects: {
        d1: "Düzenli acil durum eğitimleri.",
        d2: "Tatbikatlarla uygulamalı eğitim programları.",
        d3: "Kriz sırasında psikolojik dayanıklılığı artırıcı içerikler.",
      },
      icon: Users,
      slogan: "Eğit, Bilinçlendir, Koruma Sağla!",
    },
    //-------4-------
    {
      title: "Acil Durum Yönetim Sistemi Kurulumu",
      description: "Erken müdahale için gerekli sistemlerin entegre edilmesi.",
      subjects: {
        d1: "Erken uyarı sistemlerinin entegrasyonu.",
        d2: "Acil müdahale ekiplerinin organizasyonu.",
        d3: "Teknolojik altyapının güçlendirilmesi.",
      },
      icon: Users,
      slogan: "Güçlü Bir Sistem Kur, Etkili Müdahale Sağla!",
    },
    //----------5--------
    {
      title: "İzleme ve Geliştirme",
      description:
        "Hazırlanan acil durum planlarının sürekli olarak gözden geçirilmesi ve geliştirilmesi.",
      subjects: {
        d1: "Planların düzenli aralıklarla test edilmesi.",
        d2: "Güncel yasal gerekliliklere uyum sağlanması.",
        d3: "Yeni tehdit ve risklere uygun güncellemeler.",
      },
      icon: Users,
      slogan: "İzle, Geliştir, Güvenliği Artır!",
    },
    //----------6--------
    {
      title: "Hedef Kitle",
      description:
        "Kimlerin Acil Durum Danışmanlığı alması gerektiğini belirtir.",
      subjects: {
        d1: "İşletmeler ve fabrikalar için kaza önleme ve yangın risk yönetimi.",
        d2: "Okullar ve hastaneler için güvenlik sağlama.",
        d3: "Kamu kurumları ve şirketler için siber tehditlere karşı planlama.",
      },
      icon: Users,
      slogan: "Herkes İçin Güvenlik, Herkes İçin Danışmanlık!",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Header />
      {/* Services Section */}
      {/* Services Section */}
      <section id="1" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Danışmanlık Hizmetlerimiz
            </h2>
            <p className="text-xl text-gray-600">
              Detaylı ve profesyonel danışmanlık hizmetleri sunuyoruz
            </p>
          </div>

          <div className="space-y-16">
            {consultan.map((consultancy, index) => (
              <ConsultancyCard
                key={index}
                consultancy={consultancy}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ConsultancyPage;
