"use client";

import React, { useState, useEffect } from "react";
import {
  FlameKindling,
  Phone,
  Mail,
  Shield,
  GraduationCap,
  ClipboardCheck,
  Users,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const EducationCard = ({
  education,
  index,
}: {
  education: any;
  index: number;
}) => {
  const isEven = index % 2 === 0;

  return (
    <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
      {/* Çift sayılı indeksler için resim solda */}
      {isEven && (
        <div className="w-full md:w-1/2">
          <Image
            src={`/education-${index + 1}.jpg`}
            alt={education.title}
            width={500}
            height={300}
            className="rounded-lg shadow-md object-cover h-[300px]"
          />
        </div>
      )}

      {/* Card içeriği */}
      <div className="w-full md:w-1/2 bg-white p-8 rounded-lg shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <GraduationCap className="w-8 h-8 text-red-600" />
          <h3 className="text-2xl font-bold text-gray-900">
            {education.title}
          </h3>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">{education.description}</p>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Eğitim Detayları</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="font-medium">Süre:</span> {education.time}
              </li>
              <li className="flex items-center gap-2">
                <span className="font-medium">Dağılım:</span>{" "}
                {education.timepart}
              </li>
              <li className="flex items-center gap-2">
                <span className="font-medium">Konum:</span> {education.location}
              </li>
            </ul>
          </div>

          <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold mb-2">Kullanılan Ekipmanlar</h4>
            <p className="text-sm text-gray-600">{education.tools}</p>
          </div>

          <div className="mt-6">
            <span className="inline-block bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium">
              {education.slogan}
            </span>
          </div>
        </div>
      </div>

      {/* Tek sayılı indeksler için resim sağda */}
      {!isEven && (
        <div className="w-full md:w-1/2">
          <Image
            src={`/education-${index + 1}.jpg`}
            alt={education.title}
            width={500}
            height={300}
            className="rounded-lg shadow-md object-cover h-[300px]"
          />
        </div>
      )}
    </div>
  );
};

const EducationPage = () => {
  const educations = [
    //-----1--------
    {
      title: "Temel Yangın Güvenliği Eğitimi",
      time: "4 saat",
      timepart: "Teorik: 2 Saat | Uygulamalı: 2 Saat",
      location: "Şirketinizde veya bizim salonlarımızda.",
      tools:
        "Yangın söndürücüler, yangın alarm sistemi simülatörü, ilk yardım malzemeleri, eğitim broşürleri.",
      description:
        "Yangının tanımı, türleri, güvenlik ekipmanları ve acil durum prosedürleri.",
      icon: GraduationCap,
      slogan: "Temel Bilgilerle Güvenli Yaşam!",
    },
    //-----2--------
    {
      title: "Yangın Söndürme Eğitimi",
      time: "4 saat",
      timepart: "Teorik: 2 Saat | Uygulamalı: 2 Saat",
      location: "Şirketinizde veya bizim salonlarımızda.",
      tools:
        "Farklı tip yangın söndürücüler (ABC, CO2), yangın simülatörleri, koruyucu ekipman (eldiven, maske), eğitim materyalleri.",
      description:
        "Yangın söndürücü türleri, müdahale teknikleri ve ilk yardım uygulamaları.",
      icon: GraduationCap,
      slogan: "Yangına Anında Müdahale!",
    },
    //-----3--------
    {
      title: "İleri Seviye Yangın Güvenliği Eğitimi",
      time: "6 saat",
      timepart: "Teorik: 3 Saat | Uygulamalı: 3 Saat",
      location: "Şirketinizde veya bizim salonlarımızda.",
      tools:
        "Yangın yönetim yazılımları, risk değerlendirme şablonları, sunum ekipmanları (projektör, ekran), eğitim kitapları.",
      description:
        "Yangın yönetim sistemleri, risk analizi ve acil durum planlaması.",
      icon: GraduationCap,
      slogan: "TUzmanlık ile daha fazla guvenlik!",
    },
    //-----4--------
    {
      title: "Yangın Tatbikatı Eğitimi",
      time: "3 saat",
      timepart: "Teorik: 1 Saat | Uygulamalı: 2 Saat",
      location: "Şirketinizde veya bizim salonlarımızda.",
      tools:
        "Tatbikat senaryoları için simüle edilmiş yangın ekipmanları, zamanlayıcılar, iletişim cihazları, değerlendirme formları.",
      description:
        "Tatbikat senaryoları, acil durum yöneticilerinin rolleri ve çalışanların değerlendirilmesi.",
      icon: GraduationCap,
      slogan: "Gerçek Senaryolarla Hazırlık!",
    },
    //-----5--------
    {
      title: "Yangın Güvenliği Farkındalık Eğitimi",
      time: "2 saat",
      timepart: "Teorik: 1 Saat | Uygulamalı: 1 Saat",
      location: "Şirketinizde veya bizim salonlarımızda.",
      tools:
        "Eğitim broşürleri, posterler, sunum materyalleri, tartışma için not kartları.",
      description:
        "Yangın önleme yöntemleri ve güvenlik kültürünün oluşturulması.",
      icon: GraduationCap,
      slogan: "Farkındalık ile Önleme!",
    },
    //-----6--------
    {
      title: "Özel Durumlar için Yangın Güvenliği Eğitimi",
      time: "4 saat",
      timepart: "Teorik: 2 Saat | Uygulamalı: 2 Saat",
      location: "Şirketinizde veya bizim salonlarımızda.",
      tools:
        "Kimyasal yangın söndürücü simülatörleri, elektrik güvenliği ekipmanları, eğitim materyalleri ve senaryo şemaları.",
      description:
        "Kimyasal yangınlar, elektrik yangınları ve inşaat sektörü özel eğitimleri.",
      icon: GraduationCap,
      slogan: "Özel Eğitimi Al, Güvenliğini Artır!",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Header />
      {/* Educations Section */}

      <div className="min-h-screen bg-gray-50">
        <section id="1" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Eğitimlerimiz
              </h2>
              <p className="text-xl text-gray-600">
                Güvenliğiniz için kapsamlı eğitimler sunuyoruz
              </p>
            </div>

            <div className="space-y-16">
              {educations.map((education, index) => (
                <EducationCard
                  key={index}
                  education={education}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default EducationPage;
