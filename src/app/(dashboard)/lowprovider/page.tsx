import ProviderOfferChart from "@/components/ProviderOfferChart";
import ProviderLastOfferChart from "@/components/ProviderLastOfferChart";
import UserCard from "@/components/UserCard";
import ProviderMaintChart from "@/components/ProviderMaintChart";
import EventCalendar from "@/components/EventCalendar";
import Announcements from "@/components/Announcements";
import ProviderOfferChartContainer from "@/components/ProviderOfferChartContainer";

const LowProviderPage = () => {
  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full lg:w-2/3">
        {/* USER CARDS */}
        <div className="flex gap-4 justify-between flex-wrap">
              <UserCard type="tekliflerimm" link="/list/offers"/>
              <UserCard type="bekleyen" link="/list/offers"/>
              <UserCard type="yaklasanrandevularim" link="/list/events"/>
              <UserCard type="bakimlarimm" link="/list/maintenances"/>
        </div>
        {/* MIDDLE CHARTS */}
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* PROVİDER OFFER CHART */}
          <div className="w-full lg:w-1/3 h-[450px]">
            <ProviderOfferChartContainer />
          </div>
          {/* LAST OFFER CHART CHART */}
          <div className="w-full lg:w-2/3 h-[450px]">
            <ProviderLastOfferChart />
          </div>
        </div>

        {/* BOTTOM CHARTS */}
        <div className="w-full h-[500px]">
          <ProviderMaintChart />
        </div>
      </div>
      {/* RİGHT */}
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        <EventCalendar />
        <Announcements />
      </div>
    </div>
  );
};

export default LowProviderPage;
