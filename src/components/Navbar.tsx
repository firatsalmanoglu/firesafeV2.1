// Navbar.tsx - Mevcut dosyayı güncelleyelim
import Image from "next/image";
import { auth } from "@/auth";
import NavbarClient from "./NavbarClient";

const Navbar = async () => {
  const session = await auth();
  
  return <> 
    <div className='flex items-center justify-between p-4'>
      {/* SEARCH BAR */}
      <div className='hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2'>
        <Image src="/search.png" alt="" width={14} height={14}/>
        <input type="text" placeholder="Search..." className="w-[200px] p-2 bg-transparent outline-none"/>
      </div>
      
      {/* ICONS AND USER - Client Component */}
      <NavbarClient 
        userName={session?.user?.name} 
        userRole={session?.user?.role}
        userId={session?.user?.id}
      />
    </div>
  </>
}

export default Navbar;