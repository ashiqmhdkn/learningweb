"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/api/auth-context";
import {
  Moon,
  LayoutDashboard,
  BookOpen,
  User,
  LogOut,
  GraduationCap,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/courses", icon: BookOpen, label: "My Courses" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className=" shadow-lg border-b h-16 md:border-t-0 md:border-b border-white-200 fixed w-full z-50 bottom-0 md:top-0 md:bottom-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className=" md:flex items-center">
            <span className="font-bold text-xl">Crescent</span>
          </div>
          <div className="flex w-full md:w-auto gap-4 justify-around md:justify-end md:space-x-4">
            {navItems.map(({ href, icon: Icon, label }) => {
              const active =
                pathname === href || pathname.startsWith(href + "/");

              return (
                <div key={href}>
                <a href={href}
                  className="flex flex-col md:flex-row items-center text-gray-700 hover:text-blue-600 py-2 md:py-0"
                >
                  <span className="md:hidden">
                    <Icon size={16} />
                  </span>
                  <span className="text-xs md:text-sm">{label}</span>
                </a>
              </div>  
              );
            })}
            <button onClick={handleLogout}>
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
