import { useEffect, useRef } from 'react'

/**
 * Hook de scroll reveal usando IntersectionObserver.
 * Adiciona a classe CSS "visible" ao elemento quando entra no viewport.
 * @param {object} options - Opções do IntersectionObserver
 * @param {number} options.threshold - 0 a 1, quanto do elemento deve ser visível
 * @param {string} options.rootMargin - margem extra
 * @param {boolean} options.once - se deve disparar apenas uma vez (default: true)
 */
export function useScrollReveal(options = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const { threshold = 0.12, rootMargin = '0px 0px -40px 0px', once = true } = options

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible')
          if (once) observer.unobserve(entry.target)
        } else if (!once) {
          entry.target.classList.remove('reveal-visible')
        }
      },
      { threshold, rootMargin }
    )

    const el = ref.current
    if (el) observer.observe(el)

    return () => {
      if (el) observer.unobserve(el)
    }
  }, [])

  return ref
}
