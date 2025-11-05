/**
 * Graph Component Integration for Tambo AI
 * Interactive charts with data binding from chat messages
 */

import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Download, RefreshCw, Settings } from 'lucide-react';

export interface ChartData {
  label: string;
  value: number;
  [key: string]: any;
}

export interface GraphProps {
  title?: string;
  type?: 'line' | 'bar' | 'pie';
  data?: ChartData[];
  width?: number;
  height?: number;
  colors?: string[];
  showLegend?: boolean;
  showTooltip?: boolean;
  animated?: boolean;
  onDataUpdate?: (data: ChartData[]) => void;
}

const DEFAULT_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', 
  '#00C49F', '#FFBB28', '#FF8042', '#0088FE'
];

/**
 * Beautiful AI Graph Component with Chart.js/Recharts integration
 */
export function AI_GraphComponent({
  title = "AI Generated Chart",
  type = "bar",
  data = [],
  width = 400,
  height = 300,
  colors = DEFAULT_COLORS,
  showLegend = true,
  showTooltip = true,
  animated = true,
  onDataUpdate
}: GraphProps) {
  const [chartData, setChartData] = useState<ChartData[]>(data);
  const [selectedChartType, setSelectedChartType] = useState(type);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const chartRef = useRef<HTMLCanvasElement>(null);

  // Update chart data when props change
  useEffect(() => {
    if (data.length > 0) {
      setChartData(data);
    }
  }, [data]);

  // Auto-generate sample data if none provided
  useEffect(() => {
    if (chartData.length === 0 && !isLoading) {
      generateSampleData();
    }
  }, [selectedChartType]);

  const generateSampleData = () => {
    setIsLoading(true);
    
    // Simulate AI data generation
    setTimeout(() => {
      let sampleData: ChartData[] = [];
      
      switch (selectedChartType) {
        case 'pie':
          sampleData = [
            { label: 'Sales', value: 35 },
            { label: 'Marketing', value: 25 },
            { label: 'Development', value: 20 },
            { label: 'Support', value: 15 },
            { label: 'Operations', value: 5 }
          ];
          break;
        case 'line':
          sampleData = [
            { label: 'Jan', value: 1200 },
            { label: 'Feb', value: 1900 },
            { label: 'Mar', value: 3000 },
            { label: 'Apr', value: 2800 },
            { label: 'May', value: 3200 },
            { label: 'Jun', value: 4100 }
          ];
          break;
        default:
          sampleData = [
            { label: 'Q1', value: 4000 },
            { label: 'Q2', value: 3000 },
            { label: 'Q3', value: 5000 },
            { label: 'Q4', value: 4500 }
          ];
      }
      
      setChartData(sampleData);
      setIsLoading(false);
      onDataUpdate?.(sampleData);
    }, 500);
  };

  const updateChartData = (newData: ChartData[]) => {
    setChartData(newData);
    onDataUpdate?.(newData);
  };

  const exportChart = () => {
    if (chartRef.current) {
      const canvas = chartRef.current;
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${title.replace(/\s+/g, '_')}_chart.png`;
      link.href = url;
      link.click();
    }
  };

  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2 text-blue-600">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Generating chart data...</span>
          </div>
        </div>
      );
    }

    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No data available</p>
            <button 
              onClick={generateSampleData}
              className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Generate Sample Data
            </button>
          </div>
        </div>
      );
    }

    const commonProps = {
      width: '100%',
      height: height,
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (selectedChartType) {
      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={colors[0]} 
                strokeWidth={2}
                dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: colors[0] }}
                animationDuration={animated ? 1000 : 0}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                animationDuration={animated ? 1000 : 0}
                label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      default: // bar chart
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              {showTooltip && <Tooltip />}
              {showLegend && <Legend />}
              <Bar 
                dataKey="value" 
                fill={colors[0]}
                animationDuration={animated ? 1000 : 0}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="ai-graph-container bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Chart Type Selector */}
            <select
              value={selectedChartType}
              onChange={(e) => setSelectedChartType(e.target.value as any)}
              className="bg-white/20 text-white border border-white/30 rounded px-2 py-1 text-sm"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
            </select>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 hover:bg-white/20 rounded"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            
            <button
              onClick={exportChart}
              className="p-1 hover:bg-white/20 rounded"
              title="Export Chart"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-50 p-4 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showLegend}
                onChange={(e) => {
                  // This would need to be handled via state management
                }}
                className="rounded"
              />
              <span className="text-sm">Show Legend</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showTooltip}
                onChange={(e) => {
                  // This would need to be handled via state management
                }}
                className="rounded"
              />
              <span className="text-sm">Show Tooltip</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={animated}
                onChange={(e) => {
                  // This would need to be handled via state management
                }}
                className="rounded"
              />
              <span className="text-sm">Animated</span>
            </label>
            
            <button
              onClick={generateSampleData}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Refresh Data
            </button>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div className="p-4">
        <div className="w-full" style={{ minHeight: height }}>
          {renderChart()}
        </div>
      </div>

      {/* Data Summary */}
      {chartData.length > 0 && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Data Points:</span> {chartData.length}
            <span className="ml-4 font-medium">Total Value:</span> {chartData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing AI Graph components
 */
export function useAIGraph() {
  const [graphs, setGraphs] = useState<any[]>([]);

  const createGraph = (config: GraphProps) => {
    const newGraph = {
      id: `graph-${Date.now()}`,
      ...config,
      createdAt: Date.now()
    };
    setGraphs(prev => [...prev, newGraph]);
    return newGraph.id;
  };

  const updateGraph = (id: string, updates: Partial<GraphProps>) => {
    setGraphs(prev => prev.map(graph => 
      graph.id === id ? { ...graph, ...updates } : graph
    ));
  };

  const deleteGraph = (id: string) => {
    setGraphs(prev => prev.filter(graph => graph.id !== id));
  };

  const getGraphData = (id: string) => {
    return graphs.find(graph => graph.id === id);
  };

  return {
    graphs,
    createGraph,
    updateGraph,
    deleteGraph,
    getGraphData
  };
}

export default AI_GraphComponent;