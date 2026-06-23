'use client'

import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  ChevronUp,
  CircleDollarSign,
  Globe2,
  LayoutDashboard,
  Mail,
  Map,
  Menu,
  MessageSquareText,
  ReceiptText,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  Users,
  WalletCards,
  X,
} from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { FaFacebookF, FaInstagram } from 'react-icons/fa'
import { useLanguage } from '@/components/LanguageProvider'

const EarthScene = dynamic(() => import('@/components/landing/EarthScene'), {
  ssr: false,
})

const features = [
  {
    icon: Map,
    title: 'Trip Creation',
    description: 'Create complete trips, set dates, destinations and keep every detail organized.',
    color: 'bg-[#f3e4da] text-[#C9603A]',
  },
  {
    icon: ThumbsUp,
    title: 'Activity Voting',
    description: 'Let every member vote and turn group preferences into a shared itinerary.',
    color: 'bg-[#fff3cf] text-[#9a741b]',
  },
  {
    icon: WalletCards,
    title: 'Budget Management',
    description: 'See your total budget, spending and remaining balance in real time.',
    color: 'bg-[#e8eee5] text-[#5E7A5A]',
  },
  {
    icon: ReceiptText,
    title: 'Expense Tracking',
    description: 'Record real expenses, categories, dates and who paid for each item.',
    color: 'bg-[#f7e7dc] text-[#9f411d]',
  },
  {
    icon: CircleDollarSign,
    title: 'Member Balance',
    description: 'Automatically calculate who owes money and who should be reimbursed.',
    color: 'bg-[#eee9df] text-[#6f5d53]',
  },
  {
    icon: Bot,
    title: 'Chatbot Assistant',
    description: 'Ask questions, get trip suggestions and receive quick planning help anytime.',
    color: 'bg-[#fff3cf] text-[#7f2a07]',
  },
  {
    icon: LayoutDashboard,
    title: 'Travel Dashboard',
    description: 'View activities, votes, budgets and members from one focused workspace.',
    color: 'bg-[#e8e0da] text-[#2E2318]',
  },
]

const steps = [
  ['01', 'Create a trip', 'Choose the destination, dates and starting budget.'],
  ['02', 'Invite members', 'Bring your travel group into one shared space.'],
  ['03', 'Add activities', 'Build ideas with prices, places and schedules.'],
  ['04', 'Vote and plan', 'Agree on the experiences your group wants most.'],
  ['05', 'Track expenses', 'Stay on budget and settle balances with clarity.'],
]

const stepIcons = [Map, Users, Sparkles, ThumbsUp, WalletCards]

const testimonials = [
  {
    quote:
      'Travel-Buddy replaced our group chat chaos. Everyone could vote, and the final itinerary practically built itself.',
    name: 'Sofia Martin',
    role: 'Group trip organizer',
    initials: 'SM',
    image: '/testimonial-sofia.jpg',
  },
  {
    quote:
      'The budget view made our Morocco trip stress-free. We always knew what was spent and who needed to pay.',
    name: 'Yassine Amrani',
    role: 'Frequent traveler',
    initials: 'YA',
    image: '/image2.jpg',
  },
  {
    quote:
      'Finally, a travel planner that works for groups. It is clear, fast and genuinely useful while traveling.',
    name: 'Micheal Wilson',
    role: 'Remote team lead',
    initials: 'EW',
    image: '/image1.jpg',
  },
]

