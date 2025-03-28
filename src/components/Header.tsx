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
import { FaWhatsapp } from "react-icons/fa6";
import { useRouter } from "next/navigation";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: "/1.jpg",
      title: "Yangın Güvenliğinde Profesyonel Çözümler",
      description: "İşletmeniz için eksiksiz yangın güvenlik sistemleri",
      buttonText: "Hemen Başlayın",
      href: "#",
    },
    {
      image: "/2.jpg",
      title: "Uzman Eğitim Kadrosu",
      description: "Teorik ve uygulamalı yangın güvenlik eğitimleri",
      buttonText: "Eğitimleri İncele",
      href: "/landpage/education",
    },
    {
      image: "/3.jpg",
      title: "7/24 Teknik Destek",
      description: "Acil durumlarınızda yanınızdayız",
      buttonText: "Bize Ulaşın",
      href: "#",
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

  const router = useRouter();

  const handleClick = async () => {
    // Check if WhatApp installed, if yes open whatsapp else open whatsapp web

    if (navigator.userAgent.includes("WhatsApp")) {
      // WhatsApp is installed
      window.open(`whatsapp://send?phone=+905521123668`);
      //window.open("https://web.whatsapp.com/send?phone=05521123668", "_blank");
    } else {
      // WhatsApp is not installed, open WhatsApp Web
      window.open("https://wa.me/+905521123668", "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link
                href="/"
                className="flex items-center justify-center lg:justify-start gap-2"
              >
                <Image src="/logo.png" alt="logo" width={200} height={200} />
                {/* <span>SchoolLama</span> */}
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="flex space-x-8">
                <a href="/" className="text-gray-700 hover:text-red-600">
                  Ana Sayfa
                </a>
                <a
                  href="/landpage/services/#1"
                  className="text-gray-700 hover:text-red-600"
                >
                  Hizmetler
                </a>
                <a
                  href="/landpage/education/#1"
                  className="text-gray-700 hover:text-red-600"
                >
                  Eğitimler
                </a>
                <a
                  href="/landpage/analytics#1"
                  className="text-gray-700 hover:text-red-600"
                >
                  Analizler
                </a>
                <a
                  href="/landpage/consultancy#1"
                  className="text-gray-700 hover:text-red-600"
                >
                  Danismanlik
                </a>
                <a
                  href="/landpage/about#1"
                  className="text-gray-700 hover:text-red-600"
                >
                  Hakkimizda
                </a>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <a
                href="https://wa.me/+905521123668"
                className="flex items-center text-black-600 font-semibold"
                target="_blank"
              >
                <FaWhatsapp color="green" className="w-7 h-7 md:w-10 md:h-10" />
                +90 552 112 36 68
              </a>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a
                href="/"
                className="block px-3 py-2 text-gray-700 hover:text-red-600"
              >
                Ana Sayfa
              </a>
              <a
                href="/landpage/services/#1"
                className="block px-3 py-2 text-gray-700 hover:text-red-600"
              >
                Hizmetler
              </a>
              <a
                href="/landpage/education/#1"
                className="block px-3 py-2 text-gray-700 hover:text-red-600"
              >
                Eğitimler
              </a>
              <a
                href="/landpage/analytics#1"
                className="block px-3 py-2 text-gray-700 hover:text-red-600"
              >
                Analizler
              </a>
              <a
                href="/landpage/consultancy#1"
                className="block px-3 py-2 text-gray-700 hover:text-red-600"
              >
                Danismanlik
              </a>
              <a
                href="/landpage/about#1"
                className="block px-3 py-2 text-gray-700 hover:text-red-600"
              >
                Hakkimizda
              </a>
            </div>
          </div>
        )}
      </nav>
      {/* Full Screen Slider */}
      <div className="relative h-screen">
        {/* Slider Images */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0 bg-black/50 z-10" />{" "}
            {/* Overlay */}
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            {/* Slide Content */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="text-center text-white px-4">
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  {slide.title}
                </h1>
                <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
                  {slide.description}
                </p>
                <Link href={slide.href}>
                  <button className="px-8 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                    {slide.buttonText}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Slider Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/30 hover:bg-white/50 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/30 hover:bg-white/50 transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Slider Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
