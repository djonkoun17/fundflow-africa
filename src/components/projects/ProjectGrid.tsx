import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Target, Users, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Project } from '../../types';

interface ProjectGridProps {
  projects: Project[];
  onProjectSelect: (project: Project) => void;
}

export const ProjectGrid: React.FC<ProjectGridProps> = ({ projects, onProjectSelect }) => {
  const { t } = useTranslation();

  const getCategoryIcon = (category: string) => {
    const icons = {
      water: '💧',
      education: '🎓',
      health: '🏥',
      agriculture: '🌾',
      infrastructure: '🏗️'
    };
    return icons[category as keyof typeof icons] || '🌍';
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'ETH' ? 'USD' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('projects')} 🚀
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Support transparent, community-verified projects across Africa
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => {
            const progress = calculateProgress(project.currentAmount, project.targetAmount);
            
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer border border-gray-100 overflow-hidden group"
                onClick={() => onProjectSelect(project)}
              >
                {/* Project Image */}
                <div className="relative h-48 bg-gradient-to-br from-orange-400 to-red-500 overflow-hidden">
                  {project.images.length > 0 ? (
                    <img
                      src={project.images[0]}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-6xl">
                      {getCategoryIcon(project.category)}
                    </div>
                  )}
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full text-sm font-medium capitalize">
                      {getCategoryIcon(project.category)} {project.category}
                    </span>
                  </div>

                  {/* Progress Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>

                {/* Project Content */}
                <div className="p-6">
                  {/* Location */}
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{project.region.flagEmoji} {project.region.country}, {project.region.region}</span>
                  </div>

                  {/* Title and Description */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-orange-600 transition-colors">
                    {project.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {project.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold text-gray-900">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Funding Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500">Raised</div>
                      <div className="font-bold text-gray-900">
                        {formatCurrency(project.currentAmount, project.currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Goal</div>
                      <div className="font-bold text-gray-900">
                        {formatCurrency(project.targetAmount, project.currency)}
                      </div>
                    </div>
                  </div>

                  {/* Milestones Info */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Target className="w-4 h-4 mr-1" />
                      <span>{project.milestones.length} milestones</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      <span>Community verified</span>
                    </div>
                  </div>

                  {/* View Project Button */}
                  <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 group-hover:shadow-lg">
                    <span>View Project</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Load More Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center mt-12"
        >
          <button className="bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 hover:border-orange-500 font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            Load More Projects
          </button>
        </motion.div>
      </div>
    </section>
  );
};