import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Outlet,
  Route,
  useLocation,
} from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import { Workspace } from "./layouts/Workspace";
import {
  Dashboard,
  Journey,
  ConceptPage,
  TopicPage,
  Library,
  NotFound,
} from "./pages/LearningPages";
import { LessonPage } from "./pages/LessonPage";
import { Settings, Onboarding, ProgressPage } from "./pages/AccountPages";
import { Flashcards } from "./pages/Flashcards";
import {
  AdminLayout,
  AdminOverview,
  AdminContent,
  ContentEditor,
  MediaLibrary,
} from "./admin/AdminPages";
import { Loading } from "./components/ui";
import "./styles.css";
function Welcome() {
  const { loading, error } = useApp();
  return loading ? <Loading /> : error ? <Workspace /> : <Onboarding />;
}
function EditorRoute() {
  const location = useLocation();
  return <ContentEditor key={location.pathname} />;
}
function ScrollReset() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
function RootLayout() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <ScrollReset />
      <Outlet />
    </>
  );
}
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />}>
      <Route path="/start" element={<Welcome />} />
      <Route element={<Workspace />}>
        <Route index element={<Dashboard />} />
        <Route path="journey" element={<Journey />} />
        <Route path="journey/:id" element={<ConceptPage />} />
        <Route path="topics/:id" element={<TopicPage />} />
        <Route path="library" element={<Library />} />
        <Route path="lessons/:id" element={<LessonPage />} />
        <Route path="flashcards" element={<Flashcards />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="content/new" element={<EditorRoute />} />
          <Route path="content/:id" element={<EditorRoute />} />
          <Route path="media" element={<MediaLibrary />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Route>,
  ),
);
function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
