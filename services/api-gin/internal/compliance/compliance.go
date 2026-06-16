// Package compliance reads the active industry profile at startup.
// One repo serves every industry; COMPLIANCE_PROFILE flips a few controls.
package compliance

import (
	"bufio"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"unicode"
)

// Controls are the runtime effects derived from the active profile.
type Controls struct {
	Profile               string            `json:"profile"`
	AuditLogging          bool              `json:"auditLogging"`
	SessionTimeoutSeconds int               `json:"sessionTimeoutSeconds"`
	MfaRequired           bool              `json:"mfaRequired"`
	EncryptionInTransit   bool              `json:"encryptionInTransit"`
	Required              map[string]string `json:"required"`
}

// Active is the profile this process booted with.
var Active = load()

func load() Controls {
	profile := strings.ToLower(envOr("COMPLIANCE_PROFILE", "baseline"))
	valid := map[string]bool{"baseline": true, "hipaa": true, "pci": true, "fedramp": true, "fips": true, "pipeda": true}
	if !valid[profile] {
		log.Fatalf("FATAL: unknown COMPLIANCE_PROFILE: %s", profile)
	}

	c := Controls{Profile: profile, SessionTimeoutSeconds: 8 * 60 * 60, Required: map[string]string{}}
	if profile == "baseline" {
		return c
	}

	wd, _ := os.Getwd()
	f, err := os.Open(filepath.Join(wd, "compliance", profile+".yaml"))
	if err != nil {
		// A named profile with no readable file must fail loud.
		log.Fatalf("FATAL: compliance profile not loadable: %s: %v", profile, err)
	}
	defer f.Close()

	inBlock := false
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		line := sc.Text()
		if strings.HasPrefix(line, "required_controls:") {
			inBlock = true
			continue
		}
		if !inBlock {
			continue
		}
		t := strings.TrimSpace(line)
		if strings.HasPrefix(t, "- ") {
			kv := strings.SplitN(t[2:], ":", 2)
			if len(kv) != 2 {
				continue
			}
			key := strings.TrimSpace(kv[0])
			val := strings.Trim(strings.TrimSpace(strings.SplitN(kv[1], "#", 2)[0]), "\"'")
			c.Required[key] = val
			switch key {
			case "audit_logging":
				c.AuditLogging = val == "true"
			case "mfa_required":
				c.MfaRequired = val == "true"
			case "encryption_in_transit":
				c.EncryptionInTransit = val == "true"
			case "session_timeout":
				if n, e := strconv.Atoi(val); e == nil {
					c.SessionTimeoutSeconds = n
				}
			}
		} else if len(line) > 0 && !unicode.IsSpace(rune(line[0])) {
			break
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
