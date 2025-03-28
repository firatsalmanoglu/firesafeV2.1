import prisma from "@/lib/prisma"

const EventList = async ({ dateParam } : { dateParam: string | undefined}) => {
    // Gelen tarihi doğru parse etme
    const date = dateParam ? new Date(dateParam) : new Date();

    if (isNaN(date.getTime())) {
        console.error("Geçersiz bir tarih: ", dateParam);
        return []; 
    }

    // Günün başlangıç ve bitiş saatlerini ayarlama
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0); 

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999); 

    console.log('Start of Day:', startOfDay);
    console.log('End of Day:', endOfDay);
    console.log('Seçilen tarih:', date);

    const data = await prisma.appointments.findMany({
        where: {
            start: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
    });

    return data.map((event) => (
        <div
            className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-firered even:border-t-firelightorange"
            key={event.id}
        >
              <div className="flex items-center justify-between">
                <h1 className="font-semibold text-gray-600">{event.tittle}</h1>
                <span className="text-gray-300 text-xs">
                    {event.start.toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                    })}
                </span>
              </div>
              <p className="mt-2 text-gray-400 text-sm">{event.content}</p>
            </div>
          ));
};
    
export default EventList