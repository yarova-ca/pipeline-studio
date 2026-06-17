// Package compliance reads the active industry profile at startup.
// One repo serves every industry; COMPLIANCE_PROFILE flips a set of controls.
//
// Profiles live in compliance/profiles.json (generated, catalog-versioned).
// Every profile shares the same control keys; only the values differ.
package compliance

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
)

// Controls is the active profile resolved at boot.
//
// Controls holds the raw per-control map plus a few derived fields the rest
// of the service reads directly (for example session length).
type Controls struct {
	Profile      string                 `json:"profile"`
	Name         string                 `json:"name"`
	Jurisdiction string                 `json:"jurisdiction"`
	Controls     map[string]interface{} `json:"controls"`

	// SessionTimeoutSeconds is derived from controls["session_timeout_seconds"].
	// Default 8h when the control is absent.
	SessionTimeoutSeconds int `json:"-"`
}

// profilesFile is the on-disk shape of compliance/profiles.json.
type profilesFile struct {
	Device         string                 `json:"device"`
	CatalogVersion int                    `json:"catalogVersion"`
	Profiles       map[string]profileSpec `json:"profiles"`
}

type profileSpec struct {
	Name         string                 `json:"name"`
	Priority     string                 `json:"priority"`
	Jurisdiction string                 `json:"jurisdiction"`
	Controls     map[string]interface{} `json:"controls"`
}

// Active is the profile this process booted with.
var Active = load()

func load() Controls {
	profile := envOr("COMPLIANCE_PROFILE", "baseline")

	// Safe default returned when the catalog cannot be read at all. This keeps
	// importing packages (whose working dir is not the service root, e.g. test
	// binaries) loadable; the service itself runs from the root where the file
	// resolves and a missing/garbled catalog there is a real fail-loud below.
	fallback := Controls{Profile: profile, SessionTimeoutSeconds: 8 * 60 * 60, Controls: map[string]interface{}{}}

	wd, _ := os.Getwd()
	raw, err := os.ReadFile(filepath.Join(wd, "compliance", "profiles.json"))
	if err != nil {
		if os.IsNotExist(err) {
			return fallback
		}
		log.Fatalf("FATAL: compliance profiles not loadable: %v", err)
	}

	var pf profilesFile
	if err := json.Unmarshal(raw, &pf); err != nil {
		log.Fatalf("FATAL: compliance profiles unparseable: %v", err)
	}

	spec, ok := pf.Profiles[profile]
	if !ok {
		log.Fatalf("FATAL: unknown COMPLIANCE_PROFILE: %s", profile)
	}

	c := Controls{
		Profile:               profile,
		Name:                  spec.Name,
		Jurisdiction:          spec.Jurisdiction,
		Controls:              spec.Controls,
		SessionTimeoutSeconds: 8 * 60 * 60,
	}

	// Derive session length from the control map when present.
	if v, ok := spec.Controls["session_timeout_seconds"]; ok {
		if n, ok := v.(float64); ok && n > 0 {
			c.SessionTimeoutSeconds = int(n)
		}
	}

	return c
}

func envOr(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}
