import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './lib/ScrollToTop';
import { AuthProvider } from '@/lib/AuthContext';

const { Pages, standalonePages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={
              <LayoutWrapper currentPageName={mainPageKey}>
                <MainPage />
              </LayoutWrapper>
            } />
            {Object.entries(Pages).map(([pagePath, Page]) => (
              <Route
                key={pagePath}
                path={`/${pagePath}`}
                element={
                  <LayoutWrapper currentPageName={pagePath}>
                    <Page />
                  </LayoutWrapper>
                }
              />
            ))}
            {Object.entries(standalonePages ?? {}).map(([pagePath, Page]) => (
              <Route
                key={pagePath}
                path={`/${pagePath}`}
                element={<Page />}
              />
            ))}
            <Route path="*" element={<PageNotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
