import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { HomePage } from './pages/HomePage';
import { LessonsPage } from './pages/LessonsPage';
import { LessonDetailPage } from './pages/LessonDetailPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { ChatPage } from './pages/ChatPage';
import { ProfilePage } from './pages/ProfilePage';
import { PublicProfilePage } from './pages/PublicProfilePage';
import { FounderPage } from './pages/FounderPage';
import { DonationsPage } from './pages/DonationsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SupportPage } from './pages/SupportPage';
import { CompetitionsPage } from './pages/CompetitionsPage';
import { DuelsPage } from './pages/DuelsPage';
import { AdminPage } from './pages/AdminPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/aulas" element={<LessonsPage />} />
        <Route path="/aulas/:slug" element={<LessonDetailPage />} />
        <Route path="/exercicios" element={<ExercisesPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/perfil/:id" element={<PublicProfilePage />} />
        <Route path="/fundador" element={<FounderPage />} />
        <Route path="/doacoes" element={<DonationsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/duvida" element={<SupportPage />} />
        <Route path="/competicoes" element={<CompetitionsPage />} />
        <Route path="/duelos" element={<DuelsPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  );
}
