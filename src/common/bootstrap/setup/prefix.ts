export const Prefix = {
  setup(app: any): void {
    const prefix = process.env.PREFIX;
    if (prefix) {
      app.setGlobalPrefix(prefix);
    }
  },
};
