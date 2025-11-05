/**
 * Beautiful DashboardCard Creator for Tambo AI
 * Metric visualization, status indicators, progress bars with real-time data binding
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  Target, 
  Zap, 
  BarChart3, 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Info,
  AlertCircle,
  RefreshCw,
  Download,
  Settings,
  Eye,
  Maximize,
  ExternalLink,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useTamboContext, useTamboComponentState } from '@tambo-ai/react';

export interface MetricData {
  label: string;
  value: number | string;
  previousValue?: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  changePercent?: number;
  color?: string;
  icon?: any;
}

export interface ProgressData {
  current: number;
  total: number;
  label?: string;
  color?: string;
  showPercentage?: boolean;
  animated?: boolean;
}

export interface StatusIndicator {
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  timestamp?: number;
  count?: number;
}

export interface DashboardCardProps {
  title?: string;
  subtitle?: string;
  type?: 'metric' | 'progress' | 'status' | 'chart' | 'activity';
  metric?: MetricData;
  progress?: ProgressData;
  status?: StatusIndicator[];
  data?: any[];
  height?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'compact' | 'minimal' | 'card';
  interactive?: boolean;
  realTime?: boolean;
  refreshInterval?: number;
  actions?: {
    label: string;
    icon?: any;
    onClick: () => void;
  }[];
  onRefresh?: () => void;
  onExport?: () => void;
}

/**
 * Beautiful DashboardCard Creator - The heart of metrics visualization
 */
