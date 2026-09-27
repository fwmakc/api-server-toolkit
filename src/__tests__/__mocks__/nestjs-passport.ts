export function AuthGuard(..._args: any[]) {
  return class {
    canActivate() { return true; }
  };
}
