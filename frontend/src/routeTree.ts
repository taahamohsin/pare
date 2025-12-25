import { Route as RootRoute } from "./routes/__root";
import { Route as IndexRoute } from "./routes/index";
import { Route as AuthCallbackRoute } from "./routes/auth/callback";

export const routeTree = RootRoute.addChildren([
    IndexRoute,
    AuthCallbackRoute,
]);
