import { redirect } from 'next/navigation';

/*
 * SALES-2: this page showed case studies, results and counters that cannot be
 * verified (and the same fictional businesses as the removed testimonials).
 * Until there are real, approved cases, visitors see the Orvenix designs.
 */
export default function PortafolioPage() {
  redirect('/templates');
}
