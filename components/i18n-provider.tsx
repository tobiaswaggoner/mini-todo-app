"use client"

import { NextIntlClientProvider } from 'next-intl'
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { type Locale, defaultLocale, locales } from '@/lib/i18n/config'
import deMessages from '@/messages/de.json'
import enMessages from '@/messages/en.json'

const SCHEMA = 'mini_todo'

const messages: Record<Locale, typeof deMessages> = {
  de: deMessages,
  en: enMessages,
}

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => Promise<void>
  loading: boolean
}

const I18nContext = createContext<I18nContextType>({
  locale: defaultLocale,
  setLocale: async () => {},
  loading: true,
})

export function useI18n() {
  return useContext(I18nContext)
}

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale

  // Check localStorage first
  const stored = localStorage.getItem('locale')
  if (stored && locales.includes(stored as Locale)) {
    return stored as Locale
  }

  // Check browser language
  const browserLang = navigator.language.split('-')[0]
  if (locales.includes(browserLang as Locale)) {
    return browserLang as Locale
  }

  return defaultLocale
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  // Fetch language from database
  const fetchLanguage = useCallback(async () => {
    if (!user) {
      // For non-authenticated users, use localStorage/browser detection
      const initialLocale = getInitialLocale()
      setLocaleState(initialLocale)
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('user_settings')
      .select('language')
      .single()

    if (!error && data?.language && locales.includes(data.language as Locale)) {
      setLocaleState(data.language as Locale)
      localStorage.setItem('locale', data.language)
    } else {
      // Fallback to localStorage/browser
      const initialLocale = getInitialLocale()
      setLocaleState(initialLocale)
    }
    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    setMounted(true)
    fetchLanguage()
  }, [fetchLanguage])

  const setLocale = useCallback(async (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)

    // Update document lang attribute
    document.documentElement.lang = newLocale

    if (!user) return

    const { error } = await supabase
      .schema(SCHEMA)
      .from('user_settings')
      .upsert({
        user_id: user.id,
        language: newLocale,
      }, { onConflict: 'user_id' })

    if (error) {
      console.error('Error updating language:', error)
    }
  }, [user, supabase])

  // Update document lang when locale changes
  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = locale
    }
  }, [locale, mounted])

  // Avoid hydration mismatch by rendering with default locale until mounted
  const currentLocale = mounted ? locale : defaultLocale

  return (
    <I18nContext.Provider value={{ locale: currentLocale, setLocale, loading }}>
      <NextIntlClientProvider locale={currentLocale} messages={messages[currentLocale]}>
        {children}
      </NextIntlClientProvider>
    </I18nContext.Provider>
  )
}
