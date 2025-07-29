import React from 'react';
import { useTranslation } from 'react-i18next';
import { Droplets, GraduationCap, Heart, Briefcase, Users, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { AfricanImpactMetrics } from '../../types';

interface ImpactDashboardProps {
  metrics: AfricanImpactMetrics;
}

export const ImpactDashboard: React.FC<ImpactDashboardProps> = ({ metrics }) => {
  const { t } = useTranslation();

  const impactCards = [
    {
      key: 'water_access',
      value: metrics.waterAccessImproved,
      icon: Droplets,
      color: 'from-blue-500 to-cyan-500',
      unit: 'people'
    },
    {
      key: 'schools_built',
      value: metrics.schoolsBuilt,
      icon: GraduationCap,
      color: 'from-green-500 to-emerald-500',
      unit: 'schools'
    },
    {
      key: 'health_clinics',
      value: metrics.healthClinicsSupported,
      icon: Heart,
      color: 'from-red-500 to-pink-500',
      unit: 'clinics'
    },
    {
      key: 'jobs_created',
      value: metrics.jobsCreated,
      icon: Briefcase,
      color: 'from-purple-500 to-violet-500',
      unit: 'jobs'
    },
    {
      key: 'communities_reached',
      value: metrics.communitiesReached,
      icon: Users,
      color: 'from-orange-500 to-amber-500',
      unit: 'communities'
    }
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('impact')} 🌍
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real-time impact metrics from our community-verified projects across Africa
          </p>
        </motion.div>

        {/* Impact Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
          {impactCards.map((card, index) => (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-100">
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5 rounded-2xl`} />
                
                {/* Icon */}
                <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center mb-4 mx-auto`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>

                {/* Value */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {formatNumber(card.value)}
                  </div>
                  <div className="text-sm font-medium text-gray-600 mb-2">
                    {t(card.key)}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    {card.unit}
                  </div>
                </div>

                {/* Trend Indicator */}
                <div className="absolute top-4 right-4">
                  <div className="flex items-center text-green-500">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Regional Impact Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Regional Impact Distribution 🗺️
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Object.entries(metrics.localCurrencyImpact).map(([currency, amount]) => (
              <div key={currency} className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {formatNumber(amount)}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {currency}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Local Impact
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Project Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white"
        >
          <h3 className="text-2xl font-bold mb-6 text-center">
            Projects by Category 📊
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(metrics.projectsByCategory).map(([category, count]) => (
              <div key={category} className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-2xl font-bold mb-1">
                  {count}
                </div>
                <div className="text-sm capitalize">
                  {category}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};