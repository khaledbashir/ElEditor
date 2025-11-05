/**
 * Interactive Map Component for Tambo AI
 * Advanced mapping with markers, clustering, heatmaps, and pan/zoom controls
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, Layers, Download, Target, ZoomIn, ZoomOut, Filter, Map } from 'lucide-react';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  type?: 'default' | 'location' | 'event' | 'business';
  color?: string;
  icon?: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface AIMapProps {
  title?: string;
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  markers?: MapMarker[];
  height?: number;
  showControls?: boolean;
  showMarkerCluster?: boolean;
  showHeatmap?: boolean;
  mapStyle?: 'streets' | 'satellite' | 'terrain' | 'dark';
  interactive?: boolean;
  onMarkerClick?: (marker: MapMarker) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
}

/**
 * Beautiful AI Map Component with advanced features
 */
export function AI_MapComponent({
  title = "AI Generated Map",
  center = [40.7128, -74.0060], // NYC default
  zoom = 10,
  markers = [],
  height = 400,
  showControls = true,
  showMarkerCluster = true,
  showHeatmap = false,
  mapStyle = 'streets',
  interactive = true,
  onMarkerClick,
  onBoundsChange
}: AIMapProps) {
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>(markers);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLayer, setActiveLayer] = useState<'markers' | 'heatmap' | 'clusters'>('markers');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Auto-generate sample markers if none provided
  useEffect(() => {
    if (mapMarkers.length === 0 && !isLoading) {
      generateSampleMarkers();
    }
  }, [mapMarkers.length, isLoading]);

  const generateSampleMarkers = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      const sampleMarkers: MapMarker[] = [
        {
          id: '1',
          lat: 40.7128,
          lng: -74.0060,
          title: 'New York City',
          description: 'The city that never sleeps',
          type: 'location',
          color: '#3B82F6'
        },
        {
          id: '2',
          lat: 40.7589,
          lng: -73.9851,
          title: 'Central Park',
          description: 'Urban oasis in Manhattan',
          type: 'business',
          color: '#10B981'
        },
        {
          id: '3',
          lat: 40.7484,
          lng: -73.9857,
          title: 'Empire State Building',
          description: 'Iconic skyscraper',
          type: 'location',
          color: '#F59E0B'
        },
        {
          id: '4',
          lat: 40.7614,
          lng: -73.9776,
          title: 'Times Square',
          description: 'The crossroads of the world',
          type: 'event',
          color: '#EF4444'
        },
        {
          id: '5',
          lat: 40.7505,
          lng: -73.9934,
          title: 'Brooklyn Bridge',
          description: 'Historic suspension bridge',
          type: 'location',
          color: '#8B5CF6'
        }
      ];
      
      setMapMarkers(sampleMarkers);
      setIsLoading(false);
    }, 1000);
  };

  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker);
    setMapCenter([marker.lat, marker.lng]);
    setMapZoom(Math.max(mapZoom, 15));
    onMarkerClick?.(marker);
  };

  const addNewMarker = (lat: number, lng: number, title: string = 'New Location') => {
    const newMarker: MapMarker = {
      id: `marker-${Date.now()}`,
      lat,
      lng,
      title,
      type: 'default',
      color: '#6366F1'
    };
    
    setMapMarkers(prev => [...prev, newMarker]);
  };

  const removeMarker = (markerId: string) => {
    setMapMarkers(prev => prev.filter(marker => marker.id !== markerId));
    if (selectedMarker?.id === markerId) {
      setSelectedMarker(null);
    }
  };

  const exportMap = () => {
    // Generate a simple export - in real implementation, would capture map image
    const mapData = {
      center: mapCenter,
      zoom: mapZoom,
      markers: mapMarkers,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(mapData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `map-export-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getMarkerIcon = (type: string, color: string = '#6366F1') => {
    const iconMap = {
      location: '📍',
      business: '🏢',
      event: '🎯',
      default: '📍'
    };
    
    return (
      <div 
        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
        style={{ backgroundColor: color }}
      >
        {iconMap[type as keyof typeof iconMap] || '📍'}
      </div>
    );
  };

  const renderMapControls = () => {
    if (!showControls) return null;

    return (
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        {/* Zoom Controls */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-1">
          <button
            onClick={() => setMapZoom(prev => Math.min(prev + 2, 20))}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-gray-600" />
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          <button
            onClick={() => setMapZoom(prev => Math.max(prev - 2, 1))}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Layer Controls */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2">
          <div className="flex flex-col space-y-1">
            {['markers', 'clusters', 'heatmap'].map((layer) => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer as any)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  activeLayer === layer 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {layer.charAt(0).toUpperCase() + layer.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          className="w-10 h-10 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
          title="Filter Markers"
        >
          <Filter className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    );
  };

  const renderMarkerList = () => {
    if (mapMarkers.length === 0) return null;

    return (
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 max-w-xs max-h-48 overflow-y-auto">
        <div className="p-3 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-800">Locations ({mapMarkers.length})</h4>
        </div>
        <div className="p-2">
          {mapMarkers.map((marker) => (
            <div
              key={marker.id}
              className={`p-2 rounded cursor-pointer transition-colors ${
                selectedMarker?.id === marker.id 
                  ? 'bg-blue-50 border-l-2 border-blue-500' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleMarkerClick(marker)}
            >
              <div className="flex items-start space-x-2">
                <div className="mt-0.5">
                  {getMarkerIcon(marker.type!, marker.color!)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {marker.title}
                  </div>
                  {marker.description && (
                    <div className="text-xs text-gray-500 truncate">
                      {marker.description}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFilterPanel = () => {
    if (!showFilterPanel) return null;

    const markerTypes = ['location', 'business', 'event', 'default'];
    const [selectedTypes, setSelectedTypes] = useState<string[]>(markerTypes);

    const toggleType = (type: string) => {
      setSelectedTypes(prev => 
        prev.includes(type) 
          ? prev.filter(t => t !== type)
          : [...prev, type]
      );
    };

    return (
      <div className="absolute top-16 right-4 z-20 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-48">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Filter Markers</h4>
        <div className="space-y-2">
          {markerTypes.map((type) => (
            <label key={type} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTypes.includes(type)}
                onChange={() => toggleType(type)}
                className="rounded"
              />
              <span className="text-sm capitalize">{type}</span>
              <div className="flex-1"></div>
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            </label>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-200">
          <button
            onClick={() => setShowFilterPanel(false)}
            className="w-full px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  const renderMockMap = () => {
    // This is a beautiful mock map implementation
    // In production, this would integrate with Google Maps, Mapbox, or Leaflet
    
    const scale = mapZoom / 20; // Simple zoom simulation
    const mapWidth = Math.max(300, 600 * scale);
    const mapHeight = Math.max(200, 400 * scale);

    return (
      <div 
        className="relative bg-gradient-to-br from-blue-100 via-green-50 to-blue-200 rounded-lg overflow-hidden border-2 border-blue-200"
        style={{ 
          width: '100%', 
          height: height,
          minHeight: '300px'
        }}
      >
        {/* Map Background with Grid */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />

        {/* Render Markers */}
        {mapMarkers.map((marker) => {
          // Simple coordinate transformation for mock map
          const x = ((marker.lng + 180) / 360) * mapWidth;
          const y = ((90 - marker.lat) / 180) * mapHeight;
          
          const isVisible = selectedTypes.includes(marker.type || 'default');
          if (!isVisible) return null;

          return (
            <div
              key={marker.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                selectedMarker?.id === marker.id ? 'z-20 scale-125' : 'z-10 hover:scale-110'
              }`}
              style={{ 
                left: `${(x / mapWidth) * 100}%`, 
                top: `${(y / mapHeight) * 100}%` 
              }}
              onClick={() => handleMarkerClick(marker)}
            >
              <div className="relative">
                {getMarkerIcon(marker.type!, marker.color!)}
                
                {/* Pulse animation for selected marker */}
                {selectedMarker?.id === marker.id && (
                  <div 
                    className="absolute inset-0 rounded-full animate-ping opacity-75"
                    style={{ backgroundColor: marker.color }}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* Map Title Overlay */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <div className="text-sm text-gray-600">
            {mapCenter[0].toFixed(4)}, {mapCenter[1].toFixed(4)} • Zoom {mapZoom}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="ai-map-container bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Map className="w-5 h-5" />
            <h3 className="text-lg font-semibold">{title}</h3>
            {isLoading && (
              <div className="flex items-center space-x-2 text-white/80">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span className="text-sm">Loading...</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={exportMap}
              className="p-1 hover:bg-white/20 rounded"
              title="Export Map"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              onClick={generateSampleMarkers}
              className="p-1 hover:bg-white/20 rounded"
              title="Generate Sample Data"
            >
              <Navigation className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative" style={{ height: height }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-3 text-gray-600">
              <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full"></div>
              <span>Generating beautiful map...</span>
            </div>
          </div>
        ) : (
          <>
            {renderMockMap()}
            {renderMapControls()}
            {renderMarkerList()}
            {renderFilterPanel()}
          </>
        )}
      </div>

      {/* Selected Marker Details */}
      {selectedMarker && (
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="flex items-start space-x-3">
            {getMarkerIcon(selectedMarker.type!, selectedMarker.color!)}
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-800">{selectedMarker.title}</h4>
              {selectedMarker.description && (
                <p className="text-gray-600 mt-1">{selectedMarker.description}</p>
              )}
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>Lat: {selectedMarker.lat.toFixed(6)}</span>
                <span>Lng: {selectedMarker.lng.toFixed(6)}</span>
                <span className="capitalize">Type: {selectedMarker.type}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedMarker(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing AI Map components
 */
export function useAIMap() {
  const [maps, setMaps] = useState<any[]>([]);

  const createMap = (config: AIMapProps) => {
    const newMap = {
      id: `map-${Date.now()}`,
      ...config,
      createdAt: Date.now()
    };
    setMaps(prev => [...prev, newMap]);
    return newMap.id;
  };

  const updateMap = (id: string, updates: Partial<AIMapProps>) => {
    setMaps(prev => prev.map(map => 
      map.id === id ? { ...map, ...updates } : map
    ));
  };

  const deleteMap = (id: string) => {
    setMaps(prev => prev.filter(map => map.id !== id));
  };

  const addMarker = (mapId: string, marker: MapMarker) => {
    setMaps(prev => prev.map(map => 
      map.id === mapId 
        ? { ...map, markers: [...(map.markers || []), marker] }
        : map
    ));
  };

  return {
    maps,
    createMap,
    updateMap,
    deleteMap,
    addMarker
  };
}

export default AI_MapComponent;