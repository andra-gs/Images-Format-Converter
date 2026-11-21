# Xanitizer Security Analysis

This repository uses the third-party `RIGS-IT/xanitizer-action` GitHub Action to run a static application security test (SAST) against the JavaScript project.

## Workflow

Workflow file: `.github/workflows/xanitizer.yml`

The workflow runs on:
- Pushes to `main`.
- Pull requests targeting `main`.
- A weekly schedule (Monday at 02:00 UTC).
- Manual execution through Actions > Xanitizer Security Analysis > Run workflow.

The workflow checks out the repository, checks whether the license secret exists, installs the locked npm dependencies with `npm ci`, and then runs Xanitizer. The dependency installation is required so Xanitizer can resolve the project's JavaScript libraries.

## 1. Obtain a Xanitizer license

Xanitizer requires a license file. The Xanitizer Marketplace documentation states that licenses are available free of charge for open-source projects and educational usage. You still need to contact RIGS-IT / Xanitizer and obtain the license file for this project.

Marketplace documentation:
https://github.com/marketplace/actions/xanitizer-security-analysis

Do not commit the license file to this repository.

## 2. Add the license as a GitHub Secret

1. Open the repository: https://github.com/andra-gs/Images-Format-Converter
2. Open Settings.
3. In the left sidebar, select Secrets and variables > Actions.
4. Select New repository secret.
5. Set the name to exactly `XANITIZER_LICENSE`.
6. Paste the complete content of the Xanitizer license file into Secret.
7. Select Add secret.

The workflow reads it using `${{ secrets.XANITIZER_LICENSE }}`. The secret is never written into the repository.

If this secret is missing, the workflow intentionally skips the Xanitizer steps and reports a notice. This prevents forks and initial setup runs from failing just because repository secrets are unavailable.

## 3. Run the workflow manually

1. Open the repository's Actions tab.
2. Select Xanitizer Security Analysis.
3. Select Run workflow.
4. Choose the `main` branch.
5. Select Run workflow again.
6. Open the run and inspect the Xanitizer Security Analysis step.

## 4. Read the results

The workflow produces two reports:
- `Xanitizer-Findings-List.pdf`: human-readable findings report.
- `Xanitizer-Findings-List.sarif`: machine-readable report.

The SARIF report is uploaded to Security > Code scanning when GitHub accepts the upload. Both files are also archived as the `xanitizer-security-reports` workflow artifact for 14 days.

The existing CodeQL workflow remains unchanged. Xanitizer uploads findings under its own category, `xanitizer`.

## 5. Current failure policy

The initial configuration does not fail the workflow solely because Xanitizer finds vulnerabilities. This allows the first scan to establish a baseline and lets the team review false positives and real findings.

After reviewing the baseline, the team can choose a severity threshold and enable `haltOnFindings` with `findingsRatingThreshold`. Note that the Xanitizer Marketplace documentation warns that stopping the action on findings prevents the SARIF report from being generated, so do not enable that gate if uploading SARIF is still required.

## Compatibility note

The Marketplace currently lists Xanitizer Security Analysis v1.0.1 and documents usage through `RIGS-IT/xanitizer-action@v1`. The action metadata currently declares the legacy Node.js 12 runtime. GitHub removed Node.js 12 from the Actions runner in August 2023 and now runs JavaScript actions on a newer runner runtime. The action may therefore produce a compatibility warning or fail if its bundled code is not compatible with the runner runtime.

The workflow is configured against the published Marketplace action, but its first real execution must be checked after the license secret is added. If the Xanitizer step fails because of its legacy runtime, RIGS-IT needs to publish an updated action or the project must use a maintained compatible fork. Do not add an insecure runtime override.

## Important boundaries

- Xanitizer is a third-party security analysis tool. Its license and terms are separate from GitHub Actions.
- `npm ci` installs dependencies so the scanner can resolve the JavaScript project. It does not build or deploy the web application.
- This workflow does not replace the existing tests, production build, or CodeQL analysis.
- Findings must be reviewed and triaged before treating them as confirmed vulnerabilities.
