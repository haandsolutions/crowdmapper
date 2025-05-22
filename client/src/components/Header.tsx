import { useState } from "react";
import { Link } from "wouter";
import { MapPin } from "lucide-react";
import MobileMenu from "./MobileMenu";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openMobileMenu = () => setMobileMenuOpen(true);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="bg-white shadow-sm z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2 cursor-pointer">
            <MapPin className="h-8 w-8 text-blue-500" />
            <h1 className="text-xl font-bold text-gray-800">CrowdMapper</h1>
          </Link>
          
          <div className="hidden md:flex items-center space-x-2">
            <button className="px-3 py-2 rounded-md hover:bg-gray-100">
              <i className="fas fa-bell text-gray-600"></i>
            </button>
            <Link href="/profile">
              <button className="px-3 py-2 rounded-full bg-blue-500 text-white flex items-center justify-center h-10 w-10 hover:bg-blue-600">
                <span className="font-medium">JD</span>
              </button>
            </Link>
          </div>
          
          <div className="md:hidden">
            <button 
              onClick={openMobileMenu} 
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={mobileMenuOpen} onClose={closeMobileMenu} />
    </>
  );
}
