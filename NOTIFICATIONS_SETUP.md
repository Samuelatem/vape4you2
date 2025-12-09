# Real-Time Sound Notifications System

This document describes the implementation of real-time sound notifications for the Vape4You platform, including payment alerts for vendors and message/order status updates for all users.

## Overview

The notification system uses Web Audio API to play distinct notification sounds for different events:
- **Payment notifications (800Hz)**: When a client initiates a Bitcoin payment
- **Message notifications (600Hz)**: When a chat message is received
- **Order status notifications (700Hz)**: When a vendor updates an order status

## Architecture

### Components

1. **Sound Notification Library** (`src/lib/notifications.ts`)
   - `playNotificationSound(type)`: Plays a notification sound using Web Audio API
   - Supports three notification types: 'payment', 'message', 'order-update'
   - Cross-browser compatible with fallback for unsupported browsers
   - Mobile-friendly (Web Audio API works on iOS Safari and Android Chrome after user interaction)

2. **Socket.IO Server** (`src/lib/socket.ts`)
   - `emitOrderCreated(order)`: Notifies vendor of new order
   - `emitOrderUpdated(order)`: Notifies vendor and client of order changes
   - Socket event handlers for payment and status updates
   - Emits 'order-status-changed' events to clients

3. **Integration Points**

   a) **Vendor Dashboard** (`src/app/vendor/page.tsx`)
   - Listens to 'new-order-payment' socket event
   - Plays payment sound (800Hz) when client pays Bitcoin
   - Vendor gets instant notification to check payment and update order status

   b) **Chat Page** (`src/app/chat/page.tsx`)
   - Listens to 'receive-message' socket event
   - Plays message sound (600Hz) when message is received
   - Works for both vendors and clients

   c) **Client Orders Page** (`src/app/orders/page.tsx`)
   - Listens to 'order-status-changed' socket event
   - Plays order status sound (700Hz) when vendor updates order
   - Updates order status in real-time

## Flow Diagrams

### Payment Notification Flow
```
1. Client submits Bitcoin payment
   ↓
2. /api/payments/bitcoin POST creates payment
   ↓
3. emitOrderUpdated() called
   ↓
4. Socket emits 'order-status-changed' to vendor room
   ↓
5. Vendor dashboard listens and plays sound (800Hz)
   ↓
6. Vendor can now update order status
```

### Message Notification Flow
```
1. User sends message in chat
   ↓
2. Socket event 'send-message' emitted
   ↓
3. Server emits 'receive-message' to recipient
   ↓
4. Chat page receives message
   ↓
5. playNotificationSound('message') called (600Hz)
   ↓
6. Message is displayed in conversation
```

### Order Status Update Flow
```
1. Vendor clicks "Process", "Ship", or "Mark Delivered"
   ↓
2. PUT /api/vendor/orders updates order status
   ↓
3. emitOrderUpdated() called
   ↓
4. Socket emits 'order-status-changed' to client's user room
   ↓
5. Client orders page receives update
   ↓
6. playNotificationSound('order-update') called (700Hz)
   ↓
7. Order status updates in real-time on client's "Your Orders" page
```

## Technical Details

### Web Audio API Implementation

The notification system uses Web Audio API to generate simple sine wave tones:

```typescript
const audioContext = new AudioContext()
const oscillator = audioContext.createOscillator()
const gainNode = audioContext.createGain()

oscillator.frequency.value = 800 // Payment tone
oscillator.type = 'sine'
gainNode.gain.setValueAtTime(0.3, now)
gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration)

oscillator.start(now)
oscillator.stop(now + duration)
```

### Mobile Compatibility

- **iOS Safari**: Web Audio API works after user interaction (click/tap)
- **Android Chrome**: Web Audio API fully supported
- **Cross-browser**: Includes fallback for browsers without Web Audio API support

### Socket.IO Event Handlers

**Vendor Dashboard Events:**
```typescript
socket.on('new-order-payment', ({ orderId, userId, amount, paymentMethod, timestamp }) => {
  playNotificationSound('payment')
  fetchVendorData()
})
```

