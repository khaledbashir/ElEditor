/**
 * Beautiful "Insert to Doc" Button Component
 * Floating action button for inserting AI-generated components into BlockSuite documents
 */

import React, { useState } from 'react';
import { useTamboBlockSuiteIntegration, type TamboComponentData } from '@/lib/tambo-to-blocksuite-integration';
import { Plus, X, Eye, Check } from 'lucide-react';

interface InsertToDocButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'floating' | 'inline' | 'toolbar';
  showPreview?: boolean;
}

export function InsertToDocButton({
  className = '',
  size = 'md',
  variant = 'floating',
  showPreview = true
}: InsertToDocButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<TamboComponentData | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const {
    components,
    isIntegrating,
    insertComponent,
    removeComponent,
    updateComponent,
    refreshComponents
  } = useTamboBlockSuiteIntegration();

  // Size configurations
  const sizeConfig = {
    sm: { button: 'w-8 h-8', icon: 'w-4 h-4', modal: 'max-w-md' },
    md: { button: 'w-12 h-12', icon: 'w-6 h-6', modal: 'max-w-2xl' },
    lg: { button: 'w-16 h-16', icon: 'w-8 h-8', modal: 'max-w-4xl' }
  };

  // Variant configurations
  const variantConfig = {
    floating: 'fixed bottom-6 right-6 z-50',
    inline: 'relative inline-block',
    toolbar: 'inline-flex items-center justify-center'
  };

  const config = sizeConfig[size];

  // Get available components from integration hook
  const availableComponents = React.useMemo(() => {
    const componentList: TamboComponentData[] = [];
    
    // Add existing components from the integration
    if (components && components.length > 0) {
      components.forEach((comp, index) => {
        componentList.push({
          ...comp,
          metadata: {
            timestamp: Date.now() - (index * 1000),
            description: 'Available component for insertion'
          }
        });
      });
    }

    // Add common template components
    const templateComponents: TamboComponentData[] = [
      {
        id: 'template-form',
        type: 'FormComponent',
        componentName: 'Contact Form',
        props: {
          title: 'Contact Us',
          fields: [
            { name: 'name', type: 'text', label: 'Name', required: true },
            { name: 'email', type: 'email', label: 'Email', required: true },
            { name: 'message', type: 'textarea', label: 'Message', required: true }
          ],
          submitText: 'Send Message'
        },
        metadata: { timestamp: Date.now(), description: 'Template form component' }
      },
      {
        id: 'template-chart',
        type: 'Graph',
        componentName: 'Sales Chart',
        props: {
          title: 'Monthly Sales',
          type: 'bar',
          data: [
            { month: 'Jan', sales: 12000 },
            { month: 'Feb', sales: 15000 },
            { month: 'Mar', sales: 18000 }
          ]
        },
        metadata: { timestamp: Date.now(), description: 'Template chart component' }
      },
      {
        id: 'template-map',
        type: 'Map',
        componentName: 'Location Map',
        props: {
          title: 'Our Locations',
          center: [40.7128, -74.0060],
          zoom: 10
        },
        metadata: { timestamp: Date.now(), description: 'Template map component' }
      }
    ];

    return [...componentList, ...templateComponents];
  }, [components]);

  const handleInsert = async (component: TamboComponentData) => {
    setIsOpen(false);
    const success = await insertComponent(component, {
      position: 'cursor',
      preserveState: true
    });

    if (success) {
      console.log('🎉 Component inserted successfully!');
    }
  };

  const handlePreview = (component: TamboComponentData) => {
    setSelectedComponent(component);
    setShowPreviewModal(true);
  };

  const renderComponentPreview = (component: TamboComponentData) => {
    const { type, props } = component;
    
    switch (type) {
      case 'FormComponent':
        return (
          <div className="bg-white p-6 rounded-lg border-2 border-blue-200 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">{props.title}</h3>
            <div className="space-y-3">
              {props.fields?.map((field: any, index: number) => (
                <div key={index} className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea className="w-full p-2 border rounded text-sm" disabled />
                  ) : (
                    <input 
                      type={field.type} 
                      className="w-full p-2 border rounded text-sm" 
                      disabled 
                    />
                  )}
                </div>
              ))}
            </div>
            <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded text-sm" disabled>
              {props.submitText || 'Submit'}
            </button>
          </div>
        );

      case 'Graph':
        return (
          <div className="bg-white p-6 rounded-lg border-2 border-green-200 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">{props.title}</h3>
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center text-gray-500">
                <div className="text-2xl mb-2">📊</div>
                <div>Chart Preview</div>
                <div className="text-sm mt-1">Type: {props.type}</div>
              </div>
            </div>
          </div>
        );

      case 'Map':
        return (
          <div className="bg-white p-6 rounded-lg border-2 border-purple-200 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">{props.title}</h3>
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300 h-48">
              <div className="text-center text-gray-500 h-full flex items-center justify-center">
                <div>
                  <div className="text-2xl mb-2">🗺️</div>
                  <div>Map Preview</div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">{component.componentName}</h3>
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center text-gray-500">
                <div className="text-2xl mb-2">🤖</div>
                <div>AI Component Preview</div>
                <div className="text-sm mt-1">Type: {type}</div>
              </div>
            </div>
          </div>
        );
    }
  };

  if (variant === 'floating') {
    return (
      <>
        {/* Floating Action Button */}
        <div className={`${variantConfig[variant]} ${className}`}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`${config.button} bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group`}
            disabled={isIntegrating}
            title={isOpen ? "Close component menu" : "Insert AI block to document"}
          >
            {isOpen ? (
              <X className={`${config.icon} transition-transform duration-200`} />
            ) : (
              <Plus className={`${config.icon} transition-transform duration-200 group-hover:rotate-90`} />
            )}
          </button>

          {/* Dropdown Panel */}
          {isOpen && (
            <div className="absolute bottom-16 right-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 max-h-96 overflow-y-auto">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Insert AI Component</h3>
                <p className="text-sm text-gray-600">Choose a component to add to your document</p>
              </div>

              <div className="space-y-2">
                {availableComponents.map((component) => (
                  <div
                    key={component.id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{component.componentName}</div>
                        <div className="text-xs text-gray-500 mt-1">Type: {component.type}</div>
                      </div>
                      <div className="flex space-x-2">
                        {showPreview && (
                          <button
                            onClick={() => handlePreview(component)}
                            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleInsert(component)}
                          className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                          title="Insert"
                          disabled={isIntegrating}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {availableComponents.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">🤖</div>
                  <div>No components available</div>
                  <div className="text-xs mt-1">Generate a component with Tambo AI first</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {showPreviewModal && selectedComponent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className={`${config.modal} bg-white rounded-xl shadow-2xl p-6 max-h-96 overflow-y-auto`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Component Preview</h3>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {renderComponentPreview(selectedComponent)}
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleInsert(selectedComponent)}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                  disabled={isIntegrating}
                >
                  {isIntegrating ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Inserting...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Insert to Doc</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Inline/Toolbar variant (simplified)
  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={`${variantConfig[variant]} ${config.button} bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center ${className}`}
      disabled={isIntegrating}
    >
      <Plus className={config.icon} />
    </button>
  );
}

export default InsertToDocButton;