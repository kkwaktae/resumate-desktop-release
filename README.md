# Resumate

이력서를 함께 다듬는 macOS 데스크톱 앱입니다. 이 저장소는 **배포 파일(DMG)만** 올라옵니다.

## 다운로드

[Releases](../../releases)에서 가장 최근 버전의 `.dmg`를 받으세요.

## 요구 사항

- **Apple Silicon Mac (M1 이상)** — Intel Mac은 지원하지 않습니다.
- macOS 13 (Ventura) 이상

## 설치

1. 받은 DMG를 열고 **Resumate**를 응용 프로그램 폴더로 옮깁니다.
2. 처음 실행할 때는 응용 프로그램 폴더에서 **아이콘을 우클릭 → 열기**를 누르고,
   "확인되지 않은 개발자" 경고에서 다시 **열기**를 선택합니다.
   (아직 Apple 공증 전이라 더블클릭만으로는 열리지 않습니다.)
3. "손상되었기 때문에 열 수 없습니다"가 나오면 터미널에서 한 번만 실행합니다.

   ```
   xattr -dr com.apple.quarantine /Applications/Resumate.app
   ```

## 사용 전 준비

앱은 사용자의 로컬 CLI 계정으로 동작합니다. Claude Code CLI 또는 Codex CLI가 설치되어
있어야 하고, 앱 안에서 로그인할 수 있습니다.
