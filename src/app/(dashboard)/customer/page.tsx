import Announcements from "@/components/Announcements"
import CustomerExtingChart from "@/components/CustomerExtingChart"
import CustomerExtingChartContainer from "@/components/CustomerExtingChartContainer"
import CustomerLastMaintChart from "@/components/CustomerLastMaintChart"
import EventCalendar from "@/components/EventCalendar"
import UserCard from "@/components/UserCard"

const CustomerPage = () => {
    return (
        <div className='p-4 flex gap-4 flex-col md:flex-row'>
            {/* LEFT */}
            <div className='w-full lg:w-2/3'>
            {/* USER CARDS */}
            <div className='flex gap-4 justify-between flex-wrap'>
                <UserCard type="cihazlarim" link="/list/devices"/>
                <UserCard type="bakimiyaklasan" link="/list/devices"/>
                <UserCard type="tekliflerim" link="/list/offers"/>
                <UserCard type="bakimlarim" link="/list/maintenances"/>
            </div>


            {/* MIDDLE CHARTS */}
            <div className='flex gap-4 flex-col lg:flex-row'>
                {/* PROVİDER OFFER CHART */}
                <div className='w-full lg:w-1/3 h-[450px]'>
                    <CustomerExtingChartContainer />
                </div>
                    {/* LAST MAİNT CHART CHART */}
                <div className='w-full lg:w-2/3 h-[450px]'>
                    <CustomerLastMaintChart />
                </div>

            </div>
            
            </div>

             {/* RİGHT */}
             <div className='w-full lg:w-1/3 flex flex-col gap-8'>
            <EventCalendar />
            <Announcements />
            </div>
        </div>

    )
}

export default CustomerPage
