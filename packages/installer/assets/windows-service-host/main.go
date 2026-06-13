package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"syscall"
	"time"
	"unsafe"
)

const (
	serviceWin32OwnProcess = 0x00000010
	serviceStopped         = 0x00000001
	serviceStartPending    = 0x00000002
	serviceStopPending     = 0x00000003
	serviceRunning         = 0x00000004
	serviceAcceptStop      = 0x00000001
	serviceAcceptShutdown  = 0x00000004
	serviceControlStop     = 0x00000001
	serviceControlShutdown = 0x00000005
)

var (
	advapi32                       = syscall.NewLazyDLL("advapi32.dll")
	procStartServiceCtrlDispatcher = advapi32.NewProc("StartServiceCtrlDispatcherW")
	procRegisterServiceCtrlHandler = advapi32.NewProc("RegisterServiceCtrlHandlerExW")
	procSetServiceStatus           = advapi32.NewProc("SetServiceStatus")

	serviceName  string
	serviceLog   string
	serviceHome  string
	serviceNode  string
	serviceCli   string
	serviceWork  string
	interval     time.Duration
	stopOnce     sync.Once
	stopCh       = make(chan struct{})
	statusHandle uintptr
	logMu        sync.Mutex
	currentCmdMu sync.Mutex
	currentCmd   *exec.Cmd
)

type serviceTableEntry struct {
	serviceName *uint16
	serviceProc uintptr
}

type serviceStatus struct {
	serviceType             uint32
	currentState            uint32
	controlsAccepted        uint32
	win32ExitCode           uint32
	serviceSpecificExitCode uint32
	checkPoint              uint32
	waitHint                uint32
}

type runtimeConfig struct {
	CodexPlusPlus struct {
		Enabled *bool `json:"enabled"`
	} `json:"codexPlusPlus"`
}

func main() {
	flag.StringVar(&serviceName, "service-name", "codex-plusplus-watcher", "Windows service name")
	flag.StringVar(&serviceLog, "log", "", "log file path")
	flag.StringVar(&serviceHome, "home", "", "codex-plusplus user data directory")
	flag.StringVar(&serviceNode, "node", "node.exe", "node executable")
	flag.StringVar(&serviceCli, "cli", "", "codex-plusplus CLI path")
	flag.StringVar(&serviceWork, "workdir", "", "working directory")
	intervalSeconds := flag.Int("interval-seconds", 300, "watch interval in seconds")
	console := flag.Bool("console", false, "run in console mode")
	flag.Parse()
	interval = time.Duration(*intervalSeconds) * time.Second

	if *console {
		runWorker()
		return
	}
	if err := runService(); err != nil {
		writeLog("service dispatcher unavailable; exiting because this process was not started by the service manager: " + err.Error())
		return
	}
}

func runService() error {
	namePtr, err := syscall.UTF16PtrFromString(serviceName)
	if err != nil {
		return err
	}
	table := []serviceTableEntry{
		{serviceName: namePtr, serviceProc: syscall.NewCallback(serviceMain)},
		{},
	}
	r1, _, e1 := procStartServiceCtrlDispatcher.Call(uintptr(unsafe.Pointer(&table[0])))
	if r1 == 0 {
		if e1 != syscall.Errno(0) {
			return e1
		}
		return syscall.EINVAL
	}
	return nil
}

func serviceMain(argc uint32, argv uintptr) uintptr {
	namePtr, _ := syscall.UTF16PtrFromString(serviceName)
	r1, _, _ := procRegisterServiceCtrlHandler.Call(
		uintptr(unsafe.Pointer(namePtr)),
		syscall.NewCallback(serviceControlHandler),
		0,
	)
	statusHandle = r1
	setStatus(serviceStartPending, 0)
	setStatus(serviceRunning, serviceAcceptStop|serviceAcceptShutdown)
	runWorker()
	setStatus(serviceStopped, 0)
	return 0
}

func serviceControlHandler(control uint32, eventType uint32, eventData uintptr, context uintptr) uintptr {
	if control == serviceControlStop || control == serviceControlShutdown {
		setStatus(serviceStopPending, 0)
		requestStop()
	}
	return 0
}

