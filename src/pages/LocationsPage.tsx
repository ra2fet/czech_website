// src/components/LocationsPage.js
import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Phone,
  Mail,
  ExternalLink,
  Clock,
  Globe,
  Building2,
  Users,
  MapPin,
  Navigation,
  Loader2,
  Search,
  ChevronDown,
  Star,
  Calendar,
  Zap,
  Shield,
  Award,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import config from '../config';
import axios from '../api/axios';
import toast from 'react-hot-toast';

interface Location {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  image_url: string;
  position: string | { longitude: number; latitude: number };
  latitude: number;
  longitude: number;
}

export const LocationsPage = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    filterLocations();
  }, [locations, searchTerm, selectedRegion]);

  const parsePosition = (position: string | { longitude: number; latitude: number }) => {
    if (!position) return null;

    try {
      if (typeof position === 'string') {
        const cleanPosition = position.replace(/[()]/g, '');
        const [lat, lng] = cleanPosition.split(',').map((coord: string) => parseFloat(coord.trim()));
        if (isNaN(lat) || isNaN(lng)) return null;
        return [lat, lng];
      } else {
        const { longitude, latitude } = position;
        if (isNaN(latitude) || isNaN(longitude)) return null;
        return [latitude, longitude];
      }
    } catch (error) {
      return null;
    }
  };

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);

      let data;
      if (config.useSupabase) {
        const { data: supabaseData, error: fetchError } = await supabase
          .from('locations')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) throw new Error(fetchError.message);
        data = supabaseData || [];
      } else {
        const response = await  config.axios.get(config.apiEndpoints.locations);
        data = response.data || [];
      }

      const parsedLocations = data
        .map((loc: Location) => {
          const parsedPos = parsePosition(config.useSupabase ? loc.position : { longitude: loc.longitude, latitude: loc.latitude });
          if (!parsedPos) return null;
          return { ...loc, parsedPosition: parsedPos };
        })
        .filter(Boolean);

      setLocations(parsedLocations);

      if (parsedLocations.length > 0) {
        setActiveLocation(parsedLocations[0]);
      }
    } catch (error: unknown) {
      setError((error as Error).message);
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const filterLocations = () => {
    let filtered = locations;

    if (searchTerm) {
      filtered = filtered.filter(location =>
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedRegion !== 'all') {
      // Add region filtering logic based on your data structure
      filtered = filtered.filter(location => 
        location.address.toLowerCase().includes(selectedRegion.toLowerCase())
      );
    }

    setFilteredLocations(filtered);
  };

  const handleSelectLocation = (location: Location) => {
    setActiveLocation(location);
  };

  const regions = ['all', 'north america', 'europe', 'asia', 'south america', 'africa', 'oceania'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-20 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>

          {/* Hero Section */}
          <section className="relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white py-32">
            <div className="container mx-auto px-6 relative z-10">
              <div className="max-w-5xl mx-auto text-center">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center mb-8"
                >
                  <div className="bg-white/10 backdrop-blur-lg rounded-full p-4 mr-6">
                    <Globe size={56} className="text-blue-300" />
                  </div>
                  <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                    Global Presence
                  </h1>
                </motion.div>
                <p className="text-xl md:text-2xl opacity-90 mb-12 leading-relaxed max-w-3xl mx-auto">
                  Connecting with clients worldwide through our strategically positioned offices and innovation hubs
                </p>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-20 animate-pulse"></div>
                <Loader2 className="relative h-16 w-16 animate-spin text-blue-600 mx-auto mb-6" />
              </div>
              <p className="text-slate-600 text-xl font-medium">Discovering our global network...</p>
              <div className="mt-4 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50">
        <section className="bg-gradient-to-r from-slate-900 via-red-900 to-slate-900 text-white py-32">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center mb-6"
              >
                <Globe size={48} className="mr-4" />
                <h1 className="text-4xl md:text-6xl font-bold">Global Presence</h1>
              </motion.div>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-center py-20">
          <div className="text-center bg-white p-12 rounded-2xl shadow-2xl max-w-md mx-auto border border-red-100">
            <div className="bg-red-100 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <ExternalLink className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-800 mb-4">Connection Error</h2>
            <p className="text-red-600 mb-8 leading-relaxed">{error}</p>
            <button
              onClick={fetchLocations}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold transform hover:scale-105"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!locations || locations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50">
        <section className="bg-gradient-to-r from-slate-900 via-amber-900 to-slate-900 text-white py-32">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center mb-6"
              >
                <Globe size={48} className="mr-4" />
                <h1 className="text-4xl md:text-6xl font-bold">Global Presence</h1>
              </motion.div>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-center py-20">
          <div className="text-center bg-white p-12 rounded-2xl shadow-2xl max-w-md mx-auto border border-amber-100">
            <div className="bg-amber-100 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Building2 className="h-10 w-10 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-amber-800 mb-4">Expanding Soon</h2>
            <p className="text-amber-600 mb-8 leading-relaxed">
              We're establishing new locations worldwide. Check back soon for updates.
            </p>
            <button
              onClick={fetchLocations}
              className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-8 py-4 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold transform hover:scale-105"
            >
              Check Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white py-32 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center mb-8"
            >
              <div className="bg-white/10 backdrop-blur-lg rounded-full p-4 mr-6">
                <Globe size={56} className="text-blue-300" />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Global Network
              </h1>
            </motion.div>
            <p className="text-xl md:text-2xl opacity-90 mb-12 leading-relaxed max-w-3xl mx-auto">
              Connecting with clients worldwide through our strategically positioned offices and innovation hubs
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm opacity-80">
              <div className="flex items-center bg-white/10 backdrop-blur-lg rounded-full px-6 py-3">
                <Building2 size={20} className="mr-3 text-blue-300" />
                <span className="font-medium">{locations.length} Global Offices</span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-lg rounded-full px-6 py-3">
                <Users size={20} className="mr-3 text-purple-300" />
                <span className="font-medium">24/7 Support</span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-lg rounded-full px-6 py-3">
                <Zap size={20} className="mr-3 text-pink-300" />
                <span className="font-medium">Instant Connect</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <section className="py-20 bg-white/70 backdrop-blur-sm shadow-lg relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: Building2, value: locations.length, label: 'Global Offices', color: 'blue', delay: 0.1 },
              { icon: Globe, value: '6', label: 'Continents', color: 'purple', delay: 0.2 },
              { icon: Users, value: '500+', label: 'Team Members', color: 'pink', delay: 0.3 },
              { icon: Award, value: '24/7', label: 'Support Available', color: 'indigo', delay: 0.4 }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: stat.delay }}
                className="text-center group"
              >
                <div className={`bg-gradient-to-br from-${stat.color}-100 to-${stat.color}-200 rounded-2xl p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <stat.icon className={`h-10 w-10 text-${stat.color}-600`} />
                </div>
                <h3 className="text-4xl font-bold text-slate-900 mb-2">{stat.value}</h3>
                <p className="text-slate-600 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-12 bg-white/50 backdrop-blur-sm border-y border-white/20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Region Filter */}
              <div className="relative">
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="appearance-none bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl px-6 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {regions.map(region => (
                    <option key={region} value={region}>
                      {region === 'all' ? 'All Regions' : region.charAt(0).toUpperCase() + region.slice(1)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 pointer-events-none" />
              </div>

              {/* View Toggle */}
              <div className="flex bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Locations Section */}
      <section ref={ref} className="py-20 relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2
              // initial={{ opacity: 0, y: -20 }}
              // animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-blue-800 bg-clip-text text-transparent"
            >
              Discover Our Locations
            </motion.h2>
            <motion.div
              // initial={{ opacity: 0, scaleX: 0 }}
              // animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="w-32 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mx-auto mb-8 rounded-full"
            />
            <motion.p
              // initial={{ opacity: 0 }}
              // animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="max-w-3xl mx-auto text-xl text-slate-600 leading-relaxed"
            >
              Our strategically positioned offices ensure we're always close to our clients,
              providing local expertise with global reach and innovation.
            </motion.p>
          </div>

          {/* Locations Grid/List */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16' : 'space-y-6 mb-16'}>
            {(filteredLocations.length > 0 ? filteredLocations : locations).map((location, index) => {
              const position = parsePosition(config.useSupabase ? location.position : { longitude: location.longitude, latitude: location.latitude });
              const isActive = activeLocation?.id === location.id;

              return (
                <motion.div
                  key={location.id}
                  // initial={{ opacity: 0, y: 20 }}
                  // animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.1 * index, duration: 0.6 }}
                  onClick={() => handleSelectLocation(location)}
                  className={`group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-500 border-2 hover:shadow-2xl hover:-translate-y-2 ${
                    isActive ? 'border-blue-400 ring-4 ring-blue-100 shadow-xl scale-105' : 'border-white/50 hover:border-blue-200'
                  } ${viewMode === 'list' ? 'flex' : ''}`}
                >
                  <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'h-56'}`}>
                    {location.image_url ? (
                      <img
                        src={location.image_url}
                        alt={location.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          (target.nextSibling as HTMLElement).style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center"
                      style={{ display: location.image_url ? 'none' : 'flex' }}
                    >
                      <Building2 size={48} className="text-white drop-shadow-lg" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                      <MapPin size={16} className="text-blue-600" />
                    </div>
                    {isActive && (
                      <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                        <Star size={12} className="mr-1" />
                        Active
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{location.name}</h3>
                      <div className="flex items-center text-xs text-slate-500 bg-slate-100 rounded-full px-2 py-1">
                        <Clock size={10} className="mr-1" />
                        Open
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm mb-4 leading-relaxed line-clamp-2">{location.address}</p>

                    <div className="space-y-3">
                      {location.phone && (
                        <div className="flex items-center text-sm text-slate-600">
                          <div className="bg-blue-100 rounded-lg p-2 mr-3 flex-shrink-0">
                            <Phone size={12} className="text-blue-600" />
                          </div>
                          <span className="font-medium">{location.phone}</span>
                        </div>
                      )}
                      {location.email && (
                        <div className="flex items-center text-sm text-slate-600">
                          <div className="bg-purple-100 rounded-lg p-2 mr-3 flex-shrink-0">
                            <Mail size={12} className="text-purple-600" />
                          </div>
                          <span className="truncate font-medium">{location.email}</span>
                        </div>
                      )}
                      {position && (
                        <div className="flex items-center text-sm text-slate-500">
                          <div className="bg-slate-100 rounded-lg p-2 mr-3 flex-shrink-0">
                            <Navigation size={12} className="text-slate-600" />
                          </div>
                          <span className="font-mono text-xs">{position[0].toFixed(4)}, {position[1].toFixed(4)}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 flex items-center">
                          <Calendar size={12} className="mr-1" />
                          Mon-Fri 9AM-6PM
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-green-600 font-semibold text-xs">Available</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Global Presence Visual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl shadow-2xl h-[500px] border border-white/50 overflow-hidden flex items-center justify-center relative"
          >
            <div className="absolute inset-0 bg-world-map bg-cover bg-center opacity-20"></div>
            <div className="relative z-10 text-white text-center">
              <Globe size={120} className="mx-auto mb-6 text-white/80 drop-shadow-lg" />
              <h3 className="text-5xl font-bold mb-4 drop-shadow-lg">Our Global Footprint</h3>
              <p className="text-xl max-w-2xl mx-auto opacity-90">
                Connecting continents, empowering businesses. Our reach spans the globe, bringing innovation closer to you.
              </p>
            </div>
          </motion.div>

          {/* Enhanced Active Location Details */}
          {activeLocation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6 }}
              className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl mt-16 overflow-hidden border border-white/50"
            >
              <div className="md:flex">
                <div className="md:w-1/2 relative">
                  {activeLocation.image_url ? (
                    <img
                      src={activeLocation.image_url}
                      alt={activeLocation.name}
                      className="w-full h-96 md:h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        (target.nextSibling as HTMLElement).style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="w-full h-96 md:h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center"
                    style={{ display: activeLocation.image_url ? 'none' : 'flex' }}
                  >
                    <div className="text-center text-white">
                      <Building2 size={80} className="mx-auto mb-4 drop-shadow-lg" />
                      <p className="text-xl font-semibold">Premier Office Location</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                  <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
                    <span className="text-sm font-bold text-slate-900 flex items-center">
                      <Star size={14} className="mr-2 text-yellow-500" />
                      Featured Location
                    </span>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-sm font-semibold text-slate-900">Currently Open</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-slate-600">
                          <Shield size={12} />
                          <span>Secure Location</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="md:w-1/2 p-8 lg:p-12">
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 bg-gradient-to-r from-slate-900 to-blue-800 bg-clip-text text-transparent">
                        {activeLocation.name}
                      </h3>
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                        Regional HQ
                      </div>
                    </div>
                    <p className="text-blue-600 font-semibold text-lg">Innovation & Excellence Hub</p>
                  </div>

                  <div className="space-y-6 mb-10">
                    <div className="flex items-start group">
                      <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-3 mr-4 flex-shrink-0 group-hover:scale-110 transition-transform">
                        <MapPin size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 mb-2 text-lg">Office Address</h4>
                        <p className="text-slate-700 leading-relaxed">{activeLocation.address}</p>
                      </div>
                    </div>

                    {activeLocation.phone && (
                      <div className="flex items-start group">
                        <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-3 mr-4 flex-shrink-0 group-hover:scale-110 transition-transform">
                          <Phone size={20} className="text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 mb-2 text-lg">Direct Line</h4>
                          <a
                            href={`tel:${activeLocation.phone}`}
                            className="text-slate-700 hover:text-blue-600 transition-colors font-semibold"
                          >
                            {activeLocation.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {activeLocation.email && (
                      <div className="flex items-start group">
                        <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-3 mr-4 flex-shrink-0 group-hover:scale-110 transition-transform">
                          <Mail size={20} className="text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 mb-2 text-lg">Email Contact</h4>
                          <a
                            href={`mailto:${activeLocation.email}`}
                            className="text-slate-700 hover:text-blue-600 transition-colors font-semibold"
                          >
                            {activeLocation.email}
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start group">
                      <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl p-3 mr-4 flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Clock size={20} className="text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 mb-3 text-lg">Business Hours</h4>
                        <div className="space-y-2 text-slate-700">
                          <div className="flex justify-between items-center py-1">
                            <span className="font-medium">Monday - Friday</span>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-lg text-sm font-semibold">9:00 AM - 6:00 PM</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="font-medium">Saturday</span>
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-lg text-sm font-semibold">10:00 AM - 2:00 PM</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="font-medium">Sunday</span>
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-sm font-semibold">Closed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeLocation.position && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${
                          config.useSupabase && typeof activeLocation.position === 'string'
                            ? activeLocation.position.replace(/[()]/g, '')
                            : `${activeLocation.latitude},${activeLocation.longitude}`
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 group"
                      >
                        <Navigation size={18} className="mr-2 group-hover:rotate-12 transition-transform" />
                        Get Directions
                      </a>
                    )}
                    <a
                      href={`mailto:${activeLocation.email}`}
                      className="flex items-center justify-center border-2 border-blue-600 text-blue-600 px-6 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 group"
                    >
                      <Mail size={18} className="mr-2 group-hover:rotate-12 transition-transform" />
                      Contact Office
                    </a>
                  </div>

                  {/* Additional Info Cards */}
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 text-center">
                      <div className="bg-emerald-200 rounded-full p-2 w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                        <Users size={16} className="text-emerald-700" />
                      </div>
                      <p className="text-emerald-700 font-semibold text-sm">50+ Team Members</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                      <div className="bg-blue-200 rounded-full p-2 w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                        <Zap size={16} className="text-blue-700" />
                      </div>
                      <p className="text-blue-700 font-semibold text-sm">High-Speed Connectivity</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              Ready to Connect?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl mb-8 opacity-90 leading-relaxed"
            >
              Get in touch with our global team. We're here to help you succeed,
              no matter where you are in the world.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <button className="bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center">
                <Mail size={18} className="mr-2" />
                Contact Us Today
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-slate-900 transition-all duration-300 transform hover:scale-105 flex items-center">
                <Phone size={18} className="mr-2" />
                Schedule a Call
              </button>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};
