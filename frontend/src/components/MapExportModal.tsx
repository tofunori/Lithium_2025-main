import React, { useState } from 'react';
import { Map } from 'leaflet';
import { MapExporter, ExportOptions, MapTemplate, DEFAULT_TEMPLATES } from '../utils/mapExport';
import { useTheme } from '../context/ThemeContext';
import './MapExportModal.css';

interface MapExportModalProps {
  map: Map | null;
  isOpen: boolean;
  onClose: () => void;
}

const MapExportModal: React.FC<MapExportModalProps> = ({ map, isOpen, onClose }) => {
  const { isDarkMode } = useTheme();
  const [exportOptions, setExportOptions] = useState<Partial<ExportOptions>>({
    format: 'png',
    quality: 1.0,
    width: 1920,
    height: 1080,
    filename: 'lithium-facilities-map',
    includeWatermark: true,
    includeTitle: true,
    includeLegend: true,
    includeScale: true,
    includeAttribution: true,
    showFacilityCount: true,
    customTitle: 'Lithium Battery Recycling Facilities',
    layoutStyle: 'sidebar'
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>('current');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');

  if (!isOpen || !map) return null;

  const handleExport = async () => {
    if (!map) return;

    setIsExporting(true);
    setExportProgress('Preparing export...');

    try {
      const exporter = new MapExporter(map);

      if (selectedTemplate === 'current') {
        setExportProgress('Capturing current map view...');
        await exporter.exportMap(exportOptions);
        setExportProgress('Export completed!');
      } else if (selectedTemplate === 'batch') {
        const templates = DEFAULT_TEMPLATES.filter(t => selectedTemplates.includes(t.id));
        setExportProgress(`Exporting ${templates.length} maps...`);
        await exporter.exportBatch(templates, exportOptions);
        setExportProgress('Batch export completed!');
      } else {
        const template = DEFAULT_TEMPLATES.find(t => t.id === selectedTemplate);
        if (template) {
          setExportProgress(`Exporting ${template.name}...`);
          await exporter.exportTemplate(template, exportOptions);
          setExportProgress('Template export completed!');
        }
      }

      setTimeout(() => {
        setExportProgress('');
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Export failed:', error);
      setExportProgress('Export failed. Please try again.');
      setTimeout(() => setExportProgress(''), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleTemplateSelection = (templateId: string) => {
    if (selectedTemplate === 'batch') {
      setSelectedTemplates(prev => 
        prev.includes(templateId) 
          ? prev.filter(id => id !== templateId)
          : [...prev, templateId]
      );
    } else {
      setSelectedTemplate(templateId);
    }
  };

  const resolutionPresets = [
    { name: 'HD (1920x1080)', width: 1920, height: 1080 },
    { name: '4K (3840x2160)', width: 3840, height: 2160 },
    { name: 'Print (300 DPI)', width: 3300, height: 2550 },
    { name: 'Web (1200x800)', width: 1200, height: 800 },
    { name: 'Mobile (800x600)', width: 800, height: 600 }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content map-export-modal ${isDarkMode ? 'dark' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Export Map</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Export Type Selection */}
          <div className="export-section">
            <h3>Export Type</h3>
            <div className="export-type-buttons">
              <button 
                className={`export-type-btn ${selectedTemplate === 'current' ? 'active' : ''}`}
                onClick={() => setSelectedTemplate('current')}
              >
                Current View
              </button>
              <button 
                className={`export-type-btn ${selectedTemplate !== 'current' && selectedTemplate !== 'batch' ? 'active' : ''}`}
                onClick={() => setSelectedTemplate('overview')}
              >
                Template
              </button>
              <button 
                className={`export-type-btn ${selectedTemplate === 'batch' ? 'active' : ''}`}
                onClick={() => setSelectedTemplate('batch')}
              >
                Batch Export
              </button>
            </div>
          </div>

          {/* Template Selection */}
          {(selectedTemplate !== 'current') && (
            <div className="export-section">
              <h3>
                {selectedTemplate === 'batch' ? 'Select Templates' : 'Select Template'}
              </h3>
              <div className="template-grid">
                {DEFAULT_TEMPLATES.map(template => (
                  <div 
                    key={template.id}
                    className={`template-card ${
                      selectedTemplate === 'batch' 
                        ? (selectedTemplates.includes(template.id) ? 'selected' : '')
                        : (selectedTemplate === template.id ? 'selected' : '')
                    }`}
                    onClick={() => handleTemplateSelection(template.id)}
                  >
                    <h4>{template.name}</h4>
                    <p>{template.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export Options */}
          <div className="export-section">
            <h3>Export Options</h3>
            
            <div className="option-row">
              <label>Format:</label>
              <select 
                value={exportOptions.format || 'png'}
                onChange={e => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="svg">SVG</option>
              </select>
            </div>

            <div className="option-row">
              <label>Resolution:</label>
              <select 
                value={`${exportOptions.width}x${exportOptions.height}`}
                onChange={e => {
                  const preset = resolutionPresets.find(p => `${p.width}x${p.height}` === e.target.value);
                  if (preset) {
                    setExportOptions(prev => ({ 
                      ...prev, 
                      width: preset.width, 
                      height: preset.height 
                    }));
                  }
                }}
              >
                {resolutionPresets.map(preset => (
                  <option key={preset.name} value={`${preset.width}x${preset.height}`}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="option-row">
              <label>Quality:</label>
              <input 
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={exportOptions.quality || 1.0}
                onChange={e => setExportOptions(prev => ({ ...prev, quality: parseFloat(e.target.value) }))}
              />
              <span>{exportOptions.quality || 1.0}x</span>
            </div>

            <div className="option-row">
              <label>Filename:</label>
              <input 
                type="text"
                value={exportOptions.filename || 'lithium-facilities-map'}
                onChange={e => setExportOptions(prev => ({ ...prev, filename: e.target.value }))}
                placeholder="Enter filename"
              />
            </div>

            {/* Map Elements Section */}
            <div className="option-section">
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: '600' }}>Map Elements</h4>
              
              <div className="option-row">
                <label>
                  <input 
                    type="checkbox"
                    checked={exportOptions.includeTitle || false}
                    onChange={e => setExportOptions(prev => ({ ...prev, includeTitle: e.target.checked }))}
                  />
                  Include title
                </label>
              </div>

              {exportOptions.includeTitle && (
                <div className="option-row">
                  <label>Custom title:</label>
                  <input 
                    type="text"
                    value={exportOptions.customTitle || ''}
                    onChange={e => setExportOptions(prev => ({ ...prev, customTitle: e.target.value }))}
                    placeholder="Enter map title"
                  />
                </div>
              )}

              <div className="option-row">
                <label>
                  <input 
                    type="checkbox"
                    checked={exportOptions.includeLegend || false}
                    onChange={e => setExportOptions(prev => ({ ...prev, includeLegend: e.target.checked }))}
                  />
                  Include legend
                </label>
              </div>

              <div className="option-row">
                <label>
                  <input 
                    type="checkbox"
                    checked={exportOptions.includeScale || false}
                    onChange={e => setExportOptions(prev => ({ ...prev, includeScale: e.target.checked }))}
                  />
                  Include scale bar
                </label>
              </div>

              <div className="option-row">
                <label>
                  <input 
                    type="checkbox"
                    checked={exportOptions.showFacilityCount || false}
                    onChange={e => setExportOptions(prev => ({ ...prev, showFacilityCount: e.target.checked }))}
                  />
                  Show facility count
                </label>
              </div>

              <div className="option-row">
                <label>
                  <input 
                    type="checkbox"
                    checked={exportOptions.includeAttribution || false}
                    onChange={e => setExportOptions(prev => ({ ...prev, includeAttribution: e.target.checked }))}
                  />
                  Include attribution
                </label>
              </div>

              <div className="option-row">
                <label>
                  <input 
                    type="checkbox"
                    checked={exportOptions.includeWatermark || false}
                    onChange={e => setExportOptions(prev => ({ ...prev, includeWatermark: e.target.checked }))}
                  />
                  Include watermark
                </label>
              </div>

              {exportOptions.includeLegend && (
                <div className="option-row">
                  <label>Legend layout:</label>
                  <select 
                    value={exportOptions.layoutStyle || 'sidebar'}
                    onChange={e => setExportOptions(prev => ({ ...prev, layoutStyle: e.target.value as any }))}
                  >
                    <option value="sidebar">Sidebar (Standard)</option>
                    <option value="compact">Sidebar (Compact)</option>
                    <option value="overlay">Overlay (Bottom)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Export Progress */}
          {exportProgress && (
            <div className="export-progress">
              <div className="progress-text">{exportProgress}</div>
              {isExporting && <div className="progress-spinner"></div>}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={isExporting}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleExport}
            disabled={isExporting || (selectedTemplate === 'batch' && selectedTemplates.length === 0)}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapExportModal;