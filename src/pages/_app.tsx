import { type Session } from "next-auth";
import { type AppType } from "next/app";
import { api } from "../utils/api";
import "styles/globals.css";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { ...pageProps },
}) => {
  return (
    <Component {...pageProps} />
  );
};

export default api.withTRPC(MyApp);
