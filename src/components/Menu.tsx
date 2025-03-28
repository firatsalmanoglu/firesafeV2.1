import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";

// Role mapping yardımcı fonksiyonu
const mapRolesToUserRoles = (roles: string[]): UserRole[] => {
  const roleMap: { [key: string]: UserRole } = {
    admin: UserRole.ADMIN,
    guest: UserRole.GUEST,
    provider: UserRole.HIZMETSAGLAYICI_SEVIYE1,
    lowprovider: UserRole.HIZMETSAGLAYICI_SEVIYE2,
    customer: UserRole.MUSTERI_SEVIYE1,
    lowcustomer: UserRole.MUSTERI_SEVIYE2,
  };

  return roles
    .map((role) => roleMap[role])
    .filter((role) => role !== undefined);
};

// Dashboard URL'ini role göre belirleme
const getDashboardUrl = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
      return "/admin";
    case UserRole.HIZMETSAGLAYICI_SEVIYE1:
      return "/provider";
    case UserRole.HIZMETSAGLAYICI_SEVIYE2:
      return "/lowprovider";
    case UserRole.MUSTERI_SEVIYE1:
      return "/customer";
    case UserRole.MUSTERI_SEVIYE2:
      return "/lowcustomer";
    default:
      return "/"; // Varsayılan olarak ana sayfaya yönlendir
  }
};

const Menu = async () => {
  const session = await auth();
  const currentUserRole = session?.user?.role as UserRole;

  // Dashboard URL'ini kullanıcının rolüne göre belirle
  const dashboardUrl = getDashboardUrl(currentUserRole);

  // Rol kontrolü için yardımcı fonksiyon
  const isVisible = (allowedRoles: string[]) => {
    const mappedRoles = mapRolesToUserRoles(allowedRoles);
    return mappedRoles.includes(currentUserRole);
  };

  // Session kontrolü ekleyelim
  if (!session || !currentUserRole) {
    return null;
  }

  // Menü öğelerini oluştur (Dashboard URL'i dinamik olacak)
  const menuItems = [
    {
      title: "MENU",
      items: [
        {
          icon: "/home.png",
          label: "Anasayfa",
          href: "/",
          visible: [
            "admin",
            "provider",
            "customer",
            "lowcustomer",
            "lowprovider",
          ],
        },
        {
          icon: "/user.png",
          label: "Dashboard",
          href: dashboardUrl, // Dinamik URL kullan
          visible: [
            "admin",
            "provider",
            "customer",
            "lowcustomer",
            "lowprovider",
          ],
        },
        {
          icon: "/user.png",
          label: "Kullanıcılar",
          href: "/list/users",
          visible: [
            "admin",
            "provider",
            "customer",
            "lowcustomer",
            "lowprovider",
          ],
        },

        {
          icon: "/user.png",
          label: "ISG Uzmanları",
          href: "/list/isgmembers",
          visible: [
            "admin",
            "provider",
            "customer",
            "lowcustomer",
            "lowprovider",
          ],
        },
        {
          icon: "/user.png",
          label: "Kurumlar",
          href: "/list/institutions",
          visible: [
            "admin",
            "provider",
            "customer",
            "lowcustomer",
            "lowprovider",
          ],
        },
        {
          icon: "/fire-extinguisher.png",
          label: "Yangın Güvenlik Önlemleri",
          href: "/list/devices",
          visible: [
            "admin",
            "provider",
            "customer",
            "lowcustomer",
            "lowprovider",
          ],
        },
        {
          icon: "/offer.png",
          label: "Teklif Talepleri",
          href: "/list/offerRequests",
          visible: ["admin", "provider", "customer"],
        },
        {
          icon: "/offer.png",
          label: "Teklifler",
          href: "/list/offers",
          visible: ["admin", "provider", "customer"],
        },
        {
          icon: "/maintenance.png",
          label: "Bakımlar",
          href: "/list/maintenances",
          visible: [
            "admin",
            "provider",
            "customer",
            "lowcustomer",
            "lowprovider",
          ],
        },
        {
          icon: "/calendar.png",
          label: "Randevular",
          href: "/list/events",
          visible: [
            "admin",
            "provider",
            "customer",
            "lowcustomer",
            "lowprovider",
          ],
        },
        {
          icon: "/announcement.png",
          label: "Bildirimler",
          href: "/list/notifications",
          visible: [
            "admin",
            "provider",
            "customer",
            "lowcustomer",
            "lowprovider",
          ],
        },
        {
          icon: "/report.png",
          label: "Raporlama",
          href: "/list/classes",
          visible: [
            "admin",
            "provider",
            "customer",
            "lowcustomer",
            "lowprovider",
          ],
        },
      ],
    },
    {
      title: "DİĞER",
      items: [
        {
          icon: "/profile.png",
          label: "Profil",
          href: "/list/users",
          visible: [
            "admin",
            "provider",
            "customer",
            "lowcustomer",
            "lowprovider",
          ],
        },
        {
          icon: "/setting.png",
          label: "Ayarlar",
          href: "/settings",
          visible: [
            "admin",
            "provider",
            "customer",
            "lowcustomer",
            "lowprovider",
          ],
        },
        {
          icon: "/support.png",
          label: "Geri Bildirim ve Destek",
          href: "/settings",
          visible: [
            "admin",
            "provider",
            "customer",
            "lowcustomer",
            "lowprovider",
          ],
        },
        {
          icon: "/log.png",
          label: "Loglar",
          href: "/list/logs",
          visible: ["admin"],
        },
        {
          icon: "/logout.png",
          label: "Çıkış",
          href: "/logout",
          visible: [
            "admin",
            "guest",
            "provider",
            "customer",
            "lowcustomer",
            "lowprovider",
          ],
        },
      ],
    },
  ];

  return (
    <div className="mt-4 text-sm">
      {menuItems.map((i) => (
        <div className="flex flex-col gap-2" key={i.title}>
          <span className="hidden lg:block text-gray-400 font-light my-4">
            {i.title}
          </span>
          {i.items.map((item) => {
            if (isVisible(item.visible)) {
              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight"
                >
                  <Image src={item.icon} alt="" width={20} height={20} />
                  <span className="hidden lg:block">{item.label}</span>
                </Link>
              );
            }
            return null;
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;