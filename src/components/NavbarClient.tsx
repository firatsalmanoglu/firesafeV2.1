"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

// Session tipi
type NavbarClientProps = {
  userName?: string | null;
  userRole?: string | null;
  userId?: string | null;
};

export default function NavbarClient({ userName, userRole, userId }: NavbarClientProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  // Kullanıcının okunmamış bildirimlerini getir
  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      if (!userId) {
        console.log("UserId bulunamadı, bildirimler çekilemiyor.");
        return;
      }

      try {
        // Okunmamış bildirimler için oluşturduğumuz yeni endpoint'i kullan
        const response = await fetch(`/api/notifications/unread/${userId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setUnreadCount(data.count || 0);
      } catch (error) {
        console.error("Okunmamış bildirimler alınırken hata oluştu:", error);
        setUnreadCount(0);
      }
    };

    fetchUnreadNotifications();
    
    // Bildirimleri belirli aralıklarla güncelle
    const interval = setInterval(fetchUnreadNotifications, 60000); // Her 1 dakikada bir güncelle
    
    return () => clearInterval(interval);
  }, [userId]);

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className='flex items-center gap-6 justify-end w-full'>
      {/* Duyuru ikonu - Dinamik bildirim sayısı */}
      <div 
        className='bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative'
        onClick={() => router.push('/list/notifications')}
      >
        <Image src="/announcement.png" alt="" width={20} height={20} />
        {unreadCount > 0 && (
          <div className='absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs'>
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
      </div>
      
      <div className='flex flex-col'>
        <span className="text-xs leading-3 font-medium">{userName}</span>
        <span className="text-[10px] text-gray-500 text-right">{userRole}</span>
      </div>
      
      {/* Avatar ve Açılır Menü */}
      <div className="relative">
        <Image 
          src="/avatar.png" 
          alt="" 
          width={36} 
          height={36} 
          className="rounded-full cursor-pointer" 
          onClick={toggleMenu}
        />
        
        {/* Açılır Menü */}
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1" role="menu" aria-orientation="vertical">
              <button
                onClick={handleSettings}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                Ayarlar
              </button>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}