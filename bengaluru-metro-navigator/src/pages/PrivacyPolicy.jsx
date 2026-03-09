import { Shield, Lock, Eye, Cookie, Database, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-metro-purple" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Privacy Policy
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          {/* Introduction */}
          <Section icon={Eye} title="Introduction">
            <p>
              Welcome to Namma Metro Navigator. We are committed to protecting your privacy
              and ensuring transparency about how we handle data. This privacy policy explains
              what information we collect, how we use it, and your rights regarding your data.
            </p>
          </Section>

          {/* Information We Collect */}
          <Section icon={Database} title="Information We Collect">
            <h3>Anonymous Usage Data</h3>
            <p>
              We collect anonymous analytics data to improve our service, including:
            </p>
            <ul>
              <li>Route searches (origin and destination stations)</li>
              <li>Attraction searches and views</li>
              <li>Page views and navigation patterns</li>
              <li>Device type and browser information</li>
              <li>Approximate location (city/region level only)</li>
            </ul>

            <h3>What We DON'T Collect</h3>
            <ul>
              <li>❌ Personal identification information (name, email, phone)</li>
              <li>❌ Account credentials (we don't have user accounts)</li>
              <li>❌ Precise GPS location</li>
              <li>❌ Payment information</li>
              <li>❌ Any data that can identify you personally</li>
            </ul>
          </Section>

          {/* How We Use Your Data */}
          <Section icon={Database} title="How We Use Your Data">
            <p>The anonymous data we collect is used exclusively for:</p>
            <ul>
              <li>📊 Understanding popular routes and attractions</li>
              <li>🚀 Improving app performance and features</li>
              <li>📈 Displaying trending searches to other users</li>
              <li>🐛 Identifying and fixing bugs</li>
            </ul>
          </Section>

          {/* Cookies and Local Storage */}
          <Section icon={Cookie} title="Cookies and Local Storage">
            <p>
              We use browser local storage and minimal cookies for:
            </p>
            <ul>
              <li><strong>Theme Preference:</strong> Remembering your dark/light mode choice</li>
              <li><strong>Recent Searches:</strong> Showing your last 5 searches for convenience (stored locally only)</li>
              <li><strong>Analytics:</strong> Google Analytics uses cookies to track sessions anonymously</li>
            </ul>
            <p>
              You can clear all stored data at any time through your browser settings.
              This will not affect the core functionality of the app.
            </p>
          </Section>

          {/* Third-Party Services */}
          <Section icon={Lock} title="Third-Party Services">
            <h3>Google Analytics 4</h3>
            <p>
              We use Google Analytics to understand how users interact with our app.
              Google Analytics may use cookies and similar technologies. 
              <a 
                href="https://policies.google.com/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-metro-purple hover:underline"
              >
                {' '}View Google's Privacy Policy
              </a>
            </p>

            <h3>Google AdSense</h3>
            <p>
              We display Google AdSense advertisements to support the free service.
              Google may use cookies for personalized advertising.
              You can opt out of personalized ads at{' '}
              <a 
                href="https://www.google.com/settings/ads" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-metro-purple hover:underline"
              >
                Google Ad Settings
              </a>
            </p>
          </Section>

          {/* Data Security */}
          <Section icon={Shield} title="Data Security">
            <p>
              Since we don't collect personal information, there's minimal data to secure.
              However, we still implement best practices:
            </p>
            <ul>
              <li>✅ HTTPS encryption for all data transmission</li>
              <li>✅ No server-side storage of user data</li>
              <li>✅ Regular security updates</li>
              <li>✅ Compliance with data protection regulations</li>
            </ul>
          </Section>

          {/* Your Rights */}
          <Section icon={Eye} title="Your Rights">
            <p>You have the right to:</p>
            <ul>
              <li><strong>Access:</strong> View what data is stored in your browser (local storage)</li>
              <li><strong>Delete:</strong> Clear your browsing data at any time</li>
              <li><strong>Opt-out:</strong> Use browser extensions to block analytics and ads</li>
              <li><strong>Request Information:</strong> Contact us for any privacy concerns</li>
            </ul>
          </Section>

          {/* Contact Us */}
          <Section icon={Mail} title="Contact Us">
            <p>
              If you have questions about this privacy policy or our data practices,
              please contact us at:
            </p>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg not-prose">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Email:</strong> privacy@nammametronavigator.com
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                <strong>Response Time:</strong> We aim to respond within 48 hours
              </p>
            </div>
          </Section>

          {/* Updates to Policy */}
          <Section icon={Database} title="Updates to This Policy">
            <p>
              We may update this privacy policy from time to time. We will notify users
              of any material changes by updating the "Last updated" date at the top
              of this page. Continued use of the app after changes constitutes acceptance
              of the updated policy.
            </p>
          </Section>

          {/* Summary */}
          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-6 mt-8 not-prose">
            <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-3">
              🔒 Privacy Summary
            </h3>
            <ul className="text-sm text-green-800 dark:text-green-200 space-y-2">
              <li>✅ No personal data collection - completely anonymous</li>
              <li>✅ No user accounts or login required</li>
              <li>✅ Minimal cookies, only for analytics</li>
              <li>✅ All data stored locally in your browser</li>
              <li>✅ You can delete everything anytime</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Component
function Section({ icon: Icon, title, children }) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
        <Icon className="w-6 h-6 text-metro-purple" />
        {title}
      </h2>
      <div className="text-gray-700 dark:text-gray-300">
        {children}
      </div>
    </section>
  );
}
