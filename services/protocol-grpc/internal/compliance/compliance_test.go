package compliance

import (
	"encoding/json"
	"os"
	"path/filepath"
	"reflect"
	"sort"
	"testing"
)

// profilesPath returns the absolute path to compliance/profiles.json.
//
// The package lives in internal/compliance, so the service root (which holds
// the compliance/ dir) is two levels up from this test file's directory.
func profilesPath(t *testing.T) string {
	t.Helper()
	wd, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd: %v", err)
	}
	root := filepath.Join(wd, "..", "..")
	return filepath.Join(root, "compliance", "profiles.json")
}

func loadProfilesFile(t *testing.T) profilesFile {
	t.Helper()
	raw, err := os.ReadFile(profilesPath(t))
	if err != nil {
		t.Fatalf("read profiles.json: %v", err)
	}
	var pf profilesFile
	if err := json.Unmarshal(raw, &pf); err != nil {
		t.Fatalf("parse profiles.json: %v", err)
	}
	if len(pf.Profiles) == 0 {
		t.Fatal("profiles.json has no profiles")
	}
	return pf
}

func sortedKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}

// TestProfilesUniformControlKeys asserts every profile carries the identical
// set of control keys across all 30 profiles (uniform on/off catalog).
func TestProfilesUniformControlKeys(t *testing.T) {
	pf := loadProfilesFile(t)

	if len(pf.Profiles) != 30 {
		t.Fatalf("expected 30 profiles, got %d", len(pf.Profiles))
	}

	var refName string
	var refKeys []string
	for name, spec := range pf.Profiles {
		if refKeys == nil {
			refName = name
			refKeys = sortedKeys(spec.Controls)
			continue
		}
		got := sortedKeys(spec.Controls)
		if !reflect.DeepEqual(refKeys, got) {
			t.Fatalf("profile %q control keys differ from %q\nwant: %v\ngot:  %v",
				name, refName, refKeys, got)
		}
	}
}

// TestITSG33Controls asserts the ITSG-33 profile pins the Canadian controls.
func TestITSG33Controls(t *testing.T) {
	pf := loadProfilesFile(t)

	spec, ok := pf.Profiles["itsg-33"]
	if !ok {
		t.Fatal("itsg-33 profile missing")
	}

	if got := spec.Controls["data_residency"]; got != "canada" {
		t.Fatalf("itsg-33 data_residency = %v, want \"canada\"", got)
	}
	if got := spec.Controls["fips_crypto"]; got != true {
		t.Fatalf("itsg-33 fips_crypto = %v, want true", got)
	}
}

// TestLoadSelectsProfileFromEnv asserts COMPLIANCE_PROFILE selects the profile.
func TestLoadSelectsProfileFromEnv(t *testing.T) {
	// load() reads compliance/profiles.json relative to the working dir.
	// Run from the service root so that relative path resolves.
	wd, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd: %v", err)
	}
	root := filepath.Join(wd, "..", "..")
	if err := os.Chdir(root); err != nil {
		t.Fatalf("chdir to service root: %v", err)
	}
	t.Cleanup(func() { _ = os.Chdir(wd) })

	t.Setenv("COMPLIANCE_PROFILE", "itsg-33")

	c := load()
	if c.Profile != "itsg-33" {
		t.Fatalf("loaded profile = %q, want \"itsg-33\"", c.Profile)
	}
	if c.Controls["data_residency"] != "canada" {
		t.Fatalf("loaded itsg-33 data_residency = %v, want \"canada\"",
			c.Controls["data_residency"])
	}
}
