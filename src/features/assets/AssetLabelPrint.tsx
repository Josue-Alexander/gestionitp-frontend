import React, { useRef } from 'react';
import QRCode from 'react-qr-code';

interface AssetLabelPrintProps {
  asset: {
    id_objeto: number;
    num_inventario: string | null;
    nombre: string;
    qr_indentificador: string | null;
  };
  onPrint?: () => void;
}

function AssetLabelPrint({ asset, onPrint }: AssetLabelPrintProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!asset || !asset.qr_indentificador) {
    return (
      <div style={{ padding: '20px', color: '#e74c3c', textAlign: 'center' }}>
        ⚠️ Faltan datos para generar la etiqueta
      </div>
    );
  }

  const qrUrl = `http://localhost:5173/activo/qr/${asset.qr_indentificador}`;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const qrElement = printContent.querySelector('svg');
    const qrHTML = qrElement ? qrElement.outerHTML : '';

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      alert('Por favor, permite las ventanas emergentes para imprimir');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Etiqueta de Inventario</title>
          <style>
            @page {
              size: 90mm 25mm;
              margin: 0;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            body {
              width: 90mm;
              height: 25mm;
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            
            .etiqueta {
              display: flex;
              width: 90mm;
              height: 25mm;
              border: 1px solid #000;
              background: white;
              padding: 2mm;
              box-sizing: border-box;
              gap: 2mm;
              align-items: center;
            }
            
            .etiqueta-info {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              gap: 0.5mm;
              min-width: 0;
              overflow: hidden;
            }
            
            .etiqueta-logo {
              background: #003d7a;
              color: white;
              padding: 1mm 2.5mm;
              font-size: 8px;
              font-weight: bold;
              border-radius: 1px;
              width: fit-content;
              line-height: 1;
            }
            
            .etiqueta-institucion {
              font-size: 4.5pt;
              color: #666;
              line-height: 1;
              margin-top: 0.3mm;
            }
            
            .etiqueta-nombre {
              font-size: 6.5pt;
              font-weight: bold;
              color: #000;
              margin-top: 0.8mm;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              line-height: 1;
            }
            
            .etiqueta-inventario {
              font-size: 6pt;
              font-weight: bold;
              font-family: 'Courier New', monospace;
              color: #222;
              margin-top: 0.3mm;
              line-height: 1;
            }
            
            .etiqueta-qr {
              width: 16mm;
              height: 16mm;
              flex-shrink: 0;
            }
            
            .etiqueta-qr svg {
              width: 100%;
              height: 100%;
            }
          </style>
        </head>
        <body>
          <div class="etiqueta">
            <div class="etiqueta-info">
              <div class="etiqueta-logo">ITP</div>
              <div class="etiqueta-institucion">Instituto Tecnológico de Pachuca</div>
              <div class="etiqueta-nombre">${asset.nombre}</div>
              <div class="etiqueta-inventario">${asset.num_inventario || 'S/N'}</div>
            </div>
            <div class="etiqueta-qr">
              ${qrHTML}
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 250);
    };

    // Llamar al callback si existe
    if (onPrint) {
      onPrint();
    }
  };

  return (
    <div className="label-print-wrapper">
      {/* Vista previa escalada al 85% */}
      <div 
        ref={printRef} 
        style={{
          display: 'flex',
          width: '90mm',
          height: '25mm',
          border: '2px dashed #bbb',
          background: '#fff',
          padding: '2mm',
          boxSizing: 'border-box',
          fontFamily: 'Arial, sans-serif',
          gap: '2mm',
          alignItems: 'center',
          transform: 'scale(0.85)',
          transformOrigin: 'top center',
          margin: '0 auto',
          marginBottom: '-3.75mm'
        }}
      >
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '0.5mm',
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <div style={{
            background: '#003d7a',
            color: 'white',
            padding: '1mm 2.5mm',
            fontSize: '8px',
            fontWeight: 'bold',
            borderRadius: '1px',
            width: 'fit-content',
            lineHeight: 1
          }}>
            ITP
          </div>
          <div style={{
            fontSize: '4.5px',
            color: '#666',
            lineHeight: 1,
            marginTop: '0.3mm'
          }}>
            Instituto Tecnológico de Pachuca
          </div>
          <div style={{
            fontSize: '6px',
            fontWeight: 'bold',
            color: '#000',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginTop: '0.8mm',
            lineHeight: 1
          }}>
            {asset.nombre}
          </div>
          <div style={{
            fontSize: '5.5px',
            fontWeight: 'bold',
            fontFamily: 'Courier New, monospace',
            color: '#222',
            marginTop: '0.3mm',
            lineHeight: 1
          }}>
            {asset.num_inventario || 'S/N'}
          </div>
        </div>

        <div style={{
          width: '16mm',
          height: '16mm',
          flexShrink: 0
        }}>
          <QRCode
            value={qrUrl}
            size={128}
            level="M"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>

      {/* Botón de impresión - Puedes llamar handlePrint desde tu botón externo */}
      <button
        onClick={handlePrint}
        style={{
          marginTop: '15px',
          backgroundColor: '#003d7a',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          justifyContent: 'center'
        }}
      >
        <span>🖨️</span>
        Imprimir Etiqueta
      </button>
    </div>
  );
}

export default AssetLabelPrint;