
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact', href: '/contact-support' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press', href: '/press' }
    ],
    services: [
      { name: 'Browse Vehicles', href: '/vehicles' },
      { name: 'Post Vehicle', href: '/vehicles/post' },
      { name: 'Requirements', href: '/requirements' },
      { name: 'Dashboard', href: '/dashboard' }
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'Safety Tips', href: '/safety' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Privacy Policy', href: '/privacy' }
    ]
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link to="/" className="flex items-center mb-4 sm:mb-6">
                <img 
                  src="https://static.readdy.ai/image/02fae2dc1f09ff057a6d421cf0d8e42d/74c49d58028519ef85759f1bff88ebee.jfif" 
                  alt="Voiture.in" 
                  className="h-8 sm:h-10 w-auto object-contain"
                />
              </Link>
              <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed">
                Your trusted platform for buying and selling premium vehicles. Connect with verified dealers and individual sellers across India.
              </p>
              <div className="flex space-x-3 sm:space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <i className="ri-facebook-fill text-lg sm:text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <i className="ri-twitter-fill text-lg sm:text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <i className="ri-instagram-line text-lg sm:text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <i className="ri-linkedin-fill text-lg sm:text-xl"></i>
                </a>
              </div>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Company</h3>
              <ul className="space-y-2 sm:space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link 
                      to={link.href} 
                      className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Services</h3>
              <ul className="space-y-2 sm:space-y-3">
                {footerLinks.services.map((link) => (
                  <li key={link.name}>
                    <Link 
                      to={link.href} 
                      className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Support</h3>
              <ul className="space-y-2 sm:space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link 
                      to={link.href} 
                      className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter */}
          <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
              <div className="lg:max-w-md">
                <h3 className="text-base sm:text-lg font-semibold mb-2">Stay Updated</h3>
                <p className="text-gray-300 text-sm sm:text-base">
                  Get the latest vehicle listings and market updates delivered to your inbox.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:max-w-md lg:flex-1">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 text-sm sm:text-base"
                />
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap text-sm sm:text-base">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <p className="text-gray-400 text-xs sm:text-sm">
                © {currentYear} Voiture.in. All rights reserved.
              </p>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">
                  Terms
                </Link>
                <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">
                  Privacy
                </Link>
                <Link to="/cookies" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">
                  Cookies
                </Link>
                <a 
                  href="https://readdy.ai/?origin=logo" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm"
                >
                  Website Builder
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
