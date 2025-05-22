import { Link, useLocation } from "wouter";

export default function MobileActionBar() {
  const [location] = useLocation();
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg z-40 border-t">
      <div className="flex justify-around py-2">
        <Link href="/" className={`p-2 text-center flex flex-col items-center ${location === '/' ? 'text-blue-500' : 'text-gray-500'}`}>
          <i className="fas fa-search"></i>
          <span className="text-xs mt-1">Search</span>
        </Link>
        <button className="p-2 text-center flex flex-col items-center text-gray-500">
          <i className="fas fa-star"></i>
          <span className="text-xs mt-1">Saved</span>
        </button>
        <button className="p-2 text-center flex flex-col items-center text-gray-500">
          <i className="fas fa-history"></i>
          <span className="text-xs mt-1">Recent</span>
        </button>
        <Link href="/profile" className={`p-2 text-center flex flex-col items-center ${location === '/profile' ? 'text-blue-500' : 'text-gray-500'}`}>
          <i className="fas fa-user"></i>
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </div>
  );
}
