"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { UserRole } from "@prisma/client";

// Dinamik form importları
const UserForm = dynamic(() => import("./forms/UserForm"), {
  loading: () => <p className="text-center py-4">Yükleniyor...</p>,
});

const CustomerForm = dynamic(() => import("./forms/CustomerForm"), {
  loading: () => <p className="text-center py-4">Yükleniyor...</p>,
});

const ProviderForm = dynamic(() => import("./forms/ProviderForm"), {
  loading: () => <p className="text-center py-4">Yükleniyor...</p>,
});

const DeviceForm = dynamic(() => import("./forms/DeviceForm"), {
  loading: () => <p className="text-center py-4">Yükleniyor...</p>,
});

const MaintenanceForm = dynamic(() => import("./forms/MaintenanceForm"), {
  loading: () => <p className="text-center py-4">Yükleniyor...</p>,
});

const NotificationForm = dynamic(() => import("./forms/NotificationForm"), {
  loading: () => <p className="text-center py-4">Yükleniyor...</p>,
});

const EventForm = dynamic(() => import("./forms/EventForm"), {
  loading: () => <p className="text-center py-4">Yükleniyor...</p>,
});

const OfferForm = dynamic(() => import("./forms/OfferForm"), {
  loading: () => <p className="text-center py-4">Yükleniyor...</p>,
});

const InstitutionForm = dynamic(() => import("./forms/InstitutionForm"), {
  loading: () => <p className="text-center py-4">Yükleniyor...</p>,
});

const PInstitutionForm = dynamic(() => import("./forms/PInstitutionForm"), {
  loading: () => <p className="text-center py-4">Yükleniyor...</p>,
});

const IsgMemberForm = dynamic(() => import("./forms/IsgMemberForms"), {
  loading: () => <p className="text-center py-4">Yükleniyor...</p>,
});

const LogForm = dynamic(() => import("./forms/LogForm"), {
  loading: () => <p className="text-center py-4">Yükleniyor...</p>,
});

const OfferRequestForm = dynamic(() => import("./forms/OfferRequestForm"), {
  loading: () => <p className="text-center py-4">Yükleniyor...</p>,
});

// Form bileşenlerini mapping objesi
const forms: {
  [key: string]: (
    type: "create" | "update",
    data?: any,
    currentUserRole?: UserRole,
    currentUserId?: string  // currentUserId parametresini ekledik
  ) => JSX.Element;
} = {
  user: (type, data, currentUserRole) => <UserForm type={type} data={data} currentUserRole={currentUserRole} />,
  customer: (type, data) => <CustomerForm type={type} data={data} />,
  provider: (type, data) => <ProviderForm type={type} data={data} />,
  device: (type, data, currentUserRole, currentUserId) => (
    <DeviceForm
      type={type}
      data={data}
      currentUserId={currentUserId || ''}
    />
  ),
  maintenance: (type, data) => <MaintenanceForm type={type} data={data} />,
  notification: (type, data, currentUserRole, currentUserId) => (
    <NotificationForm 
      type={type} 
      data={data} 
      currentUserId={currentUserId || ''} 
    />
  ),
  event: (type, data, currentUserRole, currentUserId) => (
    <EventForm 
      type={type} 
      data={data} 
      currentUserId={currentUserId || ''} 
    />
  ),
  offer: (type, data, currentUserRole, currentUserId) => (
    <OfferForm 
      type={type} 
      data={data} 
      currentUserId={currentUserId || ''} 
    />
  ),
  institution: (type, data) => <InstitutionForm type={type} data={data} />,
  pinstitution: (type, data) => <PInstitutionForm type={type} data={data} />,
  isgmember: (type, data) => <IsgMemberForm type={type} data={data} />,
  log: (type, data) => <LogForm type={type} data={data} />,
  offerRequest: (type, data, currentUserRole, currentUserId) => (
    <OfferRequestForm
      type={type}
      data={data}
      currentUserId={currentUserId || ''}
    />
  ),
};

type TableType =
  | "user"
  | "device"
  | "maintenance"
  | "offer"
  | "notification"
  | "event"
  | "customer"
  | "provider"
  | "institution"
  | "pinstitution"
  | "isgmember"
  | "log"
  | "result"
  | "attendance"
  | "event"
  | "announcement"
  | "offerRequest";

