import html2canvas from 'html2canvas';
import { Map } from 'leaflet';

export interface ExportOptions {
  format: 'png' | 'jpeg' | 'svg' | 'pdf';
  quality: number;
  width: number;
  height: number;
  filename: string;
  includeWatermark?: boolean;
  includeTitle?: boolean;
  includeLegend?: boolean;
  includeScale?: boolean;
  includeAttribution?: boolean;
  customTitle?: string;
  showFacilityCount?: boolean;
  layoutStyle?: 'sidebar' | 'overlay' | 'compact';
}

export interface MapTemplate {
  id: string;
  name: string;
  description: string;
  center: [number, number];
  zoom: number;
  filters?: Record<string, unknown>;
  style?: 'light' | 'dark' | 'satellite';
}

export const DEFAULT_TEMPLATES: MapTemplate[] = [
  {
    id: 'overview',
    name: 'All Facilities Overview',
    description: 'Complete view of all lithium facilities in North America',
    center: [40, -95],
    zoom: 4
  },
  {
    id: 'operational',
    name: 'Operational Facilities',
    description: 'Currently operational lithium facilities',
    center: [40, -95],
    zoom: 4,
    filters: { status: 'operational' }
  },
  {
    id: 'under-construction',
    name: 'Under Construction',
    description: 'Facilities currently under construction',
    center: [40, -95],
    zoom: 4,
    filters: { status: 'under-construction' }
  },
  {
    id: 'planned',
    name: 'Planned Facilities',
    description: 'Planned lithium facilities',
    center: [40, -95],
    zoom: 4,
    filters: { status: 'planned' }
  },
  {
    id: 'closed',
    name: 'Closed Facilities',
    description: 'Facilities that are closed or suspended',
    center: [40, -95],
    zoom: 4,
    filters: { status: 'closed' }
  },
  {
    id: 'technology-hydro',
    name: 'Hydrometallurgical Processing',
    description: 'Facilities using hydrometallurgical technology',
    center: [40, -95],
    zoom: 4,
    filters: { technology: 'Hydrometallurgical' }
  },
  {
    id: 'technology-pyro',
    name: 'Pyrometallurgical Processing',
    description: 'Facilities using pyrometallurgical technology',
    center: [40, -95],
    zoom: 4,
    filters: { technology: 'Pyrometallurgical' }
  },
  {
    id: 'technology-mech',
    name: 'Mechanical Processing',
    description: 'Facilities using mechanical processing',
    center: [40, -95],
    zoom: 4,
    filters: { technology: 'Mechanical' }
  },
  {
    id: 'technology-direct',
    name: 'Direct Recycling',
    description: 'Facilities using direct recycling technology',
    center: [40, -95],
    zoom: 4,
    filters: { technology: 'Direct' }
  },
  {
    id: 'high-capacity',
    name: 'High Capacity Facilities',
    description: 'Facilities with >10,000 tonnes/year capacity',
    center: [40, -95],
    zoom: 4,
    filters: { minCapacity: 10000 }
  },
  {
    id: 'medium-capacity',
    name: 'Medium Capacity Facilities',
    description: 'Facilities with 1,000-10,000 tonnes/year capacity',
    center: [40, -95],
    zoom: 4,
    filters: { minCapacity: 1000, maxCapacity: 10000 }
  },
  {
    id: 'us-west',
    name: 'Western US Facilities',
    description: 'Facilities in western United States (Pacific, Mountain)',
    center: [39, -115],
    zoom: 5,
    filters: { regions: ['California', 'Nevada', 'Arizona', 'Utah', 'Colorado', 'Washington', 'Oregon'] }
  },
  {
    id: 'us-east',
    name: 'Eastern US Facilities',
    description: 'Facilities in eastern United States (Atlantic, Southeast)',
    center: [39, -80],
    zoom: 5,
    filters: { regions: ['New York', 'Pennsylvania', 'Virginia', 'North Carolina', 'South Carolina', 'Georgia', 'Florida', 'Massachusetts'] }
  },
  {
    id: 'us-midwest',
    name: 'Midwest US Facilities',
    description: 'Facilities in midwest United States',
    center: [41, -87],
    zoom: 5,
    filters: { regions: ['Michigan', 'Ohio', 'Indiana', 'Illinois', 'Wisconsin', 'Minnesota'] }
  },
  {
    id: 'us-south',
    name: 'Southern US Facilities',
    description: 'Facilities in southern United States',
    center: [32, -95],
    zoom: 5,
    filters: { regions: ['Texas', 'Louisiana', 'Alabama', 'Mississippi', 'Tennessee', 'Arkansas', 'Oklahoma'] }
  },
  {
    id: 'canada',
    name: 'Canadian Facilities',
    description: 'Lithium facilities in Canada',
    center: [56, -106],
    zoom: 4,
    filters: { country: 'Canada' }
  }
];

