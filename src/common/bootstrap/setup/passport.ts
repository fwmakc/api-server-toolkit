export const Passport = {
  setup(app: any): void {
    const passport = require('passport');
    app.use(passport.initialize());
  },
};
