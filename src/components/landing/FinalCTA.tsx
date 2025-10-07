import { Link } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/90 py-20 sm:py-24">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/10 via-transparent to-transparent" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          {/* Headline */}
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl md:text-5xl">
            Ready to save hours every week?
          </h2>

          {/* Subheadline */}
          <p className="mb-8 text-lg text-primary-foreground/90 sm:text-xl">
            Start with 10 free credits. No credit card required.
          </p>

          {/* CTA Buttons */}
          <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="group h-12 px-8 text-base font-semibold shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
            >
              <Link href="/signup">
                Start Free
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-2 border-primary-foreground/20 bg-transparent px-8 text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href="/pricing">
                View Pricing
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="space-y-4">
            <p className="text-sm text-primary-foreground/80">
              Join 10,000+ users who trust ReceiptSorter
            </p>

            {/* Payment method logos */}
            <div className="flex items-center justify-center gap-6 opacity-70">
              <div className="flex items-center gap-2 text-xs font-medium text-primary-foreground/70">
                <svg className="h-8 w-12" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="48" height="32" rx="4" fill="white" fillOpacity="0.9"/>
                  <text x="24" y="20" fontSize="10" fontWeight="bold" fill="currentColor" textAnchor="middle">VISA</text>
                </svg>

                <svg className="h-8 w-12" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="48" height="32" rx="4" fill="white" fillOpacity="0.9"/>
                  <circle cx="18" cy="16" r="6" fill="#EB001B" fillOpacity="0.7"/>
                  <circle cx="30" cy="16" r="6" fill="#F79E1B" fillOpacity="0.7"/>
                </svg>

                <svg className="h-8 w-12" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="48" height="32" rx="4" fill="white" fillOpacity="0.9"/>
                  <text x="24" y="20" fontSize="8" fontWeight="bold" fill="currentColor" textAnchor="middle">AMEX</text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
