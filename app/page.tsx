'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'

/* ── Countdown hook ── */
type CountdownTime = { d: number; h: number; m: number; s: number } | null

function useCountdown(target: Date): CountdownTime {
  const [time, setTime] = useState<CountdownTime>(null)
  useEffect(() => {
    const calc = () => {
      const diff = Math.max(0, target.getTime() - Date.now())
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      return { d, h, m, s }
    }
    setTime(calc())
    const id = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

/* ── Reveal-on-scroll hook ── */
function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in') }),
      { threshold: 0.15 }
    )
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/* ── Toast ── */
function Toast({ title, sub, visible }: { title: string; sub: string; visible: boolean }) {
  return (
    <div
      id="toast"
      style={{
        position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
        background: '#586328', color: '#fff', padding: '1rem 1.5rem',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,.25)',
        opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.3s', maxWidth: '24rem', textAlign: 'center', zIndex: 50,
      }}
    >
      <div className="font-serif italic text-lg">{title}</div>
      <div className="eyebrow text-gold mt-1">{sub}</div>
    </div>
  )
}

export default function HomePage() {
  /* ── state ── */
  const [navScrolled, setNavScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toast, setToast] = useState({ visible: false, title: '', sub: '' })
  const [given, setGiven] = useState<string[]>([])
  const [rsvpDone, setRsvpDone] = useState(false)
  const [pixAmount, setPixAmount] = useState(100)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const wedding = new Date('2026-09-12T16:30:00-03:00')
  const countdown = useCountdown(wedding)
  useReveal()

  /* ── effects ── */
  useEffect(() => {
    try {
      const g = JSON.parse(localStorage.getItem('gifts') || '[]')
      setGiven(g)
      const r = localStorage.getItem('rsvp_im')
      if (r) setRsvpDone(true)
    } catch (_) {}
  }, [])

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── helpers ── */
  const showToast = useCallback((title: string, sub = '— obrigado de coração —') => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ visible: true, title, sub })
    toastTimer.current = setTimeout(() => setToast((p) => ({ ...p, visible: false })), 2800)
  }, [])

  const handleGive = (id: string, name: string, price: string) => {
    if (given.includes(id)) return
    const next = [...given, id]
    setGiven(next)
    try { localStorage.setItem('gifts', JSON.stringify(next)) } catch (_) {}
    showToast(`"${name}" reservado`, `R$ ${price},00 · obrigado!`)
  }

  const copyPix = async (btn: EventTarget & HTMLButtonElement) => {
    const key = 'igorecarol@casamento.com'
    const keyEl = btn.querySelector('.pix-key')
    if (!keyEl) return
    const orig = keyEl.textContent || ''
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(key)
      btn.classList.add('copied')
      keyEl.textContent = '✓ chave Pix copiada'
      setTimeout(() => { btn.classList.remove('copied'); keyEl.textContent = orig }, 1800)
    } catch (_) {}
  }

  const handlePixBtn = () => {
    const v = Number(pixAmount)
    if (isNaN(v) || v < 100) {
      setPixAmount(100)
      showToast('Mínimo R$ 100', '— vai, mão de vaca, dá pra mais!')
      return
    }
    if (navigator.clipboard) navigator.clipboard.writeText('igorecarol@casamento.com').catch(() => {})
    showToast(`R$ ${v.toFixed(0)} via Pix`, '— chave copiada! muito obrigado 💚')
  }

  const handleRSVP = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const nome = (data.get('entry.1369867619') as string) || ''
    const acompanhante = (data.get('entry.2110350968') as string) || ''
    const base = 'https://docs.google.com/forms/d/e/1FAIpQLSf-J6hbG6eJlAKSvhto2gDxieQ4gNmUY4tXwj9dAq-2WNB8Gg/viewform'
    const url = `${base}?usp=pp_url&entry.1369867619=${encodeURIComponent(nome)}&entry.2110350968=${encodeURIComponent(acompanhante)}`
    window.open(url, '_blank')
    try { localStorage.setItem('rsvp_im', JSON.stringify({ nome, acompanhante, at: Date.now() })) } catch (_) {}
    setRsvpDone(true)
  }

  const handlePhoneMask = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11)
    if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`
    else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`
    else if (v.length > 0) v = `(${v}`
    e.target.value = v
  }

  const pad = (n: number) => String(n).padStart(2, '0')

  /* ── render ── */
  return (
    <>
      {/* NAV */}
      <nav
        id="main-nav"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300${navScrolled ? ' scrolled' : ''}`}
      >
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-center relative">
          <ul className="hidden md:flex items-center gap-10 text-[11.5px] tracking-[0.32em] uppercase font-medium nav-list">
            {[['#hero','Home'],['#historia','O Casal'],['#programacao','Programação'],['#localizacao','Cerimônia'],['#presentes','Lista de Presentes'],['#rsvp','Confirme sua Presença']].map(([href, label]) => (
              <li key={href}><a className="nav-link" href={href}>{label}</a></li>
            ))}
          </ul>
          <button
            className="md:hidden absolute right-6 top-1/2 -translate-y-1/2 nav-list"
            aria-label="Menu"
            onClick={() => setMobileOpen(true)}
          >
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div className={`${mobileOpen ? 'open' : ''}`} id="mobile-menu">
        <button id="mobile-menu-close" onClick={() => setMobileOpen(false)}>✕</button>
        {[['#hero','Home'],['#historia','O Casal'],['#programacao','Programação'],['#localizacao','Cerimônia'],['#presentes','Lista de Presentes'],['#rsvp','Confirme sua Presença']].map(([href, label]) => (
          <a key={href} href={href} onClick={() => setMobileOpen(false)}>{label}</a>
        ))}
      </div>

      {/* ═══ HERO ═══ */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <Image
          src="/foto4.jpg"
          alt="Igor e Ana Caroline"
          fill
          priority
          className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none"
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{ background: 'linear-gradient(to bottom, rgba(31,36,24,.20), rgba(31,36,24,.15), rgba(31,36,24,.55))' }}
        />

        <div className="relative z-10 text-center text-paper px-6 max-w-4xl w-full">
          {/* Monogram */}
          <div className="relative inline-flex items-center justify-center mb-10 md:mb-12">
            <div className="relative w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] md:w-[320px] md:h-[320px]">
              <div className="absolute inset-0 border border-paper/90" />
              <svg
                className="absolute -left-3 top-1/2 -translate-y-1/2 w-24 sm:w-28 md:w-36 text-paper"
                viewBox="0 0 100 240" aria-hidden="true"
              >
                <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
                  <path d="M50 232 L50 14" />
                  <ellipse cx="38" cy="210" rx="11" ry="3.6" transform="rotate(-30 38 210)" fill="currentColor" opacity="0.85" />
                  <ellipse cx="33" cy="178" rx="13" ry="4" transform="rotate(-42 33 178)" fill="currentColor" opacity="0.85" />
                  <ellipse cx="37" cy="148" rx="11" ry="3.6" transform="rotate(-26 37 148)" fill="currentColor" opacity="0.85" />
                  <ellipse cx="34" cy="116" rx="12" ry="4" transform="rotate(-38 34 116)" fill="currentColor" opacity="0.85" />
                  <ellipse cx="39" cy="84" rx="10" ry="3.4" transform="rotate(-22 39 84)" fill="currentColor" opacity="0.85" />
                  <ellipse cx="36" cy="54" rx="11" ry="3.6" transform="rotate(-32 36 54)" fill="currentColor" opacity="0.85" />
                  <ellipse cx="62" cy="196" rx="11" ry="3.6" transform="rotate(30 62 196)" fill="currentColor" opacity="0.85" />
                  <ellipse cx="67" cy="164" rx="13" ry="4" transform="rotate(42 67 164)" fill="currentColor" opacity="0.85" />
                  <ellipse cx="63" cy="132" rx="11" ry="3.6" transform="rotate(26 63 132)" fill="currentColor" opacity="0.85" />
                  <ellipse cx="66" cy="100" rx="12" ry="4" transform="rotate(38 66 100)" fill="currentColor" opacity="0.85" />
                  <ellipse cx="61" cy="70" rx="10" ry="3.4" transform="rotate(22 61 70)" fill="currentColor" opacity="0.85" />
                  <ellipse cx="64" cy="40" rx="11" ry="3.6" transform="rotate(32 64 40)" fill="currentColor" opacity="0.85" />
                  <circle cx="50" cy="14" r="2.6" fill="currentColor" />
                </g>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center pl-10 md:pl-12">
                <div
                  className="font-serif text-paper leading-none flex items-center gap-2 sm:gap-3"
                  style={{ textShadow: '0 2px 24px rgba(0,0,0,0.4)', fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  <span className="text-[68px] sm:text-[84px] md:text-[112px] tracking-tight">I</span>
                  <span className="text-[28px] sm:text-[36px] md:text-[46px] text-paper/80 -translate-y-2">·</span>
                  <span className="text-[68px] sm:text-[84px] md:text-[112px] tracking-tight">C</span>
                </div>
              </div>
            </div>
          </div>

          <h1
            className="font-serif text-paper tracking-[0.22em] md:tracking-[0.32em] uppercase font-normal text-[22px] sm:text-[32px] md:text-[44px] lg:text-[52px] leading-tight"
            style={{ textShadow: '0 2px 28px rgba(0,0,0,0.5)', fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Igor &nbsp;e&nbsp; Ana Caroline
          </h1>

          <div
            className="mt-5 md:mt-7 flex items-center justify-center gap-3 sm:gap-4 text-paper font-serif text-[16px] sm:text-[22px] md:text-[26px] tracking-[0.18em]"
            style={{ textShadow: '0 2px 18px rgba(0,0,0,0.45)', fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            <span>12</span>
            <span className="text-paper/70">|</span>
            <span>09</span>
            <span className="text-paper/70">|</span>
            <span>2026</span>
          </div>

          {/* COUNTDOWN */}
          <div className="mt-9 md:mt-12">
            <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.92)', textShadow: '0 1px 12px rgba(0,0,0,0.45)' }}>
              Faltam para o nosso sim
            </div>
            <div id="countdown" className="mt-5 grid grid-cols-4 gap-2 sm:gap-4 md:gap-6 max-w-2xl mx-auto">
              <div className="cd-cell"><div className="cd-num">{countdown ? pad(countdown.d) : '--'}</div><div className="cd-label">dias</div></div>
              <div className="cd-cell"><div className="cd-num">{countdown ? pad(countdown.h) : '--'}</div><div className="cd-label">horas</div></div>
              <div className="cd-cell"><div className="cd-num">{countdown ? pad(countdown.m) : '--'}</div><div className="cd-label">minutos</div></div>
              <div className="cd-cell"><div className="cd-num">{countdown ? pad(countdown.s) : '--'}</div><div className="cd-label">segundos</div></div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-3">
          <span className="eyebrow" style={{ color: 'rgba(255,255,255,0.85)' }}>role</span>
          <span className="w-px h-10 bg-paper/60" />
        </div>
      </section>

      {/* ═══ NOSSA HISTÓRIA ═══ */}
      <section id="historia" className="py-32 px-6 bg-cream">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20 reveal">
            <div className="eyebrow">Capítulo um</div>
            <h2 className="font-serif italic text-5xl md:text-6xl mt-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              A nossa história
            </h2>
            <div className="hair mt-6 max-w-xs mx-auto"><span>✦</span></div>
            <p className="mt-6 max-w-xl mx-auto text-inkSoft text-lg leading-relaxed">
              Sete anos atrás, um esbarrão na fila do café virou conversa,
              a conversa virou jantar, o jantar virou viagem — e agora, vira para sempre.
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px timeline-line -translate-x-1/2" />

            {/* Item 1 */}
            <div className="grid md:grid-cols-2 gap-10 md:gap-20 items-center mb-20 reveal">
              <div className="md:text-right md:order-1 order-2">
                <div className="eyebrow text-gold mb-3">Outubro · 2019</div>
                <h3 className="font-serif italic text-3xl mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>O primeiro café.</h3>
                <p className="text-inkSoft leading-relaxed">
                  A Ana Caroline pediu um cappuccino, o Igor pediu um expresso duplo e
                  uma desculpa para puxar conversa. Saíram da cafeteria com
                  o número um do outro — e uma certeza meio nervosa no peito.
                </p>
              </div>
              <div className="relative md:order-2 order-1">
                <span className="hidden md:block absolute -left-[42px] top-6 w-3 h-3 rounded-full bg-gold ring-4 ring-cream" />
                <div className="placeholder-photo aspect-[4/3]" data-label="— primeiro café —" />
              </div>
            </div>

            {/* Item 2 */}
            <div className="grid md:grid-cols-2 gap-10 md:gap-20 items-center mb-20 reveal">
              <div className="relative">
                <span className="hidden md:block absolute -right-[42px] top-6 w-3 h-3 rounded-full bg-gold ring-4 ring-cream" />
                <div className="placeholder-photo aspect-[4/3]" data-label="— viagem a Trancoso —" />
              </div>
              <div>
                <div className="eyebrow text-gold mb-3">Janeiro · 2022</div>
                <h3 className="font-serif italic text-3xl mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>A viagem que mudou tudo.</h3>
                <p className="text-inkSoft leading-relaxed">
                  Em Trancoso, sentados de frente para o mar ao pôr do sol,
                  descobriram que silêncio também era conversa — e que aquele
                  era exatamente o tipo de silêncio que queriam para o resto da vida.
                </p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="grid md:grid-cols-2 gap-10 md:gap-20 items-center reveal">
              <div className="md:text-right md:order-1 order-2">
                <div className="eyebrow text-gold mb-3">Dezembro · 2025</div>
                <h3 className="font-serif italic text-3xl mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>O sim.</h3>
                <p className="text-inkSoft leading-relaxed">
                  Foi simples: na varanda de casa, sem plateia, com um anel
                  que ele guardava há meses. Ela disse sim antes mesmo da
                  pergunta inteira sair. E agora, falta pouco para selar
                  essa promessa diante de Deus e de quem amamos.
                </p>
              </div>
              <div className="relative md:order-2 order-1">
                <span className="hidden md:block absolute -left-[42px] top-6 w-3 h-3 rounded-full bg-gold ring-4 ring-cream" />
                <div className="placeholder-photo aspect-[4/3]" data-label="— o pedido —" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PROGRAMAÇÃO ═══ */}
      <section id="programacao" className="py-32 px-6 bg-paper">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16 reveal">
            <div className="eyebrow">Cronograma do dia</div>
            <h2 className="font-serif italic text-5xl md:text-6xl mt-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Programação
            </h2>
            <div className="hair mt-6 max-w-xs mx-auto"><span>✰</span></div>
            <p className="mt-6 text-inkSoft text-lg leading-relaxed">
              Anotem na agenda — e cheguem com fome.
              <span className="block text-mute italic text-base mt-2">(o noivo prometeu que não se atrasa. veremos.)</span>
            </p>
          </div>

          <div className="bg-cream border border-sand p-8 md:p-12">
            {[
              { time: '15:30', title: 'Recepção dos convidados', joke: 'Espumante, leques e uma chance de pegar lugar bom no corredor.', icon: '☘' },
              { time: '16:30', title: 'Cerimônia religiosa', joke: 'A Ana Caroline entra pontualmente. O Igor entra pontualmente. (é contratual.)', icon: '✝' },
              { time: '17:30', title: 'Sessão de fotos & coquetel', joke: 'Tirem todas as fotos com a sogra agora. Depois ela vai estar dançando.', icon: '❝' },
              { time: '19:00', title: 'Jantar de boas-vindas', joke: 'Cardápio aprovado em votação unânime do casal (ou seja: a Ana Caroline escolheu).', icon: '🍽' },
              { time: '21:00', title: 'Valsa & brindes', joke: 'Discurso do padrinho com aviso de spoiler: ele guardou histórias por anos.', icon: '🥂' },
              { time: '22:30', title: 'Pista aberta', joke: 'Política de uso: pode dançar mal, não pode dançar pouco.', icon: '♪' },
              { time: '02:00', title: 'Hora do bolo & "batata frita salvadora"', joke: 'Tradição de família: ninguém vai embora sem batata frita às 2 da manhã.', icon: '🍰' },
            ].map((row) => (
              <div className="schedule-row" key={row.time}>
                <div className="time">{row.time}</div>
                <div>
                  <div className="title">{row.title}</div>
                  <div className="joke">{row.joke}</div>
                </div>
                <div className="icon">{row.icon}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center reveal">
            <div className="inline-block bg-eucal/10 border border-eucal/30 px-6 py-4">
              <div className="eyebrow text-eucalDk">Avisório importante</div>
              <p className="font-serif italic text-inkSoft mt-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                "Atenção: salto agulha & gramado da fazenda <strong className="text-eucalDk not-italic">não</strong> são amigos.
                Recomendamos sapatilha de reserva na bolsa."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ LOCALIZAÇÃO ═══ */}
      <section id="localizacao" className="py-32 px-6 bg-cream">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 reveal">
            <div className="eyebrow">Onde será</div>
            <h2 className="font-serif italic text-5xl md:text-6xl mt-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Localização
            </h2>
            <div className="hair mt-6 max-w-xs mx-auto"><span>✰</span></div>
            <p className="mt-6 max-w-xl mx-auto text-inkSoft text-lg leading-relaxed">
              Cerimônia e festa no Condomínio Foz do Joanes, em Lauro de Freitas.
              <span className="block italic text-mute text-base mt-2">Cheguem cedo, o lugar é lindo.</span>
            </p>
          </div>

          <div className="grid md:grid-cols-[1.1fr_1fr] gap-12 items-center">
            {/* Foto do local */}
            <div className="relative aspect-[4/3] overflow-hidden shadow-xl reveal" style={{ border: '1px solid rgba(124,139,63,0.25)' }}>
              <Image
                src="/local.jpg"
                alt="Condominio Foz do Joanes"
                fill
                className="object-cover"
                style={{ objectFit: 'cover' }}
              />
            </div>

            <div className="reveal">
              <div className="eyebrow text-eucalDk">Cerimônia &amp; Recepção</div>
              <h3 className="font-serif italic text-4xl mt-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Condominio Foz do Joanes
              </h3>
              <p className="mt-3 text-inkSoft text-lg leading-relaxed">
                R. João Marques Oliveira, 53<br />
                Buraquinho · Lauro de Freitas – BA<br />
                CEP 42710-170
              </p>

              <div className="mt-8 grid grid-cols-3 divide-x divide-sand border-y border-sand py-5">
                {[
                  { label: 'De carro', value: '26 min', sub: 'pela BA-526' },
                  { label: 'Uber/app', value: '13 min', sub: 'rota rápida' },
                  { label: 'Telefone', value: '(71)', sub: '98233-2862' },
                ].map((item) => (
                  <div className="text-center" key={item.label}>
                    <div className="eyebrow text-eucalDk">{item.label}</div>
                    <div className="font-serif italic text-2xl mt-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{item.value}</div>
                    <div className="text-mute text-xs mt-1">{item.sub}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-3">
                <a
                  href="https://maps.google.com/?q=R.+João+Marques+Oliveira,+53+Buraquinho+Lauro+de+Freitas+BA"
                  target="_blank"
                  rel="noopener"
                  className="flex items-center justify-between bg-eucal text-paper px-5 py-4 hover:bg-eucalDk transition group"
                >
                  <span className="flex items-center gap-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 22s8-7 8-13a8 8 0 0 0-16 0c0 6 8 13 8 13z" />
                      <circle cx="12" cy="9" r="3" />
                    </svg>
                    <span className="text-[11px] tracking-[0.28em] uppercase font-medium">Abrir no Google Maps</span>
                  </span>
                  <span className="text-[11px] tracking-[0.24em] uppercase opacity-70 group-hover:opacity-100">→</span>
                </a>
                <a
                  href="https://waze.com/ul?q=R.+João+Marques+Oliveira+53+Lauro+de+Freitas+BA"
                  target="_blank"
                  rel="noopener"
                  className="flex items-center justify-between border border-eucal text-eucalDk px-5 py-4 hover:bg-eucal/10 transition group"
                >
                  <span className="flex items-center gap-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M8 14a4 4 0 0 0 8 0" />
                      <circle cx="9" cy="10" r=".8" fill="currentColor" />
                      <circle cx="15" cy="10" r=".8" fill="currentColor" />
                    </svg>
                    <span className="text-[11px] tracking-[0.28em] uppercase font-medium">Traçar rota no Waze</span>
                  </span>
                  <span className="text-[11px] tracking-[0.24em] uppercase opacity-70 group-hover:opacity-100">→</span>
                </a>
                <a
                  href="tel:+5571982332862"
                  className="flex items-center justify-between border border-eucal text-eucalDk px-5 py-4 hover:bg-eucal/10 transition group"
                >
                  <span className="flex items-center gap-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.57a16 16 0 0 0 6.29 6.29l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span className="text-[11px] tracking-[0.28em] uppercase font-medium">(71) 98233-2862</span>
                  </span>
                  <span className="text-[11px] tracking-[0.24em] uppercase opacity-70 group-hover:opacity-100">→</span>
                </a>
              </div>

              <p className="mt-8 text-mute italic text-sm border-l-2 border-gold/60 pl-4">
                ZAP: <strong className="text-eucalDk not-italic">(71) 99999</strong> · Condominio Foz do Joanes, Buraquinho, Lauro de Freitas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ LISTA DE PRESENTES ═══ */}
      <section id="presentes" className="py-32 px-6 bg-paper">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 reveal">
            <div className="eyebrow">Cotas de Lua de Mel</div>
            <h2 className="font-serif italic text-5xl md:text-6xl mt-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Lista de presentes
            </h2>
            <div className="hair mt-6 max-w-xs mx-auto"><span>✦</span></div>
            <p className="mt-6 max-w-2xl mx-auto text-inkSoft text-lg leading-relaxed">
              Antes da lista séria de panelas, eletro e enxoval — separamos
              algumas cotas <em className="text-eucalDk not-italic font-medium">absolutamente essenciais</em> para
              garantir a sobrevivência conjugal. Escolha com carinho (e bom humor).
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Card 1 */}
            <article className="gift-card bg-cream group overflow-hidden">
              <div className="aspect-square overflow-hidden relative">
                <Image src="/ronaldinho.jpg" alt="Ronaldinho Copa 2002" fill className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ objectFit: 'cover' }} />
              </div>
              <div className="p-6">
                <div className="eyebrow text-gold">Cota nº 01</div>
                <h3 className="font-serif italic text-2xl mt-2 leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Para ficar Estilo Ronaldinho na copa de 2002</h3>
                <div className="mt-6 flex items-baseline justify-between">
                  <div>
                    <div className="eyebrow">Valor</div>
                    <div className="font-serif italic text-2xl mt-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>R$ 500<span className="text-base">,00</span></div>
                  </div>
                  <button
                    onClick={() => handleGive('1', 'Para ficar Estilo Ronaldinho na copa de 2002', '500')}
                    className={`btn-give px-5 py-3 text-[11px] tracking-[0.24em] uppercase font-medium${given.includes('1') ? ' tag-given' : ' bg-eucal text-paper hover:bg-eucalDk'}`}
                  >
                    {given.includes('1') ? 'Presenteado ✓' : 'Presentear'}
                  </button>
                </div>
                <PixContribuir amount={500} onToast={showToast} />
                <PixLine />
              </div>
            </article>

            {/* Card 2 */}
            <article className="gift-card bg-cream group overflow-hidden">
              <div className="aspect-square overflow-hidden relative" style={{ background: '#F5F4EE' }}>
                <Image src="/noivo_culinaria.jpg" alt="Curso de culinaria para o noivo" fill className="absolute inset-0 transition-transform duration-700 group-hover:scale-105" style={{ objectFit: 'contain', objectPosition: 'center' }} />
              </div>
              <div className="p-6">
                <div className="eyebrow text-gold">Cota nº 02</div>
                <h3 className="font-serif italic text-2xl mt-2 leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Curso de culinaria para o noivo</h3>
                <div className="mt-6 flex items-baseline justify-between">
                  <div>
                    <div className="eyebrow">Valor</div>
                    <div className="font-serif italic text-2xl mt-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>R$ 180<span className="text-base">,00</span></div>
                  </div>
                  <button
                    onClick={() => handleGive('2', 'Curso de culinaria para o noivo', '180')}
                    className={`btn-give px-5 py-3 text-[11px] tracking-[0.24em] uppercase font-medium${given.includes('2') ? ' tag-given' : ' bg-eucal text-paper hover:bg-eucalDk'}`}
                  >
                    {given.includes('2') ? 'Presenteado ✓' : 'Presentear'}
                  </button>
                </div>
                <PixContribuir amount={180} onToast={showToast} />
                <PixLine />
              </div>
            </article>

            {/* Card 3 */}
            <article className="gift-card bg-cream group overflow-hidden">
              <div className="aspect-square overflow-hidden relative" style={{ background: '#F5F4EE' }}>
                <Image src="/meme.jpg" alt="Cota para perguntar quando vem os filhos" fill className="absolute inset-0 transition-transform duration-700 group-hover:scale-105" style={{ objectFit: 'contain', objectPosition: 'center' }} />
              </div>
              <div className="p-6">
                <div className="eyebrow text-gold">Cota nº 03</div>
                <h3 className="font-serif italic text-2xl mt-2 leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Cota para perguntar quando vem os filhos</h3>
                <div className="mt-6 flex items-baseline justify-between">
                  <div>
                    <div className="eyebrow">Valor</div>
                    <div className="font-serif italic text-2xl mt-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>R$ 120<span className="text-base">,00</span></div>
                  </div>
                  <button
                    onClick={() => handleGive('3', 'Cota para perguntar quando vem os filhos', '120')}
                    className={`btn-give px-5 py-3 text-[11px] tracking-[0.24em] uppercase font-medium${given.includes('3') ? ' tag-given' : ' bg-eucal text-paper hover:bg-eucalDk'}`}
                  >
                    {given.includes('3') ? 'Presenteado ✓' : 'Presentear'}
                  </button>
                </div>
                <PixContribuir amount={120} onToast={showToast} />
                <PixLine />
              </div>
            </article>

            {/* Card 4 — PIX */}
            <article className="gift-card bg-cream group overflow-hidden relative" id="card-pix">
              <div className="aspect-square overflow-hidden relative" style={{ background: '#F5F4EE' }}>
                <Image src="/julius.jpg" alt="Só pra não dizer que não dei nada" fill className="absolute inset-0 transition-transform duration-700 group-hover:scale-105" style={{ objectFit: 'contain', objectPosition: 'center' }} />
                <div className="absolute top-3 left-3 bg-eucalDk text-paper text-[10px] tracking-[0.24em] uppercase px-3 py-1 font-medium" style={{ zIndex: 1 }}>
                  Pix livre
                </div>
              </div>
              <div className="p-6">
                <div className="eyebrow text-gold">Cota nº 04</div>
                <h3 className="font-serif italic text-2xl mt-2 leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Só pra não dizer que não dei nada</h3>
                <div className="mt-6">
                  <div className="eyebrow mb-2">Valor da sua contribuição</div>
                  <div className="flex items-stretch border border-eucal/40 bg-paper">
                    <span className="px-3 flex items-center font-serif italic text-eucalDk text-lg border-r border-eucal/30" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>R$</span>
                    <input
                      id="pix-amount"
                      type="number"
                      min={100}
                      step={10}
                      value={pixAmount}
                      onChange={(e) => setPixAmount(Number(e.target.value))}
                      className="flex-1 px-3 py-3 bg-transparent font-serif italic text-xl text-ink outline-none w-full"
                      style={{ border: 'none', fontFamily: "'Playfair Display', Georgia, serif" }}
                    />
                  </div>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {[100, 200, 500].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setPixAmount(v)}
                        className="pix-quick text-[11px] tracking-[0.16em] uppercase border border-eucal/40 px-3 py-1.5 hover:bg-eucal hover:text-paper transition"
                      >
                        R$ {v}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handlePixBtn}
                    className="mt-4 w-full bg-eucal text-paper py-3 text-[11px] tracking-[0.28em] uppercase font-medium hover:bg-eucalDk transition"
                  >
                    Contribuir via Pix
                  </button>
                  <PixLine />
                </div>
              </div>
            </article>
          </div>

          <p className="text-center mt-16 text-inkSoft italic max-w-xl mx-auto reveal">
            A lista oficial completa fica no rodapé — esses são apenas os itens{' '}
            <em className="text-eucalDk not-italic">indispensáveis</em> para a paz do lar.
          </p>
        </div>
      </section>

      {/* ═══ VERSO PONTUAL ═══ */}
      <section className="py-24 px-6 bg-eucalDk text-paper">
        <div className="max-w-2xl mx-auto text-center">
          <div className="hair text-gold/70 mb-6"><span>✦</span></div>
          <blockquote className="font-serif italic text-3xl md:text-4xl leading-snug" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            "O amor é paciente, o amor é benigno.<br />
            Tudo sofre, tudo crê, tudo espera, tudo suporta."
          </blockquote>
          <cite className="block mt-6 eyebrow text-gold not-italic">1 Coríntios 13: 4 · 7</cite>
        </div>
      </section>

      {/* ═══ RSVP ═══ */}
      <section id="rsvp" className="py-32 px-6 bg-paper">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14 reveal">
            <div className="eyebrow">Lista de Presença</div>
            <h2 className="font-serif italic text-5xl md:text-6xl mt-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Confirme sua presença
            </h2>
            <div className="hair mt-6 max-w-xs mx-auto"><span>✦</span></div>
            <p className="mt-6 text-inkSoft text-lg leading-relaxed">
              Sua presença é o melhor presente. Por favor confirme até{' '}
              <strong className="text-eucalDk">15 de Agosto de 2026</strong>.
            </p>
          </div>

          {!rsvpDone ? (
            <form
              id="rsvp-form"
              onSubmit={handleRSVP}
              noValidate
              className="space-y-7 bg-cream p-8 md:p-12 shadow-sm border border-sand"
            >
              <div className="field">
                <label className="eyebrow text-eucalDk block mb-2">Nome completo *</label>
                <input
                  type="text"
                  name="entry.1369867619"
                  required
                  placeholder="Digite seu nome completo"
                />
              </div>
              <div className="field">
                <label className="eyebrow text-eucalDk block mb-2">Vai levar acompanhante? Se sim, qual o nome?</label>
                <input
                  type="text"
                  name="entry.2110350968"
                  placeholder="Nome do acompanhante (deixe em branco se não)"
                />
              </div>
              <button type="submit" className="w-full bg-eucal text-paper py-5 text-[12px] tracking-[0.32em] uppercase font-medium hover:bg-eucalDk transition">
                Confirmar Presença
              </button>
              <p className="text-center text-mute text-xs italic">
                Ao confirmar, você será redirecionado para o formulário oficial.
              </p>
            </form>
          ) : (
            <div className="text-center p-12 bg-cream border border-gold/40">
              <div className="font-script text-7xl text-eucalDk leading-none" style={{ fontFamily: "'Italianno', cursive" }}>Obrigado</div>
              <h3 className="font-serif italic text-2xl mt-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Sua presença está confirmada.</h3>
              <p className="mt-3 text-inkSoft italic">Mal podemos esperar para celebrar com você na Cerimônia.</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer
        className="py-20 px-6 bg-cream text-center border-t border-sand"
        onDoubleClick={() => {
          if (confirm('Limpar confirmação e presentes (modo demo)?')) {
            try { localStorage.removeItem('rsvp_im'); localStorage.removeItem('gifts') } catch (_) {}
            location.reload()
          }
        }}
      >
        <div className="font-script text-7xl text-eucalDk leading-none" style={{ fontFamily: "'Italianno', cursive" }}>Igor &amp; Ana Caroline</div>
        <p className="font-serif italic text-inkSoft text-lg mt-6 max-w-md mx-auto" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          "Que o Senhor faça crescer e exceder o vosso amor uns para com os outros."
        </p>
        <p className="eyebrow text-gold mt-3">1 Tessalonicenses 3:12</p>
        <p className="eyebrow text-mute mt-10">— 12 · 09 · 2026 · Trancoso · BA —</p>
      </footer>

      {/* TOAST */}
      <Toast title={toast.title} sub={toast.sub} visible={toast.visible} />
    </>
  )
}

/* ── PixContribuir component (botão que copia a chave) ── */
function PixContribuir({ amount, onToast }: { amount: number; onToast: (t: string, s: string) => void }) {
  const handleClick = () => {
    const key = 'igorecarol@casamento.com'
    if (navigator.clipboard) navigator.clipboard.writeText(key).catch(() => {})
    onToast(`R$ ${amount} via Pix`, '— chave copiada! muito obrigado 💚')
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      className="mt-4 w-full bg-eucal text-paper py-3 text-[11px] tracking-[0.28em] uppercase font-medium hover:bg-eucalDk transition"
    >
      Contribuir via Pix
    </button>
  )
}

/* ── PixLine component ── */
function PixLine() {
  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget
    const key = btn.dataset.pix || ''
    const keyEl = btn.querySelector('.pix-key')
    if (!keyEl) return
    const orig = keyEl.textContent || ''
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(key)
      btn.classList.add('copied')
      keyEl.textContent = '✓ chave Pix copiada'
      setTimeout(() => { btn.classList.remove('copied'); keyEl.textContent = orig }, 1800)
    } catch (_) {}
  }

  return (
    <div className="pix-line">
      <span className="pix-label">chave Pix:</span>
      <button type="button" className="pix-copy" data-pix="igorecarol@casamento.com" onClick={handleCopy}>
        <span className="pix-key">igorecarol@casamento.com</span>
        <span className="pix-copy-ico" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="12" height="12" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
        </span>
      </button>
    </div>
  )
}
