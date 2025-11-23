
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import NotificationSystem from '../base/NotificationSystem';
import ProfilePicture from '../base/ProfilePicture';

export default function Header() {
  const { user, signOut, initialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Close menus when route changes
  useEffect(() => {
    setShowMobileMenu(false);
    setShowProfileDropdown(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setShowProfileDropdown(false);
      setShowMobileMenu(false);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navigationItems = [
    { path: '/', label: 'Home', icon: 'ri-home-line' },
    { path: '/vehicles', label: 'Browse Vehicles', icon: 'ri-car-line' },
    { path: '/requirements', label: 'Requirements', icon: 'ri-file-list-line' },
  ];

  const handlePostVehicle = () => {
    if (user) {
      navigate('/vehicles/post');
    } else {
      navigate('/login');
    }
    setShowMobileMenu(false);
    setShowProfileDropdown(false);
  };

  const handleMenuClick = () => {
    setShowMobileMenu(false);
    setShowProfileDropdown(false);
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="w-full px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link to="/" className="flex items-center flex-shrink-0" onClick={handleMenuClick}>
            <img 
              src="https://static.readdy.ai/image/02fae2dc1f09ff057a6d421cf0d8e42d/74c49d58028519ef85759f1bff88ebee.jfif" 
              alt="Voiture.in" 
              className="h-10 sm:h-12 lg:h-15 w-auto object-contain"
            />
          </Link>

          <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1 px-2 xl:px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive(item.path)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <i className={item.icon}></i>
                <span className="hidden xl:inline">{item.label}</span>
                <span className="xl:hidden">{item.label.split(' ')[0]}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={handlePostVehicle}
              className="hidden sm:flex bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 lg:px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap items-center space-x-1 text-xs sm:text-sm"
            >
              <i className="ri-add-line text-sm"></i>
              <span className="hidden md:inline">Post Vehicle</span>
              <span className="md:hidden">Post</span>
            </button>

            {initialized && user ? (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="hidden md:block">
                  <NotificationSystem />
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center space-x-1 sm:space-x-2 p-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <ProfilePicture src={user.profile_picture || null} name={user.name} size="sm" />
                    <div className="hidden lg:block text-left max-w-24 xl:max-w-none">
                      <p className="text-xs xl:text-sm font-medium text-gray-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <i className="ri-arrow-down-s-line text-gray-400 text-sm"></i>
                  </button>

                  {showProfileDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowProfileDropdown(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-20 py-2">
                        <div className="px-4 py-3 border-b border-gray-200 lg:hidden">
                          <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                          <p className="text-xs text-gray-600 truncate">{user.email}</p>
                        </div>
                        
                        <div className="py-2">
                          <Link
                            to="/dashboard"
                            onClick={() => setShowProfileDropdown(false)}
                            className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer text-sm"
                          >
                            <i className="ri-dashboard-line w-4 h-4 flex items-center justify-center"></i>
                            <span>Dashboard</span>
                          </Link>
                          
                          <button
                            onClick={handlePostVehicle}
                            className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer w-full text-left text-sm"
                          >
                            <i className="ri-car-line w-4 h-4 flex items-center justify-center"></i>
                            <span>Post Vehicle</span>
                          </button>
                        </div>

                        <div className="border-t border-gray-200 py-2">
                          <button
                            onClick={handleSignOut}
                            className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors cursor-pointer w-full text-left text-sm"
                          >
                            <i className="ri-logout-circle-line w-4 h-4 flex items-center justify-center"></i>
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : initialized ? (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors cursor-pointer text-xs sm:text-sm px-2 py-1"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap text-xs sm:text-sm"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
            )}

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer ml-1"
            >
              <i className={`${showMobileMenu ? 'ri-close-line' : 'ri-menu-line'} text-lg`}></i>
            </button>
          </div>
        </div>

        {showMobileMenu && (
          <div className="lg:hidden border-t border-gray-200 py-3 bg-white">
            <nav className="space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleMenuClick}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg font-medium transition-colors cursor-pointer text-sm ${
                    isActive(item.path)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <i className={item.icon}></i>
                  <span>{item.label}</span>
                </Link>
              ))}
              
              {initialized && user ? (
                <>
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex items-center space-x-3 px-3 py-2 mb-2">
                      <ProfilePicture src={user.profile_picture || null} name={user.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm truncate">{user.name}</p>
                        <p className="text-xs text-gray-600 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/dashboard"
                    onClick={handleMenuClick}
                    className="flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-50 font-medium transition-colors cursor-pointer text-sm"
                  >
                    <i className="ri-dashboard-line"></i>
                    <span>Dashboard</span>
                  </Link>

                  <button
                    onClick={handlePostVehicle}
                    className="flex items-center space-x-3 px-3 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors cursor-pointer w-full text-left text-sm"
                  >
                    <i className="ri-add-line"></i>
                    <span>Post Vehicle</span>
                  </button>

                  <div className="md:hidden px-3 py-2">
                    <NotificationSystem />
                  </div>

                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors cursor-pointer w-full text-left text-sm"
                    >
                      <i className="ri-logout-circle-line"></i>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              ) : initialized ? (
                <>
                  <div className="border-t border-gray-200 pt-3 mt-3 space-y-1">
                    <Link
                      to="/login"
                      onClick={handleMenuClick}
                      className="flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-50 font-medium transition-colors cursor-pointer text-sm"
                    >
                      <i className="ri-login-circle-line"></i>
                      <span>Sign In</span>
                    </Link>
                    <Link
                      to="/register"
                      onClick={handleMenuClick}
                      className="flex items-center space-x-3 px-3 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors cursor-pointer text-sm"
                    >
                      <i className="ri-user-add-line"></i>
                      <span>Sign Up</span>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="px-3 py-3">
                  <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
