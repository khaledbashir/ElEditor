"use client";

import { useState } from "react";
import { SimpleBlockSuiteEditor } from "./simple-blocksuite-editor";
import { Graph } from "./tambo/graph";
import { cn } from "../lib/utils";

export type ViewMode = "sheets" | "blocksuite";

interface ViewSwitcherProps {
  className?: string;
  initialMode?: ViewMode;
}

export function ViewSwitcher({ 
  className = "", 
  initialMode = "sheets" 
}: ViewSwitcherProps) {
  const [currentMode, setCurrentMode] = useState<ViewMode>(initialMode);

  const switchToSheets = () => setCurrentMode("sheets");
  const switchToBlockSuite = () => setCurrentMode("blocksuite");

  // Sample spreadsheet data for the sheets view
  const sampleSpreadsheetData = {
    type: "bar" as const,
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Revenue",
        data: [12000, 19000, 15000, 25000, 22000, 30000],
        color: "hsl(220, 100%, 62%)",
      },
      {
        label: "Expenses", 
        data: [8000, 12000, 10000, 15000, 14000, 18000],
        color: "hsl(160, 82%, 47%)",
      },
    ],
  };

  return (
    <div className={cn("view-switcher h-full flex flex-col", className)}>
      {/* Header with view switcher tabs */}
      <div className="switcher-header flex items-center justify-center p-4 border-b">
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={switchToSheets}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
              currentMode === "sheets"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            📊 Spreadsheet View
          </button>
          <button
            onClick={switchToBlockSuite}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
              currentMode === "blocksuite"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            📝 BlockSuite Editor
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="content-area flex-1 overflow-hidden">
        {currentMode === "sheets" && (
          <div className="sheets-view h-full p-6 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Spreadsheet Dashboard
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Monthly Performance</h3>
                  <Graph
                    data={sampleSpreadsheetData}
                    title="Revenue vs Expenses"
                    variant="solid"
                    size="default"
                    className="w-full"
                  />
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Total Revenue</span>
                      <span className="text-green-600 font-bold">$128,000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Total Expenses</span>
                      <span className="text-red-600 font-bold">$77,000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Net Profit</span>
                      <span className="text-blue-600 font-bold">$51,000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Profit Margin</span>
                      <span className="text-purple-600 font-bold">39.8%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentMode === "blocksuite" && (
          <div className="blocksuite-view h-full">
            <SimpleBlockSuiteEditor className="h-full" />
          </div>
        )}
      </div>
    </div>
  );
}