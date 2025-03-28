"use client";

import React from "react";
import { ClipboardCheck } from "lucide-react";

import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Subject {
  d1: string;
  d2: string;
  d3?: string;
}

interface Analysis {
  title: string;
  description: string;
  subjects: Subject;
  icon: any;
  slogan: string;
}

const AnalysisCard = ({
  analysis,
  index,
}: {
  analysis: Analysis;
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
            alt={analysis.title}
            width={500}
            height={300}
            className="rounded-lg shadow-md object-cover h-[300px]"
          />
        </div>
      )}

      {/* Kart içeriği */}
      <div className="w-full md:w-1/2 bg-white p-8 rounded-lg shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <ClipboardCheck className="w-8 h-8 text-red-600" />
          <h3 className="text-2xl font-bold text-gray-900">{analysis.title}</h3>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">{analysis.description}</p>

          <div className="mt-6">
            <h4 className="font-semibold mb-3">Analiz Adımları</h4>
            <ul className="space-y-3">
              {Object.values(analysis.subjects || {}).map((subject, idx) => (
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
              {analysis.slogan}
            </span>
          </div>
        </div>
      </div>

      {/* Tek sayılı kartlarda resim sağda */}
      {!isEven && (
        <div className="w-full md:w-1/2">
          <Image
            src={`/education-${index + 1}.jpg`}
            alt={analysis.title}
            width={500}
            height={300}
            className="rounded-lg shadow-md object-cover h-[300px]"
          />
        </div>
      )}
    </div>
  );
};

const AnalysisPage = () => {
  const analyses = [
    //-----1------
    {
      title: "Hazırlık ve Planlama",
      description:
        "Yangın risk analizine başlamadan önce gerekli hazırlıklar yapılmasi.",
      subjects: {
        d1: "İlgili yer ve alanın belirlenmesi.",
        d2: "Kapsamın tanımlanması; yangın güvenlik önlemleri.",
        d3: "Tahliye planlari.",
      },
      icon: ClipboardCheck,
      slogan: "Planla, Güvenliği Sağla!",
    },
    //-----2------
    {
      title: "Tehlikelerin Belirlenmesi",
      description:
        "Yangın riski oluşturabilecek tüm faktörler tespit edilmesi.",
      subjects: {
        d1: "Yangın kaynakları (elektrik arızaları, kimyasal maddeler).",
        d2: "Yanıcı maddeler (kağıt, ahşap, kimyasallar).",
        d3: "Elektrik tesisatları ve yapısal özellikler.",
      },
      icon: ClipboardCheck,
      slogan: "Tehlikeyi Tanımla, Güvenliği Artır!",
    },
    //-----3------
    {
      title: "Risk Değerlendirmesi",
      description: "Belirlenen tehlikelerin risk düzeyleri değerlendirilmesi.",
      subjects: {
        d1: "Olasılık: Yangın çıkma olasılığı.",
        d2: "Etkiler: Yangın çıktığında doğacak olumsuz etkiler (can ve mal kaybı).",
        d3: "Risk Düzeyi: Olasılık ve etkilerin birleştirilmesiyle hesaplanmasi",
      },
      icon: ClipboardCheck,
      slogan: "Riski Değerlendir, Önlemleri Belirle!",
    },
    //-------4-------
    {
      title: "Riskin Kontrolü ve Azaltılması",
      description:
        "Belirlenen risklerin kontrol altına alınması için önlemler alınmasi.",
      subjects: {
        d1: "Yangın öncesi, sırasında ve sonrasında alınacak önlemler.",
        d2: "Yangına sebep olabilecek maddelerin bakımı. ",
        d3: "Tahliye planlarının uygulanabilirliği.",
      },
      icon: ClipboardCheck,
      slogan: "Kontrol Sağla, Güvenliği Artır!",
    },
    //----------5--------
    {
      title: "İzleme ve Gözden Geçirme.",
      description: "Yangın risk analizi, sürekli olarak gözden geçirilir.",
      subjects: {
        d1: "Yeni tehlikelerin belirlenmesi.",
        d2: "Güvenlik önlemlerinin güncellenmesi.",
      },
      icon: ClipboardCheck,
      slogan: "Sürekli İzle, Güvenliği Yenile!",
    },
    //----------6--------
    {
      title: "Eğitim ve Tatbikat.",
      description:
        "Çalışanlar ve diğer bireyler için yangın eğitimi ve tatbikatları düzenlenir.",
      subjects: {
        d1: "Yangın tatbikatlarının planlanması ve uygulanması.",
        d2: "Yangın güvenliği bilincinin artırılması.",
      },
      icon: ClipboardCheck,
      slogan: "Eğit, Tatbikatla Pekiştir, Güvenliği Sağla!",
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
              Yangın Risk Analizi Süreçlerimiz
            </h2>
            <p className="text-xl text-gray-600">
              Detaylı ve profesyonel yangın risk analizi hizmetleri sunuyoruz
            </p>
          </div>

          <div className="space-y-16">
            {analyses.map((analysis, index) => (
              <AnalysisCard key={index} analysis={analysis} index={index} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AnalysisPage;
