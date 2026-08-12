import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export const Swagger = {
  setup(app: any): void {
    const prefix = process.env.SWAGGER_PREFIX;
    if (!prefix) return;
    const swaggerConfig = new DocumentBuilder()
      .setTitle(process.env.SWAGGER_TITLE || '')
      .setDescription(process.env.SWAGGER_DESCRIPTION || '')
      .setVersion(process.env.SWAGGER_VERSION || '')
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(prefix, app, swaggerDocument);

    const redocPrefix = process.env.SWAGGER_PREFIX_REDOC;
    if (redocPrefix) {
      const redoc = require('redoc-express');
      app.use(redocPrefix, redoc({
        title: process.env.SWAGGER_TITLE || '',
        version: process.env.SWAGGER_VERSION || '',
        specUrl: `${prefix}-json`,
      }));
    }
  },
};