func setStatus(state uint32, accepted uint32) {
	if statusHandle == 0 {
		return
	}
	checkPoint := uint32(0)
	waitHint := uint32(0)
	if state == serviceStartPending || state == serviceStopPending {
		checkPoint = 1
		waitHint = 2000
	}
	status := serviceStatus{
		serviceType:      serviceWin32OwnProcess,
		currentState:     state,
		controlsAccepted: accepted,
		checkPoint:       checkPoint,
		waitHint:         waitHint,
	}
	procSetServiceStatus.Call(statusHandle, uintptr(unsafe.Pointer(&status)))
}

func runWorker() {
	writeLog("codex-plusplus watcher service started")
	timer := time.NewTimer(3 * time.Second)
	defer timer.Stop()
	for {
		select {
		case <-stopCh:
			writeLog("codex-plusplus watcher service stopped")
			return
		case <-timer.C:
			runCycle()
			timer.Reset(interval)
		}
	}
}

func requestStop() {
	stopOnce.Do(func() {
		close(stopCh)
		currentCmdMu.Lock()
		if currentCmd != nil && currentCmd.Process != nil {
			_ = currentCmd.Process.Kill()
		}
		currentCmdMu.Unlock()
	})
}

func runCycle() {
	if !pluginEnabled() {
		writeLog("plugin switch is off; update and repair are skipped")
		return
	}
	runCli("update", "--watcher", "--quiet", "--no-repair")
	runCli("repair", "--watcher", "--quiet")
}

func pluginEnabled() bool {
	if serviceHome == "" {
		return true
	}
	path := filepath.Join(serviceHome, "config.json")
	data, err := os.ReadFile(path)
	if err != nil {
		return true
	}
	var cfg runtimeConfig
	if json.Unmarshal(data, &cfg) != nil {
		return true
	}
	if cfg.CodexPlusPlus.Enabled == nil {
		return true
	}
	return *cfg.CodexPlusPlus.Enabled
}

func runCli(args ...string) {
	if serviceCli == "" {
		writeLog("missing cli path")
		return
	}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go func() {
		<-stopCh
		cancel()
	}()

	commandArgs := append([]string{serviceCli}, args...)
	cmd := exec.CommandContext(ctx, serviceNode, commandArgs...)
	cmd.Dir = serviceWork
	cmd.Env = append(os.Environ(), "CODEX_PLUSPLUS_WATCHER=1")
	if serviceHome != "" {
		cmd.Env = append(cmd.Env, "CODEX_PLUSPLUS_HOME="+serviceHome)
		desktopCodexHome := filepath.Join(serviceHome, "desktop-codex-home")
		cmd.Env = append(cmd.Env, "CODEX_HOME="+desktopCodexHome)
		cmd.Env = append(cmd.Env, "CODEXPP_DESKTOP_CODEX_HOME="+desktopCodexHome)
	}
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	output, err := runCommand(cmd)
	if output != "" {
		writeLog(strings.TrimSpace(output))
	}
	if err != nil {
		writeLog(fmt.Sprintf("%s failed: %v", strings.Join(append([]string{"node"}, commandArgs...), " "), err))
	}
}

func runCommand(cmd *exec.Cmd) (string, error) {
	currentCmdMu.Lock()
	currentCmd = cmd
	currentCmdMu.Unlock()
	defer func() {
		currentCmdMu.Lock()
		if currentCmd == cmd {
			currentCmd = nil
		}
		currentCmdMu.Unlock()
	}()
	output, err := cmd.CombinedOutput()
	return tail(string(output), 8000), err
}

func tail(text string, max int) string {
	if len(text) <= max {
		return text
	}
	return text[len(text)-max:]
}

func writeLog(message string) {
	line := fmt.Sprintf("[%s] %s\n", time.Now().UTC().Format(time.RFC3339Nano), message)
	if serviceLog == "" {
		_, _ = os.Stdout.WriteString(line)
		return
	}
	logMu.Lock()
	defer logMu.Unlock()
	_ = os.MkdirAll(filepath.Dir(serviceLog), 0o755)
	file, err := os.OpenFile(serviceLog, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		return
	}
	defer file.Close()
	_, _ = file.WriteString(line)
}
