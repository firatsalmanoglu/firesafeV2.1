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

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const platformFeatures = [
    {
      title: "Hizmet Alan Firmalar İçin",
      features: [
        "Çoklu teklif alma ve karşılaştırma",
        "Hizmet sağlayıcı değerlendirmeleri",
        "Online sözleşme yönetimi",
        "Proje takip sistemi",
        "Ödeme güvence sistemi",
      ],
    },
    {
      title: "Hizmet Veren Firmalar İçin",
      features: [
        "İhale ve proje fırsatları",
        "Müşteri portföyü yönetimi",
        "Otomatik teklif hazırlama",
        "Sözleşme şablonları",
        "Tahsilat takibi",
      ],
    },
  ];

  const howItWorks = [
    {
      title: "Üyelik ve Profil",
      description: "Firmanızı platforma ekleyin ve profilinizi oluşturun",
      icon: Building2,
    },
    {
      title: "Teklif Süreci",
      description: "Hizmet ilanı verin veya mevcut ilanlara teklif gönderin",
      icon: FileCheck,
    },
    {
      title: "Sözleşme",
      description: "Online sözleşme oluşturun ve güvenli imzalayın",
      icon: HandshakeIcon,
    },
    {
      title: "Proje Takibi",
      description: "Projelerinizi platform üzerinden yönetin",
      icon: BadgeCheck,
    },
  ];

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

  return (
    <div className="min-h-screen bg-white">
      <Header />
      {/* Services Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Hizmetlerimiz</h2>
            <p className="mt-4 text-gray-500">
              Güvenliğiniz için kapsamlı çözümler sunuyoruz
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <service.icon className="w-12 h-12 text-red-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900">
                  {service.title}
                </h3>
                <p className="mt-2 text-gray-500">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/*Platform hakkinda */}
      <div className="min-h-screen bg-white">
        {/* Existing Navigation remains same */}

        {/* Existing Slider remains same */}

        {/* Platform Features */}
        <div className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900">
                Firesafe V1.0 Platform Özellikleri
              </h2>
              <p className="mt-4 text-gray-500">
                Her iki taraf için de avantajlı çözümler
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {platformFeatures.map((section, idx) => (
                <Card key={idx} className="p-6">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {section.features.map((feature, featureIdx) => (
                        <li
                          key={featureIdx}
                          className="flex items-center gap-2"
                        >
                          <div className="h-2 w-2 bg-red-600 rounded-full" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900">
                Nasıl Çalışır?
              </h2>
              <p className="mt-4 text-gray-500">
                4 basit adımda hizmet alın veya verin
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {howItWorks.map((step, idx) => (
                <div key={idx} className="text-center">
                  <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <step.icon className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-500">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-red-600 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Hemen Platforma Katılın
            </h2>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              İster hizmet alın, ister hizmet verin. Firesafe B2B platformu ile
              tüm yangın güvenliği ihtiyaçlarınızı karşılayın.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href={"/admin"}>
                <Button variant="secondary" size="lg">
                  Hizmet Almak İstiyorum
                </Button>
              </Link>
              <Link href={"/admin"}>
                <Button variant="secondary" size="lg">
                  Hizmet Vermek İstiyorum
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Existing Stats Section */}

        {/* Trust Indicators */}
        <div className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900">
                Neden Firesafe?
              </h2>
              <p className="mt-4 text-gray-500">
                Güvenilir ve profesyonel hizmet platformu
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6">
                <CardHeader>
                  <Shield className="w-12 h-12 text-red-600 mb-4" />
                  <CardTitle>Güvenli Ödeme</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">
                    Ödemeleriniz proje tamamlanana kadar güvende tutulur ve
                    garantilenir.
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardHeader>
                  <BadgeCheck className="w-12 h-12 text-red-600 mb-4" />
                  <CardTitle>Lisanslı Firmalar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">
                    Tüm hizmet sağlayıcılar detaylı bir doğrulama sürecinden
                    geçer.
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardHeader>
                  <FileCheck className="w-12 h-12 text-red-600 mb-4" />
                  <CardTitle>Yasal Güvence</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">
                    Hukuki açıdan güvenli sözleşme şablonları ve anlaşmazlık
                    çözümü.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Existing Footer */}
      </div>

      {/* Stats Section */}
      {/* <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-red-600">1000+</div>
              <div className="mt-2 text-gray-500">Tamamlanan Proje</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-600">5000+</div>
              <div className="mt-2 text-gray-500">Eğitilen Personel</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-600">15+</div>
              <div className="mt-2 text-gray-500">Yıllık Tecrübe</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-600">24/7</div>
              <div className="mt-2 text-gray-500">Teknik Destek</div>
            </div>
          </div>
        </div>
      </div> */}
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