export class MapExporter {
  private map: Map;

  constructor(map: Map) {
    this.map = map;
  }

  async exportMap(options: Partial<ExportOptions> = {}): Promise<void> {
    const defaultOptions: ExportOptions = {
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
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    try {
      const mapContainer = this.map.getContainer();
      
      // Create a temporary container for the enhanced map
      const enhancedContainer = await this.createEnhancedMapContainer(mapContainer, finalOptions);
      
      // Hide original controls during export
      const controls = mapContainer.querySelectorAll('.leaflet-control-container, .map-controls');
      controls.forEach(control => {
        (control as HTMLElement).style.display = 'none';
      });

      // Wait for tiles to load
      await this.waitForTilesToLoad();

      // Create canvas from enhanced container
      const canvas = await html2canvas(enhancedContainer, {
        useCORS: true,
        allowTaint: false,
        scale: finalOptions.quality,
        width: finalOptions.width,
        height: finalOptions.height,
        backgroundColor: '#ffffff'
      });

      // Download based on format
      await this.downloadCanvas(canvas, finalOptions);

      // Cleanup
      document.body.removeChild(enhancedContainer);
      
      // Restore controls
      controls.forEach(control => {
        (control as HTMLElement).style.display = '';
      });

    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export map. Please try again.');
    }
  }

  async exportTemplate(template: MapTemplate, options: Partial<ExportOptions> = {}): Promise<void> {
    // Store current map state
    const originalCenter = this.map.getCenter();
    const originalZoom = this.map.getZoom();

    try {
      // Apply template settings
      this.map.setView(template.center, template.zoom);
      
      // Wait for map to settle
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Export with template name
      const filename = options.filename || `${template.id}-map`;
      await this.exportMap({ ...options, filename });

    } finally {
      // Restore original map state
      this.map.setView(originalCenter, originalZoom);
    }
  }

  async exportBatch(templates: MapTemplate[], options: Partial<ExportOptions> = {}): Promise<void> {
    for (const template of templates) {
      await this.exportTemplate(template, {
        ...options,
        filename: `${template.id}-${options.filename || 'map'}`
      });
      
      // Small delay between exports
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  private async waitForTilesToLoad(): Promise<void> {
    return new Promise((resolve) => {
      const checkTiles = () => {
        const tiles = this.map.getContainer().querySelectorAll('.leaflet-tile');
        const loadedTiles = Array.from(tiles).filter(tile => 
          (tile as HTMLImageElement).complete || 
          (tile as HTMLElement).style.opacity === '1'
        );
        
        if (loadedTiles.length === tiles.length) {
          setTimeout(resolve, 500); // Extra wait for stability
        } else {
          setTimeout(checkTiles, 100);
        }
      };
      checkTiles();
    });
  }

  private async createEnhancedMapContainer(originalContainer: HTMLElement, options: ExportOptions): Promise<HTMLElement> {
    // Clone the original map container
    const mapClone = originalContainer.cloneNode(true) as HTMLElement;
    
    // Create wrapper container with title, legend, etc.
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      width: ${options.width}px;
      height: ${options.height}px;
      background: #ffffff;
      position: absolute;
      top: -9999px;
      left: -9999px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-sizing: border-box;
    `;

    // Add title if requested
    if (options.includeTitle) {
      const title = document.createElement('div');
      title.style.cssText = `
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        font-size: ${Math.max(18, options.width / 60)}px;
        font-weight: 600;
        color: #1f2937;
        text-align: center;
        z-index: 1000;
        background: rgba(255, 255, 255, 0.9);
        padding: 10px 20px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      `;
      title.textContent = options.customTitle || 'Lithium Battery Recycling Facilities';
      wrapper.appendChild(title);
    }

    // Add facility count if requested
    if (options.showFacilityCount) {
      const facilityCount = this.getFacilityCount();
      const countDiv = document.createElement('div');
      countDiv.style.cssText = `
        position: absolute;
        top: 20px;
        left: 20px;
        font-size: ${Math.max(12, options.width / 80)}px;
        color: #4b5563;
        background: rgba(255, 255, 255, 0.9);
        padding: 8px 12px;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        z-index: 1000;
      `;
      countDiv.innerHTML = `<i class="fas fa-map-marker-alt" style="margin-right: 6px;"></i>${facilityCount} facilities`;
      wrapper.appendChild(countDiv);
    }

    // Calculate layout dimensions based on layout style
    const mapTopOffset = options.includeTitle ? 80 : 20;
    const layoutStyle = options.layoutStyle || 'sidebar';
    
    let legendWidth = 0;
    let mapRightOffset = 20;
    let mapBottomOffset = 60;

    if (options.includeLegend) {
      if (layoutStyle === 'sidebar') {
        legendWidth = 160; // Fixed small width
        mapRightOffset = 170; // Minimal 10px gap from map edge
      } else if (layoutStyle === 'compact') {
        legendWidth = 140; // Even smaller fixed width
        mapRightOffset = 150; // Minimal 10px gap
      } else { // overlay
        mapRightOffset = 20;
        mapBottomOffset = 120; // More space for overlay legend
      }
    }

    // Style the map clone to fit the remaining space
    mapClone.style.cssText = `
      position: absolute;
      top: ${mapTopOffset}px;
      left: 20px;
      right: ${mapRightOffset}px;
      bottom: ${mapBottomOffset}px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;

    // Add legend if requested (positioned based on layout style)
    if (options.includeLegend) {
      const legend = this.createLegend(options, legendWidth, layoutStyle);
      wrapper.appendChild(legend);
    }

    // Add scale bar if requested (positioned on the map)
    if (options.includeScale) {
      const scale = this.createScaleBar(options);
      wrapper.appendChild(scale);
    }

    // Add attribution if requested
    if (options.includeAttribution) {
      const attribution = this.createAttribution(options);
      wrapper.appendChild(attribution);
    }

    wrapper.appendChild(mapClone);
    document.body.appendChild(wrapper);

    return wrapper;
  }

  private getFacilityCount(): number {
    // Count markers on the map
    const markers = document.querySelectorAll('.leaflet-marker-pane .leaflet-marker-icon');
    return markers.length;
  }

  private createLegend(options: ExportOptions, legendWidth: number, layoutStyle: string): HTMLElement {
    const legend = document.createElement('div');
    const mapTopOffset = options.includeTitle ? 80 : 20;
    
    let legendStyles = '';
    
    if (layoutStyle === 'overlay') {
      // Position legend as overlay at bottom of map
      legendStyles = `
        position: absolute;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 255, 255, 0.95);
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        font-size: ${Math.max(10, options.width / 140)}px;
        z-index: 1001;
        border: 1px solid rgba(0, 0, 0, 0.1);
        display: flex;
        gap: 15px;
        align-items: center;
        backdrop-filter: blur(10px);
      `;
    } else {
      // Sidebar layout (default and compact)
      legendStyles = `
        position: absolute;
        top: ${mapTopOffset + 20}px;
        right: 20px;
        width: ${legendWidth}px;
        background: rgba(255, 255, 255, 0.95);
        padding: ${layoutStyle === 'compact' ? '10px' : '12px'};
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-size: ${Math.max(10, options.width / 160)}px;
        z-index: 1000;
        border: 1px solid rgba(0, 0, 0, 0.1);
      `;
    }
    
    legend.style.cssText = legendStyles;

    // Add legend content based on layout style
    const statusItems = [
      { color: '#10b981', label: 'Operational' },
      { color: '#f59e0b', label: 'Under Construction' },
      { color: '#3b82f6', label: 'Planned' },
      { color: '#dc2626', label: 'Closed' },
      { color: '#94a3b8', label: 'Unknown' }
    ];

    if (layoutStyle === 'overlay') {
      // Compact horizontal layout for overlay
      const titleSpan = document.createElement('span');
      titleSpan.style.cssText = `
        font-weight: 600;
        color: #1f2937;
        margin-right: 15px;
        white-space: nowrap;
      `;
      titleSpan.textContent = 'Status:';
      legend.appendChild(titleSpan);

      statusItems.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.style.cssText = `
          display: flex;
          align-items: center;
          color: #374151;
          white-space: nowrap;
        `;
        
        const colorBox = document.createElement('div');
        colorBox.style.cssText = `
          width: 12px;
          height: 12px;
          background: ${item.color};
          border-radius: 2px;
          margin-right: 6px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
        `;
        
        const label = document.createElement('span');
        label.textContent = item.label;
        label.style.fontSize = '0.9em';
        
        itemDiv.appendChild(colorBox);
        itemDiv.appendChild(label);
        legend.appendChild(itemDiv);
      });
    } else {
      // Vertical layout for sidebar
      const title = document.createElement('div');
      title.style.cssText = `
        font-weight: 600;
        margin-bottom: ${layoutStyle === 'compact' ? '8px' : '12px'};
        color: #1f2937;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: ${layoutStyle === 'compact' ? '6px' : '8px'};
      `;
      title.textContent = 'Facility Status';
      legend.appendChild(title);

      statusItems.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.style.cssText = `
          display: flex;
          align-items: center;
          margin-bottom: ${layoutStyle === 'compact' ? '6px' : '8px'};
          color: #374151;
        `;
        
        const colorBox = document.createElement('div');
        colorBox.style.cssText = `
          width: ${layoutStyle === 'compact' ? '12px' : '14px'};
          height: ${layoutStyle === 'compact' ? '12px' : '14px'};
          background: ${item.color};
          border-radius: 3px;
          margin-right: 8px;
          border: 1px solid rgba(0, 0, 0, 0.1);
        `;
        
        const label = document.createElement('span');
        label.textContent = item.label;
        
        itemDiv.appendChild(colorBox);
        itemDiv.appendChild(label);
        legend.appendChild(itemDiv);
      });
    }