const stats = [
  { value: 1200, suffix: '+', label: 'Trips Created' },
  { value: 8600, suffix: '+', label: 'Activities Planned' },
  { value: 4200, suffix: '+', label: 'Members Connected' },
  { value: 18, suffix: 'M DH', label: 'Budgets Managed' },
]

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 520)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      document.documentElement.style.scrollBehavior = ''
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fdf9f6] text-[#2E2318]">
      <Navbar open={menuOpen} onToggle={() => setMenuOpen((value) => !value)} />

      <section id="home" className="relative min-h-[100svh] overflow-hidden bg-[#dff5f7]">
        <Image
          src="/amalfi_coast.png"
          alt="Amalfi Coast travel destination"
          fill
          priority
          className="object-cover object-center saturate-[1.08]"
        />
        <div className="absolute inset-0 bg-white/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#fff8ec]/95 via-[#fff8ec]/70 to-[#bcecf1]/20" />
        <div className="absolute inset-y-0 right-0 w-[52%] bg-gradient-to-l from-[#77d6df]/20 to-transparent" />

        <div className="relative mx-auto flex min-h-[100svh] max-w-7xl items-center px-5 pb-20 pt-28 md:px-8">
          <div className="grid w-full items-center gap-8 lg:grid-cols-[0.94fr_1.06fr]">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={reveal}
              transition={{ duration: 0.7 }}
              className="max-w-2xl text-[#2E2318]"
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e2c7b1] bg-white/72 px-3 py-1.5 text-xs font-semibold text-[#7f2a07] shadow-sm backdrop-blur-md">
                <Sparkles className="size-3.5 text-[#D4A843]" />
                One place for every group adventure
              </div>
              <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-normal sm:text-5xl lg:text-6xl">
                Plan, Organize and Manage Your Trips Easily
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#57483f] md:text-lg">
                Travel-Buddy helps groups organize trips, manage budgets, vote on
                activities and track every expense without losing the joy of travel.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#c7a995] bg-white/75 px-6 text-sm font-bold text-[#2E2318] shadow-sm backdrop-blur-md transition hover:bg-white"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#C9603A] px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(127,42,7,0.32)] transition hover:bg-[#9f411d]"
                >
                  Start planning
                  <ArrowRight className="size-4" />
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-[#57483f]">
                {['Free to start', 'Built for groups', 'Secure by design'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <Check className="size-4 text-[#168c86]" />
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, duration: 0.7 }}
              className="relative mx-auto hidden aspect-square w-full max-w-[500px] lg:block"
            >
              <EarthScene />
              <Image
                src="/airplane-real.png"
                alt="Travel-Buddy airplane"
                width={260}
                height={150}
                className="pointer-events-none absolute right-[-1%] top-[34%] z-20 w-[41%] rotate-6 object-contain drop-shadow-[0_14px_18px_rgba(46,35,24,0.25)]"
              />
              <GlassMetric className="left-[5%] top-[24%]" icon={Users} value="4 members" />
              <GlassMetric className="bottom-[19%] right-[5%]" icon={BarChart3} value="82% planned" />
            </motion.div>
          </div>
        </div>
      </section>

      <section id="features" className="relative bg-white py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={reveal}
            className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"
          >
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase text-[#C9603A]">
                <span className="size-2 rounded-full bg-[#D4A843]" />
                Everything in sync
              </span>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight text-[#2E2318] md:text-4xl">
                Travel planning that keeps the whole group moving
              </h2>
            </div>
            <p className="max-w-md leading-7 text-[#75675f] lg:text-right">
              From the first idea to the final reimbursement, every decision
              stays clear and connected.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.article
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-lg border border-[#ead9bf] bg-[#fff8ec] p-6 shadow-[0_22px_55px_rgba(127,42,7,0.12)] sm:p-8"
            >
              <div className="absolute right-0 top-0 h-44 w-44 rounded-bl-full bg-[#D4A843]/18" />
              <div className="relative">
                <div className="flex size-12 items-center justify-center rounded-lg bg-[#C9603A] text-white shadow-[0_10px_24px_rgba(127,42,7,0.2)]">
                  <LayoutDashboard className="size-6" />
                </div>
                <h3 className="mt-8 max-w-lg text-2xl font-extrabold leading-tight text-[#2E2318] md:text-3xl">
                  One dashboard for plans, votes, budgets and balances.
                </h3>
                <p className="mt-4 max-w-xl leading-7 text-[#75675f]">
                  Travel-Buddy brings the whole trip into one focused workspace,
                  so the group can decide faster and spend with clarity.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    ['82%', 'planned'],
                    ['4.8/5', 'group clarity'],
                    ['0 stress', 'settlement'],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-lg border border-[#ead9bf] bg-white/75 p-4">
                      <p className="text-xl font-extrabold text-[#C9603A]">{value}</p>
                      <p className="mt-1 text-xs font-semibold uppercase text-[#83736a]">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.article>

            <div className="grid gap-4 sm:grid-cols-2">
              {features.filter((feature) => feature.title !== 'Travel Dashboard').map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.article
                    key={feature.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.06 }}
                    whileHover={{ y: -4 }}
                    className="rounded-lg border border-[#ead9bf] bg-[#fffdfa] p-5 shadow-[0_12px_30px_rgba(127,42,7,0.07)] transition"
                  >
                    <div className={`flex size-10 items-center justify-center rounded-lg ${feature.color}`}>
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-5 font-extrabold text-[#2E2318]">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#75675f]">{feature.description}</p>
                  </motion.article>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="overflow-hidden bg-[#fdf9f6] py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={reveal}
            className="flex flex-col justify-between gap-6 border-b border-[#ead9bf] pb-10 lg:flex-row lg:items-end"
          >
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase text-[#C9603A]">
                <span className="size-2 rounded-full bg-[#D4A843]" />
                How it works
              </span>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight text-[#2E2318] md:text-4xl">
                One clear route from trip idea to final balance
              </h2>
            </div>
            <p className="max-w-md leading-7 text-[#75675f] lg:text-right">
              Travel-Buddy keeps planning, group decisions and expenses connected
              from the first day to the last payment.
            </p>
          </motion.div>

          <div className="relative mt-14">
            <div className="absolute left-5 top-0 h-full w-px bg-[#dfc5b3] lg:left-[10%] lg:right-[10%] lg:top-7 lg:h-px lg:w-auto" />

            <div className="grid gap-0 lg:grid-cols-5">
              {steps.map(([number, title, copy], index) => {
                const StepIcon = stepIcons[index]
                const colors = [
                  'bg-[#C9603A] text-white',
                  'bg-[#D4A843] text-[#2E2318]',
                  'bg-[#5E7A5A] text-white',
                  'bg-[#C9603A] text-white',
                  'bg-[#2E2318] text-white',
                ]

                return (
                  <motion.div
                    key={number}
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="relative grid min-h-36 grid-cols-[40px_1fr] gap-5 pb-9 pl-0 lg:block lg:min-h-0 lg:px-4 lg:pb-0 lg:text-center"
                  >
                    <div
                      className={`relative z-10 flex size-11 items-center justify-center rounded-lg shadow-[0_8px_20px_rgba(127,42,7,0.16)] lg:mx-auto lg:size-14 ${colors[index]}`}
                    >
                      <StepIcon className="size-5 lg:size-6" />
                    </div>

                    <div className="pt-0.5 lg:pt-7">
                      <span className="text-[11px] font-extrabold uppercase text-[#C9603A]">
                        Step {number}
                      </span>
                      <h3 className="mt-2 text-base font-extrabold text-[#2E2318]">
                        {title}
                      </h3>
                      <p className="mx-auto mt-2 max-w-[210px] text-sm leading-6 text-[#75675f]">
                        {copy}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 flex flex-col items-start justify-between gap-4 rounded-lg border border-[#ead9bf] bg-[#fff8ec] px-5 py-4 shadow-[0_10px_28px_rgba(127,42,7,0.07)] sm:flex-row sm:items-center"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-[#f3e4da] text-[#C9603A]">
                <Check className="size-5" />
              </div>
              <div>
                <p className="font-extrabold text-[#2E2318]">Everything stays in one place</p>
                <p className="mt-0.5 text-sm text-[#75675f]">
                  Plans, votes, budgets and balances remain synchronized.
                </p>
              </div>
            </div>
            <Link
              href="/signup"
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#C9603A] px-4 text-sm font-bold text-white transition hover:bg-[#9f411d]"
            >
              Create a trip
              <ArrowRight className="size-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#2E2318] py-20 text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 md:px-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <Counter key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={reveal}
            className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"
          >
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase text-[#C9603A]">
                <MessageSquareText className="size-4" />
                Loved by travel groups
              </span>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight text-[#2E2318] md:text-4xl">
                Less coordination. More anticipation.
              </h2>
            </div>
            <p className="max-w-md leading-7 text-[#75675f] lg:text-right">
              Real groups use Travel-Buddy to turn scattered ideas into trips
              everyone can enjoy.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-5 lg:grid-cols-[1.18fr_0.82fr]">
            <motion.article
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid min-h-[470px] overflow-hidden rounded-lg border border-[#ead9bf] bg-[#2E2318] shadow-[0_24px_55px_rgba(127,42,7,0.16)] sm:grid-cols-[0.92fr_1.08fr]"
            >
              <div className="relative min-h-[300px] sm:min-h-full">
                <Image
                  src={testimonials[0].image}
                  alt={testimonials[0].name}
                  fill
                  sizes="(max-width: 640px) 100vw, 36vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2E2318]/35 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-[#2E2318]/25" />
              </div>

              <div className="flex flex-col justify-between p-7 text-white md:p-9">
                <div>
                  <div className="flex gap-1 text-[#D4A843]">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="size-4 fill-current" />
                    ))}
                  </div>
                  <MessageSquareText className="mt-8 size-8 text-[#D4A843]" />
                  <blockquote className="mt-5 text-xl font-semibold leading-8 md:text-2xl md:leading-9">
                    “{testimonials[0].quote}”
                  </blockquote>
                </div>
                <div className="mt-8 border-t border-white/15 pt-5">
                  <p className="font-extrabold">{testimonials[0].name}</p>
                  <p className="mt-1 text-sm text-white/60">{testimonials[0].role}</p>
                </div>
              </div>
            </motion.article>

            <div className="grid gap-5">
              {testimonials.slice(1).map((item, index) => (
                <motion.article
                  key={item.name}
                  initial={{ opacity: 0, x: 22 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="grid min-h-[224px] grid-cols-[112px_1fr] overflow-hidden rounded-lg border border-[#ead9bf] bg-[#fffdfa] shadow-[0_14px_34px_rgba(127,42,7,0.09)] sm:grid-cols-[155px_1fr]"
                >
                  <div className="relative">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="155px"
                      className="object-cover object-center"
                    />
                  </div>
                  <div className="flex min-w-0 flex-col justify-between p-5 sm:p-6">
                    <div>
                      <div className="flex gap-0.5 text-[#D4A843]">
                        {Array.from({ length: 5 }).map((_, starIndex) => (
                          <Star key={starIndex} className="size-3.5 fill-current" />
                        ))}
                      </div>
                      <p className="mt-4 text-sm leading-6 text-[#57483f]">
                        “{item.quote}”
                      </p>
                    </div>
                    <div className="mt-4 border-t border-[#f0dfd2] pt-4">
                      <p className="text-sm font-extrabold text-[#2E2318]">{item.name}</p>
                      <p className="mt-0.5 text-xs text-[#83736a]">{item.role}</p>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="bg-[#fdf9f6] py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid overflow-hidden rounded-lg border border-[#dfc5b3] bg-white shadow-[0_24px_65px_rgba(127,42,7,0.14)] lg:grid-cols-[0.92fr_1.08fr]"
          >
            <div className="relative min-h-[430px] overflow-hidden lg:min-h-[600px]">
              <Image
                src="/italy.jpg"
                alt="Italian coast travel destination"
                fill
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[#2E2318]/46" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2E2318]/95 via-[#2E2318]/35 to-transparent" />

              <div className="relative flex h-full min-h-[430px] flex-col justify-between p-7 text-white sm:p-10 lg:min-h-[600px]">
                <span className="w-fit rounded-full border border-white/30 bg-white/12 px-3 py-1.5 text-xs font-extrabold uppercase backdrop-blur-md">
                  Let&apos;s plan something great
                </span>

                <div>
                  <h2 className="max-w-md text-3xl font-extrabold leading-tight md:text-4xl">
                    Your next adventure starts with a conversation.
                  </h2>
                  <p className="mt-4 max-w-md leading-7 text-white/75">
                    Questions, feedback or partnership ideas? Our team would love
                    to hear what you are planning.
                  </p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <a
                      href="mailto:hello@travel-buddy.app"
                      className="inline-flex w-fit items-center gap-3 rounded-lg border border-white/25 bg-white/12 px-4 py-3 text-sm font-bold backdrop-blur-md transition hover:bg-white/20"
                    >
                      <Mail className="size-4 text-[#f2c95c]" />
                      hello@travel-buddy.app
                    </a>
                    <span className="inline-flex w-fit items-center gap-3 rounded-lg border border-white/25 bg-white/12 px-4 py-3 text-sm font-semibold text-white/85 backdrop-blur-md">
                      <ShieldCheck className="size-4 text-[#a9cfa5]" />
                      Private and secure
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center bg-[#fffdfa] p-6 sm:p-10 lg:p-12">
              <div className="w-full">
                <div className="mb-8">
                  <span className="text-xs font-extrabold uppercase text-[#C9603A]">
                    Contact Travel-Buddy
                  </span>
                  <h3 className="mt-3 text-2xl font-extrabold text-[#2E2318]">
                    Send us a message
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#75675f]">
                    Share a few details and we will get back to you soon.
                  </p>
                </div>
                <ContactForm />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />

      <motion.button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        initial={false}
        animate={{
          opacity: showBackToTop ? 1 : 0,
          y: showBackToTop ? 0 : 16,
          pointerEvents: showBackToTop ? 'auto' : 'none',
        }}
        transition={{ duration: 0.2 }}
        aria-label="Back to top"
        className="fixed bottom-5 right-5 z-50 flex size-11 items-center justify-center rounded-lg border border-[#ead9bf] bg-[#C9603A] text-white shadow-[0_14px_30px_rgba(127,42,7,0.22)] transition hover:-translate-y-0.5 hover:bg-[#9f411d]"
      >
        <ChevronUp className="size-5" />
      </motion.button>
    </main>
  )
}

function Navbar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { language, setLanguage } = useLanguage()
  const links = [
    [language === 'fr' ? 'Accueil' : 'Home', '#home'],
    [language === 'fr' ? 'Fonctionnalités' : 'Features', '#features'],
    [language === 'fr' ? 'Comment ça marche' : 'How It Works', '#how-it-works'],
    ['Contact', '#contact'],
  ]

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/15 bg-[#2E2318]/82 backdrop-blur-xl">
      <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link href="#home" className="flex items-center gap-2.5 text-white">
          <Image src="/logoWhite.png" alt="Travel-Buddy" width={42} height={42} className="size-9 object-contain" />
          <span className="text-lg font-extrabold">Travel-Buddy</span>
        </Link>
        <div className="hidden items-center gap-7 lg:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="text-sm font-semibold text-white/75 transition hover:text-white">
              {label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <div className="mr-2 flex rounded-lg border border-white/15 bg-white/10 p-1">
            {(['en', 'fr'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLanguage(item)}
                className={`h-8 rounded-md px-2.5 text-xs font-bold transition ${
                  language === item ? 'bg-white text-[#2E2318]' : 'text-white/75 hover:text-white'
                }`}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>
          <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-bold text-white/85 transition hover:bg-white/10">
            {language === 'fr' ? 'Connexion' : 'Login'}
          </Link>
          <Link href="/signup" className="rounded-lg bg-[#C9603A] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#9f411d]">
            {language === 'fr' ? 'Inscription' : 'Sign Up'}
          </Link>
        </div>
        <button type="button" onClick={onToggle} className="flex size-10 items-center justify-center text-white lg:hidden" aria-label="Toggle navigation">
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-white/10 bg-[#2E2318] px-5 py-5 lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map(([label, href]) => (
              <Link key={href} href={href} onClick={onToggle} className="rounded-lg px-3 py-3 text-sm font-semibold text-white/85 hover:bg-white/8">
                {label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
                className="rounded-lg border border-white/25 px-4 py-2.5 text-center text-sm font-bold text-white"
              >
                {language === 'fr' ? 'EN' : 'FR'}
              </button>
              <Link href="/signup" className="rounded-lg bg-[#C9603A] px-4 py-2.5 text-center text-sm font-bold text-white">
                {language === 'fr' ? 'Inscription' : 'Sign Up'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function GlassMetric({ className, icon: Icon, value }: { className: string; icon: typeof Users; value: string }) {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      className={`absolute flex items-center gap-2 rounded-lg border border-[#f5d76e] bg-[#D4A843] px-3 py-2 text-xs font-extrabold text-[#2E2318] shadow-[0_10px_26px_rgba(212,168,67,0.35)] ${className}`}
    >
      <Icon className="size-4" />
      {value}
    </motion.div>
  )
}

function Counter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!visible) return
    const duration = 1200
    const start = performance.now()
    const animate = (time: number) => {
      const progress = Math.min((time - start) / duration, 1)
      setCount(Math.floor(value * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value, visible])

  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl font-extrabold md:text-4xl">
        {count.toLocaleString('en-US')}
        <span className="ml-1 text-[#D4A843]">{suffix}</span>
      </p>
      <p className="mt-2 text-sm text-white/65">{label}</p>
    </div>
  )
}

function ContactForm() {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.currentTarget.reset()
    toast.success('Message sent. We will get back to you soon.')
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="grid gap-5 sm:grid-cols-2"
    >
      <label className="text-sm font-semibold">
        Name
        <input required name="name" placeholder="Your name" className="mt-2 h-12 w-full rounded-lg border border-[#dfcfc3] bg-white px-4 font-normal outline-none transition placeholder:text-[#ad9e95] focus:border-[#C9603A] focus:ring-2 focus:ring-[#C9603A]/15" />
      </label>
      <label className="text-sm font-semibold">
        Email
        <input required type="email" name="email" placeholder="you@example.com" className="mt-2 h-12 w-full rounded-lg border border-[#dfcfc3] bg-white px-4 font-normal outline-none transition placeholder:text-[#ad9e95] focus:border-[#C9603A] focus:ring-2 focus:ring-[#C9603A]/15" />
      </label>
      <label className="text-sm font-semibold sm:col-span-2">
        Message
        <textarea required name="message" rows={6} placeholder="Tell us how we can help..." className="mt-2 w-full rounded-lg border border-[#dfcfc3] bg-white px-4 py-3 font-normal outline-none transition placeholder:text-[#ad9e95] focus:border-[#C9603A] focus:ring-2 focus:ring-[#C9603A]/15" />
      </label>
      <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#C9603A] px-6 text-sm font-bold text-white shadow-[0_10px_24px_rgba(127,42,7,0.2)] transition hover:bg-[#9f411d] sm:col-span-2 sm:justify-self-start">
        <Send className="size-4" />
        Send message
      </button>
    </motion.form>
  )
}

function Footer() {
  return (
    <footer className="bg-[#2E2318] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.2fr_0.8fr_0.8fr] md:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <Image src="/logoWhite.png" alt="Travel-Buddy" width={42} height={42} className="size-9 object-contain" />
            <span className="text-lg font-extrabold">Travel-Buddy</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">
            Plan together, spend clearly and make every group trip easier.
          </p>
        </div>
        <div>
          <p className="text-sm font-bold">Quick Links</p>
          <div className="mt-4 grid gap-3 text-sm text-white/60">
            <Link href="#features" className="hover:text-white">Features</Link>
            <Link href="#how-it-works" className="hover:text-white">How It Works</Link>
            <Link href="/login" className="hover:text-white">Login</Link>
            <Link href="/signup" className="hover:text-white">Sign Up</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold">Connect</p>
          <p className="mt-4 text-sm text-white/60">hello@travel-buddy.app</p>
          <div className="mt-5 flex gap-2">
            {[FaInstagram, FaFacebookF, Globe2].map((Icon, index) => (
              <a key={index} href="#" aria-label="Social link" className="flex size-9 items-center justify-center rounded-lg border border-white/15 text-white/70 transition hover:bg-white/10 hover:text-white">
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-white/45">
        © 2026 Travel-Buddy. All rights reserved.
      </div>
    </footer>
  )
}
