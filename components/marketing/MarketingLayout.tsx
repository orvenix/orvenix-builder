import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { WhatsAppFloat } from './WhatsAppFloat';
import { GlobalEffects } from './GlobalEffects';
import { BackToTop } from './BackToTop';
import { SocialProofToast } from './SocialProofToast';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="mk-layout flex flex-col min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div id="scrollProgress" aria-hidden="true" />
      <div className="global-glow" aria-hidden="true" />
      <Navbar />
      <main className="flex-1 pt-20">
        {children}
      </main>
      <Footer />
      <WhatsAppFloat />
      <BackToTop />
      <SocialProofToast />
      <GlobalEffects />
    </div>
  );
}
