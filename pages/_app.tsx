import App from 'next/app';
import type { AppProps, AppContext } from 'next/app';
import Nav from '../app/components/nav';
import { Analytics } from "@vercel/analytics/react";
import '@fortawesome/fontawesome-free/css/all.min.css'; // Import Font Awesome CSS
import '../public/fonts/fontawesome-pro/css/all.min.css'; // Import Font Awesome Pro CSS
import '../app/globals.css';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isHomePage = router.pathname === '/';

  return (
    <div>
      {!isHomePage && <Nav />}
      <Component {...pageProps} />
      <Analytics />
    </div>
  );
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext);
  return { ...appProps };
};

export default MyApp;
