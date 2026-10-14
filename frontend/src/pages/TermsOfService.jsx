import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useScrollSpy, TableOfContents, PolicySection, BackToTopButton } from '../components/LegalPageParts';

/* ─── Easy-to-update config — edit these in one place ──────────────
   Update `lastUpdated` any time the terms text changes below. */
const TERMS_CONFIG = {
  lastUpdated: '2026-07-06',
  companyName: 'CodePulse',
  contactEmail: 'legal@codepulse.com',
  governingLaw: '[Placeholder — e.g. the laws of Bangladesh]',
};

const TOC_ITEMS = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'description-of-service', title: '2. Description of Service' },
  { id: 'user-accounts', title: '3. User Accounts' },
  { id: 'linking-judge-handles', title: '4. Linking Third-Party Judge Handles' },
  { id: 'acceptable-use', title: '5. Acceptable Use / User Conduct' },
  { id: 'user-generated-content', title: '6. User-Generated Content' },
  { id: 'intellectual-property', title: '7. Intellectual Property' },
  { id: 'third-party-disclaimer', title: '8. Third-Party Services Disclaimer' },
  { id: 'disclaimer-of-warranties', title: '9. Disclaimer of Warranties' },
  { id: 'limitation-of-liability', title: '10. Limitation of Liability' },
  { id: 'termination', title: '11. Termination' },
  { id: 'changes-to-terms', title: '12. Changes to These Terms' },
  { id: 'governing-law', title: '13. Governing Law' },
  { id: 'contact-us', title: '14. Contact Us' },
];

export default function TermsOfService() {
  const shouldReduceMotion = useReducedMotion();
  const activeId = useScrollSpy(TOC_ITEMS.map((i) => i.id));
  const { companyName, contactEmail, governingLaw, lastUpdated } = TERMS_CONFIG;

  return (
    <div style={{ minHeight: '100vh', background: '#060612' }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: 'easeOut' }}
        className="mx-auto max-w-5xl px-6 py-12 md:py-16 text-slate-200"
      >
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Terms of Service</h1>
          <p className="text-xs text-slate-500">Last updated: {lastUpdated}</p>
        </div>

        {/* Draft notice — remove once the real legal text below has been reviewed */}
        <div className="mb-10 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-300/90 leading-relaxed">
          <strong className="font-bold">Draft placeholder.</strong> The section text below is structural placeholder copy, not
          final legal wording. Replace it with reviewed policy language before publishing this page live.
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          <TableOfContents items={TOC_ITEMS} activeId={activeId} />

          <div className="max-w-[720px] min-w-0">
            <PolicySection id="acceptance" title="1. Acceptance of Terms">
              <p>
                By creating an account or using {companyName}, you agree to be bound by these Terms of Service.
                If you do not agree, please do not use the platform.
              </p>
              <p>
                [Placeholder — confirm minimum age to use the platform and whether an account is required for all
                features or only some.]
              </p>
            </PolicySection>

            <PolicySection id="description-of-service" title="2. Description of Service">
              <p>
                {companyName} provides a unified contest calendar, profile and rating tracking, Virtual Practice
                Rooms, and Brain Gym logic games. Contest data is pulled from third-party judges — Codeforces,
                AtCoder, CodeChef, LeetCode, and others — and may be delayed or inaccurate, since we don't control
                those platforms.
              </p>
            </PolicySection>

            <PolicySection id="user-accounts" title="3. User Accounts">
              <p>You're responsible for maintaining the security of your account, including your password, and for not sharing your account with others.</p>
              <ul className="list-disc list-outside pl-5 flex flex-col gap-2">
                <li>You agree to provide accurate account information.</li>
                <li>One account per person. [Placeholder — adjust if you allow multiple accounts.]</li>
              </ul>
            </PolicySection>

            <PolicySection id="linking-judge-handles" title="4. Linking Third-Party Judge Handles">
              <p>
                You may only link coding-judge handles that you personally own. {companyName} is not responsible for
                actions taken on those third-party platforms, or for any consequences of linking a handle that
                doesn't belong to you.
              </p>
            </PolicySection>

            <PolicySection id="acceptable-use" title="5. Acceptable Use / User Conduct">
              <p>When using {companyName}, you agree not to:</p>
              <ul className="list-disc list-outside pl-5 flex flex-col gap-2">
                <li>Cheat or abuse Virtual Practice Rooms — e.g. submitting pre-written solutions or sharing answers before the timer ends in ways that break the room's fair-practice spirit.</li>
                <li>Harass or abuse other users in room discussion threads.</li>
                <li>Scrape the platform, automate abuse, or attempt to bypass rate limits or security controls.</li>
                <li>Impersonate other users or platforms.</li>
              </ul>
            </PolicySection>

            <PolicySection id="user-generated-content" title="6. User-Generated Content">
              <p>
                You retain ownership of content you post — such as practice room discussion comments and profile
                information — but you grant {companyName} a license to display that content on the platform.
              </p>
              <p>We reserve the right to remove content or accounts that violate these terms.</p>
            </PolicySection>

            <PolicySection id="intellectual-property" title="7. Intellectual Property">
              <p>
                {companyName}'s branding, logo, and code are owned by {companyName}. Contest data and problems
                displayed on the platform belong to their respective judge platforms, not {companyName}.
              </p>
            </PolicySection>

            <PolicySection id="third-party-disclaimer" title="8. Third-Party Services Disclaimer">
              <p>
                {companyName} aggregates publicly available data from external judges but is not affiliated with, or
                endorsed by, Codeforces, AtCoder, CodeChef, LeetCode, or any other platform referenced. All related
                trademarks belong to their respective owners.
              </p>
            </PolicySection>

            <PolicySection id="disclaimer-of-warranties" title="9. Disclaimer of Warranties">
              <p>
                The service is provided "as is," without warranty of any kind. We do not guarantee uninterrupted
                uptime, contest data accuracy, or fitness for any particular purpose. [Placeholder — expand with your
                standard warranty disclaimer language.]
              </p>
            </PolicySection>

            <PolicySection id="limitation-of-liability" title="10. Limitation of Liability">
              <p>
                {companyName} is not liable for missed contests due to sync delays, data inaccuracies from
                third-party APIs, or disputes between users arising from practice rooms. [Placeholder — expand with
                your standard limitation-of-liability language.]
              </p>
            </PolicySection>

            <PolicySection id="termination" title="11. Termination">
              <p>
                {companyName} may suspend or terminate accounts that violate these terms. You may delete your own
                account at any time from your profile settings.
              </p>
            </PolicySection>

            <PolicySection id="changes-to-terms" title="12. Changes to These Terms">
              <p>
                We may update these terms from time to time. Material changes will be reflected in the "Last
                updated" date at the top of this page. [Placeholder — describe whether you'll also send an email
                notice for significant changes.]
              </p>
            </PolicySection>

            <PolicySection id="governing-law" title="13. Governing Law">
              <p>These terms are governed by {governingLaw}.</p>
            </PolicySection>

            <PolicySection id="contact-us" title="14. Contact Us">
              <p>
                Questions about these terms? Reach out via the{' '}
                <Link to="/contact" className="text-sky-400 hover:text-sky-300 font-semibold">Contact page</Link>
                {' '}or email us directly at{' '}
                <a href={`mailto:${contactEmail}`} className="text-sky-400 hover:text-sky-300 font-semibold">{contactEmail}</a>.
              </p>
            </PolicySection>
          </div>
        </div>
      </motion.div>

      <BackToTopButton />
    </div>
  );
}
