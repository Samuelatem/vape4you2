/**
 * Notification utility for sound alerts
 * Works on mobile and desktop browsers
 */

const audioCache: { [key: string]: HTMLAudioElement } = {}

/**
 * Play a notification sound
 * Mobile browsers require user interaction before first sound, but works after
 */
export const playNotificationSound = (type: 'payment' | 'message' | 'order-update') => {
  try {
    if (typeof window === 'undefined') return

    // Use Web Audio API for better mobile support
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    // Create a simple beep sound (mobile-friendly)
    const now = audioContext.currentTime
    const duration = 0.3
    
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Different frequencies for different notification types
    const frequencies = {
      payment: 800,      // Higher pitch for payment notification
      message: 600,      // Medium pitch for message
      'order-update': 700 // Medium-high for order update
    }
    
    oscillator.frequency.value = frequencies[type]
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, now)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration)
    
    oscillator.start(now)
    oscillator.stop(now + duration)
    
    console.log(`🔊 ${type} notification sound played`)
  } catch (error) {
    console.warn('Failed to play notification sound:', error)
    // Fallback: try to play a pre-recorded sound if Web Audio fails
    playFallbackSound(type)
  }
}

/**
 * Fallback: Use HTML5 audio element for browsers with limited Web Audio support
 */
const playFallbackSound = (type: 'payment' | 'message' | 'order-update') => {
  try {
    if (typeof window === 'undefined') return
    
    // Create a simple audio context beep if possible
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    
    const frequencies = {
      payment: 800,
      message: 600,
      'order-update': 700
    }
    
    oscillator.frequency.value = frequencies[type]
    oscillator.type = 'sine'
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.2)
  } catch (e) {
    console.warn('Fallback notification sound also failed:', e)
  }
}

/**
 * Request notification permissions from the user
 * Required for sound on some mobile browsers
 */
export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined') return false
  
  try {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return Notification.permission === 'granted'
  } catch (error) {
    console.warn('Notification permission request failed:', error)
    return false
  }
}

/**
 * Show browser notification (visual + optional sound)
 */
export const showBrowserNotification = (
  title: string,
  options?: {
    body?: string
    icon?: string
    tag?: string
    badge?: string
  }
) => {
  try {
    if (typeof window === 'undefined') return
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/images/vape4you-icon.png',
        badge: '/images/vape4you-badge.png',
        ...options
      })
    }
  } catch (error) {
    console.warn('Browser notification failed:', error)
  }
}
