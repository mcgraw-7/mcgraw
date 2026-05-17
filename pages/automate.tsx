import { useState } from 'react';
import React from 'react';

// Inline components

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-subtle dark:shadow-md dark:border dark:border-gray-800 p-6 hover:shadow-md dark:hover:shadow-glow-green transition-all duration-200 ${className}`}>
      {children}
    </div>
  );
}

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

function Button({ children, variant = 'primary', size = 'md', className = '', onClick }: ButtonProps) {
  const base = 'font-medium rounded-lg transition-all duration-200 inline-block cursor-pointer';
  const variants = {
    primary: 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 dark:shadow-glow-green',
    secondary: 'bg-green-500 text-black hover:bg-green-400 dark:text-white dark:bg-green-600 dark:hover:bg-green-500',
  };
  const sizes = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3 text-base', lg: 'px-8 py-4 text-lg' };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}

interface ServiceCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

function ServiceCard({ title, description, icon }: ServiceCardProps) {
  return (
    <Card>
      {icon && <div className="mb-4 text-3xl text-green-600 dark:text-green-400">{icon}</div>}
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </Card>
  );
}

interface PackageCardProps {
  title: string;
  features: string[];
  highlight?: boolean;
  price?: string;
}

function PackageCard({ title, features, highlight = false, price }: PackageCardProps) {
  const emailHref = 'mailto:michael@mcgraw.io?subject=automate';
  return (
    <Card className={`${highlight ? 'border-2 border-green-600 dark:border-green-500 relative' : ''}`}>
      <div className="h-full flex flex-col">
        {highlight && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-600 dark:bg-green-500 text-white dark:text-black px-3 py-1 rounded-full text-sm font-semibold">
            Popular
          </div>
        )}
        <div className="mb-4 pt-2">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
          {price && (
            <div className="mt-2 inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/50 px-3 py-1 text-sm font-semibold text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700">
              {price}
            </div>
          )}
        </div>
        <ul className="space-y-3 mb-6">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start">
              <span className="text-green-600 dark:text-green-400 mr-3 font-bold">-</span>
              <span className="text-gray-700 dark:text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-center">
          <a
            href={emailHref}
            className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
          >
            {title}
          </a>
        </div>
      </div>
    </Card>
  );
}

// Main page

export default function Automate() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [demoStep, setDemoStep] = useState(0);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const demoSteps = [
    { title: 'Customer Request', icon: 'fa-envelope', description: 'Email, form, or text received', color: 'blue' },
    { title: 'AI Extracts Details', icon: 'fa-robot', description: 'Parse fields automatically', color: 'green' },
    { title: 'Job/Lead Created', icon: 'fa-briefcase', description: 'Ready for review and quoting', color: 'purple' },
    { title: 'Follow-up Drafted', icon: 'fa-pen-fancy', description: 'Send quote or schedule call', color: 'orange' },
  ];

  const nextDemoStep = () => setDemoStep((prev) => (prev + 1) % demoSteps.length);
  const prevDemoStep = () => setDemoStep((prev) => (prev - 1 + demoSteps.length) % demoSteps.length);

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-white">

        {/* Inline page sub-nav with theme toggle */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex justify-between items-center">
              <div className="hidden md:flex space-x-6 text-sm">
                <a href="#services" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">Services</a>
                <a href="#demo" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">See It Work</a>
                <a href="#packages" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">Packages</a>
                <a href="#contact" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">Contact</a>
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Toggle theme"
              >
                <i className={`fas fa-${theme === 'light' ? 'moon' : 'sun'} text-lg text-green-600 dark:text-green-400`}></i>
              </button>
            </div>
          </div>
        </div>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                Fix tech headaches. Automate busywork. Save hours every week.
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                mcgraw.io helps small businesses streamline websites, workflows, forms, dashboards, customer follow-ups, and practical AI automations without enterprise complexity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="primary" size="lg" onClick={() => scrollTo('cta-final')}>
                  <i className="fas fa-calendar-check mr-2"></i>
                  Book a Free Tech Audit
                </Button>
                <Button variant="secondary" size="lg" onClick={() => scrollTo('demo')}>
                  <i className="fas fa-lightbulb mr-2"></i>
                  See Automation Ideas
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <Card>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-300 dark:border-green-700">
                    <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <i className="fas fa-check-circle text-green-600 dark:text-green-400"></i>
                      Missed lead captured
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Customer inquiry from contact form</div>
                  </div>
                  <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border-l-4 border-green-400 dark:border-green-600">
                    <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <i className="fas fa-check-circle text-green-600 dark:text-green-400"></i>
                      Quote request organized
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Details extracted and ready to quote</div>
                  </div>
                  <div className="p-4 bg-green-200 dark:bg-green-900/40 rounded-lg border-l-4 border-green-500 dark:border-green-500">
                    <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <i className="fas fa-check-circle text-green-600 dark:text-green-400"></i>
                      Follow-up email drafted
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">AI-assisted response ready to send</div>
                  </div>
                  <div className="p-4 bg-green-300 dark:bg-green-900/50 rounded-lg border-l-4 border-green-600 dark:border-green-400">
                    <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <i className="fas fa-check-circle text-green-600 dark:text-green-400"></i>
                      Job status updated
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Dashboard and CRM synced automatically</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Problems */}
        <section className="bg-gray-50 dark:bg-gray-900 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center">
              If your business runs on too many tabs, texts, spreadsheets, and sticky notes.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <div className="text-4xl mb-4 text-green-600 dark:text-green-400"><i className="fas fa-mobile-alt"></i></div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Missed leads</h3>
                <p className="text-gray-600 dark:text-gray-300">Customer messages get lost in email, texts, and social media. No single place to track interested buyers.</p>
              </Card>
              <Card>
                <div className="text-4xl mb-4 text-green-600 dark:text-green-400"><i className="fas fa-sync-alt"></i></div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Manual follow-ups</h3>
                <p className="text-gray-600 dark:text-gray-300">Hours spent copy-pasting, remembering who to call, and drafting the same message over and over.</p>
              </Card>
              <Card>
                <div className="text-4xl mb-4 text-green-600 dark:text-green-400"><i className="fas fa-globe"></i></div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Outdated website</h3>
                <p className="text-gray-600 dark:text-gray-300">Your website doesn&apos;t work on mobile, doesn&apos;t capture leads, or hasn&apos;t been updated in years.</p>
              </Card>
              <Card>
                <div className="text-4xl mb-4 text-green-600 dark:text-green-400"><i className="fas fa-table"></i></div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Spreadsheet chaos</h3>
                <p className="text-gray-600 dark:text-gray-300">Excel files synced by hand, conflicting versions, and data nobody trusts or knows how to use.</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Simple support where small businesses actually need it.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ServiceCard title="Website Fixes & Audits" description="Identify and fix broken links, slow pages, mobile issues. Get a clear roadmap of what's holding you back." icon={<i className="fas fa-globe"></i>} />
            <ServiceCard title="AI Workflow Automation" description="Turn manual processes into automated workflows. Extract info, send messages, update records without lifting a finger." icon={<i className="fas fa-cogs"></i>} />
            <ServiceCard title="Custom Dashboards" description="See your business at a glance. Live data, real-time updates, no training required." icon={<i className="fas fa-chart-line"></i>} />
            <ServiceCard title="Forms, CRM & Lead Intake" description="Replace messy email inboxes with organized lead capture that feeds straight into your workflow." icon={<i className="fas fa-clipboard-list"></i>} />
            <ServiceCard title="Customer Follow-Up Systems" description="Automate reminders, quote follow-ups, status updates, and handoff notifications so nothing falls through the cracks." icon={<i className="fas fa-comments"></i>} />
            <ServiceCard title="Ongoing Tech Support" description="Regular check-ins, small fixes, software updates, and new automations rolled out as your business grows." icon={<i className="fas fa-tools"></i>} />
          </div>
        </section>

        {/* Demo Workflow */}
        <section id="demo" className="bg-gray-50 dark:bg-gray-900 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 text-center">
              Example: Turn a customer message into an organized job.
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-300 mb-12 text-lg">
              Here&apos;s how a single customer request flows through an automated system:
            </p>
            <div className="mb-12">
              <Card className="mb-8 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-600 dark:border-green-400">
                <div className="mb-2 text-sm font-semibold text-green-600 dark:text-green-400 uppercase flex items-center gap-2">
                  <i className="fas fa-user"></i>
                  Customer Request
                </div>
                <p className="text-gray-900 dark:text-white text-lg">
                  &quot;Need a patio estimate, about 18x24, flexible on timing.&quot;
                </p>
              </Card>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-subtle dark:shadow-md dark:border dark:border-gray-800 p-8 mb-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Processing Pipeline</h3>
                  <div className="flex gap-2">
                    <button onClick={prevDemoStep} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      <i className="fas fa-chevron-left text-green-600 dark:text-green-400"></i>
                    </button>
                    <button onClick={nextDemoStep} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      <i className="fas fa-chevron-right text-green-600 dark:text-green-400"></i>
                    </button>
                  </div>
                </div>
                <div className="min-h-48 relative overflow-hidden">
                  {demoSteps.map((step, idx) => {
                    const isActive = idx === demoStep;
                    const isPrev = idx < demoStep;
                    return (
                      <div
                        key={idx}
                        className={`absolute inset-0 transition-all duration-500 ${
                          isActive ? 'translate-x-0 opacity-100 z-10' : isPrev ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center h-full py-8">
                          <div className="text-6xl mb-6 text-green-600 dark:text-green-400">
                            <i className={`fas ${step.icon}`}></i>
                          </div>
                          <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">{step.title}</h4>
                          <p className="text-gray-600 dark:text-gray-400 text-center">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-2 mt-8">
                  {demoSteps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setDemoStep(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === demoStep ? 'bg-green-600 dark:bg-green-400 w-8' : 'bg-gray-300 dark:bg-gray-600 w-2'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <Card className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-600 dark:border-green-400">
                <div className="mb-4 text-sm font-semibold text-green-600 dark:text-green-400 uppercase flex items-center gap-2">
                  <i className="fas fa-check-circle"></i>
                  Extracted Fields
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold mb-1">Service</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">Patio</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold mb-1">Size</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">18x24 ft</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold mb-1">Urgency</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">Normal</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold mb-1">Next Step</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">Send quote</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Packages */}
        <section id="packages" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 text-center">Start small. Improve fast.</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 text-lg">
            All packages include a free initial consultation to understand your biggest pain points.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PackageCard
              title="Starter Tech Audit"
              price="$99"
              features={[
                'Website and workflow review',
                'List of quick wins',
                'Automation opportunities identified',
                'Recommended next steps',
                'Best for: Unsure where to start',
              ]}
            />
            <PackageCard
              title="Custom Automation Setup"
              price="$500+"
              highlight={true}
              features={[
                'Map one workflow end-to-end (intake to follow-up)',
                'Build lead capture automation from form, email, or text',
                'Set up AI field extraction (name, service, urgency, scope)',
                'Auto-create records in your tracker/CRM with status tags',
                'Deliver up to 3 production-ready automations with handoff docs',
              ]}
            />
            <PackageCard
              title="Ongoing Automation Support"
              price="Contact"
              features={[
                'Monthly service: 1 planning call + prioritized action list',
                'Monitor existing automations and fix failed runs quickly',
                'Implement monthly improvements to forms, workflows, and alerts',
                'Add new automations as business processes change',
                'Priority response for critical automation issues',
              ]}
            />
          </div>
        </section>

        {/* Trust */}
        <section className="bg-gray-50 dark:bg-gray-900 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
              Built for local businesses that need practical help, not enterprise software.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              {[
                { title: 'Local SMB Focus', body: 'No enterprise bloat. We understand contractors, service companies, local shops, and small offices.' },
                { title: 'Clear Explanations', body: "You'll understand what's happening and why. No jargon unless it's necessary." },
                { title: 'No Bloated Systems', body: 'Solutions that do what you need, nothing more. Easy to use and maintain.' },
                { title: 'Experienced Engineer', body: 'Built by a software engineer with years of real-world experience in small business tech.' },
              ].map(({ title, body }) => (
                <div key={title} className="text-left">
                  <div className="text-3xl mb-4 text-green-600 dark:text-green-400"><i className="fas fa-check-circle"></i></div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="cta-final" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Want to know what your business could automate?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Every business is different. Let&apos;s talk about what would actually save you time and money.
          </p>
          <a
            href="mailto:michael@mcgraw.io?subject=automate"
            className="inline-flex items-center justify-center rounded-lg bg-green-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-green-700"
          >
            <i className="fas fa-calendar-check mr-2"></i>
            Book a Free Tech Audit
          </a>
        </section>

        {/* Footer */}
        <footer id="contact" className="bg-gray-900 dark:bg-black text-white py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="text-2xl font-bold mb-2">mcgraw.io</div>
                <p className="text-gray-400 text-sm">Practical tech + AI support for small businesses.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <i className="fas fa-cogs text-green-400"></i>
                  Services
                </h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#services" className="hover:text-green-400 transition-colors flex items-center gap-2"><i className="fas fa-arrow-right text-green-400 text-xs"></i>Website Fixes</a></li>
                  <li><a href="#services" className="hover:text-green-400 transition-colors flex items-center gap-2"><i className="fas fa-arrow-right text-green-400 text-xs"></i>Automation</a></li>
                  <li><a href="#services" className="hover:text-green-400 transition-colors flex items-center gap-2"><i className="fas fa-arrow-right text-green-400 text-xs"></i>Dashboards</a></li>
                  <li><a href="#services" className="hover:text-green-400 transition-colors flex items-center gap-2"><i className="fas fa-arrow-right text-green-400 text-xs"></i>Support</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <i className="fas fa-lightbulb text-green-400"></i>
                  Resources
                </h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#demo" className="hover:text-green-400 transition-colors flex items-center gap-2"><i className="fas fa-arrow-right text-green-400 text-xs"></i>See It Work</a></li>
                  <li><a href="#packages" className="hover:text-green-400 transition-colors flex items-center gap-2"><i className="fas fa-arrow-right text-green-400 text-xs"></i>Packages</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <i className="fas fa-envelope text-green-400"></i>
                  Contact
                </h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="mailto:michael@mcgraw.io" className="hover:text-green-400 transition-colors">michael@mcgraw.io</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8">
              <p className="text-center text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} mcgraw.io. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
