import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import type { Express } from 'express';
import path from 'path';

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Phần mềm Quản lý tài sản - API',
      version: '1.0.0',
      description: 'API Documentation - Phần mềm Quản lý tài sản | Trường Cao đẳng Kinh tế - Kỹ thuật Cần Thơ',
      contact: {
        name: 'Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: [path.join(__dirname, '../src/routes/*.routes.ts'), path.join(__dirname, '../src/controllers/*.ts')]
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Serve Swagger UI
export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Phần mềm Quản lý tài sản - API Docs'
  }));

  // Serve swagger spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

// Get Swagger spec
export function getSwaggerSpec() {
  return swaggerSpec;
}
