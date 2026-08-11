import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import * as swaggerJson from './swagger.json';

/**
 * Setup Swagger documentation
 * @param app Express application
 */
export const setupSwagger = (app: Express) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerJson, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Phần mềm Quản lý tài sản - API',
  }));

  // Serve raw swagger JSON
  app.get('/api/docs-json', (req, res) => {
    res.json(swaggerJson);
  });
};

export default setupSwagger;