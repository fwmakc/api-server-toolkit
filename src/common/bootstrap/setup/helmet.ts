export const Helmet = {
  setup(app: any, opts?: Record<string, any>): void {
    const helmet = require('helmet');
    app.use(helmet(opts));
  },
};
