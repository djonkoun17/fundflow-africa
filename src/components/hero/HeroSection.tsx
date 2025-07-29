import React from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Shield, Smartphone, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroSectionProps {
  onViewProjects: () => void;
  onBecomeValidator: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onViewProjects, onBecomeValidator }) => {
  const { t } = useTranslation();

  const features = [
    { icon: Smartphone, key: 'mobile_money', color: 'bg-green-500' },
    { icon: Shield, key: 'blockchain', color: 'bg-blue-500' },
    { icon: Users, key: 'community', color: 'bg-purple-500' },
    { icon: Heart, key: 'offline', color: 'bg-red-500' }
  ];

  return (
    <section className="relative bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 py-20 overflow-hidden">
      {/* African Pattern Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg opacity='0.1'%3E%3Cpath d='M30 30L15 45L30 60L45 45L30 30Z' fill='%23000'/%3E%3Cpath d='M30 0L15 15L30 30L45 15L30 0Z' fill='%23000'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {t('welcome')}
              <span className="block text-3xl md:text-5xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mt-2">
                🌍 Transparency for Good
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-700 mb-12 leading-relaxed">
              Empowering African communities through transparent, blockchain-secured funding
              with mobile money integration and offline capabilities
            </p>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
          >
            {features.map((feature, index) => (
              <div
                key={feature.key}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                  {t(feature.key)}
                </h3>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={onViewProjects}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              {t('view_projects')} 🚀
            </button>
            
            <button
              onClick={onBecomeValidator}
              className="bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 hover:border-orange-500 font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              {t('join_validators')} 🤝
            </button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-5 gap-8 text-center"
          >
            <div>
              <div className="text-2xl md:text-3xl font-bold text-orange-600">50K+</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-green-600">$2M+</div>
              <div className="text-sm text-gray-600">Funds Raised</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-blue-600">1K+</div>
              <div className="text-sm text-gray-600">Projects</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-purple-600">25</div>
              <div className="text-sm text-gray-600">Countries</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-red-600">99.9%</div>
              <div className="text-sm text-gray-600">Transparency</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};