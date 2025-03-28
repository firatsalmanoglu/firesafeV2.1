import UserCard from "@/components/UserCard";
import CountChart from "@/components/CountChart";
import OfferChart from "@/components/OfferChart";
import LogChart from "@/components/LogChart";
import EventCalendar from "@/components/EventCalendar";
import Announcements from "@/components/Announcements";
import CountChartContainer from "@/components/CountChartContainer";
import OfferChartContainer from "@/components/OfferChartContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import { auth } from "@/auth";

const AdminPage = async ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {
  const session = await auth();
  console.log(session?.user.role);
  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full lg:w-2/3">
        {/* USER CARDS */}
        <div className="flex gap-4 justify-between flex-wrap">
          <UserCard type="teklifler" link="/list/offers" />
          <UserCard type="bakimlar" link="/list/maintenances" />
          <UserCard type="cihazlar" link="/list/devices" />
          <UserCard type="randevular" link="/list/events" />
        </div>
        {/* MIDDLE CHARTS */}
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* COUNT CHART */}
          <div className="w-full lg:w-1/3 h-[450px]">
            <CountChartContainer />
          </div>
          {/* OFFER CHART */}
          <div className="w-full lg:w-2/3 h-[450px]">
            <OfferChartContainer />
          </div>
        </div>

        {/* BOTTOM CHARTS */}
        <div className="w-full h-[500px]">
          <LogChart />
        </div>
      </div>
      {/* RİGHT */}
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        <EventCalendarContainer searchParams={searchParams} />
        <Announcements />
      </div>
    </div>
  );
};

export default AdminPage;
