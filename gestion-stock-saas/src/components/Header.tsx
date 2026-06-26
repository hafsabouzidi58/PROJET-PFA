"use client";
import { useSession } from "next-auth/react";
import { User, Bell } from "lucide-react";
import Link from "next/link";
export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-8 shadow-sm">
      <div className="text-gray-500 font-medium">
        Tableau de bord / <span className="text-gray-900 capitalize">{session?.user?.role?.toLowerCase()}</span>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 border-l pl-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">{session?.user?.name}</p>
            <p className="text-xs text-gray-500 uppercase">{session?.user?.role}</p>
          </div>
          <div className="bg-blue-100 p-2 rounded-full">
<Link 
  href="/dashboard/profile"
  className="p-2 hover:bg-gray-100 rounded-xl transition-all flex items-center justify-center"
  title="Mon Profil"
>
  <User className="h-5 w-5 text-blue-600" />
</Link>
          </div>
        </div>
      </div>
    </header>
  );
}