interface FormModalProps {
  table: TableType;
  type: "create" | "update" | "delete";
  data?: any;
  id?: string;
  currentUserRole?: UserRole;
  currentUserId?: string; // Yeni eklenen prop
  children?: React.ReactNode; // Bu satırı ekleyin

}

const FormModal = ({ table, type, data, id, currentUserRole, currentUserId }: FormModalProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // İkon boyutları ve renkler
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-lamaYellow"
      : type === "update"
        ? "bg-lamaSky"
        : "bg-lamaPurple";

  // Silme işlemi
  const handleDelete = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Endpoint ve URL yapısı mapping'i
      const endpointConfig: {
        [key: string]: {
          endpoint: string;
          usePathParam?: boolean;
        };
      } = {
        event: {
          endpoint: 'appointments',
          usePathParam: true
        },
        maintenance: {
          endpoint: 'maintenance-cards',
          usePathParam: false
        },
        notification: {
          endpoint: 'notifications',
          usePathParam: false
        },
        device: {
          endpoint: 'devices',
          usePathParam: false
        },
        institution: {
          endpoint: 'institutions',
          usePathParam: false
        },
        offer: {
          endpoint: 'offers',
          usePathParam: false
        },
        isgmember: {
          endpoint: 'isgMembers',
          usePathParam: false
        },
        user: {
          endpoint: 'users',
          usePathParam: false
        },
        customer: {
          endpoint: 'customers',
          usePathParam: false
        },
        provider: {
          endpoint: 'providers',
          usePathParam: false
        },
        pinstitution: {
          endpoint: 'pinstitutions',
          usePathParam: false
        },
        log: {
          endpoint: 'logs',
          usePathParam: false
        },

        offerRequest: {
          endpoint: 'offer-requests',  // Sadece burayı değiştirdik
          usePathParam: true          // Sadece burayı değiştirdik
        },
        // Diğer formlar için varsayılan yapı
        default: {
          endpoint: `${table}s`,
          usePathParam: false
        }
      };

      // Endpoint konfigürasyonunu al
      const config = endpointConfig[table] || endpointConfig.default;

      // URL'i oluştur
      const url = config.usePathParam
        ? `/api/${config.endpoint}/${id}`
        : `/api/${config.endpoint}?id=${id}`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Status 204 ise json parse etmeye çalışma
      if (response.status === 204) {
        toast.success("Başarıyla silindi");
        router.refresh();
        setOpen(false);
        return;
      }

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(responseData?.error || 'Silme işlemi başarısız oldu');
      }

      toast.success(responseData?.message || "Başarıyla silindi");
      router.refresh();
      setOpen(false);
    } catch (error: any) {
      console.error("Silme hatası:", error);
      toast.error(error.message || "Silme işlemi başarısız oldu");
    } finally {
      setLoading(false);
    }
  };

  // Silme formu
  const DeleteForm = () => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleDelete();
      }}
      className="p-4 flex flex-col gap-4"
    >
      <span className="text-center font-medium">
        Bu {table} kaydını silmek istediğinizden emin misiniz?
        <br />
        <span className="text-red-500 text-sm">
          Bu işlem geri alınamaz ve ilişkili tüm veriler silinecektir.
        </span>
      </span>
      <div className="flex gap-4 justify-center mt-4">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="bg-gray-400 text-white py-2 px-6 rounded-md hover:bg-gray-500 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          İptal
        </button>
        <button
          type="submit"
          className="bg-red-600 text-white py-2 px-6 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Siliniyor...
            </>
          ) : (
            "Sil"
          )}
        </button>
      </div>
    </form>
  );

  // Form seçimi
  const Form = () => {
    if (type === "delete" && id) {
      return <DeleteForm />;
    }

    if (type === "create" || type === "update") {
      return forms[table](type, data, currentUserRole, currentUserId);
    }

    return <p className="text-center text-red-500">Form bulunamadı!</p>;
  };

  return (
    <>
      <button
        className={`${size} flex items-center justify-center rounded-full ${bgColor} hover:opacity-90 transition-opacity`}
        onClick={() => setOpen(true)}
      >
        <Image src={`/${type}.png`} alt="" width={16} height={16} />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {type === "create"
                  ? ""
                  : type === "update"
                    ? "Kaydı Düzenle"
                    : "Kaydı Sil"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Image src="/close.png" alt="Kapat" width={14} height={14} />
              </button>
            </div>

            <div className="p-4">
              <Form />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;