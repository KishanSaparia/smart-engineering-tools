import { useLocation } from 'wouter';
import { Zap, ClipboardList, Calculator, ChevronRight } from 'lucide-react';
import PageFooter from '@/components/page-footer';

export default function LandingPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Electrical Tools</h1>
            <p className="text-xs text-muted-foreground">Select a module to continue</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">What would you like to do?</h2>
            <p className="text-sm text-muted-foreground">Choose a module below to get started.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Site Survey Tool */}
            <button
              id="landing-survey-tool"
              onClick={() => navigate('/survey')}
              className="group text-left bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <ClipboardList className="w-6 h-6 text-primary" />
              </div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground text-base mb-1">Site Survey Tool</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Collect, manage and export electrical equipment site survey data.
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-0.5 transition-colors" />
              </div>
            </button>

            {/* Electrical Calculator */}
            <button
              id="landing-calculator"
              onClick={() => navigate('/calculator')}
              className="group text-left bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Calculator className="w-6 h-6 text-primary" />
              </div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground text-base mb-1">Electrical Calculator</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Engineering calculators for transformer short circuit current and more.
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-0.5 transition-colors" />
              </div>
            </button>
          </div>
        </div>
      </main>
      <PageFooter />
    </div>
  );
}
