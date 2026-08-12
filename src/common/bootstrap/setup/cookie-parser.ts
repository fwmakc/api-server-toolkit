export const CookieParser = {
  setup(app: any): void {
    const cookieParser = require('cookie-parser');
    app.use(cookieParser());
  },
};
