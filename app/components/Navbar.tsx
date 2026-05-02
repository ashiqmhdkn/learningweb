"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/api/auth-context";
import { LayoutDashboard, BookOpen, LogOut } from "lucide-react";
import { useEffect, useRef } from "react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/courses", icon: BookOpen, label: "My Courses" },
];

export default function Navbar() {
const router = useRouter();
function LogOut(){
console.log("Logout");
useAuth().logout();
router.replace('/login');

};

  return (
    <nav className="fixed top-0 w-full z-50  border-b border-white/10 shadow-md" style={{ background: 'rgba(108, 75, 240, 0.95)' }} >
      <div className="max-w-10xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="text-xl font-bold text-white">
            Crescent
          </div>

          {/* Nav Items */}
          <div className="flex items-center gap-6">

            {navItems.map(({ href, icon: Icon, label }) => {
              const active =
                usePathname() === href || usePathname().startsWith(href + "/");

              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 text-sm transition ${active
                    ? "text-gray-900"
                    : "text-gray-300 hover:text-blue-400"
                    }`}
                >
                  <Icon size={16} />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              );
            })}
            <button
  onClick={LogOut}
  className="flex items-center gap-2 text-sm text-gray-300 hover:text-red-400 transition"
>
  Sign Out
</button>

          </div>
        </div>
      </div>
    </nav>
  );
}