**Client Orders Events:**
```typescript
socket.on('order-status-changed', ({ orderId, status, timestamp }) => {
  // Update order in UI
  playNotificationSound('order-update')
})
```

**Chat Events:**
```typescript
socket.on('receive-message', (payload) => {
  // Add message to conversation
  playNotificationSound('message')
})
```

## Testing

### Manual Testing Checklist

- [ ] **Payment Notification**
  - [ ] Client navigates to checkout and completes payment
  - [ ] Vendor dashboard displays payment notification (visual + sound)
  - [ ] Sound plays at 800Hz frequency
  - [ ] Works on mobile browser (iOS Safari / Android Chrome)

- [ ] **Message Notification**
  - [ ] User sends message in chat
  - [ ] Recipient receives message with sound alert
  - [ ] Sound plays at 600Hz frequency
  - [ ] Works in background on mobile

- [ ] **Order Status Notification**
  - [ ] Vendor updates order status (pending → processing → shipped → delivered)
  - [ ] Client sees real-time status update
  - [ ] Sound plays at 700Hz frequency
  - [ ] Update appears immediately without page refresh

### Mobile Browser Testing

**iOS Safari:**
1. Open website on iPhone/iPad
2. Perform each action (payment, message, order update)
3. Verify sounds play (may need to use device volume up button)
4. Check that app runs smoothly with notifications

**Android Chrome:**
1. Open website on Android phone
2. Perform each action
3. Verify sounds play through speaker or headphones
4. Check notification permissions if prompted

## Configuration

### Socket.IO Setup

The Socket.IO server is initialized in `src/lib/socket.ts` with:
- Polling and WebSocket transports
- CORS enabled for development/production
- User room management for targeted notifications
- Role-based room organization (vendor/client)

### Event Emission

Events are emitted from API routes using global Socket.IO instance:
```typescript
const io = (globalThis as any).__io
io.to('vendor').emit('new-order-payment', { ... })
io.to(`user-${userId}`).emit('order-status-changed', { ... })
```

## Troubleshooting

### Sound Not Playing

1. **Check browser permissions**: Some browsers require notification permission
2. **Check device volume**: Ensure device is not on silent mode
3. **Check browser console**: Look for errors in `playNotificationSound()`
4. **Mobile-specific**: On iOS, sound may only play with user interaction

### Events Not Received

1. **Check Socket.IO connection**: Verify `socketStatus` is 'connected'
2. **Check room subscription**: User should be in appropriate room (vendor/user-{id})
3. **Check firewall**: Ensure Socket.IO port is not blocked
4. **Check logs**: Look at server logs for emission errors

### Real-Time Updates Not Showing

1. **Check database update**: Verify order/message is saved to database
2. **Check Socket.IO emitter**: Verify `emitOrderUpdated()` is called
3. **Check client listener**: Verify `socket.on()` is set up
4. **Check cleanup**: Ensure `socket.off()` is called in cleanup

## Future Enhancements

1. **Push Notifications**: Add browser push notifications for background alerts
2. **Sound Customization**: Allow users to choose notification sounds
3. **Notification History**: Store notification logs for user review
4. **Notification Preferences**: Let users disable notifications per event type
5. **Email Notifications**: Add email alerts as fallback for critical events

## Files Modified

- `src/lib/notifications.ts` - Created: Sound notification utility
- `src/lib/socket.ts` - Updated: Added order payment and status handlers
- `src/app/vendor/page.tsx` - Updated: Added payment notification listener
- `src/app/chat/page.tsx` - Updated: Added message notification listener
- `src/app/orders/page.tsx` - Updated: Added order status notification listener

## Deployment Notes

When deploying to production:
1. Ensure Socket.IO is accessible from frontend domain
2. Test notifications work with Render deployment
3. Verify Web Audio API works with production domain
4. Consider using HTTP/2 for better WebSocket support
5. Monitor server logs for Socket.IO event emissions
