import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ThemeToggle from "@/components/theme-toggle";
import IntroSplash from "@/pages/IntroSplash";
import SaasLanding from "@/pages/SaasLanding";
import LandingPage from "@/pages/landing";
import Home from "@/pages/home";
import ProjectDetail from "@/pages/project-detail";
import EquipmentForm from "@/pages/equipment-form";
import EntryDetail from "@/pages/entry-detail";
import ExportPage from "@/pages/export-page";
import NotFound from "@/pages/not-found";
import CalculatorHome from "@/calculator/CalculatorHome";
import TransformerSC from "@/calculator/TransformerSC";
import VoltageDrop from "@/calculator/VoltageDrop";
import CableSize from "@/calculator/CableSize";
import SmartDesign from "@/calculator/SmartDesign";
import FullLoadCurrent from "@/calculator/FullLoadCurrent";
import MotorDesign from "@/calculator/MotorDesign";
import TransformerDesign from "@/calculator/TransformerDesign";
import FullSystemValidation from "@/calculator/FullSystemValidation";
import ArcFlashAnalysis from "@/calculator/ArcFlashAnalysis";


const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Intro splash screen */}
      <Route path="/" component={IntroSplash} />

      {/* Module selector */}
      <Route path="/home" component={LandingPage} />

      {/* SaaS product landing (optional) */}
      <Route path="/landing" component={SaasLanding} />

      {/* Existing survey routes — unchanged, now under /survey */}
      <Route path="/survey" component={Home} />
      <Route path="/project/:id" component={ProjectDetail} />
      <Route path="/project/:id/new/:type" component={EquipmentForm} />
      <Route path="/project/:id/entry/:entryId" component={EntryDetail} />
      <Route path="/project/:id/export" component={ExportPage} />

      {/* Calculator routes */}
      <Route path="/calculator" component={CalculatorHome} />
      <Route path="/calculator/transformer-sc" component={TransformerSC} />
      <Route path="/calculator/voltage-drop" component={VoltageDrop} />
      <Route path="/calculator/cable-size" component={CableSize} />
      <Route path="/calculator/smart-design" component={SmartDesign} />
      <Route path="/calculator/full-load-current" component={FullLoadCurrent} />
      <Route path="/calculator/motor-design" component={MotorDesign} />
      <Route path="/calculator/transformer-design" component={TransformerDesign} />
      <Route path="/calculator/system-validation" component={FullSystemValidation} />
      <Route path="/calculator/arc-flash" component={ArcFlashAnalysis} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
        <ThemeToggle />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
