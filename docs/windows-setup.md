# Windows에서 Claude Code + REA MCP 서버 설치하기

Windows PC의 Claude Code에 REA(Reverse Engineer Anything) MCP 서버를 등록해서,
어느 프로젝트에서든 REA 도구를 쓸 수 있게 만드는 과정입니다.

> 모든 명령은 **PowerShell**에서 실행합니다. 관리자 권한은 필요 없습니다.

## 사전 준비

- **Node.js (LTS)**: REA는 `npx`로 실행됩니다. 아래 명령으로 확인하세요.

  ```powershell
  npx --version
  ```

  "인식되지 않습니다" 오류가 나면 <https://nodejs.org>에서 LTS 버전을 설치한 뒤 PowerShell을 다시 엽니다.

## 1. Claude Code 설치

Claude 데스크톱 앱만 설치돼 있으면 `claude` 명령이 없습니다. 명령줄 도구를 따로 설치합니다.

```powershell
irm https://claude.ai/install.ps1 | iex
```

설치 도중 Git for Windows를 요구하면 <https://git-scm.com>에서 설치한 뒤 다시 실행합니다.

## 2. PATH 등록

설치가 끝나면 다음과 같은 안내가 나올 수 있습니다.

```
‼ Setup notes:
  ● Native installation exists but C:\Users\<사용자>\.local\bin is not in your PATH.
```

이 상태에서는 `claude`를 찾지 못합니다. 아래 두 명령으로 PATH에 추가합니다.

```powershell
# 사용자 PATH에 영구 추가 (새로 여는 창부터 적용)
[Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path", "User") + ";$env:USERPROFILE\.local\bin", "User")

# 지금 열린 창에도 바로 적용
$env:Path += ";$env:USERPROFILE\.local\bin"
```

설치됐는지 확인합니다. 버전 번호가 나오면 성공입니다.

```powershell
claude --version
```

## 3. REA MCP 서버 등록

```powershell
claude mcp add --scope user rea -- cmd /c npx -y rea-agents@6.7.0 mcp
```

- `--scope user`: 모든 프로젝트에서 REA를 쓸 수 있게 등록합니다.
- `cmd /c`: Windows에서는 `npx`를 `cmd /c`로 감싸야 MCP 서버가 정상적으로 실행됩니다.

## 4. 확인

```powershell
claude mcp list
```

목록에 `rea`가 보이면 완료입니다. Claude Code를 새로 열면 REA 도구를 쓸 수 있습니다.

## 문제 해결

| 증상 | 원인 | 해결 |
| --- | --- | --- |
| `'claude' 용어가 ... 인식되지 않습니다` (설치 전) | Claude Code CLI가 설치되지 않음 | [1단계](#1-claude-code-설치) 실행 |
| `'claude' 용어가 ... 인식되지 않습니다` (설치 후) | `%USERPROFILE%\.local\bin`이 PATH에 없음 | [2단계](#2-path-등록) 실행 후 PowerShell 재시작 |
| `'npx' 용어가 ... 인식되지 않습니다` | Node.js가 설치되지 않음 | Node.js LTS 설치 후 PowerShell 재시작 |
| `claude mcp list`에서 `rea` 연결 실패 | `cmd /c` 없이 등록됨 | `claude mcp remove rea -s user` 후 3단계 명령으로 다시 등록 |

## 참고: 이 저장소에서만 쓰는 경우

이 저장소에는 `.mcp.json`이 포함돼 있어서, 이 저장소에서 Claude Code를 열면(로컬·클라우드 세션 모두)
별도 등록 없이 REA가 연결됩니다. 로컬에서는 처음 열 때 프로젝트 MCP 서버를 승인하는 확인 창이 한 번 나옵니다.
`--scope user` 등록은 **다른 프로젝트에서도** REA를 쓰고 싶을 때 필요합니다.
