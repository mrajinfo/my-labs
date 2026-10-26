import { Toaster } from 'sonner';
import { AgeCalculator } from './components/AgeCalculator.jsx';
import { FamilyPanel } from './components/FamilyPanel.jsx';
import { Footer } from './components/Footer.jsx';
import { Header } from './components/Header.jsx';
import { TodayCard } from './components/TodayCard.jsx';
import { CalendarModeProvider } from './state/CalendarModeProvider.jsx';
import { TodayProvider } from './state/TodayProvider.jsx';

export default function App() {
  return (
    <CalendarModeProvider>
      <TodayProvider>
        <div className="flex min-h-dvh flex-col">
          <Header />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-5 pb-14 sm:px-6 sm:pt-8 lg:px-8 lg:pt-10">
            <h1 className="sr-only">Umer, a Nepali age calculator for Bikram Sambat and Gregorian dates</h1>
            <div className="grid gap-5 sm:gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-start lg:gap-8">
              <div className="grid gap-5 sm:gap-6 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:items-start lg:sticky lg:top-24 lg:grid-cols-1">
                <div className="md:sticky md:top-24 lg:static">
                  <TodayCard />
                </div>
                <AgeCalculator />
              </div>
              <FamilyPanel />
            </div>
          </main>
          <Footer />
        </div>
        <Toaster
          position="bottom-center"
          offset={20}
          toastOptions={{ style: { fontFamily: 'var(--font-sans)', fontSize: '0.9375rem' } }}
        />
      </TodayProvider>
    </CalendarModeProvider>
  );
}
