import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useScrollSpy, TableOfContents, PolicySection, BackToTopButton } from '../components/LegalPageParts';

/* ─── Easy-to-update config — edit these in one place ──────────────
   Update `lastUpdated` any time the policy text changes below. */
const PRIVACY_CONFIG = {
  lastUpdated: '2026-07-06',
  companyName: 'CodePulse',
  contactEmail: 'privacy@codepulse.com',
};

const TOC_ITEMS = [
  { id: 'introduction', title: '1. Introduction' },
  { id: 'information-we-collect', title: '2. Information We Collect' },
  { id: 'how-we-use-information', title: '3. How We Use Your Information' },
  { id: 'data-sharing', title: '4. Data Sharing & Third Parties' },
  { id: 'cookies-tracking', title: '5. Cookies & Tracking' },
  { id: 'data-security', title: '6. Data Storage & Security' },
  { id: 'user-rights', title: '7. User Rights & Choices' },
  { id: 'childrens-privacy', title: "8. Children's Privacy" },
  { id: 'policy-changes', title: '9. Changes to This Policy' },
  { id: 'contact-us', title: '10. Contact Us' },
];

export default function PrivacyPolicy() {
  const shouldReduceMotion = useReducedMotion();
  const activeId = useScrollSpy(TOC_ITEMS.map((i) => i.id));
  const { companyName, contactEmail, lastUpdated } = PRIVACY_CONFIG;

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
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Privacy Policy</h1>
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
            <PolicySection id="introduction" title="1. Introduction">
              <p>
                This Privacy Policy explains how {companyName} ("we", "us", or "our") collects, uses, and protects
                information when you use our contest-tracking platform, including the website, calendar, practice
                rooms, and Brain Gym features. It applies to all registered users and visitors of the platform.
              </p>
              <p>[Placeholder — expand with your actual scope, effective date, and any regional disclosures (GDPR/CCPA) that apply.]</p>
            </PolicySection>

            <PolicySection id="information-we-collect" title="2. Information We Collect">
              <p>We collect the following categories of information:</p>
              <ul className="list-disc list-outside pl-5 flex flex-col gap-2">
                <li><strong className="text-slate-300">Account information</strong> — name, email address, and password hash.</li>
                <li><strong className="text-slate-300">Linked coding-judge handles</strong> — Codeforces, AtCoder, CodeChef, LeetCode, and other handles you connect, along with publicly available stats pulled via their APIs.</li>
                <li><strong className="text-slate-300">Usage data</strong> — contests tracked, practice rooms joined, and Brain Gym scores/progress.</li>
                <li><strong className="text-slate-300">Technical data</strong> — IP address, browser/device information, and cookies.</li>
              </ul>
            </PolicySection>

            <PolicySection id="how-we-use-information" title="3. How We Use Your Information">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-outside pl-5 flex flex-col gap-2">
                <li>Provide core features such as the calendar, profile, practice rooms, and Brain Gym stats.</li>
                <li>Send contest reminders and notifications, if you've opted in.</li>
                <li>Improve the platform using aggregate, anonymized analytics.</li>
              </ul>
            </PolicySection>

            <PolicySection id="data-sharing" title="4. Data Sharing & Third Parties">
              <p>
                We share limited data with third-party judge APIs (e.g. the Codeforces API) only as needed to fetch
                your public contest history and ratings. [Placeholder — list any analytics tools in use, e.g. Google
                Analytics, and describe exactly what is sent to them.]
              </p>
              <p>We do not sell personal data. [Placeholder — adjust this statement if it doesn't match your actual practice.]</p>
            </PolicySection>

            <PolicySection id="cookies-tracking" title="5. Cookies & Tracking">
              <p>
                We use session/authentication cookies to keep you signed in, preference cookies to remember your
                settings, and [placeholder: analytics cookies, if any] to understand how the platform is used.
              </p>
            </PolicySection>

            <PolicySection id="data-security" title="6. Data Storage & Security">
              <p>
                Passwords are stored as salted hashes, never in plain text. [Placeholder — describe encryption at
                rest/in transit, hosting provider, and any other security practices that actually apply.]
              </p>
            </PolicySection>

            <PolicySection id="user-rights" title="7. User Rights & Choices">
              <p>You can, at any time:</p>
              <ul className="list-disc list-outside pl-5 flex flex-col gap-2">
                <li>Update or delete your account from your profile settings.</li>
                <li>Unlink any connected judge handles.</li>
                <li>Opt out of reminder/notification emails.</li>
                <li>
                  Request an export or deletion of your data by reaching out via the{' '}
                  <Link to="/contact" className="text-sky-400 hover:text-sky-300 font-semibold">Contact page</Link>.
                </li>
              </ul>
            </PolicySection>

            <PolicySection id="childrens-privacy" title="8. Children's Privacy">
              <p>
                CodePulse is not intended for users under the age of 13. [Placeholder — confirm and adjust the minimum
                age to match your actual policy and applicable regulations.]
              </p>
            </PolicySection>

            <PolicySection id="policy-changes" title="9. Changes to This Policy">
              <p>
                We may update this policy from time to time. Material changes will be reflected in the "Last updated"
                date at the top of this page. [Placeholder — describe whether you'll also send an email notice for
                significant changes.]
              </p>
            </PolicySection>

            <PolicySection id="contact-us" title="10. Contact Us">
              <p>
                Questions about this policy? Reach out via the{' '}
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
