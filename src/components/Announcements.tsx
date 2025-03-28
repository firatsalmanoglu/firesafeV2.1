// components/Announcements.tsx
import prisma from "@/lib/prisma";
import AnnouncementCard from "./AnnouncementCard";

const Announcements = async () => {
  const data = await prisma.announcements.findMany({
    take: 3,
    orderBy: { date: "desc" },
  });

  return (
    <div className="bg-white p-4 rounded-md">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Duyurular</h1>
        <span className="text-xs text-gray-400">Hepsi</span>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {data.map((announcement, index) => (
          <AnnouncementCard
            key={announcement.id}
            title={announcement.title}
            date={announcement.date}
            description={announcement.description}
            className={index % 2 === 0 ? "bg-lamaSkyLight" : "bg-lamaPurpleLight"}
          />
        ))}
      </div>
    </div>
  );
};

export default Announcements;