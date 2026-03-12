package handler

import (
	"encoding/json"
	"net/http"
	"time"
)

var startTime = time.Now()

func Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"version": "0.1.0",
		"uptime":  time.Since(startTime).String(),
	})
}
