'use client';

import { useEffect, useRef } from 'react';
import { SwaggerUIBundle } from 'swagger-ui-dist';
import 'swagger-ui-dist/swagger-ui.css';

export default function SwaggerPage() {
  const swaggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!swaggerRef.current) return;

    const swaggerUi = SwaggerUIBundle({
      domNode: swaggerRef.current,
      url: "/api/swagger", 
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
      ],
      // layout: "StandaloneLayout" // You might want to uncomment this for a different look
    });

    return () => {
      if (swaggerUi && typeof swaggerUi.cleanup === 'function') {
        swaggerUi.cleanup();
      }
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

  return (
    <section 
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start', // Align to top if content overflows
        padding: '20px', // Add some padding around
        minHeight: '100vh' // Ensure it takes at least full viewport height
      }}
    >
      <div 
        ref={swaggerRef} 
        style={{
          width: '100%',
          maxWidth: '1200px' // Max width for the Swagger UI content itself
        }}
      />
    </section>
  );
}
