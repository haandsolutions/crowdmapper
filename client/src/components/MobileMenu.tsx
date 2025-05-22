import { Link } from "wouter";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  return (
    <div className={`fixed inset-0 z-50 bg-white md:hidden ${isOpen ? '' : 'hidden'}`}>
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">Menu</h2>
        <button 
          onClick={onClose}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      <div className="p-4">
        <nav className="space-y-4">
          <Link href="/" className="block p-2 rounded-md hover:bg-gray-100 font-medium">
            Home
          </Link>
          <a href="#" className="block p-2 rounded-md hover:bg-gray-100 font-medium">Favorites</a>
          <a href="#" className="block p-2 rounded-md hover:bg-gray-100 font-medium">Recent Visits</a>
          <a href="#" className="block p-2 rounded-md hover:bg-gray-100 font-medium">Notifications</a>
          <a href="#" className="block p-2 rounded-md hover:bg-gray-100 font-medium">Profile</a>
          <a href="#" className="block p-2 rounded-md hover:bg-gray-100 font-medium">Settings</a>
        </nav>
        <div className="mt-6 pt-6 border-t">
          <button className="w-full py-2 px-4 rounded-md bg-blue-500 text-white font-medium hover:bg-blue-600">Sign Out</button>
        </div>
      </div>
    </div>
  );
}
