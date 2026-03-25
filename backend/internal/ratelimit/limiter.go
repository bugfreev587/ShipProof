package ratelimit

import (
	"sync"
	"sync/atomic"
	"time"
)

type entry struct {
	count     atomic.Int64
	expiresAt time.Time
}

type Limiter struct {
	mu      sync.RWMutex
	entries map[string]*entry
}

func New() *Limiter {
	l := &Limiter{entries: make(map[string]*entry)}
	go l.cleanup()
	return l
}

// Allow checks if the key is under the limit for the given window.
// Returns true if allowed (and increments), false if at/over limit.
func (l *Limiter) Allow(key string, limit int, window time.Duration) bool {
	l.mu.RLock()
	e, ok := l.entries[key]
	l.mu.RUnlock()

	now := time.Now()

	if ok && now.Before(e.expiresAt) {
		if e.count.Load() >= int64(limit) {
			return false
		}
		e.count.Add(1)
		return true
	}

	// Create new entry
	l.mu.Lock()
	// Double-check after write lock
	e, ok = l.entries[key]
	if ok && now.Before(e.expiresAt) {
		l.mu.Unlock()
		if e.count.Load() >= int64(limit) {
			return false
		}
		e.count.Add(1)
		return true
	}
	e = &entry{expiresAt: now.Add(window)}
	e.count.Store(1)
	l.entries[key] = e
	l.mu.Unlock()
	return true
}

func (l *Limiter) cleanup() {
	ticker := time.NewTicker(10 * time.Minute)
	for range ticker.C {
		now := time.Now()
		l.mu.Lock()
		for k, e := range l.entries {
			if now.After(e.expiresAt) {
				delete(l.entries, k)
			}
		}
		l.mu.Unlock()
	}
}
