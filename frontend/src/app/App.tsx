import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { useAuth } from "@/app/context/AuthContext";
import { LoginPage } from "@/app/components/LoginPage";
import { SignupPage } from "@/app/components/SignupPage";
import { WelcomePage } from "@/app/components/onboarding/WelcomePage";
import { ConnectWalletPage } from "@/app/components/onboarding/ConnectWalletPage";
import { AccountSetupPage } from "@/app/components/onboarding/AccountSetupPage";
import { Dashboard } from "@/app/components/Dashboard";
import { TransactionForm } from "@/app/components/TransactionForm";
import { PendingTransactions } from "@/app/components/PendingTransactions";
import { TransactionHistory } from "@/app/components/TransactionHistory";
import { WalletAccount } from "@/app/components/WalletAccount";
import { RulesSettings } from "@/app/components/RulesSettings";
import { Sidebar } from "@/app/components/Sidebar";

type AuthScreen = "login" | "signup";
type OnboardingStep = "welcome" | "wallet" | "account";

export default function App() {
  const { user, isLoading, isFirstLogin } = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("welcome");
  const [currentPage, setCurrentPage] = useState("dashboard");

  // Listen for browser back button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state) {
        if (state.authScreen) setAuthScreen(state.authScreen);
        if (state.onboardingStep) setOnboardingStep(state.onboardingStep);
        if (state.currentPage) setCurrentPage(state.currentPage);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Persist invite code from URL so it survives login/signup flow
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    if (invite) {
      localStorage.setItem('pendingInviteCode', invite);
    }
  }, []);

  // Update browser history when navigation changes
  const updateHistory = (newAuthScreen?: AuthScreen, newOnboardingStep?: OnboardingStep, newCurrentPage?: string) => {
    const state = {
      authScreen: newAuthScreen || authScreen,
      onboardingStep: newOnboardingStep || onboardingStep,
      currentPage: newCurrentPage || currentPage,
    };
    window.history.pushState(state, '', window.location.pathname);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    updateHistory(authScreen, onboardingStep, page);
  };

  // Show loading screen while initializing auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16">
            <img src="/logo.png" alt="Thresho" className="w-16 h-16" />
          </div>
          <p className="text-muted-foreground text-sm">Loading Thresho...</p>
        </div>
      </div>
    );
  }

  // Authentication flow
  if (!user) {
    return authScreen === "login" ? (
      <LoginPage
        onLogin={() => {
          setAuthScreen("login");
          updateHistory("login");
        }}
        onSignupClick={() => {
          setAuthScreen("signup");
          updateHistory("signup");
        }}
      />
    ) : (
      <SignupPage
        onLoginClick={() => {
          setAuthScreen("login");
          updateHistory("login");
        }}
      />
    );
  }

  // First-time onboarding flow (including pending signups)
  if (isFirstLogin && !user?.hasCompletedOnboarding) {
    switch (onboardingStep) {
      case "welcome":
        return <WelcomePage onNext={() => {
          setOnboardingStep("wallet");
          updateHistory(authScreen, "wallet");
        }} />;
      case "wallet":
        return (
          <ConnectWalletPage
            onNext={() => {
              setOnboardingStep("account");
              updateHistory(authScreen, "account");
            }}
            onSkip={() => {
              setOnboardingStep("welcome");
              updateHistory(authScreen, "welcome");
            }}
          />
        );
      case "account":
        return (
          <AccountSetupPage
            onComplete={() => {
              setCurrentPage("dashboard");
              updateHistory(authScreen, "account", "dashboard");
            }}
          />
        );
    }
  }

  // Render current page content
  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard onNavigate={handleNavigate} />;
      case "transaction-form":
        return <TransactionForm onNavigate={handleNavigate} />;
      case "pending":
        return <PendingTransactions onNavigate={handleNavigate} />;
      case "history":
        return <TransactionHistory onNavigate={handleNavigate} />;
      case "wallet":
        return <WalletAccount onNavigate={handleNavigate} />;
      case "settings":
        return <RulesSettings onNavigate={handleNavigate} />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="flex min-h-screen bg-background">
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
        />
        <main className="flex-1 overflow-auto">
          <div className="container max-w-7xl mx-auto p-4 lg:p-8">
            {renderPage()}
          </div>
        </main>
      </div>
    </>
  );
}
