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

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, FileCheck, BadgeCheck, HandshakeIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Services = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: "/1.jpg",
      title: "Yangın Güvenliğinde Profesyonel Çözümler",
      description: "İşletmeniz için eksiksiz yangın güvenlik sistemleri",
      buttonText: "Hemen Başlayın",
    },
    {
      image: "/2.jpg",
      title: "Uzman Eğitim Kadrosu",
      description: "Teorik ve uygulamalı yangın güvenlik eğitimleri",
      buttonText: "Eğitimleri İncele",
    },
    {
      image: "/3.jpg",
      title: "7/24 Teknik Destek",
      description: "Acil durumlarınızda yanınızdayız",
      buttonText: "Bize Ulaşın",
    },
  ];

  const services = [
    {
      title: "Yangın Güvenlik Sistemleri",
      description:
        "Modern yangın algılama ve söndürme sistemleri kurulumu ve bakımı",
      icon: Shield,
    },
    {
      title: "Güvenlik Eğitimleri",
      description:
        "Profesyonel eğitmenler eşliğinde teorik ve uygulamalı eğitimler",
      icon: GraduationCap,
    },
    {
      title: "Risk Analizi",
      description: "Detaylı risk değerlendirmesi ve güvenlik planlaması",
      icon: ClipboardCheck,
    },
    {
      title: "Acil Durum Danışmanlığı",
      description: "Acil durum ve tahliye planları oluşturma",
      icon: Users,
    },
  ];

  // Otomatik slider geçişi
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000); // Her 5 saniyede bir değişim

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Header />
      {/* Services Section */}
      {/* Services Section */}
      <section id="1" className="p-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Ana Başlık ve Giriş */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-red-600 mb-6">
              Firesafe Danışmanlık, Eğitim ve Yazılım
            </h1>
            <p className="text-gray-600 leading-relaxed mb-6">
              Firesafe Danışmanlık, Eğitim ve Yazılım, yangın güvenliği ve acil
              durum yönetimi alanında uzmanlaşmış, yenilikçi çözümler sunan bir
              firmadır. Kuruluşumuz, işletmelerin ve bireylerin güvenliğini en
              üst düzeyde sağlamak için danışmanlık, eğitim ve teknoloji
              hizmetlerini bir araya getirmektedir.
            </p>
          </div>

          {/* Misyon */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-red-600 mb-4">
              Misyonumuz
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Yangın ve acil durumlara karşı proaktif bir yaklaşım geliştirerek,
              can ve mal kayıplarını en aza indirmek ve güvenlik standartlarını
              yükseltmektir. Bu doğrultuda, dünya standartlarına uygun ürün ve
              hizmetlerle müşterilerimize etkin ve sürdürülebilir çözümler
              sunuyoruz.
            </p>
          </div>

          {/* Hizmetlerimiz */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-red-600 mb-4">
              Hizmetlerimiz
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-red-600 mb-2">
                  Yangın Güvenliği Danışmanlığı
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  İşletmelere özel yangın risk analizi ve yönetimi, yangın
                  güvenlik sistemlerinin tasarımı ve denetimi.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-red-600 mb-2">
                  Eğitim Programları
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Yangın önleme ve müdahale eğitimi, acil durum ve tahliye
                  tatbikatları, çalışan farkındalığını artırmaya yönelik
                  sertifikalı eğitimler.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-red-600 mb-2">
                  Yazılım Çözümleri
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Yangın güvenlik yönetim sistemleri, acil durum senaryoları
                  için özel yazılım çözümleri, dijital izleme ve raporlama
                  araçları.
                </p>
              </div>
            </div>
          </div>

          {/* Neden Firesafe */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-red-600 mb-4">
              Neden Firesafe?
            </h2>
            <ul className="list-disc list-inside space-y-3 text-gray-600">
              <li className="leading-relaxed">
                <span className="font-medium">Uzman Kadro:</span> Alanında
                deneyimli mühendisler, eğitmenler ve yazılım uzmanlarından
                oluşan bir ekip.
              </li>
              <li className="leading-relaxed">
                <span className="font-medium">Kapsamlı Çözümler:</span>{" "}
                Danışmanlık, eğitim ve yazılım entegrasyonu ile 360 derece
                güvenlik hizmeti.
              </li>
              <li className="leading-relaxed">
                <span className="font-medium">Yenilikçi Yaklaşım:</span>{" "}
                Teknolojiyi güvenlik çözümlerine entegre eden modern
                uygulamalar.
              </li>
              <li className="leading-relaxed">
                <span className="font-medium">Yasal Uyum:</span> Ulusal ve
                uluslararası standartlara uygun süreç yönetimi.
              </li>
            </ul>
          </div>

          {/* Vizyonumuz */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-red-600 mb-4">
              Vizyonumuz
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Fire Safe olarak, yangın güvenliği ve acil durum yönetimi alanında
              lider bir marka olmayı hedefliyoruz. Teknoloji ve insan odaklı
              çözümlerimizle, güvenliği bir adım öteye taşımayı ve yaşam
              alanlarını daha güvenli hale getirmeyi amaçlıyoruz.
            </p>
          </div>

          {/* Değerlerimiz */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-red-600 mb-4">
              Değerlerimiz
            </h2>
            <ul className="list-disc list-inside space-y-3 text-gray-600">
              <li className="leading-relaxed">
                <span className="font-medium">Güvenilirlik:</span> Her projede
                müşterilerimize güven veren sonuçlar sunarız.
              </li>
              <li className="leading-relaxed">
                <span className="font-medium">Sürdürülebilirlik:</span> Uzun
                vadeli çözümlerle çevre ve toplum için değer yaratırız.
              </li>
              <li className="leading-relaxed">
                <span className="font-medium">İnovasyon:</span> Sürekli gelişim
                ve teknoloji odaklı yaklaşımlarla sektöre yön veririz.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;
