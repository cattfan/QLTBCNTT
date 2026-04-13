declare module 'passport-jwt' {
  export interface StrategyOptions {
    jwtFromRequest: (req: unknown) => string | null;
    ignoreExpiration?: boolean;
    secretOrKey: string;
  }

  export class Strategy {
    constructor(options: StrategyOptions);
  }

  export const ExtractJwt: {
    fromAuthHeaderAsBearerToken(): (req: unknown) => string | null;
  };
}
