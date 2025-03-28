"use client";

import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState, useEffect } from "react";
import { Appointments } from "@prisma/client";

interface Props {
  userId?: string;
  institutionId?: string;
}

interface AppointmentWithRelations extends Appointments {
  creator?: {
    name: string;
    
  };
  recipient?: {
    name: string;
  };
  creatorIns?: {
    name: string;
  };
  recipientIns?: {
    name: string;
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description: string;
  creator?: {
    name: string;
  };
  recipient?: {
    name: string;
  };
}

const localizer = momentLocalizer(moment);

const BigCalendar = ({ userId, institutionId }: Props) => {
  const [view, setView] = useState<View>(Views.WORK_WEEK);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);

        // URL'yi oluştur
        const url = userId 
          ? `/api/appointments?userId=${userId}`
          : `/api/appointments?institutionId=${institutionId}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Randevular getirilemedi');
        }

        const appointments: AppointmentWithRelations[] = await response.json();
        
        const formattedEvents = appointments.map((appointment): CalendarEvent => {
          // Tarihleri doğru şekilde işleme
          const startDate = new Date(appointment.start);
          const endDate = new Date(appointment.end);
          
          // Saat dilimi farkını düzeltme - 3 saat geri alıyoruz (milisaniye cinsinden)
          startDate.setTime(startDate.getTime() - (3 * 60 * 60 * 1000));
          endDate.setTime(endDate.getTime() - (3 * 60 * 60 * 1000));
          
          return {
            id: appointment.id,
            title: `${appointment.tittle} - ${appointment.creator?.name || 'Kullanıcı'} ile ${appointment.recipient?.name || 'Kullanıcı'}`,
            start: startDate,
            end: endDate,
            description: `${appointment.content}\n\nOluşturan: ${appointment.creator?.name} \nKatılımcı: ${appointment.recipient?.name} \nKurum: ${appointment.creatorIns?.name}`,
            creator: appointment.creator,
            recipient: appointment.recipient
          };
        });

        setEvents(formattedEvents);
      } catch (error) {
        console.error("Randevular yüklenirken hata oluştu:", error);
        setError('Randevular yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [userId, institutionId]);

  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: '#4a90e2',
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Yükleniyor...</div>;
  }

  if (error) {
    return <div className="text-red-500 flex items-center justify-center h-full">{error}</div>;
  }

  const messages = {
    today: 'Bugün',
    previous: 'Önceki',
    next: 'Sonraki',
    month: 'Ay',
    week: 'Hafta',
    work_week: 'Çalışma Haftası',
    day: 'Gün',
    agenda: 'Ajanda',
    date: 'Tarih',
    time: 'Zaman',
    event: 'Randevu',
    noEventsInRange: 'Bu aralıkta randevu bulunmuyor.',
  };

  return (
    <div className="h-full w-full">
      {events.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          Görüntülenecek randevu bulunmuyor
        </div>
      ) : (
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          views={["work_week", "day"]}
          view={view}
          style={{ height: "98%" }}
          onView={handleOnChangeView}
          min={new Date(2020, 1, 0, 8, 0, 0)}
          max={new Date(2025, 1, 0, 17, 0, 0)}
          tooltipAccessor={(event) => event.description}
          eventPropGetter={eventStyleGetter}
          messages={messages}
          popup
          selectable
          className="bg-white rounded-lg shadow-sm"
        />
      )}
    </div>
  );
};

export default BigCalendar;