    return legend;
  }

  private createScaleBar(options: ExportOptions): HTMLElement {
    const scale = document.createElement('div');
    const mapTopOffset = options.includeTitle ? 80 : 20;
    
    scale.style.cssText = `
      position: absolute;
      bottom: 80px;
      left: 40px;
      background: rgba(255, 255, 255, 0.9);
      padding: 8px 12px;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      font-size: ${Math.max(10, options.width / 140)}px;
      color: #4b5563;
      z-index: 1001;
      border: 1px solid rgba(0, 0, 0, 0.1);
    `;

    // Simple scale representation (would need actual calculation for accuracy)
    const scaleBar = document.createElement('div');
    scaleBar.style.cssText = `
      width: 100px;
      height: 4px;
      background: #374151;
      margin-bottom: 4px;
      position: relative;
    `;
    
    // Add scale marks
    const leftMark = document.createElement('div');
    leftMark.style.cssText = `
      position: absolute;
      left: 0;
      top: -2px;
      width: 1px;
      height: 8px;
      background: #374151;
    `;
    
    const rightMark = document.createElement('div');
    rightMark.style.cssText = `
      position: absolute;
      right: 0;
      top: -2px;
      width: 1px;
      height: 8px;
      background: #374151;
    `;
    
    scaleBar.appendChild(leftMark);
    scaleBar.appendChild(rightMark);
    
    const scaleText = document.createElement('div');
    scaleText.textContent = '0        100 km'; // Simplified - would need calculation
    scaleText.style.cssText = `
      font-size: ${Math.max(9, options.width / 160)}px;
      text-align: center;
    `;
    
    scale.appendChild(scaleBar);
    scale.appendChild(scaleText);
    
    return scale;
  }

  private createAttribution(options: ExportOptions): HTMLElement {
    const attribution = document.createElement('div');
    attribution.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
      font-size: ${Math.max(9, options.width / 160)}px;
      color: #6b7280;
      text-align: center;
      background: rgba(255, 255, 255, 0.8);
      padding: 6px 10px;
      border-radius: 4px;
      z-index: 1000;
    `;
    
    const currentDate = new Date().toLocaleDateString();
    attribution.innerHTML = `
      Map data © OpenStreetMap contributors | Tiles © CartoDB | 
      Generated ${currentDate} | Lithium Facilities Database
    `;
    
    if (options.includeWatermark) {
      attribution.innerHTML += ' | Generated with Claude Code';
    }
    
    return attribution;
  }

  private addWatermark(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const watermarkText = 'Generated with Claude Code';
    const fontSize = Math.max(10, canvas.width / 100);
    
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    
    const padding = 15;
    ctx.fillText(
      watermarkText, 
      canvas.width - padding, 
      canvas.height - padding
    );
  }

  private async downloadCanvas(canvas: HTMLCanvasElement, options: ExportOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        const filename = `${options.filename}-${timestamp}.${options.format}`;

        if (options.format === 'png' || options.format === 'jpeg') {
          canvas.toBlob((blob) => {
            if (blob) {
              this.downloadBlob(blob, filename);
              resolve();
            } else {
              reject(new Error('Failed to create blob'));
            }
          }, `image/${options.format}`, options.quality);
        } else if (options.format === 'svg') {
          // For SVG, we'd need a different approach
          // This is a simplified version - real SVG export would require more work
          const dataUrl = canvas.toDataURL('image/png');
          const svgContent = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
              <image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}"/>
            </svg>
          `;
          const blob = new Blob([svgContent], { type: 'image/svg+xml' });
          this.downloadBlob(blob, filename);
          resolve();
        } else if (options.format === 'pdf') {
          // For PDF, we'd integrate with jsPDF
          // This is a placeholder - would need additional library
          canvas.toBlob((blob) => {
            if (blob) {
              this.downloadBlob(blob, filename.replace('.pdf', '.png'));
              resolve();
            } else {
              reject(new Error('Failed to create blob'));
            }
          }, 'image/png', options.quality);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}