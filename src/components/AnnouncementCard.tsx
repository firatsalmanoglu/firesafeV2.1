// components/AnnouncementCard.tsx
"use client";
import { useRouter } from "next/navigation";

interface AnnouncementCardProps {
  title: string;
  date: Date;
  description: string;
  className: string;
}

const AnnouncementCard = ({ title, date, description, className }: AnnouncementCardProps) => {
  const router = useRouter();

  const extractRequestId = (description: string) => {
    const match = description.match(/\(Talep ID: (.*?)\)/);
    return match ? match[1] : null;
  };

  const handleClick = () => {
    const requestId = extractRequestId(description);
    if (requestId) {
      router.push(`/list/offerRequests/${requestId}`);
    }
  };

  return (
    <div 
      className={`${className} rounded-md p-4 cursor-pointer hover:opacity-90 transition-opacity`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{title}</h2>
        <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
          {new Intl.DateTimeFormat("tr-TR").format(date)}
        </span>
      </div>
      <p className="text-sm text-black-400 mt-1">{description}</p>
    </div>
  );
};

export default AnnouncementCard;