export function AI_DashboardCard({
  title = "AI Dashboard Card",
  subtitle,
  type = 'metric',
  metric,
  progress,
  status,
  data = [],
  height = 'md',
  variant = 'default',
  interactive = true,
  realTime = false,
  refreshInterval = 30000,
  actions = [],
  onRefresh,
  onExport
}: DashboardCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isExpanded, setIsExpanded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { state: tamboState } = useTamboContext();
  const { state: componentState } = useTamboComponentState();

  // Height configurations
  const heightConfig = {
    sm: 'h-24',
    md: 'h-32',
    lg: 'h-48',
    xl: 'h-64'
  };

  // Variant configurations
  const variantConfig = {
    default: 'bg-white border border-gray-200 shadow-lg rounded-xl',
    compact: 'bg-gray-50 border border-gray-100 rounded-lg',
    minimal: 'bg-transparent border-0 shadow-none',
    card: 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-xl rounded-2xl'
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (realTime && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        handleRefresh();
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [realTime, refreshInterval]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = (statusType: string) => {
    switch (statusType) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return AlertCircle;
      default: return Info;
    }
  };

  const getStatusColor = (statusType: string) => {
    switch (statusType) {
      case 'success': return 'text-green-500 bg-green-50';
      case 'warning': return 'text-yellow-500 bg-yellow-50';
      case 'error': return 'text-red-500 bg-red-50';
      default: return 'text-blue-500 bg-blue-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Minus;
    }
  };

  const getTrendColor = (trend: string, changePercent?: number) => {
    if (changePercent === 0) return 'text-gray-500';
    
    switch (trend) {
      case 'up': return changePercent! > 0 ? 'text-green-500' : 'text-red-500';
      case 'down': return changePercent! > 0 ? 'text-red-500' : 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const formatValue = (value: number | string, unit?: string) => {
    if (typeof value === 'number') {
      if (unit === '%') return `${value.toFixed(1)}%`;
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toLocaleString();
    }
    return `${value} ${unit || ''}`.trim();
  };

  const renderMetricCard = () => {
    if (!metric) return null;

    const TrendIcon = getTrendIcon(metric.trend || 'stable');
    const MetricIcon = metric.icon || BarChart3;

    return (
      <div className="flex items-center justify-between h-full">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <MetricIcon className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">{metric.label}</span>
          </div>
          
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-gray-900">
              {formatValue(metric.value, metric.unit)}
            </span>
            {metric.previousValue && (
              <div className={`flex items-center space-x-1 text-sm ${
                getTrendColor(metric.trend || 'stable', metric.changePercent)
              }`}>
                <TrendIcon className="w-4 h-4" />
                {metric.changePercent && (
                  <span>{Math.abs(metric.changePercent).toFixed(1)}%</span>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          {metric.trend && (
            <div className={`p-2 rounded-full ${
              metric.trend === 'up' ? 'bg-green-100' : 
              metric.trend === 'down' ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              <TrendIcon className={`w-4 h-4 ${
                getTrendColor(metric.trend, metric.changePercent)
              }`} />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderProgressCard = () => {
    if (!progress) return null;

    const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
    const isComplete = percentage >= 100;

    return (
      <div className="space-y-4 h-full">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">
            {progress.label || 'Progress'}
          </span>
          {progress.showPercentage && (
            <span className="text-sm text-gray-500">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                progress.color || (isComplete ? 'bg-green-500' : 'bg-blue-500')
              } ${progress.animated ? 'animate-pulse' : ''}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>{progress.current.toLocaleString()}</span>
            <span>{progress.total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderStatusCard = () => {
    if (!status || status.length === 0) return null;

    return (
      <div className="space-y-3 h-full">
        {status.map((item, index) => {
          const StatusIcon = getStatusIcon(item.status);
          const statusColorClass = getStatusColor(item.status);

          return (
            <div key={index} className="flex items-start space-x-3">
              <div className={`p-1.5 rounded-full ${statusColorClass}`}>
                <StatusIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{item.message}</p>
                <div className="flex items-center space-x-2 mt-1">
                  {item.timestamp && (
                    <span className="text-xs text-gray-500">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                  {item.count && item.count > 1 && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {item.count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderActivityCard = () => {
    const activities = [
      { action: 'Document saved', time: '2 minutes ago', type: 'success' },
      { action: 'AI component inserted', time: '5 minutes ago', type: 'info' },
      { action: 'Chart updated', time: '10 minutes ago', type: 'info' },
      { action: 'Template applied', time: '15 minutes ago', type: 'success' }
    ];

    return (
      <div className="space-y-3 h-full overflow-y-auto">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${
              activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
            }`} />
            <div className="flex-1">
              <p className="text-sm text-gray-900">{activity.action}</p>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (type) {
      case 'progress': return renderProgressCard();
      case 'status': return renderStatusCard();
      case 'activity': return renderActivityCard();
      default: return renderMetricCard();
    }
  };

  return (
    <div className={`
      ${variantConfig[variant]} 
      ${heightConfig[height]} 
      ${interactive ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''}
      p-6 relative overflow-hidden
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Actions */}
          {actions.map((action, index) => {
            const ActionIcon = action.icon || Settings;
            return (
              <button
                key={index}
                onClick={action.onClick}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title={action.label}
              >
                <ActionIcon className="w-4 h-4" />
              </button>
            );
          })}
          
          {/* Export */}
          {onExport && (
            <button
              onClick={onExport}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Export"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          
          {/* Refresh */}
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
          
          {/* Expand */}
          {interactive && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Expand"
            >
              <Maximize className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {renderContent()}
      </div>

      {/* Last Updated */}
      <div className="absolute bottom-4 right-4">
        <div className="flex items-center space-x-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>Updated {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Real-time indicator */}
      {realTime && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Dashboard Grid Component for multiple cards
 */
export function AI_DashboardGrid({
  cards,
  columns = 3,
  gap = 6
}: {
  cards: DashboardCardProps[];
  columns?: 1 | 2 | 3 | 4;
  gap?: 4 | 6 | 8;
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  const gapClass = {
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8'
  };

  return (
    <div className={`grid ${gridCols[columns]} ${gapClass[gap]}`}>
      {cards.map((card, index) => (
        <AI_DashboardCard key={index} {...card} />
      ))}
    </div>
  );
}

/**
 * Hook for managing Dashboard components
 */
export function useAIDashboard() {
  const [cards, setCards] = useState<DashboardCardProps[]>([]);

  const createCard = (config: DashboardCardProps) => {
    const newCard = {
      id: `card-${Date.now()}`,
      ...config,
      createdAt: Date.now()
    };
    setCards(prev => [...prev, newCard]);
    return newCard.id;
  };

  const updateCard = (id: string, updates: Partial<DashboardCardProps>) => {
    setCards(prev => prev.map(card => 
      card.id === id ? { ...card, ...updates } : card
    ));
  };

  const deleteCard = (id: string) => {
    setCards(prev => prev.filter(card => card.id !== id));
  };

  const refreshCard = async (id: string) => {
    const card = cards.find(c => c.id === id);
    if (card?.onRefresh) {
      await card.onRefresh();
    }
  };

  return {
    cards,
    createCard,
    updateCard,
    deleteCard,
    refreshCard
  };
}

export default AI_DashboardCard;