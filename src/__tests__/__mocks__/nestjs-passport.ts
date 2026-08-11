export function AuthGuard(...args: any[]) {
  return class {
    canActivate() { return true; }
  };
}
