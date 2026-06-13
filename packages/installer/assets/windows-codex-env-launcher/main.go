package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"syscall"
)

const (
	originalExeName       = "codexpp-codex-original.exe"
	probeArg              = "--codexpp-env-launcher-probe"
	windowsCreateNoWindow = 0x08000000
)

func main() {
	if len(os.Args) > 1 && os.Args[1] == probeArg {
		fmt.Println("codexpp-env-launcher")
		os.Exit(0)
	}

	exePath, err := os.Executable()
	if err != nil {
		exitWithError(err)
	}
	originalPath := filepath.Join(filepath.Dir(exePath), originalExeName)
	if _, err := os.Stat(originalPath); err != nil {
		exitWithError(fmt.Errorf("missing original Codex CLI at %s: %w", originalPath, err))
	}

	cmd := hiddenCommand(originalPath, os.Args[1:]...)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Env = desktopCodexEnv(os.Environ())

	if err := cmd.Run(); err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			os.Exit(exitErr.ExitCode())
		}
		exitWithError(err)
	}
}

func desktopCodexEnv(base []string) []string {
	appData := os.Getenv("APPDATA")
	if appData == "" {
		return base
	}
	home := filepath.Join(appData, "codex-plusplus", "desktop-codex-home")
	syncDesktopAuthFromGlobal(home)
	next := withoutEnvKeys(base, "CODEX_HOME", "CODEXPP_DESKTOP_CODEX_HOME")
	next = append(next, "CODEX_HOME="+home)
	next = append(next, "CODEXPP_DESKTOP_CODEX_HOME="+home)
	if proxy := windowsSystemProxy(); proxy != "" {
		next = appendProxyEnv(next, proxy)
	}
	return next
}

func syncDesktopAuthFromGlobal(desktopHome string) {
	userHome, err := os.UserHomeDir()
	if err != nil || userHome == "" {
		return
	}
	globalAuth := filepath.Join(userHome, ".codex", "auth.json")
	desktopAuth := filepath.Join(desktopHome, "auth.json")
	globalStat, err := os.Stat(globalAuth)
	if err != nil {
		return
	}
	if desktopStat, err := os.Stat(desktopAuth); err == nil && !globalStat.ModTime().After(desktopStat.ModTime()) {
		return
	}
	data, err := os.ReadFile(globalAuth)
	if err != nil {
		return
	}
	if err := os.MkdirAll(desktopHome, 0700); err != nil {
		return
	}
	_ = os.WriteFile(desktopAuth, data, 0600)
}

func windowsSystemProxy() string {
	const key = `HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings`
	enabledOutput, err := hiddenCommand("reg.exe", "query", key, "/v", "ProxyEnable").Output()
	if err != nil || !regexp.MustCompile(`(?i)\b0x1\b`).Match(enabledOutput) {
		return ""
	}
	serverOutput, err := hiddenCommand("reg.exe", "query", key, "/v", "ProxyServer").Output()
	if err != nil {
		return ""
	}
	return normalizeWindowsProxyServer(regValue(string(serverOutput), "ProxyServer"))
}

func hiddenCommand(name string, args ...string) *exec.Cmd {
	cmd := exec.Command(name, args...)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: windowsCreateNoWindow,
	}
	return cmd
}

func regValue(output string, name string) string {
	re := regexp.MustCompile(`(?im)^\s*` + regexp.QuoteMeta(name) + `\s+REG_\w+\s+(.+?)\s*$`)
	match := re.FindStringSubmatch(output)
	if len(match) < 2 {
		return ""
	}
	return strings.TrimSpace(match[1])
}

func normalizeWindowsProxyServer(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}
	if strings.Contains(value, "=") {
		entries := map[string]string{}
		for _, part := range strings.Split(value, ";") {
			key, val, ok := strings.Cut(part, "=")
			if !ok {
				continue
			}
			key = strings.ToLower(strings.TrimSpace(key))
			val = strings.TrimSpace(val)
			if key != "" && val != "" {
				entries[key] = val
			}
		}
		for _, key := range []string{"https", "http", "socks"} {
			if proxy := normalizeProxyURL(entries[key]); proxy != "" {
				return proxy
			}
		}
		return ""
	}
	return normalizeProxyURL(value)
}

func normalizeProxyURL(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}
	if regexp.MustCompile(`(?i)^[a-z][a-z0-9+.-]*://`).MatchString(value) {
		return value
	}
	return "http://" + value
}

func appendProxyEnv(base []string, proxy string) []string {
	next := base
	for _, key := range []string{"HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"} {
		next = appendEnvIfMissing(next, key, proxy)
	}
	for _, key := range []string{"NO_PROXY", "no_proxy"} {
		next = appendNoProxy(next, key, "127.0.0.1,localhost,::1")
	}
	return next
}

func appendEnvIfMissing(base []string, key string, value string) []string {
	if hasEnvKey(base, key) {
		return base
	}
	return append(base, key+"="+value)
}

func appendNoProxy(base []string, key string, value string) []string {
	for i, item := range base {
		name, current, ok := strings.Cut(item, "=")
		if !ok || !strings.EqualFold(name, key) {
			continue
		}
		parts := splitNoProxy(current)
		for _, candidate := range splitNoProxy(value) {
			if !containsFold(parts, candidate) {
				parts = append(parts, candidate)
			}
		}
		base[i] = name + "=" + strings.Join(parts, ",")
		return base
	}
	return append(base, key+"="+value)
}

func splitNoProxy(value string) []string {
	out := []string{}
	for _, part := range strings.Split(value, ",") {
		part = strings.TrimSpace(part)
		if part != "" {
			out = append(out, part)
		}
	}
	return out
}

func containsFold(items []string, value string) bool {
	for _, item := range items {
		if strings.EqualFold(item, value) {
			return true
		}
	}
	return false
}

func hasEnvKey(base []string, key string) bool {
	for _, item := range base {
		name, _, ok := strings.Cut(item, "=")
		if ok && strings.EqualFold(name, key) {
			return true
		}
	}
	return false
}

func withoutEnvKeys(base []string, keys ...string) []string {
	blocked := map[string]bool{}
	for _, key := range keys {
		blocked[strings.ToUpper(key)] = true
	}
	next := make([]string, 0, len(base))
	for _, item := range base {
		name, _, ok := strings.Cut(item, "=")
		if !ok || !blocked[strings.ToUpper(name)] {
			next = append(next, item)
		}
	}
	return next
}

func exitWithError(err error) {
	fmt.Fprintln(os.Stderr, "codexpp env launcher:", err)
	os.Exit(1)
}
